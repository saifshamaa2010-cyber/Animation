"""One command for the whole audio step of an episode:

    .venv/bin/python -m pipeline.audio.build <episode-id>

1. makes any missing sound effects   -> public/audio/sfx/*.wav
2. composes the music bed            -> public/episodes/<id>/stems/music_bed.wav
3. mixes narration + music + SFX     -> public/episodes/<id>/mix.wav (+ stems, mix_report.json)

Options:
  --timeline PATH   use a different timeline.json (e.g. the test mock)
  --out-dir DIR     write the mix somewhere else (default public/episodes/<id>/)
  --reuse-music     keep an existing music bed instead of re-composing it
  --regen-sfx       rebuild every sound effect, not just missing ones
  --no-sfx-events   ignore episodes/<id>/build/sfx-events.json (the animation's frame-exact export)
                    and place effects from sfx.json only
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import soundfile as sf

from . import mix as mixmod
from . import music as musicmod
from . import sfx as sfxlib
from . import timeline as tlmod
from .paths import SR, episode_dir, public_episode_dir


def run(episode: str, timeline: str | None = None, out_dir: str | None = None, reuse_music: bool = False,
        regen_sfx: bool = False, music_config: str | None = None, sfx_config: str | None = None,
        sfx_events: str | None = None, use_sfx_events: bool = True) -> dict:
    t0 = time.time()
    tl = tlmod.load(episode, timeline)
    out = Path(out_dir) if out_dir else public_episode_dir(episode)
    (out / "stems").mkdir(parents=True, exist_ok=True)

    todo = list(sfxlib.REGISTRY) if regen_sfx else sfxlib.missing()
    if todo:
        print(f"[1/3] Sound effects: making {len(todo)}")
        sfxlib.write_all(todo)
    else:
        print("[1/3] Sound effects: all present")

    bed = out / "stems" / "music_bed.wav"
    if reuse_music and bed.exists():
        print(f"[2/3] Music: reusing {bed}")
    else:
        print(f"[2/3] Music: composing {tl.duration:.1f} s")
        cfg = musicmod.load_config(episode, music_config)
        audio, report = musicmod.render(tl, cfg)
        sf.write(bed, audio, SR, subtype="PCM_24")
        bed.with_name("music_plan.json").write_text(json.dumps(report, indent=1))

    print("[3/3] Mixing")
    entries = mixmod.load_sfx_list(Path(sfx_config) if sfx_config else episode_dir(episode) / "sfx.json")
    ev_path = (Path(sfx_events) if sfx_events else tl.path.parent / "sfx-events.json") if use_sfx_events else None
    entries, notes = mixmod.merge_sfx(entries, ev_path, tl.path)
    report = mixmod.mix(tl, bed, entries, out, sfx_notes=notes)
    print(f"\nDone in {time.time() - t0:.0f} s.")
    return report


def main(argv: list[str] | None = None) -> dict:
    ap = argparse.ArgumentParser(description="SFX + music + final mix for one episode.")
    ap.add_argument("episode")
    ap.add_argument("--timeline")
    ap.add_argument("--out-dir")
    ap.add_argument("--reuse-music", action="store_true")
    ap.add_argument("--regen-sfx", action="store_true")
    ap.add_argument("--music-config")
    ap.add_argument("--sfx-config")
    ap.add_argument("--sfx-events", help="animation-exported effects (default: next to timeline.json)")
    ap.add_argument("--no-sfx-events", action="store_true", help="use sfx.json only")
    a = ap.parse_args(argv)
    return run(a.episode, a.timeline, a.out_dir, a.reuse_music, a.regen_sfx, a.music_config, a.sfx_config,
               a.sfx_events, not a.no_sfx_events)


if __name__ == "__main__":
    main()
