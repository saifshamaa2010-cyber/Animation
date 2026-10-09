"""Original ambient underscore, composed by code to follow the video's arc.

    .venv/bin/python -m pipeline.audio.music <episode-id> [--timeline PATH] [--out PATH]

How it works (plain English):
- The narration timeline gives every scene's start/end and every cue's time.
- episodes/<id>/music.json says, per scene (and optionally from a cue onwards), the mood: which
  chords to play, how intense/bright it is, and which instruments join in.
- Each scene gets its own bar grid: we pick a whole number of beats close to 80 bpm so that every
  scene boundary lands on a beat (usually a bar line). So the music changes *with* the picture.
- Chords are voice-led (each note moves as little as possible to the next chord; shared notes are
  held), played by a soft detuned pad through a slowly moving low-pass filter and chorus. A sub-bass
  follows the roots. Optional layers: a gentle felt-mallet arpeggio, sparse bell notes, and the
  channel's short signature motif. Timing and velocity are humanised. Everything shares one long,
  synthesised stereo reverb.
- Level changes between parts are crossfaded over ~2 s. A 'dropout' event pulls the music to
  near-silence (used under the pause-and-predict moment).

Everything is synthesised here: the channel owns the result outright.
"""
from __future__ import annotations

import argparse
import json
import warnings
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import soundfile as sf

from . import timeline as tlmod
from .dsp import chorus, highpass, lowpass, midi_hz, nsamp, pan, place, smooth_noise, sweep_filter, undb
from .loudness import integrated, limit
from .paths import SR, episode_dir, public_episode_dir
from .reverb import reverb
from .synth import air_tone, pad_voice, struck
from .theory import PC, Chord, bass_note, parse, voice

CR = 200  # control rate (Hz) for automation curves

DEFAULTS = {
    "intensity": 0.4, "brightness": None, "progression": ["Dmaj9"], "chordBeats": 8, "voices": 4,
    "pad": 1.0, "padAttack": 1.4, "padRelease": 2.6,
    "sub": 0.0, "pedal": None,
    "arp": None, "arpLevel": 0.6,
    "bell": 0.0, "bellEvery": 8, "bellOffset": 4, "bellProb": 0.75,
    "motif": None, "motifAtBeat": 0, "motifLevel": 1.0,
    "tremolo": 0.0, "tremoloRate": 2,
}

# Layer gains after their buses (balance between instruments) and reverb sends.
MIX = {"pad": 0.42, "sub": 0.22, "arp": 0.24, "bell": 0.16, "motif": 0.34}
SEND = {"pad": 0.32, "sub": 0.0, "arp": 0.42, "bell": 0.65, "motif": 0.5}

# The channel's signature motif (D major). (beat offset, MIDI note, length in beats, velocity)
MOTIFS = {
    # rising, curious, ends on the 9th (E) - an open question
    "question": [(0, 69, 0.5, 0.62), (0.5, 74, 0.5, 0.70), (1.0, 76, 1.0, 0.76), (2.0, 78, 1.5, 0.80), (3.5, 76, 3.0, 0.66)],
    # the same shape, now landing home on D - the answer
    "answer": [(0, 69, 0.5, 0.62), (0.5, 74, 0.5, 0.70), (1.0, 76, 1.0, 0.76), (2.0, 78, 1.0, 0.82), (3.0, 76, 0.5, 0.70), (3.5, 74, 4.0, 0.72)],
    # a low, slower version for the darker section
    "dark": [(0, 66, 1.0, 0.55), (1.0, 69, 1.0, 0.58), (2.0, 71, 2.0, 0.62), (4.0, 70, 3.0, 0.5)],
    # final sign-off: home note, fifth, high home
    "home": [(0, 74, 1.0, 0.6), (1.0, 81, 1.0, 0.55), (2.0, 78, 1.0, 0.5), (3.0, 86, 4.0, 0.45)],
}

