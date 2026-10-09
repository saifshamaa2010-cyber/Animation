/**
 * The temperature arc (S08 → S09 → S10) as ONE continuous model, in absolute episode frames:
 *  - the thermometer reading over time,
 *  - the integrated "thermal phase" that drives every molecule's motion (so speeding up or
 *    slowing down never makes anything jump, and the molecules carry on seamlessly across cuts),
 *  - the scripted collisions between enzymes and substrates (bumps and successful dockings).
 * Every scene in the arc reads from here, so the three scenes behave like one shot.
 *
 * Chains are always laid out from a rigid pose (centre + angle), so links can never shrink or
 * fold through each other. A starch chain that has been cut down to maltose leaves the field of
 * view (fades) and a fresh chain drifts in later — the lens is a small window on a solution that
 * is full of starch, so the reaction never stalls for lack of substrate.
 */
import { noise2D } from "@remotion/noise";
import { EASE } from "../../../brand/tokens";
import { cueFns } from "../../../lib/cues";
import { thermalAmplitude } from "../../../lib/motion";
import { track, type Key } from "../../../lib/track";
import { DOCK, SPACING } from "../../../components/molecule-geometry";
import { TL, sceneById } from "../timeline";
import { s08Timing } from "./S08Temperature.timing";
import { s09Timing } from "./S09Predict.timing";
import { s10Timing } from "./S10Denature.timing";

const SC8 = sceneById("S08");
const SC9 = sceneById("S09");
const SC10 = sceneById("S10");
export const O8 = SC8.startFrame;
export const O9 = SC9.startFrame;
export const O10 = SC10.startFrame;
export const K8 = s08Timing(cueFns(SC8, TL.words, TL.fps));
export const K9 = s09Timing(cueFns(SC9, TL.words, TL.fps));
export const K10 = s10Timing(cueFns(SC10, TL.words, TL.fps));

/** How cold the "cold is different" sample gets (°C). Low on the curve, clearly NOT on the floor. */
export const COLD_T = 10;

// ------------------------------------------------------------------ temperature (°C)
const TEMP: Key[] = [
  [O8 - 120, 10],
  [O8 + K8.heatA, 10],
  [O8 + K8.heatB, 25, EASE.inOut],
  [O8 + K8.riseA, 25],
  [O8 + K8.riseB, 37, EASE.inOut],
  [O9 + K9.creepA, 37],
  [O9 + K9.creepB, 41, EASE.inOut],
  [O9 + K9.t50 - 9, 41],
  [O9 + K9.t50 + 1, 50, EASE.out],
  [O9 + K9.t60 - 8, 50],
  [O9 + K9.t60 + 1, 60, EASE.out],
  [O9 + K9.t70 - 8, 60],
  [O9 + K9.t70 + 1, 70, EASE.out],
  // S10: cooled back to 37 °C — the rate stays on the floor
  [O10 + K10.coolA, 70],
  [O10 + K10.coolB, 37, EASE.inOut],
  // close-up "before heating" at 37 °C, then too much heat
  [O10 + K10.heatA, 37],
  [O10 + K10.heatB, 70, EASE.inOut],
  // cooling won't fix it
  [O10 + K10.chillA, 70],
  [O10 + K10.chillB, 37, EASE.inOut],
  // a fresh sample at 37 °C, cooled: slower, not broken
  [O10 + K10.coldCoolA, 37],
  [O10 + K10.coldCoolB, COLD_T, EASE.inOut],
  // warm it up: it recovers
  [O10 + K10.rewarmA, COLD_T],
  [O10 + K10.rewarmB, 37, EASE.inOut],
];
export const tempAt = (abs: number) => track(abs, TEMP);

// ------------------------------------------------------------------ integrated motion phases
/** Wander speed: how fast molecules drift around, by temperature (exaggerated so it reads). */
const wanderSpeed = (T: number) => 0.0032 + 0.00042 * T;
/** Jiggle frequency rises with temperature too (the Enzyme component does the same). */
const jiggleSpeed = (T: number) => 0.03 + thermalAmplitude(T) * 0.004;

const A0 = O8 - 160;
const A1 = SC10.endFrame + 160;
const WANDER = new Float64Array(A1 - A0 + 1);
const JIG = new Float64Array(A1 - A0 + 1);
{
  let a = 0;
  let b = 0;
  for (let i = 0; i < WANDER.length; i++) {
    const T = tempAt(A0 + i);
    a += wanderSpeed(T);
    b += jiggleSpeed(T);
    WANDER[i] = a;
    JIG[i] = b;
  }
}
const sample = (arr: Float64Array, abs: number) => {
  const x = Math.max(0, Math.min(arr.length - 1, abs - A0));
  const i = Math.floor(x);
  const j = Math.min(arr.length - 1, i + 1);
  return arr[i] + (arr[j] - arr[i]) * (x - i);
};
export const wanderAt = (abs: number) => sample(WANDER, abs);
export const jigPhaseAt = (abs: number) => sample(JIG, abs);

