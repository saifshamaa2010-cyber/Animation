import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S11 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s11Timing = (t: CueFns) => {
  // ---- why test for starch
  const prove = t.cue("prove");
  const photosynth = t.word("photosynthesising", 1);
  const test = t.cue("test");
  const forStarch = t.word("starch", 1); // "Test it for starch,"
  const stores = t.word("stores", 1);
  const glucose = t.word("glucose", 1);
  const asStarch = t.word("starch", 2); // "…its glucose as starch."
  // ---- destarching
  const destarch = t.cue("destarch");
  const dark = t.word("dark", 1);
  const dayOrTwo = t.word("day", 1);
  const useUp = t.cue("useUp");
  const noLight = t.word("light", 1);
  const usesUp = t.word("uses", 1);
  const storedStarch = t.word("starch", 3);
  const why = t.cue("why");
  const anyStarch = t.word("starch", 4);
  const made = t.word("made", 1);
  const experiment = t.word("experiment", 1);
  // ---- step 1: boiling water
  const boil = t.cue("boil");
  const leafIn = t.word("leaf", 3); // "put the leaf in boiling water"
  const boiling = t.word("boiling", 1);
  const about = t.word("about", 1);
  const minute = t.word("minute", 1);
  const boilWhy = t.cue("boilWhy");
  const kills = t.word("kills", 1);
  const breaks = t.word("breaks", 1);
  const membranes = t.word("membranes", 1);
  const iodineIn = t.word("iodine", 1); // "so the iodine can get in later"
  // ---- step 2: ethanol
  const ethanol = t.cue("ethanol");
  const off = t.word("off", 1);
  const then = t.word("then", 1);
  const tube = t.word("tube", 1);
  const stand = t.word("stand", 1);
  const hotWater = t.word("water", 2);
  const flammable = t.cue("flammable");
  const flammableW = t.word("flammable", 1);
  const naked = t.word("naked", 1);
  const decolour = t.cue("decolour");
  const removes = t.word("removes", 1);
  const chlorophyll = t.word("chlorophyll", 1);
  const easySee = t.word("see", 1);
  // ---- step 3: warm water
  const rinse = t.cue("rinse");
  const dip = t.word("dip", 1);
  const rinseWhy = t.cue("rinseWhy");
  const brittle = t.word("brittle", 1);
  const softens = t.word("softens", 1);
  // ---- step 4: white tile + iodine
  const tile = t.cue("tile");
  const spread = t.word("spread", 1);
  const white = t.word("white", 1);
  const add = t.word("add", 1);
  const iodine = t.word("iodine", 2);
  const solution = t.word("solution", 1);
  const blueBlack = t.cue("blueBlack");
  const turns = t.word("turns", 1);
  const present = t.word("present", 1);
  const orange = t.cue("orange");
  const stays = t.word("stays", 1);
  const noStarch = t.word("starch", 6);
  // ---- iodine drops (three drops, spaced within "add iodine solution" and the pause after it)
  const dropGap = Math.max(8, Math.min(16, Math.round((blueBlack - add) / 5)));
  const drops = [add + 6, add + 6 + dropGap, add + 6 + dropGap * 2];
  return {
    prove,
    photosynth,
    test,
    forStarch,
    stores,
    glucose,
    asStarch,
    destarch,
    dark,
    dayOrTwo,
    useUp,
    noLight,
    usesUp,
    storedStarch,
    why,
    anyStarch,
    made,
    experiment,
    boil,
    leafIn,
    boiling,
    about,
    minute,
    boilWhy,
    kills,
    breaks,
    membranes,
    iodineIn,
    ethanol,
    off,
    then,
    tube,
    stand,
    hotWater,
    flammable,
    flammableW,
    naked,
    decolour,
    removes,
    chlorophyll,
    easySee,
    rinse,
    dip,
    rinseWhy,
    brittle,
    softens,
    tile,
    spread,
    white,
    add,
    iodine,
    solution,
    drops,
    blueBlack,
    turns,
    present,
    orange,
    stays,
    noStarch,
    end: t.dur,
  };
};

export const s11Sfx = (t: CueFns): SfxEvent[] => {
  const k = s11Timing(t);
  return [
    { frame: k.test, sfx: "ui_blip", gainDb: -10 }, // the iodine bottle arrives
    { frame: k.asStarch, sfx: "shimmer_sweet", gainDb: -13 }, // glucose packed away as starch grains
    { frame: k.dark, sfx: "whoosh_soft", gainDb: -9 }, // the dark box comes down over the plant
    { frame: k.why, sfx: "whoosh_soft", gainDb: -12 }, // the box lifts: a starch-free plant
    { frame: k.boil, sfx: "whoosh_soft", gainDb: -10 }, // step 1 station builds
    { frame: k.boiling + 8, sfx: "bubbles", gainDb: -12 }, // the leaf goes into boiling water
    { frame: k.membranes, sfx: "snip", gainDb: -10 }, // cell membranes break
    { frame: k.off, sfx: "ui_blip", gainDb: -9 }, // flame off
    { frame: k.stand + 18, sfx: "pop_bind", gainDb: -12 }, // tube stands in the hot water
    { frame: k.naked, sfx: "strike", gainDb: -10 }, // never with a naked flame
    { frame: k.removes, sfx: "ui_blip", gainDb: -12 }, // chlorophyll leaves the leaf
    { frame: k.rinse - 6, sfx: "whoosh_soft", gainDb: -11 }, // move to step 3
    { frame: k.brittle, sfx: "crunch_b", gainDb: -12 }, // brittle leaf
    { frame: k.tile - 6, sfx: "whoosh_soft", gainDb: -11 }, // move to step 4
    { frame: k.drops[0] + 14, sfx: "tick", gainDb: -12 }, // first iodine drop lands
    { frame: k.turns, sfx: "pop_bind", gainDb: -9 }, // blue-black: starch present
    { frame: k.orange, sfx: "whoosh_soft", gainDb: -13 }, // the no-starch leaf joins it
  ];
};
