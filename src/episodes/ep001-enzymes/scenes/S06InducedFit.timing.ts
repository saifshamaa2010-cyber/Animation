import type { CueFns, SfxEvent } from "../../../lib/cues";

/** Word lookup that survives script tweaks: falls back to a cue-relative frame if the word is gone. */
const w = (t: CueFns, text: string, nth: number, offset: number, fallback: number) => {
  try {
    return t.word(text, nth, offset);
  } catch {
    return fallback;
  }
};

/** S06 key moments from the narration (shared by animation + SFX). */
export const s06Timing = (t: CueFns) => {
  const simp = t.cue("simplification");
  const flex = t.cue("flex");
  const grip = t.cue("grip");
  const inducedFit = t.cue("inducedFit");
  const exam = t.cue("exam");
  const end = t.dur;
  const keyIn = w(t, "model", 1, 0, simp + 42); // "a brilliant model" — the key slides home
  const approx = Math.max(keyIn + 12, w(t, "simplification", 1, 2, Math.round((keyIn + flex) / 2)));
  const rigid = w(t, "rigid", 1, 0, flex + 36);
  const subIn = Math.max(flex + 46, w(t, "substrate", 1, -16, grip - 10));
  const bind = Math.max(subIn + 24, w(t, "binds", 1, 0, grip + 22));
  const site = w(t, "active", 1, -2, bind + 20);
  const mould = Math.max(bind + 16, w(t, "moulds", 1, -2, bind + 40));
  const closed = mould + 30;
  const induced = w(t, "induced", 1, -2, inducedFit + 46);
  const gcse = w(t, "gcse", 1, -2, exam);
  // Pull back to the exam framing early enough that it has settled when "GCSE" is said.
  const pullStart = Math.max(closed + 20, Math.min(induced + 18, gcse - 30));
  const pullEnd = Math.max(pullStart + 32, gcse + 4);
  const igcse = w(t, "igcse", 1, -2, gcse + 40);
  const tick = w(t, "lock", 2, -2, igcse + 50); // "lock and key is all you need"
  const induced2 = w(t, "induced", 2, -2, tick + 36); // "Induced fit is an A-level idea"
  const alevel = w(t, "a-level", 1, -2, induced2 + 30);
  const remember = w(t, "remember", 1, -4, end - 76);
  const model3 = w(t, "model", 2, -2, remember + 32);
  const not = w(t, "not", 1, -2, model3 + 14);
  return { simp, keyIn, approx, flex, rigid, grip, subIn, bind, site, mould, closed, inducedFit, induced, exam, pullStart, pullEnd, gcse, igcse, tick, induced2, alevel, remember, model3, not, end };
};

export const s06Sfx = (t: CueFns): SfxEvent[] => {
  const k = s06Timing(t);
  return [
    { frame: k.keyIn - 2, sfx: "pop_bind", gainDb: -10 },
    { frame: k.mould + 18, sfx: "pop_bind", gainDb: -1 },
    { frame: k.induced + 4, sfx: "ui_blip", gainDb: -9 },
    { frame: k.pullStart + 2, sfx: "whoosh_soft", gainDb: -14 },
    { frame: k.tick + 6, sfx: "ui_blip", gainDb: -8 },
  ];
};
