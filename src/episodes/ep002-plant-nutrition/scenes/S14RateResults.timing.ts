import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S14 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s14Timing = (t: CueFns) => {
  // ---- light graph
  const lightGraph = t.cue("lightGraph");
  const lightRise = t.word("increases", 1); // "As light intensity increases…"
  const lightRise2 = t.word("increases", 2); // "…the rate of photosynthesis increases."
  const levels = t.cue("levels"); // "Then it levels off."
  const levelsWord = t.word("levels", 1);
  // ---- carbon dioxide graph
  const co2Graph = t.cue("co2Graph"); // "Increase the carbon dioxide concentration"
  const co2Word = t.word("carbon", 1);
  const same = t.word("same", 1); // "the same shape"
  const co2Rise = t.word("increases", 3); // "the rate increases, then levels off"
  const co2Off = t.wordEnd("off", 2);
  // ---- temperature graph
  const tempGraph = t.cue("tempGraph"); // "Temperature is different."
  const different = t.word("different", 1);
  const tempRise = t.word("increases", 4); // "The rate increases up to an optimum"
  const optimum = t.word("optimum", 1);
  const falls = t.word("falls", 1);
  // ---- why: enzymes
  const enzymes = t.cue("enzymes");
  const catalysed = t.word("catalysed", 1);
  const enzymesWord = t.word("enzymes", 1);
  // "This next part is for the Extended paper." (the EXTENDED badge joins the section tag until {describe})
  const extendedTemp = t.cue("extendedTemp");
  const below = t.cue("below");
  const raising = t.word("raising", 1);
  const kinetic = t.word("kinetic", 1);
  const effective = t.word("effective", 1);
  const collisions = t.word("collisions", 1);
  const above = t.cue("above");
  const optimum3 = t.word("optimum", 3); // "Above the optimum"
  const denaturedWord = t.word("denatured", 1);
  const active = t.word("active", 1);
  const shape = t.word("shape", 2); // "Their active sites change shape"
  const longer = t.word("longer", 1); // "…no longer fit."
  const fit = t.word("fit", 1);
  // ---- exam technique
  const describe = t.cue("describe");
  const describeWord = t.word("describe", 1);
  const happens = t.word("happens", 1);
  const numbers = t.word("numbers", 1); // "and quote numbers from the axes,"
  const units = t.word("units", 1); // "with their units."
  const explain = t.cue("explain");
  const explainWord = t.word("explain", 1);
  const why = t.word("why", 1);
  return {
    lightGraph,
    lightRise,
    lightRise2,
    levels,
    levelsWord,
    co2Graph,
    co2Word,
    same,
    co2Rise,
    co2Off,
    tempGraph,
    different,
    tempRise,
    optimum,
    falls,
    enzymes,
    catalysed,
    enzymesWord,
    extendedTemp,
    below,
    raising,
    kinetic,
    effective,
    collisions,
    above,
    optimum3,
    denaturedWord,
    active,
    shape,
    longer,
    fit,
    describe,
    describeWord,
    happens,
    numbers,
    units,
    explain,
    explainWord,
    why,
    end: t.dur,
  };
};

export const s14Sfx = (t: CueFns): SfxEvent[] => {
  const k = s14Timing(t);
  return [
    { frame: k.lightGraph + 2, sfx: "whoosh_soft", gainDb: -13 }, // the results: first graph
    { frame: k.levelsWord, sfx: "ui_blip", gainDb: -11 }, // levels off
    { frame: k.co2Graph, sfx: "whoosh_soft", gainDb: -14 }, // second graph
    { frame: k.same, sfx: "ui_blip", gainDb: -11 }, // same shape
    { frame: k.tempGraph, sfx: "whoosh_soft", gainDb: -14 }, // third graph
    { frame: k.optimum, sfx: "ui_blip", gainDb: -10 }, // optimum
    { frame: k.enzymes, sfx: "whoosh_soft", gainDb: -12 }, // zoom in to the enzymes
    { frame: k.catalysed, sfx: "pop_bind", gainDb: -9 }, // substrate binds the active site
    { frame: k.extendedTemp + 2, sfx: "ui_blip", gainDb: -11 }, // EXTENDED badge joins the section tag
    { frame: k.effective, sfx: "pop_bind", gainDb: -10 }, // effective collisions
    { frame: k.denaturedWord, sfx: "snip", gainDb: -8 }, // bonds holding the shape break
    { frame: k.fit, sfx: "bonk_misfit", gainDb: -8 }, // the substrate no longer fits
    { frame: k.describeWord, sfx: "card_in", gainDb: -11 }, // describe
    { frame: k.numbers, sfx: "ui_blip", gainDb: -10 }, // numbers from the axes
    { frame: k.units, sfx: "ui_blip", gainDb: -12 }, // … with their units
    { frame: k.explainWord, sfx: "card_in", gainDb: -11 }, // explain
  ];
};
