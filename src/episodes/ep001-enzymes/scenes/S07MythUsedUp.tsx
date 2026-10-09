/**
 * S07 · Myth #1: enzymes get used up.
 * Card: "Enzymes get [used up]" → scratched out, "reused" written in.
 * Proof: one amylase snips; its own dashed outline checks it is unchanged; it snips again, and again
 * (each product leaves before the chain re-docks — the active site is free each time).
 * Pan to catalase (its own small, rounded active site that fits ONE hydrogen peroxide): H₂O₂ drifts in
 * from a pool, water and oxygen leave; the flow speeds up while the counter climbs past 100,000, and a
 * "1 s" ring sweeps exactly one second on "Every second".
 * "Your cells do replace old enzymes, eventually": we pull back to the cell. The old catalase is still
 * working while the cell builds a new one from amino acids; a calendar flips (time passes); the old one
 * is recycled and the new one takes over the same job. End: the word equation, with catalase over the
 * arrow — never a reactant, never a product: the reaction never uses it up.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Enzyme } from "../../../components/Enzyme";
import { Link, Ring, SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label } from "../../../components/Label";
import { DOCK, ENZYME_RADII, ENZYME_REST, SPACING } from "../../../components/molecule-geometry";
import { Bubble, CellOutline, Counter, FocusPull, HandCircle, Molecule, WordEquation, circleAround, textBox, textWidth } from "../../../components/kit";
import { Pt, rng, roundedPolygon, smoothOpenPath } from "../../../lib/geometry";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { blendJit, jit, jitTransform, moveRings, toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s07Timing } from "./S07MythUsedUp.timing";
import { CATALASE_OUTLINE, CAT_DOCK, CAT_H2O2, Calendar, Catalase, MythCard2, ProteinBlob, foldedChainIn } from "./S06-S12-shared";

const A = { x: 1250, y: 610, s: 1.35 } as const; // amylase
const SP = SPACING * A.s;
const N0 = 12;
const ENZ_PATH = roundedPolygon(ENZYME_REST, ENZYME_RADII);
const MALTOSE_TARGETS: readonly (readonly [number, number])[] = [
  [800, 330],
  [600, 430],
  [980, 250],
];

const CT = { x: 2580, y: 610, s: 1.3, seed: 23 } as const; // catalase (the old one)
const CTN = { x: 3060, y: 520 } as const; // where the cell builds the new one
const pocketOf = (cx: number, cy: number): Pt => [cx + CT.s * CAT_DOCK[0], cy + CT.s * CAT_DOCK[1]];
const PC_OLD = pocketOf(CT.x, CT.y);
const PC_NEW = pocketOf(CTN.x, CTN.y);
/** A pool of hydrogen peroxide in the cell: the stream peels off from here (and the label points here). */
const RES: Pt = [2060, 800];
const RES_SPOTS: readonly Pt[] = [
  [-70, -26],
  [36, -54],
  [92, 22],
  [-14, 46],
  [-112, 52],
];
const MOL_S = CAT_H2O2.scale * CT.s; // H₂O₂ glyph scale that fits the catalase's slot
const CELL = { x: 2780, y: 590, rx: 1030, ry: 560 } as const;
const CROWD: readonly { x: number; y: number; r: number }[] = [
  { x: 2230, y: 300, r: 62 },
  { x: 2700, y: 210, r: 54 },
  { x: 3420, y: 330, r: 66 },
  { x: 3520, y: 720, r: 58 },
  { x: 3220, y: 1000, r: 56 },
  { x: 2620, y: 960, r: 52 },
];

/** The counter lands on 100,000, then "+": measured catalase turnover is 54,000–833,000 per second (sources.md #13). */
const COUNTER_DIGITS = 6;
const COUNTER_W = COUNTER_DIGITS * 92 * 0.64 + (textWidth(",", 92, 600) + 92 * 0.04);

