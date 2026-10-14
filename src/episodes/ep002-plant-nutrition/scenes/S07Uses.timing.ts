import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S07 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s07Timing = (t: CueFns) => ({ end: t.dur });

export const s07Sfx = (t: CueFns): SfxEvent[] => {
  void s07Timing(t);
  return [];
};
