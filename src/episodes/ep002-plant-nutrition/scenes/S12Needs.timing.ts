import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S12 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s12Timing = (t: CueFns) => ({ end: t.dur });

export const s12Sfx = (t: CueFns): SfxEvent[] => {
  void s12Timing(t);
  return [];
};
