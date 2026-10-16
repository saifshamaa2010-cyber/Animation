import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * S19 key moments, derived from the narration (shared by the animation and the sound effects).
 * Every key is a flat number (or an array) so `scripts/check-cues.ts` can show each one against the words.
 */
export const s19Timing = (t: CueFns) => {
  const recap = t.cue("recap"); // "Let's recap."
  // card 1: "Photosynthesis: carbon dioxide plus water gives glucose plus oxygen, in the presence of light and chlorophyll."
  const r1 = t.cue("r1");
  const c1Co2 = t.word("carbon", 1);
  const c1Water = t.word("water", 1);
  const c1Gives = t.word("gives", 1);
  const c1Glucose = t.word("glucose", 1);
  const c1Oxygen = t.word("oxygen", 1);
  const c1Light = t.word("light", 1);
  const c1Chlorophyll = t.word("chlorophyll", 1);
  // card 2: "Chlorophyll transfers energy from light into energy in chemicals."
  const r2 = t.cue("r2");
  const c2Transfers = t.word("transfers", 1);
  const c2Light = t.word("light", 2);
  const c2Chemicals = t.word("chemicals", 1);
  // card 3: "Glucose is used for respiration, starch, cellulose, sucrose and nectar."
  const r3 = t.cue("r3");
  const c3 = [t.word("respiration", 1), t.word("starch", 1), t.word("cellulose", 1), t.word("sucrose", 1), t.word("nectar", 1)] as const;
  // card 4: "Nitrate ions are needed to make amino acids. Magnesium ions are needed to make chlorophyll."
  const r4 = t.cue("r4");
  const c4Amino = t.word("amino", 1);
  const c4Magnesium = t.word("magnesium", 1);
  const c4Chlorophyll = t.word("chlorophyll", 3); // #1 and #2 are in cards 1 and 2
  // card 5: "Leaves are broad, thin, and built in layers, each adapted for photosynthesis."
  const r5 = t.cue("r5");
  const c5Broad = t.word("broad", 1);
  const c5Thin = t.word("thin", 1);
  const c5Layers = t.word("layers", 1);
  const c5Adapted = t.word("adapted", 1);
  // card 6: "Light intensity, carbon dioxide concentration and temperature can all be limiting factors."
  // the three factors arrive as rows in the exam's own words, each on its word; "limiting" lights all three
  const r6 = t.cue("r6"); // "Light intensity"
  const c6Co2 = t.word("carbon", 2); // "carbon dioxide concentration"
  const c6Temperature = t.word("temperature", 1);
  const c6Limiting = t.word("limiting", 1);
  // "And that's plant nutrition." — the cards make way for the title (it must be settled by the cut to S20)
  const title = Math.min(t.cue("title"), t.dur - 60);
  return {
    recap,
    r1,
    c1Co2,
    c1Water,
    c1Gives,
    c1Glucose,
    c1Oxygen,
    c1Light,
    c1Chlorophyll,
    r2,
    c2Transfers,
    c2Light,
    c2Chemicals,
    r3,
    c3,
    r4,
    c4Amino,
    c4Magnesium,
    c4Chlorophyll,
    r5,
    c5Broad,
    c5Thin,
    c5Layers,
    c5Adapted,
    r6,
    c6Co2,
    c6Temperature,
    c6Limiting,
    /** card 6: the frame each factor row arrives (light intensity, CO₂ concentration, temperature) */
    c6Rows: [r6, c6Co2, c6Temperature] as const,
    title,
    end: t.dur,
  };
};

export const s19Sfx = (t: CueFns): SfxEvent[] => {
  const k = s19Timing(t);
  return [
    { frame: k.recap + 2, sfx: "whoosh_soft", gainDb: -13 }, // six empty places
    ...[k.r1, k.r2, k.r3, k.r4, k.r5, k.r6].map((frame) => ({ frame, sfx: "card_in", gainDb: -11 })), // each card turns over
    { frame: k.title, sfx: "whoosh_soft", gainDb: -11 }, // the cards make way
    { frame: k.title + 16, sfx: "chime_title", gainDb: -8 }, // "Plant Nutrition"
  ];
};
