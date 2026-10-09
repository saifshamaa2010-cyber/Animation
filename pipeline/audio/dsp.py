"""Small, dependable DSP building blocks (numpy/scipy only). All signals are float64 numpy arrays;
stereo signals have shape (n, 2). Sample rate is 48 kHz unless a function says otherwise."""
from __future__ import annotations

import numpy as np
from scipy import signal

from .paths import SR

TAU = 2 * np.pi


# --- units --------------------------------------------------------------------------------------

def db(x: float | np.ndarray) -> float | np.ndarray:
    return 20 * np.log10(np.maximum(np.abs(x), 1e-12))


def undb(d: float | np.ndarray) -> float | np.ndarray:
    return 10 ** (np.asarray(d) / 20)


def midi_hz(m: float | np.ndarray) -> float | np.ndarray:
    return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


def secs(n: int, sr: int = SR) -> float:
    return n / sr


def nsamp(t: float, sr: int = SR) -> int:
    return int(round(t * sr))


def time_axis(dur: float, sr: int = SR) -> np.ndarray:
    return np.arange(nsamp(dur, sr)) / sr


# --- shapes -------------------------------------------------------------------------------------

def stereo(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 2 else np.stack([x, x], axis=1)


def pan(x: np.ndarray, p: float | np.ndarray) -> np.ndarray:
    """Equal-power pan of a mono signal. p in [-1 (left), +1 (right)]; may be an array (moving pan)."""
    a = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1) * np.sqrt(2)


def width(st: np.ndarray, w: float) -> np.ndarray:
    """Mid/side width: 0 = mono, 1 = unchanged, >1 = wider."""
    m = (st[:, 0] + st[:, 1]) / 2
    s = (st[:, 0] - st[:, 1]) / 2 * w
    return np.stack([m + s, m - s], axis=1)


def place(dst: np.ndarray, src: np.ndarray, start: int, gain: float = 1.0) -> None:
    """Add src into dst starting at sample `start` (clips at both ends safely)."""
    if start >= len(dst) or start + len(src) <= 0:
        return
    s0 = max(0, -start)
    d0 = max(0, start)
    n = min(len(src) - s0, len(dst) - d0)
    dst[d0:d0 + n] += src[s0:s0 + n] * gain


def pad_to(x: np.ndarray, n: int) -> np.ndarray:
    if len(x) >= n:
        return x[:n]
    shape = (n - len(x),) + x.shape[1:]
    return np.concatenate([x, np.zeros(shape)], axis=0)


# --- envelopes ----------------------------------------------------------------------------------

def fade(x: np.ndarray, fin: float = 0.002, fout: float = 0.005, sr: int = SR) -> np.ndarray:
    """Raised-cosine fades so nothing starts or stops with a click."""
    x = x.copy()
    n_in, n_out = min(nsamp(fin, sr), len(x)), min(nsamp(fout, sr), len(x))
    if n_in > 1:
        r = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n_in))
        x[:n_in] *= r if x.ndim == 1 else r[:, None]
    if n_out > 1:
        r = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n_out))
        x[-n_out:] *= r if x.ndim == 1 else r[:, None]
    return x


def env_ad(n: int, attack: float, decay: float, sr: int = SR, curve: float = 1.0) -> np.ndarray:
    """Attack (raised-cosine) then exponential decay with time constant `decay` seconds."""
    t = np.arange(n) / sr
    na = max(1, nsamp(attack, sr))
    e = np.exp(-np.maximum(t - attack, 0) / max(decay, 1e-4))
    ramp = 0.5 - 0.5 * np.cos(np.pi * np.minimum(np.arange(n) / na, 1.0))
    return (ramp ** curve) * e


def env_adsr(n: int, a: float, d: float, s: float, r: float, hold: float, sr: int = SR) -> np.ndarray:
    """Smooth ADSR: raised-cosine attack, exponential decay towards sustain `s` (time constant `d`),
    release (raised-cosine, `r` s) starting `hold` s after the attack ends."""
    e = np.empty(n)
    na = max(1, nsamp(a, sr))
    rel0 = int(np.clip(nsamp(a + hold, sr), 0, n))
    k = min(na, rel0)
    e[:k] = 0.5 - 0.5 * np.cos(np.pi * np.arange(k) / na)
    if rel0 > na:
        t = np.arange(rel0 - na) / sr
        e[na:rel0] = s + (1 - s) * np.exp(-t / max(d, 1e-4))
    level = e[rel0 - 1] if rel0 > 0 else 0.0
    nr = n - rel0
    if nr > 0:
        e[rel0:] = level * (0.5 + 0.5 * np.cos(np.pi * np.clip(np.arange(nr) / max(nsamp(r, sr), 1), 0, 1)))
    return e


def smoothstep(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


# --- noise --------------------------------------------------------------------------------------

def white(n: int, rng: np.random.Generator) -> np.ndarray:
    return rng.standard_normal(n)


def coloured(n: int, rng: np.random.Generator, slope_db_oct: float = -3.0) -> np.ndarray:
    """Noise with a spectral slope (−3 dB/oct = pink, −6 = brown). FFT-shaped, so it is periodic
    with period n (useful for seamless loops)."""
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1]
    spec *= (f / 1000.0) ** (slope_db_oct / 6.0206)
    spec[0] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.std(x) + 1e-12)