export type Jig = { dx: number; dy: number; rot: number };
/** Thermal jiggle at this moment (world px). Amplitude AND frequency follow the thermometer. */
export const jig = (seed: string, abs: number, gain = 1): Jig => {
  const amp = thermalAmplitude(tempAt(abs)) * 1.25 * gain;
  const p = jigPhaseAt(abs);
  return {
    dx: noise2D(`${seed}x`, p, 0) * amp,
    dy: noise2D(`${seed}y`, p, 10) * amp,
    rot: noise2D(`${seed}r`, p, 20) * amp * 0.3,
  };
};

// ------------------------------------------------------------------ the molecules (world space)
/** World space = the full-frame view at the start of S08. The lens later shows all of it, smaller. */
export const MOL_S = 0.55;
/** Screen point the full-frame world is centred on (the camera transform is the identity at t = 0). */
export const WORLD_C = [1150, 540] as const;
/** The world point that ends up in the middle of the lens after the pull-back. */
export const LENS_WC = [1150, 500] as const;
export const SUB_RINGS = 6;

export type Pose = { x: number; y: number; rot: number };

/**
 * Four amylase molecules. rot = which way the active site faces (0 = left). Laid out so that every
 * molecule stays inside the lens's field of view, and the bottom of the frame is free for captions.
 */
export const ENZ = [
  { hx: 905, hy: 405, rot: 0, R: 30 },
  { hx: 1440, hy: 250, rot: -40, R: 36 },
  { hx: 1170, hy: 705, rot: -20, R: 36 },
  { hx: 1600, hy: 640, rot: 22, R: 36 },
] as const;

/** Starch fragments (6 glucose rings each), spaced so they rarely cross. */
export const SUB = [
  { hx: 640, hy: 515, rot: 6, R: 30 },
  { hx: 1170, hy: 190, rot: -8, R: 40 },
  { hx: 1265, hy: 455, rot: 40, R: 34 },
  { hx: 820, hy: 765, rot: -24, R: 36 },
  { hx: 1430, hy: 850, rot: 4, R: 30 },
  { hx: 1660, hy: 400, rot: 84, R: 30 },
  { hx: 745, hy: 215, rot: 18, R: 38 },
  { hx: 1505, hy: 470, rot: -60, R: 30 },
] as const;

/** Water: the solution everything happens in. Positions within the world disc. */
export const WATER = (() => {
  const out: { hx: number; hy: number; s: number }[] = [];
  let a = 12345;
  const r = () => {
    a = (a * 1103515245 + 12345) & 0x7fffffff;
    return a / 0x7fffffff;
  };
  while (out.length < 46) {
    const x = LENS_WC[0] + (r() - 0.5) * 1400;
    const y = LENS_WC[1] + (r() - 0.5) * 1400;
    if (Math.hypot(x - LENS_WC[0], y - LENS_WC[1]) > 690) continue;
    out.push({ hx: x, hy: y, s: 0.9 + r() * 0.7 });
  }
  return out;
})();

export const waterPose = (i: number, abs: number): Pose => {
  const w = WATER[i];
  const p = wanderAt(abs) * 1.6;
  return { x: w.hx + noise2D(`wx${i}`, p, 0) * 70, y: w.hy + noise2D(`wy${i}`, p, 3) * 70, rot: noise2D(`wr${i}`, p, 6) * 180 };
};

export const freeEnzyme = (i: number, abs: number): Pose => {
  const e = ENZ[i];
  const p = wanderAt(abs);
  return {
    x: e.hx + noise2D(`ex${i}`, p * 0.8, 0) * e.R,
    y: e.hy + noise2D(`ey${i}`, p * 0.8, 3) * e.R * 0.7,
    rot: e.rot + noise2D(`er${i}`, p * 0.5, 5) * 9,
  };
};

export const freeSub = (i: number, abs: number): Pose => {
  const s = SUB[i];
  const p = wanderAt(abs);
  return {
    x: s.hx + noise2D(`sx${i}`, p, 0) * s.R,
    y: s.hy + noise2D(`sy${i}`, p, 3) * s.R * 0.8,
    rot: s.rot + noise2D(`sr${i}`, p * 0.7, 5) * 22,
  };
};

const rad = (d: number) => (d * Math.PI) / 180;
const rotV = (x: number, y: number, deg: number): [number, number] => {
  const a = rad(deg);
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const angDiff = (a: number, b: number) => {
  let d = ((b - a + 540) % 360) - 180;
  if (d < -180) d += 360;
  return d;
};
const lerpAngle = (a: number, b: number, t: number) => a + angDiff(a, b) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ramp = (f: number, a: number, b: number, ease: (t: number) => number = EASE.inOut) => ease(clamp01((f - a) / Math.max(1, b - a)));
const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), rot: lerpAngle(a.rot, b.rot, t) });

export type RingXY = { x: number; y: number; rot: number };

/** n rings laid along a pose's axis (a rigid chain: links always exactly SPACING apart). */
export const layout = (p: Pose, n: number, s = MOL_S): RingXY[] =>
  Array.from({ length: n }, (_, j) => {
    const [ox, oy] = rotV((j - (n - 1) / 2) * SPACING * s, 0, p.rot);
    return { x: p.x + ox, y: p.y + oy, rot: p.rot };
  });

