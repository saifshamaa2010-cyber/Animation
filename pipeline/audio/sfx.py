"""The channel's sound-effect library, synthesised from scratch (no samples).

Each effect is a function returning float stereo audio at 48 kHz, shape (n, 2). The CLI writes them
all to public/audio/sfx/<name>.wav, peak-normalised to about -6 dBFS:

    .venv/bin/python -m pipeline.audio.sfx            # write every effect
    .venv/bin/python -m pipeline.audio.sfx snip tick  # just these

Design brief: subtle, premium, never cartoony. Every effect has proper envelopes and faded edges.
Pitched effects are tuned to D major so they sit in key with the music.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import soundfile as sf

from .dsp import (TAU, bandpass, coloured, db, env_ad, fade, highpass, lowpass, midi_hz, nsamp, pan,
                  peak_normalise, pink, place, resonator, smooth_noise, stereo, sweep_filter, trim_tail)
from .paths import SFX_DIR, SR
from .reverb import reverb, reverb_circular
from .synth import struck

PEAK_DBFS = -6.0
REGISTRY: dict[str, callable] = {}


def sfx(fn):
    REGISTRY[fn.__name__] = fn
    return fn


def _rng(name: str) -> np.random.Generator:
    """Deterministic randomness per effect: the same file every time it is rebuilt."""
    return np.random.default_rng(sum((i + 1) * ord(c) for i, c in enumerate(name)))


def _modal(freqs, amps, decays, dur, rng, attack=0.0008) -> np.ndarray:
    """Sum of decaying sine 'modes' — the sound of a small struck object."""
    n = nsamp(dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f, a, d in zip(freqs, amps, decays):
        out += a * np.sin(TAU * f * t + rng.uniform(0, TAU)) * env_ad(n, attack, d)
    return out


def _burst(dur: float, lo: float, hi: float, decay: float, rng, attack=0.0005) -> np.ndarray:
    n = nsamp(dur)
    return bandpass(rng.standard_normal(n), lo, hi, 2) * env_ad(n, attack, decay)


# --------------------------------------------------------------------------------------------------
# Binding / breaking
# --------------------------------------------------------------------------------------------------

@sfx
def pop_bind() -> np.ndarray:
    """Soft wooden-glassy 'tock' as a substrate docks into the active site: a small modal body,
    a felt-soft transient and a low settling 'thup'."""
    rng = _rng("pop_bind")
    dur = 0.6
    n = nsamp(dur)
    t = np.arange(n) / SR
    f0 = midi_hz(81)  # A5, in key
    body = _modal([f0, f0 * 2.76, f0 * 5.40, f0 * 3.98], [1.0, 0.32, 0.08, 0.10],
                  [0.075, 0.035, 0.012, 0.09], dur, rng, attack=0.0012)
    click = _burst(dur, 2500, 7000, 0.0015, rng) * 0.35
    # settling thump: pitch slides 190 -> 120 Hz
    f = 120 + 70 * np.exp(-t / 0.025)
    thup = np.sin(TAU * np.cumsum(f) / SR) * env_ad(n, 0.002, 0.05) * 0.55
    x = body * 0.8 + click + thup
    x = lowpass(x, 9000, 2)
    st = pan(x, 0.0)
    st = reverb(st, wet=0.10, rt60=0.45, predelay=0.006, lo_cut=250, hi_cut=7000, seed=11)
    return st


@sfx
def snip() -> np.ndarray:
    """A crisp, small bond-break 'tick' with a tiny sparkle tail (D-major pentatonic, very quiet)."""
    rng = _rng("snip")
    dur = 1.2
    n = nsamp(dur)
    out = np.zeros((n, 2))
    # the break itself: a very short bright transient + two tiny modes
    tr = highpass(_burst(dur, 3000, 12000, 0.0012, rng, attack=0.0002), 2500, 2)
    tock = _modal([1850, 4120, 6900], [0.55, 0.30, 0.12], [0.018, 0.010, 0.006], dur, rng, attack=0.0003)
    out += pan(tr * 0.9 + tock, 0.0)
    # sparkle: a few tiny high grains drifting outward, each softer than the last
    notes = [98, 93, 102, 100, 105]  # D7, A6, F#7, E7, A7 (D-major pentatonic)
    tt = 0.022
    for k, m in enumerate(notes):
        g = struck(midi_hz(m), vel=0.5, timbre="glass", length=0.6, decay_scale=0.06, rng=rng)
        g *= 0.16 * (0.72 ** k)
        place(out, pan(g, (-1) ** k * (0.25 + 0.12 * k)), nsamp(tt))
        tt += rng.uniform(0.028, 0.055)
    out = reverb(out, wet=0.16, rt60=0.9, predelay=0.01, lo_cut=900, hi_cut=11000, seed=12)
    return out


@sfx
def bonk_misfit() -> np.ndarray:
    """Muted, soft thud for 'doesn't fit': a felt bump and a smaller rebound bump."""
    rng = _rng("bonk")
    dur = 0.7
    n = nsamp(dur)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for start, g, f_hi, f_lo in ((0.0, 1.0, 150, 92), (0.115, 0.42, 165, 105)):
        i = nsamp(start)
        m = n - i
        tt = np.arange(m) / SR
        f = f_lo + (f_hi - f_lo) * np.exp(-tt / 0.03)
        bump = np.sin(TAU * np.cumsum(f) / SR) * env_ad(m, 0.003, 0.085)
        felt = lowpass(rng.standard_normal(m), 900, 2) * env_ad(m, 0.001, 0.012)
        x[i:] += g * (bump + 0.35 * felt)
    # a hint of dull, slightly 'wrong' body tone (a minor 2nd-ish wobble, very low)
    x += 0.10 * np.sin(TAU * 233 * t) * env_ad(n, 0.004, 0.06)
    x = lowpass(x, 1400, 2)
    st = pan(x, 0.0)
    return reverb(st, wet=0.08, rt60=0.35, predelay=0.004, lo_cut=120, hi_cut=4000, seed=13)


