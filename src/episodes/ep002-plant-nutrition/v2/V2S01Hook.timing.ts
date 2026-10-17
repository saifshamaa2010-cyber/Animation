import type { CueFns } from "../../../lib/cues";
import { s01Timing } from "../scenes/S01Hook.timing";

/**
 * EP002 v2 · S01 key moments: v1's beats (same narration) plus the journal's extra ones.
 * Pure TS (no React): the scene and its sound effects both read it.
 */
export const v2s01Timing = (t: CueFns) => {
  const k = s01Timing(t);
  const four = t.word("four");
  const ago = Math.max(four + 24, t.wordEnd("ago"));
  const jan = t.word("Jan");
  const helmontEnd = Math.max(jan + 20, t.wordEnd("Helmont"));
  const pot = t.word("pot");
  // the balance: the sapling goes on a pan, a small weight balances it; then a heap of soil, big weights
  const sapOn = t.word("weighed", 1);
  const treeWeight = Math.max(sapOn + 12, k.tickTree);
  const soilOn = Math.max(treeWeight + 18, k.row2);
  const soilWeights = Math.max(soilOn + 12, k.tickSoil);
  const nothing = t.word("nothing");
  const waterEnd = Math.max(nothing + 20, t.wordEnd("water"));
  const seventy = t.word("seventy-four");
  const kgEnd = Math.max(seventy + 18, t.wordEnd("kilograms"));
  const fifty = t.word("fifty-seven");
  const gEnd = Math.max(fifty + 16, t.wordEnd("grams"));
  const how = t.word("how", 1);
  return { ...k, four, ago, jan, helmontEnd, pot, sapOn, treeWeight, soilOn, soilWeights, nothing, waterEnd, seventy, kgEnd, fifty, gEnd, how };
};
