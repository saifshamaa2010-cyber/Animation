import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * Strict word lookup: throws if the narration no longer contains the word, so a script change can
 * never silently drop an animation beat onto a guessed frame.
 */
const w = (t: CueFns, text: string, nth: number, offset: number) => t.word(text, nth, offset);

/** S07 key moments from the narration (shared by animation + SFX). */
export const s07Timing = (t: CueFns) => {
  const myth = t.cue("myth1");
  const bust = t.cue("bust1");
  const again = t.cue("again");
  const cat = t.cue("catalase");
  const wear = t.cue("wear");
  const eq = t.cue("notConsumed");
  const end = t.dur;
  // "…myth number one": the MYTH #1 tag lands on "myth"; the card opens out of it just before
  // "…that enzymes get used up", whose words are written on as they are said
  const tagIn = Math.max(myth, w(t, "myth", 1, -10));
  const said0 = w(t, "enzymes", 1, -2);
  const said1 = w(t, "up", 1, 6);
  const cardOpen = said0 - 16;
  const strike = w(t, "don't", 1, -2);
  const replace = strike + 14;
  const cardOut = replace + 22;
  // three snips: "the enzyme is unchanged", "ready to go again, and again". One cycle (the chain's tip
  // dips clear, the product slides right out of the mouth and lifts away, the chain swings back two rings
  // further on) takes 28 frames, so snip 2 lands on the first "again" and snip 3 on the end of the second
  const s1 = Math.max(cardOut + 30, w(t, "enzyme", 1, 4));
  const unch = Math.max(w(t, "unchanged", 1, -2), s1 + 10);
  const s2 = w(t, "again", 1, -2);
  const s3 = Math.max(w(t, "again", 2, 2), s2 + 28);
  const catWord = w(t, "catalase", 1, -2);
  const cells = w(t, "found", 1, -2);
  const one = w(t, "one", 2, -2); // "One molecule of it…" (the 1st "one" is "myth number one")
  const brk = w(t, "break", 1, -2);
  const many = w(t, "hundreds", 1, -2);
  const hp = w(t, "hydrogen", 1, -2);
  const every = w(t, "every", 1, -2);
  const second = w(t, "second", 1, -2);
  // "Your cells do replace old enzymes, eventually": the old one keeps working while a new one is
  // built; time passes (calendar); the old one is recycled and the new one takes over.
  const replaceW = w(t, "replace", 1, -2);
  const eventually = w(t, "eventually", 1, -2);
  const build = replaceW + 2;
  const buildDone = Math.max(build + 40, eventually - 8);
  const swap = buildDone + 2; // old one recycled, stream moves to the new one
  const reaction = w(t, "reaction", 2, -2); // "But the reaction itself…" — the equation is written
  const never = w(t, "never", 1, -2);
  return {
    myth, tagIn, cardOpen, said0, said1, bust, strike, replace, cardOut, s1, unch, again, s2, s3, cat, catWord, cells, one, brk, many, hp, every, second,
    wear, replaceW, eventually, build, buildDone, swap, eq, reaction, never, end,
  };
};

export const s07Sfx = (t: CueFns): SfxEvent[] => {
  const k = s07Timing(t);
  return [
    { frame: k.tagIn, sfx: "card_in", gainDb: -3 },
    { frame: k.strike, sfx: "strike", gainDb: -3 },
    { frame: k.s1, sfx: "snip", gainDb: -2 },
    { frame: k.s2, sfx: "snip", gainDb: -6 },
    { frame: k.s3, sfx: "snip", gainDb: -8 },
    { frame: k.cat + 10, sfx: "whoosh_soft", gainDb: -9 }, // clear of snip 3
    { frame: k.brk + 2, sfx: "bubbles", gainDb: -5 },
    { frame: k.wear + 2, sfx: "whoosh_zoom", gainDb: -11 },
    { frame: k.never + 8, sfx: "ui_blip", gainDb: -10 },
  ];
};
