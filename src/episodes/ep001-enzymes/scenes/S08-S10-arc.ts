/**
 * The temperature arc (S08 → S09 → S10) as ONE continuous model, in absolute episode frames:
 *  - the thermometer reading over time,
 *  - the integrated "thermal phase" that drives every molecule's motion (so speeding up or
 *    slowing down never makes anything jump, and the molecules carry on seamlessly across cuts),
 *  - the scripted collisions between enzymes and substrates (bumps and successful dockings).
 * Every scene in the arc reads from here, so the three scenes behave like one shot.
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
  [O10 + K10.coolA, 70],
  [O10 + K10.coolB, 37, EASE.inOut],
  [O10 + K10.heatA, 37],
  [O10 + K10.heatB, 70, EASE.inOut],
  [O10 + K10.chillA, 70],
  [O10 + K10.chillB, 5, EASE.inOut],
  [O10 + K10.rewarmA, 5],
  [O10 + K10.rewarmB, 37, EASE.inOut],
];
export const tempAt = (abs: number) => track(abs, TEMP);

// ------------------------------------------------------------------ integrated motion phases
/** Wander speed: how fast molecules drift around, by temperature (exaggerated so it reads). */
const wanderSpeed = (T: number) => 0.0032 + 0.00042 * T;
/** Jiggle frequency rises with temperature too (the Enzyme component does the same). */
const jiggleSpeed = (T: number) => 0.03 + thermalAmplitude(T) * 0.004;

const A0 = O8 - 160;
const A1 = SC10.endFrame + 120;
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
export const WORLD_C = [1150, 540] as const;
export const SUB_RINGS = 6;

export type Pose = { x: number; y: number; rot: number };

/** Four amylase molecules. rot = which way the active site faces (0 = left). */
export const ENZ = [
  { hx: 930, hy: 440, rot: 0, R: 34 },
  { hx: 1500, hy: 300, rot: 168, R: 44 },
  { hx: 1090, hy: 820, rot: -24, R: 44 },
  { hx: 1580, hy: 760, rot: 205, R: 44 },
] as const;

