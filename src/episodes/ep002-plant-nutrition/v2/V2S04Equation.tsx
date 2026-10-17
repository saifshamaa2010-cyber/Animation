/**
 * EP002 v2 · S04 — the word equation as the plant's recipe, then where the raw materials come from.
 * Part 1 continues (tag "1 · What is photosynthesis?").
 *
 * KITCHEN (the recipe card)
 *  0              a recipe index card is taped to a warm tiled kitchen wall; on "equation" a
 *                 "WORD EQUATION" tab. The equation builds term by term AS IT IS READ, each word in its
 *                 colour with its character dropping in above it: carbon dioxide (CO2 buddy), + water
 *                 (drop), → (the arrow draws on "gives"), glucose (glowing hexagon), + oxygen (O2 buddy).
 *  {conditions}   "in the presence of…": the other terms step back; a pen writes "light" over the arrow
 *                 (a sun pops above it) and "chlorophyll" under it (a chloroplast below); on "arrow" the
 *                 arrow glows.
 *  {notReactants} EXAM TRAP: Chloro (chef's hat) pops up, shocked; a marker loops the arrow column
 *                 and Chloro shouts "Conditions, not reactants!" (burst bubble, the second line on "not").
 *                 "Light isn't a substance" → a sticky note (sun) "light / not a substance";
 *                 "chlorophyll isn't used up" → a second note (chloroplast) "chlorophyll / not used up".
 *                 Chloro explains, pointing at the notes.
 * GARDEN (where the raw materials come from)
 *  {inputs}       the kitchen fades to a meadow cut away at the ground; the card shrinks into a paper
 *                 strip at the top (the equation stays as the key, with a tiny sun and chloroplast on its
 *                 arrow); a plant grows, roots in the soil; "(not to scale)".
 *                 On "raw materials" carbon dioxide + water are highlighted on the strip.
 *  {co2From}      CO2 buddies wander in from the air and diffuse into the big leaf ("from the air").
 *  {waterFrom}    water drops in the soil move to the root tips and are absorbed ("from the soil",
 *                 "roots"); on "travels" they rise as blue dots along the roots, up the stem in the xylem
 *                 (a blue line that draws ahead of them; "xylem") and along the midrib into the leaf.
 *  {oxygenOut}    oxygen highlighted on the strip; O2 buddies pop out of the leaf ("waste product");
 *                 one goes back in → a spark in the leaf ("respiration"); {release} the rest drift out
 *                 into the air ("into the air").
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE, W2 } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { CO2Buddy, Chloro, GlucoseBuddy, O2Buddy, Sparkle, StickyNote, WorldStage } from "../../../components/fun";
import type { ChloroMood, ChloroPose } from "../../../components/fun";
import { BurstBubble, MarkerLoop, PaperSlip, Pen, SunBuddy, TopicTag } from "../../../components/fun/StudyProps";
import { Scribble, caveatWidth, scribbleTip } from "../../../components/fun/Handwriting";
import { HighlightSwipe, InkTab, WaterDropBuddy } from "../../../components/fun/NotebookDoodles";
import { PillLabel, makeRoute, routeAt } from "../../../components/fun/PillLabel";
import { useNarrationTalk } from "../../../components/fun/narrationTalk";
import { ChefHat, KitchenWall, RecipeCard } from "../../../components/fun/Kitchen";
import { ChloroplastIcon, GardenPlant, GroundSlice, gardenPlantGeometry, xylemPoints, type GardenPlantSpec } from "../../../components/fun/Garden";
import { mix, textWidth } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { v2s04Timing } from "./V2S04Equation.timing";

// ------------------------------------------------------------------ colours (term colours on cream paper)
const INK = W2.inkText;
const COL = {
  co2: C.iceDeep,
  water: C.iceDeep,
  glucose: mix(C.amberDeep, INK, 0.22),
  oxygen: C.coralDeep,
  plus: mix(INK, C.paper, 0.3),
  light: mix(C.amberDeep, INK, 0.18),
  chl: C.leafDeep,
} as const;
const linear = (v: number) => v;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ------------------------------------------------------------------ the equation's layout
type EqSpec = { readonly size: number; readonly cx: number; readonly base: number; readonly plusGap: number; readonly arrowGap: number; readonly arrow: number };
const TERMS = ["carbon dioxide", "+", "water", "→", "glucose", "+", "oxygen"] as const;
const TERM_COL = [COL.co2, COL.plus, COL.water, COL.plus, COL.glucose, COL.plus, COL.oxygen];
type EqLayout = { readonly size: number; readonly base: number; readonly x: number[]; readonly w: number[]; readonly left: number; readonly right: number };
const layoutEq = (s: EqSpec): EqLayout => {
  const w = TERMS.map((t, i) => (i === 3 ? s.arrow : textWidth(t, s.size, 700)));
  const gaps = [s.plusGap, s.plusGap, s.arrowGap, s.arrowGap, s.plusGap, s.plusGap];
  const total = w.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  const x: number[] = [];
  let at = s.cx - total / 2;
  w.forEach((wi, i) => {
    x.push(at);
    at += wi + (gaps[i] ?? 0);
  });
  return { size: s.size, base: s.base, x, w, left: s.cx - total / 2, right: s.cx + total / 2 };
};
const lerpLayout = (a: EqLayout, b: EqLayout, t: number): EqLayout => ({
  size: lerp(a.size, b.size, t),
  base: lerp(a.base, b.base, t),
  x: a.x.map((v, i) => lerp(v, b.x[i], t)),
  w: a.w.map((v, i) => lerp(v, b.w[i], t)),
  left: lerp(a.left, b.left, t),
  right: lerp(a.right, b.right, t),
});

// the recipe card (kitchen) and the strip it shrinks into (garden)
const BIG = layoutEq({ size: 60, cx: 960, base: 470, plusGap: 26, arrowGap: 44, arrow: 236 });
const SMALL = layoutEq({ size: 44, cx: 960, base: 248, plusGap: 20, arrowGap: 28, arrow: 116 });
const CARD = { x: 120, y: 180, w: 1680, h: 450 } as const;
const STRIP = { x: SMALL.left - 46, y: 178, w: SMALL.right - SMALL.left + 92, h: 112 } as const;
const ICON_Y = 344;
const LIGHT_BASE = 428;
const CHL_BASE = 522;
const HAND = 58;
const ARROW_CX = BIG.x[3] + BIG.w[3] / 2;
const LOOP = { cx: ARROW_CX, cy: 446, rx: 140, ry: 176 } as const;

// exam trap
const CH = { x: 1650, y: 955, size: 270 } as const;
const BUBBLE = { x: 1286, y: 768, rx: 206, ry: 94 } as const;
const NOTE1 = { x: 250, y: 694, w: 430, h: 214, rot: -3 } as const;
const NOTE2 = { x: 742, y: 704, w: 430, h: 214, rot: 2.4 } as const;

// ------------------------------------------------------------------ the garden
const GROUND = 700;
const PLANT: GardenPlantSpec = {
  x: 1190,
  groundY: GROUND,
  height: 380,
  lean: 0.05,
  leaves: [
    { t: 0.52, angle: -166, len: 330, wid: 164, tone: "fresh" }, // THE leaf: CO2 and water in, O2 out
    { t: 0.3, angle: -24, len: 200, wid: 100, tone: "deep" },
    { t: 0.74, angle: -40, len: 186, wid: 94, tone: "fresh" },
    { t: 0.98, angle: -80, len: 150, wid: 78, tone: "deep" },
  ],
  rootDepth: 210,
  roots: [
    { at: 0.24, side: -1, reach: 200, drop: 56 },
    { at: 0.34, side: 1, reach: 230, drop: 70 },
    { at: 0.62, side: -1, reach: 160, drop: 64 },
    { at: 0.72, side: 1, reach: 170, drop: 56 },
  ],
};
const G = gardenPlantGeometry(PLANT);
const LEAF = G.leaves[0];
const XYLEM_FROM = 0.74;
const XR = makeRoute(xylemPoints(G, 0, XYLEM_FROM), 4);
const nearestOn = (r: ReturnType<typeof makeRoute>, p: Pt) => {
  let best = 0;
  let bd = Infinity;
  r.poly.forEach((q, i) => {
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return r.L[best];
};
const SUN_MEADOW: Pt = [1722, 206];

// CO2 diffusing in from the air (net movement into the leaf, with a random wander on the way)
const CO2S: readonly { from: Pt; to: Pt; d: number; rot: number }[] = [
  { from: [250, 400], to: LEAF.P(0.56, 0.42), d: 0, rot: -16 },
  { from: [400, 560], to: LEAF.P(0.34, -0.3), d: 9, rot: 22 },
  { from: [170, 540], to: LEAF.P(0.8, -0.1), d: 18, rot: 8 },
  { from: [470, 360], to: LEAF.P(0.2, 0.36), d: 27, rot: -30 },
];
// water: in the soil beside a root tip → absorbed → along the root → up the xylem → into the leaf
const WATER_ROOTS = [0, 1, 3] as const;
const WATERS = WATER_ROOTS.map((ri, i) => {
  const r = G.sideRoots[ri];
  const start: Pt = [r.tip[0] + r.side * 64, r.tip[1] + 38];
  const along = makeRoute([...[...r.pts].reverse()], 4);
  return { i, ri, start, tip: r.tip, along, join: nearestOn(XR, r.start) };
});
// oxygen: out of the leaf's upper surface
const O2S: readonly { at: Pt; up: Pt; d: number }[] = [
  { at: LEAF.P(0.5, 0.62), up: [-20, -74], d: 0 },
  { at: LEAF.P(0.26, 0.66), up: [-40, -96], d: 8 },
  { at: LEAF.P(0.78, 0.56), up: [-30, -70], d: 16 },
];
const RESP_AT = LEAF.P(0.46, 0.06);
const O2_AWAY: readonly Pt[] = [[0, 0], [470, 320], [300, 470]];

/** A taped paper slip with a handwritten label (Caveat ≥ 56). */
const SlipLabel: React.FC<{ readonly x: number; readonly y: number; readonly text: string; readonly progress: number; readonly out?: number; readonly rotate?: number; readonly color?: string; readonly size?: number }> = ({
  x,
  y,
  text,
  progress,
  out = 0,
  rotate = -3,
  color = INK,
  size = 58,
}) => {
  const op = 1 - Math.max(0, Math.min(1, out));
  if (progress <= 0 || op <= 0) return null;
  const w = caveatWidth(text, size) + 54;
  return (
    <g opacity={op}>
      <PaperSlip x={x} y={y} w={w} h={size * 1.45} rotate={rotate} progress={progress}>
        <Scribble x={-w / 2 + 27} y={size * 0.3} text={text} size={size} color={color} progress={Math.min(1, progress * 1.6)} />
      </PaperSlip>
    </g>
  );
};

