import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S06 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s06Timing = (t: CueFns) => ({ end: t.dur });

export const s06Sfx = (t: CueFns): SfxEvent[] => {
  void s06Timing(t);
  return [];
};
