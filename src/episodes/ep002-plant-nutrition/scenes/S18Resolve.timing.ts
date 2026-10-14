import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S18 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s18Timing = (t: CueFns) => ({ end: t.dur });

export const s18Sfx = (t: CueFns): SfxEvent[] => {
  void s18Timing(t);
  return [];
};