# Arpeggio patterns: per bar of 4 beats, (beat offset, index into the chord's note pool, velocity)
ARPS = {
    "flow": [(i * 0.5, idx, v) for i, (idx, v) in enumerate(
        [(0, 1.0), (1, 0.62), (2, 0.72), (3, 0.6), (4, 0.86), (3, 0.6), (2, 0.7), (1, 0.58)])],
    "broken": [(0, 0, 0.95), (1.5, 2, 0.7), (2.5, 1, 0.66), (3.0, 3, 0.75)],
    "sparse": [(0, 0, 0.9), (2.0, 2, 0.7)],
    "pulse": [(i * 0.5, idx, v) for i, (idx, v) in enumerate(
        [(0, 0.9), (2, 0.55), (1, 0.62), (2, 0.55), (0, 0.8), (2, 0.55), (3, 0.62), (2, 0.55)])],
    "fast": [(i * 0.25, idx, v) for i, (idx, v) in enumerate(
        [(0, .8), (1, .5), (2, .6), (3, .5), (4, .7), (3, .5), (2, .6), (1, .5)] * 2)],
}
ARP_TIMBRE = {"flow": "felt", "broken": "felt", "sparse": "felt", "pulse": "pluck", "fast": "pluck"}


@dataclass
class Part:
    scene: str
    t0: float
    t1: float
    beat: float  # beat length (s) for this scene
    p: dict

    def at_beat(self, b: float) -> float:
        return self.t0 + b * self.beat

    @property
    def n_beats(self) -> float:
        return (self.t1 - self.t0) / self.beat


@dataclass
class ChordEv:
    t0: float
    t1: float
    chord: Chord
    part: Part
    notes: list[int] = field(default_factory=list)
    bass: int = 38


# --------------------------------------------------------------------------------------------------
# Planning
# --------------------------------------------------------------------------------------------------

def scene_grid(dur: float, bpm: float = 80.0, lo: float = 74.0, hi: float = 86.0) -> tuple[int, float]:
    """Number of beats and beat length so the scene is a whole number of beats near `bpm`.
    Prefer whole bars (multiples of 4), then half bars, then any beat count."""
    nominal = 60.0 / bpm
    for step, (a, b) in ((4, (lo, hi)), (2, (lo + 2, hi - 2))):
        best = None
        for m in range(step, int(dur / (60 / hi)) + step + 1, step):
            tempo = 60.0 * m / dur
            if a <= tempo <= b and (best is None or abs(tempo - bpm) < abs(60.0 * best / dur - bpm)):
                best = m
        if best:
            return best, dur / best
    m = max(1, int(round(dur / nominal)))
    return m, dur / m


def _merged(scene_cfg: dict, part_cfg: dict) -> dict:
    p = dict(DEFAULTS)
    p.update({k: v for k, v in scene_cfg.items() if k not in ("parts", "mood")})
    p.update({k: v for k, v in part_cfg.items() if k != "from"})
    return p


