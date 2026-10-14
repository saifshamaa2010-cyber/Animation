/**
 * Sound-effect placement per scene (pure TypeScript, evaluated in Node by `npm run sfx`).
 * Each scene's SFX come from the SAME timing function as its animation.
 */
import type { CueFns, SfxEvent } from "../../../lib/cues";
import { s01Sfx } from "./S01Hook.timing";
import { s02Sfx } from "./S02Title.timing";
import { s03Sfx } from "./S03Definition.timing";
import { s04Sfx } from "./S04Equation.timing";
import { s05Sfx } from "./S05Balanced.timing";
import { s06Sfx } from "./S06Chlorophyll.timing";
import { s07Sfx } from "./S07Uses.timing";
import { s08Sfx } from "./S08Minerals.timing";
import { s09Sfx } from "./S09Leaf.timing";
import { s10Sfx } from "./S10Layers.timing";
import { s11Sfx } from "./S11StarchTest.timing";
import { s12Sfx } from "./S12Needs.timing";
import { s13Sfx } from "./S13RateMethod.timing";
import { s14Sfx } from "./S14RateResults.timing";
import { s15Sfx } from "./S15Limiting.timing";
import { s16Sfx } from "./S16Predict.timing";
import { s17Sfx } from "./S17Reveal.timing";
import { s18Sfx } from "./S18Resolve.timing";
import { s19Sfx } from "./S19Recap.timing";
import { s20Sfx } from "./S20End.timing";

export const SCENE_SFX: Readonly<Record<string, (t: CueFns) => SfxEvent[]>> = {
  S01: s01Sfx,
  S02: s02Sfx,
  S03: s03Sfx,
  S04: s04Sfx,
  S05: s05Sfx,
  S06: s06Sfx,
  S07: s07Sfx,
  S08: s08Sfx,
  S09: s09Sfx,
  S10: s10Sfx,
  S11: s11Sfx,
  S12: s12Sfx,
  S13: s13Sfx,
  S14: s14Sfx,
  S15: s15Sfx,
  S16: s16Sfx,
  S17: s17Sfx,
  S18: s18Sfx,
  S19: s19Sfx,
  S20: s20Sfx,
};