/** Starch fragments (6 glucose rings each), spaced so they rarely cross, all inside the lens's view. */
export const SUB = [
  { hx: 575, hy: 470, rot: 4, R: 46 },
  { hx: 1170, hy: 190, rot: -12, R: 60 },
  { hx: 1260, hy: 540, rot: 38, R: 56 },
  { hx: 650, hy: 790, rot: -28, R: 56 },
  { hx: 1350, hy: 960, rot: 8, R: 50 },
  { hx: 1790, hy: 520, rot: 82, R: 50 },
  { hx: 740, hy: 170, rot: 16, R: 56 },
  { hx: 1680, hy: 120, rot: -30, R: 46 },
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
    const x = WORLD_C[0] + (r() - 0.5) * 1300;
    const y = WORLD_C[1] + (r() - 0.5) * 1300;
    if (Math.hypot(x - WORLD_C[0], (y - WORLD_C[1]) * 1.0) > 640) continue;
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

const freeSub = (i: number, abs: number): Pose => {
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
const lerpAngle = (a: number, b: number, t: number) => {
  let d = ((b - a + 540) % 360) - 180;
  if (d < -180) d += 360;
  return a + d * t;
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ramp = (f: number, a: number, b: number, ease: (t: number) => number = EASE.inOut) => ease(clamp01((f - a) / Math.max(1, b - a)));

export type RingXY = { x: number; y: number; rot: number };

/** n rings laid along a pose's axis (ring n-1 at the +x end). */
export const layout = (p: Pose, n: number, s = MOL_S): RingXY[] =>
  Array.from({ length: n }, (_, j) => {
    const [ox, oy] = rotV((j - (n - 1) / 2) * SPACING * s, 0, p.rot);
    return { x: p.x + ox, y: p.y + oy, rot: p.rot };
  });

/** Pose of an n-ring chain docked in enzyme pose e (its last two rings inside the pocket). */
export const dockedPose = (e: Pose, n: number, back = 0, s = MOL_S): Pose => {
  const cxLocal = (DOCK.inner[0] - (SPACING * (n - 1)) / 2 - back) * s;
  const [ox, oy] = rotV(cxLocal, 0, e.rot);
  return { x: e.x + ox, y: e.y + oy, rot: e.rot };
};

/** Where the bond at the pocket mouth is (the one that's cut), in world space. */
export const mouthPoint = (e: Pose, s = MOL_S): [number, number] => {
  const [ox, oy] = rotV(DOCK.cut[0] * s, 0, e.rot);
  return [e.x + ox, e.y + oy];
};

const lerpRings = (a: RingXY[], b: RingXY[], t: number): RingXY[] =>
  a.map((r, i) => ({ x: lerp(r.x, b[i].x, t), y: lerp(r.y, b[i].y, t), rot: lerpAngle(r.rot, b[i].rot, t) }));

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
};

/** Approach time shrinks as things heat up (they move faster). */
const approachFrames = (T: number) => Math.round(lerp(30, 14, clamp01((T - 10) / 60)));
const energyOf = (T: number) => 0.35 + (T / 37) * 0.65;
const REL = 26; // frames for a product/remainder to get clear after a snip
const BOUNCE_OUT = 18;

type Plan = { at: number; kind: EvKind; e?: number; s?: number; hold?: number; A?: number };

const PLAN: Plan[] = (() => {
  const p8 = (f: number, kind: EvKind, e?: number, s?: number, hold?: number, A?: number): Plan => ({ at: O8 + f, kind, e, s, hold, A });
  const p9 = (f: number, kind: EvKind): Plan => ({ at: O9 + f, kind });
  const p10 = (f: number, kind: EvKind, hold?: number): Plan => ({ at: O10 + f, kind, hold });
  const k = K8;
  const lensDocks = [k.traceA + 4, k.traceB + 14, k.riseA + 10, k.warmer + 8, k.riseA + 50, k.riseB - 2, k.optimum + 16, k.optimum + 36, k.peak - 8, k.peak + 14, k.optWord + 18, k.optWord + 40, k.optWord + 64, k.deg - 30, k.deg + 2, k.deg + 22, k.body - 6, k.body + 14, k.end - 2];
  const lensBumps = [k.traceA + 22, k.riseA - 6, k.warmer + 24, k.optimum + 4, k.peak + 2, k.optWord + 30, k.deg - 12, k.deg + 12, k.body + 4];
  return [
    // S08 — cold: rare, gentle bumps
    p8(k.jiggle + 40, "bounce"),
    p8(k.heatA + 46, "bounce"),
    // "bump into each other more often, and with more energy"
    p8(k.collide + 10, "bounce"),
    p8(k.bump, "bounce"),
    p8(k.often - 8, "bounce"),
    p8(k.often + 6, "bounce"),
    p8(k.energy, "bounce"),
    // the first successful collision, in full view: lands in the active site on "lands"
    p8(k.heroDock, "dock", 0, 0, k.heroSnip - k.heroDock, k.heroDock - k.heroApproach),
    // "…mean more enzyme–substrate complexes"
    p8(k.complexWord - 8, "dock"),
    p8(k.complexWord + 14, "dock"),
    p8(k.heroDock + 20, "bounce"),
    ...lensDocks.map((f) => p8(f, "dock")),
    ...lensBumps.map((f) => p8(f, "bounce")),
    // S09 — hotter and hotter: only bumps (we don't give the answer away)
    ...[K9.creepA + 10, K9.t50 + 6, K9.t50 + 22, K9.t60 + 4, K9.t60 + 16, K9.t70 + 4, K9.t70 + 14, K9.question + 4, K9.question + 20, K9.question + 40, K9.pauseNow - 14].map((f) => p9(f, "bounce")),
    // S10 — denatured: substrates keep bouncing off
    ...[K10.plungeA - 10, K10.plungeA + 8, K10.plungeA + 26, K10.plungeB - 4, K10.coolA + 4, K10.coolA + 30].map((f) => p10(f, "bounce")),
    // S10 — a fresh sample, cold: few, gentle collisions…
    ...[K10.backA + 40, K10.fewer + 6, K10.isnt + 30].map((f) => p10(f, "bounce")),
    // …warm it up and it works again
    p10(K10.reDock, "dock", K10.reSnip - K10.reDock),
    ...[K10.reDock + 8, K10.reDock + 16, K10.reDock + 24].map((f) => p10(f, "dock")),
  ].sort((a, b) => a.at - b.at);
})();

/** From this frame on, S10 shows a fresh sample: earlier reactions (and denaturing) are forgotten. */
export const RESET = O10 + K10.coldA;

/** Assign each planned collision to a free enzyme and the nearest free substrate (deterministic). */
export const EVENTS: Ev[] = (() => {
  const busyE: number[][] = ENZ.map(() => []);
  const busyS: number[][] = SUB.map(() => []);
  const docksDone = SUB.map(() => 0);
  const out: Ev[] = [];
  const free = (busy: number[], a: number, b: number) => busy.every((x, i) => i % 2 === 1 || !(a < busy[i + 1] && b > x));
  // Fixed (hand-placed) collisions first, so nothing else takes their molecules.
  let resetDone = false;
  for (const pl of [...PLAN.filter((x) => x.e !== undefined), ...PLAN.filter((x) => x.e === undefined)]) {
    if (pl.e === undefined && pl.at >= RESET && !resetDone) {
      docksDone.fill(0);
      resetDone = true;
    }
    const T = tempAt(pl.at);
    const A = pl.A ?? approachFrames(T);
    const hold = pl.kind === "dock" ? pl.hold ?? Math.round(lerp(16, 9, clamp01((T - 20) / 20))) : 0;
    const a = pl.at - A - 2;
    const b = pl.at + (pl.kind === "dock" ? hold + REL + 4 : BOUNCE_OUT + 4);
    let best: { e: number; s: number; d: number } | null = null;
    const es = pl.e !== undefined ? [pl.e] : ENZ.map((_, i) => i);
    for (const e of es) {
      if (!free(busyE[e], a, b)) continue;
      const ep = freeEnzyme(e, pl.at);
      const ss = pl.s !== undefined ? [pl.s] : SUB.map((_, i) => i);
      for (const s of ss) {
        if (!free(busyS[s], a, b)) continue;
        if (pl.kind === "dock" && docksDone[s] >= 2) continue;
        const sp = freeSub(s, pl.at);
        const raw = Math.hypot(sp.x - ep.x, sp.y - ep.y);
        if (raw > 470 && pl.s === undefined) continue; // too far away to arrive believably
        const d = raw + (pl.kind === "dock" ? docksDone[s] * 60 : 0);
        if (!best || d < best.d) best = { e, s, d };
      }
    }
    if (!best) continue;
    busyE[best.e].push(a, b);
    busyS[best.s].push(a, b);
    if (pl.kind === "dock") docksDone[best.s]++;
    out.push({ kind: pl.kind, at: pl.at, e: best.e, s: best.s, A, hold, energy: energyOf(T), d: Math.round(best.d) } as Ev);
  }
  return out.sort((x, y) => x.at - y.at);
})();

const EV_BY_SUB: Ev[][] = SUB.map((_, i) => EVENTS.filter((e) => e.s === i));
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
  rings: RingXY[];
  /** Index of the link that is breaking (-1 = none) and how far (0..1). */
  breakLink: number;
  broken: number;
  strain: number;
  /** 0..1 how much it is locked to an enzyme (it then shares that enzyme's jiggle). */
  lock: number;
  lockE: number;
  /** Remaining rings are maltose (after its second dock). */
  sweet: number;
};

/** Where substrate i is (and how many rings it has) at this moment, including any collision. */
export const substrateState = (i: number, abs: number): SubState => {
  let n = SUB_RINGS;
  let sweet = 0;
  for (const ev of EV_BY_SUB[i]) {
    if (abs >= RESET && ev.at < RESET) continue; // fresh sample
    if (abs < ev.at - ev.A) break;
    const e = enzymePose(ev.e, abs);
    const freeP = freeSub(i, abs);
    if (ev.kind === "bounce") {
      if (abs > ev.at + BOUNCE_OUT) continue;
      const e0 = enzymePose(ev.e, ev.at);
      const s0 = freeSub(i, ev.at - ev.A);
      const dx = s0.x - e0.x;
      const dy = s0.y - e0.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d;
      const uy = dy / d;
      // turn part-way towards end-on, then sit the chain so its nearest ring just touches the enzyme
      const aligned = (Math.atan2(-uy, -ux) * 180) / Math.PI;
      const rotC = lerpAngle(freeSub(i, ev.at).rot, aligned, 0.55);
      const dX = Math.cos(rad(rotC));
      const dY = Math.sin(rad(rotC));
      const halfL = (((n - 1) / 2) * SPACING) * MOL_S;
      const reach = (192 + 24) * MOL_S + halfL * Math.abs(dX * ux + dY * uy);
      const contact: Pose = { x: e.x + ux * reach, y: e.y + uy * reach, rot: rotC };
      const w =
        abs <= ev.at ? ramp(abs, ev.at - ev.A, ev.at, EASE.in) : 1 - ramp(abs, ev.at, ev.at + BOUNCE_OUT, EASE.out);
      const rw = abs <= ev.at ? ramp(abs, ev.at - ev.A, ev.at, EASE.inOut) : 1 - ramp(abs, ev.at, ev.at + BOUNCE_OUT, EASE.inOut);
      const kick = abs > ev.at ? Math.sin(clamp01((abs - ev.at) / BOUNCE_OUT) * Math.PI) * 40 * ev.energy : 0;
      const pose: Pose = {
        x: lerp(freeP.x, contact.x, w) + ux * kick,
        y: lerp(freeP.y, contact.y, w) + uy * kick,
        rot: lerpAngle(freeP.rot, contact.rot, rw),
      };
      return { rings: layout(pose, n), breakLink: -1, broken: 0, strain: 0, lock: 0, lockE: ev.e, sweet };
    }
    // dock
    const snip = ev.at + ev.hold;
    if (abs >= snip + REL) {
      n -= 2;
      if (n <= 2) sweet = 1;
      continue;
    }
    const docked = dockedPose(e, n);
    if (abs < ev.at) {
      const near = dockedPose(e, n, 70);
      const mid = ev.at - Math.round(ev.A * 0.38);
      const p =
        abs < mid
          ? (() => {
              const t = ramp(abs, ev.at - ev.A, mid, EASE.inOut);
              return { x: lerp(freeP.x, near.x, t), y: lerp(freeP.y, near.y, t), rot: lerpAngle(freeP.rot, near.rot, t) };
            })()
          : (() => {
              const t = ramp(abs, mid, ev.at, EASE.out);
              return { x: lerp(near.x, docked.x, t), y: lerp(near.y, docked.y, t), rot: near.rot };
            })();
      return { rings: layout(p, n), breakLink: -1, broken: 0, strain: 0, lock: ramp(abs, mid, ev.at, EASE.out), lockE: ev.e, sweet };
    }
    if (abs < snip) {
      const strain = ramp(abs, snip - 8, snip, EASE.in);
      return { rings: layout(docked, n), breakLink: n - 3, broken: 0, strain, lock: 1, lockE: ev.e, sweet };
    }
    // after the snip: the remainder backs out of the pocket, then drifts back into the crowd
    const rest = layout(docked, n).slice(0, n - 2);
    const back = ramp(abs, snip, snip + 8, EASE.snap) * 34 * MOL_S;
    const [bx, by] = rotV(-back, 0, e.rot);
    const recoiled = rest.map((r) => ({ ...r, x: r.x + bx, y: r.y + by }));
    const target = layout(freeP, n - 2);
    const t = ramp(abs, snip + 6, snip + REL, EASE.inOut);
    return {
      rings: lerpRings(recoiled, target, t),
      breakLink: -1,
      broken: 0,
      strain: 0,
      lock: 1 - ramp(abs, snip, snip + 10, EASE.out),
      lockE: ev.e,
      sweet: n - 2 <= 2 ? ramp(abs, snip, snip + 16, EASE.out) : 0,
    };
  }
  return { rings: layout(freeSub(i, abs), n), breakLink: -1, broken: 0, strain: 0, lock: 0, lockE: 0, sweet };
};

/** Maltose released by a docking: leaves the pocket, then wanders off in the crowd. */
export const productState = (ev: Ev, abs: number) => {
  const snip = ev.at + ev.hold;
  if (abs < snip) return null;
  if (abs >= RESET && ev.at < RESET) return null; // fresh sample
  const e0 = enzymePose(ev.e, snip);
  const nAtDock = SUB_RINGS - 2 * DOCKS.filter((d) => d.s === ev.s && d.at < ev.at && (ev.at < RESET || d.at >= RESET)).length;
  const docked = layout(dockedPose(e0, nAtDock), nAtDock).slice(nAtDock - 2);
  const c0x = (docked[0].x + docked[1].x) / 2;
  const c0y = (docked[0].y + docked[1].y) / 2;
  // exit: out of the mouth and to one side
  const side = ev.at % 2 === 0 ? 1 : -1;
  const out = ramp(abs, snip + 2, snip + 30, EASE.out);
  const [ax, ay] = rotV(-120 * MOL_S * out, side * 150 * MOL_S * out, e0.rot);
  const p = wanderAt(abs) - wanderAt(snip);
  const seed = `m${ev.at}`;
  const wx = noise2D(`${seed}x`, p * 0.9, 0) - noise2D(`${seed}x`, 0, 0);
  const wy = noise2D(`${seed}y`, p * 0.9, 4) - noise2D(`${seed}y`, 0, 4);
  const pose: Pose = {
    x: c0x + ax + wx * 170,
    y: c0y + ay + wy * 140,
    rot: e0.rot + side * 18 * out + noise2D(`${seed}r`, p * 0.6, 7) * 40,
  };
  return { rings: layout(pose, 2), glow: ramp(abs, snip, snip + 14, EASE.out), seed, born: snip };
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
