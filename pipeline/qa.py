"""Quality check a rendered episode before anyone sees it.

    npm run qa -- ep001-enzymes

Checks the final MP4 in out/<id>/:
  • format: 1920×1080, 30 fps, H.264 + AAC, duration matches the narration timeline
  • loudness: integrated LUFS (target −14), true peak (≤ −1 dBTP), loudness range
  • A/V sync: cross-correlates the MP4's audio with the narration to measure any offset
  • voice vs music: how far the music sits under the voice while speaking
  • dead air: black frames, and frozen stretches longer than 2.5 s (nothing moving on screen)
  • contact sheet: one frame every N seconds, labelled with time and scene
Writes out/<id>/qa-report.md and out/<id>/contact-sheet.jpg.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import correlate, resample_poly

from .common import ROOT, build_dir, out_dir


def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.stdout + p.stderr


def probe(mp4: Path) -> dict:
    out = run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(mp4)])
    return json.loads(out)


def loudness(mp4: Path) -> dict:
    out = run(["ffmpeg", "-nostats", "-i", str(mp4), "-filter_complex", "ebur128=peak=true", "-f", "null", "-"])
    tail = out[out.rfind("Summary:"):]
    get = lambda key: float(re.search(rf"{key}:\s+(-?[\d.]+)", tail).group(1))  # noqa: E731
    return {"I": get("I"), "LRA": get("LRA"), "TP": get("Peak")}


def audio_of(mp4: Path, sr: int = 24000) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(mp4), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def sync_offset(mix: np.ndarray, narr: np.ndarray, sr: int) -> float:
    """Offset (s) of the narration inside the mix, from the envelope cross-correlation of the first 60 s."""
    n = min(len(mix), len(narr), sr * 60)
    env = lambda a: np.abs(a[:n]) - np.abs(a[:n]).mean()  # noqa: E731
    c = correlate(env(mix), env(narr), mode="full", method="fft")
    lag = int(np.argmax(c)) - (n - 1)
    return lag / sr


def voice_music_gap(ep: str, words: list[dict]) -> float | None:
    stems = ROOT / "public" / "episodes" / ep / "stems"
    nf, mf = stems / "narration.wav", stems / "music.wav"
    if not (nf.exists() and mf.exists()):
        return None
    n, sr = sf.read(nf, dtype="float32")
    m, sr2 = sf.read(mf, dtype="float32")
    n = n.mean(axis=1) if n.ndim > 1 else n
    m = m.mean(axis=1) if m.ndim > 1 else m
    if sr2 != sr:
        m = resample_poly(m, sr, sr2)
    gaps = []
    for w in words[::5]:
        a, b = int(w["startSec"] * sr), int(w["endSec"] * sr)
        if b - a < sr * 0.08 or b > len(n) or b > len(m):
            continue
        rn = np.sqrt(np.mean(n[a:b] ** 2)) + 1e-9
        rm = np.sqrt(np.mean(m[a:b] ** 2)) + 1e-9
        gaps.append(20 * np.log10(rn / rm))
    return float(np.median(gaps)) if gaps else None


def dead_air(mp4: Path) -> tuple[list[str], list[str]]:
    blk = run(["ffmpeg", "-i", str(mp4), "-vf", "blackdetect=d=0.4:pix_th=0.06", "-an", "-f", "null", "-"])
    frz = run(["ffmpeg", "-i", str(mp4), "-vf", "freezedetect=n=0.0008:d=2.5", "-an", "-f", "null", "-"])
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", blk)
    starts = re.findall(r"freeze_start: ([\d.]+)", frz)
    ends = re.findall(r"freeze_end: ([\d.]+)", frz)
    return [f"{float(a):.1f}–{float(b):.1f} s" for a, b in blacks], [
        f"{float(a):.1f}–{float(b):.1f} s" for a, b in zip(starts, ends + ["end"] * (len(starts) - len(ends)))
        if b != "end"
    ] + [f"{float(a):.1f} s → end" for a in starts[len(ends):]]


def contact_sheet(mp4: Path, out: Path, timeline: dict, every: float = 7.5, cols: int = 6) -> Path:
    dur = timeline["durationSec"]
    times = np.arange(every / 2, dur, every)
    tmp = out / "qa-frames"
    tmp.mkdir(exist_ok=True)
    tiles = []
    for i, t in enumerate(times):
        scene = next((s for s in timeline["scenes"] if s["startSec"] <= t < s["endSec"]), timeline["scenes"][-1])
        label = f"{int(t // 60)}\\:{t % 60:04.1f}  {scene['id']} {scene['slug']}"
        f = tmp / f"t{i:03d}.jpg"
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(mp4), "-frames:v", "1",
            "-vf", f"scale=400:225,pad=400:255:0:0:color=0x08111E,drawtext=text='{label}':x=8:y=232:fontsize=16:fontcolor=0xCFC8BC",
            str(f),
        ])
        tiles.append(f)
    rows = int(np.ceil(len(tiles) / cols))
    sheet = out / "contact-sheet.jpg"
    inputs = []
    for f in tiles:
        inputs += ["-i", str(f)]
    blank_n = cols * rows - len(tiles)
    if blank_n:
        inputs += ["-f", "lavfi", "-i", "color=c=0x08111E:s=400x255:d=1"]
    streams = "".join(f"[{i if i < len(tiles) else len(tiles)}:v]" for i in range(cols * rows))
    layout = "|".join(f"{(i % cols) * 400}_{(i // cols) * 255}" for i in range(cols * rows))
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", f"{streams}xstack=inputs={cols * rows}:layout={layout}", "-frames:v", "1", "-q:v", "3", str(sheet)])
    return sheet


def main(ep: str) -> None:
    out = out_dir(ep)
    mp4 = out / f"{ep}.mp4"
    if not mp4.exists():
        raise SystemExit(f"{mp4} not found — render first (npm run render -- {ep})")
    tl = json.loads((build_dir(ep) / "timeline.json").read_text())
    report: list[str] = [f"# QA report — {ep}", ""]
    ok = True

    def check(cond: bool, text: str) -> None:
        nonlocal ok
        ok &= cond
        report.append(f"- {'✅' if cond else '❌'} {text}")

    info = probe(mp4)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    fps = eval(v["r_frame_rate"])  # noqa: S307 (ffprobe fraction)
    dur = float(info["format"]["duration"])
    report.append("## Format")
    check(v["width"] == 1920 and v["height"] == 1080, f"resolution {v['width']}×{v['height']}")
    check(abs(fps - 30) < 0.01, f"frame rate {fps:.2f} fps")
    check(v["codec_name"] == "h264" and a is not None and a["codec_name"] == "aac", f"codecs {v['codec_name']} + {a['codec_name'] if a else 'NO AUDIO'}")
    check(abs(dur - tl["durationSec"]) < 0.5, f"duration {dur:.2f} s (timeline {tl['durationSec']:.2f} s)")

    report.append("\n## Loudness (YouTube normalises to about −14 LUFS)")
    L = loudness(mp4)
    check(-15.0 <= L["I"] <= -13.0, f"integrated loudness {L['I']:.1f} LUFS (target −14 ±1)")
    check(L["TP"] <= -0.9, f"true peak {L['TP']:.1f} dBTP (must be ≤ −1)")
    report.append(f"- ℹ️ loudness range {L['LRA']:.1f} LU")

    report.append("\n## Sync")
    sr = 24000
    mix = audio_of(mp4, sr)
    narr, nsr = sf.read(ROOT / tl["narration"], dtype="float32")
    if nsr != sr:
        narr = resample_poly(narr, sr, nsr).astype(np.float32)
    off = sync_offset(mix, narr, sr)
    check(abs(off) <= 1 / 30 + 0.005, f"narration offset inside the video: {off * 1000:+.0f} ms (≤ 1 frame)")
    gap = voice_music_gap(ep, tl["words"])
    if gap is not None:
        check(gap >= 15, f"voice sits {gap:.1f} dB above the music while speaking (≥ 15 dB)")

    report.append("\n## Dead air")
    blacks, freezes = dead_air(mp4)
    allowed_black = [b for b in blacks if not b.startswith("0.0")]
    check(len(allowed_black) == 0, f"black frames: {', '.join(blacks) if blacks else 'none'}")
    report.append(f"- {'✅' if not freezes else '⚠️'} frozen > 2.5 s: {', '.join(freezes) if freezes else 'none'}")

    report.append("\n## On-screen text (≥ 40 px, inside the 100 px safe area, never cut off)")
    audit = out / "text-audit.md"
    if audit.exists():
        rows = [r for r in audit.read_text().splitlines() if r.startswith("| ") and not r.startswith("| Text")]
        check(not rows, f"text audit: {len(rows)} problem(s){' (see text-audit.md)' if rows else ''}")
        report.extend(f"  {r}" for r in rows[:30])
    else:
        report.append("- ⚠️ text audit not run (npm run textaudit -- ep001 every:15 out/<id>/text-audit.md)")

    sheet = contact_sheet(mp4, out, tl)
    report.append(f"\nContact sheet: `{sheet.relative_to(ROOT)}`")
    report.append(f"\n**Overall: {'PASS' if ok else 'NEEDS WORK'}**")
    (out / "qa-report.md").write_text("\n".join(report) + "\n")
    print("\n".join(report))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: npm run qa -- <episode-id>")
    main(sys.argv[1])
