"""Instruments shared by the music generator and the sound effects.

Everything is synthesised from sine waves, band-limited oscillators and filtered noise."""
from __future__ import annotations

import numpy as np

from .dsp import TAU, env_ad, env_adsr, highpass, lowpass, nsamp, phase_from_freq, saw, smooth_noise, triangle
from .paths import SR


# --- struck / plucked tones (FM) ------------------------------------------------------------------

TIMBRES = {
    # name:      mod ratio, index, index decay (s), amp decay (s at 440 Hz), attack (s), partials [(ratio, amp, decay)]
    "mallet": (1.0, 1.1, 0.07, 0.55, 0.004, [(3.93, 0.10, 0.09), (9.2, 0.025, 0.025)]),
    "felt":   (1.0, 0.7, 0.05, 0.38, 0.006, [(3.98, 0.05, 0.06)]),
    "pluck":  (1.0, 1.4, 0.03, 0.22, 0.003, [(2.0, 0.08, 0.05)]),
    "bell":   (3.5, 0.85, 0.35, 1.7, 0.003, [(2.0, 0.18, 1.0), (5.4, 0.04, 0.12)]),
    "glass":  (2.0, 0.35, 0.8, 2.6, 0.012, [(3.01, 0.06, 0.7)]),
    "chime":  (1.0, 0.6, 0.25, 2.2, 0.003, [(2.0, 0.30, 1.4), (3.0, 0.12, 0.8), (4.16, 0.07, 0.35), (5.43, 0.03, 0.15)]),
}


def struck(freq: float, vel: float = 0.8, timbre: str = "mallet", length: float | None = None,
           decay_scale: float = 1.0, rng: np.random.Generator | None = None, sr: int = SR) -> np.ndarray:
    """A single struck note (mono). Louder velocity = brighter, like a real mallet."""
    ratio, index, idecay, adecay, attack, partials = TIMBRES[timbre]
    # lower notes ring longer, higher notes shorter (like real bars and bells)
    adecay = adecay * decay_scale * (440.0 / freq) ** 0.35
    length = length if length is not None else min(8.0, adecay * 6 + attack + 0.05)
    n = nsamp(length, sr)
    t = np.arange(n) / sr
    rng = rng or np.random.default_rng(int(freq * 1000) % 2**31)
    i_env = index * (0.55 + 0.6 * vel) * np.exp(-t / idecay)
    mod = np.sin(TAU * freq * ratio * t + rng.uniform(0, TAU))
    car = np.sin(TAU * freq * t + i_env * mod)
    out = car * env_ad(n, attack, adecay, sr)
    for r, a, d in partials:
        if freq * r < sr * 0.42:
            out += a * (0.5 + 0.7 * vel) * np.sin(TAU * freq * r * t + rng.uniform(0, TAU)) * env_ad(n, attack, d * decay_scale, sr)
    # a whisper of mallet contact noise
    nn = nsamp(0.012, sr)
    if nn < n:
        click = lowpass(rng.standard_normal(nn), min(6000, freq * 6), 2, sr) * np.exp(-np.arange(nn) / (0.002 * sr))
        out[:nn] += click * 0.04 * vel
    out *= vel
    # FM at ratio 1 also makes energy at 0 Hz during the attack (a DC 'thump'): filter it away
    out = highpass(out, max(30.0, freq * 0.5), 2, sr)
    # fade the very end so long notes never cut off with a click
    nf = min(n // 4, nsamp(0.05, sr))
    out[-nf:] *= np.linspace(1, 0, nf)
    return out


# --- pad voice ------------------------------------------------------------------------------------

def pad_voice(freq: float, dur: float, attack: float, release: float, vel: float = 1.0,
              detune_cents: float = 7.0, tri_mix: float = 0.45, rng: np.random.Generator | None = None,
              sr: int = SR) -> np.ndarray:
    """One sustained pad note, stereo: three detuned band-limited saws spread across the field plus a
    soft triangle body, with a tiny slow pitch drift (analogue-style warmth). `dur` is how long the
    note is held before the release starts. Filtering is done later on the whole pad bus."""
    rng = rng or np.random.default_rng()
    n = nsamp(attack + dur + release, sr)
    drift = 1 + 0.0009 * smooth_noise(n, 0.25, rng, sr)  # about +/- 1.5 cents of slow wander
    left = np.zeros(n)
    right = np.zeros(n)
    for cents, p in ((-detune_cents, -0.55), (0.0, 0.0), (detune_cents, 0.55)):
        osc = saw(freq * 2 ** (cents / 1200) * drift, n, sr, rng.uniform(0, 1))
        a = (p + 1) * np.pi / 4
        left += osc * (np.cos(a) * np.sqrt(2) * (1 - tri_mix) / 3)
        right += osc * (np.sin(a) * np.sqrt(2) * (1 - tri_mix) / 3)
    body = triangle(freq * drift, n, sr, rng.uniform(0, 1)) * tri_mix
    env = env_adsr(n, attack, 1.2, 0.85, release, dur, sr) * vel
    left += body
    right += body
    return np.stack([left * env, right * env], axis=1)


def soft_sub(freq: float, dur: float, attack: float = 0.25, release: float = 0.9, vel: float = 1.0,
             sr: int = SR) -> np.ndarray:
    """Sub-bass: a sine with a touch of 2nd/3rd harmonic so it is still felt on small speakers."""
    n = nsamp(attack + dur + release, sr)
    ph = TAU * phase_from_freq(freq, n, sr)
    x = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    return x * env_adsr(n, attack, 2.0, 0.9, release, dur, sr) * vel


def air_tone(freq: float, dur: float, attack: float, release: float, sr: int = SR) -> np.ndarray:
    """A very quiet, pure, slightly shimmering sustained tone (used for near-silence)."""
    n = nsamp(attack + dur + release, sr)
    t = np.arange(n) / sr
    x = np.sin(TAU * freq * t + 0.15 * np.sin(TAU * 0.37 * t)) + 0.25 * np.sin(TAU * freq * 2.0 * t)
    return x * env_adsr(n, attack, 5.0, 1.0, release, dur, sr)