/** Unit vector pointing OUT of an enzyme's active site (the way a substrate must come in). */
const pocketDir = (e: Pose): [number, number] => rotV(-1, 0, e.rot);

/**
 * The way a substrate comes in to dock: a curve from p0 to a point PRE_DOCK in front of the active site
 * (arriving along the pocket's axis), then a straight slide into the pocket. at(s) is roughly
 * arc-length parameterised (s = 0..1), so a smooth s(t) gives a smooth speed. sq = where the slide starts.
 */
const approachPath = (p0: readonly [number, number], e: Pose, docked: Pose) => {
  const pd = pocketDir(e);
  const q: [number, number] = [docked.x + pd[0] * PRE_DOCK, docked.y + pd[1] * PRE_DOCK];
  const c: [number, number] = [q[0] + pd[0] * PRE_DOCK * 0.6, q[1] + pd[1] * PRE_DOCK * 0.6];
  const bez = (w: number): [number, number] => {
    const b0 = (1 - w) * (1 - w);
    const b1 = 2 * w * (1 - w);
    const b2 = w * w;
    return [b0 * p0[0] + b1 * c[0] + b2 * q[0], b0 * p0[1] + b1 * c[1] + b2 * q[1]];
  };
  // arc length of the curve (8 chords is plenty here)
  const N = 8;
  const cum = [0];
  let prev = bez(0);
  for (let i = 1; i <= N; i++) {
    const p = bez(i / N);
    cum.push(cum[i - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]));
    prev = p;
  }
  const L1 = cum[N];
  const L = L1 + PRE_DOCK;
  const sq = L1 / L;
  const at = (sPath: number): [number, number] => {
    if (sPath >= sq) {
      const w = (sPath - sq) / Math.max(1e-6, 1 - sq);
      return [q[0] + (docked.x - q[0]) * w, q[1] + (docked.y - q[1]) * w];
    }
    const target = sPath * L;
    let i = 1;
    while (i < N && cum[i] < target) i++;
    const w = (i - 1 + (target - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])) / N;
    return bez(w);
  };
  return { at, sq, L };
};

/**
 * Pose of an n-ring chain docked in enzyme pose e (its two end rings inside the pocket).
 * The chain is symmetric, so it can dock either way round: `rot` is e.rot or e.rot + 180,
 * whichever is closer to how the chain was already lying (so it never has to spin round).
 */
export const dockedPose = (e: Pose, n: number, rot = e.rot, back = 0, s = MOL_S): Pose => {
  const cxLocal = (DOCK.inner[0] - (SPACING * (n - 1)) / 2 - back) * s;
  const [ox, oy] = rotV(cxLocal, 0, e.rot);
  return { x: e.x + ox, y: e.y + oy, rot };
};

/** Where the bond at the pocket mouth is (the one that's cut), in world space. */
export const mouthPoint = (e: Pose, s = MOL_S): [number, number] => {
  const [ox, oy] = rotV(DOCK.cut[0] * s, 0, e.rot);
  return [e.x + ox, e.y + oy];
};

// ------------------------------------------------------------------ collisions
export type EvKind = "dock" | "bounce";
export type Ev = {
  readonly kind: EvKind;
  readonly at: number; // contact frame (absolute)
  readonly e: number;
  readonly s: number;
  readonly A: number; // approach frames
  readonly hold: number; // dock: frames in the pocket before the snip
  readonly energy: number; // 0..1+ (sets the flash size)
  readonly rotD: number; // dock: chain angle once docked (e.rot or e.rot + 180, fixed at planning time)
  readonly n: number; // rings on the chain when this collision happens
  readonly ret: number; // frames to drift back into the crowd afterwards (longer when it has further to go)
};

/** Typical drift speed of a molecule heading for a collision (world px / frame), by temperature. */
const travelSpeed = (T: number) => 2.0 + 0.16 * T;
const energyOf = (T: number) => 0.35 + (T / 37) * 0.65;
const holdOf = (T: number) => Math.round(lerp(24, 9, clamp01((T - 10) / 27)));
const REL = 26; // minimum frames for the remainder to get clear after a snip
const BOUNCE_OUT = 18; // minimum frames to rebound after a bump
/** Maltose leaving the lens: products and fully digested chains fade after this long. */
const PRODUCT_LIFE = 52;
const PRODUCT_FADE = 28;
/** A fresh starch chain starts drifting into view this long after the old maltose has gone (negative = while it fades). */
const RESPAWN_GAP = -PRODUCT_FADE;
const RESPAWN_IN = 24;
/** The farthest a substrate travels to make a collision (world px): no "magnetic" darting. */
const MAX_TRAVEL = 380;
/** How far in front of the active site (world px) a substrate lines up before sliding in end-on. */
const PRE_DOCK = 130;

type Plan = { at: number; kind: EvKind; e?: number; s?: number; hold?: number; A?: number; shift?: number };