# --------------------------------------------------------------------------------------------------
# Movement / transitions
# --------------------------------------------------------------------------------------------------

@sfx
def whoosh_zoom() -> np.ndarray:
    """Airy filtered-noise rise for the big zoom (macro -> molecular). ~1.9 s, widening as it rises."""
    rng = _rng("whoosh_zoom")
    rise, tail = 1.75, 0.35
    dur = rise + tail
    n = nsamp(dur)
    t = np.arange(n) / SR
    pos = np.clip(t / rise, 0, 1)
    centre = 260 * (6200 / 260) ** (pos ** 1.3)
    nl, nr = pink(n, rng), pink(n, rng)
    st = np.stack([nl, nr], 1)
    air = sweep_filter(st, centre, "bandpass", q=1.1, stages=2)
    # gentle low 'pressure' layer, falling away as we arrive
    low = lowpass(coloured(n, rng, -6), 220, 2) * (0.6 * (1 - pos) ** 1.5 + 0.1)
    amp = (pos ** 2.2) * (1 - np.clip((t - rise) / tail, 0, 1)) ** 2
    amp = np.where(t < rise, amp, (1 - np.clip((t - rise) / tail, 0, 1)) ** 2)
    amp = fade(amp, 0.05, 0.05)
    out = air * amp[:, None] + stereo(low * amp * 0.5)
    # width grows from fairly narrow to wide during the zoom
    m = out.mean(1)
    s = (out[:, 0] - out[:, 1]) / 2 * (0.3 + 0.55 * pos)
    out = np.stack([m + s, m - s], 1)
    return reverb(out, wet=0.22, rt60=1.4, predelay=0.02, lo_cut=200, hi_cut=9000, seed=21)


