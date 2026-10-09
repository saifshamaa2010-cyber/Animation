"""Where things live. Every path is resolved from the repository root, so commands work from any folder."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SR = 48_000  # every audio file this engine writes is 48 kHz

SFX_DIR = ROOT / "public" / "audio" / "sfx"


def episode_dir(ep: str) -> Path:
    return ROOT / "episodes" / ep


def timeline_path(ep: str) -> Path:
    return episode_dir(ep) / "build" / "timeline.json"


def public_episode_dir(ep: str) -> Path:
    return ROOT / "public" / "episodes" / ep


def resolve(p: str | Path) -> Path:
    """Paths inside timeline.json / json configs are relative to the repository root."""
    p = Path(p)
    return p if p.is_absolute() else ROOT / p
