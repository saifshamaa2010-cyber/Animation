import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * Strict word lookup: throws if the narration no longer contains the word, so a script change can
 * never silently drop an animation beat onto a guessed frame.
 */
const w = (t: CueFns, text: string, nth: number, offset: number) => t.word(text, nth, offset);

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
  // "pH, how acidic or alkaline something is, can denature enzymes too."
  const acidic = w(t, "acidic", 1, -2);
  const alkaline = w(t, "alkaline", 1, -2);
  const something = w(t, "something", 1, -2);
  const denature = w(t, "denature", 1, -2);
  // "Too far either way, and the bonds holding the active site in shape are disrupted."
  const far = w(t, "far", 1, -2);
  const either = w(t, "either", 1, -2);
  const bonds = w(t, "bonds", 1, -2);
  const disrupted = w(t, "disrupted", 1, -2);
  const zoomIn = bonds - 8;
  const zoomOut = Math.max(disrupted + 14, phOptimum - 30);
  const zoomBack = zoomOut + 22; // back at rest before the graph's axes draw (phOptimum + 6)
  // the graph
  const optimum = w(t, "optimum", 1, -2);
  const mouth = w(t, "mouth", 1, -2);
  const neutral = w(t, "neutral", 1, -2);
  const seven = w(t, "7", 1, -10);
  const strongly = w(t, "strongly", 1, -2);
  const two = w(t, "2", 1, -16);
  const there = w(t, "there", 1, -2); // "…a protease that digests protein there": pepsin ↔ stomach
  const best = w(t, "best", 2, -2);
  const different = w(t, "different", 1, -2);
  // "…tuned to different places": the light runs down each guide line from "tuned" and is lit well
  // before the cut, so the payoff is held on screen rather than lost in the transition
  const tunedW = w(t, "tuned", 1, -2);
  const places = w(t, "places", 1, -2);
  return {
    ph, acidic, alkaline, something, denature, disrupt, far, either, bonds, disrupted, zoomIn, zoomOut, zoomBack,
    phOptimum, optimum, amylase, mouth, neutral, seven, stomach, strongly, two, pepsin, there, best, tuned, different, tunedW, places, end,
  };
};

export const s12Sfx = (t: CueFns): SfxEvent[] => {
  const k = s12Timing(t);
  return [
    { frame: k.far, sfx: "whoosh_soft", gainDb: -12 },
    { frame: k.zoomIn + 2, sfx: "whoosh_zoom", gainDb: -12 },
    { frame: k.disrupted + 4, sfx: "snip", gainDb: -12 },
    { frame: k.pepsin + 2, sfx: "ui_blip", gainDb: -10 },
  ];
};
