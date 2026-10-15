import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S19 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s19Timing = (t: CueFns) => {
  const recap = t.cue("recap"); // "Let's recap."
  // card 1: "Photosynthesis: carbon dioxide plus water gives glucose plus oxygen, in the presence of light and chlorophyll."
  const r1 = t.cue("r1");
  const c1 = {
    co2: t.word("carbon", 1),
    water: t.word("water", 1),
    gives: t.word("gives", 1),
    glucose: t.word("glucose", 1),
    oxygen: t.word("oxygen", 1),
    light: t.word("light", 1),
    chlorophyll: t.word("chlorophyll", 1),
  };
  // card 2: "Chlorophyll transfers energy from light into energy in chemicals."
  const r2 = t.cue("r2");
  const c2 = { transfers: t.word("transfers", 1), light: t.word("light", 2), chemicals: t.word("chemicals", 1) };
  // card 3: "Glucose is used for respiration, starch, cellulose, sucrose and nectar."
  const r3 = t.cue("r3");
  const c3 = [t.word("respiration", 1), t.word("starch", 1), t.word("cellulose", 1), t.word("sucrose", 1), t.word("nectar", 1)] as const;
  // card 4: "Nitrate ions make amino acids. Magnesium ions make chlorophyll."
  const r4 = t.cue("r4");
  const c4 = { amino: t.word("amino", 1), magnesium: t.word("magnesium", 1), chlorophyll: t.word("chlorophyll", 3) };
  // card 5: "Leaves are broad, thin, and built in layers, each adapted for photosynthesis."
  const r5 = t.cue("r5");
  const c5 = { broad: t.word("broad", 1), thin: t.word("thin", 1), layers: t.word("layers", 1), adapted: t.word("adapted", 1) };
  // card 6: "Light, carbon dioxide and temperature can all be limiting factors."
  const r6 = t.cue("r6");
  const c6 = { co2: t.word("carbon", 2), temperature: t.word("temperature", 1), limiting: t.word("limiting", 1) };
  // "And that's plant nutrition." — the cards make way for the title (it must be settled by the cut to S20)
  const title = Math.min(t.cue("title"), t.dur - 60);
  return { recap, r1, c1, r2, c2, r3, c3, r4, c4, r5, c5, r6, c6, title, end: t.dur };
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
