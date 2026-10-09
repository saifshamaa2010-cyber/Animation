import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S11 key moments from the narration (shared by animation + SFX). */
export const s11Timing = (t: CueFns) => {
  const myth = t.cue("myth2");
  const notAlive = t.cue("notAlive");
  const strike = t.word("never", 1, -2);
  const replace = strike + 16;
  const molecule = t.cue("molecule");
  const cardOut = molecule - 6;
  const cellIn = cardOut + 4;
  const molWord = t.word("molecule", 1, -2);
  const inset = molWord - 16;
  const clever = t.word("clever", 1, -2);
  const snip = t.word("one", 1, -2);
  const die = t.word("die", 1, -2);
  const correct = t.cue("correct");
  const denat = t.word("denatured", 1, -2);
  const active = t.word("active", 1, -2);
  const sub = t.word("substrate", 1, -30);
  const dock = t.word("longer", 1, -2);
  const bounce = t.word("fits", 1, -2);
  const marks = t.cue("marks");
  const answer = t.word("answer", 1, -10);
  const tick = t.word("marks", 1, -8);
  return { myth, notAlive, strike, replace, molecule, cardOut, cellIn, molWord, inset, clever, snip, die, correct, denat, active, sub, dock, bounce, marks, answer, tick, end: t.dur };
};

export const s11Sfx = (t: CueFns): SfxEvent[] => {
  const k = s11Timing(t);
  return [
    { frame: k.myth, sfx: "card_in", gainDb: -3 },
    { frame: k.strike, sfx: "strike", gainDb: -3 },
    { frame: k.snip, sfx: "snip", gainDb: -6 },
    { frame: k.denat, sfx: "sizzle_heat", gainDb: -14 },
    { frame: k.dock, sfx: "pop_bind", gainDb: -4 },
    { frame: k.bounce, sfx: "bonk_misfit", gainDb: -2 },
    { frame: k.tick + 4, sfx: "ui_blip", gainDb: -8 },
  ];
};
