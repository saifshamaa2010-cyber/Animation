/**
 * Sound-effect placement per scene. Pure TypeScript (no React), so `npm run sfx` can evaluate it
 * in Node and hand exact times to the audio mixer. Each scene's SFX use the SAME timing function
 * as its animation, so a "snip" can never drift away from the snap you see.
 */
import type { CueFns, SfxEvent } from "../../../lib/cues";
import { s04Sfx } from "./S04Enzyme.timing";
import { s05Sfx } from "./S05ActiveSite.timing";

export const SCENE_SFX: Readonly<Record<string, (t: CueFns) => SfxEvent[]>> = {
  S04: s04Sfx,
  S05: s05Sfx,
};
