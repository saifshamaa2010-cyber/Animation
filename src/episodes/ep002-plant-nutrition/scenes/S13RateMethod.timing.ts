import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S13 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s13Timing = (t: CueFns) => ({ end: t.dur });

export const s13Sfx = (t: CueFns): SfxEvent[] => {
  void s13Timing(t);
  return [];
};
