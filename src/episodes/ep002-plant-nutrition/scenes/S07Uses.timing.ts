import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S07 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s07Timing = (t: CueFns) => {
  // "So the plant has made glucose. What happens to it? There are five uses to learn."
  const uses = t.cue("uses");
  const glucose = t.word("glucose", 1);
  const fiveUses = t.word("five", 1);
  // "One. Glucose is used in respiration, to release energy for the plant's cells."
  const one = t.cue("respiration");
  const respWord = t.word("respiration", 1);
  const release = t.word("release", 1);
  const cells = t.word("cells", 1);
  // "Two. Glucose is turned into starch, as an energy store."
  const two = t.cue("starch");
  const starchWord = t.word("starch", 1);
  const store = t.word("store", 1);
  // "Starch is insoluble, so storing it doesn't affect the movement of water by osmosis."
  const insoluble = t.cue("insoluble");
  const insolubleWord = t.word("insoluble", 1);
  const water = t.word("water", 1);
  const osmosis = t.word("osmosis", 1);
  // "Three. Glucose is used to make cellulose, which builds the cell walls."
  const three = t.cue("cellulose");
  const celluloseWord = t.word("cellulose", 1);
  const walls = t.word("walls", 1);
  // "Four. Glucose is changed into sucrose, for transport in the phloem, to other parts of the plant."
  const four = t.cue("sucrose");
  const sucroseWord = t.word("sucrose", 1);
  const transport = t.word("transport", 1);
  const phloem = t.word("phloem", 1);
  const parts = t.word("parts", 1);
  // "And five. Sugars are used to make nectar, in flowers, to attract insects for pollination."
  const fifth = t.cue("nectar");
  const nectarWord = t.word("nectar", 1);
  const flowers = t.word("flowers", 1);
  const attract = t.word("attract", 1);
  const pollination = t.word("pollination", 1);
  // "Respiration. Starch. Cellulose. Sucrose. Nectar."
  const recap = t.cue("five");
  const r1 = t.word("respiration", 2);
  const r2 = t.word("starch", 3);
  const r3 = t.word("cellulose", 2);
  const r4 = t.word("sucrose", 2);
  const r5 = t.word("nectar", 2);
  return {
    uses,
    glucose,
    fiveUses,
    one,
    respWord,
    release,
    cells,
    two,
    starchWord,
    store,
    insoluble,
    insolubleWord,
    water,
    osmosis,
    three,
    celluloseWord,
    walls,
    four,
    sucroseWord,
    transport,
    phloem,
    parts,
    fifth,
    nectarWord,
    flowers,
    attract,
    pollination,
    recap,
    r1,
    r2,
    r3,
    r4,
    r5,
    /** each use's cue, in order */
    starts: [one, two, three, four, fifth] as const,
    /** each use's word in the closing list */
    recapWords: [r1, r2, r3, r4, r5] as const,
    end: t.dur,
  };
};

/** Frames for a glucose ring to travel from the hub to a station. */
export const SUPPLY = 26;

export const s07Sfx = (t: CueFns): SfxEvent[] => {
  const k = s07Timing(t);
  return [
    { frame: k.fiveUses, sfx: "whoosh_soft", gainDb: -11 }, // five spokes reach out from the glucose
    { frame: k.one, sfx: "ui_blip", gainDb: -11 }, // 1 lights, glucose sets off
    { frame: k.release, sfx: "snip", gainDb: -10 }, // glucose broken down: energy released
    { frame: k.two, sfx: "ui_blip", gainDb: -11 }, // 2 lights
    { frame: k.starchWord, sfx: "pop_bind", gainDb: -11 }, // the chain coils up into starch
    { frame: k.insolubleWord, sfx: "ui_blip", gainDb: -10 }, // "insoluble" chip
    { frame: k.three, sfx: "ui_blip", gainDb: -11 }, // 3 lights
    { frame: k.walls, sfx: "pop_bind", gainDb: -11 }, // the wall closes
    { frame: k.sucroseWord, sfx: "pop_bind", gainDb: -10 }, // glucose + fructose → sucrose
    { frame: k.fifth, sfx: "ui_blip", gainDb: -11 }, // 5 lights
    { frame: k.nectarWord, sfx: "shimmer_sweet", gainDb: -11 }, // nectar fills the flower
    { frame: k.attract, sfx: "whoosh_soft", gainDb: -13 }, // a bee arrives
    { frame: k.recap, sfx: "ui_blip", gainDb: -11 }, // the five, one by one
  ];
};
