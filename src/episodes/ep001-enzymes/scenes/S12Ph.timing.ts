import type { CueFns, SfxEvent } from "../../../lib/cues";

/** Word lookup that survives script tweaks: falls back to a cue-relative frame if the word is gone. */
const w = (t: CueFns, text: string, nth: number, offset: number, fallback: number) => {
  try {
    return t.word(text, nth, offset);
  } catch {
    return fallback;
  }
};

/** S12 key moments from the narration (shared by animation + SFX). */
export const s12Timing = (t: CueFns) => {
  const ph = t.cue("ph");
  const disrupt = t.cue("disrupt");
  const phOptimum = t.cue("phOptimum");
  const amylase = t.cue("amylasePh");
  const stomach = t.cue("stomach", 2);
  const pepsin = t.cue("pepsin");
  const tuned = t.cue("tuned");
  const end = t.dur;
  const acidic = w(t, "acidic", 1, -2, disrupt + 4);
  const alkaline = w(t, "alkaline", 1, -2, acidic + 24);
  const bonds = w(t, "bonds", 1, -2, alkaline + 26);
  const disrupted = w(t, "disrupted", 1, -2, bonds + 60);
  const far = w(t, "far", 1, -6, disrupted + 30);
  const denatured = w(t, "denatured", 1, -2, far + 40);
  const optimum = w(t, "optimum", 1, -2, phOptimum + 36);
  const mouth = w(t, "mouth", 1, -2, amylase + 22);
  const neutral = w(t, "neutral", 1, -2, mouth + 38);
  const seven = w(t, "7", 1, -10, neutral + 28);
  const strongly = w(t, "strongly", 1, -2, stomach + 18);
  const two = w(t, "2", 1, -16, stomach + 70);
  const best = w(t, "best", 2, -2, pepsin + 90);
  return { ph, disrupt, acidic, alkaline, bonds, disrupted, far, denatured, phOptimum, optimum, amylase, mouth, neutral, seven, stomach, strongly, two, pepsin, best, tuned, end };
};

export const s12Sfx = (t: CueFns): SfxEvent[] => {
  const k = s12Timing(t);
  return [
    { frame: k.acidic, sfx: "whoosh_soft", gainDb: -12 },
    { frame: k.bonds - 6, sfx: "whoosh_zoom", gainDb: -12 },
    { frame: k.pepsin + 2, sfx: "ui_blip", gainDb: -10 },
  ];
};
