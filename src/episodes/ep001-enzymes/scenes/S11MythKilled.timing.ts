import type { CueFns, SfxEvent } from "../../../lib/cues";

/** Word lookup that survives script tweaks: falls back to a cue-relative frame if the word is gone. */
const w = (t: CueFns, text: string, nth: number, offset: number, fallback: number) => {
  try {
    return t.word(text, nth, offset);
  } catch {
    return fallback;
  }
};

/** S11 key moments from the narration (shared by animation + SFX). */
export const s11Timing = (t: CueFns) => {
  const myth = t.cue("myth2");
  const notAlive = t.cue("notAlive");
  const molecule = t.cue("molecule");
  const correct = t.cue("correct");
  const marks = t.cue("marks");
  const end = t.dur;
  const strike = notAlive + 4; // "Enzymes were never alive" — the wrong word goes as it is said
  const replace = strike + 14;
  const cardOut = molecule + 2;
  const cellIn = cardOut + 4;
  const molWord = w(t, "molecule", 1, -2, molecule + 30);
  const inset = molWord - 16;
  const clever = w(t, "clever", 1, -2, molWord + 34);
  const snip = w(t, "one", 1, -2, clever + 10);
  const die = w(t, "die", 1, -2, correct - 26);
  const denat = w(t, "denatured", 1, -2, correct);
  const active = w(t, "active", 1, -2, correct + 40);
  const sub = w(t, "substrate", 1, -30, active + 26);
  const dock = w(t, "longer", 1, -2, sub + 46);
  const bounce = w(t, "fits", 1, -2, dock + 9);
  // "…and no enzyme–substrate complex can form": the left one IS a complex; the right one can't make one
  const complex = w(t, "enzyme–substrate", 1, -2, bounce + 26);
  const form = w(t, "form", 1, -2, complex + 60);
  const answer = w(t, "answer", 1, -10, marks + 26);
  const tick = w(t, "marks", 1, -8, end - 22);
  return { myth, notAlive, strike, replace, molecule, cardOut, cellIn, molWord, inset, clever, snip, die, correct, denat, active, sub, dock, bounce, complex, form, marks, answer, tick, end };
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
