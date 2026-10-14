import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S02 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s02Timing = (t: CueFns) => ({ end: t.dur });

export const s02Sfx = (t: CueFns): SfxEvent[] => {
  void s02Timing(t);
  return [];
};
