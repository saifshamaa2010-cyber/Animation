import type { CueFns, SfxEvent } from "../../../lib/cues";

/** Seconds of silence at the end of S09 (the `[pause 4]` in script.md). */
export const S09_PAUSE_SEC = 4;

/** S09 key moments (scene-relative frames). Word lookups are strict (they throw if the script changes). */
export const s09Timing = (t: CueFns) => {
  const predict = t.cue("predict");
  const heat = t.word("heat", 1);
  const t50 = t.cue("t50");
  const t60 = t.cue("t60");
  const t70 = t.cue("t70");
  const question = t.cue("question");
  const faster = t.word("faster", 1);
  const pauseNow = t.cue("pauseNow");
  // The silent pause is the last 4 s of the scene (word end times from speech recognition
  // run long, so we measure back from the scene end instead).
  const pauseA = t.dur - Math.round(S09_PAUSE_SEC * t.fps);
  const ticks = [0, 1, 2, 3].map((i) => pauseA + i * t.fps);
  // Derived beats.
  const axisA = predict + 14; // the temperature axis extends on "keep turning up the heat"
  const axisB = heat + 8;
  const creepA = predict + 16;
  const creepB = heat + 6;
  const guessUpA = question + 2; // "Does it just keep getting faster?"
  const guessDownA = Math.max(guessUpA + 16, faster - 4); // …or slower?
  const overlayA = pauseNow - 2;
  return { predict, heat, t50, t60, t70, question, faster, pauseNow, pauseA, ticks, axisA, axisB, creepA, creepB, guessUpA, guessDownA, overlayA, end: t.dur };
};

export const s09Sfx = (t: CueFns): SfxEvent[] => {
  const k = s09Timing(t);
  return [
    { frame: k.creepA + 8, sfx: "sizzle_heat", gainDb: -13 },
    { frame: k.overlayA, sfx: "whoosh_soft", gainDb: -9 },
    ...k.ticks.map((f) => ({ frame: f, sfx: "tick", gainDb: -3 })),
  ];
};
