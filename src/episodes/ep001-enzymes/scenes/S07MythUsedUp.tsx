/**
 * S07 · Myth #1: enzymes get used up.
 * Card: "Enzymes get [used up]" → scratched out, "reused" written in.
 * Proof: one amylase snips, is checked against its own ghost outline (unchanged), snips again, and again.
 * Pan to catalase (liver): hydrogen peroxide streams in, water and oxygen bubbles stream out, faster and
 * faster, while a counter passes a million inside one second. Zoom out to the cell: an old enzyme falls
 * apart into amino acids, which are rebuilt into an identical new one. End: the word equation, with the
 * enzyme written over the arrow — never a reactant, never used up.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE, H, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Enzyme } from "../../../components/Enzyme";
import { Link, Ring, SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label } from "../../../components/Label";
import { DOCK, ENZYME_RADII, ENZYME_REST, SPACING, foldedChain } from "../../../components/molecule-geometry";
import { Bubble, CellOutline, Counter, FocusPull, HandCircle, Molecule, WordEquation, circleAround, textBox, textWidth } from "../../../components/kit";
import { Pt, rng, roundedPolygon, smoothOpenPath } from "../../../lib/geometry";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { blendJit, jit, jitTransform, moveRings, toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s07Timing } from "./S07MythUsedUp.timing";
import { MythCard2 } from "./S06-S12-shared";

const A = { x: 1250, y: 610, s: 1.35 } as const; // amylase
const CT = { x: 2580, y: 610, s: 1.3, seed: 23, variant: 5 } as const; // catalase
const CT2 = { x: 1900, y: 660 } as const; // where the replacement is built
const CELL = { x: 2330, y: 580, rx: 1240, ry: 740 } as const;
const SP = SPACING * A.s;
const N0 = 12;
const ENZ_PATH = roundedPolygon(ENZYME_REST, ENZYME_RADII);
/**
 * The counter lands on 100,000 in one second, then a "+": measured catalase turnover is
 * 54,000–833,000 per second (sources.md #13), i.e. "hundreds of thousands".
 */
const COUNTER_DIGITS = 6;
const COUNTER_W = COUNTER_DIGITS * 92 * 0.64 + (textWidth(",", 92, 600) + 92 * 0.04);

const MALTOSE_TARGETS: readonly (readonly [number, number])[] = [
  [830, 330],
  [620, 420],
  [980, 250],
];

/** Other enzymes in the cell (seen when we zoom out), world coordinates. */
const CROWD = (() => {
  const r = rng(707);
  const spots: [number, number][] = [
    [1500, 300],
    [1450, 900],
    [2150, 160],
    [3000, 230],
    [3250, 700],
    [2900, 1060],
    [2250, 1040],
    [3350, 360],
  ];
  return spots.map(([x, y], i) => ({
    x: x + (r() - 0.5) * 80,
    y: y + (r() - 0.5) * 80,
    s: 0.48 + r() * 0.2,
    rot: (r() - 0.5) * 300,
    pal: (i % 3 === 0 ? "teal" : "violet") as "teal" | "violet",
    variant: 30 + i,
  }));
})();

// ---- catalase reaction stream ---------------------------------------------------------------
const Q = 6; // H2O2 molecules queued on their way in
const MAX_RATE = 0.4; // reactions per frame on screen (the counter tells the real story)

/** Path for incoming molecule m (catalase-local: relative to the pocket centre). */
const inPath = (m: number) => {
  const r = rng(9100 + m * 31);
  // In from the left and lower-left; products leave up and to the left, so the two never tangle.
  const s: Pt = [-720 - r() * 260, -40 + r() * 330];
  const c: Pt = [-300 - r() * 120, s[1] * 0.2 + 10];
  return { s, c, rot: r() * 360, spin: (r() - 0.5) * 120, seed: m };
};
const bez = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

