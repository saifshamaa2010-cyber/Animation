/**
 * Sound-effect placement per scene (pure TypeScript, evaluated in Node by `npm run sfx`).
 * Each scene's SFX come from the SAME timing function as its animation.
 */
import type { CueFns, SfxEvent } from "../../../lib/cues";

export const SCENE_SFX: Readonly<Record<string, (t: CueFns) => SfxEvent[]>> = {};
