import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S01 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s01Timing = (t: CueFns) => {
  const name = t.word("Jan");
  const plant = t.word("planted");
  const willowWord = t.word("willow");
  const soilWord = t.word("dried");
  const weigh = t.cue("weigh");
  // "He weighed the tree." (tree #1 is "willow tree") / "He weighed the soil." (soil #1 is "dried soil")
  const tickTree = t.word("tree", 2);
  const row2 = t.word("weighed", 2);
  const tickSoil = t.word("soil", 2);
  const water = t.cue("water");
  const five = t.word("five");
  const grown = t.cue("grown");
  // the tree grows across the five years, finishing just before "The tree grew."
  const growStart = five;
  const growEnd = Math.max(growStart + 60, grown - 6);
  const gained = t.word("gained");
  const rollA = t.wordEnd("seventy-four");
  const soil = t.cue("soil");
  const soilAsk = t.word("soil", 3);
  const lost = t.word("lost");
  const rollB = t.wordEnd("fifty-seven");
  const question = t.cue("question");
  const where = t.word("where");
  const mass = t.word("mass");
  const notSoil = t.cue("notSoil");
  const strike = t.word("soil", 4);
  // "Most of the wood came out of thin air." — the wood (trunk and branches) lights up as it is named
  const air = t.cue("air");
  const wood = t.word("wood");
  const thin = t.word("thin");
  const promise = t.cue("promise");
  return {
    name,
    plant,
    willowWord,
    soilWord,
    weigh,
    tickTree,
    row2,
    tickSoil,
    water,
    five,
    growStart,
    growEnd,
    grown,
    gained,
    rollA: Math.max(gained + 20, rollA),
    soil,
    soilAsk,
    lost,
    rollB: Math.max(lost + 20, rollB),
    question,
    where,
    mass,
    notSoil,
    strike,
    air,
    wood,
    thin,
    promise,
    end: t.dur,
  };
};

export const s01Sfx = (t: CueFns): SfxEvent[] => {
  const k = s01Timing(t);
  return [
    { frame: k.tickTree + 2, sfx: "ui_blip", gainDb: -8 }, // willow weighed: tick + scale display blinks
    { frame: k.tickSoil + 2, sfx: "ui_blip", gainDb: -9 }, // soil weighed
    { frame: k.growStart, sfx: "whoosh_soft", gainDb: -9 }, // five years pass (time-lapse growth, camera pulls back)
    { frame: k.rollA, sfx: "tock", gainDb: -7 }, // +74 kg lands
    { frame: k.rollB, sfx: "tick", gainDb: -9 }, // −57 g lands (small)
    { frame: k.strike + 2, sfx: "strike", gainDb: -5 }, // "Not the soil."
    { frame: k.air + 30, sfx: "whoosh_soft", gainDb: -11 }, // carbon dioxide drifts in from the air
  ];
};
