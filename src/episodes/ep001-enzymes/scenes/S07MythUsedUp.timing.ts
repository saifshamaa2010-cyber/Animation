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
  const said0 = w(t, "enzymes", 1, -2); // "…that enzymes get used up": the card's sentence is written on
  const said1 = w(t, "up", 1, 6);
  const strike = w(t, "don't", 1, -2);
  const replace = strike + 14;
  const cardOut = replace + 22;
  // three snips: "the enzyme is unchanged", "ready to go again, and again"
  const s1 = Math.max(cardOut + 30, w(t, "enzyme", 1, 4));
  const unch = Math.max(w(t, "unchanged", 1, -2), s1 + 10);
  const s2 = w(t, "again", 1, 2);
  // a full cycle (chain dips clear, product slides out, chain back in) needs ≥ 34 frames, so the
  // third snip lands at the end of the 2nd "again" rather than its first syllable
  const s3 = Math.max(w(t, "again", 2, 2), s2 + 34);
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
    myth, said0, said1, bust, strike, replace, cardOut, s1, unch, again, s2, s3, cat, catWord, cells, one, brk, many, hp, every, second,
    wear, replaceW, eventually, build, buildDone, swap, eq, reaction, never, end,
  };
};

export const s07Sfx = (t: CueFns): SfxEvent[] => {
  const k = s07Timing(t);
  return [
    { frame: k.myth, sfx: "card_in", gainDb: -3 },
    { frame: k.strike, sfx: "strike", gainDb: -3 },
    { frame: k.s1, sfx: "snip", gainDb: -2 },
    { frame: k.s2, sfx: "snip", gainDb: -6 },
    { frame: k.s3, sfx: "snip", gainDb: -8 },
    { frame: k.cat + 2, sfx: "whoosh_soft", gainDb: -9 },
    { frame: k.brk + 2, sfx: "bubbles", gainDb: -5 },
    { frame: k.wear + 2, sfx: "whoosh_zoom", gainDb: -11 },
    { frame: k.never + 8, sfx: "ui_blip", gainDb: -10 },
  ];
};
