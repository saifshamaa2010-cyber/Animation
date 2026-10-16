import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S15 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s15Timing = (t: CueFns) => {
  // ---- "Now let's explain those shapes, using limiting factors."
  const explainShapes = t.cue("explainShapes");
  const explainW = t.word("explain", 1);
  const shapes = t.word("shapes", 1);
  const limitingFactors = t.word("limiting", 1); // "using limiting factors"
  const defn = t.cue("defn");
  const short = t.word("short", 1);
  const limits = t.word("limits", 1); // "…that limits the rate of a process"
  // ---- the big light graph
  const graph = t.cue("graph");
  const rising = t.cue("rising");
  const risingWord = t.word("rising", 1);
  const risingIncreases = t.word("increases", 1); // "the rate increases as light intensity increases"
  const lightLimiting = t.word("limiting", 3); // "So light intensity is the limiting factor."
  const plateau = t.cue("plateau");
  const flat = t.word("flat", 1);
  const noDifference = t.word("difference", 1);
  const longer = t.word("longer", 1); // "Light intensity is no longer the limiting factor."
  const other = t.cue("other");
  const co2Other = t.word("carbon", 1); // "like carbon dioxide concentration,"
  const tempOther = t.word("temperature", 1); // "or temperature."
  const raise = t.cue("raise");
  const higherCo2 = t.word("higher", 1); // "at a higher carbon dioxide concentration"
  // "At low light intensity, the two curves are the same, because light intensity is still the limiting factor."
  const same = t.cue("same");
  const low = t.word("low", 1);
  const sameWord = t.word("same", 1);
  const still = t.word("still", 1);
  // "But the new curve keeps rising for longer, and levels off higher."
  const higher = t.cue("higher");
  const newCurve = t.word("curve", 1); // "the new curve" ("curves" is a different word)
  const keepsRising = t.word("rising", 2);
  const forLonger = t.word("longer", 2);
  const levelsHigher = t.word("higher", 2); // "and levels off higher."
  const proves = t.cue("proves");
  const co2Was = t.word("carbon", 3); // "That shows carbon dioxide was the limiting factor"
  // ---- exam wording
  const exam = t.cue("exam");
  const name = t.word("name", 1);
  const reason = t.word("reason", 1);
  const increasing = t.word("increasing", 1);
  const rateUp = t.word("increases", 3); // "...increases the rate."
  // ---- conditions
  const conditions = t.cue("conditions");
  const dawn = t.cue("dawn");
  const dull = t.word("dull", 1);
  const dawnFactor = t.word("light", 8); // "light intensity is usually the limiting factor"
  const dawnWhy = t.word("because", 2); // "because there's not much light"
  const winter = t.cue("winter");
  const winterFactor = t.word("temperature", 2); // "it's often temperature"
  const winterWhy = t.cue("winterWhy"); // "The molecules have less kinetic energy,"
  const less = t.word("less", 1); // "less kinetic energy"
  const kinetic = t.word("kinetic", 1);
  const fewer = t.word("fewer", 1); // "so there are fewer effective collisions"
  const summer = t.cue("summer");
  const plenty = t.word("plenty", 1); // "there's plenty of light and warmth"
  const summerFactor = t.word("carbon", 4); // "it's often carbon dioxide concentration"
  const summerWhy = t.cue("summerWhy"); // "There's only a tiny amount of carbon dioxide in the air."
  const tiny = t.word("tiny", 1);
  return {
    explainShapes,
    explainW,
    shapes,
    limitingFactors,
    defn,
    short,
    limits,
    graph,
    rising,
    risingWord,
    risingIncreases,
    lightLimiting,
    plateau,
    flat,
    noDifference,
    longer,
    other,
    co2Other,
    tempOther,
    raise,
    higherCo2,
    same,
    low,
    sameWord,
    still,
    higher,
    newCurve,
    keepsRising,
    forLonger,
    levelsHigher,
    proves,
    co2Was,
    exam,
    name,
    reason,
    increasing,
    rateUp,
    conditions,
    dawn,
    dull,
    dawnFactor,
    dawnWhy,
    winter,
    winterFactor,
    winterWhy,
    less,
    kinetic,
    fewer,
    summer,
    plenty,
    summerFactor,
    summerWhy,
    tiny,
    end: t.dur,
  };
};

export const s15Sfx = (t: CueFns): SfxEvent[] => {
  const k = s15Timing(t);
  return [
    { frame: k.explainW, sfx: "ui_blip", gainDb: -10 }, // section 8 tag settles in
    { frame: k.limitingFactors, sfx: "ui_blip", gainDb: -12 }, // "limiting factors"
    { frame: k.limits, sfx: "ui_blip", gainDb: -11 }, // definition completes
    { frame: k.graph, sfx: "whoosh_soft", gainDb: -12 }, // back to the light graph
    { frame: k.lightLimiting, sfx: "ui_blip", gainDb: -10 }, // light intensity is limiting
    { frame: k.longer, sfx: "ui_blip", gainDb: -11 }, // no longer limiting
    { frame: k.co2Other, sfx: "ui_blip", gainDb: -12 }, // candidates: carbon dioxide…
    { frame: k.sameWord, sfx: "ui_blip", gainDb: -12 }, // the two curves are the same at low light
    { frame: k.newCurve, sfx: "whoosh_soft", gainDb: -13 }, // the higher-CO2 curve peels away
    { frame: k.levelsHigher, sfx: "ui_blip", gainDb: -10 }, // levels off higher
    { frame: k.co2Was, sfx: "shimmer_sweet", gainDb: -14 }, // carbon dioxide was limiting
    { frame: k.name, sfx: "ui_blip", gainDb: -11 }, // name the factor
    { frame: k.reason, sfx: "card_in", gainDb: -9 }, // exam tip
    { frame: k.conditions, sfx: "whoosh_soft", gainDb: -13 }, // three conditions
    { frame: k.dawn, sfx: "card_in", gainDb: -12 }, // dawn / dull day
    { frame: k.dawnWhy, sfx: "ui_blip", gainDb: -14 }, // reason: not much light
    { frame: k.winter, sfx: "card_in", gainDb: -12 }, // cold winter's day
    { frame: k.less, sfx: "ui_blip", gainDb: -14 }, // reason: less kinetic energy
    { frame: k.summer, sfx: "card_in", gainDb: -12 }, // bright summer's day
    { frame: k.summerWhy, sfx: "ui_blip", gainDb: -14 }, // reason: very little CO2 in the air
  ];
};
