/**
 * S09 · Leaf — why a leaf is shaped the way it is, then inside it (top layers).
 *
 * 1. A potted plant in sunlight: light lands on its leaves ("most photosynthesis happens in the leaves").
 *    The camera pushes into one leaf (a change of scale).
 * 2. "Broad": a width arrow across the blade; light rains onto the whole surface — "large surface area".
 *    "Thin": the same leaf turns about its midrib until it is edge-on, a thin slab; a bracket measures it —
 *    "short diffusion distance" — and carbon dioxide crosses the lower surface to the cells inside.
 * 3. "Cut a leaf open": a window is cut into the slab, showing the layers; the camera pushes into it until
 *    the cross-section fills the right of the frame (layout.ts SECTION, where S10 continues).
 *    "cross-section · dicot leaf"; a small seedling rises and opens its two seed leaves ("two seed leaves" =
 *    what dicot means), then "simplified". "name: everyone / explain: EXTENDED": the EXTENDED badge then glides
 *    up into the section tag, where it stays (explaining the adaptations is Extended; naming the parts is Core).
 *    A band of light sweeps down "layer by layer, from the top".
 * 4. Layer by layer, each in focus while it is explained, labelled in the left column:
 *    waxy cuticle (water held in, light passes straight through), upper epidermis (transparent, no
 *    chloroplasts), palisade mesophyll (tall, tightly packed, full of chloroplasts — "most photosynthesis").
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { Photon, SunBeams } from "../../../components/Light";
import { LeafLayer, LeafSection, Plant, Pot } from "../../../components/bio";
import { CarbonDioxide, HandBracket, mix, textWidth } from "../../../components/kit";
import { Pt, rng, smoothClosedPath } from "../../../lib/geometry";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s09Timing } from "./S09Leaf.timing";
import { SECTION } from "./layout";
import { plantLeaf } from "./parts/S03-props";
import { LeafPose, TurnLeaf, poseGeo, posePoint, poseHalf } from "./parts/S09-leaf";
import { Seedling, seedLeafCentres } from "./parts/S09-seedling";
import {
  BandGlow,
  ColLabel,
  Drop,
  END_GLOW,
  FOCUS_MAX,
  ForkLabel,
  LayerSweep,
  PATHS,
  PalisadeOutlines,
  SEC_H,
  SEC_Y,
  SoftDefs,
  SubLine,
  colSubY,
  secP,
} from "./parts/S09-section";

// ------------------------------------------------------------------ layout
const POT = { x: 760, y: 712, w: 230, h: 190 } as const;
const PLANT = { x: 760, y: 716, height: 470, leaves: 6, leafScale: 1.3 } as const;
const LEAF_I = 1; // the leaf the camera pushes into
const PLANT_LEAVES = Array.from({ length: PLANT.leaves }, (_, i) => plantLeaf(PLANT.x, PLANT.y, PLANT.height, PLANT.leaves, PLANT.leafScale, i));
const SMALL = PLANT_LEAVES[LEAF_I];
/** Where that leaf lands after the push (centre, length). */
const BIG = { cx: 930, cy: 520, len: 980 } as const;
const ZA = BIG.len / SMALL.len;
const WID = BIG.len * (SMALL.wid / SMALL.len);
/** The leaf edge-on: a slab (midline = its top surface). */
const SLAB = { cx: 790, cy: 486, T: 64 } as const;
/** The window cut into the slab = a tiny copy of the cross-section; the camera pushes into it. */
const WIN_X = 880;
const MINI_W = (SLAB.T * 1500) / SEC_Y.cutBot;
const MINI = { x: WIN_X - MINI_W / 2, y: SLAB.cy, w: MINI_W } as const;
const ZB = SECTION.w / MINI_W;
const SEC_CENTRE: Pt = [SECTION.x + SECTION.w / 2, SECTION.y + SEC_H / 2];
const SUN: Pt = [-340, -380];
const BEAMS: [Pt, Pt][] = [
  [[300, 980], [560, 1060]],
  [[820, 760], [1080, 860]],
  [[1340, 520], [1640, 640]],
];
const BIG_POSE: LeafPose = { cx: BIG.cx, cy: BIG.cy, len: BIG.len, wid: WID, ang: SMALL.ang, turn: 0, T: SLAB.T };
const PH_TRAVEL = 24;
/** Column-heading block (before the labels arrive). */
const HEAD_X = SECTION.labelX + 4;
const BROAD_AT: Pt = [1120, 846];
/** The dicot seedling (soil surface) under the heading, and its "2 seed leaves" label above it. */
const SEEDLING = { x: 360, y: 878, s: 1.15, labelY: 680 } as const;
/** "name: everyone / explain: EXTENDED" rows (right-aligned at HEAD_X), and the badge's flight to the tag. */
const ROWS = { name: 450, who: 500, explain: 590, badgeY: 616 } as const;
const BADGE_W = textWidth("EXTENDED", 40, 700) + 36;
/** Where SectionTag draws its EXTENDED badge (same maths as the component), and the tag's settled opacity. */
const TAG_BADGE: Pt = [100 + 64 + 44 + textWidth("Leaf structure", 44, 600), 104];
const TAG_SETTLED = 0.55;

