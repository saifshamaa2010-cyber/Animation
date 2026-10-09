import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S12 key moments from the narration (shared by animation + SFX). */
export const s12Timing = (t: CueFns) => {
  const ph = t.cue("ph");
  const disrupt = t.cue("disrupt");
  const acidic = t.word("acidic", 1, -2);
  const alkaline = t.word("alkaline", 1, -2);
  const bonds = t.word("bonds", 1, -2);
  const disrupted = t.word("disrupted", 1, -2);
  const far = t.word("far", 1, -6);
  const denatured = t.word("denatured", 1, -2);
  const phOptimum = t.cue("phOptimum");
  const optimum = t.word("optimum", 1, -2);
  const amylase = t.cue("amylasePh");
  const mouth = t.word("mouth", 1, -2);
  const neutral = t.word("neutral", 1, -2);
  const seven = t.word("7", 1, -10);
  const stomach = t.cue("stomach", 2);
  const strongly = t.word("strongly", 1, -2);
  const two = t.word("2", 1, -16);
  const pepsin = t.cue("pepsin");
  const best = t.word("best", 2, -2);
  const tuned = t.cue("tuned");
  return { ph, disrupt, acidic, alkaline, bonds, disrupted, far, denatured, phOptimum, optimum, amylase, mouth, neutral, seven, stomach, strongly, two, pepsin, best, tuned, end: t.dur };
};

export const s12Sfx = (t: CueFns): SfxEvent[] => {
  const k = s12Timing(t);
  return [
    { frame: k.ph + 2, sfx: "ui_blip", gainDb: -10 },
    { frame: k.acidic, sfx: "whoosh_soft", gainDb: -12 },
    { frame: k.alkaline + 2, sfx: "whoosh_soft", gainDb: -12 },
    { frame: k.bonds - 6, sfx: "whoosh_zoom", gainDb: -12 },
    { frame: k.pepsin + 2, sfx: "ui_blip", gainDb: -10 },
  ];
};
