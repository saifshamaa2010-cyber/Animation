// EP002 v2 · S03 sound effects, placed from the narration timing (pure TS: also evaluated in Node).
// Subtle, and only where something meaningful lands on the page.
import type { CueFns, SfxEvent } from "../../../lib/cues";
import { v2s03Timing } from "./V2S03Definition.timing";

export const sfx = (t: CueFns): SfxEvent[] => {
  const k = v2s03Timing(t);
  return [
    { frame: 0, sfx: "whoosh_soft", gainDb: -13 }, // part card: Part 1 of 9
    { frame: k.food - 4, sfx: "shimmer_sweet", gainDb: -12 }, // the sunlit leaf makes a glucose
    { frame: k.learn, sfx: "card_in", gainDb: -12 }, // "LEARN THIS" tab on the box
    { frame: k.make2 - 2, sfx: "ui_blip", gainDb: -14 }, // synthesise = make
    { frame: k.glucose - 4, sfx: "shimmer_sweet", gainDb: -12 }, // carbohydrate → glucose
    { frame: k.co2 - 2, sfx: "pop_bind", gainDb: -14 }, // carbon dioxide
    { frame: k.water - 4, sfx: "pop_bind", gainDb: -15 }, // water
    { frame: k.sun + 6, sfx: "ui_blip", gainDb: -13 }, // the sun: energy from light
  ];
};
