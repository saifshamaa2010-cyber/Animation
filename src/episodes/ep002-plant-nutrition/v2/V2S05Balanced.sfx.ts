// EP002 v2 · S05 sound effects, placed from the narration timing (pure TS: also evaluated in Node).
// Subtle, and only where something meaningful lands: the see-saw arriving, each handful of atom
// beads landing in a tray, a row matching ("="), and the BALANCED stamp.
import type { CueFns, SfxEvent } from "../../../lib/cues";
import { s05Timing } from "../scenes/S05Balanced.timing";

export const sfx = (t: CueFns): SfxEvent[] => {
  const k = s05Timing(t);
  // beads launch 3 frames before the number is said and fly for 15 frames: the first lands at +12
  const land = (at: number) => at + 12;
  return [
    { frame: k.check, sfx: "card_in", gainDb: -14 }, // the see-saw and its trays are drawn
    { frame: land(k.cL), sfx: "pop_bind", gainDb: -14 }, // carbon: 6 into the left tray
    { frame: land(k.cR), sfx: "pop_bind", gainDb: -14 }, // … and 6 into the right
    { frame: k.cEq - 2, sfx: "ui_blip", gainDb: -15 }, // "="
    { frame: land(k.hL), sfx: "pop_bind", gainDb: -14 }, // hydrogen: 12 left
    { frame: land(k.hR), sfx: "pop_bind", gainDb: -14 }, // 12 right
    { frame: k.hR + 16, sfx: "ui_blip", gainDb: -15 }, // "="
    { frame: land(k.oL1), sfx: "pop_bind", gainDb: -14 }, // oxygen: 12 …
    { frame: land(k.oL2), sfx: "pop_bind", gainDb: -15 }, // … plus 6 on the left
    { frame: land(k.oR1), sfx: "pop_bind", gainDb: -14 }, // 6 …
    { frame: land(k.oR2), sfx: "pop_bind", gainDb: -15 }, // … plus 12 on the right
    { frame: k.oEq - 2, sfx: "ui_blip", gainDb: -15 }, // "="
    { frame: k.balances + 6, sfx: "pop_bind", gainDb: -9 }, // the BALANCED stamp lands
  ];
};
