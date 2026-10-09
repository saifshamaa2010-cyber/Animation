/**
 * Sound-effect placement per scene. Pure TypeScript (no React), so `npm run sfx` can evaluate it
 * in Node and hand exact times to the audio mixer. Each scene's SFX use the SAME timing function
 * as its animation, so a "snip" can never drift away from the snap you see.
 */
import type { CueFns, SfxEvent } from "../../../lib/cues";
import { s08Sfx } from "./S08Temperature.timing";
import { s09Sfx } from "./S09Predict.timing";
import { s10Sfx } from "./S10Denature.timing";
import { s01Sfx } from "./S01Hook.timing";
import { s03Sfx } from "./S03Starch.timing";
import { s04Sfx } from "./S04Enzyme.timing";
import { s05Sfx } from "./S05ActiveSite.timing";
import { s13Sfx } from "./S13Resolve.timing";
import { s06Sfx } from "./S06InducedFit.timing";
import { s07Sfx } from "./S07MythUsedUp.timing";
import { s11Sfx } from "./S11MythKilled.timing";
import { s12Sfx } from "./S12Ph.timing";

export const SCENE_SFX: Readonly<Record<string, (t: CueFns) => SfxEvent[]>> = {
  S08: s08Sfx,
  S09: s09Sfx,
  S10: s10Sfx,
  S01: s01Sfx,
  S02: (t) => [{ frame: 6, sfx: "chime_title", gainDb: -4 }, { frame: 46, sfx: "snip", gainDb: -10 }],
  S03: s03Sfx,
  S04: s04Sfx,
  S05: s05Sfx,
  S13: s13Sfx,
  S06: s06Sfx,
  S07: s07Sfx,
  S11: s11Sfx,
  S12: s12Sfx,
};
