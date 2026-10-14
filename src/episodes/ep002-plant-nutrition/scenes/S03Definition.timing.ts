import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S03 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s03Timing = (t: CueFns) => ({ end: t.dur });

export const s03Sfx = (t: CueFns): SfxEvent[] => {
  void s03Timing(t);
  return [];
};
