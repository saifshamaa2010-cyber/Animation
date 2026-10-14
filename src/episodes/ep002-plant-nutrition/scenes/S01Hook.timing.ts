import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S01 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s01Timing = (t: CueFns) => ({ end: t.dur });

export const s01Sfx = (t: CueFns): SfxEvent[] => {
  void s01Timing(t);
  return [];
};
