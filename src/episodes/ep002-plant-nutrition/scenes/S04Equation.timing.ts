import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S04 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s04Timing = (t: CueFns) => ({ end: t.dur });

export const s04Sfx = (t: CueFns): SfxEvent[] => {
  void s04Timing(t);
  return [];
};
