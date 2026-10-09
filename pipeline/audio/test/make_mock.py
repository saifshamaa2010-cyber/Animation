"""Build a realistic MOCK timeline + placeholder 'speech-like' narration for testing the audio engine
before the real narration exists.

    .venv/bin/python -m pipeline.audio.test.make_mock [episode-id]

Writes pipeline/audio/test/mock_timeline.json (same format as episodes/<id>/build/timeline.json) and
pipeline/audio/test/out/mock_narration.wav (mono, 24 kHz). The 'voice' is synthetic: glottal pulses
through vowel formant filters with syllable-rate loudness changes and consonant hiss — enough to
behave like speech for ducking and loudness tests. It is NOT a real voice.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

from ..paths import ROOT, episode_dir

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
MOCK_TIMELINE = HERE / "mock_timeline.json"
MOCK_NARRATION = OUT / "mock_narration.wav"
SR = 24_000
FPS = 30
TOKEN = re.compile(r"\{(?P<cue>[A-Za-z0-9_]+)\}|\[pause (?P<pause>[0-9.]+)\]|(?P<word>[^\s{}\[\]]+)")

# rough British female TTS formants for a handful of vowels (F1, F2, F3)
VOWELS = [(800, 1250, 2600), (450, 2100, 2800), (350, 2400, 3000), (550, 950, 2500), (380, 900, 2400), (650, 1700, 2600)]


def parse_script(ep: str):
    scenes, cur = [], None
    for line in (episode_dir(ep) / "script.md").read_text().splitlines():
        m = re.match(r"^## (S\d+)\s+(\S+)", line)
        if m:
            cur = {"id": m.group(1), "slug": m.group(2), "items": []}
            scenes.append(cur)
            continue
        if cur is None or line.startswith((">", "#")):
            continue
        for t in TOKEN.finditer(line):
            if t.group("cue"):
                cur["items"].append(("cue", t.group("cue")))
            elif t.group("pause"):
                cur["items"].append(("pause", float(t.group("pause"))))
            else:
                cur["items"].append(("word", t.group("word")))
    return scenes


def syllables(word: str) -> int:
    w = re.sub(r"[^a-z]", "", word.lower())
    return max(1, len(re.findall(r"[aeiouy]+", w)) - (1 if w.endswith("e") and len(w) > 3 else 0))


def build(ep: str = "ep001-enzymes", seed: int = 3):
    rng = np.random.default_rng(seed)
    scenes = parse_script(ep)
    t = 0.0
    tl_scenes, words, events = [], [], []  # events: (start, dur, n_syll, f0_start, f0_end, kind)
    for sc in scenes:
        start = t
        pending_cues: list[str] = []
        cues = {}
        prev_word_end_punct = None
        in_speech = False
        for kind, val in sc["items"]:
            if kind == "cue":
                pending_cues.append(val)
            elif kind == "pause":
                if in_speech:
                    t += 0.12  # TTS tail kept by the narrator pipeline
                    in_speech = False
                t += float(val)
            else:
                if not in_speech:
                    t += 0.03  # TTS lead
                    in_speech = True
                elif prev_word_end_punct:
                    t += {",": 0.2, ";": 0.25, ":": 0.28, ".": 0.42, "?": 0.45, "!": 0.42, "…": 0.5}.get(prev_word_end_punct, 0.04)
                else:
                    t += rng.uniform(0.01, 0.05)
                n = syllables(val)
                dur = 0.085 + 0.13 * n + rng.normal(0, 0.02)
                for c in pending_cues:
                    cues[c] = {"sec": round(t, 3), "frame": int(round(t * FPS))}
                pending_cues = []
                words.append({"text": val, "startSec": round(t, 3), "endSec": round(t + dur, 3), "scene": sc["id"]})
                events.append((t, dur, n, val))
                t += dur
                prev_word_end_punct = val[-1] if val[-1] in ",;:.?!…" else None
        if in_speech:
            t += 0.12
        for c in pending_cues:  # cues with no word after them sit at the scene end
            cues[c] = {"sec": round(t, 3), "frame": int(round(t * FPS))}
        tl_scenes.append({"id": sc["id"], "slug": sc["slug"], "startSec": round(start, 3), "endSec": round(t, 3),
                          "startFrame": int(round(start * FPS)), "endFrame": int(round(t * FPS)), "cues": cues})
    timeline = {
        "episode": ep, "fps": FPS, "provider": "mock", "voice": "synthetic-placeholder",
        "narration": str(MOCK_NARRATION.relative_to(ROOT)),
        "durationSec": round(t, 3), "durationFrames": int(round(t * FPS)),
        "scenes": tl_scenes, "words": words,
    }
    audio = synth_speech(events, t, rng)
    return timeline, audio


def synth_speech(events, total: float, rng) -> np.ndarray:
    n_total = int(np.ceil(total * SR)) + SR
    out = np.zeros(n_total)
    sentence_pos = 0
    for (t0, dur, nsyl, text) in events:
        n = int(dur * SR)
        tt = np.arange(n) / SR
        # intonation: gentle declination through each sentence, small rise on questions
        f0 = 205 - 6 * min(sentence_pos, 8) + 10 * np.sin(np.pi * tt / dur) + rng.normal(0, 4)
        if text.endswith("?"):
            f0 = f0 + 40 * (tt / dur) ** 2
        sentence_pos = 0 if text[-1] in ".?!…" else sentence_pos + 1
        jitter = 1 + 0.01 * signal.lfilter([1], [1, -0.995], rng.standard_normal(n)) * 0.05
        ph = np.cumsum(f0 * jitter) / SR
        glottal = (np.mod(ph, 1.0) * 2 - 1)  # buzzy source
        glottal = signal.lfilter([1], [1, -0.9], glottal)  # spectral tilt
        voiced = np.zeros(n)
        F = VOWELS[rng.integers(len(VOWELS))]
        for k, fc in enumerate(F):
            bw = 80 + 40 * k
            r = np.exp(-np.pi * bw / SR)
            th = 2 * np.pi * fc / SR
            voiced += signal.lfilter([1 - r], [1, -2 * r * np.cos(th), r * r], glottal) * (1.0 / (k + 1))
        # syllable loudness pattern
        syl = np.clip(np.sin(np.pi * (tt / dur * nsyl) % np.pi), 0, 1) ** 0.7
        syl *= np.minimum(1, np.minimum(tt / 0.02, (dur - tt) / 0.03))
        x = voiced * syl * rng.uniform(0.7, 1.0)
        # consonant hiss at the start and/or end of some words
        for where in (0, 1):
            if rng.random() < 0.45:
                m = int(rng.uniform(0.04, 0.08) * SR)
                h = signal.sosfilt(signal.butter(2, (3000, 7500), "bandpass", fs=SR, output="sos"), rng.standard_normal(m))
                h *= np.hanning(m) * 0.15
                if where == 0:
                    x[:m] += h[:min(m, n)]
                else:
                    x[-m:] += h[-min(m, n):]
        i = int(t0 * SR)
        out[i:i + n] += x
    out = out[: int(np.ceil(total * SR))]
    # level like a TTS file: speech peaks around -3 dBFS
    out *= 10 ** (-3 / 20) / (np.max(np.abs(out)) + 1e-12)
    return out.astype(np.float32)


def main(ep: str = "ep001-enzymes") -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    timeline, audio = build(ep)
    MOCK_TIMELINE.write_text(json.dumps(timeline, indent=1))
    sf.write(MOCK_NARRATION, audio, SR, subtype="PCM_16")
    print(f"Mock timeline: {timeline['durationSec']:.1f} s, {len(timeline['words'])} words -> {MOCK_TIMELINE.relative_to(ROOT)}")
    print(f"Mock narration -> {MOCK_NARRATION.relative_to(ROOT)}")


def ensure() -> None:
    """Create the mock files if they're missing (the WAV is not checked in)."""
    if not MOCK_TIMELINE.exists() or not MOCK_NARRATION.exists():
        main(json.loads(MOCK_TIMELINE.read_text())["episode"] if MOCK_TIMELINE.exists() else "ep001-enzymes")


if __name__ == "__main__":
    main(*(sys.argv[1:2]))