/** Camera push: anchor `w` (world) glides to screen point `to` while the zoom grows (log space). */
const push = (e: number, z1: number, w: Pt, to: Pt) => {
  const z = Math.exp(Math.log(z1) * e);
  const S: Pt = [w[0] + (to[0] - w[0]) * e, w[1] + (to[1] - w[1]) * e];
  const cam = { x: w[0] - (S[0] - 960) / z, y: w[1] - (S[1] - 540) / z, z };
  return { z, S, cam, T: `translate(960 540) scale(${z}) translate(${-cam.x} ${-cam.y})` };
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fromSun = (to: Pt, len: number): Pt => {
  const dx = to[0] - SUN[0];
  const dy = to[1] - SUN[1];
  const d = Math.hypot(dx, dy);
  return [to[0] - (dx / d) * len, to[1] - (dy / d) * len];
};

export const S09Leaf: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s09Timing(sc);
  const gid = useSvgId("s09");

  // ================================================================ part 1: plant → leaf
  const plantIn = prog(f, -9, 26);
  const eA = prog(f, k.plantPush[0], k.plantPush[1] - k.plantPush[0], EASE.inOut);
  const A = push(eA, ZA, [SMALL.cx, SMALL.cy], [BIG.cx, BIG.cy]);
  const plantOp = plantIn * (1 - prog(f, k.plantPush[0] + 18, 30));
  const leavesLit = prog(f, k.inLeaves - 6, 24);

  // the leaf turns edge-on on "Thin means…"
  const turnLen = Math.max(24, Math.min(36, k.short - k.thin + 6));
  const tP = prog(f, k.thin - 2, turnLen, EASE.inOut);
  const turnEnd = k.thin - 2 + turnLen;
  const pose: LeafPose =
    f < k.thin - 2
      ? { cx: A.S[0], cy: A.S[1], len: SMALL.len * A.z, wid: SMALL.wid * A.z, ang: SMALL.ang, turn: 0, T: SLAB.T }
      : {
          cx: lerp(BIG.cx, SLAB.cx, tP),
          cy: lerp(BIG.cy, SLAB.cy, tP),
          len: BIG.len,
          wid: WID,
          ang: lerp(SMALL.ang, 0, tP),
          turn: tP,
          T: SLAB.T,
        };
  const bigSunlit = prog(f, k.plantPush[1] - 20, 30) * (0.55 + 0.45 * prog(f, k.absorb - 4, 20)) * (1 - prog(f, k.thin - 2, 20));
  const wash = prog(f, k.large - 4, 40, EASE.inOut);
  const washOp = (1 - prog(f, k.thin - 6, 14)) * prog(f, k.large - 4, 8);

  // light: on the plant's leaves, then on the big leaf's whole surface ("absorb more light")
  const beamsOn = Math.min(prog(f, -9, 34), 1 - prog(f, k.thin - 4, 24)) * (1 - 0.35 * eA * (1 - prog(f, k.area - 8, 20)));
  const plantPh: { s: number; to: Pt }[] = [];
  {
    const r = rng(19);
    for (let s = k.leaf + 6; s + PH_TRAVEL < k.plantPush[0] + 2; s += 8) {
      const g = PLANT_LEAVES[Math.floor(r() * PLANT_LEAVES.length)];
      const t = 0.2 + r() * 0.6;
      plantPh.push({ s, to: g.P(-g.len / 2 + t * g.len, (r() - 0.5) * 0.9 * g.wid * 0.5) });
    }
  }
  const leafPh: { s: number; u: number; v: number }[] = [];
  {
    const r = rng(23);
    for (let s = k.area - PH_TRAVEL + 2; s + PH_TRAVEL < k.thin - 2; s += s + PH_TRAVEL > k.absorb - 6 ? 4 : 7) {
      const t = 0.08 + r() * 0.84;
      leafPh.push({ s, u: -BIG.len / 2 + t * BIG.len, v: (r() * 2 - 1) * 0.85 * poseHalf(BIG_POSE, t) });
    }
  }

  // "broad": a width arrow across the blade at its widest point
  const W_T = 0.43;
  const wU = -BIG.len / 2 + W_T * BIG.len;
  const wH = poseHalf(BIG_POSE, W_T) * 0.9;
  const broadP = prog(f, k.broad - 4, 22, (v) => v);
  const broadOut = 1 - prog(f, k.thin - 8, 12);
  const arrA = posePoint(pose, wU, -wH);
  const arrB = posePoint(pose, wU, wH);

  // "thin": bracket over the slab's thickness, then carbon dioxide crosses into it
  const brStart = Math.max(k.short - 4, turnEnd - 6);
  const thinOut = 1 - prog(f, k.slice - 2, 14);
  const BR_X = SLAB.cx + BIG.len / 2 + 14;
  const BR_D = 22;
  const co2Start = k.carbon - 10;
  const co2In = Math.max(co2Start + 30, k.diffuse + 8);
  const co2Done = Math.max(co2In + 24, k.inside + 6);
  const CO2S = [
    { x: 520, from: [470, 900] as Pt, d: 0 },
    { x: 700, from: [760, 940] as Pt, d: 7 },
    { x: 1060, from: [1010, 900] as Pt, d: 13 },
  ];

  // ================================================================ part 2: cut → cross-section
  const cutP = prog(f, k.cutDraw, 18, (v) => v);
  const miniP = prog(f, k.cut + 6, 14);
  const eB = prog(f, k.sectionPush[0], k.sectionPush[1] - k.sectionPush[0], EASE.inOut);
  const B = push(eB, ZB, [WIN_X, SLAB.cy + SLAB.T / 2], SEC_CENTRE);
  const inSection = f >= k.sectionPush[1];
  const slabOp = 1 - prog(f, k.sectionPush[0] + (k.sectionPush[1] - k.sectionPush[0]) * 0.3, (k.sectionPush[1] - k.sectionPush[0]) * 0.5);
  const cutOut = 1 - prog(f, k.sectionPush[0], 12);

  // heading in the left column while the whole section is shown
  const headOut = 1 - prog(f, k.extendedLeaf - 4, 14);
  const headP = prog(f, k.crossSection - 2, 18);
  const dicotP = prog(f, k.dicot - 2, 16);
  const simpP = prog(f, k.simpWord - 2, 16);
  // "a plant whose seeds have two seed leaves": a seedling rises, its two seed leaves open out
  const seedIn = prog(f, k.dicotGloss - 4, 14);
  const growStart = k.dicotGloss + 2;
  const seedGrow = prog(f, growStart, Math.max(16, Math.min(36, k.seeds + 10 - growStart)), (v) => v);
  const openStart = Math.max(k.seeds - 2, growStart + 16);
  const seedOpen = prog(f, openStart, Math.max(14, Math.min(26, k.two + 6 - openStart)), (v) => v);
  const seedGlow = pulse(f, k.two - 4, 36);
  const seedLabel = prog(f, k.two - 2, 22);
  const seedOut = 1 - prog(f, Math.max(k.simpWord + 4, k.two + 44), 14);
  // "Everyone needs to name each part. Explaining how … is for the Extended paper."
  const rowsAt = Math.max(k.extendedLeaf + 2, k.name - 12);
  const nameP = prog(f, rowsAt, 16);
  const whoP = prog(f, rowsAt + 8, 16);
  const explainP = prog(f, k.explaining - 2, 16);
  const badgeP = prog(f, k.extWord - 2, 16);
  const rowsOut = 1 - prog(f, k.badgeFly[0], 14);
  const fly = prog(f, k.badgeFly[0], k.badgeFly[1] - k.badgeFly[0], EASE.inOut);
  const badgeFrom: Pt = [HEAD_X - BADGE_W, ROWS.badgeY];
  const badgeAt: Pt = [lerp(badgeFrom[0], TAG_BADGE[0], fly), lerp(badgeFrom[1], TAG_BADGE[1], fly)];
  const tagBadge = f >= k.badgeFly[1] ? 1 : 0;
  // "layer by layer, from the top": a band of light sweeps down
  const sweepLen = Math.max(40, k.top + 22 - k.layer);
  const sweepY = lerp(-50, SEC_Y.cutBot + 50, prog(f, k.layer - 4, sweepLen, EASE.inOut));
  const sweepOp = Math.min(prog(f, k.layer - 4, 10), 1 - prog(f, k.layer - 4 + sweepLen - 10, 10));

  // focus moves down the layers as each is explained (dip between layers so nothing pops)
  const segs: { l: LeafLayer; a: number; b: number }[] = [
    { l: "cuticle", a: k.cuticle - 2, b: k.upper - 2 },
    { l: "upper", a: k.upper - 2, b: k.palisade - 2 },
    { l: "palisade", a: k.palisade - 2, b: k.end + 30 },
  ];
  const seg = segs.find((s) => f >= s.a && f < s.b);
  const focus: LeafLayer | null = seg ? seg.l : null;
  const focusAmount = seg ? FOCUS_MAX * Math.min(prog(f, seg.a, 14), 1 - prog(f, seg.b - 10, 10, EASE.in)) : 0;

  // labels: the current one bright, earlier ones step back
  const dimAt = (next: number) => 1 - 0.55 * prog(f, next - 4, 14);
  const subOut = (next: number) => 1 - prog(f, next - 6, 12);

  // water held in by the cuticle
  const DROPS = [240, 610, 980, 1300];
  const dropStart = k.reduces - 2;
  // light: straight through the cuticle and epidermis, absorbed in the palisade
  const secPh: { s: number; from: Pt; to: Pt }[] = [];
  {
    const r = rng(93);
    const stop = k.happens - 4;
    for (let s = k.lightThrough - PH_TRAVEL + 2; s + PH_TRAVEL < stop; s += s + PH_TRAVEL >= k.absorbMost - 4 ? 5 : 9) {
      const i = Math.floor(r() * 12);
      const [a, b] = PATHS.light(i);
      const dx = (r() - 0.5) * 50;
      secPh.push({ s, from: [a[0] + dx, a[1]], to: [b[0] + dx, b[1] + (r() - 0.5) * 30] });
    }
  }
  const chloroGlow = Math.min(
    END_GLOW,
    0.15 * prog(f, k.lightThrough, 20) + 0.2 * prog(f, k.below - 4, 24) + 0.25 * prog(f, k.full - 4, 20) + 0.25 * prog(f, k.absorbMost - 4, 24),
  );
  // palisade: "tall" (one cell), "tightly packed" (its neighbours), "close to the top surface"
  const TALL = 6;
  const palGlow = (i: number) => {
    const d = Math.abs(i - TALL);
    const one = i === TALL ? prog(f, k.tall - 4, 12) : 0;
    const many = d <= 3 ? prog(f, k.tightly - 2 + d * 4, 10) * (i === TALL ? 1 : 0.85) : 0;
    return Math.max(one, many) * (1 - prog(f, k.full - 6, 14));
  };
  const topGlow = pulse(f, k.close - 2, 34);
  const palSub1 = prog(f, k.tall - 2, 14) * (1 - prog(f, k.mostPs - 8, 12));
  const palSub2 = prog(f, k.full - 2, 14) * (1 - prog(f, k.mostPs - 8, 12));
  const mostP = prog(f, k.mostPs - 2, 16);

  // ---------------------------------------------------------------- render
  const sectionLayers = (
    <LeafSection x={SECTION.x} y={SECTION.y} w={SECTION.w} focus={focus} focusAmount={focusAmount} chloroGlow={chloroGlow} />
  );

  return (
    <Stage bg={{ tone: "warm", lightX: 0.42, lightY: 0.3 }}>
      <SoftDefs gid={gid} />
      <SunBeams source={SUN} beams={BEAMS} on={beamsOn * 0.9} fadeTo={[1500, 1000]} />

      {/* ============ part 1: the plant (world), the camera pushes into one leaf ============ */}
      {plantOp > 0 ? (
        <g transform={A.T}>
          <g opacity={plantOp} transform={`translate(0 ${(1 - EASE.out(plantIn)) * 24})`}>
            <Pot x={POT.x} y={POT.y} w={POT.w} h={POT.h} />
            <Plant x={PLANT.x} y={PLANT.y} height={PLANT.height} leaves={PLANT.leaves} leafScale={PLANT.leafScale} />
            {PLANT_LEAVES.map((g, i) =>
              i === LEAF_I ? null : <path key={i} d={smoothClosedPath(g.outline, 0.5)} fill={C.sun} opacity={0.2 * leavesLit} />,
            )}
          </g>
        </g>
      ) : null}
      {plantPh.map((ph, i) => {
        const p = (f - ph.s) / PH_TRAVEL;
        const land = pulse(f, ph.s + PH_TRAVEL - 2, 16);
        return (
          <g key={i}>
            <Photon from={fromSun(ph.to, 380)} to={ph.to} p={p} size={0.7} />
            {land > 0 ? <circle cx={ph.to[0]} cy={ph.to[1]} r={14} fill={C.sun} opacity={0.45 * land} filter={`url(#${gid}-soft)`} /> : null}
          </g>
        );
      })}

      {/* ============ the leaf, its slab, the cut window (world of the second push) ============ */}
      {!inSection ? (
        <g transform={B.T}>
          <g transform={f < k.plantPush[0] ? `translate(0 ${(1 - EASE.out(plantIn)) * 24})` : undefined}>
            <TurnLeaf pose={pose} sunlit={bigSunlit} opacity={Math.min(plantIn, slabOp)} wash={wash} washOpacity={washOp} />
            {/* the chosen leaf catches light like the others before the push */}
            {f < k.plantPush[1] ? (
              <path d={smoothClosedPath(poseGeo(pose).outline, 0.5)} fill={C.sun} opacity={0.2 * leavesLit * (1 - eA)} />
            ) : null}
          </g>
          {/* the cut: a window into the slab, showing the layers inside */}
          {cutP > 0 && cutOut > 0 ? (
            <rect
              x={MINI.x - 5}
              y={SLAB.cy - 7}
              width={MINI_W + 10}
              height={SLAB.T + 14}
              rx={8}
              fill="none"
              stroke={C.paper}
              strokeWidth={3}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - cutP}
              opacity={cutOut}
            />
          ) : null}
          {miniP > 0 ? <LeafSection x={MINI.x} y={MINI.y} w={MINI.w} opacity={miniP} /> : null}
        </g>
      ) : null}

      {/* carbon dioxide diffuses the short distance into the thin leaf */}
      {f >= co2Start && f < co2Done + 24
        ? CO2S.map((m, i) => {
            const s = co2Start + m.d;
            if (f < s) return null;
            const q = prog(f, s, co2In - s, EASE.inOut);
            const q2 = prog(f, co2In, co2Done - co2In - 10, EASE.out);
            const enterY = SLAB.cy + SLAB.T + 6;
            const midY = SLAB.cy + SLAB.T / 2;
            const env = Math.sin(Math.PI * q);
            const x = m.from[0] + (m.x - m.from[0]) * q + noise2D(`c9x${i}`, f * 0.03, 0) * 18 * env;
            const y = m.from[1] + (enterY - m.from[1]) * q + (midY - enterY) * q2;
            const absorbed = prog(f, co2Done - 12, 10);
            const glow = pulse(f, co2Done - 14, 34);
            return (
              <g key={i}>
                {glow > 0 ? <ellipse cx={m.x} cy={midY} rx={34} ry={20} fill={C.leafLight} opacity={0.55 * glow} filter={`url(#${gid}-soft)`} /> : null}
                <CarbonDioxide x={x} y={y} scale={0.36 * (1 - 0.45 * absorbed)} rotate={-10 + i * 30} progress={prog(f, s, 12)} opacity={1 - absorbed} seed={90 + i} />
              </g>
            );
          })
        : null}

      {/* leaf photons on the broad blade */}
      {leafPh.map((ph, i) => {
        const to = posePoint(pose, ph.u, ph.v);
        const p = (f - ph.s) / PH_TRAVEL;
        const land = pulse(f, ph.s + PH_TRAVEL - 2, 18);
        return (
          <g key={i}>
            <Photon from={fromSun(to, 420)} to={to} p={p} size={0.85} />
            {land > 0 ? <circle cx={to[0]} cy={to[1]} r={18} fill={C.sun} opacity={0.45 * land} filter={`url(#${gid}-soft)`} /> : null}
          </g>
        );
      })}

      {/* "broad": width arrow + label */}
      {broadP > 0 && broadOut > 0 ? (
        <g opacity={broadOut}>
          <WidthArrow a={arrA} b={arrB} p={broadP} />
        </g>
      ) : null}
      <Label
        anchor={[lerp(arrA[0], arrB[0], 0.78), lerp(arrA[1], arrB[1], 0.78)]}
        at={BROAD_AT}
        text="broad"
        color={C.paper}
        progress={prog(f, k.broad - 2, 22)}
        opacity={broadOut}
      />
      <SubLine x={BROAD_AT[0] + 14} y={BROAD_AT[1] + 44 * 0.34 + 46} text="large surface area" p={prog(f, k.large - 2, 16)} opacity={broadOut} color={C.sun} />

      {/* "thin": bracket over the slab's thickness + label */}
      {thinOut > 0 ? (
        <g opacity={thinOut}>
          <HandBracket from={[BR_X, SLAB.cy]} to={[BR_X, SLAB.cy + SLAB.T]} side={1} depth={BR_D} progress={prog(f, brStart, 16, (v) => v)} color={C.paper} seed={9} width={5} />
        </g>
      ) : null}
      <Label
        anchor={[BR_X + BR_D + 8, SLAB.cy + SLAB.T / 2]}
        at={[BR_X + BR_D + 8, SLAB.cy + SLAB.T / 2]}
        text="thin"
        color={C.paper}
        progress={prog(f, brStart + 6, 20)}
        opacity={thinOut}
      />
      <SubLine x={BR_X + BR_D + 22} y={SLAB.cy + SLAB.T / 2 + 44 * 0.34 + 46} text="short diffusion distance" p={prog(f, k.distance - 2, 16)} opacity={thinOut} color={C.ice} />

      {/* ============ the cross-section (screen), from the end of the push ============ */}
      {inSection ? sectionLayers : null}
      {inSection ? (
        <>
          <LayerSweep y={sweepY} opacity={sweepOp} />
          <BandGlow y0={SEC_Y.cutTop} y1={SEC_Y.upBot} p={topGlow} color={C.paper} />
          <PalisadeOutlines glow={palGlow} color={C.leafLight} />
          {/* water drops pushed up against the waxy cuticle: held in */}
          {DROPS.map((lx, i) => {
            const s = dropStart + i * 6;
            const rise = prog(f, s, 22, EASE.out);
            const hit = pulse(f, s + 18, 16);
            const back = prog(f, s + 30, 20, EASE.inOut);
            const op = prog(f, s, 8) * (1 - prog(f, s + 44, 14));
            const [x, y0] = secP(lx, 50);
            const yTop = secP(lx, 28)[1];
            const y = y0 + (yTop - y0) * rise + (y0 - 6 - yTop) * back;
            return (
              <g key={i}>
                <Drop x={x} y={y} s={0.85} squash={hit} opacity={op} />
                {hit > 0 ? <ellipse cx={x} cy={SECTION.y + 6} rx={30} ry={7} fill={mix(C.paper, C.sun, 0.3)} opacity={0.6 * hit} filter={`url(#${gid}-soft)`} /> : null}
              </g>
            );
          })}
          {/* light passes straight through the transparent top layers and is absorbed in the palisade */}
          {secPh.map((ph, i) => {
            const p = (f - ph.s) / PH_TRAVEL;
            const land = pulse(f, ph.s + PH_TRAVEL - 2, 18);
            return (
              <g key={i}>
                <Photon from={ph.from} to={ph.to} p={p} size={0.62} />
                {land > 0 ? <circle cx={ph.to[0]} cy={ph.to[1]} r={18} fill={C.sun} opacity={0.5 * land} filter={`url(#${gid}-soft)`} /> : null}
              </g>
            );
          })}
        </>
      ) : null}

      {/* heading: what we are looking at */}
      {headOut > 0 && headP > 0 ? (
        <g opacity={headOut}>
          <text x={HEAD_X + (1 - EASE.out(headP)) * 12} y={470} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={56} fill={C.paper} letterSpacing={-1} opacity={headP}>
            cross-section
          </text>
          <SubLine x={HEAD_X} y={530} text="dicot leaf" color={C.leafLight} p={dicotP} anchor="end" weight={600} size={44} />
          <Chip x={HEAD_X} y={598} text="simplified" p={simpP} />
        </g>
      ) : null}

      {/* dicot = two seed leaves: a seedling opens its two seed leaves */}
      {seedIn > 0 && seedOut > 0 ? (
        <g opacity={seedOut} transform={`translate(0 ${(1 - EASE.out(seedIn)) * 16})`}>
          <Seedling x={SEEDLING.x} y={SEEDLING.y} scale={SEEDLING.s} grow={seedGrow} open={seedOpen} glow={seedGlow} opacity={seedIn} />
          {(() => {
            const cs = seedLeafCentres(SEEDLING.x, SEEDLING.y, SEEDLING.s, seedGrow, seedOpen);
            const top = Math.min(cs[0][1], cs[1][1]);
            const mid = (cs[0][0] + cs[1][0]) / 2;
            return (
              <ForkLabel
                anchors={cs}
                join={[mid, Math.min(top - 40, SEEDLING.labelY + 22)]}
                text="2 seed leaves"
                textAt={[mid, SEEDLING.labelY]}
                color={C.leafLight}
                size={42}
                progress={seedLabel}
              />
            );
          })()}
        </g>
      ) : null}

      {/* who needs what: name the parts (everyone) / explain them (Extended) */}
      {nameP > 0 && rowsOut > 0 ? (
        <g opacity={rowsOut}>
          <SubLine x={HEAD_X} y={ROWS.name} text="name" p={nameP} anchor="end" color={C.paper} weight={700} size={52} />
          <SubLine x={HEAD_X} y={ROWS.who} text="everyone" p={whoP} anchor="end" color={C.ink300} weight={600} size={42} />
          <SubLine x={HEAD_X} y={ROWS.explain} text="explain" p={explainP} anchor="end" color={C.paper} weight={700} size={52} />
        </g>
      ) : null}
      {badgeP > 0 && f < k.badgeFly[1] ? (
        <ExtBadge x={badgeAt[0] + (1 - EASE.out(badgeP)) * 12} y={badgeAt[1]} opacity={Math.min(1, badgeP * 1.5) * lerp(1, TAG_SETTLED, fly)} />
      ) : null}

      {/* ============ labels: the left column ============ */}
      <ColLabel k="cuticle" progress={prog(f, k.waxy - 2, 24)} opacity={dimAt(k.upper)} />
      <SubLine x={SECTION.labelX + 4} y={colSubY("cuticle", 1)} text="reduces water loss" p={prog(f, k.reduces - 2, 16)} opacity={subOut(k.upper)} anchor="end" color={C.ice} />
      <SubLine x={SECTION.labelX + 4} y={colSubY("cuticle", 2)} text="transparent" p={prog(f, k.transparent - 2, 16)} opacity={subOut(k.upper)} anchor="end" color={C.sun} />
      <ColLabel k="upper" progress={prog(f, k.upperWord - 2, 24)} opacity={dimAt(k.palisade)} />
      <SubLine x={SECTION.labelX + 4} y={colSubY("upper", 1)} text="transparent" p={prog(f, k.transparent2 - 2, 16)} opacity={subOut(k.palisade)} anchor="end" color={C.sun} />
      <SubLine x={SECTION.labelX + 4} y={colSubY("upper", 2)} text="no chloroplasts" p={prog(f, k.noChloro - 2, 16)} opacity={subOut(k.palisade)} anchor="end" />
      <ColLabel k="palisade" progress={prog(f, k.palWord - 2, 24)} />
      <SubLine x={SECTION.labelX + 4} y={colSubY("palisade", 1)} text="tall, tightly packed" p={palSub1} anchor="end" />
      <SubLine x={SECTION.labelX + 4} y={colSubY("palisade", 2)} text="full of chloroplasts" p={palSub2} anchor="end" color={C.leafLight} />
      <SubLine x={SECTION.labelX + 4} y={colSubY("palisade", 1)} text="most photosynthesis" p={mostP} anchor="end" color={C.sun} />

      <SectionTag n={4} title="Leaf structure" t={f} extended={tagBadge} />
    </Stage>
  );
};

