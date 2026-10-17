import type { CueFns } from "../../../lib/cues";
import { s04Timing } from "../scenes/S04Equation.timing";

/**
 * EP002 v2 · S04 key moments (shared by the animation and its sound effects): v1's beats plus the
 * spoken words the recipe card and the garden react to. Pure TS (also evaluated in Node).
 */
export const v2s04Timing = (t: CueFns) => {
  const k = s04Timing(t);
  return {
    ...k,
    // ---- the recipe card
    eqEnd: t.wordEnd("equation", 1),
    co2End: t.wordEnd("dioxide", 1),
    waterEnd: t.wordEnd("water", 1),
    glucoseEnd: t.wordEnd("glucose", 1),
    oxygenEnd: t.wordEnd("oxygen", 1),
    presence: t.word("presence", 1), // "…in the presence of light and chlorophyll"
    lightEnd: t.wordEnd("light", 1),
    chlEnd: t.wordEnd("chlorophyll", 1),
    write: t.word("write", 1), // "so we write those on the arrow"
    arrowEnd: t.wordEnd("arrow", 1),
    condEnd: t.wordEnd("conditions", 1),
    reactantsEnd: t.wordEnd("reactants", 1),
    substanceEnd: t.wordEnd("substance", 1),
    usedUpEnd: t.wordEnd("up", 1), // "…isn't used up."
    // ---- the garden
    rawEnd: t.wordEnd("from", 1), // "So where do the raw materials come from?"
    fromAir: t.word("from", 2), // "…into the leaf from the air."
    airEnd: t.wordEnd("air", 1),
    fromSoil: t.word("from", 3), // "Water is absorbed from the soil"
    soilEnd: t.wordEnd("soil", 1),
    rootsEnd: t.wordEnd("roots", 1),
    stem: t.word("stem", 1),
    xylemEnd: t.wordEnd("xylem", 1),
    leaf2End: t.wordEnd("leaf", 2),
    waste: t.word("waste", 1), // "Oxygen is a waste product."
    productEnd: t.wordEnd("product", 1),
    respEnd: t.wordEnd("respiration", 1),
    out: t.word("out", 1), // "…diffuses out of the leaf,"
    into2: t.word("into", 2), // "…into the air."
    air2End: t.wordEnd("air", 2),
  };
};
