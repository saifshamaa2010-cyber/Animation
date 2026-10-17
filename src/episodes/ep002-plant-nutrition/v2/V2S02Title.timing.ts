import type { CueFns } from "../../../lib/cues";

/**
 * EP002 v2 · S02 key moments. The title is a silence in the narration (no cues), so its beats are
 * fractions of the scene: sprouts and sun, the title words, the subtitle, then Chloro pops up and waves.
 * Pure TS (no React): the scene and its sound effects both read it.
 */
export const v2s02Timing = (t: CueFns) => {
  const dur = t.dur;
  const at = (frac: number, max: number) => Math.round(Math.min(max, dur * frac));
  return {
    sprouts: 0,
    sun: at(0.05, 5),
    words: at(0.1, 9),
    subtitle: at(0.27, 24),
    chloro: at(0.36, 32),
    hello: at(0.52, 47),
    end: dur,
  };
};