/** Double-headed measuring arrow that draws out from its middle. */
const WidthArrow: React.FC<{ a: Pt; b: Pt; p: number }> = ({ a, b, p }) => {
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const e = EASE.out(Math.min(1, p));
  const A: Pt = [m[0] + (a[0] - m[0]) * e, m[1] + (a[1] - m[1]) * e];
  const Bp: Pt = [m[0] + (b[0] - m[0]) * e, m[1] + (b[1] - m[1]) * e];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const head = (tip: Pt, dir: number) => {
    const bx = tip[0] - ux * 22 * dir;
    const by = tip[1] - uy * 22 * dir;
    return `M${bx - uy * 12},${by + ux * 12} L${tip[0]},${tip[1]} L${bx + uy * 12},${by - ux * 12}`;
  };
  return (
    <g>
      <line x1={A[0]} y1={A[1]} x2={Bp[0]} y2={Bp[1]} stroke={C.ink900} strokeOpacity={0.5} strokeWidth={10} strokeLinecap="round" />
      <line x1={A[0]} y1={A[1]} x2={Bp[0]} y2={Bp[1]} stroke={C.paper} strokeWidth={4.5} strokeLinecap="round" />
      {e > 0.6 ? (
        <g opacity={(e - 0.6) / 0.4}>
          <path d={head(A, -1)} fill="none" stroke={C.paper} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={head(Bp, 1)} fill="none" stroke={C.paper} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
    </g>
  );
};

/** The EXTENDED badge, drawn exactly as SectionTag draws it (top-left corner at x, y), so it can travel into the tag. */
const ExtBadge: React.FC<{ x: number; y: number; opacity: number }> = ({ x, y, opacity }) => (
  <g opacity={opacity}>
    <rect x={x} y={y} width={BADGE_W} height={56} rx={14} fill="none" stroke={C.violetLight} strokeWidth={3} />
    <text x={x + BADGE_W / 2} y={y + 42} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.violetLight} letterSpacing={1}>
      EXTENDED
    </text>
  </g>
);

/** Small outlined tag ("simplified"), right-aligned at x. */
const Chip: React.FC<{ x: number; y: number; text: string; p: number }> = ({ x, y, text, p }) => {
  if (p <= 0) return null;
  const w = textWidth(text, 40, 600) + 40;
  const e = EASE.out(Math.min(1, p));
  return (
    <g opacity={Math.min(1, p * 1.5)} transform={`translate(${(1 - e) * 12} 0)`}>
      <rect x={x - w} y={y - 30} width={w} height={60} rx={16} fill={C.ink800} fillOpacity={0.6} stroke={C.ink300} strokeWidth={3} />
      <text x={x - w / 2} y={y + 14} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.ink300}>
        {text}
      </text>
    </g>
  );
};
