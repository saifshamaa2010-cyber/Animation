/**
 * EP002 v2 sound-effect placement per scene (pure TypeScript, evaluated in Node by
 * `npx tsx scripts/sfx-events.ts ep002-plant-nutrition src/episodes/ep002-plant-nutrition/v2/sfx.ts`).
 */
import type { CueFns, SfxEvent } from "../../../lib/cues";
import { sfx as s01 } from "./V2S01Hook.sfx";
import { sfx as s02 } from "./V2S02Title.sfx";
import { sfx as s03 } from "./V2S03Definition.sfx";
import { sfx as s04 } from "./V2S04Equation.sfx";
import { sfx as s05 } from "./V2S05Balanced.sfx";
import { sfx as s06 } from "./V2S06Tip.sfx";
import { sfx as s07 } from "./V2S07Uses.sfx";
import { sfx as s08 } from "./V2S08Minerals.sfx";
import { sfx as s09 } from "./V2S09Leaf.sfx";
import { sfx as s10 } from "./V2S10Stomata.sfx";
import { sfx as s11 } from "./V2S11StarchTest.sfx";
import { sfx as s12 } from "./V2S12Needs.sfx";
import { sfx as s13 } from "./V2S13RateMethod.sfx";
import { sfx as s14 } from "./V2S14RateResults.sfx";
import { sfx as s15 } from "./V2S15Limiting.sfx";
import { sfx as s16 } from "./V2S16Bench.sfx";
import { sfx as s17 } from "./V2S17Reveal.sfx";
import { sfx as s18 } from "./V2S18Resolve.sfx";
import { sfx as s19 } from "./V2S19Recap.sfx";
import { sfx as s20 } from "./V2S20End.sfx";

export const SCENE_SFX: Readonly<Record<string, (t: CueFns) => SfxEvent[]>> = {
  S01: s01,
  S02: s02,
  S03: s03,
  S04: s04,
  S05: s05,
  S06: s06,
  S07: s07,
  S08: s08,
  S09: s09,
  S10: s10,
  S11: s11,
  S12: s12,
  S13: s13,
  S14: s14,
  S15: s15,
  S16: s16,
  S17: s17,
  S18: s18,
  S19: s19,
  S20: s20,
};
