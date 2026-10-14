import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S19 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s19Timing = (t: CueFns) => ({ end: t.dur });

export const s19Sfx = (t: CueFns): SfxEvent[] => {
  void s19Timing(t);
  return [];
};
