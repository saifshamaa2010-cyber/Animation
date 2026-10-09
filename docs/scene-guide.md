# Building a scene (EP001 and later episodes)

Read `CLAUDE.md` first (style, motion and text rules). Then study the two reference scenes — they set
the quality bar: `src/episodes/ep001-enzymes/scenes/S05ActiveSite.tsx` (+ `.timing.ts`) and
`S04Enzyme.tsx` (+ `.timing.ts`).

## How timing works
- `episodes/ep001-enzymes/script.md` has `{cue}` markers; `episodes/ep001-enzymes/build/timeline.json`
  has the real narration times. **Never hard-code seconds.**
- In a scene: `const sc = useScene(); const { f } = sc;` — `f` is the scene-relative frame (negative
  during the 9-frame transition in). `sc.cue("name")` → frame where the word after `{name}` starts.
  `sc.word("text", nth)` → frame where the nth occurrence of a spoken word starts; `sc.wordEnd(...)`.
  `sc.dur` = scene length in frames. Cues/words already lead the audio by 2 frames (perceived sync).
- Put every key moment in `SXXName.timing.ts` as a pure function `sXXTiming(t: CueFns)` and the sound
  effects as `sXXSfx(t: CueFns): SfxEvent[]` built from the SAME moments. That file must import only
  `../../../lib/cues` (no React/Remotion) because a Node script evaluates it.
- Available SFX names: `pop_bind` (substrate docks), `snip` (bond breaks), `whoosh_zoom` (scale zoom),
  `whoosh_soft` (gentle move/transition), `tick` (countdown), `crunch` (bite), `shimmer_sweet` (turns sweet),
  `bonk_misfit` (doesn't fit), `sizzle_heat` (3 s heat bed), `bubbles` (oxygen), `card_in` (myth card),
  `strike` (strike-through), `chime_title` (title), `ui_blip` (very soft label tick). Use `gainDb`
  (0 = normal, −6 = subtle). Only meaningful events — at most one SFX every ~2 s on average.

## Building blocks (use these; don't reinvent)
- Layout: `Stage` (background + full-frame 1920×1080 SVG). `bg={{tone:"ink"|"warm"|"heat"|"cold", particles, temperature, lightX, lightY}}`.
- Camera: `camAt(f, keys)` + `<g transform={camTransform(cam)}>`; labels go OUTSIDE the camera group at
  screen positions from `toScreen(cam, worldPoint)` so type stays a constant size.
- Motion: `track(f, [[frame, value, ease?], …])`, `prog(f, start, len, ease?)`, `window01(f, a, b, fade)`,
  `pulse(f, start, len)`; easing tokens `EASE.out/in/inOut/snap`. Thermal jiggle: `jit(seed, f, amp)`,
  `jitTransform`, `blendJit`, `thermalAmplitude(°C)`.
- Molecules: `Enzyme` (props: open, denature, unfold, showSite, bonds, bondsBroken, temperature/still,
  palette teal|violet, variant, lod), `SugarChain` + `dockedChain(n, ex, ey, s, {offset, cellulose, wave, tone})`
  + `moveRings`. The pocket geometry matches the glucose rings exactly (see S05 for docking/snapping).
- Diagrams: `Thermometer`, `Graph` (+ `rateVsTemperature`, `bell`), `MythCard`, `PausePredict`,
  `SweetnessMeter`, `Scrim`, `Label` (leader-line label), `Keyword` (centred key term), `Cracker`, `Crumb`,
  icons in `components/Icons.tsx`.
- Hand-made kit `src/components/kit/` (see its README): hand-drawn circle/underline/arrow/cross/tick/
  bracket/strike-through, Stopwatch, Hourglass, ScaleBar, Counter (rolling digits), WordEquation, PHScale,
  CellOutline, molecule glyphs (H₂O₂, O₂, H₂O), lock & key, FocusPull, DepthMolecules (blurred foreground
  molecules for depth). Use hand-drawn marks sparingly: one per idea, on the key term or result.

## Rules that reviewers will check
1. Every movement explains something. Camera moves only for scale changes or to shift focus. No idle
   decoration, no spinning, no random zooms. But never more than ~2 s with nothing changing on screen.
2. On-screen text: ≤ 6 words at once, Lexend, ≥ 40 px, inside the 100 px safe area, never clipped, and
   it appears on the word that says it. Labels fade when no longer needed.
3. Colours only from `src/brand/tokens.ts`. Teal = amylase, violet = other enzymes, amber glow = sweet,
   coral = heat/danger/myth, cream = starch, paper = text/diagrams.
4. Scientific accuracy as in `episodes/ep001-enzymes/sources.md` (visual accuracy notes at the bottom).
5. Deterministic: `rng(seed)` from `lib/geometry`, never `Math.random`. No CSS animations.
6. Scene start and end must connect with neighbours (see the continuity notes in your brief).

## Checking your work
```
npx tsc --noEmit
npx tsx scripts/frames.ts ep001-SXX count:12 out/qa/SXX      # renders 12 frames + contact sheet
npx tsx scripts/frames.ts ep001-SXX 120,240 out/qa/SXX-b     # specific frames
```
Open `out/qa/SXX/contact-sheet.jpg` (and individual frames) with the Read tool and judge them like a
picky motion designer. Iterate until it looks crafted, not generated.