def pink(n: int, rng: np.random.Generator) -> np.ndarray:
    return coloured(n, rng, -3.0)


# --- static filters -----------------------------------------------------------------------------

def _sos(kind: str, f, order: int, sr: int):
    nyq = sr / 2
    if isinstance(f, (tuple, list)):
        f = [min(max(v, 5.0), nyq * 0.98) for v in f]
    else:
        f = min(max(f, 5.0), nyq * 0.98)
    return signal.butter(order, f, btype=kind, fs=sr, output="sos")


def lowpass(x: np.ndarray, f: float, order: int = 2, sr: int = SR) -> np.ndarray:
    return signal.sosfilt(_sos("lowpass", f, order, sr), x, axis=0)


def highpass(x: np.ndarray, f: float, order: int = 2, sr: int = SR) -> np.ndarray:
    return signal.sosfilt(_sos("highpass", f, order, sr), x, axis=0)


def bandpass(x: np.ndarray, lo: float, hi: float, order: int = 2, sr: int = SR) -> np.ndarray:
    return signal.sosfilt(_sos("bandpass", (lo, hi), order, sr), x, axis=0)


def biquad_coeffs(kind: str, f: np.ndarray, q: np.ndarray | float, sr: int = SR, gain_db: float = 0.0):
    """RBJ-cookbook biquads, vectorised over arrays of cutoff `f`. Returns (b, a) of shape (k, 3)."""
    f = np.atleast_1d(np.clip(f, 10.0, sr * 0.45)).astype(float)
    q = np.broadcast_to(np.asarray(q, dtype=float), f.shape)
    w0 = TAU * f / sr
    cw, sw = np.cos(w0), np.sin(w0)
    alpha = sw / (2 * q)
    if kind == "lowpass":
        b = np.stack([(1 - cw) / 2, 1 - cw, (1 - cw) / 2], 1)
    elif kind == "highpass":
        b = np.stack([(1 + cw) / 2, -(1 + cw), (1 + cw) / 2], 1)
    elif kind == "bandpass":  # constant 0 dB peak gain
        b = np.stack([alpha, np.zeros_like(alpha), -alpha], 1)
    elif kind == "peak":
        A = 10 ** (gain_db / 40)
        b = np.stack([1 + alpha * A, -2 * cw, 1 - alpha * A], 1)
        a = np.stack([1 + alpha / A, -2 * cw, 1 - alpha / A], 1)
        return b / a[:, :1], a / a[:, :1]
    else:
        raise ValueError(kind)
    a = np.stack([1 + alpha, -2 * cw, 1 - alpha], 1)
    return b / a[:, :1], a / a[:, :1]


def resonator(x: np.ndarray, f: float, q: float, sr: int = SR) -> np.ndarray:
    b, a = biquad_coeffs("bandpass", np.array([f]), q, sr)
    return signal.lfilter(b[0], a[0], x, axis=0)


def peak_eq(x: np.ndarray, f: float, q: float, gain_db: float, sr: int = SR) -> np.ndarray:
    b, a = biquad_coeffs("peak", np.array([f]), q, sr, gain_db)
    return signal.lfilter(b[0], a[0], x, axis=0)


# --- time-varying filters -----------------------------------------------------------------------

