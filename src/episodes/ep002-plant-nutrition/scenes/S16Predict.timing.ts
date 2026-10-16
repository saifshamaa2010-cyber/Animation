import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S16 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s16Timing = (t: CueFns) => {
  // ---- "One more practical."
  const indicator = t.cue("indicator");
  // ---- the indicator: one demo tube, the colour key builds as each colour is named
  const hydro = t.cue("indicatorDef"); // "Hydrogencarbonate indicator shows…"
  const co2 = t.word("carbon", 1); // "…how much carbon dioxide is in a solution"
  const red = t.cue("red");
  const air = t.word("air", 1); // "…carbon dioxide in air"
  const redWord = t.word("red", 1);
  const yellow = t.cue("yellow");
  const more = t.word("more", 2); // "With more carbon dioxide" (#1 is "One more practical")
  const yellowWord = t.word("yellow", 1);
  const purple = t.cue("purple");
  const less = t.word("less", 1);
  const purpleWord = t.word("purple", 1);
  // ---- the three tubes
  const tubes = t.cue("tubes");
  const three = t.word("three", 1);
  // ---- the bungs: sealed, so no CO2 from the air gets in or out
  const bungs = t.cue("bungs");
  const sealed = t.word("sealed", 1);
  const bungsW = t.word("bungs", 1);
  const noCo2 = t.word("no", 1); // "…so no carbon dioxide from the air…"
  const airW = t.word("air", 2); // "…from the air can get in or out"
  const inOut = t.word("in", 3); // "…get in or out" (#1 "is in a solution", #2 "in air")
  // ---- tube A: pondweed in bright light
  const tubeA = t.cue("tubeA");
  const weedA = t.word("pondweed", 1);
  const bright = t.word("bright", 1);
  const light = t.word("light", 1);
  // ---- tube B: pondweed, wrapped in foil
  const tubeB = t.cue("tubeB");
  const weedB = t.word("pondweed", 2);
  const wrapped = t.word("wrapped", 1);
  const dark = t.word("dark", 1);
  // ---- tube C: no pondweed
  const tubeC = t.cue("tubeC");
  const noWeed = t.word("no", 2); // "And one has no pondweed at all"
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
    bungs,
    sealed,
    bungsW,
    noCo2,
    airW,
    inOut,
    tubeA,
    weedA,
    bright,
    light,
    tubeB,
    weedB,
    wrapped,
    dark,
    tubeC,
    noWeed,
    question,
    colour,
    after,
    pauseNow,
    silence,
    end,
  };
};

/** Frames (scene-relative) where the outside CO2 dots hit the bungs and bounce off (S16 draws the same). */
export const s16Bounces = (k: ReturnType<typeof s16Timing>) => [0, 1, 2].map((i) => k.airW - 4 + i * 9);

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
    { frame: s16Bounces(k)[0], sfx: "tick", gainDb: -17 }, // air CO2 bounces off a bung
    { frame: k.bright, sfx: "tick", gainDb: -12 }, // the lamp switches on
    { frame: k.wrapped, sfx: "whoosh_soft", gainDb: -14 }, // foil wraps tube B
    { frame: k.colour, sfx: "ui_blip", gainDb: -11 }, // question marks
    { frame: k.pauseNow, sfx: "card_in", gainDb: -8 }, // pause & predict
    // the countdown: one soft tick per second of the silence
    ...Array.from({ length: ticks }, (_, i) => ({ frame: k.silence + i * t.fps, sfx: i === ticks - 1 ? "tock" : "tick", gainDb: -15 })),
  ];
};
