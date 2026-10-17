import type { CueFns } from "../../../lib/cues";
import { s04Timing } from "../scenes/S04Equation.timing";

/**
 * EP002 v2 · S04 beats (shared by the animation and its sound effects): v1's key moments plus the
 * spoken words the recipe card and the garden react to. Pure TS (also evaluated in Node).
 */
export const v2s04Beats = (t: CueFns) => {
  const k = s04Timing(t);
  return {
    ...k,
    // ---- the recipe card
    word: t.word("word", 1), // "Now the word equation."
    eqEnd: t.wordEnd("equation", 1),
    lightEnd: t.wordEnd("light", 1),
    chlEnd: t.wordEnd("chlorophyll", 1),
    reactants: t.word("reactants", 1),
    isnt1: t.word("isn't", 1), // "Light isn't a substance,"
    substanceEnd: t.wordEnd("substance", 1),
    isnt2: t.word("isn't", 2), // "…and chlorophyll isn't used up."
    upEnd: t.wordEnd("up", 1),
    // ---- the garden
    fromEnd: t.wordEnd("from", 1), // "So where do the raw materials come from?"
    soil: t.word("soil", 1),
    stem: t.word("stem", 1),
    waste: t.word("waste", 1), // "Oxygen is a waste product."
    rest: t.word("rest", 1), // "…and the rest diffuses out of the leaf,"
    out: t.word("out", 1),
    airEnd: t.wordEnd("air", 2),
  };
};
