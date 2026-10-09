"""Step 1 of the pipeline: turn script.md into narration audio.

    npm run narrate -- ep001-enzymes

Writes public/episodes/<id>/narration/<scene>.wav, public/episodes/<id>/narration.wav (whole episode)
and episodes/<id>/build/narration.json (which text is where). The voice is never sped up or
time-stretched: the animation is timed to whatever the voice naturally does.
"""
from __future__ import annotations

import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

from .common import build_dir, load_env, load_lexicon, parse_script, public_dir, tts_text
from .tts.providers import get_provider

SR = 24000
LEAD = 0.03  # seconds kept before the first sound of a segment
TAIL = 0.12  # seconds kept after the last sound


def trim(audio: np.ndarray, sr: int, thresh_db: float = -45.0) -> np.ndarray:
    """Remove the silence a TTS engine adds at the start/end of a clip (never touches the speech)."""
    if audio.size == 0:
        return audio
    win = max(1, int(sr * 0.01))
    env = np.sqrt(np.convolve(audio.astype(np.float64) ** 2, np.ones(win) / win, mode="same"))
    loud = np.where(env > 10 ** (thresh_db / 20))[0]
    if loud.size == 0:
        return audio[:0]
    a = max(0, loud[0] - int(LEAD * sr))
    b = min(audio.size, loud[-1] + int(TAIL * sr))
    return audio[a:b]


def to_sr(audio: np.ndarray, sr: int) -> np.ndarray:
    if sr == SR:
        return audio
    g = np.gcd(sr, SR)
    return resample_poly(audio, SR // g, sr // g).astype(np.float32)


def main(ep: str) -> None:
    load_env()
    provider = get_provider()
    lexicon = load_lexicon(provider.name)
    scenes = parse_script(ep)
    pub = public_dir(ep)
    (pub / "narration").mkdir(exist_ok=True)

    manifest = {"episode": ep, "provider": provider.name, "voice": provider.voice_id(), "sampleRate": SR, "scenes": []}
    full: list[np.ndarray] = []
    offset = 0.0
    for sc in scenes:
        parts: list[np.ndarray] = []
        segs = []
        t = 0.0
        for seg in sc.segments():
            if isinstance(seg, float):
                parts.append(np.zeros(int(seg * SR), dtype=np.float32))
                segs.append({"pause": seg, "startSec": round(t, 4)})
                t += seg
                continue
            text, _items = seg
            if not text:
                continue
            spoken = tts_text(text, lexicon)
            audio, sr = provider.synthesize(spoken)
            audio = trim(to_sr(audio, sr), SR)
            parts.append(audio)
            dur = audio.size / SR
            segs.append({"text": text, "ttsText": spoken, "startSec": round(t, 4), "durationSec": round(dur, 4)})
            t += dur
            print(f"  {sc.id} {dur:5.2f}s  {text[:70]}{'…' if len(text) > 70 else ''}")
        scene_audio = np.concatenate(parts) if parts else np.zeros(1, dtype=np.float32)
        f = pub / "narration" / f"{sc.id}.wav"
        sf.write(f, scene_audio, SR, subtype="PCM_16")
        dur = scene_audio.size / SR
        manifest["scenes"].append({
            "id": sc.id, "slug": sc.slug, "file": str(f.relative_to(pub.parent.parent.parent)),
            "offsetSec": round(offset, 4), "durationSec": round(dur, 4), "segments": segs,
        })
        full.append(scene_audio)
        offset += dur

    allaudio = np.concatenate(full)
    peak = float(np.max(np.abs(allaudio))) or 1.0
    if peak > 0.98:  # only ever turn DOWN to avoid clipping; never change timing
        allaudio = allaudio * (0.98 / peak)
    sf.write(pub / "narration.wav", allaudio, SR, subtype="PCM_16")
    (build_dir(ep) / "narration.json").write_text(json.dumps(manifest, indent=2))
    print(f"\nNarration: {offset:.1f} s ({offset / 60:.2f} min) with {provider.name}/{provider.voice_id()}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("usage: npm run narrate -- <episode-id>")
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    main(sys.argv[1])