@sfx
def whoosh_soft() -> np.ndarray:
    """Short, soft transition swish (~0.6 s), drifting slightly left to right."""
    rng = _rng("whoosh_soft")
    dur = 0.65
    n = nsamp(dur)
    t = np.arange(n) / SR
    x = pink(n, rng)
    u = t / dur
    centre = 700 * (2.9 ** np.sin(np.pi * np.clip(u * 1.1, 0, 1)))  # up then down
    y = sweep_filter(x, centre, "bandpass", q=1.4, stages=2)
    amp = np.sin(np.pi * np.clip(u, 0, 1)) ** 2.2
    amp = np.where(u < 0.38, np.sin(np.pi / 2 * u / 0.38) ** 2, np.cos(np.pi / 2 * (u - 0.38) / 0.62) ** 1.6)
    out = pan(y * amp, -0.35 + 0.7 * u)
    return reverb(out, wet=0.12, rt60=0.7, predelay=0.01, lo_cut=300, hi_cut=8000, seed=22)


@sfx
def card_in() -> np.ndarray:
    """A soft card sliding in and settling: paper friction texture + a gentle landing tap."""
    rng = _rng("card_in")
    dur = 0.75
    n = nsamp(dur)
    t = np.arange(n) / SR
    slide_end = 0.38
    u = np.clip(t / slide_end, 0, 1)
    fr = np.abs(smooth_noise(n, 70, rng)) ** 1.5 + 0.35  # stick-slip friction grain
    x = rng.standard_normal(n) * fr
    centre = 2400 - 1100 * u  # pitch of the friction falls as the card slows down
    x = sweep_filter(x, centre, "bandpass", q=0.9, stages=1)
    x = lowpass(highpass(x, 450, 2), 5200, 4)
    amp = np.where(t < slide_end, np.sin(np.pi / 2 * np.minimum(t / 0.08, 1)) * (1 - 0.35 * u), 0)
    amp = np.where(t >= slide_end, 0.65 * np.exp(-(t - slide_end) / 0.025), amp)
    slide = x * amp * 0.6
    # landing: soft low tap + tiny card 'tick'
    land = np.zeros(n)
    i = nsamp(slide_end)
    m = n - i
    tt = np.arange(m) / SR
    land[i:] = np.sin(TAU * (180 + 60 * np.exp(-tt / 0.01)) * tt) * np.exp(-tt / 0.03) * 0.45
    land[i:] += bandpass(rng.standard_normal(m), 1500, 5000, 2) * np.exp(-tt / 0.004) * 0.35
    out = pan(slide, -0.5 + 0.5 * u) + pan(land, 0.0)
    return reverb(out, wet=0.10, rt60=0.5, predelay=0.006, lo_cut=200, hi_cut=8000, seed=23)


@sfx
def strike() -> np.ndarray:
    """A marker striking through a word: a short felt-tip rasp moving left to right."""
    rng = _rng("strike")
    dur = 0.55
    n = nsamp(dur)
    t = np.arange(n) / SR
    draw = 0.34
    u = np.clip(t / draw, 0, 1)
    # stick-slip: the felt tip catches and releases ~140 times a second -> a soft rasp, not a squeak
    rate = 130 + 40 * u
    ph = np.cumsum(rate) / SR
    stick = (0.55 + 0.45 * np.sin(TAU * ph)) ** 3
    x = rng.standard_normal(n) * (stick + 0.25 * np.abs(smooth_noise(n, 220, rng)))
    x = bandpass(x, 900, 4800, 2)
    x = resonator(x, 2100, 3.0) * 0.6 + x * 0.6
    x = lowpass(x, 6000, 4)
    amp = np.where(t < draw, np.sin(np.pi / 2 * np.minimum(t / 0.03, 1)) * (0.8 + 0.2 * np.sin(np.pi * u)), 0)
    amp = np.where(t >= draw, np.exp(-(t - draw) / 0.02), amp)
    out = pan(x * amp, -0.45 + 0.9 * u)
    return reverb(out, wet=0.08, rt60=0.4, predelay=0.005, lo_cut=400, hi_cut=9000, seed=24)


# --------------------------------------------------------------------------------------------------
# Everyday sounds
# --------------------------------------------------------------------------------------------------

