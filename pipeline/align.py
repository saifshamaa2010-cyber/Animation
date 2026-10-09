"""Step 2: find exactly when every word is spoken, and turn every {cue} into a frame number.

    npm run align -- ep001-enzymes

Runs an offline speech recogniser (NVIDIA Parakeet via sherpa-onnx, runs locally, free) over the
narration, matches what it heard to the script, and writes:
  episodes/<id>/build/timeline.json   — scenes, cue frames and word timings (the animation reads this)
  out/<id>/<id>.srt                   — subtitles in the script's own spelling
"""
from __future__ import annotations

import difflib
import json
import os
import sys

import numpy as np
import soundfile as sf

from .common import FPS, ROOT, build_dir, normalise_word, out_dir, parse_script

ASR_DIR = ROOT / "models" / "asr" / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8"


def recogniser():
    import sherpa_onnx

    d = ASR_DIR
    return sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(d / "encoder.int8.onnx"), decoder=str(d / "decoder.int8.onnx"),
        joiner=str(d / "joiner.int8.onnx"), tokens=str(d / "tokens.txt"),
        num_threads=4, model_type="nemo_transducer", decoding_method="greedy_search",
    )


def asr_words(rec, audio: np.ndarray, sr: int) -> list[dict]:
    s = rec.create_stream()
    s.accept_waveform(sr, audio)
    rec.decode_stream(s)
    r = s.result
    durs = list(getattr(r, "durations", []) or [0.08] * len(r.tokens))
    words: list[dict] = []
    for tok, ts, du in zip(r.tokens, r.timestamps, durs):
        if tok.startswith(" ") or not words:
            words.append({"text": tok.strip(), "start": float(ts), "end": float(ts + du)})
        else:
            words[-1]["text"] += tok
            words[-1]["end"] = float(ts + du)
    return [w for w in words if normalise_word(w["text"])]


def align_scene(script_words: list[str], heard: list[dict], seg_bounds: list[tuple[float, float]]) -> tuple[list[tuple[float, float]], float]:
    """Map every script word to (start, end) seconds. Unmatched words are interpolated."""
    a = [normalise_word(w) for w in script_words]
    b = [normalise_word(w["text"]) for w in heard]
    times: list[tuple[float, float] | None] = [None] * len(a)
    matched = 0
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k]["start"], heard[j1 + k]["end"])
                matched += 1
        elif op == "replace" and j2 > j1:
            # Spread the script words over the heard span, weighted by length.
            t0, t1 = heard[j1]["start"], heard[j2 - 1]["end"]
            lens = np.array([max(1, len(x)) for x in a[i1:i2]], dtype=float)
            edges = t0 + (t1 - t0) * np.concatenate([[0], np.cumsum(lens) / lens.sum()])
            for k in range(i2 - i1):
                times[i1 + k] = (float(edges[k]), float(edges[k + 1]))
    # Fill any gaps by interpolating between neighbours.
    for i in range(len(times)):
        if times[i] is None:
            prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), seg_bounds[0][0] if seg_bounds else 0.0)
            nxt_i = next((j for j in range(i + 1, len(times)) if times[j]), None)
            nxt = times[nxt_i][0] if nxt_i is not None else prev + 0.3 * (len(times) - i)
            span = (nxt - prev) / ((nxt_i if nxt_i is not None else len(times)) - i + 1)
            times[i] = (prev + span * 0.5, prev + span)
    return [t for t in times if t], matched / max(1, len(a))


def refine_to_audio(times: list[tuple[float, float]], audio: np.ndarray, sr: int, thresh_db: float = -38.0) -> list[tuple[float, float]]:
    """The recogniser's clock ticks every 80 ms and can place a word that follows silence a little
    early. Snap any word start that falls in silence forward to where sound actually begins, and
    any word end that falls in silence back to where it stops. Cues sit mostly on sentence starts
    after pauses, so this is where accuracy matters most."""
    hop = int(sr * 0.005)
    win = int(sr * 0.02)
    sq = audio.astype(np.float64) ** 2
    env = np.sqrt(np.convolve(sq, np.ones(win) / win, mode="same"))[::hop]
    voiced = env > 10 ** (thresh_db / 20)
    n = voiced.size

    def idx(t: float) -> int:
        return int(min(n - 1, max(0, round(t * sr / hop))))

    out = []
    for s, e in times:
        i = idx(s)
        if not voiced[i]:
            j = i
            limit = idx(s + 0.6)
            while j < limit and not voiced[j]:
                j += 1
            if voiced[j]:
                s = j * hop / sr
        k = idx(e)
        if not voiced[k]:
            j = k
            limit = idx(e - 0.4)
            while j > limit and not voiced[j]:
                j -= 1
            if voiced[j] and j * hop / sr > s:
                e = j * hop / sr
        out.append((s, max(e, s + 0.05)))
    return out


