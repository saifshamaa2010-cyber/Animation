import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S20 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s20Timing = (t: CueFns) => ({ end: t.dur });

export const s20Sfx = (t: CueFns): SfxEvent[] => {
  void s20Timing(t);
  return [];
};
