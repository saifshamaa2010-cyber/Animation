import type { CueFns, SfxEvent } from "../../../lib/cues";

/**
 * S10 key moments (scene-relative frames), shared by the animation, the arc model and the SFX.
 * Every spoken-word lookup is strict: a wording change throws instead of silently guessing.
 */
export const s10Timing = (t: CueFns) => {
  const reveal = t.cue("reveal");
  const happens = t.word("happens", 1);
  const crash = t.cue("crash");
  const crashes = t.word("crashes", 1);
  const doesnt = t.word("doesn't", 1);
  const recover = t.word("recover", 1);
  const bonds = t.cue("bonds");
  const shape = t.word("shape", 1);
  const weak = t.word("weak", 1);
  const shake = t.cue("shake");
  const violently = t.word("violently", 1);
  const bondsWord = t.word("bonds", 2);
  const breakWord = t.word("break", 1);
  const unravel = t.cue("unravel");
  const siteLost = t.cue("siteLost");
  const active = t.word("active", 1);
  const noFit = t.cue("noFit");
  const fits = t.word("fits", 1);
  const denatured = t.cue("denatured");
  const denWord = t.word("denatured", 1);
  const egg = t.cue("egg");
  const turns = t.word("turns", 1);
  const white = t.word("white", 1);
  const solid = t.word("solid", 1);
  const noUndo = t.cue("noUndo");
  const cooling = t.word("cooling", 1);
  const fix = t.word("fix", 1);
  const cold = t.cue("cold");
  const molecules = t.word("molecules", 1);
  const lessKE = t.word("less", 1);
  const fewer = t.word("fewer", 1);
  const isnt = t.word("isn't", 1);
  const rewarm = t.cue("rewarm");
  const recover2 = t.word("recovers", 1);

  // ---- 1. reveal (same shot as S09)
  const lift = Math.max(2, reveal); // the pause overlay lifts
  const penA = happens - 6; // a pen draws the true curve past the peak (gently at first)…
  const penMid = crashes - 12; // …reaches ~45 °C…
  const penB = crashes + 12; // …then the rate crashes to ~0 by 70 °C, on "crashes"
  const verdict = penMid + 6; // the wrong guess fades; the right one gets a ✓
  const coolA = Math.max(penB + 4, doesnt - 8); // "doesn't recover": cooled back to 37 °C, the dot stays on the floor
  const coolB = coolA + 22;
  const arrowA = coolB - 6; // "can't climb back up" arrow, then ✕
  const crossA = arrowA + 8;
  const closeA = shape - 6; // graph + lens focus out…
  const heroInA = closeA + 10; // …then one enzyme focuses in, tagged "before heating"
  const heroInB = heroInA + 18;
  // ---- 2. why: one enzyme close up
  const bondsA = weak; // weak bonds light up
  const heatA = shake + 2; // "Too much heat" → 37 °C → 70 °C
  const heatB = shake + 28;
  const violentA = violently - 22; // the shaking turns violent
  const popA = violently; // bonds pop: slowly at first, then faster ("those bonds break")
  const popB = Math.min(unravel - 2, breakWord + 22);
  const unravelA = unravel;
  const unravelB = siteLost + 2;
  const siteA = active - 2;
  const siteB = siteLost + 50; // pocket collapses
  const slideA = noFit - 44; // the enzyme moves aside to make room for the incoming starch
  const slideB = noFit - 12;
  const subIn = noFit - 26; // a starch chain drifts in…
  const bounce = fits - 2; // …touches the collapsed lip on "fits" and bounces off
  const eggA = egg; // pan in; enzyme makes room
  const setA = turns - 2; // egg white turns opaque on "turns egg white solid"
  const setB = Math.max(setA + 40, solid + 10);
  // ---- 3. cooling doesn't fix it
  const chillA = cooling - 4; // 70 → 37 °C: egg stays cooked, enzyme stays denatured
  const chillB = chillA + 34;
  // ---- 4. cold is different (a fresh sample)
  const coldA = cold - 8; // egg + denatured enzyme clear away…
  const backA = coldA + 16; // …a fresh sample returns to the lens + graph, at 37 °C
  const backB = backA + 26;
  const coldCoolA = Math.max(backB + 2, molecules - 8); // cooled 37 → 10 °C: molecules slow down
  const coldCoolB = lessKE + 10;
  const fewerBump = fewer - 4; // one slow bump…
  const coldDock = fewer + 18; // …and one slow, successful collision
  const notDen = isnt - 4; // "but the enzyme isn't denatured": focus on its intact active site
  const siteDock = isnt + 18; // a substrate still fits
  const rewarmA = rewarm + 2; // 10 → 37 °C: the dot climbs straight back up the curve
  const rewarmB = rewarmA + 45;
  const reDock = rewarmA + 26; // first reaction once it's warm again (T > 25 °C)
  const reSnip = reDock + 10;
  const tick = recover2 - 2;
  return {
    reveal,
    happens,
    crash,
    crashes,
    doesnt,
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
    solid,
    noUndo,
    cooling,
    fix,
    cold,
    molecules,
    lessKE,
    fewer,
    isnt,
    rewarm,
    recover2,
    lift,
    penA,
    penMid,
    penB,
    verdict,
    coolA,
    coolB,
    arrowA,
    crossA,
    closeA,
    heroInA,
    heroInB,
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
    slideA,
    slideB,
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
    coldCoolA,
    coldCoolB,
    fewerBump,
    coldDock,
    notDen,
    siteDock,
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
    // weak bonds breaking: a softer, different sound from the enzyme's "snip" (which means "it works")
    { frame: k.popA + 8, sfx: "strike", gainDb: -15 },
    { frame: Math.round((k.popA + 2 * k.popB) / 3), sfx: "strike", gainDb: -13 },
    { frame: k.bounce, sfx: "bonk_misfit", gainDb: -3 },
    { frame: k.eggA + 22, sfx: "sizzle_heat", gainDb: -12 },
    { frame: k.chillA, sfx: "whoosh_soft", gainDb: -12 },
    { frame: k.backA + 4, sfx: "whoosh_soft", gainDb: -12 },
    { frame: k.siteDock, sfx: "pop_bind", gainDb: -10 },
    // "it recovers": the first reaction after warming is the sound of it working again (no extra tick sound)
    { frame: k.reSnip, sfx: "snip", gainDb: -7 },
  ];
};
