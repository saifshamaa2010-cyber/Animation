import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S06 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s06Timing = (t: CueFns) => {
  // "So, what does the light actually do?"
  const what = t.cue("what");
  const light = t.word("light", 1);
  // "Inside the cells of a leaf are chloroplasts."
  const chloroplasts = t.cue("chloroplasts");
  const cells = t.word("cells", 1);
  const chloroWord = t.word("chloroplasts", 1);
  // "Chloroplasts contain chlorophyll, a green pigment."
  const chlorophyll = t.cue("chlorophyll");
  const chlWord = t.word("chlorophyll", 1);
  const green = t.word("green", 1);
  // "Chlorophyll absorbs light."
  const absorb = t.cue("absorb");
  const absorbs = t.word("absorbs", 1);
  // "Then it transfers energy from light into energy in chemicals, for the synthesis of carbohydrates."
  const transfer = t.cue("transfer");
  const transfersWord = t.word("transfers", 1);
  const chemicals = t.word("chemicals", 1);
  const synthesis = t.word("synthesis", 1);
  const carbohydrates = t.word("carbohydrates", 1);
  // "In other words, that energy ends up stored in glucose."
  const stored = t.cue("stored");
  const storedWord = t.word("stored", 1);
  const glucose = t.word("glucose", 1);
  // "Be careful with your wording here."
  const careful = t.cue("careful");
  // "Never write that chlorophyll makes energy. Energy can't be made."
  const notMake = t.cue("notMake");
  const makes = t.word("makes", 1);
  const made = t.word("made", 1);
  // "Chlorophyll transfers it. So use the syllabus word: transfers."
  const transfers = t.cue("transfers");
  const transfersIt = t.word("transfers", 2);
  const syllabusWord = t.word("transfers", 3);
  return {
    what,
    light,
    chloroplasts,
    cells,
    chloroWord,
    chlorophyll,
    chlWord,
    green,
    absorb,
    absorbs,
    transfer,
    transfersWord,
    chemicals,
    synthesis,
    carbohydrates,
    stored,
    storedWord,
    glucose,
    careful,
    notMake,
    makes,
    made,
    transfers,
    transfersIt,
    syllabusWord,
    end: t.dur,
  };
};

export const s06Sfx = (t: CueFns): SfxEvent[] => {
  const k = s06Timing(t);
  return [
    { frame: k.chloroplasts, sfx: "whoosh_zoom", gainDb: -9 }, // the lens opens: inside the leaf
    { frame: k.chloroWord, sfx: "ui_blip", gainDb: -12 }, // chloroplasts appear
    { frame: k.absorbs + 8, sfx: "ui_blip", gainDb: -12 }, // light lands, chloroplasts glow
    { frame: k.transfersWord, sfx: "whoosh_soft", gainDb: -12 }, // zoom in: energy starts to flow
    { frame: k.chemicals - 4, sfx: "shimmer_sweet", gainDb: -11 }, // the glucose ring forms, glowing
    { frame: k.careful, sfx: "card_in", gainDb: -7 }, // exam tip card
    { frame: k.makes, sfx: "strike", gainDb: -7 }, // "makes energy" struck through
    { frame: k.transfersIt, sfx: "ui_blip", gainDb: -10 }, // "transfers" underlined
  ];
};
