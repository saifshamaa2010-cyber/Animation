# Biology explainer channel — production project

This folder makes the channel's animated videos. It's built with **Remotion**: each video is
written as code (React + TypeScript), which means every shape, colour and movement is exact,
reusable, and re-renders identically every time.

You don't need to read the code. The parts you'll actually touch are plain-text files.

## What's where

| Folder / file | What it is |
|---|---|
| `CLAUDE.md` | The channel rules (style, script, fact-checking, audio, check-ins). Future episodes follow these. |
| `episodes/<id>/script.md` | The narration script. Edit the words here. |
| `episodes/<id>/storyboard.md` | What happens on screen, beat by beat. |
| `episodes/<id>/sources.md` | Every fact in the script and where it was checked. |
| `episodes/<id>/storyboard/` | Style frames (key frames as images) and the thumbnail concept. |
| `LICENCES.md` | Every font, voice, music track and sound effect, with its licence. |
| `.env.example` | Template for settings and API keys. Copy it to `.env` (which is never uploaded). |
| `src/brand/` | The channel's colours, font and motion settings. |
| `src/components/` | Reusable building blocks: the enzyme, sugar chains, labels, thermometer, graphs, myth cards… Future episodes reuse these. |
| `src/episodes/<id>/` | The scenes for one episode. |

## Preview on your own computer

1. Install [Node.js](https://nodejs.org) (version 20 or newer).
2. In this folder run `npm install` once.
3. Run `npm run dev`. A browser tab opens with Remotion Studio, where you can scrub through scenes.

## How an episode gets made

1. Research → script → storyboard → **check-in**.
2. Narration is generated first (free local voice while building), then speech recognition finds the exact
   time of every word, and the animation is timed to those words. The voice is never sped up to fit.
3. A ~20-second test scene → **check-in** (you judge the voice).
4. Full animation, music and sound effects → render → quality check → **check-in** with a contact sheet.
5. Deliverables: MP4, narration audio, `.srt` subtitles, thumbnail.
