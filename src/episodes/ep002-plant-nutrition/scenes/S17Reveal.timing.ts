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
  const takes = t.word("takes", 1); // "…so the pondweed takes in more carbon dioxide…"
  const gives1 = t.word("gives", 1); // "…than it gives out."
  // ---- tube B, in the dark: yellow
  const darkTube = t.cue("darkTube");
  const yellowW = t.word("yellow", 1);
  const noPs = t.word("no", 1); // "There's no photosynthesis"
  const r2 = t.word("respiration", 2); // "…but respiration carries on"
  const gives2 = t.word("gives", 2); // "…the pondweed gives out carbon dioxide"
  // ---- tube C, no pondweed: the control
  const controlTube = t.cue("controlTube");
  const noWeed = t.word("no", 2); // "The tube with no pondweed"
  const staysRed = t.word("red", 1);
  const control = t.word("control", 1);
  const weedCaused = t.word("pondweed", 4); // "…that the pondweed caused the colour changes"
  // ---- dim light: the rates are equal, so there is no net exchange
  const dim = t.cue("dim");
  const dimW = t.word("dim", 1);
  const rates = t.word("rates", 1);
  const equal = t.word("equal", 1);
  const noNet = t.cue("noNet"); // "Then there's no net uptake or release of carbon dioxide…"
  const noNetW = t.word("net", 1);
  const uptake = t.word("uptake", 1);
  const release = t.word("release", 1);
  const staysRed2 = t.word("red", 2); // "…so the indicator stays red."
  // ---- the myth
  const myth = t.cue("myth");
  const mythRespire = t.word("respire", 1); // the myth: "…that plants only respire at night"
  const bust = t.cue("bust");
  const respire = t.word("respire", 2); // "Plants respire all the time"
  const all = t.word("all", 1);
  const day = t.word("day", 1);
  const night = t.word("night", 2); // "…day and night"
  // ---- bright light: a net uptake; what net means; the exam word
  const net = t.cue("net");
  const bright = t.word("bright", 1);
  const faster2 = t.word("faster", 2); // "…photosynthesis is just faster"
  const netW = t.word("net", 2); // "…so there's a net uptake of carbon dioxide"
  const netWord = t.cue("netWord"); // "Net means overall: …"
  const overallW = t.word("overall", 1);
  const takes2 = t.word("takes", 2); // "…the plant takes in more carbon dioxide…"
  const gives3 = t.word("gives", 3); // "…than it gives out."
  const netExam = t.cue("netExam"); // "Net is the word examiners look for."
  const wordW = t.word("word", 1);
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
    noWeed,
    staysRed,
    control,
    weedCaused,
    dim,
    dimW,
    rates,
    equal,
    noNet,
    noNetW,
    uptake,
    release,
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
    overallW,
    takes2,
    gives3,
    netExam,
    wordW,
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
    { frame: k.noNetW, sfx: "whoosh_soft", gainDb: -16 }, // respiration cancels all of photosynthesis
    { frame: k.myth, sfx: "card_in", gainDb: -6 }, // myth card
    { frame: k.respire, sfx: "strike", gainDb: -6 }, // "only at night" struck out
    { frame: k.all, sfx: "ui_blip", gainDb: -9 }, // "all the time"
    { frame: k.netW, sfx: "ui_blip", gainDb: -11 }, // the net part of the bar is outlined
    { frame: k.overallW + 6, sfx: "whoosh_soft", gainDb: -16 }, // respiration slides onto photosynthesis
    { frame: k.netExam, sfx: "card_in", gainDb: -9 }, // exam tip: net uptake
    { frame: k.wordW, sfx: "ui_blip", gainDb: -10 }, // "net" underlined
  ];
};
