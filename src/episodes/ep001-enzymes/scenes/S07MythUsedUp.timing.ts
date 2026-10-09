import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S07 key moments from the narration (shared by animation + SFX). */
export const s07Timing = (t: CueFns) => {
  const myth = t.cue("myth1");
  const usedUp = t.word("used", 1, -2);
  const bust = t.cue("bust1");
  const strike = t.word("don't", 1, -2);
  const replace = strike + 14;
  const after = t.word("after", 1, -2);
  const cardOut = replace + 22;
  const s1 = t.word("enzyme", 1, 4);
  const unch = Math.max(t.word("unchanged", 1, -2), s1 + 10);
  const again = t.cue("again");
  const s2 = t.word("again", 1, 2);
  const s3 = t.word("again", 2, 2);
  const cat = t.cue("catalase");
  const fast = t.word("fast", 1, -2);
  const catWord = t.word("catalase", 1, -2);
  const liver = t.word("liver", 1, -2);
  const brk = t.word("break", 1, -2);
  const millions = t.word("millions", 1, -2);
  const hp = t.word("hydrogen", 1, -2);
  const second = t.word("second", 1, -2);
  const wear = t.cue("wear");
  const dis = t.word("forever", 1, 4);
  const build = Math.max(dis + 20, t.word("cells", 1, -2));
  const rep = t.word("replace", 1, -2);
  const eq = t.cue("notConsumed");
  const never = t.word("never", 1, -2);
  return { myth, usedUp, bust, strike, replace, cardOut, after, s1, unch, again, s2, s3, cat, fast, catWord, liver, brk, millions, hp, second, wear, dis, build, rep, eq, never, end: t.dur };
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
    { frame: k.brk + 20, sfx: "bubbles", gainDb: -5 },
    { frame: k.wear + 2, sfx: "whoosh_zoom", gainDb: -9 },
    { frame: k.never + 8, sfx: "ui_blip", gainDb: -10 },
  ];
};
