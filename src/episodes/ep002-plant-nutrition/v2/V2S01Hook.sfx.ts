// EP002 v2 · S01 sound effects, placed from the narration timing (pure TS: also evaluated in Node).
import type { CueFns, SfxEvent } from "../../../lib/cues";
import { v2s01Timing } from "./V2S01Hook.timing";

export const sfx = (t: CueFns): SfxEvent[] => {
  const k = v2s01Timing(t);
  return [
    { frame: k.treeWeight + 8, sfx: "tock", gainDb: -12 }, // a small brass weight lands: the sapling is weighed
    { frame: k.soilWeights + 8, sfx: "tock", gainDb: -10 }, // big weights land: the soil is weighed
    { frame: k.growStart, sfx: "whoosh_soft", gainDb: -14 }, // five years pass (the tree grows)
    { frame: k.kgEnd - 4, sfx: "tick", gainDb: -12 }, // "+74 kg" written in the ledger
    { frame: k.gEnd - 4, sfx: "tick", gainDb: -14 }, // "-57 g" (small)
    { frame: k.strike + 2, sfx: "strike", gainDb: -8 }, // "Not the soil." — the soil row is struck out
    { frame: k.thin, sfx: "shimmer_sweet", gainDb: -15 }, // "thin air": the page warms into colour
  ];
};
