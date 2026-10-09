"""Write the YouTube description (chapters from the real timeline, key terms, sources, credits).

    npm run describe -- ep001-enzymes   →   out/<id>/youtube-description.txt
"""
from __future__ import annotations

import json
import re
import sys

from .common import build_dir, episode_dir, out_dir


def stamp(sec: float) -> str:
    s = int(sec)
    return f"{s // 60}:{s % 60:02d}"


def main(ep: str) -> None:
    meta = json.loads((episode_dir(ep) / "meta.json").read_text())
    tl = json.loads((build_dir(ep) / "timeline.json").read_text())
    starts = {s["id"]: s["startSec"] for s in tl["scenes"]}
    chapters = [(0.0 if sid == "S01" else starts[sid], name) for sid, name in meta["chapters"].items() if sid in starts]
    chapters.sort()
    sources = (episode_dir(ep) / "sources.md").read_text()
    links = re.findall(r"^\[([a-z0-9-]+)\]: (\S+)", sources, flags=re.M)
    key_sources = [u for k, u in links if k in {"aqa8461", "cie0610", "wolf2008", "switala", "koshland", "statpearls", "sme-aqa", "cooper"}]
    lines = [
        meta["hook"],
        "",
        "Chapters",
        *[f"{stamp(t)} {name}" for t, name in chapters],
        "",
        "Key terms: " + ", ".join(meta["keyTerms"]) + ".",
        "",
        meta["coverage"],
        "",
        "Every claim in this video is fact-checked. Main sources:",
        *[f"• {u}" for u in key_sources],
        "",
        "Narration: AI voice (Kokoro, Apache-2.0). Animation, music and sound effects: original, made for this channel.",
        "",
        " ".join("#" + t.replace(" ", "") for t in meta["tags"][:3]),
    ]
    out = out_dir(ep) / "youtube-description.txt"
    out.write_text("\n".join(lines) + "\n")
    print(out.read_text())


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: npm run describe -- <episode-id>")
    main(sys.argv[1])
