import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S11 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s11Timing = (t: CueFns) => ({ end: t.dur });

export const s11Sfx = (t: CueFns): SfxEvent[] => {
  void s11Timing(t);
  return [];
};