/** From this frame on, S10 shows a fresh sample: earlier reactions (and denaturing) are forgotten. */
export const RESET = O10 + K10.coldA;

const PLAN: Plan[] = (() => {
  const k = K8;
  const p8 = (f: number, kind: EvKind, shift = 10): Plan => ({ at: O8 + f, kind, shift });
  const p9 = (f: number): Plan => ({ at: O9 + f, kind: "bounce", shift: 8 });
  const p10 = (f: number, kind: EvKind, shift = 10): Plan => ({ at: O10 + f, kind, shift });
  const lensDocks = [8, 40, 66, 88, 110, 132, 154, 178, 202, 226, 250, 274, 298].map((d) => k.traceA + d).filter((f) => f < k.end - 10);
  const lensBumps = [24, 78, 120, 166, 214, 262].map((d) => k.traceA + d).filter((f) => f < k.end - 6);
  return [
    // S08 — cold: rare, gentle bumps
    p8(k.jiggle + 40, "bounce", 14),
    p8(k.heatA + 46, "bounce", 14),
    // "bump into each other more often, and with more energy"
    p8(k.collide + 12, "bounce", 6),
    p8(k.bump, "bounce", 6),
    p8(k.often - 8, "bounce", 6),
    p8(k.often + 8, "bounce", 6),
    p8(k.energy, "bounce", 6),
    // the first successful collision, in full view: lands in the active site on "landing"
    { at: O8 + k.heroDock, kind: "dock" as const, e: 0, s: 0, hold: k.heroSnip - k.heroDock, A: k.heroDock - k.heroApproach },
    // "More enzyme–substrate complexes form"
    p8(k.complexWord - 6, "dock", 8),
    p8(k.complexWord + 16, "dock", 8),
    p8(k.heroDock + 22, "bounce", 8),
    // the lens: reactions get more frequent as it warms to 37 °C
    ...lensDocks.map((f) => p8(f, "dock", 12)),
    ...lensBumps.map((f) => p8(f, "bounce", 10)),
    // S09 — hotter and hotter: only bumps (we don't give the answer away)
    ...[K9.creepA + 10, K9.t50 + 6, K9.t50 + 22, K9.t60 + 4, K9.t60 + 16, K9.t70 + 4, K9.t70 + 16, K9.question + 4, K9.question + 22, K9.question + 40, K9.pauseNow - 14].map(p9),
    // S10 — denatured: starch keeps bouncing off misshapen active sites
    ...[K10.penA, K10.penA + 18, K10.penMid + 8, K10.penB - 2, K10.coolA + 6, K10.coolA + 32].map((f) => p10(f, "bounce", 8)),
    // S10 — a fresh sample, cooled: fewer, gentler collisions… but it still works
    p10(K10.coldCoolA + 30, "bounce", 10),
    p10(K10.fewerBump, "bounce", 6),
    p10(K10.coldDock, "dock", 6),
    { at: O10 + K10.siteDock, kind: "dock" as const, e: 0 },
    // …warm it up and the reactions come back
    { at: O10 + K10.reDock, kind: "dock" as const, hold: K10.reSnip - K10.reDock },
    p10(K10.reDock + 12, "dock", 4),
    p10(K10.reDock + 22, "dock", 4),
    p10(K10.reDock + 32, "dock", 3),
  ].sort((a, b) => a.at - b.at);
})();

type Respawn = { at: number };
type SlotItem = { kind: "ev"; ev: Ev } | { kind: "respawn"; at: number; fadeIn: boolean };

