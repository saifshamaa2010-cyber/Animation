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
  const approx = w(t, "simplification", 1, 2, Math.round((keyIn + flex) / 2));
  const rigid = w(t, "rigid", 1, 0, flex + 36);
  const subIn = w(t, "substrate", 1, -16, grip - 10);
  const bind = w(t, "binds", 1, 0, grip + 22);
  const site = w(t, "active", 1, -2, bind + 20);
  const mould = w(t, "moulds", 1, -2, bind + 40);
  const closed = mould + 30;
  const induced = w(t, "induced", 1, -2, inducedFit + 46);
  const gcse = w(t, "gcse", 1, -2, exam);
  const igcse = w(t, "igcse", 1, -2, gcse + 40);
  const tick = w(t, "lock", 2, -2, igcse + 50); // "you only need lock and key"
  const induced2 = w(t, "induced", 2, -2, tick + 36); // "induced fit is an A-level idea"
  const alevel = w(t, "a-level", 1, -2, induced2 + 30);
  const remember = w(t, "remember", 1, -4, end - 76);
  const model3 = w(t, "model", 2, -2, remember + 32);
  const not = w(t, "not", 1, -2, remember + 46);
  return { simp, keyIn, approx, flex, rigid, grip, subIn, bind, site, mould, closed, inducedFit, induced, exam, gcse, igcse, tick, induced2, alevel, remember, model3, not, end };
};

export const s06Sfx = (t: CueFns): SfxEvent[] => {
  const k = s06Timing(t);
  return [
    { frame: k.keyIn - 2, sfx: "pop_bind", gainDb: -10 },
    { frame: k.mould + 18, sfx: "pop_bind", gainDb: -1 },
    { frame: k.induced + 4, sfx: "ui_blip", gainDb: -9 },
    { frame: k.tick + 6, sfx: "ui_blip", gainDb: -8 },
  ];
};
