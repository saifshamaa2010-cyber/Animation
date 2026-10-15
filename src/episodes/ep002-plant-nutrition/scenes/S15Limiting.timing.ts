import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S15 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s15Timing = (t: CueFns) => {
  // ---- Extended: explain the shapes with limiting factors
  const extended = t.cue("extended");
  const extendedWord = t.word("extended", 1);
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
  const longer = t.word("longer", 1); // "Light is no longer limiting."
  const other = t.cue("other");
  const co2Other = t.word("carbon", 1); // "like carbon dioxide concentration,"
  const tempOther = t.word("temperature", 1); // "or temperature."
  const raise = t.cue("raise");
  const higherCo2 = t.word("higher", 1); // "at a higher carbon dioxide concentration"
  const curve = t.word("curve", 1); // "The curve rises higher,"
  const levelsHigher = t.word("higher", 3); // "and levels off higher."
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
  const dawnFactor = t.word("light", 6); // "light intensity is usually the limiting factor"
  const winter = t.cue("winter");
  const winterFactor = t.word("temperature", 2); // "it's often temperature"
  const summer = t.cue("summer");
  const summerFactor = t.word("carbon", 4); // "it's often carbon dioxide concentration"
  return {
    extended,
    extendedWord,
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
    curve,
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
    winter,
    winterFactor,
    summer,
    summerFactor,
    end: t.dur,
  };
};

export const s15Sfx = (t: CueFns): SfxEvent[] => {
  const k = s15Timing(t);
  return [
    { frame: k.extendedWord, sfx: "ui_blip", gainDb: -10 }, // section 8 + EXTENDED badge
    { frame: k.limitingFactors, sfx: "ui_blip", gainDb: -12 }, // "limiting factors"
    { frame: k.limits, sfx: "ui_blip", gainDb: -11 }, // definition completes
    { frame: k.graph, sfx: "whoosh_soft", gainDb: -12 }, // back to the light graph
    { frame: k.lightLimiting, sfx: "ui_blip", gainDb: -10 }, // light intensity is limiting
    { frame: k.longer, sfx: "ui_blip", gainDb: -11 }, // no longer limiting
    { frame: k.co2Other, sfx: "ui_blip", gainDb: -12 }, // candidates: carbon dioxide…
    { frame: k.curve, sfx: "whoosh_soft", gainDb: -13 }, // the higher-CO2 curve draws
    { frame: k.levelsHigher, sfx: "ui_blip", gainDb: -10 }, // levels off higher
    { frame: k.co2Was, sfx: "shimmer_sweet", gainDb: -14 }, // carbon dioxide was limiting
    { frame: k.name, sfx: "ui_blip", gainDb: -11 }, // name the factor
    { frame: k.reason, sfx: "card_in", gainDb: -9 }, // exam tip
    { frame: k.conditions, sfx: "whoosh_soft", gainDb: -13 }, // three conditions
    { frame: k.dawn, sfx: "card_in", gainDb: -12 }, // dawn / dull day
    { frame: k.winter, sfx: "card_in", gainDb: -12 }, // cold winter's day
    { frame: k.summer, sfx: "card_in", gainDb: -12 }, // bright summer's day
  ];
};