def _crunch(seed_name: str) -> np.ndarray:
    rng = _rng(seed_name)
    dur = 0.42
    n = nsamp(dur)
    out = np.zeros((n, 2))
    # low 'bite' body
    body = bandpass(rng.standard_normal(n), 140, 520, 2) * env_ad(n, 0.002, 0.03)
    out += pan(body * 0.9, 0.0)
    # dry fracture grains: dense at first, thinning out
    tcur = 0.0
    k = 0
    while tcur < 0.3:
        g_dur = rng.uniform(0.002, 0.009)
        lo = rng.uniform(1200, 3500)
        grain = _burst(g_dur + 0.02, lo, lo * rng.uniform(1.6, 2.6), g_dur * 0.35, rng)
        amp = rng.exponential(0.5) * np.exp(-tcur / 0.12)
        place(out, pan(grain * amp, rng.uniform(-0.35, 0.35)), nsamp(tcur))
        tcur += rng.exponential(0.006 + tcur * 0.05)
        k += 1
    out = lowpass(out, 8500, 2)
    return reverb(out, wet=0.05, rt60=0.18, predelay=0.003, lo_cut=200, hi_cut=8000, seed=31)


@sfx
def crunch() -> np.ndarray:
    """Dry cracker bite: a cluster of tiny fracture grains over a soft low bite."""
    return _crunch("crunch")


@sfx
def crunch_b() -> np.ndarray:
    """A second, slightly different bite (so two bites never sound copy-pasted)."""
    return _crunch("crunch_b_variant")


@sfx
def bubbles() -> np.ndarray:
    """Tiny oxygen bubbles. Physically modelled: each bubble rings at a pitch set by its size and
    the pitch rises slightly as it leaves the surface (the Minnaert / van den Doel bubble model)."""
    rng = _rng("bubbles")
    dur = 1.9
    n = nsamp(dur)
    out = np.zeros((n, 2))
    tcur = 0.02
    while tcur < 1.45:
        radius_mm = rng.uniform(0.9, 2.6)
        f0 = 3260 / radius_mm  # Minnaert: ~3.26 kHz for a 1 mm bubble
        d = 0.011 + 0.004 * radius_mm
        m = nsamp(d * 6)
        tt = np.arange(m) / SR
        f = f0 * (1 + 0.9 * tt / (d * 6))  # rising chirp
        b = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-tt / d)
        b = fade(b, 0.0008, 0.004)
        amp = rng.uniform(0.25, 1.0) * (1 - 0.45 * tcur / 1.45)
        place(out, pan(b * amp, rng.uniform(-0.7, 0.7)), nsamp(tcur))
        tcur += rng.exponential(0.07)
    out = highpass(out, 600, 2)
    return reverb(out, wet=0.14, rt60=0.6, predelay=0.006, lo_cut=500, hi_cut=10000, seed=32)


@sfx
def sizzle_heat() -> np.ndarray:
    """A low, dry crackle bed for heat. Exactly 3 s and seamlessly loopable (built circularly)."""
    rng = _rng("sizzle")
    dur = 3.0
    n = nsamp(dur)
    # hiss bed: periodic shaped noise with a slow 'breathing' (periodic too)
    hiss = np.stack([coloured(n, rng, -1.5), coloured(n, rng, -1.5)], 1)
    hiss = np.real(np.fft.irfft(np.fft.rfft(hiss, axis=0) * _bp_resp(n, 1200, 5000)[:, None], n, axis=0))
    t = np.arange(n) / SR
    breathe = 0.75 + 0.25 * np.sin(TAU * t / dur * 2) * np.sin(TAU * t / dur * 3 + 1.0)
    bed = hiss * breathe[:, None] * 0.08
    # crackles: Poisson impulses with varied (capped) sizes, placed on a circular buffer
    imp = np.zeros((n, 2))
    k = rng.poisson(230)
    pos = rng.integers(0, n, k)
    size = (0.4 + np.minimum(rng.pareto(3.0, k), 1.4)) * 0.25
    p = rng.uniform(-0.8, 0.8, k)
    imp[pos, 0] += size * np.cos((p + 1) * np.pi / 4)
    imp[pos, 1] += size * np.sin((p + 1) * np.pi / 4)
    # each crackle is a tiny resonant click: circular convolution with a short kernel
    kern = np.zeros(n)
    m = nsamp(0.006)
    kt = np.arange(m) / SR
    kern[:m] = (0.35 * np.sin(TAU * 3300 * kt) * np.exp(-kt / 0.0007)
                + 0.6 * np.sin(TAU * 1700 * kt) * np.exp(-kt / 0.0012)
                + 0.45 * np.sin(TAU * 800 * kt) * np.exp(-kt / 0.0022))
    crack = np.real(np.fft.irfft(np.fft.rfft(imp, axis=0) * np.fft.rfft(kern)[:, None], n, axis=0))
    out = bed + crack
    out = reverb_circular(out, wet=0.12, rt60=0.5, predelay=0.004, lo_cut=600, hi_cut=8000, seed=33)
    return out - out.mean(axis=0)  # remove DC (keeps the loop seamless)


