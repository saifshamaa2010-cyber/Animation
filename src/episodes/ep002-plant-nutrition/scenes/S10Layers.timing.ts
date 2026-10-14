import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S10 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s10Timing = (t: CueFns) => ({ end: t.dur });

export const s10Sfx = (t: CueFns): SfxEvent[] => {
  void s10Timing(t);
  return [];
};
