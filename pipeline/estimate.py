"""Provisional timing, with NO voice at all.

    npm run estimate -- ep002-plant-nutrition

Until a human narrator has recorded the script, the animation is timed to an estimate of a natural
human reading pace (about 150 words a minute, with breaths at commas and full stops, plus every
[pause N] in the script). Writes the same files the real pipeline writes, so the animation can be
built and previewed:
  episodes/<id>/build/timeline.json     — scenes, cue frames, word timings (provider "estimate")
  episodes/<id>/build/<id>.srt          — read-along captions for the preview
  episodes/<id>/recording-script.md     — the clean read-aloud script for the narrator
  public/episodes/<id>/narration.wav    — silence of the right length (placeholder, no voice)

When the real recording arrives, `npm run human -- <id> <file>` + `npm run align -- <id>` replace all
of this with the narrator's real timings, and every animation cue follows automatically.
"""
from __future__ import annotations

import json
import os
import re
import sys

import numpy as np
import soundfile as sf

from .common import FPS, build_dir, episode_dir, parse_script, public_dir
from .align import make_srt

# Calibrated to ~150 spoken words per minute for typical narration text.
WORD_BASE = 0.12
PER_LETTER = 0.047
PAUSE_COMMA = 0.24
PAUSE_STOP = 0.5
PAUSE_COLON = 0.32
SCENE_TAIL = 0.45
LETTER_NAMES = {"c", "o", "h"}  # "C O two" — letters read as names take longer


def word_dur(w: str) -> float:
    core = re.sub(r"[^A-Za-z0-9]", "", w)
    if core.lower() in LETTER_NAMES:
        return 0.34
    return WORD_BASE + PER_LETTER * len(core)


def after_word(w: str) -> float:
    if w.endswith((".", "?", "!")):
        return PAUSE_STOP
    if w.endswith((":", ";")):
        return PAUSE_COLON
    if w.endswith(","):
        return PAUSE_COMMA
    return 0.0


def recording_script(ep: str, scenes) -> str:
    lines = [
        f"# Read-aloud script — {ep}",
        "",
        "Read this out loud, in one take or several. Talk the way you'd explain it to a friend: warm,",
        "unhurried, and curious. **Don't rush.** If you stumble, stop, take a breath and read the whole",
        "sentence again from its start. Mistakes are edited out afterwards, so never start the take over.",
        "",
        "**(pause N)** means stay silent for about N seconds. The long silence in Scene 14 is the",
        "\"pause and predict\" moment: count to four in your head.",
        "",
        "Recording tips: a quiet room with soft furnishings (a wardrobe full of clothes is perfect), phone",
        "about a hand-span from your mouth, slightly to one side, Voice Memos / Recorder app, best quality.",
        "Do a 10-second test first and listen back with headphones.",
        "",
    ]
    for sc in scenes:
        words = []
        for it in sc.items:
            if it.kind == "word":
                words.append(str(it.value))
            elif it.kind == "pause" and float(it.value) >= 1.0:
                words.append(f"**(pause {float(it.value):g})**")
        if not any(not x.startswith("**") for x in words):
            lines += [f"## Scene {sc.id[1:]} — {sc.slug}", "", "_(no speech — music only)_", ""]
            continue
        lines += [f"## Scene {sc.id[1:]} — {sc.slug}", "", " ".join(words), ""]
    return "\n".join(lines)


def main(ep: str) -> None:
    scenes = parse_script(ep)
    timeline = {
        "episode": ep, "fps": FPS, "provider": "estimate", "voice": "none (estimated human pace)",
        "narration": f"public/episodes/{ep}/narration.wav", "scenes": [], "words": [],
    }
    t = 0.0
    for sc in scenes:
        start = t
        pending: list[str] = []
        cues: dict[str, dict] = {}
        n_words = 0
        for it in sc.items:
            if it.kind == "cue":
                pending.append(str(it.value))
            elif it.kind == "pause":
                t += float(it.value)
            else:
                w = str(it.value)
                for c in pending:
                    cues[c] = {"sec": round(t, 3), "frame": int(round(t * FPS))}
                pending = []
                d = word_dur(w)
                timeline["words"].append({"text": w, "startSec": round(t, 3), "endSec": round(t + d, 3), "scene": sc.id})
                t += d + after_word(w)
                n_words += 1
        for c in pending:  # trailing cues
            cues[c] = {"sec": round(t, 3), "frame": int(round(t * FPS))}
        if n_words:
            t += SCENE_TAIL
        timeline["scenes"].append({
            "id": sc.id, "slug": sc.slug, "startSec": round(start, 3), "endSec": round(t, 3),
            "startFrame": int(round(start * FPS)), "endFrame": int(round(t * FPS)), "cues": cues,
        })
    timeline["durationSec"] = round(t, 3)
    timeline["durationFrames"] = int(round(t * FPS))
    b = build_dir(ep)
    (b / "timeline.json").write_text(json.dumps(timeline, indent=1))
    (b / f"{ep}.srt").write_text(make_srt(timeline["words"]))
    (episode_dir(ep) / "recording-script.md").write_text(recording_script(ep, scenes))
    sf.write(public_dir(ep) / "narration.wav", np.zeros(int(t * 24000) + 1, dtype=np.float32), 24000, subtype="PCM_16")
    words = len(timeline["words"])
    print(f"Estimated: {words} words, {t:.1f} s ({t / 60:.2f} min), {words / (t / 60):.0f} words/min incl. pauses")
    for s in timeline["scenes"]:
        print(f"  {s['id']} {s['slug']:14s} {s['endSec'] - s['startSec']:6.1f} s")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: npm run estimate -- <episode-id>")
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    main(sys.argv[1])
