# Audio engine (sound effects, music, final mix)

Everything you hear apart from the narrator is **made by this code**: no samples, no downloads, no
stock music. That means the channel owns it outright and there is no Content ID risk.

## The one command

After the narration steps (`npm run narrate -- <id>` then `npm run align -- <id>`):

```
.venv/bin/python -m pipeline.audio.build ep001-enzymes
```

It takes about 3 minutes and writes:

| File | What it is |
|---|---|
| `public/episodes/<id>/mix.wav` | **The finished soundtrack** (voice + music + effects). 48 kHz stereo, −14 LUFS, true peak ≤ −1 dBTP. The video uses this. |
| `public/episodes/<id>/stems/narration.wav`, `music.wav`, `sfx.wav` | The three layers exactly as mixed, for fixes later. |
| `public/episodes/<id>/stems/music_bed.wav` | The music before it was dipped under the voice. |
| `public/episodes/<id>/mix_report.json` | The numbers: loudness, true peak, how far the music sits under the voice, where every effect landed. |

In Remotion, play only `staticFile("episodes/<id>/mix.wav")` as the episode's audio.

## What you can change without touching code

- **`episodes/<id>/sfx.json`**: which sound plays on which cue. One line per effect:
  `{ "cue": "S05.break", "sfx": "snip", "offsetSec": 0.0, "gainDb": -3 }`
  - `cue` is `Scene.cueName` from the script (`S05.break`), or `S09.start` / `S09.end`.
  - `offsetSec` shifts it (negative = earlier). `gainDb` makes it louder (+) or quieter (−).
  - For a sound that lasts a while (the heat sizzle) add `"untilCue": "S09.pauseNow"` or
    `"durationSec": 3`.
  - A cue that doesn't exist is reported as a warning and skipped. Nothing crashes.
- **Frame-exact effects from the animation**: when a scene's code lists its own effects
  (`src/episodes/<id>/scenes/sfx.ts`, exported by `npx tsx scripts/sfx-events.ts <id>` to
  `episodes/<id>/build/sfx-events.json`), the mixer uses those for that scene, timed to the exact
  frame the visual happens, and ignores `sfx.json`'s lines for that scene (nothing plays twice).
  `sfx.json` still covers every scene the animation doesn't export. If the export is older than
  `timeline.json`, the mixer warns you to re-export it.
- **`episodes/<id>/music.json`**: the music plan. For each scene (and optionally from a cue onwards):
  the chords, how intense and bright it is, and which instruments play (`arp`, `bell`, `motif`,
  `sub`). The `dropout` event makes the music go almost silent under the pause-and-predict moment.

## The sound effects

`public/audio/sfx/` (rebuild with `.venv/bin/python -m pipeline.audio.sfx`):

| Name | Used for |
|---|---|
| `pop_bind` | substrate docking in the active site (soft wooden/glassy "tock") |
| `snip` | a bond breaking (crisp tick with a tiny sparkle) |
| `bonk_misfit` | "doesn't fit" (muted felt bump and rebound) |
| `whoosh_zoom` / `whoosh_soft` | the big zoom / small transitions |
| `crunch`, `crunch_b` | cracker bites (two variants so two bites never sound identical) |
| `shimmer_sweet` | "it tastes sweet" (rising bells in the music's key: the amber motif) |
| `chime_title` | title (two warm notes, A then D) |
| `card_in`, `strike` | myth card sliding in, marker strike-through |
| `bubbles` | oxygen bubbles (physically modelled) |
| `sizzle_heat` | heat crackle bed (3 s, loops seamlessly) |
| `tick`, `tock` | pause-and-predict countdown |
| `ui_blip` | very soft blip when a key-term label appears |

## How the mix behaves

- The voice stays dead centre with light clean-up (rumble filter, gentle leveller).
- The music **dips automatically whenever the narrator speaks**. It starts dipping ~150 ms before
  each phrase, so the first word is never masked, and rises back gently (~600 ms) in pauses. Short
  gaps between words are ignored, so it doesn't "pump".
- While speaking, the music is held well under the voice (rule: at least 15 dB; the report shows
  the actual numbers). If any passage gets too close, the mixer turns the music down further.
- Effects are set relative to the voice and then nudged by `gainDb`.
- The final level is −14 LUFS with a true-peak limiter (−1 dBTP, checked with 4× oversampling).

## Testing

`.venv/bin/python -m pipeline.audio.test.run_test` builds a **mock** timeline and a fake,
speech-like narration (`pipeline/audio/test/make_mock.py`), runs the whole engine, checks loudness,
peaks, ducking, effect timing and the music dropout, and draws level plots in
`pipeline/audio/test/out/`. The mock voice is a buzzy synthetic placeholder, not a real voice.

## Files

| File | Job |
|---|---|
| `build.py` | the one command (SFX → music → mix) |
| `sfx.py` | the sound-effect library |
| `music.py`, `theory.py`, `synth.py` | the composer: chord plan and voice leading, instruments |
| `mix.py`, `loudness.py` | ducking, effect placement, loudness and true-peak limiting |
| `dsp.py`, `reverb.py` | shared building blocks (filters, oscillators, synthesised reverb) |
| `timeline.py`, `paths.py` | reading `timeline.json`, cue references, file locations |