/** Assign each planned collision to an enzyme and a nearby substrate (deterministic). */
const PLANNED = (() => {
  const busyE: [number, number][][] = ENZ.map(() => []);
  const busyS: [number, number][][] = SUB.map(() => []);
  const nS = SUB.map(() => SUB_RINGS);
  const readyS = SUB.map(() => -Infinity);
  const respawns: Respawn[][] = SUB.map(() => []);
  const docksE = ENZ.map(() => 0); // spread the reactions over all four enzymes
  const usedE = ENZ.map(() => 0); // …and the bumps over all the pairs
  const usedS = SUB.map(() => 0);
  const events: Ev[] = [];
  const overlaps = (busy: [number, number][], a: number, b: number) => busy.some(([x, y]) => a < y && b > x);
  let resetDone = false;

  const windowOf = (kind: EvKind, at: number, A: number, hold: number, ret: number): [number, number] => [at - A - 2, at + hold + ret + 4];

  // Reserve hand-placed (enzyme AND substrate fixed) collisions first.
  for (const pl of PLAN) {
    if (pl.e === undefined || pl.s === undefined) continue;
    const T = tempAt(pl.at);
    const A = pl.A ?? 30;
    const hold = pl.hold ?? holdOf(T);
    const w = windowOf(pl.kind, pl.at, A, hold, 60);
    busyE[pl.e].push(w);
    busyS[pl.s].push(w);
  }

  /** Rings on chain s at frame t, from the docks planned so far (fresh chains after a respawn / RESET). */
  const ringsAt = (s: number, t: number) => {
    let n = SUB_RINGS;
    const items = [
      ...events.filter((ev) => ev.s === s && ev.kind === "dock").map((ev) => ({ t: ev.at + ev.hold + ev.ret, d: -2 })),
      ...respawns[s].map((r) => ({ t: r.at, d: 0 })),
      { t: RESET, d: 0 },
    ].sort((a, b) => a.t - b.t);
    for (const it of items) {
      if (it.t > t) break;
      n = it.d === 0 ? SUB_RINGS : n + it.d;
    }
    return n;
  };

  // Docks first (they matter most: they ARE the rate), then bumps fill in around them.
  for (const pl of [...PLAN.filter((x) => x.kind === "dock"), ...PLAN.filter((x) => x.kind === "bounce")]) {
    if (pl.kind === "dock" && pl.at >= RESET && !resetDone) {
      // a fresh sample: every chain is whole again, nothing is half-digested or fading
      resetDone = true;
      for (let i = 0; i < SUB.length; i++) {
        nS[i] = SUB_RINGS;
        readyS[i] = RESET;
      }
    }
    const fixed = pl.e !== undefined && pl.s !== undefined;
    const shifts = fixed ? [0] : [0, ...Array.from({ length: Math.floor((pl.shift ?? 0) / 2) }, (_, q) => [(q + 1) * 2, -(q + 1) * 2]).flat()];
    let best: { e: number; s: number; at: number; A: number; hold: number; rotD: number; ret: number; n: number; score: number } | null = null;
    for (const dt of shifts) {
      const at = pl.at + dt;
      if (at < RESET && pl.at >= RESET) continue;
      const T = tempAt(at);
      const es = pl.e !== undefined ? [pl.e] : ENZ.map((_, i) => i);
      const ss = pl.s !== undefined ? [pl.s] : SUB.map((_, i) => i);
      for (const e of es) {
        for (const s of ss) {
          const nNow = pl.kind === "dock" ? nS[s] : ringsAt(s, at);
          if (nNow < 4 && !fixed) continue; // only starch takes part (maltose is a product)
          const ep = freeEnzyme(e, at);
          // where the substrate starts from, and how far it has to go
          const guessA = 30;
          const s0 = freeSub(s, at - guessA);
          let travel: number;
          let rotD = ep.rot;
          if (pl.kind === "dock") {
            const pd = pocketDir(ep);
            const vx = s0.x - ep.x;
            const vy = s0.y - ep.y;
            const vl = Math.hypot(vx, vy) || 1;
            const facing = (vx * pd[0] + vy * pd[1]) / vl;
            if (!fixed && facing < 0.3) continue; // it has to arrive from in front of the active site
            travel = approachPath([s0.x, s0.y], ep, dockedPose(ep, nNow)).L;
            rotD = Math.abs(angDiff(s0.rot, ep.rot)) <= 90 ? ep.rot : ep.rot + 180;
          } else {
            const d = Math.hypot(s0.x - ep.x, s0.y - ep.y);
            travel = Math.max(0, d - (192 + 24) * MOL_S - 70);
          }
          if (!fixed && travel > (pl.kind === "dock" ? MAX_TRAVEL : 200)) continue;
          const A = pl.A ?? Math.round(Math.max(22, Math.min(72, (travel * 1.12) / travelSpeed(T) + 4)));
          const hold = pl.kind === "dock" ? pl.hold ?? holdOf(T) : 0;
          // the way back out is about as far as the way in (a bit less for a remainder backing out)
          const ret = Math.round(Math.max(pl.kind === "dock" ? REL : BOUNCE_OUT, Math.min(66, (travel * (pl.kind === "dock" ? 0.8 : 1)) / travelSpeed(T) + 10)));
          const [wa, wb] = windowOf(pl.kind, at, A, hold, ret);
          // the enzyme is only tied up while the substrate is close by (lining up, docked, backing out)
          const [ea, eb] = [at - Math.round(A * 0.45), at + hold + 18];
          if (!fixed) {
            if (overlaps(busyE[e], ea, eb) || overlaps(busyS[s], wa, wb)) continue;
            if (pl.kind === "dock" && readyS[s] > wa) continue;
            if (pl.at < RESET && wb > RESET) continue;
          }
          const score = travel + Math.abs(dt) * 6 + (pl.kind === "dock" ? (nNow < SUB_RINGS ? 40 : 0) + docksE[e] * 45 : usedS[s] * 30 + usedE[e] * 20);
          if (!best || score < best.score) best = { e, s, at, A, hold, rotD, ret, n: nNow, score };
        }
      }
    }
    if (!best) continue;
    const T = tempAt(best.at);
    const [wa, wb] = windowOf(pl.kind, best.at, best.A, best.hold, best.ret);
    if (!fixed) {
      busyE[best.e].push([best.at - Math.round(best.A * 0.45), best.at + best.hold + 18]);
      busyS[best.s].push([wa, wb]);
    }
    events.push({ kind: pl.kind, at: best.at, e: best.e, s: best.s, A: best.A, hold: best.hold, energy: energyOf(T), rotD: best.rotD, n: best.n, ret: best.ret });
    usedE[best.e]++;
    usedS[best.s]++;
    if (pl.kind === "dock") {
      docksE[best.e]++;
      nS[best.s] -= 2;
      if (nS[best.s] <= 2) {
        // fully digested: it glows (maltose), drifts out of view, and a fresh chain drifts in later
        const gone = best.at + best.hold + best.ret + PRODUCT_LIFE + PRODUCT_FADE;
        if (best.at >= RESET || gone + RESPAWN_GAP + RESPAWN_IN < RESET) {
          respawns[best.s].push({ at: gone + RESPAWN_GAP });
          nS[best.s] = SUB_RINGS;
          readyS[best.s] = gone + RESPAWN_GAP + RESPAWN_IN;
          busyS[best.s].push([wb, readyS[best.s]]); // nothing bumps into it while it's maltose / out of view
        } else {
          readyS[best.s] = Infinity; // stays gone until the fresh sample (RESET)
          busyS[best.s].push([wb, RESET]);
        }
      }
    }
  }
  events.sort((x, y) => x.at - y.at);
  const slots: SlotItem[][] = SUB.map((_, i) =>
    [
      ...events.filter((ev) => ev.s === i).map((ev): SlotItem => ({ kind: "ev", ev })),
      ...respawns[i].map((r): SlotItem => ({ kind: "respawn", at: r.at, fadeIn: true })),
      { kind: "respawn", at: RESET, fadeIn: false } as SlotItem,
    ].sort((a, b) => (a.kind === "ev" ? a.ev.at - a.ev.A : a.at) - (b.kind === "ev" ? b.ev.at - b.ev.A : b.at)),
  );
  return { events, slots };
})();

