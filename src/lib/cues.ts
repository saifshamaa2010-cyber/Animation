/**
 * Pure timing helpers (no React / browser imports) so Node scripts can use them too,
 * e.g. scripts/sfx-events.ts, which places sound effects on the same frames as the animation.
 */
/** Shape of episodes/<id>/build/timeline.json (written by `npm run align`). */
export type Cue = { readonly sec: number; readonly frame: number };
export type SceneTiming = {
  readonly id: string;
  readonly slug: string;
  readonly startSec: number;
  readonly endSec: number;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly cues: Readonly<Record<string, Cue>>;
};
export type Word = { readonly text: string; readonly startSec: number; readonly endSec: number; readonly scene: string };
export type Timeline = {
  readonly episode: string;
  readonly fps: number;
  readonly durationSec: number;
  readonly durationFrames: number;
  readonly narration: string;
  readonly scenes: readonly SceneTiming[];
  readonly words: readonly Word[];
};

/**
 * Visuals that land a couple of frames BEFORE the sound are perceived as perfectly in sync;
 * landing late feels sluggish. Every cue is nudged earlier by this many frames.
 */
export const SYNC_LEAD = 2;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export type CueFns = {
  /** Frame (scene-relative) where the word after {name} starts. */
  readonly cue: (name: string, offset?: number) => number;
  /** Frame where the n-th occurrence of a spoken word starts. */
  readonly word: (text: string, nth?: number, offset?: number) => number;
  /** Frame where the n-th occurrence of a spoken word ends. */
  readonly wordEnd: (text: string, nth?: number, offset?: number) => number;
  /** Scene length in frames. */
  readonly dur: number;
  readonly scene: SceneTiming;
  readonly fps: number;
};

/** Pure (non-React) cue helpers — used by scenes AND by the SFX event exporter. */
export const cueFns = (scene: SceneTiming, allWords: readonly Word[], fps: number): CueFns => {
  const words = allWords.filter((w) => w.scene === scene.id);
  const find = (text: string, nth: number) => {
    const w = words.filter((x) => norm(x.text) === norm(text))[nth - 1];
    if (!w) throw new Error(`Word "${text}" (#${nth}) not spoken in ${scene.id}`);
    return w;
  };
  return {
    cue: (name, offset = 0) => {
      const c = scene.cues[name];
      if (!c) throw new Error(`Unknown cue "${name}" in ${scene.id}. Known: ${Object.keys(scene.cues).join(", ")}`);
      return c.frame - scene.startFrame - SYNC_LEAD + offset;
    },
    word: (text, nth = 1, offset = 0) => Math.round(find(text, nth).startSec * fps) - scene.startFrame - SYNC_LEAD + offset,
    wordEnd: (text, nth = 1, offset = 0) => Math.round(find(text, nth).endSec * fps) - scene.startFrame + offset,
    dur: scene.endFrame - scene.startFrame,
    scene,
    fps,
  };
};


/** A sound effect placed by a scene (frame is scene-relative). */
export type SfxEvent = { readonly frame: number; readonly sfx: string; readonly gainDb?: number };