export const S07MythUsedUp: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s07Timing(sc);
  const out = EASE.out;
  const amp = thermalAmplitude(37) * 0.8;

  // ---------------- camera: amylase → pan to catalase → zoom out to the cell
  const cam = camAt(f, [
    { f: -12, x: 960, y: 540, z: 1 },
    { f: k.cat, x: 960, y: 540, z: 1 },
    { f: k.cat + 58, x: 2480, y: 540, z: 1 },
    { f: k.wear - 2, x: 2480, y: 540, z: 1 },
    { f: k.wear + 30, x: 2270, y: 590, z: 0.64 },
  ]);
  const S = (p: readonly [number, number]) => toScreen(cam, p);

  // ---------------- myth card
  const cardEnter = prog(f, k.myth, 20);
  const cardOut = prog(f, k.cardOut, 14, EASE.in);
  const strikeP = prog(f, k.strike, 14, (t) => t);
  const replaceP = prog(f, k.replace, 20, (t) => t);

  // ---------------- amylase: snips, unchanged, again, again
  const snaps = [k.s1, k.s2, k.s3];
  const docks = snaps.map((s) => s - 12);
  const done = snaps.filter((s) => f >= s + 3).length;
  const n = N0 - 2 * done;
  let off: number;
  if (done === 0) {
    off = track(f, [[docks[0] - 18, -700], [docks[0], 0, out]]);
  } else {
    const s = snaps[done - 1];
    const nd = docks[done];
    off = track(f, [[s, -2 * SP], [s + 10, -2 * SP - 60, EASE.snap], ...(nd !== undefined ? ([[nd - 12, -2 * SP - 60], [nd, 0, out]] as const) : ([[k.cat + 40, -2 * SP - 260, EASE.in]] as const))]);
  }
  const amyIn = prog(f, k.cardOut + 10, 18);
  const ej = jit("E07", f, amp);
  const dockedAmt = Math.max(...docks.map((d, i) => window01(f, d - 12, snaps[i] + 8, 8)));
  const bump = 1 + snaps.reduce((a, s, i) => a + 0.014 * pulse(f, docks[i] - 2, 12) - 0.008 * pulse(f, s, 8), 0);
  const chainBase = dockedChain(n, A.x, A.y, A.s, { wave: 1.4 * Math.sin(f * 0.06) * (1 - dockedAmt * 0.7) });
  const chainRings = moveRings(chainBase.rings, off, 0, 0);
  const curSnap = snaps[done] ?? -999;
  const strain = window01(f, curSnap - 12, curSnap + 2, 6);
  const chainLinks: Link[] = chainBase.links.map((l, i) => (i === n - 3 ? { ...l, highlight: strain } : l));
  const cj = blendJit(jit("C07", f, amp * 1.2), ej, dockedAmt);
  const lastSnap = done > 0 ? snaps[done - 1] : -999;
  const pairs = snaps.slice(0, done).map((s, j) => {
    const [tx, ty] = MALTOSE_TARGETS[j];
    const startX = A.x + (A.s * (DOCK.outer[0] + DOCK.inner[0])) / 2;
    const px = track(f, [[s + 6, startX], [s + 26, startX - 210], [s + 80, tx, out]]);
    const py = track(f, [[s + 14, A.y], [s + 80, ty, out]]);
    const bob = Math.sin((f - s) * 0.05 + j) * 8;
    const rot = track(f, [[s + 6, 0], [s + 80, -18 + j * 12, out]]);
    const base: Ring[] = [
      { x: px - SP / 2, y: py + bob, tone: "sugar", glow: prog(f, s + 3, 18), scale: A.s },
      { x: px + SP / 2, y: py + bob, tone: "sugar", glow: prog(f, s + 3, 18), scale: A.s },
    ];
    return moveRings(base, 0, 0, rot);
  });
  const amyVis = amyIn * (1 - prog(f, k.cat + 30, 26));
  // ghost-outline check: the enzyme after the reaction vs before it
  const ghostX = track(f, [[k.unch - 6, 300], [k.unch + 16, 0, out]]);
  const ghostVis = window01(f, k.unch - 6, k.s2 - 4, 10);
  const reactions = snaps.reduce((a, s) => a + prog(f, s + 1, 10), 0);

  // ---------------- catalase: the stream
  const catVis = prog(f, k.cat + 20, 30);
  const streamVis = prog(f, k.catWord - 30, 30) * (1 - prog(f, k.wear - 2, 18));
  const rateAt = (x: number) => {
    if (x < k.brk) return 0;
    const ramp = Math.min(MAX_RATE, (1 / 22) * Math.pow(1.036, x - k.brk));
    return ramp * (1 - prog(x, k.wear - 6, 20, (t) => t));
  };
  let phase = 0;
  const crossings: number[] = [];
  for (let x = k.brk; x <= f; x++) {
    const before = phase;
    phase += rateAt(x);
    if (Math.floor(phase) > Math.floor(before)) {
      const m = Math.floor(phase);
      crossings.push(x - 1 + (m - before) / Math.max(1e-6, phase - before));
    }
  }
  const rate = rateAt(f);
  const ctj = jit("CT07", f, amp);
  const pocket: Pt = [CT.x + CT.s * -80, CT.y];
  const lastCross = crossings.length ? crossings[crossings.length - 1] : -999;
  const flash = Math.max(Math.exp(-(f - lastCross) / 4) * (f >= lastCross ? 1 : 0), Math.min(1, rate * 2.2) * 0.55);

  // ---------------- counter + one-second ring
  const tc0 = k.brk;
  const tc1 = k.second + 6;
  const cp = prog(f, tc0, tc1 - tc0, EASE.inOut);
  const cval = f < tc0 ? 0 : Math.pow(10, (COUNTER_DIGITS - 1) * cp);
  const cvalPrev = f - 1 < tc0 ? 0 : Math.pow(10, (COUNTER_DIGITS - 1) * prog(f - 1, tc0, tc1 - tc0, EASE.inOut));
  const counterVis = prog(f, tc0 - 4, 14) * (1 - prog(f, k.wear - 6, 14));
  const ringP = prog(f, tc0, tc1 - tc0, (t) => t);

  // ---------------- wear: old catalase falls apart, amino acids rebuilt into an identical new one
  const cellP = prog(f, k.wear + 4, 44, (t) => t);
  const oldVis = 1 - prog(f, k.dis, 18);
  const chainPts = foldedChain(CT.seed * 97 + 11);
  const beadIdx = chainPts.map((_, i) => i).filter((i) => i % 6 === 0);
  const NB = beadIdx.length;
  /** Bead j sets off at travelStart(j) — in chain order, like a chain being built one link at a time. */
  const travelStart = (j: number) => k.build + (j / NB) * 22;
  const TRAVEL = 18;
  const arrived = beadIdx.filter((_, j) => f >= travelStart(j) + TRAVEL).length;
  const buildDone = travelStart(NB - 1) + TRAVEL;
  const newVis = prog(f, buildDone - 6, 18);
  const showBeads = f > k.dis - 2 && f < buildDone + 20;

  // ---------------- equation
  const eqP = prog(f, k.eq, 44, (t) => t);
  const sceneBlur = track(f, [[k.eq - 6, 0], [k.eq + 24, 7, out]]);
  const eqSize = 84;
  const overSize = Math.max(40, eqSize * 0.72);
  const amyBox = textBox("amylase", W / 2, 560 - eqSize * 0.42, overSize, 600, "middle");
  // Centre of the arrow (WordEquation lays out left · arrow · right symmetrically about x).
  const wl = textWidth("starch", eqSize, 600);
  const wr = textWidth("maltose", eqSize, 600);
  const arrowLen = Math.max(220, textWidth("amylase", overSize, 600) + 80);
  const gap = eqSize * 0.45;
  const total = wl + gap + arrowLen + gap + wr;
  const arrowCx = W / 2 - total / 2 + wl + gap + arrowLen / 2;
  const circ = circleAround({ ...amyBox, x0: amyBox.x0 + (arrowCx - W / 2), x1: amyBox.x1 + (arrowCx - W / 2) }, 30, 18);

  // ---------------- screen anchors
  const ghostAnchor = S([A.x + 220, A.y - 170]);
  const catAnchor = S([CT.x + CT.s * 205 + ctj.dx, CT.y - CT.s * 40 + ctj.dy]);

  return (
    <Stage bg={{ particles: 40, lightX: 0.55 }}>
      <FocusPull blur={sceneBlur} dim={0.75} opacity={1 - 0.7 * prog(f, k.eq - 4, 26)}>
        <g transform={camTransform(cam)}>
          {/* ---- the cell (seen when we zoom out) */}
          <CellOutline cx={CELL.x} cy={CELL.y} rx={CELL.rx} ry={CELL.ry} progress={cellP} seed={12} color={C.ink300} fill={C.ink700} />
          {f > k.wear - 10
            ? CROWD.map((e, i) => (
                <g key={i} opacity={prog(f, k.wear + 6 + i * 2, 24)}>
                  <Enzyme x={e.x} y={e.y} scale={e.s} rotate={e.rot} palette={e.pal} variant={e.variant} lod="low" seed={40 + i} temperature={37} />
                </g>
              ))
            : null}

          {/* ---- amylase scene */}
          {amyVis > 0 ? (
            <g opacity={amyVis}>
              {pairs.map((p, j) => (
                <SugarChain key={j} rings={p} links={[{ a: 0, b: 1 }]} />
              ))}
              <g transform={jitTransform(cj, [A.x, A.y])}>
                <SugarChain rings={chainRings} links={chainLinks} />
                {f >= lastSnap && f < lastSnap + 12 ? (
                  <circle cx={A.x + A.s * DOCK.cut[0]} cy={A.y} r={16 + 60 * prog(f, lastSnap, 12, out)} fill="none" stroke={C.amberLight} strokeWidth={4} opacity={1 - prog(f, lastSnap, 12)} />
                ) : null}
              </g>
              <g transform={jitTransform(ej, [A.x, A.y])}>
                <g transform={`translate(${A.x} ${A.y}) scale(${bump}) translate(${-A.x} ${-A.y})`}>
                  <Enzyme x={A.x + (1 - amyIn) * 80} y={A.y} scale={A.s} still seed={7} />
                </g>
              </g>
              {ghostVis > 0 ? (
                <g opacity={ghostVis} transform={`translate(${A.x + ghostX + ej.dx} ${A.y + ej.dy}) scale(${A.s})`}>
                  <path d={ENZ_PATH} fill="none" stroke={C.paper} strokeWidth={3.5 / A.s} strokeDasharray={`${12 / A.s} ${10 / A.s}`} />
                </g>
              ) : null}
            </g>
          ) : null}

          {/* ---- catalase: H2O2 in, H2O + O2 out (molecules pass under the enzyme, through the pocket) */}
          {catVis > 0 && streamVis > 0 ? (
            <g opacity={streamVis}>
              <defs>
                <filter id="s07mb" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation={`${(rate * 9).toFixed(2)} ${(rate * 3).toFixed(2)}`} />
                </filter>
              </defs>
              <g filter={rate > 0.08 ? "url(#s07mb)" : undefined}>
              {Array.from({ length: Q }, (_, q) => {
                const m = Math.floor(phase) + 1 + q;
                const u = 1 - (m - phase) / Q;
                const p = inPath(m);
                const e = EASE.inOut(Math.max(0, u));
                const pos = bez(p.s, p.c, [0, 0], e);
                const op = Math.min(1, u * 6) * (1 - prog(u, 0.9, 0.1, (t) => t));
                if (op <= 0.01) return null;
                const wx = pocket[0] + pos[0];
                const wy = pocket[1] + pos[1];
                return (
                  <g key={m} opacity={op}>
                    <Molecule kind="H2O2" x={wx} y={wy} scale={0.7} rotate={p.rot + p.spin * e} seed={m} temperature={37} />
                  </g>
                );
              })}
              </g>
              {crossings.map((cf, m) => {
                const age = f - cf;
                if (age < 0 || age > 70) return null;
                const r = rng(5200 + m * 13);
                const out1 = prog(age, 0, 44, EASE.out);
                const ang = ((206 + r() * 26) * Math.PI) / 180;
                const exitX = pocket[0] - 110 * CT.s;
                const dist = 30 + 330 * out1;
                const wx = (age < 6 ? pocket[0] + (exitX - pocket[0]) * (age / 6) : exitX) + Math.cos(ang) * dist;
                const wy = pocket[1] + Math.sin(ang) * dist;
                const water = age <= 44 && (rate < 0.25 || m % 2 === 0) ? (
                  <Molecule key={`w${m}`} kind="H2O" x={wx} y={wy} scale={0.62} rotate={r() * 360} seed={m + 300} temperature={37} opacity={Math.min(1, age / 4) * (1 - prog(age, 26, 18, (t) => t))} />
                ) : null;
                return water;
              })}
            </g>
          ) : null}

          {/* the catalase itself (old one: falls apart during "wear") */}
          {catVis > 0 && oldVis > 0 ? (
            <g opacity={catVis * oldVis} transform={jitTransform(ctj, [CT.x, CT.y])}>
              <Enzyme x={CT.x + (1 - catVis) * 120} y={CT.y} scale={CT.s} still palette="violet" variant={CT.variant} seed={CT.seed} denature={0.6 * prog(f, k.dis - 8, 22)} />
              {flash > 0.02 && streamVis > 0 ? (
                <g opacity={flash * streamVis}>
                  <circle cx={pocket[0]} cy={pocket[1]} r={34} fill={C.violetLight} opacity={0.35} />
                  <circle cx={pocket[0]} cy={pocket[1]} r={18 + 30 * (1 - flash)} fill="none" stroke={C.violetLight} strokeWidth={3} />
                </g>
              ) : null}
            </g>
          ) : null}

          {/* oxygen: every two H2O2 make one O2 — it gathers into rising bubbles */}
          {catVis > 0 && streamVis > 0
            ? crossings.map((cf, m) => {
                if (m % 2 === 1) return null;
                const age = f - cf;
                if (age < 0 || age > 80) return null;
                const r = rng(8800 + m * 17);
                const drift = noise2D(`bub${m}`, age * 0.03, 0) * 40;
                const bx = pocket[0] - 190 * CT.s - age * (1.2 + r() * 1.6) + drift;
                const by = pocket[1] - 70 - age * (4.4 + r() * 2.2);
                const rr = 12 + Math.min(age, 50) * (0.42 + r() * 0.25);
                const fade = 1 - prog(age, 60, 20, (t) => t);
                return (
                  <g key={`o${m}`} opacity={fade * streamVis}>
                    <Bubble x={bx} y={by} r={rr} progress={Math.min(1, age / 10)} seed={m} tint={C.paper} />
                    {age < 20 ? <Molecule kind="O2" x={bx} y={by} scale={0.5} rotate={r() * 180} seed={m + 900} still opacity={1 - age / 20} /> : null}
                  </g>
                );
              })
            : null}

          {/* ---- amino acids: from the old enzyme to the new one */}
          {showBeads
            ? beadIdx.map((ci, j) => {
                const [px, py] = chainPts[ci];
                const r = rng(4400 + j * 7);
                const startW: Pt = [CT.x + CT.s * px, CT.y + CT.s * py];
                const looseW: Pt = [CT.x + CT.s * px * 1.3 + (r() - 0.5) * 90, CT.y + CT.s * py * 1.3 + (r() - 0.5) * 90];
                const endW: Pt = [CT2.x + CT.s * px, CT2.y + CT.s * py];
                const a = prog(f, k.dis, 22, out);
                const b = prog(f, travelStart(j), TRAVEL, EASE.inOut);
                const midW: Pt = [(looseW[0] + endW[0]) / 2, Math.min(looseW[1], endW[1]) - 160 - r() * 60];
                const pos = b > 0 ? bez(looseW, midW, endW, b) : ([startW[0] + (looseW[0] - startW[0]) * a, startW[1] + (looseW[1] - startW[1]) * a] as Pt);
                const nj = noise2D(`bead${j}`, f * 0.05, 0) * 7 * (1 - b);
                const vis = prog(f, k.dis - 2, 8) * (1 - prog(f, buildDone, 14));
                return <circle key={j} cx={pos[0] + nj} cy={pos[1] - nj} r={8.5 * CT.s} fill={C.violetLight} stroke={C.violetDeep} strokeWidth={2.6} opacity={vis} />;
              })
            : null}
          {/* the new chain grows bead by bead as they arrive, then the finished enzyme fills in */}
          {arrived > 1 && f < buildDone + 20 ? (
            <path
              d={smoothOpenPath(chainPts.slice(0, beadIdx[arrived - 1] + 1).map(([px, py]) => [CT2.x + CT.s * px, CT2.y + CT.s * py] as Pt), 0.9)}
              fill="none"
              stroke={C.violet}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={1 - prog(f, buildDone, 14)}
            />
          ) : null}
          {newVis > 0 ? (
            <g opacity={newVis}>
              <Enzyme x={CT2.x} y={CT2.y} scale={CT.s} palette="violet" variant={CT.variant} seed={CT.seed} temperature={37} />
            </g>
          ) : null}
        </g>
      </FocusPull>

      {/* ---------------- screen-space annotations */}
      <MythCard2 x={W / 2} y={H / 2 - 20 - cardOut * 700} number={1} before="Enzymes get " word="used up" replacement="reused" enter={cardEnter} strike={strikeP} replace={replaceP} opacity={1 - cardOut} seed={7} />

      {/* amylase reaction counter */}
      <g opacity={prog(f, k.s1 - 6, 14) * (1 - prog(f, k.cat + 10, 20))}>
        <text x={330} y={176} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.ink300}>
          reactions
        </text>
        <Counter x={330} y={278} value={reactions} size={110} align="middle" />
      </g>
      {ghostVis > 0 ? (
        <Label anchor={ghostAnchor} at={[ghostAnchor[0] + 60, ghostAnchor[1] - 110]} text="unchanged" progress={prog(f, k.unch + 14, 20)} opacity={1 - prog(f, k.s2 - 12, 10)} />
      ) : null}

      {/* catalase labels */}
      <Label anchor={catAnchor} at={[catAnchor[0] + 70, catAnchor[1] + 150]} text="catalase" color={C.violetLight} size={56} progress={prog(f, k.catWord, 22)} opacity={1 - prog(f, k.wear - 8, 12)} />
      {(() => {
        const txt = "in almost all your cells";
        const tw = textWidth(txt, 42, 500);
        const x0 = S([CT.x, CT.y])[0] - tw / 2 + 40;
        return (
          <g opacity={prog(f, k.cells, 16) * (1 - prog(f, k.many + 30, 14))}>
            <CellOutline cx={x0 - 56} cy={948} rx={34} ry={27} progress={prog(f, k.cells, 22, (t) => t)} seed={3} color={C.paperDim} flow={0} />
            <circle cx={x0 - 62} cy={950} r={9} fill={C.ink300} opacity={prog(f, k.cells + 10, 12)} />
            <text x={x0} y={964} fontFamily={FONT} fontWeight={500} fontSize={42} fill={C.ink300}>
              {txt}
            </text>
          </g>
        );
      })()}
      {(() => {
        const p = inPath(Math.floor(phase) + 3);
        const u = 1 - (Math.floor(phase) + 3 - phase) / Q;
        const pos = bez(p.s, p.c, [0, 0], EASE.inOut(Math.max(0, u)));
        const a = S([pocket[0] + pos[0], pocket[1] + pos[1] + 30]);
        return (
          <Label anchor={a} at={[200, 930]} text="hydrogen peroxide" align="start" color={C.paper} progress={prog(f, k.hp, 22)} opacity={(1 - prog(f, k.second + 10, 14)) * streamVis} />
        );
      })()}

      {/* reactions in one second */}
      {counterVis > 0 ? (
        <g opacity={counterVis}>
          <g transform={`translate(1070 238)`}>
            <circle r={52} fill="none" stroke={C.ink600} strokeWidth={9} />
            <circle r={52} fill="none" stroke={C.violetLight} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${ringP} 1`} transform="rotate(-90)" />
            <text x={0} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={42} fill={C.paper}>
              1 s
            </text>
          </g>
          <text x={1172} y={140} fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.ink300}>
            reactions
          </text>
          <Counter x={1170} y={238} value={cval} size={92} align="start" speed={cval - cvalPrev} />
          {ringP >= 1 ? (
            <text x={1170 + COUNTER_W + 14} y={238 + 33} fontFamily={FONT} fontWeight={600} fontSize={92} fill={C.violetLight} opacity={prog(f, tc1, 10)}>
              +
            </text>
          ) : null}
        </g>
      ) : null}

      {/* the word equation: the enzyme sits over the arrow, never among the reactants or products */}
      <WordEquation x={W / 2} y={560} left="starch" right="maltose" over="amylase" progress={eqP} size={eqSize} />
      <HandCircle cx={circ.cx} cy={circ.cy} rx={circ.rx} ry={circ.ry} progress={prog(f, k.never, 20, (t) => t)} color={C.tealLight} width={6} seed={5} />
    </Stage>
  );
};
