"""Reverb built from a synthesised impulse response.

We generate a room's "echo fingerprint" mathematically (decorrelated noise for left and right, with
higher frequencies dying away faster than lows, a pre-delay and a handful of early reflections) and
convolve with it. No recorded rooms or third-party impulse responses are used."""
from __future__ import annotations

from functools import lru_cache

import numpy as np
from scipy import signal

from .dsp import highpass, lowpass, nsamp
from .paths import SR


@lru_cache(maxsize=16)
def make_ir(rt60: float = 2.5, rt60_hf: float | None = None, predelay: float = 0.02,
            early: int = 8, early_span: float = 0.06, lo_cut: float = 150.0, hi_cut: float = 9000.0,
            seed: int = 7, sr: int = SR) -> np.ndarray:
    """Stereo impulse response (n, 2), energy-normalised.

    rt60      — time for the tail to fall by 60 dB at low/mid frequencies (seconds)
    rt60_hf   — the same at the top end (defaults to 45% of rt60: air absorbs highs first)
    """
    rt60_hf = rt60 * 0.45 if rt60_hf is None else rt60_hf
    rng = np.random.default_rng(seed)
    length = nsamp(rt60 * 1.15 + predelay + 0.05, sr)
    noise = rng.standard_normal((length, 2))

    # Frequency-dependent decay, done in the STFT domain: each bin decays with its own RT60.
    nper = 1024
    chans = []
    for ch in range(2):
        f, t, Z = signal.stft(noise[:, ch], fs=sr, nperseg=nper)
        fr = np.clip((np.log2(np.maximum(f, 50) / 300.0)) / np.log2(12000 / 300.0), 0, 1)
        rt = rt60 * (1 - fr) + rt60_hf * fr  # per-frequency RT60
        Z = Z * np.exp(-6.9078 * t[None, :] / rt[:, None])  # amplitude: -60 dB at rt
        _, y = signal.istft(Z, fs=sr, nperseg=nper)
        chans.append(np.pad(y, (0, max(0, length - len(y))))[:length])
    tail = np.stack(chans, axis=1)
    # Diffuse build-up (a reverb tail doesn't start at full density)
    nb = nsamp(0.025, sr)
    build = np.ones(len(tail))
    build[:nb] = np.linspace(0, 1, nb) ** 1.5
    tail = tail * build[:, None]
    tail = highpass(tail, lo_cut, 2, sr)
    tail = lowpass(tail, hi_cut, 2, sr)

    ir = np.zeros((length + nsamp(predelay, sr) + 1, 2))
    pd = nsamp(predelay, sr)
    ir[pd:pd + len(tail)] += tail * 0.7
    # Early reflections: sparse taps, slightly different per ear, decaying.
    for ch in range(2):
        times = np.sort(rng.uniform(0.004, early_span, early)) + predelay * 0.5
        for k, tt in enumerate(times):
            i = nsamp(tt, sr)
            if i < len(ir):
                ir[i, ch] += rng.choice([-1, 1]) * 0.9 * np.exp(-tt / (early_span * 0.8)) * (1 - k / (early * 1.6))
    ir /= np.sqrt(np.sum(ir ** 2) / 2)
    return ir


def reverb(x: np.ndarray, wet: float = 0.25, dry: float = 1.0, ir: np.ndarray | None = None,
           tail: bool = True, **ir_kwargs) -> np.ndarray:
    """Mono-in/stereo-out convolution reverb. `x` mono or stereo; returns stereo.
    If `tail`, output is extended so the reverb can ring out."""
    ir = make_ir(**ir_kwargs) if ir is None else ir
    xs = x if x.ndim == 2 else np.stack([x, x], 1)
    mono = xs.mean(axis=1)
    n_out = len(xs) + (len(ir) if tail else 0)
    out = np.zeros((n_out, 2))
    out[:len(xs)] += xs * dry
    for ch in range(2):
        w = signal.oaconvolve(mono, ir[:, ch])[:n_out]
        out[:len(w), ch] += w * wet
    return out


def reverb_circular(x: np.ndarray, wet: float, **ir_kwargs) -> np.ndarray:
    """Reverb whose tail wraps around to the start: for seamless loops."""
    ir = make_ir(**ir_kwargs)
    n = len(x)
    xs = x if x.ndim == 2 else np.stack([x, x], 1)
    mono = xs.mean(axis=1)
    out = xs.copy()
    for ch in range(2):
        h = np.zeros(n)
        k = min(n, len(ir))
        h[:k] = ir[:k, ch]
        out[:, ch] += wet * np.real(np.fft.irfft(np.fft.rfft(mono) * np.fft.rfft(h), n))
    return out
