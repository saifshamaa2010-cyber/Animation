import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S17 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s17Timing = (t: CueFns) => {
  const reveal = t.cue("reveal");
  // ---- tube A, in the light: purple
  const lightTube = t.cue("lightTube");
  const indicatorW = t.word("indicator", 1); // "…the indicator turns purple"
  const purpleW = t.word("purple", 1);
  const ps1 = t.word("photosynthesis", 1); // "Photosynthesis is faster than respiration"
  const r1 = t.word("respiration", 1);
  const takes = t.word("takes", 1);
  const gives1 = t.word("gives", 1); // "…than it gives out."
  // ---- tube B, in the dark: yellow
  const darkTube = t.cue("darkTube");
  const yellowW = t.word("yellow", 1);
  const noPs = t.word("no", 1); // "There's no photosynthesis"
  const r2 = t.word("respiration", 2); // "…but respiration carries on"
  const gives2 = t.word("gives", 2); // "…the leaf gives out carbon dioxide"
  // ---- tube C, no leaf: the control
  const controlTube = t.cue("controlTube");
  const noLeaf = t.word("no", 2); // "The tube with no leaf"
  const staysRed = t.word("red", 1);
  const control = t.word("control", 1);
  const leafCaused = t.word("leaf", 4); // "…that the leaf caused the colour changes"
  // ---- dim light: the rates are equal
  const dim = t.cue("dim");
  const dimW = t.word("dim", 1);
  const rates = t.word("rates", 1);
  const equal = t.word("equal", 1);
  const staysRed2 = t.word("red", 2);
  // ---- the myth and the exam word
  const myth = t.cue("myth");
  const mythRespire = t.word("respire", 1); // the myth: "…that plants only respire at night"
  const bust = t.cue("bust");
  const respire = t.word("respire", 2); // "Plants respire all the time"
  const all = t.word("all", 1);
  const day = t.word("day", 1);
  const night = t.word("night", 2); // "…day and night"
  const net = t.cue("net");
  const bright = t.word("bright", 1);
  const faster2 = t.word("faster", 2); // "…photosynthesis is just faster"
  const netW = t.word("net", 1); // "…a net uptake of carbon dioxide"
  const netWord = t.cue("netWord"); // "Net is the word examiners look for."
  return {
    reveal,
    lightTube,
    indicatorW,
    purpleW,
    ps1,
    r1,
    takes,
    gives1,
    darkTube,
    yellowW,
    noPs,
    r2,
    gives2,
    controlTube,
    noLeaf,
    staysRed,
    control,
    leafCaused,
    dim,
    dimW,
    rates,
    equal,
    staysRed2,
    myth,
    mythRespire,
    bust,
    respire,
    all,
    day,
    night,
    net,
    bright,
    faster2,
    netW,
    netWord,
    end: t.dur,
  };
};

export const s17Sfx = (t: CueFns): SfxEvent[] => {
  const k = s17Timing(t);
  return [
    { frame: k.reveal + 2, sfx: "whoosh_soft", gainDb: -14 }, // a few hours later
    { frame: k.purpleW, sfx: "ui_blip", gainDb: -10 }, // tube A turns purple
    { frame: k.ps1, sfx: "ui_blip", gainDb: -11 }, // photosynthesis bar
    { frame: k.r1, sfx: "ui_blip", gainDb: -12 }, // respiration bar
    { frame: k.darkTube, sfx: "whoosh_soft", gainDb: -10 }, // foil lifted off tube B
    { frame: k.yellowW, sfx: "ui_blip", gainDb: -10 }, // yellow
    { frame: k.staysRed, sfx: "ui_blip", gainDb: -11 }, // control stays red
    { frame: k.dim, sfx: "whoosh_soft", gainDb: -12 }, // a fresh tube in dim light
    { frame: k.equal, sfx: "ui_blip", gainDb: -10 }, // rates equal
    { frame: k.myth, sfx: "card_in", gainDb: -6 }, // myth card
    { frame: k.respire, sfx: "strike", gainDb: -6 }, // "only at night" struck out
    { frame: k.all, sfx: "ui_blip", gainDb: -9 }, // "all the time"
    { frame: k.netW, sfx: "card_in", gainDb: -9 }, // exam tip: net uptake
    { frame: k.netWord, sfx: "ui_blip", gainDb: -10 }, // "net" underlined
  ];
};
