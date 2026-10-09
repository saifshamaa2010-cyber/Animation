import type { CueFns, SfxEvent } from "../../../lib/cues";

/** Word lookup that survives script tweaks: falls back to a cue-relative frame if the word is gone. */
const w = (t: CueFns, text: string, nth: number, offset: number, fallback: number) => {
  try {
    return t.word(text, nth, offset);
  } catch {
    return fallback;
  }
};

/** S07 key moments from the narration (shared by animation + SFX). */
export const s07Timing = (t: CueFns) => {
  const myth = t.cue("myth1");
  const bust = t.cue("bust1");
  const again = t.cue("again");
  const cat = t.cue("catalase");
  const wear = t.cue("wear");
  const eq = t.cue("notConsumed");
  const end = t.dur;
  const strike = w(t, "don't", 1, -2, bust + 4);
  const replace = strike + 14;
  const cardOut = replace + 22;
  const s1 = Math.max(cardOut + 30, w(t, "enzyme", 1, 4, again - 50));
  const unch = Math.max(w(t, "unchanged", 1, -2, s1 + 14), s1 + 10);
  const s2 = w(t, "again", 1, 2, again + 20);
  const s3 = w(t, "again", 2, 2, s2 + 21);
  const catWord = w(t, "catalase", 1, -2, cat + 94);
  const cells = w(t, "found", 1, -2, catWord + 26);
  const brk = w(t, "break", 1, -2, catWord + 80);
  const many = w(t, "hundreds", 1, -2, brk + 16);
  const hp = w(t, "hydrogen", 1, -2, brk + 74);
  const second = w(t, "second", 1, -2, wear - 26);
  const dis = w(t, "replace", 1, 2, wear + 24);
  const build = dis + 24;
  const never = w(t, "never", 1, -2, eq + 36);
  return { myth, bust, strike, replace, cardOut, s1, unch, again, s2, s3, cat, catWord, cells, brk, many, hp, second, wear, dis, build, eq, never, end };
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