def plan(tl: tlmod.Timeline, cfg: dict) -> tuple[list[Part], list[ChordEv], dict]:
    bpm = float(cfg.get("tempoBpm", 80))
    parts: list[Part] = []
    tempo_map = {}
    for sc in tl.scenes:
        s0, s1 = float(sc["startSec"]), float(sc["endSec"])
        if s1 - s0 < 0.05:
            continue
        nb, beat = scene_grid(s1 - s0, bpm)
        tempo_map[sc["id"]] = {"beats": nb, "bpm": round(60 / beat, 2)}
        scfg = cfg.get("scenes", {}).get(sc["id"], {})
        pcfgs = scfg.get("parts") or [{"from": "start"}]
        starts = []
        for k, pc in enumerate(pcfgs):
            ref = pc.get("from", "start")
            if k == 0 or ref == "start":
                b = 0
            else:
                t = tl.time(f"{sc['id']}.{ref}" if "." not in str(ref) else ref)
                if t is None:
                    continue
                b = int(round((t - s0) / beat / 2.0)) * 2  # snap to the nearest half bar
                b = min(max(b, (starts[-1][0] + 2) if starts else 0), nb - 1)
                if starts and b <= starts[-1][0]:
                    continue
            starts.append((b, pc))
        for k, (b, pc) in enumerate(starts):
            b_end = starts[k + 1][0] if k + 1 < len(starts) else nb
            parts.append(Part(sc["id"], s0 + b * beat, s0 + b_end * beat, beat, _merged(scfg, pc)))

    # chords: cycle each part's progression; a short leftover is absorbed by the previous chord
    evs: list[ChordEv] = []
    for part in parts:
        prog = [parse(s) for s in part.p["progression"]]
        cb = float(part.p["chordBeats"])
        b, i = 0.0, 0
        nb = part.n_beats
        while b < nb - 1e-6:
            length = min(cb, nb - b)
            if nb - (b + length) < cb / 2 and nb - (b + length) > 1e-6:
                length = nb - b
            ch = prog[i % len(prog)]
            if evs and evs[-1].chord.symbol == ch.symbol and abs(evs[-1].t1 - part.at_beat(b)) < 1e-6:
                evs[-1].t1 = part.at_beat(b + length)  # same chord continues: hold it
            else:
                evs.append(ChordEv(part.at_beat(b), part.at_beat(b + length), ch, part))
            b += length
            i += 1

    prev, prev_bass = None, None
    for ev in evs:
        ev.notes = voice(ev.chord, prev, voices=int(ev.part.p["voices"]))
        ped = ev.part.p.get("pedal")
        if ped:
            ev.bass = bass_note(Chord(ped, PC[ped], PC[ped], (0,)), prev_bass)
        else:
            ev.bass = bass_note(ev.chord, prev_bass)
        prev, prev_bass = ev.notes, ev.bass
    return parts, evs, tempo_map


# --------------------------------------------------------------------------------------------------
# Automation
# --------------------------------------------------------------------------------------------------

def _val(v, u: np.ndarray) -> np.ndarray:
    if isinstance(v, (list, tuple)):
        return v[0] + (v[1] - v[0]) * u
    return np.full_like(u, float(v))


