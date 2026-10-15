import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S16 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s16Timing = (t: CueFns) => {
  // ---- the indicator: one demo tube, the colour key builds as each colour is named
  const indicator = t.cue("indicator");
  const hydro = t.word("Hydrogencarbonate", 1);
  const co2 = t.word("carbon", 1); // "…how much carbon dioxide is in a solution"
  const red = t.cue("red");
  const air = t.word("air", 1);
  const redWord = t.word("red", 1);
  const yellow = t.cue("yellow");
  const more = t.word("more", 2); // "With more carbon dioxide"
  const yellowWord = t.word("yellow", 1);
  const purple = t.cue("purple");
  const less = t.word("less", 1);
  const purpleWord = t.word("purple", 1);
  // ---- the three tubes
  const tubes = t.cue("tubes");
  const three = t.word("three", 1);
  const sealed = t.word("sealed", 1);
  const tubeA = t.cue("tubeA");
  const leafA = t.word("leaf", 1);
  const bright = t.word("bright", 1);
  const light = t.word("light", 1);
  const tubeB = t.cue("tubeB");
  const leafB = t.word("leaf", 2);
  const wrapped = t.word("wrapped", 1);
  const dark = t.word("dark", 1);
  const tubeC = t.cue("tubeC");
  const noLeaf = t.word("no", 1);
  // ---- the question and the pause
  const question = t.cue("question");
  const colour = t.word("colour", 1);
  const after = t.word("after", 1);
  const pauseNow = t.cue("pauseNow");
  /** the silence the viewer predicts in: from the end of "…your prediction." to the next narration */
  const silence = t.wordEnd("prediction", 1);
  const end = t.dur;
  return {
    indicator,
    hydro,
    co2,
    red,
    air,
    redWord,
    yellow,
    more,
    yellowWord,
    purple,
    less,
    purpleWord,
    tubes,
    three,
    sealed,
    tubeA,
    leafA,
    bright,
    light,
    tubeB,
    leafB,
    wrapped,
    dark,
    tubeC,
    noLeaf,
    question,
    colour,
    after,
    pauseNow,
    silence,
    end,
  };
};

export const s16Sfx = (t: CueFns): SfxEvent[] => {
  const k = s16Timing(t);
  const ticks = Math.max(0, Math.floor((k.end - k.silence) / t.fps));
  return [
    { frame: k.hydro, sfx: "ui_blip", gainDb: -11 }, // the indicator is named
    { frame: k.redWord, sfx: "ui_blip", gainDb: -10 }, // red swatch
    { frame: k.more + 4, sfx: "whoosh_soft", gainDb: -15 }, // more CO2 dissolves in
    { frame: k.yellowWord, sfx: "ui_blip", gainDb: -10 }, // yellow swatch
    { frame: k.purpleWord, sfx: "ui_blip", gainDb: -10 }, // purple swatch
    { frame: k.tubes, sfx: "whoosh_soft", gainDb: -10 }, // the key moves aside, the rack arrives
    { frame: k.sealed, sfx: "pop_bind", gainDb: -12 }, // bungs in: sealed
    { frame: k.bright, sfx: "tick", gainDb: -12 }, // the lamp switches on
    { frame: k.wrapped, sfx: "whoosh_soft", gainDb: -14 }, // foil wraps tube B
    { frame: k.colour, sfx: "ui_blip", gainDb: -11 }, // question marks
    { frame: k.pauseNow, sfx: "card_in", gainDb: -8 }, // pause & predict
    // the countdown: one soft tick per second of the silence
    ...Array.from({ length: ticks }, (_, i) => ({ frame: k.silence + i * t.fps, sfx: i === ticks - 1 ? "tock" : "tick", gainDb: -15 })),
  ];
};
