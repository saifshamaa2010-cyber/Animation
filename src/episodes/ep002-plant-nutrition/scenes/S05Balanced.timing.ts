import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S05 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s05Timing = (t: CueFns) => ({ end: t.dur });

export const s05Sfx = (t: CueFns): SfxEvent[] => {
  void s05Timing(t);
  return [];
};
