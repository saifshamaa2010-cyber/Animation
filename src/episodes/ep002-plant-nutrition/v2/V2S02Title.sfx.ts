// EP002 v2 · S02 sound effects, placed from the scene timing (pure TS: also evaluated in Node).
import type { CueFns, SfxEvent } from "../../../lib/cues";
import { v2s02Timing } from "./V2S02Title.timing";

export const sfx = (t: CueFns): SfxEvent[] => {
  const k = v2s02Timing(t);
  return [
    { frame: k.words, sfx: "chime_title", gainDb: -6 }, // "Plant nutrition" rises into place
    { frame: k.chloro + 2, sfx: "pop_bind", gainDb: -15 }, // Chloro pops up on the hill
  ];
};
