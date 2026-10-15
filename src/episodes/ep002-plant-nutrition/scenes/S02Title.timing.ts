import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * S02 key moments. The title is a 3-second silence in the narration (no cues), so its beats are placed
 * as fractions of the scene: the photon lands, the words rise, the subtitle settles, and it all clears
 * before S03 focuses in.
 */
export const s02Timing = (t: CueFns) => {
  const dur = t.dur;
  const land = Math.round(Math.min(22, dur * 0.24));
  const words = Math.round(Math.min(12, dur * 0.13));
  const subtitle = Math.round(Math.min(34, dur * 0.38));
  const out = dur - 14;
  return { land, words, subtitle, out, end: dur };
};

export const s02Sfx = (t: CueFns): SfxEvent[] => {
  const k = s02Timing(t);
  return [{ frame: k.words, sfx: "chime_title", gainDb: -3 }];
};