def sweep_filter(x: np.ndarray, cutoff: np.ndarray, kind: str = "lowpass", q: float = 0.707,
                 stages: int = 1, block: int = 128, sr: int = SR) -> np.ndarray:
    """Biquad whose cutoff follows the per-sample array `cutoff` (Hz). Coefficients are updated every
    `block` samples with the filter state carried over, which is smooth for slow, musical sweeps.
    Works on mono (n,) or stereo (n, 2)."""
    n = len(x)
    nb = (n + block - 1) // block
    idx = np.minimum(np.arange(nb) * block + block // 2, n - 1)
    fc = np.asarray(cutoff, dtype=float)
    fc = fc[idx] if fc.ndim and len(fc) == n else np.full(nb, float(fc))
    b, a = biquad_coeffs(kind, fc, q, sr)
    y = np.array(x, dtype=float, copy=True)
    for _ in range(stages):
        zi_shape = (2,) + y.shape[1:]
        zi = np.zeros(zi_shape)
        out = np.empty_like(y)
        for k in range(nb):
            s = slice(k * block, min((k + 1) * block, n))
            out[s], zi = signal.lfilter(b[k], a[k], y[s], axis=0, zi=zi)
        y = out
    return y


# --- oscillators --------------------------------------------------------------------------------

def phase_from_freq(freq: np.ndarray | float, n: int, sr: int = SR, phase0: float = 0.0) -> np.ndarray:
    """Cumulative phase in cycles (not wrapped) for a frequency that may vary per sample."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return phase0 + np.cumsum(f) / sr - f[0] / sr


def _polyblep(t: np.ndarray, dt: np.ndarray) -> np.ndarray:
    out = np.zeros_like(t)
    m1 = t < dt
    x = t[m1] / dt[m1]
    out[m1] = x + x - x * x - 1
    m2 = t > 1 - dt
    x = (t[m2] - 1) / dt[m2]
    out[m2] = x * x + x + x + 1
    return out


def saw(freq: np.ndarray | float, n: int, sr: int = SR, phase0: float = 0.0) -> np.ndarray:
    """Band-limited (PolyBLEP) sawtooth."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    ph = np.mod(phase_from_freq(f, n, sr, phase0), 1.0)
    dt = np.clip(f / sr, 1e-6, 0.5)
    return 2 * ph - 1 - _polyblep(ph, dt)


def triangle(freq: np.ndarray | float, n: int, sr: int = SR, phase0: float = 0.0) -> np.ndarray:
    """Triangle wave. Its harmonics fall at 12 dB/octave, so aliasing is negligible for pad pitches."""
    ph = np.mod(phase_from_freq(freq, n, sr, phase0), 1.0)
    return 1 - 4 * np.abs(ph - 0.5)


def sine(freq: np.ndarray | float, n: int, sr: int = SR, phase0: float = 0.0) -> np.ndarray:
    return np.sin(TAU * phase_from_freq(freq, n, sr, phase0))


def smooth_noise(n: int, rate_hz: float, rng: np.random.Generator, sr: int = SR) -> np.ndarray:
    """Slow, smooth random wander in about [-1, 1] (cubic spline through random points).
    The spline is evaluated on a coarse grid and linearly interpolated (fast and still smooth)."""
    from scipy.interpolate import CubicSpline
    k = max(4, int(np.ceil(n / sr * rate_hz)) + 4)
    pts = rng.uniform(-1, 1, k)
    m = int(min(n, max(64, n / sr * max(rate_hz, 1) * 40)))
    coarse = CubicSpline(np.arange(k), pts)(np.linspace(0, k - 3, m))
    return np.interp(np.linspace(0, m - 1, n), np.arange(m), coarse)


# --- modulation effects -------------------------------------------------------------------------

def frac_delay(x: np.ndarray, delay_samples: np.ndarray, chunk: int = 1 << 20) -> np.ndarray:
    """Read x at (n - delay[n]) with linear interpolation (vectorised modulated delay line).
    Processed in chunks to keep memory traffic low on long signals."""
    n = len(x)
    out = np.empty(n, dtype=x.dtype)
    for s0 in range(0, n, chunk):
        s1 = min(n, s0 + chunk)
        pos = np.clip(np.arange(s0, s1) - delay_samples[s0:s1], 0, n - 1)
        i0 = pos.astype(np.int64)
        fr = (pos - i0).astype(x.dtype)
        i1 = np.minimum(i0 + 1, n - 1)
        out[s0:s1] = x[i0] + (x[i1] - x[i0]) * fr
    return out


def chorus(st: np.ndarray, mix: float = 0.5, base_ms: float = 14.0, depth_ms: float = 2.2,
           rate_hz: float = 0.23, sr: int = SR) -> np.ndarray:
    """Gentle two-voice stereo chorus with quadrature LFOs."""
    n = len(st)
    t = np.arange(n) / sr
    out = np.empty_like(st)
    for ch, ph in ((0, 0.0), (1, np.pi / 2)):
        d1 = (base_ms + depth_ms * np.sin(TAU * rate_hz * t + ph)) * (sr / 1000)
        d2 = (base_ms * 1.37 + depth_ms * 0.8 * np.sin(TAU * rate_hz * 0.71 * t + ph + 1.3)) * (sr / 1000)
        wet = frac_delay(st[:, ch], d1)
        wet += frac_delay(st[:, 1 - ch], d2)
        out[:, ch] = st[:, ch] * (1 - mix * 0.5) + wet * (0.5 * mix)
    return out


def saturate(x: np.ndarray, drive: float = 1.5) -> np.ndarray:
    """Soft tanh saturation, level-compensated for small signals."""
    return np.tanh(x * drive) / np.tanh(drive)


# --- normalising --------------------------------------------------------------------------------

def peak_normalise(x: np.ndarray, peak_dbfs: float = -6.0) -> np.ndarray:
    p = np.max(np.abs(x))
    return x if p <= 0 else x * (undb(peak_dbfs) / p)


def trim_tail(x: np.ndarray, floor_db: float = -70.0, keep: float = 0.02, sr: int = SR) -> np.ndarray:
    """Cut silent tail below floor (relative to peak), then fade the end."""
    mag = np.max(np.abs(stereo(x)), axis=1)
    thr = np.max(mag) * undb(floor_db)
    idx = np.nonzero(mag > thr)[0]
    end = min(len(x), (idx[-1] if len(idx) else len(x) - 1) + nsamp(keep, sr))
    return fade(x[:end], 0.0, min(0.05, end / sr / 4))
