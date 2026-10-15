import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S08 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s08Timing = (t: CueFns) => {
  // ---- part 1: glucose is only C, H, O; proteins are made of amino acids, which contain N
  const chon = t.cue("chon");
  const glucose = t.word("glucose", 1);
  const carbon = t.word("carbon", 1);
  const hydrogen = t.word("hydrogen", 1);
  const oxygen = t.word("oxygen", 1);
  const protein = t.cue("protein"); // "To grow, a plant also needs proteins…"
  const proteins = t.word("proteins", 1);
  const madeFrom = t.word("made", 1); // "…and proteins are made from amino acids."
  const amino = t.word("amino", 1);
  const nitrogen = t.cue("nitrogen"); // "Amino acids contain nitrogen."
  const contain = t.word("contain", 1);
  const nWord = t.word("nitrogen", 1);
  // ---- part 2: nitrate
  const nitrate = t.cue("nitrate"); // "So plants absorb nitrate ions from the soil, through their roots."
  const nitrateWord = t.word("nitrate", 1);
  const soil = t.word("soil", 1);
  const roots = t.word("roots", 1);
  const nitrateUse = t.cue("nitrateUse"); // "Nitrate ions are needed to make amino acids."
  const makeAA = t.word("make", 1);
  const aminoAA = t.word("amino", 3);
  const nitrateLack = t.cue("nitrateLack"); // "Without enough nitrate, the plant has stunted growth, and its older leaves turn yellow."
  const enoughN = t.word("nitrate", 3);
  const stunted = t.word("stunted", 1);
  const older = t.word("older", 1);
  const turnYellow = t.word("turn", 1);
  const yellowN = t.word("yellow", 1);
  // ---- part 3: magnesium
  const magnesium = t.cue("magnesium"); // "Plants also absorb magnesium ions."
  const mgWord = t.word("magnesium", 1);
  const magnesiumUse = t.cue("magnesiumUse"); // "Magnesium ions are needed to make chlorophyll."
  const makeChl = t.word("make", 2);
  const chlorophyll = t.word("chlorophyll", 1);
  const magLack = t.cue("magLack"); // "Without enough magnesium, the leaves turn yellow between the veins."
  const yellowMg = t.word("yellow", 2);
  const between = t.word("between", 1);
  const lessPs = t.cue("lessPs"); // "Less chlorophyll means less light is absorbed, so there's less photosynthesis."
  const lessLight = t.word("light", 1);
  const lessPhoto = t.word("photosynthesis", 1);
  // ---- part 4: the exam chain
  const examLine = t.cue("examLine"); // "In an exam, link three things: the ion, what it's used to make, and what happens without it."
  const link = t.word("link", 1);
  const ion = t.word("ion", 1);
  const used = t.word("used", 1);
  const happens = t.word("happens", 1);
  return {
    chon,
    glucose,
    carbon,
    hydrogen,
    oxygen,
    protein,
    proteins,
    madeFrom,
    amino,
    nitrogen,
    contain,
    nWord,
    nitrate,
    nitrateWord,
    soil,
    roots,
    nitrateUse,
    makeAA,
    aminoAA,
    nitrateLack,
    enoughN,
    stunted,
    older,
    turnYellow,
    yellowN,
    magnesium,
    mgWord,
    magnesiumUse,
    makeChl,
    chlorophyll,
    magLack,
    yellowMg,
    between,
    lessPs,
    lessLight,
    lessPhoto,
    examLine,
    link,
    ion,
    used,
    happens,
    end: t.dur,
  };
};

export const s08Sfx = (t: CueFns): SfxEvent[] => {
  const k = s08Timing(t);
  return [
    { frame: k.carbon, sfx: "ui_blip", gainDb: -12 }, // C, H, O atoms under glucose
    { frame: k.proteins, sfx: "pop_bind", gainDb: -10 }, // the protein appears
    { frame: k.madeFrom + 2, sfx: "whoosh_soft", gainDb: -14 }, // it unfolds into its amino acids
    { frame: k.nWord, sfx: "ui_blip", gainDb: -8 }, // N: the element glucose doesn't have
    { frame: k.nitrate, sfx: "whoosh_soft", gainDb: -11 }, // the plant in the soil takes the stage
    { frame: k.roots, sfx: "pop_bind", gainDb: -13 }, // nitrate ions enter the roots
    { frame: k.nitrateUse + 6, sfx: "whoosh_zoom", gainDb: -13 }, // lens: inside a leaf cell
    { frame: k.aminoAA, sfx: "pop_bind", gainDb: -11 }, // amino acids built
    { frame: k.nitrateLack + 4, sfx: "whoosh_soft", gainDb: -12 }, // the nitrate-deficient plant arrives
    { frame: k.yellowN, sfx: "ui_blip", gainDb: -12 }, // older leaves turn yellow
    { frame: k.mgWord, sfx: "ui_blip", gainDb: -11 }, // magnesium ions appear
    { frame: k.magnesiumUse + 6, sfx: "whoosh_zoom", gainDb: -13 }, // lens again
    { frame: k.chlorophyll, sfx: "shimmer_sweet", gainDb: -15 }, // chloroplast turns green
    { frame: k.magLack + 2, sfx: "whoosh_soft", gainDb: -12 }, // the big leaf
    { frame: k.lessPs + 2, sfx: "ui_blip", gainDb: -12 }, // causal chain, link 1
    { frame: k.lessPhoto, sfx: "ui_blip", gainDb: -12 }, // causal chain, link 3
    { frame: k.examLine + 4, sfx: "card_in", gainDb: -10 }, // exam chain: three empty places
    { frame: k.ion, sfx: "ui_blip", gainDb: -10 }, // 1: the ion
    { frame: k.used, sfx: "ui_blip", gainDb: -11 }, // what it makes
    { frame: k.happens, sfx: "ui_blip", gainDb: -11 }, // what happens without it
  ];
};
