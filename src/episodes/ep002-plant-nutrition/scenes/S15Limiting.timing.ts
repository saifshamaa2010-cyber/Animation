import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S15 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s15Timing = (t: CueFns) => ({ end: t.dur });

export const s15Sfx = (t: CueFns): SfxEvent[] => {
  void s15Timing(t);
  return [];
};