def srt_time(t: float) -> str:
    ms = int(round(max(0.0, t) * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def make_srt(words: list[dict], max_chars: int = 74, max_dur: float = 6.0) -> str:
    """Readable subtitles: ≤ 2 lines of ≤ 37 chars, broken at sentence ends, commas and pauses."""
    cues: list[list[dict]] = []
    cur: list[dict] = []
    for i, w in enumerate(words):
        if cur:
            text_len = len(" ".join(x["text"] for x in cur + [w]))
            gap = w["startSec"] - cur[-1]["endSec"]
            prev = cur[-1]["text"]
            sentence_end = prev.endswith((".", "?", "!", "…", ":"))
            comma = prev.endswith((",", ";"))
            dur = w["endSec"] - cur[0]["startSec"]
            if (gap > 0.55 or text_len > max_chars or dur > max_dur
                    or (sentence_end and len(cur) >= 2)
                    or (comma and len(" ".join(x["text"] for x in cur)) >= 18)
                    or w["scene"] != cur[-1]["scene"]):
                cues.append(cur)
                cur = []
        cur.append(w)
    if cur:
        cues.append(cur)
    out = []
    for n, c in enumerate(cues, 1):
        text = " ".join(x["text"] for x in c)
        if len(text) > 37:
            mid = len(text) // 2
            spaces = [i for i, ch in enumerate(text) if ch == " "]
            cut = min(spaces, key=lambda i: abs(i - mid)) if spaces else mid
            text = text[:cut] + "\n" + text[cut + 1:]
        start = c[0]["startSec"]
        end = c[-1]["endSec"] + 0.25
        if n < len(cues):
            end = min(end, cues[n][0]["startSec"] - 0.02)
        end = max(end, start + 0.8)
        out.append(f"{n}\n{srt_time(start)} --> {srt_time(end)}\n{text}\n")
    return "\n".join(out)


def main(ep: str) -> None:
    man = json.loads((build_dir(ep) / "narration.json").read_text())
    scenes = {s.id: s for s in parse_script(ep)}
    rec = recogniser()
    timeline = {
        "episode": ep, "fps": FPS, "provider": man["provider"], "voice": man["voice"],
        "narration": f"public/episodes/{ep}/narration.wav", "scenes": [], "words": [],
    }
    worst = 1.0
    for sm in man["scenes"]:
        sc = scenes[sm["id"]]
        off = sm["offsetSec"]
        script_words = [str(i.value) for i in sc.items if i.kind == "word"]
        # word index that follows each cue
        cue_word: dict[str, int] = {}
        wi = 0
        for it in sc.items:
            if it.kind == "word":
                wi += 1
            elif it.kind == "cue":
                cue_word[str(it.value)] = wi
        heard: list[dict] = []
        if script_words:
            audio, sr = sf.read(ROOT / "public" / "episodes" / ep / "narration" / f"{sc.id}.wav", dtype="float32")
            heard = asr_words(rec, audio, sr)
        bounds = [(s["startSec"], s["startSec"] + s.get("durationSec", s.get("pause", 0))) for s in sm["segments"]]
        times, quality = align_scene(script_words, heard, bounds) if script_words else ([], 1.0)
        if script_words:
            times = refine_to_audio(times, audio, sr)
        worst = min(worst, quality)
        print(f"  {sc.id} {sc.slug:14s} {len(script_words):3d} words, {quality * 100:5.1f}% matched exactly")
        words = [
            {"text": w, "startSec": round(off + t[0], 3), "endSec": round(off + t[1], 3), "scene": sc.id}
            for w, t in zip(script_words, times)
        ]
        cues = {}
        end = off + sm["durationSec"]
        for name, idx in cue_word.items():
            sec = words[idx]["startSec"] if idx < len(words) else (words[-1]["endSec"] if words else off)
            cues[name] = {"sec": round(sec, 3), "frame": int(round(sec * FPS))}
        timeline["scenes"].append({
            "id": sc.id, "slug": sc.slug,
            "startSec": round(off, 3), "endSec": round(end, 3),
            "startFrame": int(round(off * FPS)), "endFrame": int(round(end * FPS)),
            "cues": cues,
        })
        timeline["words"].extend(words)
    total = man["scenes"][-1]["offsetSec"] + man["scenes"][-1]["durationSec"]
    timeline["durationSec"] = round(total, 3)
    timeline["durationFrames"] = int(round(total * FPS))
    (build_dir(ep) / "timeline.json").write_text(json.dumps(timeline, indent=1))
    srt = make_srt(timeline["words"])
    (out_dir(ep) / f"{ep}.srt").write_text(srt)
    (build_dir(ep) / f"{ep}.srt").write_text(srt)
    print(f"\nTimeline: {total:.1f} s = {timeline['durationFrames']} frames. Worst scene match {worst * 100:.0f}%.")
    if worst < 0.9:
        print("WARNING: a scene matched below 90% — check pronunciation of unusual words in pipeline/tts/lexicon.json")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: npm run align -- <episode-id>")
    os.chdir(ROOT)
    main(sys.argv[1])
