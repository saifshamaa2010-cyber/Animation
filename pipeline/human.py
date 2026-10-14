"""Use a REAL HUMAN recording as the narration (no text-to-speech anywhere).

    npm run human -- ep002-plant-nutrition recordings/take1.m4a [recordings/take2.m4a ...]
    npm run align -- ep002-plant-nutrition

The narrator reads `episodes/<id>/recording-script.md` into a phone: one take or several files, any
format ffmpeg can open (m4a, mp3, wav, aac…). This step:
  1. converts and joins the files, removes rumble below 75 Hz (nothing else is done to the voice),
  2. listens to the take with the local speech recogniser and matches it to the script,
  3. cuts out stumbles and re-reads (stretches of speech that aren't in the script, where the
     narrator went back and read the sentence again),
  4. splits it into one file per scene, and makes sure every [pause N] in the script is at least
     N seconds of silence (pauses are only ever added, the voice itself is never sped up,
     slowed down or stretched),
  5. writes the same files `npm run narrate` would, so `npm run align` and everything after it
     work unchanged.
"""
from __future__ import annotations

import difflib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfiltfilt

from .align import asr_words, recogniser
from .common import ROOT, build_dir, normalise_word, parse_script, public_dir

SR = 24000
LEAD = 0.15  # seconds of room tone kept before a scene's first word


def load(path: str) -> np.ndarray:
    with tempfile.TemporaryDirectory() as d:
        wav = Path(d) / "x.wav"
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_f32le", str(wav)], check=True)
        a, _ = sf.read(wav, dtype="float32")
    return a


def env_db(a: np.ndarray, win: float = 0.02) -> np.ndarray:
    n = max(1, int(SR * win))
    e = np.sqrt(np.convolve(a.astype(np.float64) ** 2, np.ones(n) / n, mode="same")) + 1e-9
    return 20 * np.log10(e / (np.max(e) + 1e-9))


def chunks(a: np.ndarray, max_len: float = 18.0) -> list[tuple[int, int]]:
    """Split at the quietest moments so no chunk is longer than the recogniser likes."""
    db = env_db(a)
    out, s = [], 0
    step = int(max_len * SR)
    while s < a.size:
        if a.size - s <= step:
            out.append((s, a.size))
            break
        lo, hi = s + int(step * 0.55), s + step
        cut = lo + int(np.argmin(db[lo:hi]))
        out.append((s, cut))
        s = cut
    return out


def heard_words(a: np.ndarray) -> list[dict]:
    rec = recogniser()
    words: list[dict] = []
    for s, e in chunks(a):
        for w in asr_words(rec, a[s:e], SR):
            words.append({"text": w["text"], "start": w["start"] + s / SR, "end": w["end"] + s / SR})
    return words


