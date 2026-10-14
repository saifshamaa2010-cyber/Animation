import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S16 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s16Timing = (t: CueFns) => ({ end: t.dur });

export const s16Sfx = (t: CueFns): SfxEvent[] => {
  void s16Timing(t);
  return [];
};
