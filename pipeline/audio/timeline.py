"""Reading the narration timeline (episodes/<id>/build/timeline.json) and turning references such as
"S05.break", "S09.end-4" or "S09.lastWordEnd" into seconds."""
from __future__ import annotations

import json
import re
import warnings
from dataclasses import dataclass
from pathlib import Path

from .paths import resolve, timeline_path

_REF = re.compile(r"^\s*(S\d+)\.([A-Za-z0-9_]+)\s*(?:([+-])\s*([0-9.]+))?\s*$")


@dataclass
class Timeline:
    data: dict
    path: Path

    @property
    def episode(self) -> str:
        return self.data["episode"]

    @property
    def duration(self) -> float:
        return float(self.data["durationSec"])

    @property
    def fps(self) -> int:
        return int(self.data.get("fps", 30))

    @property
    def scenes(self) -> list[dict]:
        return self.data["scenes"]

    @property
    def words(self) -> list[dict]:
        return self.data.get("words", [])

    def scene(self, sid: str) -> dict | None:
        return next((s for s in self.scenes if s["id"] == sid), None)

    @property
    def narration_path(self) -> Path:
        return resolve(self.data["narration"])

    def time(self, ref: str | float | int | None, warn: bool = True) -> float | None:
        """Resolve "S05.break" (a cue), "S05.start", "S05.end", "S05.lastWordEnd", "S05.firstWord",
        optionally with "+0.5" / "-4" seconds. Numbers pass straight through. Unknown refs -> None."""
        if ref is None:
            return None
        if isinstance(ref, (int, float)):
            return float(ref)
        m = _REF.match(ref)
        if not m:
            if warn:
                warnings.warn(f"Can't read the time reference '{ref}' (expected e.g. 'S05.break' or 'S09.end-4').")
            return None
        sid, name, sign, off = m.groups()
        sc = self.scene(sid)
        if sc is None:
            if warn:
                warnings.warn(f"'{ref}': scene {sid} is not in the timeline.")
            return None
        t: float | None
        if name == "start":
            t = float(sc["startSec"])
        elif name == "end":
            t = float(sc["endSec"])
        elif name in ("lastWordEnd", "firstWord"):
            ws = [w for w in self.words if w.get("scene") == sid]
            if not ws:
                t = None
            else:
                t = float(ws[-1]["endSec"]) if name == "lastWordEnd" else float(ws[0]["startSec"])
        else:
            cue = sc.get("cues", {}).get(name)
            t = float(cue["sec"]) if cue else None
        if t is None:
            if warn:
                warnings.warn(f"'{ref}': no such cue in scene {sid} — skipped.")
            return None
        if sign:
            t += float(off) * (1 if sign == "+" else -1)
        return t


def load(ep: str | None = None, path: str | Path | None = None) -> Timeline:
    p = Path(path) if path else timeline_path(ep)
    if not p.exists():
        raise SystemExit(f"No timeline at {p}. Run the narration steps first: npm run narrate -- {ep} && npm run align -- {ep}")
    data = json.loads(p.read_text())
    for k in ("episode", "durationSec", "scenes", "narration"):
        if k not in data:
            raise SystemExit(f"{p} is missing '{k}'.")
    data["scenes"] = sorted(data["scenes"], key=lambda s: s["startSec"])
    return Timeline(data, p)
