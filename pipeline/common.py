"""Shared helpers for the narration pipeline: paths, .env loading, script parsing."""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30


def load_env() -> None:
    """Minimal .env loader (KEY=VALUE lines). Real environment variables win."""
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def episode_dir(ep: str) -> Path:
    return ROOT / "episodes" / ep


def build_dir(ep: str) -> Path:
    d = episode_dir(ep) / "build"
    d.mkdir(parents=True, exist_ok=True)
    return d


def public_dir(ep: str) -> Path:
    d = ROOT / "public" / "episodes" / ep
    d.mkdir(parents=True, exist_ok=True)
    return d


def out_dir(ep: str) -> Path:
    d = ROOT / "out" / ep
    d.mkdir(parents=True, exist_ok=True)
    return d


# --- Script parsing -----------------------------------------------------------

TOKEN = re.compile(r"\{(?P<cue>[A-Za-z0-9_]+)\}|\[pause (?P<pause>[0-9.]+)\]|(?P<word>[^\s{}\[\]]+)")


@dataclass
class Item:
    kind: str  # "word" | "cue" | "pause"
    value: str | float


@dataclass
class Scene:
    id: str
    slug: str
    items: list[Item] = field(default_factory=list)

    def segments(self) -> list:
        """Split into spoken segments and pauses: [ ("text", items), 0.4, ("text", items) … ].
        Cues sitting right before a pause stay attached to the next spoken segment."""
        out: list = []
        cur: list[Item] = []
        for it in self.items:
            if it.kind == "pause":
                if any(i.kind == "word" for i in cur):
                    out.append((" ".join(str(i.value) for i in cur if i.kind == "word"), cur))
                    cur = []
                out.append(float(it.value))
            else:
                cur.append(it)
        if any(i.kind == "word" for i in cur):
            out.append((" ".join(str(i.value) for i in cur if i.kind == "word"), cur))
        elif cur:
            out.append(("", cur))  # trailing cues with no words (end of scene)
        return out


def parse_script(ep: str) -> list[Scene]:
    text = (episode_dir(ep) / "script.md").read_text()
    scenes: list[Scene] = []
    cur: Scene | None = None
    for line in text.splitlines():
        m = re.match(r"^## (S\d+)\s+(\S+)", line)
        if m:
            cur = Scene(m.group(1), m.group(2))
            scenes.append(cur)
            continue
        if cur is None or line.startswith(">") or line.startswith("#"):
            continue
        for t in TOKEN.finditer(line):
            if t.group("cue"):
                cur.items.append(Item("cue", t.group("cue")))
            elif t.group("pause"):
                cur.items.append(Item("pause", float(t.group("pause"))))
            else:
                cur.items.append(Item("word", t.group("word")))
    return scenes


def tts_text(text: str, lexicon: dict[str, str]) -> str:
    """Apply pronunciation respellings to the text sent to the voice (subtitles keep the original)."""
    out = text
    for k, v in sorted(lexicon.items(), key=lambda kv: -len(kv[0])):
        out = re.sub(rf"(?<![A-Za-z]){re.escape(k)}(?![A-Za-z])", v, out)
    return out


def load_lexicon(provider: str) -> dict[str, str]:
    path = ROOT / "pipeline" / "tts" / "lexicon.json"
    data = json.loads(path.read_text()) if path.exists() else {}
    lex = dict(data.get("all", {}))
    lex.update(data.get(provider, {}))
    return lex


NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6",
    "seven": "7", "eight": "8", "nine": "9", "ten": "10", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90",
    "hundred": "100", "thirty-seven": "37",
}
SPELLING = {"molds": "moulds", "mold": "mould", "color": "colour"}


def normalise_word(w: str) -> str:
    w = w.lower().replace("’", "'").replace("–", "-").replace("—", "-")
    w = re.sub(r"[^a-z0-9'-]", "", w).strip("-'")
    w = NUMBER_WORDS.get(w, w)
    return SPELLING.get(w, w)