def _bp_resp(n: int, lo: float, hi: float) -> np.ndarray:
    f = np.fft.rfftfreq(n, 1 / SR)
    return 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4) / np.sqrt(1 + (f / hi) ** 4)


# --------------------------------------------------------------------------------------------------
# Musical cues (tuned to D major)
# --------------------------------------------------------------------------------------------------

@sfx
def shimmer_sweet() -> np.ndarray:
    """Warm, rising bell shimmer for 'it turns sweet' (the amber motif): a D-major-pentatonic
    arpeggio of soft bells over a gentle swell, opening out into a long, warm reverb."""
    rng = _rng("shimmer")
    dur = 3.4
    n = nsamp(dur)
    out = np.zeros((n, 2))
    notes = [74, 76, 78, 81, 83, 86, 88, 90]  # D5 E5 F#5 A5 B5 D6 E6 F#6
    tcur = 0.0
    for k, m in enumerate(notes):
        v = 0.55 + 0.25 * np.sin(np.pi * k / (len(notes) - 1))
        b = struck(midi_hz(m), vel=v, timbre="glass", length=2.6, decay_scale=0.55, rng=rng)
        i = max(0, nsamp(tcur + rng.normal(0, 0.004)))
        place(out, pan(b, -0.6 + 1.2 * k / (len(notes) - 1)), i, 0.5)
        tcur += 0.095 - 0.004 * k
    # warm bed: D-A-F# pure tones swelling under the bells
    t = np.arange(n) / SR
    swell = np.sin(np.pi * np.clip(t / 2.2, 0, 1)) ** 2 * (t < 2.2)
    bed = sum(np.sin(TAU * midi_hz(m) * t) * w for m, w in ((62, 0.5), (69, 0.35), (78, 0.2)))
    out += pan(bed * swell * 0.18, 0.0)
    out = reverb(out, wet=0.38, rt60=2.6, predelay=0.03, lo_cut=250, hi_cut=9000, seed=41, tail=False)
    return out


@sfx
def chime_title() -> np.ndarray:
    """Warm two-note title chime: A4 then D5 (a rising fourth that 'lands' on the home note)."""
    rng = _rng("chime")
    dur = 4.2
    n = nsamp(dur)
    out = np.zeros((n, 2))
    for when, m, v, p in ((0.0, 69, 0.75, -0.25), (0.30, 74, 0.85, 0.25)):
        b = struck(midi_hz(m), vel=v, timbre="chime", length=3.8, decay_scale=0.75, rng=rng)
        place(b, struck(midi_hz(m - 12), vel=v * 0.6, timbre="felt", length=2.0, rng=rng), 0, 0.25)
        place(out, pan(b, p), nsamp(when))
    out = lowpass(out, 7500, 2)
    return reverb(out, wet=0.30, rt60=3.0, predelay=0.025, lo_cut=200, hi_cut=8000, seed=42, tail=False)


