import type { CueFns, SfxEvent } from "../../../lib/cues";

export const s01Timing = (t: CueFns) => {
  const drop = 0;
  const plain = t.word("plain", 1, -2); // ingredients tag pins on
  const noSugar = t.word("no", 1, -2); // "with no added sugar"
  const chew = t.cue("chew");
  const bites = [chew + 2, t.word("chewing", 1, 6), t.word("Don't", 1, 2)]; // first bite on "Chew it"
  const crumble = t.word("swallow", 1, 0);
  const timer = t.cue("timer");
  const sweet = t.cue("sweet");
  const question = t.cue("question");
  const sugar = t.word("sugar", 2, 0); // "you didn't add any sugar" (#1 is "without added sugar")
  const where = t.word("where's", 1, 0);
  const answer = t.cue("answer");
  const millions = t.cue("millions");
  return { drop, plain, noSugar, chew, bites, crumble, timer, sweet, question, sugar, where, answer, lensSnap: answer + 44, millions, end: t.dur };
};

export const s01Sfx = (t: CueFns): SfxEvent[] => {
  const k = s01Timing(t);
  return [
    { frame: 6, sfx: "whoosh_soft", gainDb: -10 },
    ...k.bites.map((b, i) => ({ frame: b, sfx: "crunch", gainDb: -2 - i * 2 })),
    { frame: k.timer + 8, sfx: "tick", gainDb: -10 },
    { frame: k.timer + 20, sfx: "tick", gainDb: -12 },
    { frame: k.sweet + 2, sfx: "shimmer_sweet", gainDb: -3 },
    { frame: k.sugar + 4, sfx: "strike", gainDb: -8 },
    { frame: k.answer - 2, sfx: "whoosh_soft", gainDb: -6 },
    { frame: k.lensSnap, sfx: "snip", gainDb: -9 },
  ];
};
