import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S18 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s18Timing = (t: CueFns) => {
  const back = t.cue("back");
  const helmont = t.word("van");
  const where = t.cue("where");
  const kg = t.word("seventy-four");
  const co2In = t.cue("co2In");
  const waterIn = t.cue("waterIn");
  const water1 = t.word("water", 1);
  const built = t.cue("built");
  const glucose = t.word("glucose");
  const light = t.word("light");
  const buildInto = t.word("built", 1);
  const cellulose = t.word("cellulose");
  const starch = t.word("starch");
  const proteins = t.word("proteins");
  const minerals = t.cue("minerals");
  const ions = t.word("mineral");
  const nitrate = t.word("nitrate");
  const magnesium = t.word("magnesium");
  const thought = t.cue("thought");
  const madeOf = t.word("made");
  const partly = t.cue("partly");
  const partlyW = t.word("partly");
  const full = t.word("full");
  const water3 = t.word("water", 3);
  const wood = t.cue("wood");
  const woodW = t.word("wood");
  const co2Again = t.word("carbon", 2);
  const thinAir = t.cue("thinAir");
  const thin = t.word("thin");
  // the sugar reaches the trunk and locks in as cellulose, one ring after another (bottom up)
  const flowStart = buildInto - 4;
  const ringEvery = Math.max(5, Math.min(9, Math.floor((minerals - buildInto - 50) / 5)));
  const firstLock = flowStart + 34;
  return {
    back,
    helmont,
    where,
    kg,
    co2In,
    waterIn,
    water1,
    built,
    glucose,
    light,
    buildInto,
    flowStart,
    ringEvery,
    firstLock,
    cellulose,
    starch,
    proteins,
    minerals,
    ions,
    nitrate,
    magnesium,
    thought,
    madeOf,
    partly,
    partlyW,
    full,
    water3,
    wood,
    woodW,
    co2Again,
    thinAir,
    thin,
    end: t.dur,
  };
};

export const s18Sfx = (t: CueFns): SfxEvent[] => {
  const k = s18Timing(t);
  return [
    { frame: k.kg + 4, sfx: "ui_blip", gainDb: -10 }, // circle round "+74 kg"
    { frame: k.co2In - 4, sfx: "whoosh_soft", gainDb: -11 }, // carbon dioxide drifts in from the air
    { frame: k.glucose, sfx: "shimmer_sweet", gainDb: -9 }, // glucose forms in the leaves (light lands)
    { frame: k.firstLock, sfx: "pop_bind", gainDb: -8 }, // glucose locks into the wood as cellulose
    { frame: k.ions + 2, sfx: "ui_blip", gainDb: -10 }, // the soil's −57 g row lights: mineral ions
    { frame: k.woodW, sfx: "shimmer_sweet", gainDb: -8 }, // the wood glows: built from carbon dioxide
  ];
};