export const EVENTS: Ev[] = PLANNED.events;
const SLOTS = PLANNED.slots;
const EV_BY_ENZ: Ev[][] = ENZ.map((_, i) => EVENTS.filter((e) => e.e === i));
export const DOCKS = EVENTS.filter((e) => e.kind === "dock");
export const BOUNCES = EVENTS.filter((e) => e.kind === "bounce");

/** Enzyme pose (no jiggle) including a small recoil when something hits it. */
export const enzymePose = (i: number, abs: number): Pose => {
  const p = freeEnzyme(i, abs);
  let dx = 0;
  let dy = 0;
  for (const ev of EV_BY_ENZ[i]) {
    if (ev.kind !== "bounce" || abs < ev.at || abs > ev.at + 16) continue;
    const s = freeSub(ev.s, ev.at);
    const d = Math.hypot(p.x - s.x, p.y - s.y) || 1;
    const k = Math.sin(((abs - ev.at) / 16) * Math.PI) * 6 * ev.energy;
    dx += ((p.x - s.x) / d) * k;
    dy += ((p.y - s.y) / d) * k;
  }
  return { x: p.x + dx, y: p.y + dy, rot: p.rot };
};

export type SubState = {
  /** Rigid pose of the chain (rings are laid out from it). */
  pose: Pose;
  n: number;
  rings: RingXY[];
  /** Index of the link that is breaking (-1 = none) and how far (0..1). */
  breakLink: number;
  strain: number;
  /** 0..1 how much it is locked to an enzyme (it then shares that enzyme's jiggle). */
  lock: number;
  lockE: number;
  /** Remaining rings are maltose (after its last dock). */
  sweet: number;
  opacity: number;
};

const state = (pose: Pose, n: number, extra: Partial<SubState> = {}): SubState => ({
  pose,
  n,
  rings: layout(pose, n),
  breakLink: -1,
  strain: 0,
  lock: 0,
  lockE: 0,
  sweet: 0,
  opacity: 1,
  ...extra,
});

/** The rings that were outside the pocket, backing out of it just after the snip. */
const backedOut = (ev: Ev, abs: number): Pose => {
  const e = enzymePose(ev.e, abs);
  const rest = dockedPose(e, ev.n - 2, ev.rotD, 2 * SPACING);
  const back = ramp(abs, ev.at + ev.hold, ev.at + ev.hold + 8, EASE.out) * 34 * MOL_S;
  const pd = pocketDir(e);
  return { x: rest.x + pd[0] * back, y: rest.y + pd[1] * back, rot: rest.rot };
};

/** A remainder that is down to maltose: it backs out and keeps drifting slowly away (then fades). */
const maltoseDrift = (ev: Ev, abs: number): Pose => {
  const snip = ev.at + ev.hold;
  const e0 = enzymePose(ev.e, snip);
  const b = backedOut(ev, Math.min(abs, snip + 8));
  const pd = pocketDir(e0);
  const away = ramp(abs, snip + 4, snip + 70, EASE.out) * 90;
  const p = wanderAt(abs) - wanderAt(snip);
  const seed = `r${ev.at}`;
  return {
    x: b.x + pd[0] * away + (noise2D(`${seed}x`, p * 0.9, 0) - noise2D(`${seed}x`, 0, 0)) * 60,
    y: b.y + pd[1] * away + (noise2D(`${seed}y`, p * 0.9, 4) - noise2D(`${seed}y`, 0, 4)) * 50,
    rot: b.rot + (noise2D(`${seed}r`, p * 0.6, 7) - noise2D(`${seed}r`, 0, 7)) * 30,
  };
};

