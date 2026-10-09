# Channel rules — faceless biology explainer channel

These rules apply to every episode. Read them before touching a script, a scene or a render.
The owner is not a programmer: make technical decisions yourself, explain them in plain English,
and never leave them a half-finished pipeline to operate.

## Audience and format

- Audience: GCSE / IGCSE students (UK-style curriculum, ages ~14–16) plus curious adults.
- Length: 4–5 minutes. 1920×1080, 30 fps, MP4 (H.264 + AAC).
- Spelling and terminology: British English ("colour", "optimum", "denatured"). Use the exact
  exam-board terms (active site, substrate, enzyme–substrate complex, denatured, optimum…) and
  explain each one the first time it appears.
- One episode at a time. Never start the next episode unless the owner asks.

## Script rules

- Write to be **spoken**, not read: short sentences, contractions, direct address ("you"),
  rhetorical questions, one idea per sentence. Read every line aloud in your head.
- Structure: cold-open **hook** (an everyday mystery) → explanation → **resolve the hook** at the end.
- Every episode has exactly one **"pause and predict"** moment (a real silent pause, with an
  on-screen prompt) and busts at least one common **myth / exam mistake**.
- When using a model or analogy (lock and key, etc.), say out loud that it is a simplification.
- **Fact-check every claim.** Each factual sentence must map to an entry in the episode's
  `sources.md`. If a number cannot be verified, cut it or soften it ("millions" not "4.7 million").
  Prefer: exam-board specifications, university/NCBI/peer-reviewed sources, then reputable
  education sites. Note any caveats or disagreements between sources.
- Script lives in `episodes/<id>/script.md`. Narration text is plain prose with:
  - `{cueName}` — an animation cue. It is silent; the pipeline converts it to the exact frame
    the next word is spoken. Animate to cues, never to guessed timings.
  - `[pause 1.5]` — inserted silence in seconds (used for the pause-and-predict moment, scene
    breathing room and the title).

## Visual identity ("Soft Lab")

All design values live in `src/brand/tokens.ts`. Use the tokens; do not invent new colours.

- Deep ink-blue backgrounds, soft radial light, faint film grain.
- Flat vector shapes with one soft gradient, a thin **rim light** on the upper edge and a soft
  contact shadow. Rounded geometry. No outlines-heavy clip-art, no photos, no stock footage.
- Restrained palette: teal = the episode's main enzyme, amber = sugars/substrate,
  coral = heat/danger, violet = secondary enzymes, paper white = text and diagram lines.
- Type: Lexend only. Headline ≥ 84 px, labels ≥ 40 px at 1080p. Labels, not paragraphs:
  never more than ~6 words of on-screen text at once. No walls of text, no bullet slides.
- Keep key content 100 px inside the frame edges (safe area).
- Original look only. Do not copy any other channel's style, characters, mascots or designs
  (e.g. no Kurzgesagt-style birds, long flat shadows or their colour schemes).

## Motion rules

- **Every movement must explain something.** No decorative spinning, no random zooms or
  camera shake. Camera moves are only for changes of scale (macro → molecular) or to shift focus.
- Molecules jiggle with smooth noise because molecules really do (thermal motion). Jiggle
  amplitude scales with temperature — that *is* the explanation in temperature scenes.
- Entrances: ease-out (`EASE.out`), settles: gentle spring, no cartoon overshoot except a single
  "snap" when a bond breaks. Labels draw on with a leader line, then fade off when no longer needed.
- Drive everything from `useCurrentFrame()`. No CSS transitions/animations.

## Reusable components

Shared building blocks live in `src/components/` (Enzyme, SugarChain, Label, Thermometer,
RateGraph, PHScale, MythCard, PausePredict, Background, …). Extend them with props rather than
copying them into an episode. Episode-specific scenes live in `src/episodes/<id>/`.

## Production pipeline (always in this order)

1. **Research + script + storyboard** → check in with the owner. No narration or animation yet.
2. **Narration first**: `npm run narrate -- <id>` (TTS → per-scene WAV), then
   `npm run align -- <id>` (speech recognition → word timestamps → `timeline.json` with every
   cue's frame). The animation is timed to this real audio.
   - **Never speed the voice up or time-stretch it to fit.** Change the animation or the script.
3. Build a ~20-second test scene with real narration → check in (owner judges the voice).
4. Animate all scenes against `timeline.json` (follow `docs/scene-guide.md`), then
   `npm run audio -- <id>` (SFX placed from each scene's own timing + original music + mix) and
   `npm run render -- <id>`.
5. **QA before showing anyone**: `npm run qa -- <id>` — inspect frames, A/V sync at cue points,
   loudness (target −14 LUFS integrated, true peak ≤ −1 dBTP, music ≥ 15 dB under the voice),
   no clipped text, no frames outside safe area. Then make a contact sheet and report honestly
   what is weak.
6. Deliverables per episode in `out/<id>/`: final MP4, narration audio (WAV), `.srt` subtitles,
   thumbnail concept PNG.

## Voice (TTS)

- The provider is swappable: set `TTS_PROVIDER` in `.env` (see `.env.example`). Default while
  building is the free, local, Apache-2.0 **Kokoro** voice.
- Before the owner pays for anything, present 2–3 options with prices and whether their licence
  allows use on a **monetised** YouTube channel.
- API keys go in `.env` only. Never in code, never committed. `.env` is git-ignored.

## Audio

- Music and SFX must be royalty-free and safe for monetised YouTube. Record **every** asset in
  `LICENCES.md` (source, author, licence, link, date). Prefer assets we synthesise ourselves
  (fully owned, no Content ID risk).
- Music sits well under the voice and ducks while the narrator speaks. SFX are subtle and only
  mark meaningful events (a bond breaking, a substrate binding).

## Check-ins with the owner

1. After script + storyboard.  2. After a 20-second test scene with real narration.
3. After the full render — QA it yourself first, then show a contact sheet and list what is weak.
