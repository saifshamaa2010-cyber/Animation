import type { CueFns, SfxEvent } from "../../../lib/cues";

const w = (t: CueFns, text: string, nth: number, fallback: number) => {
  try {
    return t.word(text, nth);
  } catch {
    return fallback;
  }
};

/** S10 key moments (scene-relative frames). */
export const s10Timing = (t: CueFns) => {
  const reveal = t.cue("reveal");
  const happens = w(t, "happens", 1, reveal + 24);
  const crash = t.cue("crash");
  const crashes = w(t, "crashes", 1, crash + 15);
  const recover = w(t, "recover", 1, crash + 46);
  const bonds = t.cue("bonds");
  const shape = w(t, "shape", 1, bonds + 19);
  const weak = w(t, "weak", 1, bonds + 70);
  const shake = t.cue("shake");
  const violently = w(t, "violently", 1, shake + 59);
  const bondsWord = w(t, "bonds", 2, shake + 90);
  const breakWord = w(t, "break", 1, shake + 105);
  const unravel = t.cue("unravel");
  const siteLost = t.cue("siteLost");
  const active = w(t, "active", 1, siteLost + 4);
  const noFit = t.cue("noFit");
  const fits = w(t, "fits", 1, noFit + 39);
  const denatured = t.cue("denatured");
  const denWord = w(t, "denatured", 1, denatured + 30);
  const egg = t.cue("egg");
  const turns = w(t, "turns", 1, egg + 44);
  const white = w(t, "white", 1, egg + 65);
  const noUndo = t.cue("noUndo");
  const cooling = w(t, "cooling", 1, noUndo + 44);
  const undo = w(t, "undo", 1, noUndo + 88);
  const cold = t.cue("cold");
  const lessKE = w(t, "less", 1, cold + 72);
  const fewer = w(t, "fewer", 1, cold + 127);
  const isnt = w(t, "isn't", 1, cold + 180);
  const rewarm = t.cue("rewarm");
  const recover2 = w(t, "recovers", 1, rewarm + 30);

  // Derived beats.
  const lift = Math.max(2, reveal); // the pause overlay lifts
  const plungeA = Math.max(lift + 14, happens - 4); // the true curve draws past the peak…
  const plungeB = Math.max(plungeA + 30, crashes + 8); // …and crashes to ~0 by 60 °C
  const coolA = recover - 18; // "doesn't recover": cooled back to 37 °C, the rate stays at zero
  const coolB = coolA + 22;
  const noRecA = coolB - 4; // hand-drawn "can't climb back" arrow + cross
  const closeA = Math.max(noRecA + 24, bonds - 4); // focus moves to one enzyme
  const closeB = closeA + 28;
  const bondsA = weak; // weak bonds light up
  const heatA = shake + 2; // "Too much heat" → 70 °C
  const heatB = shake + 28;
  const violentA = violently - 22; // the shaking turns violent
  const popA = bondsWord - 4; // bonds pop one by one
  const popB = Math.min(unravel - 2, breakWord + 22);
  const unravelA = unravel;
  const unravelB = siteLost + 2;
  const siteA = active - 2;
  const siteB = siteLost + 50; // pocket collapses
  const subIn = noFit - 30; // a starch chain tries to dock…
  const bounce = Math.max(subIn + 46, fits - 2); // …and bounces off on "fits"
  const eggA = egg; // pan in; enzyme makes room
  const setA = turns - 2; // egg white turns opaque on "turns egg white solid"
  const setB = Math.max(setA + 40, w(t, "solid", 1, egg + 75) + 10);
  const chillA = cooling - 4; // cooled to 5 °C: egg stays cooked, enzyme stays denatured
  const chillB = chillA + 34;
  const coldA = cold - 8; // egg + denatured enzyme clear away…
  const backA = cold + 2; // …a fresh sample returns to the lens + graph, at 5 °C
  const backB = backA + 30;
  const notDen = isnt - 4; // "but the enzyme isn't denatured"
  const rewarmA = rewarm + 2; // 5 °C → 37 °C: the dot climbs back up the curve
  const rewarmB = rewarmA + 28;
  const reDock = rewarmA + 8; // first reaction once warm (fixed hold, so the SFX can find it)
  const reSnip = reDock + 10;
  const tick = recover2 - 2;
  return {
    reveal,
    happens,
    crash,
    crashes,
    recover,
    bonds,
    shape,
    weak,
    shake,
    violently,
    bondsWord,
    breakWord,
    unravel,
    siteLost,
    active,
    noFit,
    fits,
    denatured,
    denWord,
    egg,
    turns,
    white,
    noUndo,
    cooling,
    undo,
    cold,
    lessKE,
    fewer,
    isnt,
    rewarm,
    recover2,
    lift,
    plungeA,
    plungeB,
    coolA,
    coolB,
    noRecA,
    closeA,
    closeB,
    bondsA,
    heatA,
    heatB,
    violentA,
    popA,
    popB,
    unravelA,
    unravelB,
    siteA,
    siteB,
    subIn,
    bounce,
    eggA,
    setA,
    setB,
    chillA,
    chillB,
    coldA,
    backA,
    backB,
    notDen,
    rewarmA,
    rewarmB,
    reDock,
    reSnip,
    tick,
    end: t.dur,
  };
};

export const s10Sfx = (t: CueFns): SfxEvent[] => {
  const k = s10Timing(t);
  return [
    { frame: k.lift, sfx: "whoosh_soft", gainDb: -8 },
    { frame: k.bondsA, sfx: "ui_blip", gainDb: -12 },
    { frame: k.heatA, sfx: "sizzle_heat", gainDb: -11 },
    { frame: k.popA + 6, sfx: "snip", gainDb: -10 },
    { frame: Math.round((k.popA + k.popB) / 2), sfx: "snip", gainDb: -8 },
    { frame: k.bounce, sfx: "bonk_misfit", gainDb: -3 },
    { frame: k.eggA + 10, sfx: "sizzle_heat", gainDb: -12 },
    { frame: k.chillA, sfx: "whoosh_soft", gainDb: -12 },
    { frame: k.backA + 4, sfx: "whoosh_soft", gainDb: -12 },
    { frame: k.notDen + 8, sfx: "ui_blip", gainDb: -10 },
    { frame: k.reSnip, sfx: "snip", gainDb: -7 },
    { frame: k.tick, sfx: "shimmer_sweet", gainDb: -10 },
  ];
};
