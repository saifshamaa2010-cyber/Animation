import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S09 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s09Timing = (t: CueFns) => ({ end: t.dur });

export const s09Sfx = (t: CueFns): SfxEvent[] => {
  void s09Timing(t);
  return [];
};
