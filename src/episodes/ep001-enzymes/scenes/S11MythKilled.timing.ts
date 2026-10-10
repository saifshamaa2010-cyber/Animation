import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * Strict word lookup: throws if the narration no longer contains the word, so a script change can
 * never silently drop an animation beat onto a guessed frame.
 */
const w = (t: CueFns, text: string, nth: number, offset: number) => t.word(text, nth, offset);

/** S11 key moments from the narration (shared by animation + SFX). */
export const s11Timing = (t: CueFns) => {
  const myth = t.cue("myth2");
  const notAlive = t.cue("notAlive");
  const molecule = t.cue("molecule");
  const correct = t.cue("correct");
  const marks = t.cue("marks");
  const end = t.dur;
  // "Enzymes were never alive": "kills" is scratched out on "never". Nothing is written in its place
  // yet — the correct word, "denatured", appears on the enzyme when it is spoken.
  const strike = w(t, "never", 1, -2);
  // "…myth number two": the MYTH #2 tag lands on "myth"; the card opens out of it just before
  // "…that heat "kills" enzymes", whose words are written on as they are said
  const tagIn = Math.max(myth, w(t, "myth", 1, -10));
  const said0 = w(t, "heat", 1, -2);
  const said1 = w(t, "enzymes", 1, 10);
  const cardOpen = said0 - 16;
  const cardOut = molecule + 2;
  const cellIn = cardOut + 4;
  const molWord = w(t, "molecule", 1, -2);
  const inset = molWord - 16;
  const clever = w(t, "clever", 1, -2);
  const snip = w(t, "one", 1, -2);
  const die = w(t, "die", 1, -2);
  const denat = w(t, "denatured", 1, -2);
  const active = w(t, "active", 1, -2);
  const sub = w(t, "substrate", 1, -30);
  const dock = w(t, "longer", 1, -2);
  const bounce = w(t, "fits", 1, -2);
  // "…and no enzyme–substrate complex can form": the left one IS a complex; the right one can't make one
  const complex = w(t, "enzyme–substrate", 1, -2);
  const form = w(t, "form", 1, -2);
  const answer = w(t, "answer", 1, -10);
  const tick = w(t, "marks", 1, -8);
  return { myth, tagIn, cardOpen, notAlive, strike, said0, said1, molecule, cardOut, cellIn, molWord, inset, clever, snip, die, correct, denat, active, sub, dock, bounce, complex, form, marks, answer, tick, end };
};

export const s11Sfx = (t: CueFns): SfxEvent[] => {
  const k = s11Timing(t);
  return [
    { frame: k.tagIn, sfx: "card_in", gainDb: -3 },
    { frame: k.strike, sfx: "strike", gainDb: -3 },
    { frame: k.snip, sfx: "snip", gainDb: -6 },
    { frame: k.denat, sfx: "sizzle_heat", gainDb: -14 },
    { frame: k.dock, sfx: "pop_bind", gainDb: -4 },
    { frame: k.bounce, sfx: "bonk_misfit", gainDb: -2 },
    { frame: k.form, sfx: "bonk_misfit", gainDb: -12 }, // the complex's boundary snaps open
    { frame: k.tick + 4, sfx: "ui_blip", gainDb: -8 },
  ];
};
