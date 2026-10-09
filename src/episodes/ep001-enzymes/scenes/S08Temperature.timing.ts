import type { CueFns, SfxEvent } from "../../../lib/cues";

/** A spoken word's frame, or a cue-relative fallback if the script wording changes later. */
const w = (t: CueFns, text: string, nth: number, fallback: number) => {
  try {
    return t.word(text, nth);
  } catch {
    return fallback;
  }
};
const wEnd = (t: CueFns, text: string, nth: number, fallback: number) => {
  try {
    return t.wordEnd(text, nth);
  } catch {
    return fallback;
  }
};

/**
 * S08 key moments (scene-relative frames), shared by the animation and the sound effects.
 * The temperature arc S08 → S09 → S10 is one continuous sequence; see S08-S10-arc.ts.
 */
export const s08Timing = (t: CueFns) => {
  const temperature = t.cue("temperature");
  const jiggle = t.cue("jiggle");
  const warm = t.cue("warm");
  const kinetic = w(t, "kinetic", 1, warm + 34);
  const moveFaster = w(t, "faster", 1, warm + 87);
  const collide = t.cue("collide");
  const bump = w(t, "bump", 1, collide + 39);
  const often = w(t, "often", 1, collide + 75);
  const energy = w(t, "energy", 2, collide + 111);
  const faster = t.cue("faster");
  const successful = w(t, "successful", 1, faster + 7);
  const lands = w(t, "lands", 1, faster + 72);
  const complexWord = w(t, "enzyme–substrate", 1, faster + 135);
  const complexesEnd = wEnd(t, "complexes", 1, faster + 200);
  const rateWord = w(t, "rate", 1, faster + 221);
  const upTo = t.cue("upToAPoint");
  const warmer = w(t, "warmer", 1, upTo + 31);
  const optimum = t.cue("optimum");
  const peak = w(t, "peaks", 1, optimum + 36);
  const optWord = w(t, "optimum", 1, optimum + 63);
  const deg = w(t, "37", 1, optimum + 165);
  const body = w(t, "body", 2, optimum + 208);

  // Derived beats.
  const thermoIn = temperature - 4; // thermometer arrives on "temperature"
  const heatA = warm + 4; // 10 °C → 25 °C over "Heat them up, and they gain kinetic energy: they move faster"
  const heatB = Math.max(heatA + 40, moveFaster + 4);
  const heroApproach = Math.max(successful + 6, lands - 44); // a substrate heads for the active site…
  const heroDock = lands; // …and lands in it on "lands"
  const heroSnip = Math.max(heroDock + 20, complexesEnd + 6); // the complex reacts once "complexes" is said
  const irisA = Math.max(heroSnip + 10, rateWord - 22); // zoom out into the lens: "a faster rate of reaction"
  const irisB = irisA + 40;
  const axesA = irisA + 28; // once the lens has settled out of the graph's way
  const axesB = axesA + 20;
  const traceA = axesB + 2; // the curve so far draws on
  const traceB = traceA + 22;
  const riseA = upTo + 8; // 25 °C → 37 °C on "Up to a point, warmer means faster"
  const riseB = optimum - 4;
  return {
    temperature,
    jiggle,
    warm,
    kinetic,
    moveFaster,
    collide,
    bump,
    often,
    energy,
    faster,
    successful,
    lands,
    complexWord,
    complexesEnd,
    rateWord,
    upTo,
    warmer,
    optimum,
    peak,
    optWord,
    deg,
    body,
    thermoIn,
    heatA,
    heatB,
    heroApproach,
    heroDock,
    heroSnip,
    irisA,
    irisB,
    axesA,
    axesB,
    traceA,
    traceB,
    riseA,
    riseB,
    end: t.dur,
  };
};

export const s08Sfx = (t: CueFns): SfxEvent[] => {
  const k = s08Timing(t);
  return [
    { frame: k.thermoIn, sfx: "whoosh_soft", gainDb: -10 },
    { frame: k.heroDock, sfx: "pop_bind", gainDb: -4 },
    { frame: k.heroSnip, sfx: "snip", gainDb: -4 },
    { frame: k.irisA + 2, sfx: "whoosh_zoom", gainDb: -12 },
    { frame: k.optWord, sfx: "ui_blip", gainDb: -8 },
  ];
};