def curve(parts: list[Part], key: str, n_ctrl: int, xfade: float, fn=None) -> np.ndarray:
    """Per-part values (constants or [from, to] ramps) on the control grid, crossfaded at the joins."""
    out = np.zeros(n_ctrl)
    for part in parts:
        i0, i1 = int(part.t0 * CR), min(n_ctrl, int(np.ceil(part.t1 * CR)))
        if i1 <= i0:
            continue
        u = np.linspace(0, 1, i1 - i0)
        v = part.p.get(key)
        vals = fn(part, u) if fn else _val(0.0 if v is None else v, u)
        out[i0:i1] = vals
    if parts:
        out[int(parts[-1].t1 * CR):] = out[max(0, int(parts[-1].t1 * CR) - 1)]
    w = max(3, int(xfade * CR))
    win = np.hanning(w)
    win /= win.sum()
    padded = np.pad(out, (w // 2, w - w // 2 - 1), mode="edge")
    return np.convolve(padded, win, mode="valid")


def to_audio(ctrl: np.ndarray, n: int) -> np.ndarray:
    return np.interp(np.arange(n) / SR, np.arange(len(ctrl)) / CR, ctrl)


def intensity_gain(i: np.ndarray) -> np.ndarray:
    return undb(-12.0 * (1 - np.clip(i, 0, 1)))


def brightness_of(part: Part, u: np.ndarray) -> np.ndarray:
    if part.p.get("brightness") is not None:
        return _val(part.p["brightness"], u)
    return 0.2 + 0.6 * _val(part.p["intensity"], u)


# --------------------------------------------------------------------------------------------------
# Rendering
# --------------------------------------------------------------------------------------------------

def pval(part: Part, key: str, t: float) -> float:
    """A part parameter at time t (handles [from, to] ramps)."""
    v = part.p.get(key)
    if isinstance(v, (list, tuple)):
        u = float(np.clip((t - part.t0) / max(part.t1 - part.t0, 1e-6), 0, 1))
        return float(v[0] + (v[1] - v[0]) * u)
    return float(v or 0.0)


def chord_at(evs: list[ChordEv], t: float) -> ChordEv:
    for ev in evs:
        if ev.t0 <= t < ev.t1:
            return ev
    return evs[-1] if t >= evs[-1].t1 else evs[0]


def pool_for(ev: ChordEv, lo: int = 62, hi: int = 83) -> list[int]:
    """Notes for the arpeggio: the pad's voicing moved up into a bright-but-soft register."""
    pcs = set(n % 12 for n in ev.notes) | {ev.chord.root}
    pool = sorted(n for n in range(lo, hi + 1) if n % 12 in pcs)
    # thin out: no neighbouring notes closer than a tone
    out = []
    for n in pool:
        if not out or n - out[-1] >= 2:
            out.append(n)
    return out


def in_windows(t: float, windows: list[tuple[float, float]]) -> bool:
    return any(a - 0.3 <= t < b for a, b in windows)


def render(tl: tlmod.Timeline, cfg: dict, seed: int = 2024, verbose: bool = True) -> tuple[np.ndarray, dict]:
    rng = np.random.default_rng(seed)
    parts, evs, tempo_map = plan(tl, cfg)
    dur = tl.duration
    n = nsamp(dur)
    n_ctrl = int(np.ceil(dur * CR)) + 2
    xfade = float(cfg.get("crossfadeSec", 2.0))

    # dropout windows (near-silence)
    drops = []
    for ev in cfg.get("events", []):
        if ev.get("type") == "dropout":
            a, b = tl.time(ev.get("from")), tl.time(ev.get("to"))
            if a is not None and b is not None and b > a:
                drops.append((a, b, ev))
    drop_windows = [(a, b) for a, b, _ in drops]

    inten = curve(parts, "intensity", n_ctrl, xfade)
    master = intensity_gain(inten)

    # ---------------- pad ----------------
    pad = np.zeros((n + nsamp(4), 2))
    active: dict[int, list] = {}
    notes: list[list] = []  # [midi, t_start, t_end, attack, release, velocity]
    for ev in evs:
        a, r = float(ev.part.p["padAttack"]), float(ev.part.p["padRelease"])
        nv = len(ev.notes)
        for k, m in enumerate(ev.notes):
            vel = (0.78 + 0.22 * k / max(1, nv - 1)) / np.sqrt(nv)
            if m in active and abs(active[m][2] - ev.t0) < 1e-6:
                active[m][2] = ev.t1  # common tone: keep holding it
            else:
                rec = [m, ev.t0, ev.t1, a, r, vel]
                notes.append(rec)
                active[m] = rec
        for m in list(active):
            if active[m][2] < ev.t1 - 1e-6:
                del active[m]
    for m, t0, t1, a, r, vel in notes:
        start = max(0.0, t0 - 0.35 * a)  # begin swelling a little before the downbeat
        hold = max(0.0, (t1 + 0.12) - start - a)
        x = pad_voice(midi_hz(m), hold, a, r, vel, rng=rng)
        place(pad, x, nsamp(start))
    pad = pad[:n]
    # moving low-pass: brightness per part, plus a very slow drift (+/- 1/4 octave)
    bright = to_audio(curve(parts, "brightness", n_ctrl, xfade * 1.5, brightness_of), n)
    drift = 2 ** (0.25 * smooth_noise(n, 0.04, rng))
    cutoff = 330 * 2 ** (bright * 4.6) * drift
    pad = sweep_filter(pad, cutoff, "lowpass", q=0.62, stages=2, block=256)
    pad = highpass(pad, 90, 2)
    # tremolo (used for tension): amplitude pulses locked to the beat grid
    trem = to_audio(curve(parts, "tremolo", n_ctrl, 1.0), n)
    if np.max(trem) > 0.01:
        beat_pos = beat_position(parts, n)
        rate = to_audio(curve(parts, "tremoloRate", n_ctrl, 0.05), n)
        lfo = 0.5 - 0.5 * np.cos(2 * np.pi * beat_pos * rate)
        pad *= (1 - 0.55 * trem * lfo)[:, None]
    pad = chorus(pad, mix=0.45)
    pad *= (to_audio(curve(parts, "pad", n_ctrl, xfade), n) * MIX["pad"])[:, None]

    # ---------------- sub-bass (one continuous oscillator, so held notes never phase-cancel) ------
    f_ctrl = np.zeros(n_ctrl)
    for ev in evs:
        f_ctrl[int(ev.t0 * CR):int(np.ceil(ev.t1 * CR))] = midi_hz(ev.bass)
    f_ctrl[int(evs[-1].t1 * CR):] = midi_hz(evs[-1].bass)
    k = max(3, int(0.06 * CR))  # 60 ms glide between bass notes
    f_ctrl = np.convolve(np.pad(f_ctrl, (k // 2, k - k // 2 - 1), mode="edge"), np.ones(k) / k, mode="valid")
    ph = 2 * np.pi * np.cumsum(to_audio(f_ctrl, n)) / SR
    sub_sig = np.sin(ph) + 0.16 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    sub_lvl = to_audio(curve(parts, "sub", n_ctrl, xfade), n)
    sub = pan(lowpass(sub_sig * sub_lvl, 260, 2) * MIX["sub"], 0.0)

    # ---------------- arpeggio / bells / motif ----------------
    arp = np.zeros((n + nsamp(9), 2))
    bell = np.zeros((n + nsamp(9), 2))
    motif = np.zeros((n + nsamp(9), 2))
    note_log = {"arp": 0, "bell": 0, "motif": 0}
    for part in parts:
        p = part.p
        prng = np.random.default_rng([seed, int(part.scene[1:]), int(part.t0 * 100)])  # repeatable
        # arpeggio
        pat = p.get("arp")
        if pat:
            if pat not in ARPS:
                warnings.warn(f"Unknown arp pattern '{pat}' in {part.scene}; known: {', '.join(ARPS)}")
            else:
                bars = int(np.ceil(part.n_beats / 4))
                for bar in range(bars):
                    for off, idx, v in ARPS[pat]:
                        b = bar * 4 + off
                        if b >= part.n_beats - 0.05:
                            continue
                        t = part.at_beat(b) + float(np.clip(prng.normal(0, 0.009), -0.025, 0.025))
                        if in_windows(t, drop_windows):
                            continue
                        ev = chord_at(evs, part.at_beat(b) + 0.01)
                        pool = pool_for(ev)
                        m = pool[idx % len(pool)]
                        vel = v * float(np.exp(prng.normal(0, 0.08)))
                        x = struck(midi_hz(m), vel, ARP_TIMBRE[pat], rng=prng)
                        place(arp, pan(x * pval(part, "arpLevel", t), ((idx % 4) - 1.5) * 0.18 + prng.normal(0, 0.05)), nsamp(max(0, t)))
                        note_log["arp"] += 1
        # sparse bell line
        if max(np.atleast_1d(p.get("bell") or 0.0)) > 0:
            last = None
            every, offset = float(p["bellEvery"]), float(p["bellOffset"])
            b = offset
            while b < part.n_beats - 0.5:
                t = part.at_beat(b) + prng.normal(0, 0.015)
                if prng.random() < float(p["bellProb"]) and not in_windows(t, drop_windows):
                    ev = chord_at(evs, part.at_beat(b) + 0.01)
                    pcs = set(ev.chord.pcs) | {(ev.chord.root + 2) % 12}
                    cands = [m for m in range(74, 89) if m % 12 in pcs]
                    if last is None:
                        w = np.exp(-np.abs(np.array(cands) - 81) / 4.0)
                    else:
                        d = np.abs(np.array(cands) - last)
                        w = np.exp(-np.abs(d - 2.5) / 2.0) * np.where(d == 0, 0.15, 1.0)
                    m = int(prng.choice(cands, p=w / w.sum()))
                    last = m
                    x = struck(midi_hz(m), 0.42 + 0.15 * prng.random(), "bell", rng=prng)
                    place(bell, pan(x * pval(part, "bell", t), prng.uniform(-0.5, 0.5)), nsamp(max(0, t)))
                    note_log["bell"] += 1
                b += every
        # signature motif
        mname = p.get("motif")
        if mname:
            if mname not in MOTIFS:
                warnings.warn(f"Unknown motif '{mname}' in {part.scene}; known: {', '.join(MOTIFS)}")
            else:
                for off, m, length, v in MOTIFS[mname]:
                    b = float(p["motifAtBeat"]) + off
                    t = part.at_beat(b) + float(np.clip(prng.normal(0, 0.008), -0.02, 0.02))
                    if off > 0:
                        t += 0.012 * off / 4  # a hair of rubato: lean back slightly through the phrase
                    vel = v * float(np.exp(prng.normal(0, 0.05)))
                    hold = length * part.beat
                    x = struck(midi_hz(m), vel, "mallet", decay_scale=0.8 + 0.25 * min(hold, 3.0), rng=prng)
                    g = struck(midi_hz(m + 12), vel * 0.5, "glass", decay_scale=0.5, rng=prng)
                    place(x, g, 0, 0.22)
                    place(motif, pan(x * pval(part, "motifLevel", t), 0.08 * np.sin(m)), nsamp(max(0, t)))
                    note_log["motif"] += 1
    arp, bell, motif = arp[:n], bell[:n], motif[:n]
    arp = lowpass(arp, 5200, 2) * MIX["arp"]
    bell = lowpass(bell, 7000, 2) * MIX["bell"]
    motif = lowpass(motif, 7500, 2) * MIX["motif"]

    # ---------------- mix + shared reverb (in place, to keep memory traffic down) ----------------
    g = to_audio(master, n)[:, None]
    layer_rms = {k: round(float(20 * np.log10(np.sqrt(np.mean((v * g) ** 2)) + 1e-12)), 1)
                 for k, v in (("pad", pad), ("sub", sub), ("arp", arp), ("bell", bell), ("motif", motif))}
    send = pad * SEND["pad"]
    send += arp * SEND["arp"]
    send += bell * SEND["bell"]
    send += motif * SEND["motif"]
    send *= g
    dry = pad
    dry += sub
    dry += arp
    dry += bell
    dry += motif
    dry *= g
    del pad, sub, arp, bell, motif, g
    rev_cfg = cfg.get("reverb", {})
    wet = reverb(send, wet=1.0, dry=0.0, tail=False, rt60=float(rev_cfg.get("rt60", 4.2)),
                 rt60_hf=float(rev_cfg.get("rt60Hf", 1.7)), predelay=0.035, lo_cut=220, hi_cut=6500, seed=101)[:n]
    del send
    wet *= float(rev_cfg.get("return", 0.55))

    # ---------------- dropouts: dry part dips quickly, the reverb tail more slowly ----------------
    drop_fast = np.ones(n_ctrl)
    drop_slow = np.ones(n_ctrl)
    tt = np.arange(n_ctrl) / CR
    for a, b, ev in drops:
        lvl = undb(float(ev.get("levelDb", -30)))
        fo, fi = float(ev.get("fadeOutSec", 0.5)), float(ev.get("fadeInSec", 0.15))
        for arr, k_out in ((drop_fast, fo), (drop_slow, fo * 2.5)):
            down = np.clip((tt - a) / k_out, 0, 1)
            up = np.clip((tt - b) / fi, 0, 1)
            shape = 1 - (1 - lvl) * (0.5 - 0.5 * np.cos(np.pi * down))
            shape = np.where(tt >= b, lvl + (1 - lvl) * (0.5 - 0.5 * np.cos(np.pi * up)), shape)
            shape = np.where(tt < a, 1.0, shape)
            np.minimum(arr, shape, out=arr)
    dry *= to_audio(drop_fast, n)[:, None]
    wet *= to_audio(drop_slow, n)[:, None]
    out = dry
    out += wet
    del wet
    # near-silence 'air': a faint, pure open fifth that keeps the question hanging. Its level is set
    # relative to the music just before the dropout (airDb, default -24 dB), so it really is faint.
    for a, b, ev in drops:
        i0, i1 = nsamp(max(0.0, a - 3.0)), nsamp(a)
        ref_rms = float(np.sqrt(np.mean(out[i0:i1] ** 2))) if i1 > i0 else 0.01
        seg = np.zeros((nsamp(b - a + 5.0), 2))
        for m, p_ in zip(ev.get("airNotes", [81, 88]), (-0.3, 0.3)):
            x = air_tone(midi_hz(m), max(0.1, b - a - 1.2), 0.9, 1.0)
            place(seg, pan(x, p_), 0)
        seg *= ref_rms * undb(float(ev.get("airDb", -24))) / (float(np.sqrt(np.mean(seg[: nsamp(b - a)] ** 2))) + 1e-12)
        seg = reverb(seg, wet=0.8, dry=1.0, tail=False, rt60=5.0, rt60_hf=2.0, predelay=0.04, seed=102)
        place(out, seg, nsamp(a))
    out = highpass(out, 32, 2)

    # gentle fade in at the very start, and a long fade to silence at the very end
    fi_s, fo_s = float(cfg.get("fadeInSec", 1.0)), float(cfg.get("endFadeSec", 3.0))
    tt = np.arange(n) / SR
    env = np.clip(tt / max(fi_s, 1e-3), 0, 1) * np.clip((dur - tt) / max(fo_s, 1e-3), 0, 1)
    out *= (0.5 - 0.5 * np.cos(np.pi * env))[:, None]

    # level: the bed is delivered at a fixed loudness; the mixer sets its final level under the voice
    target = float(cfg.get("bedLufs", -20.0))
    lufs = integrated(out)
    out *= undb(target - lufs)
    out, lim = limit(out, ceiling_db=-3.0, release=0.25)

    report = {
        "durationSec": dur, "bedLufs": round(integrated(out), 2), "limiter": lim,
        "tempoMap": tempo_map, "notes": note_log, "layerRmsDbBeforeNormalising": layer_rms,
        "parts": [{"scene": p.scene, "t0": round(p.t0, 2), "t1": round(p.t1, 2), "intensity": p.p["intensity"],
                   "arp": p.p.get("arp"), "motif": p.p.get("motif")} for p in parts],
        "chords": [{"t0": round(e.t0, 2), "t1": round(e.t1, 2), "chord": e.chord.symbol, "notes": e.notes, "bass": e.bass}
                   for e in evs],
        "dropouts": [{"from": round(a, 2), "to": round(b, 2)} for a, b, _ in drops],
    }
    if verbose:
        print(f"  {len(parts)} parts, {len(evs)} chords, notes: {note_log}, bed {report['bedLufs']} LUFS")
    return out.astype(np.float32), report


def beat_position(parts: list[Part], n: int) -> np.ndarray:
    """Continuous beat count at every sample (follows each scene's tempo)."""
    ts, bs = [0.0], [0.0]
    acc = 0.0
    for p in parts:
        if p.t0 > ts[-1] + 1e-9:
            ts.append(p.t0)
            bs.append(acc)
        acc += p.n_beats
        ts.append(p.t1)
        bs.append(acc)
    return np.interp(np.arange(n) / SR, ts, bs)


def load_config(ep: str, path: str | Path | None = None) -> dict:
    p = Path(path) if path else episode_dir(ep) / "music.json"
    if not p.exists():
        warnings.warn(f"No {p}; using a plain default bed.")
        return {}
    return json.loads(p.read_text())


def main(argv: list[str] | None = None) -> Path:
    ap = argparse.ArgumentParser(description="Render the episode's original music bed.")
    ap.add_argument("episode")
    ap.add_argument("--timeline", help="timeline.json to use (default: episodes/<id>/build/timeline.json)")
    ap.add_argument("--config", help="music.json to use (default: episodes/<id>/music.json)")
    ap.add_argument("--out", help="output WAV (default: public/episodes/<id>/stems/music_bed.wav)")
    ap.add_argument("--seed", type=int, default=2024)
    a = ap.parse_args(argv)
    tl = tlmod.load(a.episode, a.timeline)
    cfg = load_config(a.episode, a.config)
    out = Path(a.out) if a.out else public_episode_dir(a.episode) / "stems" / "music_bed.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    print(f"Composing music for {a.episode} ({tl.duration:.1f} s)…")
    audio, report = render(tl, cfg, seed=a.seed)
    sf.write(out, audio, SR, subtype="PCM_24")
    out.with_name("music_plan.json").write_text(json.dumps(report, indent=1))
    print(f"  -> {out}")
    return out


if __name__ == "__main__":
    main()
