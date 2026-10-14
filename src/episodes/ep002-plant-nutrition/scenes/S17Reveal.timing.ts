import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S17 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s17Timing = (t: CueFns) => ({ end: t.dur });

export const s17Sfx = (t: CueFns): SfxEvent[] => {
  void s17Timing(t);
  return [];
};