/** Where substrate i is (and how many rings it has) at this moment, including any collision. */
export const substrateState = (i: number, abs: number): SubState => {
  let n = SUB_RINGS;
  let sweetAt: number | null = null;
  let bornAt: number | null = null;
  for (const it of SLOTS[i]) {
    if (it.kind === "respawn") {
      if (abs < it.at) break;
      n = SUB_RINGS;
      sweetAt = null;
      bornAt = it.fadeIn ? it.at : null;
      continue;
    }
    const ev = it.ev;
    if (abs < ev.at - ev.A) break;
    n = ev.n;
    const freeP = freeSub(i, abs);
    const fadeIn = bornAt !== null ? ramp(abs, bornAt, bornAt + RESPAWN_IN, EASE.out) : 1;
    if (ev.kind === "bounce") {
      if (abs > ev.at + ev.ret) continue;
      const e = enzymePose(ev.e, abs);
      const e0 = enzymePose(ev.e, ev.at);
      const s0 = freeSub(i, ev.at - ev.A);
      const dx = s0.x - e0.x;
      const dy = s0.y - e0.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d;
      const uy = dy / d;
      // turn part-way towards end-on, then sit the chain so its nearest ring just touches the enzyme
      const aligned = (Math.atan2(-uy, -ux) * 180) / Math.PI;
      const fr = freeSub(i, ev.at).rot;
      const alignedNear = Math.abs(angDiff(fr, aligned)) <= 90 ? aligned : aligned + 180;
      const rotC = lerpAngle(fr, alignedNear, 0.55);
      const dX = Math.cos(rad(rotC));
      const dY = Math.sin(rad(rotC));
      const halfL = ((n - 1) / 2) * SPACING * MOL_S;
      const reach = (192 + 24) * MOL_S + halfL * Math.abs(dX * ux + dY * uy);
      const contact: Pose = { x: e.x + ux * reach, y: e.y + uy * reach, rot: rotC };
      const w = abs <= ev.at ? ramp(abs, ev.at - ev.A, ev.at, smooth) : 1 - ramp(abs, ev.at, ev.at + ev.ret, EASE.inOut);
      const kick = abs > ev.at ? Math.sin(clamp01((abs - ev.at) / BOUNCE_OUT) * Math.PI) * 30 * ev.energy : 0;
      const p = lerpPose(freeP, contact, w);
      return state({ x: p.x + ux * kick, y: p.y + uy * kick, rot: p.rot }, n, { lockE: ev.e, opacity: fadeIn });
    }
    // dock
    const snip = ev.at + ev.hold;
    if (abs >= snip + ev.ret) {
      n -= 2;
      if (n <= 2) sweetAt = snip + ev.ret;
      continue;
    }
    const e = enzymePose(ev.e, abs);
    const docked = dockedPose(e, n, ev.rotD);
    // which link sits at the mouth depends on which way round the chain docked
    const mouthLink = Math.abs(angDiff(ev.rotD, e.rot)) < 90 ? n - 3 : 1;
    if (abs < ev.at) {
      // One smooth path at continuous speed: from where it was drifting, curving round to a point
      // in front of the active site (arriving along the pocket's axis), then sliding straight in end-on.
      const u = clamp01((abs - (ev.at - ev.A)) / ev.A);
      const path = approachPath([freeP.x, freeP.y], e, docked);
      const sPath = smooth(u);
      const [x, y] = path.at(sPath);
      const pose: Pose = { x, y, rot: lerpAngle(freeP.rot, ev.rotD, smooth(sPath / (path.sq * 0.9))) };
      return state(pose, n, { lock: ramp(sPath, path.sq - 0.15, path.sq + 0.05, EASE.inOut), lockE: ev.e, opacity: fadeIn });
    }
    if (abs < snip) {
      const strain = ramp(abs, snip - 8, snip, EASE.in);
      return state(docked, n, { breakLink: mouthLink, strain, lock: 1, lockE: ev.e, opacity: fadeIn });
    }
    // after the snip: the remainder (n − 2 rings) backs out of the pocket as one rigid piece,
    // then drifts back into the crowd (or, if it's down to maltose, drifts off and fades)
    const t = ramp(abs, snip + 6, snip + ev.ret, EASE.inOut);
    const pose = n - 2 <= 2 ? maltoseDrift(ev, abs) : lerpPose(backedOut(ev, abs), freeP, t);
    return state(pose, n - 2, {
      lock: 1 - ramp(abs, snip, snip + 10, EASE.out),
      lockE: ev.e,
      sweet: n - 2 <= 2 ? ramp(abs, snip, snip + 16, EASE.out) : 0,
      opacity: fadeIn,
    });
  }
  const lastDock = sweetAt !== null ? [...SLOTS[i]].reverse().find((it) => it.kind === "ev" && it.ev.kind === "dock" && it.ev.at < abs) : undefined;
  const freeP = lastDock && lastDock.kind === "ev" ? maltoseDrift(lastDock.ev, abs) : freeSub(i, abs);
  let opacity = bornAt !== null ? ramp(abs, bornAt, bornAt + RESPAWN_IN, EASE.out) : 1;
  if (sweetAt !== null) opacity *= 1 - ramp(abs, sweetAt + PRODUCT_LIFE, sweetAt + PRODUCT_LIFE + PRODUCT_FADE, EASE.in);
  return state(freeP, n, { sweet: sweetAt !== null ? 1 : 0, opacity });
};

