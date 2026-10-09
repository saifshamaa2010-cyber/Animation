"""Loudness measurement (ITU-R BS.1770 / EBU R128) and a true-peak-safe limiter.

- integrated loudness: pyloudnorm (BS.1770-4, gated)
- momentary (400 ms) / short-term (3 s) loudness profiles: our own K-weighting (48 kHz coefficients
  from BS.1770), used for ducking checks
- true peak: 4x oversampled peak (as BS.1770 Annex 2 recommends)
"""
from __future__ import annotations

import numpy as np
import pyloudnorm as pyln
from scipy import signal
from scipy.ndimage import minimum_filter1d

from .dsp import db, stereo, undb
from .paths import SR

# BS.1770 K-weighting at 48 kHz (stage 1: high shelf "head" filter, stage 2: RLB high-pass)
_K1 = (np.array([1.53512485958697, -2.69169618940638, 1.19839281085285]),
       np.array([1.0, -1.69065929318241, 0.73248077421585]))
_K2 = (np.array([1.0, -2.0, 1.0]), np.array([1.0, -1.99004745483398, 0.99007225036621]))


def k_weight(x: np.ndarray) -> np.ndarray:
    y = signal.lfilter(*_K1, stereo(x), axis=0)
    return signal.lfilter(*_K2, y, axis=0)


def integrated(x: np.ndarray, sr: int = SR) -> float:
    return float(pyln.Meter(sr).integrated_loudness(stereo(x)))


def loudness_profile(x: np.ndarray, window: float = 0.4, hop: float = 0.1, sr: int = SR) -> tuple[np.ndarray, np.ndarray]:
    """(times, LUFS) for sliding windows: 0.4 s = momentary, 3 s = short-term.
    times are window centres. Silence reads as -120."""
    y = k_weight(x)
    p = y[:, 0] ** 2 + y[:, 1] ** 2  # channel weights are 1.0 for L/R
    c = np.concatenate([[0.0], np.cumsum(p)])
    w, h = int(window * sr), int(hop * sr)
    starts = np.arange(0, max(1, len(p) - w + 1), h)
    ms = (c[starts + w] - c[starts]) / w
    lufs = -0.691 + 10 * np.log10(np.maximum(ms, 1e-12))
    return (starts + w / 2) / sr, np.maximum(lufs, -120.0)


def _oversampled_abs_max(x: np.ndarray, oversample: int = 4, chunk: int = 1 << 19) -> np.ndarray:
    """Per-sample max |x| over the `oversample` interpolated points that follow each sample (one
    channel). Chunked with overlap so very long files don't need gigabytes of memory."""
    n = len(x)
    out = np.empty(n)
    pad = 64
    for s0 in range(0, n, chunk):
        s1 = min(n, s0 + chunk)
        a, b = max(0, s0 - pad), min(n, s1 + pad)
        up = np.abs(signal.resample_poly(x[a:b], oversample, 1))
        off = (s0 - a) * oversample
        m = (s1 - s0) * oversample
        seg = up[off:off + m]
        r = np.abs(x[s0:s1]).copy()
        for k in range(oversample):
            np.maximum(r, seg[k::oversample], out=r)
        out[s0:s1] = r
    return out


def true_peak_db(x: np.ndarray, oversample: int = 4) -> float:
    xs = stereo(x)
    return float(db(max(float(np.max(_oversampled_abs_max(xs[:, ch], oversample))) for ch in range(xs.shape[1]))))


def sample_peak_db(x: np.ndarray) -> float:
    return float(db(np.max(np.abs(x))))


def _true_peak_envelope(x: np.ndarray, oversample: int = 4) -> np.ndarray:
    """Per-sample peak magnitude including inter-sample peaks (max over channels)."""
    xs = stereo(x)
    mag = _oversampled_abs_max(xs[:, 0], oversample)
    for ch in range(1, xs.shape[1]):
        np.maximum(mag, _oversampled_abs_max(xs[:, ch], oversample), out=mag)
    return mag


def limit(x: np.ndarray, ceiling_db: float = -1.5, lookahead: float = 0.003, release: float = 0.12,
          block: int = 32, sr: int = SR) -> tuple[np.ndarray, dict]:
    """Look-ahead true-peak limiter. Gain never exceeds what the oversampled peak allows; it ramps
    down over `lookahead` (no clicks) and recovers exponentially over `release`.
    Returns (limited, stats)."""
    xs = stereo(x).astype(float)
    n = len(xs)
    ceil = undb(ceiling_db)
    peak = _true_peak_envelope(xs)
    g_req = np.minimum(1.0, ceil / np.maximum(peak, 1e-12))

    nb = (n + block - 1) // block
    gpad = np.ones(nb * block)
    gpad[:n] = g_req
    gb = gpad.reshape(nb, block).min(axis=1)  # most restrictive gain within each block
    la = max(1, int(round(lookahead * sr / block)))
    # forward-looking minimum so the gain is already down when the peak arrives
    gb_la = minimum_filter1d(gb, size=2 * la + 1, origin=0, mode="nearest")
    # exponential release (control-rate loop, ~0.7 ms per step)
    coef = np.exp(-block / (release * sr))
    env = np.empty(nb)
    e = 1.0
    for k in range(nb):
        target = gb_la[k]
        e = target if target < e else target + (e - target) * coef
        env[k] = e
    # smooth the attack corner: moving average of a forward minimum never exceeds env
    h = minimum_filter1d(env, size=la, origin=-(la // 2) if la > 1 else 0, mode="nearest")
    kern = np.ones(la) / la
    s = np.convolve(np.pad(h, (la - 1, 0), mode="edge"), kern, mode="valid")
    s = np.minimum(s, env)
    # per-sample gain: interpolate between block-boundary values that are safe for both blocks
    bnd = np.minimum(np.concatenate([[s[0]], s]), np.concatenate([s, [s[-1]]]))  # nb+1 boundaries
    pos = np.arange(nb * block) / block
    g = np.interp(pos, np.arange(nb + 1), bnd)[:n]
    g = np.minimum(g, g_req)  # belt and braces
    y = xs * g[:, None]
    stats = {
        "maxGainReductionDb": float(-db(np.min(g))),
        "percentTimeLimiting": float(np.mean(g < undb(-0.1)) * 100),
    }
    return y, stats


def normalise_and_limit(x: np.ndarray, target_lufs: float = -14.0, tp_max_db: float = -1.0,
                        iterations: int = 4) -> tuple[np.ndarray, float, dict]:
    """Gain to the loudness target, then limit; repeat until integrated loudness is within ±0.1 LU
    and true peak is under the limit. Returns (out, total_gain_db, stats)."""
    gain = target_lufs - integrated(x)
    ceiling = tp_max_db - 0.5
    out, st = x, {}
    for _ in range(iterations):
        out, st = limit(x * undb(gain), ceiling_db=ceiling)
        lufs = integrated(out)
        tp = true_peak_db(out)
        err = target_lufs - lufs
        if abs(err) <= 0.1 and tp <= tp_max_db:
            break
        if tp > tp_max_db:
            ceiling -= (tp - tp_max_db) + 0.1
        gain += err
    st.update({"integratedLufs": integrated(out), "truePeakDbtp": true_peak_db(out),
               "samplePeakDbfs": sample_peak_db(out)})
    return out, float(gain), st
