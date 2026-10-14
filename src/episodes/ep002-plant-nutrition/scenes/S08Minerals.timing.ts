import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S08 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s08Timing = (t: CueFns) => ({ end: t.dur });

export const s08Sfx = (t: CueFns): SfxEvent[] => {
  void s08Timing(t);
  return [];
};