@sfx
def ui_blip() -> np.ndarray:
    """Very soft blip for a label appearing: a short, round D6 tone with a slight upward settle."""
    dur = 0.32
    n = nsamp(dur)
    t = np.arange(n) / SR
    f = midi_hz(86) * (1 - 0.03 * np.exp(-t / 0.012))
    x = np.sin(TAU * np.cumsum(f) / SR) + 0.12 * np.sin(2 * TAU * np.cumsum(f) / SR)
    x *= env_ad(n, 0.004, 0.045)
    x = lowpass(x, 5000, 2)
    return reverb(pan(x, 0.0), wet=0.14, rt60=0.6, predelay=0.01, lo_cut=400, hi_cut=8000, seed=43)


@sfx
def tick() -> np.ndarray:
    """Gentle wooden clock tick for the pause-and-predict countdown."""
    rng = _rng("tick")
    dur = 0.3
    x = _burst(dur, 1800, 5200, 0.0012, rng) * 0.5
    x += _modal([1560, 3310, 420], [0.55, 0.18, 0.35], [0.016, 0.006, 0.018], dur, rng, attack=0.0004)
    x = lowpass(x, 7000, 2)
    return reverb(pan(x, 0.0), wet=0.10, rt60=0.45, predelay=0.006, lo_cut=300, hi_cut=7000, seed=44)


@sfx
def tock() -> np.ndarray:
    """The tick's slightly lower partner (alternate them so a countdown doesn't sound robotic)."""
    rng = _rng("tock")
    dur = 0.3
    x = _burst(dur, 1400, 4200, 0.0012, rng) * 0.45
    x += _modal([1240, 2790, 360], [0.55, 0.16, 0.38], [0.018, 0.006, 0.02], dur, rng, attack=0.0004)
    x = lowpass(x, 6500, 2)
    return reverb(pan(x, 0.0), wet=0.10, rt60=0.45, predelay=0.006, lo_cut=300, hi_cut=7000, seed=45)


# --------------------------------------------------------------------------------------------------

def render(name: str) -> np.ndarray:
    """Render one effect, finished: trimmed, edge-faded, peak-normalised, float32 stereo."""
    x = stereo(REGISTRY[name]())
    loop = name == "sizzle_heat"
    if not loop:
        x = trim_tail(x, -66.0)
        x = fade(x, 0.0008, 0.03)
    x = highpass(x, 35, 2) if not loop else x
    return peak_normalise(x, PEAK_DBFS).astype(np.float32)


def write_all(names: list[str] | None = None, out_dir: Path = SFX_DIR, quiet: bool = False) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for name in names or list(REGISTRY):
        if name not in REGISTRY:
            raise SystemExit(f"Unknown effect '{name}'. Known: {', '.join(REGISTRY)}")
        x = render(name)
        p = out_dir / f"{name}.wav"
        sf.write(p, x, SR, subtype="PCM_24")
        paths.append(p)
        if not quiet:
            print(f"  {name:14s} {len(x) / SR:5.2f} s   peak {db(np.max(np.abs(x))):6.1f} dBFS   -> {p.relative_to(out_dir.parents[2]) if len(out_dir.parents) > 2 else p}")
    return paths


def missing(out_dir: Path = SFX_DIR) -> list[str]:
    return [n for n in REGISTRY if not (out_dir / f"{n}.wav").exists()]


def load(name: str, sfx_dir: Path = SFX_DIR) -> np.ndarray:
    p = sfx_dir / f"{name}.wav"
    if not p.exists():
        if name not in REGISTRY:
            raise KeyError(name)
        write_all([name], sfx_dir, quiet=True)
    x, sr = sf.read(p, dtype="float64", always_2d=True)
    if sr != SR:
        from scipy.signal import resample_poly
        x = resample_poly(x, SR, sr, axis=0)
    return stereo(x[:, :2] if x.shape[1] >= 2 else x[:, 0])


if __name__ == "__main__":
    print("Writing sound effects (all synthesised by pipeline/audio/sfx.py):")
    write_all(sys.argv[1:] or None)