/** Maltose released by a docking: leaves the pocket, drifts away, and fades out of the field of view. */
export const productState = (ev: Ev, abs: number) => {
  const snip = ev.at + ev.hold;
  if (abs < snip) return null;
  if (abs >= RESET && ev.at < RESET) return null; // fresh sample
  if (abs > snip + PRODUCT_LIFE + PRODUCT_FADE) return null;
  const e0 = enzymePose(ev.e, snip);
  // the two rings that were deep in the pocket
  const inPocket = dockedPose(e0, 2, ev.rotD);
  // exit: straight out of the mouth, then curving off to one side
  const side = ev.at % 2 === 0 ? 1 : -1;
  const out = ramp(abs, snip + 3, snip + 34, EASE.out);
  const [ax, ay] = rotV(-150 * MOL_S * out, side * 95 * MOL_S * out * out, e0.rot);
  const p = wanderAt(abs) - wanderAt(snip);
  const seed = `m${ev.at}`;
  const wx = noise2D(`${seed}x`, p * 0.9, 0) - noise2D(`${seed}x`, 0, 0);
  const wy = noise2D(`${seed}y`, p * 0.9, 4) - noise2D(`${seed}y`, 0, 4);
  // keep it inside the field of view while it is visible
  let x = inPocket.x + ax + wx * 90;
  let y = inPocket.y + ay + wy * 70;
  const dx = x - LENS_WC[0];
  const dy = y - LENS_WC[1];
  const dl = Math.hypot(dx, dy);
  if (dl > 560) {
    x = LENS_WC[0] + (dx / dl) * 560;
    y = LENS_WC[1] + (dy / dl) * 560;
  }
  // …and inside the 100 px safe area while the camera is still full-frame
  x = Math.max(140, Math.min(1780, x));
  y = Math.max(140, Math.min(940, y));
  const pose: Pose = { x, y, rot: ev.rotD + side * 18 * out + noise2D(`${seed}r`, p * 0.6, 7) * 40 };
  return {
    rings: layout(pose, 2),
    glow: ramp(abs, snip, snip + 14, EASE.out),
    opacity: 1 - ramp(abs, snip + PRODUCT_LIFE, snip + PRODUCT_LIFE + PRODUCT_FADE, EASE.in),
    seed,
    born: snip,
  };
};

/** Flash for every contact: where, how big, how far through (0..1). */
export const flashes = (abs: number) =>
  EVENTS.flatMap((ev) => {
    const out: { x: number; y: number; p: number; kind: "bump" | "dock" | "snip"; energy: number }[] = [];
    const span = 14;
    if (ev.kind === "bounce" && abs >= ev.at && abs < ev.at + span) {
      const e = enzymePose(ev.e, ev.at);
      const s0 = freeSub(ev.s, ev.at - ev.A);
      const d = Math.hypot(s0.x - e.x, s0.y - e.y) || 1;
      const r = 192 * MOL_S;
      out.push({ x: e.x + ((s0.x - e.x) / d) * r, y: e.y + ((s0.y - e.y) / d) * r, p: (abs - ev.at) / span, kind: "bump", energy: ev.energy });
    }
    if (ev.kind === "dock") {
      if (abs >= ev.at && abs < ev.at + span) {
        const [x, y] = mouthPoint(enzymePose(ev.e, ev.at));
        out.push({ x, y, p: (abs - ev.at) / span, kind: "dock", energy: ev.energy });
      }
      const snip = ev.at + ev.hold;
      if (abs >= snip && abs < snip + span) {
        const [x, y] = mouthPoint(enzymePose(ev.e, snip));
        out.push({ x, y, p: (abs - snip) / span, kind: "snip", energy: ev.energy });
      }
    }
    return out;
  });

/** Small "bump" the enzyme gives when a substrate nests or a bond snaps. */
export const enzymeSettle = (i: number, abs: number) =>
  EV_BY_ENZ[i].reduce((acc, ev) => {
    if (ev.kind !== "dock") return acc;
    const a = (abs - ev.at + 2) / 12;
    const b = (abs - ev.at - ev.hold) / 8;
    return acc + (a > 0 && a < 1 ? 0.03 * Math.sin(a * Math.PI) : 0) - (b > 0 && b < 1 ? 0.02 * Math.sin(b * Math.PI) : 0);
  }, 0);

/** Successful reactions so far (for the graph dot pulse). */
export const snipsBefore = (abs: number) => DOCKS.filter((d) => d.at + d.hold <= abs).map((d) => d.at + d.hold);
