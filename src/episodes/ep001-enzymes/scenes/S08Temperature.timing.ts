import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * S08 key moments (scene-relative frames), shared by the animation and the sound effects.
 * The temperature arc S08 → S09 → S10 is one continuous sequence; see S08-S10-arc.ts.
 * Every spoken-word lookup is strict: if the script wording changes, this throws instead of
 * silently falling back to a guessed frame.
 */
export const s08Timing = (t: CueFns) => {
  const temperature = t.cue("temperature");
  const jiggle = t.cue("jiggle");
  const warm = t.cue("warm");
  const kinetic = t.word("kinetic", 1);
  const moveFaster = t.word("faster", 1);
  const collide = t.cue("collide");
  const bump = t.word("bump", 1);
  const often = t.word("often", 1);
  const energy = t.word("energy", 2);
  const faster = t.cue("faster");
  const successful = t.word("successful", 1);
  const landing = t.word("landing", 1);
  const complexWord = t.word("enzyme–substrate", 1);
  const complexesEnd = t.wordEnd("complexes", 1);
  const rateWord = t.word("rate", 1);
  const upTo = t.cue("upToAPoint");
  const warmer = t.word("warmer", 1);
  const optimum = t.cue("optimum");
  const peak = t.word("peaks", 1);
  const optWord = t.word("optimum", 1);
  const deg = t.word("37", 1);
  const body = t.word("body", 2);

  // Derived beats.
  const thermoIn = temperature - 4; // thermometer arrives on "temperature"
  const heatA = warm + 4; // 10 °C → 25 °C over "Heat them up, and they gain kinetic energy: they move faster"
  const heatB = Math.max(heatA + 40, moveFaster + 4);
  const heroApproach = landing - 44; // a substrate drifts towards the active site…
  const heroDock = landing; // …and lands in it on "landing"
  const heroSnip = Math.max(heroDock + 20, complexesEnd + 6); // the complex reacts once "complexes" is said
  const irisA = Math.max(heroSnip + 10, rateWord - 22); // pull back into the lens: "a faster rate of reaction"
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
    landing,
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