// ---- the catalase reaction stream -----------------------------------------------------------
const Q = 5; // molecules on their way in at once (≈ 86 px apart: they never pile up)
const bez = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];
/** Molecule m of a stream: starts in the pool, arrives horizontally into the slot (which opens to the left). */
const inPath = (m: number, pc: Pt, salt: number) => {
  const r = rng(9100 + m * 31 + salt);
  const s: Pt = [RES[0] + (r() - 0.5) * 170, RES[1] + (r() - 0.5) * 110];
  const c: Pt = [pc[0] - 230 - r() * 60, pc[1] + 10 + r() * 30];
  return { s, c, rot: r() * 360 };
};
/** Position along the path: brisk at first, easing into the active site. */
const along = (u: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 1.15);

type Stream = { phase: number; rate: number; crossings: number[] };
/** Integrates a rate (reactions per frame) from f0; molecule m binds when the phase passes m. */
const runStream = (f: number, f0: number, phase0: number, rateAt: (x: number) => number): Stream => {
  let phase = phase0;
  const crossings: number[] = [];
  for (let x = f0; x <= f; x++) {
    const r = rateAt(x);
    const before = phase;
    phase += r;
    if (Math.floor(phase) > Math.floor(before) && Math.floor(phase) >= 1) {
      crossings.push(x - 1 + (Math.floor(phase) - before) / Math.max(1e-6, phase - before));
    }
  }
  return { phase, rate: f >= f0 ? rateAt(f) : 0, crossings };
};

/** One stream into one catalase: incoming H₂O₂ (drawn over the enzyme, so they visibly sit in the slot), water out. */
const StreamIn: React.FC<{ readonly f: number; readonly st: Stream; readonly pc: Pt; readonly salt: number; readonly vis: number }> = ({ f, st, pc, salt, vis }) => {
  if (vis <= 0.01) return null;
  const { phase, rate } = st;
  return (
    <g opacity={vis}>
      {Array.from({ length: Q }, (_, q) => {
        const m = Math.floor(phase) + 1 + q;
        if (m < 1) return null;
        const u = 1 - (m - phase) / Q;
        if (u <= 0) return null;
        const p = inPath(m, pc, salt);
        const e = along(u);
        const pos = bez(p.s, p.c, pc, e);
        const op = Math.min(1, u * 7);
        const settle = Math.max(0, Math.min(1, (u - 0.55) / 0.4));
        // H–O–O–H looks the same turned half a turn, so it turns the short way into the slot's orientation
        const target = CAT_H2O2.rotate + 180 * Math.round((p.rot - CAT_H2O2.rotate) / 180);
        const rot = p.rot + (target - p.rot) * settle * settle * (3 - 2 * settle);
        // a soft speed trail behind fast molecules (instead of a blur filter that strobes)
        const trailOn = rate > 0.07 && u < 0.85;
        const tr = trailOn
          ? smoothOpenPath(Array.from({ length: 6 }, (_, i) => bez(p.s, p.c, pc, along(u - 0.09 + (0.09 * i) / 5))), 0.5)
          : "";
        return (
          <g key={m} opacity={op}>
            {trailOn ? <path d={tr} fill="none" stroke={C.paper} strokeOpacity={Math.min(0.16, (rate - 0.07) * 2.2)} strokeWidth={30 * MOL_S} strokeLinecap="round" /> : null}
            <Molecule kind="H2O2" x={pos[0]} y={pos[1]} scale={MOL_S} rotate={rot} seed={m + salt} temperature={37} />
          </g>
        );
      })}
    </g>
  );
};