export const V2S04Equation: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = v2s04Timing(sc);
  const gid = useSvgId("v2s04");
  const talk = useNarrationTalk(4);

  // ================================================================ the card ↔ strip
  const m = prog(f, k.inputs - 2, 36, EASE.inOut);
  const L = lerpLayout(BIG, SMALL, m);
  const card = {
    x: lerp(CARD.x, STRIP.x, m),
    y: lerp(CARD.y, STRIP.y, m),
    w: lerp(CARD.w, STRIP.w, m),
    h: lerp(CARD.h, STRIP.h, m),
  };
  const cardIn = prog(f, -10, 22, linear);
  const firstHalf = 1 - prog(f, k.inputs - 4, 14); // things that only live on the big card
  const kitchen = 1 - prog(f, k.inputs, 26, EASE.inOut);

  // terms arrive as they are read
  const arrive = [k.co2, k.plus1, k.water, k.arrow, k.glucose, k.plus2, k.oxygen].map((at, i) => (i === 3 ? prog(f, at - 2, 16, linear) : prog(f, at - 2, 12)));
  // focus: the reactants/products step back for the conditions (and much more for the exam trap)
  const presence = window01(f, k.presence - 4, k.inputs + 8, 14);
  const trap = window01(f, k.notReactants - 2, k.inputs + 4, 12);
  const dimPart1 = Math.max(0.35 * presence, 0.72 * trap);
  // part 2: the term being explained is highlighted on the strip; the others step back
  const p2 = prog(f, k.raw - 4, 12) * (1 - prog(f, k.air2End + 4, 16));
  const emph = {
    co2: Math.max(window01(f, k.raw - 4, k.waterFrom - 2, 10), 0),
    water: Math.max(window01(f, k.raw - 4, k.co2From - 2, 10), window01(f, k.waterFrom - 4, k.oxygenOut - 2, 10)),
    oxygen: window01(f, k.oxygenOut - 4, k.air2End + 10, 12),
  };
  const termOpacity = (i: number) => {
    if (i === 3) return 1;
    let e = 0;
    if (i === 0) e = emph.co2;
    else if (i === 2) e = emph.water;
    else if (i === 6) e = emph.oxygen;
    else if (i === 1) e = Math.min(emph.co2, emph.water);
    return 1 - Math.max(dimPart1, 0.62 * p2 * (1 - e));
  };
  const swipe = {
    co2: prog(f, k.raw, 14, linear),
    water: prog(f, k.raw + 10, 12, linear),
    oxygen: prog(f, k.oxygenOut + 2, 14, linear),
  };

  // conditions on the arrow
  const lightP = prog(f, k.light - 1, 16, linear);
  const chlP = prog(f, k.chlorophyll - 1, 24, linear);
  const sunIcon = prog(f, k.light - 6, 16, linear);
  const beanIcon = prog(f, k.chlorophyll - 2, 16, linear);
  const arrowGlow = pulse(f, k.onArrow - 4, 30);
  const penIn = prog(f, k.light - 12, 10) * (1 - prog(f, k.chlEnd + 4, 12));
  const writingChl = f >= k.chlorophyll - 2;
  const lightW = caveatWidth("light", HAND);
  const chlW = caveatWidth("chlorophyll", HAND);
  const penTip = writingChl
    ? scribbleTip(ARROW_CX - chlW / 2, CHL_BASE, "chlorophyll", HAND, chlP, f)
    : scribbleTip(ARROW_CX - lightW / 2, LIGHT_BASE, "light", HAND, lightP, f);
  const stripIcons = prog(f, k.inputs + 22, 14);

  // ================================================================ exam trap (Chloro + notes)
  const chEnter = prog(f, k.notReactants - 2, 16, linear) * (1 - prog(f, k.inputs - 2, 14, EASE.in));
  const mood: ChloroMood = f < k.substance - 2 ? "shocked" : "explain";
  const pose: ChloroPose = f < k.condWord - 2 ? "rest" : "point";
  const pointAngle = f < k.substance - 2 ? -151 : 176;
  const bounce = Math.max(prog(f, k.condWord - 2, 14, linear) * (f < k.condWord + 12 ? 1 : 0), f >= k.substance - 2 && f < k.substance + 12 ? prog(f, k.substance - 2, 14, linear) : 0);
  const loopP = prog(f, k.condWord - 4, 26, linear);
  const burst = prog(f, k.condWord - 4, 12, linear) * (1 - prog(f, k.substance - 8, 10));
  const line2 = prog(f, k.notWord - 2, 8);
  const note1 = prog(f, k.substance - 4, 14, linear);
  const note2 = prog(f, k.usedUp - 4, 14, linear);
  const n1Text = prog(f, k.substance + 4, 20, linear);
  const n2Text = prog(f, k.usedUp + 4, 18, linear);

  // ================================================================ garden
  const garden = f >= k.inputs - 4;
  const plantGrow = prog(f, k.inputs + 14, 44, linear);
  const rootsGrow = prog(f, k.inputs + 24, 40, linear);
  const sunP = prog(f, k.inputs + 20, 18, linear);
  const scaleNote = window01(f, k.inputs + 50, k.co2From + 120, 12);

  // water timing
  const toTip = Math.max(30, k.roots - k.absorbed - 6);
  const xylemSpeed = Math.max(4, (XR.total * 0.98) / Math.max(40, k.toLeaf - k.travels - 12));
  const waterState = (w: (typeof WATERS)[number]) => {
    const appear = prog(f, k.waterFrom - 4 + w.i * 6, 14, linear);
    const t1 = prog(f, k.absorbed + w.i * 5, toTip, EASE.inOut); // to the root tip
    const absorbed = prog(f, k.absorbed + w.i * 5 + toTip - 8, 12); // drop → dot
    const alongStart = k.travels - 14 + w.i * 7;
    const t2 = prog(f, alongStart, 22, EASE.in); // along the side root to the main root
    const climbStart = alongStart + 22;
    const dist = Math.max(0, f - climbStart) * xylemSpeed; // up the xylem (px)
    const pos: Pt =
      t2 <= 0
        ? [w.start[0] + (w.tip[0] - w.start[0]) * t1, w.start[1] + (w.tip[1] - w.start[1]) * t1]
        : f < climbStart
          ? routeAt(w.along, t2).p
          : routeAt(XR, Math.min(1, (w.join + dist) / XR.total)).p;
    const lead = f < climbStart ? 0 : Math.min(XR.total, w.join + dist);
    const arrived = f >= climbStart && w.join + dist >= XR.total;
    const fade = arrived ? 1 - prog(f, climbStart + (XR.total - w.join) / xylemSpeed, 12) : 1;
    return { appear, absorbed, pos, lead, fade };
  };
  const waters = WATERS.map((w) => ({ w, s: waterState(w) }));
  const xylemLead = Math.max(...waters.map((x) => x.s.lead));
  const xylemP = xylemLead > 0 ? Math.min(1, (xylemLead + 24) / XR.total) : 0;
  const xylemFull = f > k.leaf2End + 10 ? 1 : xylemP;

  // labels (garden)
  const lblAir = prog(f, k.fromAir - 2, 18, linear);
  const lblAirOut = prog(f, k.waterFrom - 2, 12);
  const lblSoil = prog(f, k.fromSoil - 2, 18, linear);
  const lblSoilOut = prog(f, k.oxygenOut - 6, 12);
  const lblRoots = prog(f, k.roots - 2, 20, linear);
  const lblXylem = prog(f, k.xylem - 2, 20, linear);
  const lblWaste = prog(f, k.waste - 2, 18, linear);
  const lblWasteOut = prog(f, k.release - 4, 12);
  const lblResp = prog(f, k.respiration - 2, 18, linear);
  const lblRespOut = prog(f, k.air2End - 6, 14);
  const lblAirOut2 = prog(f, k.into2 - 2, 18, linear);

  // ================================================================ render helpers
  const term = (i: number) => {
    const p = arrive[i];
    if (p <= 0 || i === 3) return null;
    const op = termOpacity(i);
    return (
      <text
        key={i}
        x={L.x[i]}
        y={L.base + (1 - EASE.out(p)) * 16}
        fontFamily={FONT}
        fontWeight={700}
        fontSize={L.size}
        fill={TERM_COL[i]}
        opacity={Math.min(1, p * 1.6) * op}
      >
        {TERMS[i]}
      </text>
    );
  };
  const arrowY = L.base - L.size * 0.31;
  const ax0 = L.x[3];
  const ax1 = L.x[3] + L.w[3];
  const ap = arrive[3];
  const head = L.size * 0.32;
  const shaftEnd = ax0 + (ax1 - ax0 - head * 0.6) * ap;

  return (
    <WorldStage world="meadow">
      <defs>
        <filter id={`${gid}-soft`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>

      {/* ================================================== GARDEN (under the kitchen until it fades) */}
      {garden ? (
        <g>
          <SunBuddy x={SUN_MEADOW[0]} y={SUN_MEADOW[1]} r={50} progress={sunP} seed={4} />
          <GroundSlice groundY={GROUND} />
          {/* water drops in the soil, moving to the root tips */}
          {waters.map(({ w, s }) =>
            s.absorbed < 1 ? <WaterDropBuddy key={w.i} x={s.pos[0]} y={s.pos[1] - 26 * (1 - s.absorbed)} scale={0.5 * (1 - 0.6 * s.absorbed)} progress={s.appear} opacity={1 - s.absorbed} look={w.ri % 2 ? -1 : 1} seed={20 + w.i} /> : null,
          )}
          <GardenPlant spec={PLANT} grow={plantGrow} rootsGrow={rootsGrow} xylem={xylemFull} xylemLeaf={0} xylemFrom={XYLEM_FROM} />
          {/* water as dots inside the roots, the stem's xylem and the leaf */}
          {waters.map(({ w, s }) =>
            s.absorbed > 0 && s.fade > 0 ? (
              <g key={w.i} opacity={s.absorbed * s.fade}>
                <circle cx={s.pos[0]} cy={s.pos[1]} r={17} fill={C.ice} opacity={0.55} filter={`url(#${gid}-soft)`} />
                <circle cx={s.pos[0]} cy={s.pos[1]} r={10} fill={mix(C.ice, "#FFFFFF", 0.35)} stroke={C.iceDeep} strokeWidth={3} />
              </g>
            ) : null,
          )}

          {/* carbon dioxide diffuses in from the air */}
          {f >= k.co2From - 6 && f < k.waterFrom + 30
            ? CO2S.map((c, i) => {
                const start = k.co2From - 4 + c.d;
                const dur = Math.max(56, k.airEnd - start - 6);
                const q = prog(f, start, dur, EASE.inOut);
                const env = Math.sin(Math.PI * q);
                const x = c.from[0] + (c.to[0] - c.from[0]) * q + noise2D(`s4c${i}`, f * 0.02, 0) * 40 * env;
                const y = c.from[1] + (c.to[1] - c.from[1]) * q + noise2D(`s4c${i}`, f * 0.02, 5) * 40 * env;
                const enter = Math.max(0, (q - 0.8) / 0.2);
                return (
                  <CO2Buddy
                    key={i}
                    x={x}
                    y={y}
                    scale={0.82 * (1 - 0.6 * enter)}
                    rotate={c.rot + noise2D(`s4r${i}`, f * 0.015, 1) * 14}
                    progress={prog(f, start - 4, 14, linear)}
                    opacity={1 - enter}
                    look={1}
                    seed={30 + i}
                  />
                );
              })
            : null}

          {/* oxygen out of the leaf: one back in (respiration), the rest out into the air */}
          {f >= k.oxygenOut - 4
            ? O2S.map((o, i) => {
                const start = k.oxygenOut - 2 + o.d;
                const appear = prog(f, start, 16, linear);
                if (appear <= 0) return null;
                const upP = prog(f, start, 40);
                let pos: Pt = [o.at[0] + o.up[0] * upP, o.at[1] + o.up[1] * upP];
                let scale = 0.82;
                let opacity = 1;
                if (i === 0) {
                  const b = prog(f, k.some + 2, Math.max(36, k.respiration - k.some), EASE.inOut);
                  const from = pos;
                  const ctrl: Pt = [from[0] - 150, from[1] - 10];
                  const v = 1 - b;
                  pos = [v * v * from[0] + 2 * v * b * ctrl[0] + b * b * RESP_AT[0], v * v * from[1] + 2 * v * b * ctrl[1] + b * b * RESP_AT[1]];
                  const inP = Math.max(0, (b - 0.72) / 0.28);
                  scale = 0.82 * (1 - 0.55 * inP);
                  opacity = 1 - inP;
                } else {
                  const r = prog(f, k.release + 2 + (i - 1) * 10, Math.max(70, k.air2End - k.release - 4), EASE.inOut);
                  const to = O2_AWAY[i];
                  pos = [pos[0] + (to[0] - pos[0]) * r + noise2D(`s4o${i}`, f * 0.02, 0) * 26 * r, pos[1] + (to[1] - pos[1]) * r + noise2D(`s4o${i}`, f * 0.02, 4) * 26 * r];
                }
                return <O2Buddy key={i} x={pos[0]} y={pos[1]} scale={scale} rotate={-12 + i * 14} progress={appear} opacity={opacity} look={-1} seed={40 + i} />;
              })
            : null}
          {/* respiration: a spark inside the leaf */}
          {(() => {
            const sp = pulse(f, k.respiration - 6, 70);
            if (sp <= 0) return null;
            return (
              <g>
                <circle cx={RESP_AT[0]} cy={RESP_AT[1]} r={46} fill={C.sun} opacity={0.75 * sp} filter={`url(#${gid}-soft)`} />
                <Sparkle x={RESP_AT[0]} y={RESP_AT[1]} r={34 * (0.6 + 0.4 * sp)} color={C.amberLight} opacity={sp} seed={3} />
                <Sparkle x={RESP_AT[0] + 40} y={RESP_AT[1] - 26} r={14 * sp} color={C.amberLight} opacity={sp} seed={7} />
              </g>
            );
          })()}

          {/* labels */}
          <SlipLabel x={310} y={642} text="from the air" progress={lblAir} out={lblAirOut} rotate={-3} />
          <SlipLabel x={640} y={862} text="from the soil" progress={lblSoil} out={lblSoilOut} rotate={2} />
          <PillLabel x={1600} y={880} text="roots" progress={lblRoots} out={lblSoilOut} anchors={[G.sideRoots[1].pts[11]]} color={C.paper} />
          <PillLabel x={1452} y={636} text="xylem" progress={lblXylem} out={prog(f, k.oxygenOut + 10, 14)} anchors={[G.stemAt(0.16)]} color={mix(C.ice, "#FFFFFF", 0.3)} />
          <SlipLabel x={700} y={352} text="waste product" progress={lblWaste} out={lblWasteOut} rotate={-2} color={COL.oxygen} />
          <SlipLabel x={870} y={612} text="respiration" progress={lblResp} out={lblRespOut} rotate={2} />
          <SlipLabel x={330} y={566} text="into the air" progress={lblAirOut2} rotate={-3} />
          {scaleNote > 0 ? (
            <g opacity={scaleNote * 0.9}>
              <Scribble x={1546} y={372} text="(not to scale)" size={56} color={C.paper} />
            </g>
          ) : null}
        </g>
      ) : null}

      {/* ================================================== KITCHEN */}
      <KitchenWall opacity={kitchen} />
      {firstHalf > 0 ? (
        <g opacity={firstHalf}>
          {/* exam trap: two sticky notes on the wall */}
          <StickyNote x={NOTE1.x} y={NOTE1.y} w={NOTE1.w} h={NOTE1.h} rotate={NOTE1.rot} progress={note1}>
            <SunBuddy x={66} y={70} r={24} progress={note1} seed={9} />
            <Scribble x={116} y={92} text="light" size={60} color={mix(C.amberDeep, INK, 0.45)} />
            <Scribble x={34} y={176} text="not a substance" size={62} color={INK} progress={n1Text} />
          </StickyNote>
          <StickyNote x={NOTE2.x} y={NOTE2.y} w={NOTE2.w} h={NOTE2.h} rotate={NOTE2.rot} progress={note2}>
            <ChloroplastIcon x={62} y={72} scale={0.9} progress={note2} />
            <Scribble x={116} y={94} text="chlorophyll" size={60} color={mix(C.leafDeep, INK, 0.3)} />
            <Scribble x={34} y={178} text="not used up" size={62} color={INK} progress={n2Text} />
          </StickyNote>
          {/* Chloro, the chef */}
          <Chloro x={CH.x} y={CH.y} size={CH.size} mood={mood} pose={pose} pointAngle={pointAngle} look={f < k.substance - 2 ? [-1, -0.7] : [-1, 0.2]} talk={mood === "explain" ? talk : 0} enter={chEnter} bounce={bounce} seed={4} />
          <ChefHat x={CH.x} y={CH.y} size={CH.size} enter={chEnter} bounce={bounce} seed={4} />
          <BurstBubble x={BUBBLE.x} y={BUBBLE.y} rx={BUBBLE.rx} ry={BUBBLE.ry} tail={[1584, 846]} progress={burst} seed={5}>
            <text y={-16} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={46} fill={INK}>
              Conditions,
            </text>
            <text y={42} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={46} fill={C.coralDeep} opacity={line2}>
              not reactants!
            </text>
          </BurstBubble>
        </g>
      ) : null}

      {/* ================================================== THE RECIPE CARD → THE STRIP */}
      <RecipeCard x={card.x} y={card.y} w={card.w} h={card.h} progress={cardIn} rules={1 - prog(f, k.inputs - 2, 14)}>
        {/* WORD EQUATION tab */}
        <g opacity={firstHalf}>
          <InkTab x={CARD.x + 46} y={CARD.y + 48} text="WORD EQUATION" progress={prog(f, k.eqWord - 4, 12, linear)} size={40} />
        </g>

        {/* the characters above their words */}
        {firstHalf > 0 ? (
          <g opacity={firstHalf}>
            <g opacity={termOpacity(0)}>
              <CO2Buddy x={BIG.x[0] + BIG.w[0] / 2} y={ICON_Y} scale={1.12} progress={prog(f, k.co2 - 6, 16, linear)} look={1} seed={11} />
            </g>
            <g opacity={termOpacity(2)}>
              <WaterDropBuddy x={BIG.x[2] + BIG.w[2] / 2} y={ICON_Y + 4} scale={0.74} progress={prog(f, k.water - 6, 16, linear)} seed={12} />
            </g>
            <g opacity={termOpacity(4)}>
              <GlucoseBuddy x={BIG.x[4] + BIG.w[4] / 2} y={ICON_Y} r={42} progress={prog(f, k.glucose - 6, 16, linear)} lit={0.3 + 0.7 * pulse(f, k.glucose - 2, 34)} seed={13} />
            </g>
            <g opacity={termOpacity(6)}>
              <O2Buddy x={BIG.x[6] + BIG.w[6] / 2} y={ICON_Y} scale={1.05} progress={prog(f, k.oxygen - 6, 16, linear)} look={-1} seed={14} />
            </g>
            {/* conditions: light over the arrow, chlorophyll under it */}
            <SunBuddy x={ARROW_CX} y={ICON_Y - 16} r={28} progress={sunIcon} shine={arrowGlow} seed={2} />
            <ChloroplastIcon x={ARROW_CX} y={584} scale={0.82} progress={beanIcon} glow={arrowGlow} />
            <Scribble x={ARROW_CX - lightW / 2} y={LIGHT_BASE} text="light" size={HAND} color={COL.light} progress={lightP} />
            <Scribble x={ARROW_CX - chlW / 2} y={CHL_BASE} text="chlorophyll" size={HAND} color={COL.chl} progress={chlP} />
            <MarkerLoop cx={LOOP.cx} cy={LOOP.cy} rx={LOOP.rx} ry={LOOP.ry} progress={loopP} color={C.leafDeep} width={8} start={-120} tilt={-3} />
          </g>
        ) : null}

        {/* part 2: highlighter on the term being explained */}
        {p2 > 0 ? (
          <g opacity={p2}>
            <g opacity={termOpacity(0)}>
              <HighlightSwipe x1={SMALL.x[0]} x2={SMALL.x[0] + SMALL.w[0]} y={SMALL.base - SMALL.size * 0.3} h={52} progress={swipe.co2} color={C.ice} seed={2} />
            </g>
            <g opacity={termOpacity(2)}>
              <HighlightSwipe x1={SMALL.x[2]} x2={SMALL.x[2] + SMALL.w[2]} y={SMALL.base - SMALL.size * 0.3} h={52} progress={swipe.water} color={C.ice} seed={3} />
            </g>
            <g opacity={termOpacity(6)}>
              <HighlightSwipe x1={SMALL.x[6]} x2={SMALL.x[6] + SMALL.w[6]} y={SMALL.base - SMALL.size * 0.3} h={52} progress={swipe.oxygen} color={C.coral} seed={4} />
            </g>
          </g>
        ) : null}

        {/* the equation itself */}
        {[0, 1, 2, 4, 5, 6].map((i) => term(i))}
        {ap > 0 ? (
          <g>
            {arrowGlow > 0 ? <rect x={ax0 - 10} y={arrowY - 16} width={ax1 - ax0 + 20} height={32} rx={16} fill={C.sun} opacity={0.55 * arrowGlow} filter={`url(#${gid}-soft)`} /> : null}
            <line x1={ax0} y1={arrowY} x2={shaftEnd} y2={arrowY} stroke={INK} strokeWidth={L.size * 0.075 * (1 + 0.35 * arrowGlow)} strokeLinecap="round" />
            {ap > 0.82 ? <path d={`M${ax1},${arrowY} L${ax1 - head},${arrowY - head * 0.62} L${ax1 - head},${arrowY + head * 0.62} Z`} fill={INK} opacity={Math.min(1, (ap - 0.82) / 0.12)} strokeLinejoin="round" stroke={INK} strokeWidth={3} /> : null}
          </g>
        ) : null}
        {/* the strip keeps the conditions as two tiny icons on its arrow */}
        {stripIcons > 0 ? (
          <g>
            <SunBuddy x={SMALL.x[3] + SMALL.w[3] / 2} y={SMALL.base - 50} r={13} progress={stripIcons} seed={6} />
            <ChloroplastIcon x={SMALL.x[3] + SMALL.w[3] / 2} y={SMALL.base + 14} scale={0.42} progress={stripIcons} />
          </g>
        ) : null}
      </RecipeCard>

      {/* the pen that writes the conditions on the arrow */}
      <Pen x={penTip[0]} y={penTip[1]} progress={penIn} color={C.leafDeep} />

      <TopicTag n={1} title="What is photosynthesis?" progress={prog(f, -6, 16)} />
    </WorldStage>
  );
};
