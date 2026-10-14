import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S14 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s14Timing = (t: CueFns) => ({ end: t.dur });

export const s14Sfx = (t: CueFns): SfxEvent[] => {
  void s14Timing(t);
  return [];
};
