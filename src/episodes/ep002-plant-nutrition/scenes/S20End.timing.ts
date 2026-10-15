import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * S20 key moments: a 7-second end card (music only, no narration cues). The title holds, the three
 * chips arrive, energy flows light → chlorophyll → glucose twice, then everything fades to ink.
 * The lower half stays empty for YouTube's end-screen tiles.
 */
export const s20Timing = (t: CueFns) => {
  const dur = t.dur;
  const chips = 6;
  const flow = 34;
  const period = 70;
  const fade = dur - 28;
  // only whole cycles that finish before the fade
  const cycles = Math.max(0, Math.floor((fade - flow) / period));
  return { chips, flow, period, cycles, fade, end: dur };
};

export const s20Sfx = (t: CueFns): SfxEvent[] => {
  void s20Timing(t);
  return []; // music carries the end card
};
