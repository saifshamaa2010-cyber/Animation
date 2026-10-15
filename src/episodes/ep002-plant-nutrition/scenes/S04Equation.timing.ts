import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S04 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s04Timing = (t: CueFns) => {
  // ---- the word equation, term by term as it is read
  const equation = t.cue("equation");
  const eqWord = t.word("equation", 1); // "Now the word equation."
  const co2 = t.cue("co2"); // "Carbon dioxide,"
  const plus1 = t.cue("water"); // "plus water"
  const water = t.word("water", 1);
  const arrow = t.cue("glucose"); // "gives"
  const glucose = t.word("glucose", 1);
  const plus2 = t.cue("oxygen"); // "plus oxygen"
  const oxygen = t.word("oxygen", 1);
  // ---- conditions on the arrow
  const conditions = t.cue("conditions");
  const light = t.word("light", 1);
  const chlorophyll = t.word("chlorophyll", 1);
  const onArrow = t.word("arrow", 1);
  const notReactants = t.cue("notReactants");
  const condWord = t.word("conditions", 1); // "They're conditions,"
  const notWord = t.word("not", 1); // "…not reactants."
  const substance = t.word("light", 2); // "Light isn't a substance,"
  const usedUp = t.word("chlorophyll", 2); // "…and chlorophyll isn't used up."
  // ---- where the raw materials come from (and where the oxygen goes)
  const inputs = t.cue("inputs");
  const raw = t.word("raw", 1);
  const co2From = t.cue("co2From");
  const intoLeaf = t.word("leaf", 1);
  const waterFrom = t.cue("waterFrom");
  const absorbed = t.word("absorbed", 1);
  const roots = t.word("roots", 1);
  const travels = t.word("travels", 1);
  const xylem = t.word("xylem", 1);
  const toLeaf = t.word("leaf", 2);
  const oxygenOut = t.cue("oxygenOut");
  const some = t.word("some", 1);
  const respiration = t.word("respiration", 1);
  const release = t.cue("release");
  const air = t.word("air", 2); // "…into the air."
  return {
    equation,
    eqWord,
    co2,
    plus1,
    water,
    arrow,
    glucose,
    plus2,
    oxygen,
    conditions,
    light,
    chlorophyll,
    onArrow,
    notReactants,
    condWord,
    notWord,
    substance,
    usedUp,
    inputs,
    raw,
    co2From,
    intoLeaf,
    waterFrom,
    absorbed,
    roots,
    travels,
    xylem,
    toLeaf,
    oxygenOut,
    some,
    respiration,
    release,
    air,
    end: t.dur,
  };
};

export const s04Sfx = (t: CueFns): SfxEvent[] => {
  const k = s04Timing(t);
  return [
    { frame: k.co2, sfx: "ui_blip", gainDb: -11 }, // the equation starts to build
    { frame: k.glucose, sfx: "shimmer_sweet", gainDb: -12 }, // glucose: the product
    { frame: k.light, sfx: "ui_blip", gainDb: -10 }, // conditions written on the arrow
    { frame: k.condWord, sfx: "ui_blip", gainDb: -9 }, // bracket: conditions, not reactants
    { frame: k.inputs, sfx: "whoosh_soft", gainDb: -9 }, // equation moves up, the plant takes the stage
    { frame: k.roots, sfx: "ui_blip", gainDb: -12 }, // water enters the roots
    { frame: k.xylem, sfx: "ui_blip", gainDb: -12 }, // xylem highlights
    { frame: k.respiration, sfx: "ui_blip", gainDb: -12 }, // one O2 goes back in: respiration
    { frame: k.release + 4, sfx: "whoosh_soft", gainDb: -14 }, // the rest drifts out into the air
  ];
};
