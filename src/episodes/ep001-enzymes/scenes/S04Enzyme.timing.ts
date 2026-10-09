import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S04 key moments from the narration (shared by animation + SFX). */
export const s04Timing = (t: CueFns) => {
  const enter = t.cue("amylase");
  const dock = t.word("snips", 1, -2);
  const snap = Math.max(dock + 16, t.word("starch", 1, 4));
  const maltose = t.cue("maltose");
  const sweet = t.cue("sweetTaste");
  const catalyst = t.cue("catalyst");
  const unchanged = t.cue("unchanged");
  const cycles = [catalyst + 30, catalyst + 70, catalyst + 110].filter((c) => c < unchanged - 6);
  const used = t.word("used", 1, -2);
  const every = t.cue("everywhere");
  const without = t.word("without", 2, -2);
  const protein = t.cue("protein");
  const unfoldA = t.word("long", 1, -4);
  const unfoldB = t.wordEnd("acids", 1);
  const fold = t.cue("fold");
  const foldB = t.word("precise", 1, 14);
  const shape = t.cue("shape");
  return { enter, dock, snap, maltose, sweet, catalyst, cycles, unchanged, used, every, without, protein, unfoldA, unfoldB, fold, foldB, shape, end: t.dur };
};

export const s04Sfx = (t: CueFns): SfxEvent[] => {
  const k = s04Timing(t);
  return [
    { frame: k.enter + 4, sfx: "whoosh_soft", gainDb: -8 },
    { frame: k.dock, sfx: "pop_bind", gainDb: -2 },
    { frame: k.snap, sfx: "snip" },
    { frame: k.sweet + 2, sfx: "shimmer_sweet", gainDb: -6 },
    ...k.cycles.map((c) => ({ frame: c, sfx: "snip", gainDb: -7 })),
    { frame: k.every + 2, sfx: "whoosh_zoom", gainDb: -6 },
    { frame: k.protein, sfx: "whoosh_zoom", gainDb: -8 },
    { frame: k.shape, sfx: "ui_blip", gainDb: -9 },
  ];
};
