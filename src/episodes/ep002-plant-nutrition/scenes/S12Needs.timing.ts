import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S12 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s12Timing = (t: CueFns) => {
  // ---- what does photosynthesis need?
  const need = t.cue("need");
  const what = t.word("what", 1);
  const needs = t.word("needs", 1);
  // ---- controls
  const control = t.cue("control");
  const aControl = t.word("control", 2); // "A control is identical…"
  const identical = t.word("identical", 1);
  const except = t.word("except", 1);
  const oneFactor = t.word("factor", 1);
  const controlWhy = t.cue("controlWhy");
  const shows = t.word("shows", 1);
  const result = t.word("result", 1);
  const caused = t.word("caused", 1);
  // ---- experiment 1: chlorophyll (variegated leaf)
  const chlorophyllTest = t.cue("chlorophyllTest");
  const chlorophyllW = t.word("chlorophyll", 1);
  const take = t.word("take", 1);
  const variegated = t.word("variegated", 1);
  const white = t.cue("white");
  const lightUp = t.cue("lightUp");
  const light1 = t.word("light", 1);
  const hours1 = t.word("hours", 1);
  const test1 = t.word("test", 3); // "then test a leaf"
  const greenOnly = t.cue("greenOnly");
  const blueBlack1 = t.word("blue-black", 1);
  const orangeBrown = t.word("orange-brown", 1);
  const chlorophyllNeeded = t.cue("chlorophyllNeeded");
  const needed1 = t.word("needed", 1);
  // ---- experiment 2: light (black paper)
  const cover = t.cue("cover");
  const coverW = t.word("cover", 1);
  const black = t.word("black", 1);
  const sunlit = t.cue("sunlit");
  const light3 = t.word("light", 3);
  const hours2 = t.word("hours", 2);
  const uncovered = t.cue("uncovered"); // "After the test…"
  const test2 = t.word("test", 4);
  const uncoveredW = t.word("uncovered", 1);
  const blueBlack2 = t.word("blue-black", 2);
  const lightControl = t.cue("lightControl");
  const isControl = t.word("control", 3); // "…is the control."
  const needed2 = t.word("needed", 2);
  // ---- experiment 3: carbon dioxide (soda lime)
  const flask = t.cue("flask");
  const seal = t.word("seal", 1);
  const sodaLime = t.word("soda", 1);
  const absorbs = t.cue("absorbs");
  const absorbsW = t.word("absorbs", 1);
  const co2Control = t.cue("co2Control");
  const theControl = t.word("control", 4);
  const co2Result = t.cue("co2Result");
  const hours3 = t.word("hours", 3);
  const only3 = t.word("only", 3);
  const blueBlack3 = t.word("blue-black", 3);
  const co2Needed = t.cue("co2Needed");
  const needed3 = t.word("needed", 3);
  return {
    need,
    what,
    needs,
    control,
    aControl,
    identical,
    except,
    oneFactor,
    controlWhy,
    shows,
    result,
    caused,
    chlorophyllTest,
    chlorophyllW,
    take,
    variegated,
    white,
    lightUp,
    light1,
    hours1,
    test1,
    greenOnly,
    blueBlack1,
    orangeBrown,
    chlorophyllNeeded,
    needed1,
    cover,
    coverW,
    black,
    sunlit,
    light3,
    hours2,
    uncovered,
    test2,
    uncoveredW,
    blueBlack2,
    lightControl,
    isControl,
    needed2,
    flask,
    seal,
    sodaLime,
    absorbs,
    absorbsW,
    co2Control,
    theControl,
    co2Result,
    hours3,
    only3,
    blueBlack3,
    co2Needed,
    needed3,
    end: t.dur,
  };
};

export const s12Sfx = (t: CueFns): SfxEvent[] => {
  const k = s12Timing(t);
  return [
    { frame: k.what, sfx: "ui_blip", gainDb: -12 }, // three things a plant might need
    { frame: k.aControl, sfx: "card_in", gainDb: -10 }, // test and control rows
    { frame: k.oneFactor, sfx: "strike", gainDb: -11 }, // the one factor removed from the test
    { frame: k.result, sfx: "ui_blip", gainDb: -10 }, // results differ
    { frame: k.chlorophyllW, sfx: "whoosh_soft", gainDb: -12 }, // experiment 1
    { frame: k.blueBlack1, sfx: "pop_bind", gainDb: -10 }, // green parts turn blue-black
    { frame: k.needed1, sfx: "ui_blip", gainDb: -8 }, // ✓ needed
    { frame: k.cover, sfx: "whoosh_soft", gainDb: -12 }, // experiment 2
    { frame: k.black, sfx: "card_in", gainDb: -12 }, // black paper clipped on
    { frame: k.blueBlack2, sfx: "pop_bind", gainDb: -10 }, // uncovered part blue-black
    { frame: k.needed2, sfx: "ui_blip", gainDb: -8 }, // ✓ needed
    { frame: k.flask, sfx: "whoosh_soft", gainDb: -12 }, // experiment 3
    { frame: k.theControl, sfx: "ui_blip", gainDb: -11 }, // the control flask
    { frame: k.blueBlack3, sfx: "pop_bind", gainDb: -10 }, // only the control leaf turns blue-black
    { frame: k.needed3, sfx: "ui_blip", gainDb: -8 }, // ✓ needed — all three conclusions together
  ];
};
