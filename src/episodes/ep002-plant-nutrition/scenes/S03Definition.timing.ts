import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * S03 key moments, derived from the narration (shared by the animation and the sound effects).
 * Every beat sits on a cue or on the spoken word that motivates it; gaps are guarded so a faster
 * or slower narrator never breaks the order of events.
 */
export const s03Timing = (t: CueFns) => {
  const eat = t.cue("eat");
  const plate = t.word("eat", 1); // "You eat to get your food."
  const plantIn = t.word("plants", 1); // "Plants don't."
  const make = t.cue("make");
  const makeWord = t.word("make", 1); // "Plants make their own food"
  const food = t.word("food", 2); // "…their own food" → a glucose ring forms in the leaf
  const define = t.cue("define");
  const defWord = t.word("definition", 1);
  const markScheme = t.word("mark", 1); // "…the mark scheme wants"
  const wordForWord = t.word("word", 1); // "Learn it word for word."
  const defLine = t.cue("defLine");
  const chipSyn = t.word("synthesise", 1);
  const chipCarb = t.word("carbohydrates", 1);
  const chipRaw = t.word("raw", 1);
  const chipLight = t.word("energy", 1);
  const synthesise = t.cue("synthesise"); // "Let's break that down."
  const synWord = t.word("synthesise", 2); // "Synthesise means make."
  const means = t.word("means", 1);
  const carbs = t.cue("carbs");
  const makes = t.word("makes", 1); // "The carbohydrate it makes is glucose…"
  const glucose = t.word("glucose", 1);
  const simple = t.word("simple", 1);
  const raw = t.cue("raw");
  const co2 = t.word("carbon", 1);
  const water = t.word("water", 1);
  const light = t.cue("light");
  const sun = t.word("energy", 2); // "And the energy to do it…"
  const doIt = t.word("do", 1);
  const lightWord = t.word("light", 2); // "…comes from light."
  return {
    eat,
    plate,
    plantIn,
    make,
    makeWord,
    food,
    define,
    defWord,
    markScheme,
    wordForWord,
    defLine,
    chipSyn,
    chipCarb,
    chipRaw,
    chipLight,
    synthesise,
    synWord,
    means,
    carbs,
    makes,
    glucose,
    simple,
    raw,
    co2,
    water,
    light,
    sun,
    doIt,
    lightWord,
    end: t.dur,
  };
};

export const s03Sfx = (t: CueFns): SfxEvent[] => {
  const k = s03Timing(t);
  return [
    { frame: k.food - 4, sfx: "shimmer_sweet", gainDb: -10 }, // glucose forms in the leaf
    { frame: k.defWord, sfx: "ui_blip", gainDb: -9 }, // "Photosynthesis" headline
    { frame: k.chipSyn, sfx: "ui_blip", gainDb: -11 }, // the definition's chips start to build
    { frame: k.means + 4, sfx: "whoosh_soft", gainDb: -12 }, // chip flips: synthesise = make
    { frame: k.glucose, sfx: "shimmer_sweet", gainDb: -10 }, // glucose ring under "carbohydrates"
    { frame: k.co2, sfx: "ui_blip", gainDb: -11 }, // raw materials appear
    { frame: k.sun, sfx: "ui_blip", gainDb: -11 }, // the sun: energy from light
  ];
};