/** Products of one stream: a water per reaction (out through the mouth, fanning up-left), an O₂ bubble per two. */
const StreamOut: React.FC<{ readonly f: number; readonly st: Stream; readonly pc: Pt; readonly vis: number }> = ({ f, st, pc, vis }) => {
  if (vis <= 0.01) return null;
  const mouth: Pt = [pc[0] - 62 * CT.s, pc[1]];
  return (
    <g opacity={vis}>
      {st.crossings.map((cf, m) => {
        const age = f - cf;
        if (age < 0 || age > 48) return null;
        const r = rng(5200 + m * 13);
        const ang = ((198 + ((m * 0.618) % 1) * 50 + r() * 6) * Math.PI) / 180; // golden-ratio spread: no clumps
        const outA = Math.min(1, age / 6);
        const drift = prog(age, 4, 30, EASE.out);
        const x0 = pc[0] + (mouth[0] - pc[0]) * outA;
        const wx = x0 + Math.cos(ang) * 230 * drift;
        const wy = pc[1] + Math.sin(ang) * 230 * drift;
        const water =
          age <= 30 ? (
            <Molecule key={`w${m}`} kind="H2O" x={wx} y={wy} scale={MOL_S * 1.05} rotate={r() * 360} seed={m + 300} temperature={37} opacity={Math.min(1, age / 3) * (1 - prog(age, 16, 14, (t) => t))} />
          ) : null;
        if (m % 2 === 1) return water;
        const bx = mouth[0] - 30 - age * (1.1 + r() * 0.8) + noise2D(`bub${m}`, age * 0.04, 0) * 18;
        const by = mouth[1] - 50 - age * (3.6 + r() * 1.2);
        return (
          <g key={`p${m}`}>
            {water}
            <g opacity={1 - prog(age, 32, 16, (t) => t)}>
              <Bubble x={bx} y={by} r={12 + Math.min(age, 30) * 0.55} progress={Math.min(1, age / 8)} seed={m} tint={C.paper} />
              {age < 18 ? <Molecule kind="O2" x={bx} y={by} scale={MOL_S * 0.9} rotate={r() * 180} seed={m + 900} still opacity={1 - age / 18} /> : null}
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** Amino-acid beads: every 6th point of a catalase's folded chain (catalase-local). */
const CAT_CHAIN = foldedChainIn(CATALASE_OUTLINE, CT.seed * 97 + 11);
const BEADS = CAT_CHAIN.map((_, i) => i).filter((i) => i % 6 === 0);

export const S07MythUsedUp: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s07Timing(sc);
  const out = EASE.out;
  const amp = thermalAmplitude(37) * 0.8;

  // ---------------- camera: amylase → pan to catalase → pull back to the cell
  const cam = camAt(f, [
    { f: -12, x: 960, y: 540, z: 1 },
    { f: k.cat, x: 960, y: 540, z: 1 },
    { f: k.cat + 58, x: 2480, y: 540, z: 1 },
    { f: k.wear - 2, x: 2480, y: 540, z: 1 },
    { f: k.wear + 36, x: 2800, y: 580, z: 0.78 },
  ]);
  const S = (p: readonly [number, number]) => toScreen(cam, p);

  // ---------------- myth card
  const cardEnter = prog(f, k.myth, 20);
  const cardOut = prog(f, k.cardOut, 14, EASE.in);
  const strikeP = prog(f, k.strike, 14, (t) => t);
  const replaceP = prog(f, k.replace, 20, (t) => t);

  // ---------------- amylase: snip, unchanged, again, again
  const snaps = [k.s1, k.s2, k.s3];
  const docks = [k.s1 - 12, k.s2 - 8, k.s3 - 8];
  const done = snaps.filter((s) => f >= s + 3).length;
  const n = N0 - 2 * done;
  // After each snip the chain's free end dips out of the mouth (it pivots far to the left, like a
  // floppy chain), the product slides out, then the chain swings back and docks two rings further on.
  let off = 0;
  let dip = 0;
  if (done === 0) {
    off = track(f, [[docks[0] - 20, -700], [docks[0], 0, out]]);
  } else {
    const s = snaps[done - 1];
    const nd = docks[done];
    if (nd !== undefined) {
      off = track(f, [[nd - 10, -2 * SP], [nd, 0, EASE.inOut]]);
      dip = track(f, [[s + 2, 0], [s + 7, 6.5, out], [nd - 10, 6.5], [nd - 1, 0, EASE.inOut]]);
    } else {
      off = track(f, [[s + 10, -2 * SP], [k.cat + 40, -2 * SP - 320, EASE.in]]);
      dip = track(f, [[s + 1, 0], [s + 7, 6.5, out]]);
    }
  }
  const amyIn = prog(f, k.cardOut + 10, 18);
  const ej = jit("E07", f, amp);
  const dockedAmt = Math.max(...docks.map((d, i) => window01(f, d - 10, snaps[i] + 4, 6)));
  const bump = 1 + snaps.reduce((a, s, i) => a + 0.014 * pulse(f, docks[i] - 2, 12) - 0.008 * pulse(f, s, 8), 0);
  const chainBase = dockedChain(n, A.x, A.y, A.s, { wave: 1.4 * Math.sin(f * 0.06) * (1 - dockedAmt * 0.7) });
  const pivot: Pt = [A.x + A.s * DOCK.inner[0] - (n - 1) * SP, A.y];
  const chainRings = moveRings(chainBase.rings, off, 0, dip, pivot);
  const curSnap = snaps[done] ?? -999;
  const strain = window01(f, curSnap - 10, curSnap + 2, 5);
  const chainLinks: Link[] = chainBase.links.map((l, i) => (i === n - 3 ? { ...l, highlight: strain } : l));
  const cj = blendJit(jit("C07", f, amp * 1.2), ej, dockedAmt);
  const lastSnap = done > 0 ? snaps[done - 1] : -999;
  const pairs = snaps.slice(0, done).map((s, j) => {
    const [tx, ty] = MALTOSE_TARGETS[j];
    const startX = A.x + (A.s * (DOCK.outer[0] + DOCK.inner[0])) / 2;
    // out along the pocket first (while the chain has dipped clear), then away up-left
    const px = track(f, [[s + 3, startX], [s + 14, startX - 190, EASE.inOut], [s + 62, tx, out]]);
    const py = track(f, [[s + 3, A.y], [s + 14, A.y - 14, EASE.inOut], [s + 62, ty, out]]);
    const bob = Math.sin((f - s) * 0.05 + j) * 8 * prog(f, s + 40, 20);
    const rot = track(f, [[s + 12, 0], [s + 62, -18 + j * 12, out]]);
    const base: Ring[] = [
      { x: px - SP / 2, y: py + bob, tone: "sugar", glow: prog(f, s + 3, 18), scale: A.s },
      { x: px + SP / 2, y: py + bob, tone: "sugar", glow: prog(f, s + 3, 18), scale: A.s },
    ];
    return moveRings(base, 0, 0, rot);
  });
  const amyVis = amyIn * (1 - prog(f, k.cat + 30, 26));
  // the check: the enzyme's own outline, taken before the reaction, still fits it exactly afterwards
  const ghostX = track(f, [[k.unch - 6, 300], [k.unch + 14, 0, out]]);
  const ghostVis = window01(f, k.unch - 6, k.s3 + 12, 10);
  const reactions = snaps.reduce((a, s) => a + prog(f, s + 1, 10), 0);

  // ---------------- catalase: stream A (the old enzyme), stream B (its replacement)
  const catVis = prog(f, k.cat + 20, 30);
  const a0 = k.catWord - 30;
  const rPeak = 0.15;
  const rSlow = 0.07;
  const rDrift = 3.5 / Math.max(30, k.brk - a0); // the first molecule binds exactly on "break down"
  const rateA = (x: number) => {
    if (x < k.brk) return rDrift;
    const up = rDrift + (rPeak - rDrift) * prog(x, k.brk + 4, 90, EASE.inOut);
    return up + (rSlow - up) * prog(x, k.wear, 24, EASE.inOut);
  };
  const stA = runStream(f, a0, -2.5, rateA);
  // the old catalase keeps working right up to the moment it is recycled
  const visA = prog(f, a0, 24) * (1 - prog(f, k.swap - 2, 8));
  const b0 = k.swap + 6;
  const stB = runStream(f, b0, -1.0, () => 0.09);
  const visB = prog(f, b0, 12);
  const flashOf = (st: Stream) => {
    const last = st.crossings.length ? st.crossings[st.crossings.length - 1] : -999;
    return f >= last ? Math.exp(-(f - last) / 5) : 0;
  };
  const ctj = jit("CT07", f, amp);
  const ctjN = jit("CT07n", f, amp);
  const poolVis = prog(f, a0 - 6, 24);

  // ---------------- counter + one-second ring
  const tc0 = k.many;
  const tc1 = k.every - 4; // the climb finishes just as "Every second" is said
  const soFar = stA.crossings.length;
  const cvalAt = (x: number) => (x < tc0 ? soFar : Math.max(soFar, Math.pow(10, (COUNTER_DIGITS - 1) * prog(x, tc0, tc1 - tc0, EASE.inOut))));
  const cval = cvalAt(f);
  const cvalPrev = cvalAt(f - 1);
  const counterVis = prog(f, k.brk - 2, 14) * (1 - prog(f, k.wear + 4, 12));
  const ringIn = prog(f, k.every - 2, 8);
  const ringP = prog(f, k.second, 30, (t) => t); // exactly one second of real time

  // ---------------- wear: the cell builds a new catalase; time passes; the old one is recycled
  const cellP = prog(f, k.wear + 4, 40, (t) => t);
  const NB = BEADS.length;
  // the new chain is made bead by bead (left → right), then folds up, starting from its first bead
  const synth = prog(f, k.build, 18, (t) => t);
  const foldAt = (j: number) => prog(f, k.build + 12 + (j / NB) * 14, 16, EASE.inOut);
  const newFill = prog(f, k.buildDone - 6, 14);
  const oldGone = prog(f, k.swap, 14);
  const flips = 5 * prog(f, k.replaceW + 4, k.eventually + 20 - k.replaceW - 4, (t) => t);
  const calVis = prog(f, k.replaceW - 4, 12) * (1 - prog(f, k.eq - 4, 12));

  // ---------------- equation (the scene stays visible behind it: the new catalase keeps working)
  const eqP = prog(f, k.reaction, 44, (t) => t);
  const eqDim = prog(f, k.eq - 4, 24);
  const eqY = 196;
  const eqSize = 60;
  const overSize = Math.max(40, eqSize * 0.72);
  const wl = textWidth("hydrogen peroxide", eqSize, 600);
  const wr = textWidth("water + oxygen", eqSize, 600);
  const arrowLen = Math.max(220, textWidth("catalase", overSize, 600) + 80);
  const gap = eqSize * 0.45;
  const total = wl + gap + arrowLen + gap + wr;
  const arrowCx = W / 2 - total / 2 + wl + gap + arrowLen / 2;
  const catBox = textBox("catalase", arrowCx, eqY - eqSize * 0.42, overSize, 600, "middle");
  const circ = circleAround(catBox, 26, 16);

  // ---------------- screen anchors
  const ghostAnchor = S([A.x + 220, A.y - 170]);
  const catAnchor = S([CT.x + CT.s * 150 + ctj.dx, CT.y + CT.s * 60 + ctj.dy]);
  const resAnchor = S([RES[0] - 20, RES[1] + 50]);

  return (
    <Stage bg={{ particles: 40, lightX: 0.55 }}>
      <FocusPull blur={eqDim * 2.5} dim={0} opacity={1 - 0.42 * eqDim}>
        <g transform={camTransform(cam)}>
          {/* ---- the cell (seen when we pull back) and other proteins in it — no amylase in here */}
          <CellOutline cx={CELL.x} cy={CELL.y} rx={CELL.rx} ry={CELL.ry} progress={cellP} seed={12} color={C.ink300} fill={C.ink700} />
          {f > k.wear
            ? CROWD.map((p, i) => <ProteinBlob key={i} x={p.x} y={p.y} r={p.r} seed={70 + i} opacity={prog(f, k.wear + 10 + i * 3, 24)} />)
            : null}

          {/* ---- amylase */}
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

          {/* ---- hydrogen peroxide pool */}
          {catVis > 0 && poolVis > 0 ? (
            <g opacity={poolVis}>
              {RES_SPOTS.map(([dx, dy], i) => (
                <Molecule key={i} kind="H2O2" x={RES[0] + dx} y={RES[1] + dy} scale={MOL_S} rotate={i * 67} seed={500 + i} temperature={37} />
              ))}
            </g>
          ) : null}

          {/* ---- the old catalase: works right up to the swap, then is recycled into amino acids */}
          {catVis > 0 && oldGone < 1 ? (
            <g transform={jitTransform(ctj, [CT.x, CT.y])}>
              <Catalase x={CT.x + (1 - catVis) * 120} y={CT.y} scale={CT.s} seed={CT.seed} opacity={catVis} fill={1 - oldGone} glow={flashOf(stA) * 0.8 * visA} />
            </g>
          ) : null}
          {f >= k.swap && f < k.swap + 34
            ? BEADS.map((ci, j) => {
                const [px, py] = CAT_CHAIN[ci];
                const r = rng(4400 + j * 7);
                const a = prog(f, k.swap, 30, out);
                const wx = CT.x + CT.s * px * (1 + 0.35 * a) + (r() - 0.5) * 110 * a;
                const wy = CT.y + CT.s * py * (1 + 0.35 * a) + (r() - 0.5) * 110 * a;
                return <circle key={j} cx={wx} cy={wy} r={7 * CT.s} fill={C.violetLight} stroke={C.violetDeep} strokeWidth={2.6} opacity={prog(f, k.swap, 6) * (1 - prog(f, k.swap + 16, 18))} />;
              })
            : null}

          {/* ---- the new catalase: amino acids gather in chain order, the chain folds, it fills in */}
          {f > k.build && f < k.buildDone + 22
            ? (() => {
                const pos: Pt[] = BEADS.map((ci, j) => {
                  const [px, py] = CAT_CHAIN[ci];
                  const t = j / (NB - 1);
                  const lineX = CTN.x - 200 + t * 720;
                  const line: Pt = [lineX, CTN.y + 330 + Math.sin(t * 9.5) * 26 + Math.sin(t * 23 + 1) * 9];
                  const to: Pt = [CTN.x + CT.s * px, CTN.y + CT.s * py];
                  const b = foldAt(j);
                  const mid: Pt = [(line[0] + to[0]) / 2 + 40, Math.min(line[1], to[1]) + 60];
                  const p = bez(line, mid, to, b);
                  const nj = noise2D(`bead${j}`, f * 0.05, 0) * 5 * (1 - b);
                  return [p[0] + nj, p[1] - nj] as Pt;
                });
                const shown = Math.max(0, Math.min(NB, Math.floor(synth * NB + 0.001)));
                const vis = 1 - prog(f, k.buildDone + 2, 14);
                if (shown < 1) return null;
                return (
                  <g opacity={vis}>
                    {shown > 1 ? <path d={smoothOpenPath(pos.slice(0, shown), 0.7)} fill="none" stroke={C.violet} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} /> : null}
                    {pos.slice(0, shown).map((p, j) => (
                      <circle key={j} cx={p[0]} cy={p[1]} r={8.5 * CT.s} fill={C.violetLight} stroke={C.violetDeep} strokeWidth={3} opacity={j === shown - 1 ? Math.min(1, (synth * NB - j) * 1.5 + 0.3) : 1} />
                    ))}
                  </g>
                );
              })()
            : null}
          {newFill > 0 ? (
            <g transform={jitTransform(ctjN, [CTN.x, CTN.y])}>
              <Catalase x={CTN.x} y={CTN.y} scale={CT.s} seed={CT.seed} fill={newFill} glow={flashOf(stB) * 0.8 * visB} />
            </g>
          ) : null}

          {/* ---- the streams (over the enzymes, so each H₂O₂ visibly sits in the slot) */}
          {catVis > 0 ? (
            <>
              <StreamOut f={f} st={stA} pc={PC_OLD} vis={visA} />
              <StreamIn f={f} st={stA} pc={PC_OLD} salt={0} vis={visA} />
              <StreamOut f={f} st={stB} pc={PC_NEW} vis={visB} />
              <StreamIn f={f} st={stB} pc={PC_NEW} salt={77} vis={visB} />
            </>
          ) : null}
        </g>
      </FocusPull>

      {/* ---------------- screen-space annotations */}
      <MythCard2 x={W / 2} y={540 - 20 - cardOut * 700} number={1} before="Enzymes get " word="used up" replacement="reused" enter={cardEnter} reveal={prog(f, k.said0, k.said1 - k.said0, (t) => t)} strike={strikeP} replace={replaceP} opacity={1 - cardOut} seed={7} />

      {/* amylase reaction counter */}
      <g opacity={prog(f, k.s1 - 6, 14) * (1 - prog(f, k.cat + 10, 20))}>
        <text x={330} y={176} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.ink300}>
          reactions
        </text>
        <Counter x={330} y={278} value={reactions} size={110} align="middle" />
      </g>
      {ghostVis > 0 ? (
        <Label anchor={ghostAnchor} at={[ghostAnchor[0] + 60, ghostAnchor[1] - 110]} text="unchanged" progress={prog(f, k.unch - 2, 20)} opacity={1 - prog(f, k.s3 + 10, 10)} />
      ) : null}

      {/* catalase labels */}
      <Label anchor={catAnchor} at={[catAnchor[0] + 90, catAnchor[1] + 130]} text="catalase" color={C.violetLight} size={56} progress={prog(f, k.catWord, 22)} opacity={1 - prog(f, k.wear - 8, 12)} />
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
      <Label anchor={resAnchor} at={[resAnchor[0] - 40, resAnchor[1] + 104]} text="hydrogen peroxide" align="start" color={C.paper} progress={prog(f, k.hp, 22)} opacity={1 - prog(f, k.wear - 6, 12)} />

      {/* reactions, then "every second": the ring sweeps exactly one second of real time */}
      {counterVis > 0 ? (
        <g opacity={counterVis}>
          {ringIn > 0 ? (
            <g transform={`translate(1070 238) scale(${0.85 + 0.15 * EASE.out(ringIn)})`} opacity={ringIn}>
              <circle r={52} fill="none" stroke={C.ink600} strokeWidth={9} />
              <circle r={52} fill="none" stroke={C.violetLight} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${ringP} 1`} transform="rotate(-90)" />
              <text x={0} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={42} fill={C.paper}>
                1 s
              </text>
            </g>
          ) : null}
          <text x={1172} y={140} fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.ink300}>
            reactions
          </text>
          <Counter x={1170} y={238} value={cval} size={92} align="start" speed={cval - cvalPrev} />
          {f >= tc1 ? (
            <text x={1170 + COUNTER_W + 14} y={238 + 33} fontFamily={FONT} fontWeight={600} fontSize={92} fill={C.violetLight} opacity={prog(f, tc1, 10)}>
              +
            </text>
          ) : null}
        </g>
      ) : null}

      {/* time passes (no number of days claimed: protein lifetimes range from minutes to weeks) */}
      <Calendar x={1650} y={232} size={128} flips={flips} progress={calVis} />

      {/* the word equation: the enzyme sits over the arrow, never among the reactants or products */}
      {eqP > 0 ? (
        <>
          <defs>
            <radialGradient id="s07eqScrim" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={C.ink950} stopOpacity={0.8} />
              <stop offset="0.7" stopColor={C.ink950} stopOpacity={0.55} />
              <stop offset="1" stopColor={C.ink950} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={W / 2} cy={eqY - 24} rx={1060} ry={190} fill="url(#s07eqScrim)" opacity={eqDim} />
        </>
      ) : null}
      <WordEquation x={W / 2} y={eqY} left="hydrogen peroxide" right="water + oxygen" over="catalase" overColor={C.violetLight} leftColor={C.cream} rightColor={C.paper} progress={eqP} size={eqSize} />
      <HandCircle cx={circ.cx} cy={circ.cy} rx={circ.rx} ry={circ.ry} progress={prog(f, k.never, 20, (t) => t)} color={C.violetLight} width={6} seed={5} />
    </Stage>
  );
};
