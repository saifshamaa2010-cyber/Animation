import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * First time `text` is spoken at or after frame `from` (k = 2 → the second time, …).
 * Robust to the narrator's pace: the words are looked up relative to their sentence's cue.
 */
const after = (t: CueFns, text: string, from: number, k = 1): number => {
  let seen = 0;
  for (let n = 1; n < 60; n++) {
    let w: number;
    try {
      w = t.word(text, n);
    } catch {
      break;
    }
    if (w >= from - 1) {
      seen++;
      if (seen === k) return w;
    }
  }
  return from;
};

/** S05 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s05Timing = (t: CueFns) => {
  const extended = t.cue("extended");
  const extWord = t.word("extended", 1);
  const symbol = t.word("symbol", 1);
  // "Six C O two, plus six H two O, gives C six H twelve O six, plus six O two."
  const balanced = t.cue("balanced");
  const tCO2 = balanced;
  const plus1 = after(t, "plus", balanced);
  const tH2O = after(t, "six", plus1);
  const gives = after(t, "gives", balanced);
  const tGlc = after(t, "c", gives);
  const plus2 = after(t, "plus", gives);
  const tO2 = after(t, "six", plus2);
  // the atom tally
  const check = t.cue("check");
  const carbon = t.cue("carbon");
  const cL = after(t, "six", carbon); // six on the left
  const cR = after(t, "six", carbon, 2); // six on the right
  const cEq = after(t, "right", carbon);
  const hydrogen = t.cue("hydrogen");
  const hL = after(t, "twelve", hydrogen);
  const hR = after(t, "each", hydrogen); // twelve on each side
  const oxygen = t.cue("oxygenCount");
  const oL1 = after(t, "twelve", oxygen); // 12 (in 6CO2)
  const oL2 = after(t, "six", oxygen); // + 6 (in 6H2O)
  const oLsum = after(t, "eighteen", oxygen); // = 18 on the left
  const oR1 = after(t, "six", oxygen, 2); // 6 (in C6H12O6)
  const oR2 = after(t, "twelve", oxygen, 2); // + 12 (in 6O2)
  const oRsum = after(t, "eighteen", oxygen, 2); // = 18 on the right
  const oEq = after(t, "right", oxygen);
  const balances = t.cue("balances");
  return {
    extended,
    extWord,
    symbol,
    balanced,
    tCO2,
    plus1,
    tH2O,
    gives,
    tGlc,
    plus2,
    tO2,
    check,
    carbon,
    cL,
    cR,
    cEq,
    hydrogen,
    hL,
    hR,
    oxygen,
    oL1,
    oL2,
    oLsum,
    oR1,
    oR2,
    oRsum,
    oEq,
    balances,
    end: t.dur,
  };
};

export const s05Sfx = (t: CueFns): SfxEvent[] => {
  const k = s05Timing(t);
  return [
    { frame: k.extWord, sfx: "ui_blip", gainDb: -8 }, // EXTENDED badge
    { frame: k.gives, sfx: "ui_blip", gainDb: -12 }, // the symbol equation's arrow
    { frame: k.check, sfx: "whoosh_soft", gainDb: -11 }, // equation lifts, tally opens
    // counting: one soft tick per side total (the mixer alternates tick / tock)
    { frame: k.cL, sfx: "tick", gainDb: -10 },
    { frame: k.cR, sfx: "tick", gainDb: -10 },
    { frame: k.hL, sfx: "tick", gainDb: -10 },
    { frame: k.hR, sfx: "tick", gainDb: -10 },
    { frame: k.oLsum, sfx: "tick", gainDb: -10 },
    { frame: k.oRsum, sfx: "tick", gainDb: -10 },
    { frame: k.balances + 4, sfx: "pop_bind", gainDb: -6 }, // it balances: the tick lands
  ];
};
