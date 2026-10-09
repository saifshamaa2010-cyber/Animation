import type { CueFns, SfxEvent } from "../../../lib/cues";

/** All key moments, derived from the narration. Shared by the animation and the sound effects. */
export const s05Timing = (t: CueFns) => {
  const site = t.cue("site");
  const sub = t.cue("substrate");
  const dock = t.word("fits", 1, 4);
  const complex = t.cue("complex");
  const held = t.cue("held");
  const snap = t.cue("break");
  const release = t.cue("release");
  const next = t.cue("next");
  const lock = t.cue("lockKey");
  const fit2 = t.word("fit", 1, 4);
  const specific = t.cue("specific");
  const snap2 = Math.min(specific + 40, t.cue("cellulose") - 30);
  const cell = t.cue("cellulose");
  const diff = t.cue("differentLink");
  const bounce = t.word("fit", 2, -4);
  return { site, sub, dock, complex, held, snap, release, next, lock, fit2, specific, snap2, cell, diff, bounce, end: t.dur };
};

export const s05Sfx = (t: CueFns): SfxEvent[] => {
  const k = s05Timing(t);
  return [
    { frame: k.site + 18, sfx: "ui_blip", gainDb: -10 },
    { frame: k.dock, sfx: "pop_bind" },
    { frame: k.snap, sfx: "snip" },
    { frame: k.release + 2, sfx: "shimmer_sweet", gainDb: -9 },
    { frame: k.fit2, sfx: "pop_bind", gainDb: -2 },
    { frame: k.snap2, sfx: "snip", gainDb: -7 },
    { frame: k.bounce, sfx: "bonk_misfit" },
  ];
};