def main(ep: str, files: list[str]) -> None:
    parts = [load(f) for f in files]
    gap = np.zeros(int(0.6 * SR), dtype=np.float32)
    audio = np.concatenate([x for p in parts for x in (p, gap)])
    audio = sosfiltfilt(butter(4, 75, "highpass", fs=SR, output="sos"), audio).astype(np.float32)
    total = audio.size / SR
    print(f"Recording: {len(files)} file(s), {total:.1f} s. Listening…")

    heard = heard_words(audio)
    scenes = parse_script(ep)
    # Flatten the script: every word, which scene it is in, and the pause (if any) that follows it.
    flat: list[dict] = []
    lead_pause: dict[str, float] = {}
    for sc in scenes:
        for it in sc.items:
            if it.kind == "word":
                flat.append({"text": str(it.value), "scene": sc.id, "pause": 0.0})
            elif it.kind == "pause":
                if flat and flat[-1]["scene"] == sc.id:
                    flat[-1]["pause"] += float(it.value)
                else:
                    lead_pause[sc.id] = lead_pause.get(sc.id, 0.0) + float(it.value)

    a = [normalise_word(w["text"]) for w in flat]
    b = [normalise_word(w["text"]) for w in heard]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    times: list[tuple[float, float] | None] = [None] * len(flat)
    cuts: list[tuple[float, float]] = []
    times_before_restart: dict[int, float] = {}  # first-attempt start of each script word
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k]["start"], heard[j1 + k]["end"])
        elif op == "replace":
            t0, t1 = heard[j1]["start"], heard[j2 - 1]["end"]
            for k in range(i2 - i1):
                f0 = k / (i2 - i1)
                f1 = (k + 1) / (i2 - i1)
                times[i1 + k] = (t0 + (t1 - t0) * f0, t0 + (t1 - t0) * f1)
        elif op == "insert" and j2 - j1 >= 2:
            n = j2 - j1
            before = a[max(0, i1 - n):i1]
            if i1 >= 2 and difflib.SequenceMatcher(None, before, b[j1:j2], autojunk=False).ratio() >= 0.6:
                # A restart: the narrator stumbled and re-read the sentence. Keep the LATER attempt:
                # re-time those script words to it, and cut the earlier attempt.
                k0 = max(0, i1 - n)
                inner = difflib.SequenceMatcher(None, before, b[j1:j2], autojunk=False)
                for op2, x1, x2, y1, y2 in inner.get_opcodes():
                    if op2 == "equal":
                        for q in range(x2 - x1):
                            times[k0 + x1 + q] = (heard[j1 + y1 + q]["start"], heard[j1 + y1 + q]["end"])
                if times[k0]:
                    cuts.append((times_before_restart.get(k0, times[k0][0]) - 0.05, heard[j1]["start"] - 0.08))
            else:
                # Speech that isn't in the script at all (an aside, a cough-word). Cut it.
                nxt = heard[j2]["start"] if j2 < len(heard) else heard[j2 - 1]["end"] + 0.3
                cuts.append((heard[j1]["start"] - 0.05, nxt - 0.08))
        if op != "insert":
            for k in range(i1, i2):
                if times[k] and k not in times_before_restart:
                    times_before_restart[k] = times[k][0]
    # Interpolate anything the recogniser missed.
    for i in range(len(times)):
        if times[i] is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
            nj = next((j for j in range(i + 1, len(times)) if times[j]), None)
            nxt = times[nj][0] if nj is not None else prev + 0.4
            span = (nxt - prev) / ((nj if nj is not None else len(times)) - i + 1)
            times[i] = (prev + span * 0.5, prev + span)
    matched = sum(1 for op in sm.get_opcodes() if op[0] == "equal" for _ in range(op[2] - op[1])) / max(1, len(flat))
    print(f"Matched {matched * 100:.1f}% of script words exactly; {len(cuts)} stumble(s) cut.")

    def piece(t0: float, t1: float) -> np.ndarray:
        """Audio between t0 and t1 with any stumbles removed."""
        t0, t1 = max(0.0, t0), min(total, t1)
        segs, t = [], t0
        for c0, c1 in sorted(cuts):
            if c1 <= t or c0 >= t1:
                continue
            if c0 > t:
                segs.append(audio[int(t * SR):int(c0 * SR)])
            t = max(t, c1)
        if t < t1:
            segs.append(audio[int(t * SR):int(t1 * SR)])
        return np.concatenate(segs) if segs else np.zeros(0, dtype=np.float32)

    def silence(sec: float) -> np.ndarray:
        return np.zeros(int(max(0.0, sec) * SR), dtype=np.float32)

    pub = public_dir(ep)
    (pub / "narration").mkdir(exist_ok=True)
    man = {"episode": ep, "provider": "human", "voice": "human narrator", "sampleRate": SR, "scenes": []}
    full, offset = [], 0.0
    idx_by_scene: dict[str, list[int]] = {}
    for i, w in enumerate(flat):
        idx_by_scene.setdefault(w["scene"], []).append(i)
    for si, sc in enumerate(scenes):
        ids = idx_by_scene.get(sc.id, [])
        out: list[np.ndarray] = [silence(lead_pause.get(sc.id, 0.0))]
        if ids:
            later = [idx_by_scene[s.id][0] for s in scenes[si + 1:] if idx_by_scene.get(s.id)]
            end = times[later[0]][0] - LEAD if later else min(total, times[ids[-1]][1] + 0.6)
            t = times[ids[0]][0] - LEAD
            for k, i in enumerate(ids):
                nxt = times[ids[k + 1]][0] - 0.05 if k + 1 < len(ids) else end
                if flat[i]["pause"] > 0:
                    w_end = times[i][1] + 0.05
                    out.append(piece(t, w_end))
                    natural = len(piece(w_end, nxt)) / SR
                    out.append(silence(flat[i]["pause"] - natural))
                    t = w_end
            out.append(piece(t, end))
        scene_audio = np.concatenate(out) if out else silence(0.04)
        f = pub / "narration" / f"{sc.id}.wav"
        sf.write(f, scene_audio, SR, subtype="PCM_16")
        dur = scene_audio.size / SR
        man["scenes"].append({"id": sc.id, "slug": sc.slug, "file": str(f.relative_to(ROOT)), "offsetSec": round(offset, 4),
                              "durationSec": round(dur, 4), "segments": [{"text": "(human take)", "startSec": 0.0, "durationSec": round(dur, 4)}]})
        full.append(scene_audio)
        offset += dur
        print(f"  {sc.id} {sc.slug:14s} {dur:6.1f} s")
    allaudio = np.concatenate(full)
    peak = float(np.max(np.abs(allaudio))) or 1.0
    if peak > 0.98:
        allaudio = allaudio * (0.98 / peak)
    sf.write(pub / "narration.wav", allaudio, SR, subtype="PCM_16")
    (build_dir(ep) / "narration.json").write_text(json.dumps(man, indent=2))
    print(f"\nNarration: {offset:.1f} s ({offset / 60:.2f} min), human voice. Next: npm run align -- {ep}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("usage: npm run human -- <episode-id> <recording> [more recordings…]")
    files = [str(Path(f).resolve()) for f in sys.argv[2:]]
    os.chdir(ROOT)
    main(sys.argv[1], files)
