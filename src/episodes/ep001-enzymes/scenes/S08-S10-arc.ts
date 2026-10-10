/**
 * The temperature arc (S08 → S09 → S10) as ONE continuous model, in absolute episode frames:
 *  - the thermometer reading over time,
 *  - the integrated "thermal phase" that drives every molecule's motion (so speeding up or
 *    slowing down never makes anything jump, and the molecules carry on seamlessly across cuts),
 *  - the scripted collisions between enzymes and substrates (bumps and successful dockings).
 * Every scene in the arc reads from here, so the three scenes behave like one shot.
 *
 * Motion rules this model enforces (each one is measured by the QA scripts):
 *  - Chains are always laid out from a rigid pose (centre + angle): links never shrink or fold.
 *  - Molecules never pass through each other: free chains are gently pushed clear of enzymes and of
 *    each other (precomputed per frame), approaches are checked against everything on the way, and
 *    each maltose's way out is planned so it stays clear of the chains around it.
 *  - Nothing "homes in". A collision is only planned between partners that are already close and
 *    roughly facing each other, and the approach is clocked by the same thermal phase as the drift:
 *    it cruises at about twice the crowd's own drift speed at that temperature, so a cold approach
 *    is slow and a warm one is quicker — kinetic energy, not magnetism.
 *  - After a snip the leftover chain backs out and steps well aside BEFORE the maltose leaves the
 *    pocket, and it only drifts back once the maltose is on its way: a product never slides through
 *    its own leftover chain.
 *  - A chain cut down to maltose leaves its last two rings as their own item that drifts off and fades
 *    (never vanishing at full opacity). Its slot then gets a fresh starch chain that drifts in from
 *    beyond the edge of the field of view, fading in as it comes (never popping up in place): the lens
 *    is a small window on a solution full of starch.
 *  - Successful reactions only happen where the curve says the rate is real (≤ ~41 °C on the way up;
 *    never at intact active sites at high temperature). Above that, S09 rack-focuses away from the
 *    lens (no claim while the question is open), and in S10 starch only bounces off active sites
 *    that have visibly lost their shape.
 */
import { noise2D } from "./S08-S10-noise";
import { EASE } from "../../../brand/tokens";
import { cueFns } from "../../../lib/cues";
import { thermalAmplitude } from "../../../lib/motion";
import { track, type Key } from "../../../lib/track";
import { DOCK, ENZYME_REST, HEX_R, LIP_BOT, SPACING } from "../../../components/molecule-geometry";
import { distToPolygon, pointInPolygon, type Pt } from "../../../lib/geometry";
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

// ------------------------------------------------------------------ the lens's focus (S09 → S10)
/**
 * Past ~45 °C the outcome is the open question, so S09 rack-focuses away from the lens (the molecules
 * still visibly shake harder, but no collision is readable); S10 pulls focus back during the reveal,
 * as the enzymes visibly lose their shape. 0 = sharp, 1 = fully soft.
 */
const LENS_SOFT_A = O9 + K9.t50 - 6;
const LENS_SOFT_B = O9 + K9.t50 + 18;
// (it sharpens while its enzymes visibly lose their shape — S10 denatures them from penA + 6 to penB + 6)
const LENS_SHARP_A = O10 + K10.penA + 8;
const LENS_SHARP_B = O10 + K10.penB;
/** How far the lens is out of focus (0 = sharp, 1 = fully soft): S09 past ~45 °C until the S10 reveal. */
export const lensSoftAt = (abs: number) => {
  const e = (a: number, b: number) => EASE.inOut(Math.max(0, Math.min(1, (abs - a) / (b - a))));
  return e(LENS_SOFT_A, LENS_SOFT_B) * (1 - e(LENS_SHARP_A, LENS_SHARP_B));
};

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
/** The (fractional) frame at which the wander phase reaches w — the inverse of wanderAt. */
const wanderInv = (w: number) => {
  if (w <= WANDER[0]) return A0;
  let lo = 0;
  let hi = WANDER.length - 1;
  if (w >= WANDER[hi]) return A0 + hi;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (WANDER[mid] < w) lo = mid;
    else hi = mid;
  }
  return A0 + lo + (w - WANDER[lo]) / Math.max(1e-12, WANDER[hi] - WANDER[lo]);
};

/** World px a free substrate drifts, on average, per unit of wander phase (measured ≈ 80 at every temperature). */
const DRIFT_PER_PHASE = 80;
/** Mean drift speed of a free substrate at T (world px / frame). */
export const driftSpeed = (T: number) => DRIFT_PER_PHASE * wanderSpeed(T);
/** Frame at which to start covering `dist` world px at `k` × the drift speed so as to arrive at `end`. */
const startFor = (end: number, dist: number, k: number) => wanderInv(wanderAt(end) - dist / (DRIFT_PER_PHASE * k));
/** Progress (0..1) from frame a to frame b, measured in thermal phase (so it slows down when it's cold). */
const phaseU = (a: number, b: number, abs: number) => clamp01((wanderAt(abs) - wanderAt(a)) / Math.max(1e-9, wanderAt(b) - wanderAt(a)));

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
  { hx: 1440, hy: 250, rot: -15, R: 36 },
  { hx: 1170, hy: 705, rot: -20, R: 36 },
  { hx: 1600, hy: 650, rot: 90, R: 32 },
] as const;

/**
 * Starch fragments (6 glucose rings each), spaced so they rarely cross. Most of them lie a short drift
 * in front of an active site, roughly along its axis (s0, s6 → enzyme 0; s1, s2 → 1; s3 → 2; s7, s2 → 3),
 * so a successful collision never needs a long, purposeful-looking trip; s4 and s5 only ever bump.
 */
export const SUB = [
  { hx: 640, hy: 515, rot: 6, R: 30 },
  { hx: 1175, hy: 262, rot: -15, R: 30 },
  { hx: 1255, hy: 450, rot: -30, R: 34 },
  { hx: 850, hy: 770, rot: -24, R: 36 },
  { hx: 1430, hy: 850, rot: 4, R: 30 },
  { hx: 1660, hy: 345, rot: 75, R: 28 },
  { hx: 680, hy: 230, rot: 20, R: 30 },
  { hx: 625, hy: 752, rot: -10, R: 26 },
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

/** A starch chain's wander before anything keeps it clear of its neighbours (see freeSub). */
const wanderSub = (i: number, abs: number): Pose => {
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
const quadOut = (t: number) => 1 - (1 - clamp01(t)) * (1 - clamp01(t));
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), rot: lerpAngle(a.rot, b.rot, t) });

// ------------------------------------------------------------------ free drift that never passes through anything
/** A glucose ring's radius in world px. */
const RING_R = HEX_R * MOL_S;
/** The enzyme's body without its pocket (the mouth closed by a straight line), enzyme-local units. */
const BODY_POLY: Pt[] = ENZYME_REST.slice(0, LIP_BOT + 1) as Pt[];
/** How far the body reaches from the enzyme's centre along the local unit direction (ux, uy). */
const bodyRadius = (ux: number, uy: number) => {
  let best = 0;
  for (let k = 0; k < BODY_POLY.length; k++) {
    const [ax, ay] = BODY_POLY[k];
    const [bx, by] = BODY_POLY[(k + 1) % BODY_POLY.length];
    // ray t·u meets segment a + s·(b − a)
    const ex = bx - ax;
    const ey = by - ay;
    const den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (ax * ey - ay * ex) / den;
    const sg = (ax * uy - ay * ux) / den;
    if (t > 0 && sg >= -1e-6 && sg <= 1 + 1e-6) best = Math.max(best, t);
  }
  return best;
};
const BODY_MAX = Math.max(...BODY_POLY.map(([x, y]) => Math.hypot(x, y))) * MOL_S;
/** Free chains keep at least this gap (world px) from enzymes and from each other; the push starts SOFT px earlier. */
const CLEAR_E = 9;
const CLEAR_S = 10;
const SOFT = 14;
/** A smooth "penetration → push" curve: 0 with zero slope at contact, ≈ pen − SOFT when deep (so the gap settles at CLEAR). */
const softPush = (pen: number) => (pen <= 0 ? 0 : pen - SOFT * (1 - Math.exp(-pen / SOFT)));
const HALF6 = ((SUB_RINGS - 1) / 2) * SPACING * MOL_S;

/** Push (world px) that keeps a 6-ring chain at pose c clear of an enzyme at pose e. */
const pushFromEnzyme = (c: Pose, e: Pose): [number, number] => {
  const dx = Math.cos(rad(c.rot));
  const dy = Math.sin(rad(c.rot));
  const reach = BODY_MAX + RING_R + CLEAR_E + SOFT;
  if (Math.hypot(c.x - e.x, c.y - e.y) > reach + HALF6) return [0, 0];
  const ca = Math.cos(rad(-e.rot));
  const sa = Math.sin(rad(-e.rot));
  let vx = 0;
  let vy = 0;
  let mx = 0;
  for (let j = 0; j < SUB_RINGS; j++) {
    const o = (j - (SUB_RINGS - 1) / 2) * SPACING * MOL_S;
    const rx = c.x + dx * o - e.x;
    const ry = c.y + dy * o - e.y;
    const d = Math.hypot(rx, ry);
    if (d > reach || d < 1e-6) continue;
    const lx = (rx * ca - ry * sa) / d;
    const ly = (rx * sa + ry * ca) / d;
    const gap = d - bodyRadius(lx, ly) * MOL_S - RING_R;
    const p = softPush(CLEAR_E + SOFT - gap);
    if (p <= 0) continue;
    vx += (rx / d) * p;
    vy += (ry / d) * p;
    mx = Math.max(mx, p);
  }
  const l = Math.hypot(vx, vy);
  return l > 1e-9 ? [(vx / l) * mx, (vy / l) * mx] : [0, 0];
};

/** Closest points between two chain axes (segments of half-lengths ha and hb, centred on the poses). */
const segClosest = (a: Pose, b: Pose, ha = HALF6, hb = HALF6) => {
  const ux = Math.cos(rad(a.rot));
  const uy = Math.sin(rad(a.rot));
  const vx = Math.cos(rad(b.rot));
  const vy = Math.sin(rad(b.rot));
  const wx = a.x - b.x;
  const wy = a.y - b.y;
  const B = ux * vx + uy * vy;
  const D = ux * wx + uy * wy;
  const E = vx * wx + vy * wy;
  const den = 1 - B * B;
  let s = den > 1e-6 ? (B * E - D) / den : 0;
  s = Math.max(-ha, Math.min(ha, s));
  let t = Math.max(-hb, Math.min(hb, E + B * s));
  s = Math.max(-ha, Math.min(ha, B * t - D));
  t = Math.max(-hb, Math.min(hb, E + B * s));
  return { ax: a.x + ux * s, ay: a.y + uy * s, bx: b.x + vx * t, by: b.y + vy * t };
};

/**
 * Every chain's free drift, precomputed per frame: its own wander, then gently pushed so that it never
 * slides through an enzyme or another chain (molecules bump and slide past each other; they don't
 * overlap). Planned collisions are layered on top of this.
 */
const FREE_A = O8 - 160;
const FREE_N = SC10.endFrame + 160 - FREE_A + 1;
const FREE_TAB: Float64Array[] = (() => {
  const tab = SUB.map(() => new Float64Array(FREE_N * 3));
  for (let k = 0; k < FREE_N; k++) {
    const abs = FREE_A + k;
    const es = ENZ.map((_, j) => freeEnzyme(j, abs));
    let ps = SUB.map((_, i) => wanderSub(i, abs));
    for (let it = 0; it < 6; it++) {
      ps = ps.map((c, i) => {
        let px = 0;
        let py = 0;
        for (const e of es) {
          const [qx, qy] = pushFromEnzyme(c, e);
          px += qx;
          py += qy;
        }
        for (let o = 0; o < ps.length; o++) {
          if (o === i) continue;
          const q = segClosest(c, ps[o]);
          const d = Math.hypot(q.ax - q.bx, q.ay - q.by);
          const p = softPush(2 * RING_R + CLEAR_S + SOFT - d) / 2;
          if (p > 0) {
            // push apart along the line between the closest points, blended towards "away from the other
            // chain's centre" as they get close (that line is undefined, and can flip, when two wanders touch)
            const cx = c.x - ps[o].x;
            const cy = c.y - ps[o].y;
            const cl = Math.hypot(cx, cy) || 1;
            const nx = q.ax - q.bx + (cx / cl) * 14;
            const ny = q.ay - q.by + (cy / cl) * 14;
            const nl = Math.hypot(nx, ny) || 1;
            px += (nx / nl) * p;
            py += (ny / nl) * p;
          }
        }
        // relax towards the target (damped), so pushes from several sides settle smoothly
        return { x: c.x + px * 0.45, y: c.y + py * 0.45, rot: c.rot };
      });
    }
    ps.forEach((c, i) => {
      tab[i][k * 3] = c.x;
      tab[i][k * 3 + 1] = c.y;
      tab[i][k * 3 + 2] = c.rot;
    });
  }
  return tab;
})();

/** Where starch chain i drifts on its own (world space, no jiggle): its wander, kept clear of the others. */
export const freeSub = (i: number, abs: number): Pose => {
  const x = Math.max(0, Math.min(FREE_N - 1, abs - FREE_A));
  const k = Math.min(FREE_N - 2, Math.floor(x));
  const u = x - k;
  const t = FREE_TAB[i];
  return {
    x: t[k * 3] + (t[k * 3 + 3] - t[k * 3]) * u,
    y: t[k * 3 + 1] + (t[k * 3 + 4] - t[k * 3 + 1]) * u,
    rot: t[k * 3 + 2] + (t[k * 3 + 5] - t[k * 3 + 2]) * u,
  };
};

/** A speed profile → position profile (0..1 → 0..1), by integrating a velocity shape. */
const profile = (shape: (u: number) => number) => {
  const N = 240;
  const cum = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) cum[i] = cum[i - 1] + shape((i - 0.5) / N);
  const tot = cum[N];
  return (u: number) => {
    const x = clamp01(u) * N;
    const i = Math.min(N - 1, Math.floor(x));
    return (cum[i] + (cum[i + 1] - cum[i]) * (x - i)) / tot;
  };
};
/** Docking: eases out of the drift, cruises (≈ 1.25 × its average speed), slows a little sliding into the pocket. */
const PROF_DOCK = profile((u) => smooth(u / 0.3) * (1 - 0.5 * smooth((u - 0.72) / 0.28)));
/** A bump: eases out of the drift and arrives with its speed (it's a collision). */
const PROF_BUMP = profile((u) => smooth(u / 0.35));

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
 * Pose of an n-ring chain docked in enzyme pose e (its two end rings inside the pocket).
 * The chain is symmetric, so it can dock either way round: rel = 0 or 180 (relative to the enzyme),
 * whichever is closer to how the chain was already lying (so it never has to spin round).
 */
export const dockedPose = (e: Pose, n: number, rel = 0, back = 0, s = MOL_S): Pose => {
  const cxLocal = (DOCK.inner[0] - (SPACING * (n - 1)) / 2 - back) * s;
  const [ox, oy] = rotV(cxLocal, 0, e.rot);
  return { x: e.x + ox, y: e.y + oy, rot: e.rot + rel };
};

/** Where the bond at the pocket mouth is (the one that's cut), in world space. */
export const mouthPoint = (e: Pose, s = MOL_S): [number, number] => {
  const [ox, oy] = rotV(DOCK.cut[0] * s, 0, e.rot);
  return [e.x + ox, e.y + oy];
};

/** An enzyme's outline (at rest) in world space. */
const enzPoly = (e: Pose): Pt[] => {
  const a = rad(e.rot);
  const c = Math.cos(a);
  const sn = Math.sin(a);
  return ENZYME_REST.map(([x, y]) => [e.x + (x * c - y * sn) * MOL_S, e.y + (x * sn + y * c) * MOL_S] as Pt);
};
/** How far the deepest of these rings sinks into the enzyme's body (world px; ≤ 0 = clear of it). */
const sinkInto = (rings: readonly RingXY[], e: Pose) => {
  const poly = enzPoly(e);
  let worst = -Infinity;
  for (const r of rings) {
    const d = distToPolygon([r.x, r.y], poly);
    worst = Math.max(worst, pointInPolygon([r.x, r.y], poly) ? d + RING_R : RING_R - d);
  }
  return worst;
};
/** How far the enzyme's outline reaches from its centre in direction (ux, uy). */
const supportOf = (e: Pose, ux: number, uy: number) => {
  let h = 0;
  for (const [px, py] of enzPoly(e)) h = Math.max(h, (px - e.x) * ux + (py - e.y) * uy);
  return h;
};

/** How far in front of the active site (world px) a substrate is lined up before it slides in end-on. */
const PRE_DOCK = 2.4 * SPACING * MOL_S;

/**
 * The way a substrate comes in to dock: a gentle curve from p0 to a point PRE_DOCK in front of the
 * active site (it only bends near the end, to arrive along the pocket's axis), then a straight slide
 * into the pocket. at(s) is roughly arc-length parameterised (s = 0..1). sq = where the slide starts.
 */
const approachPath = (p0: readonly [number, number], e: Pose, docked: Pose) => {
  const pd = pocketDir(e);
  const q: [number, number] = [docked.x + pd[0] * PRE_DOCK, docked.y + pd[1] * PRE_DOCK];
  const lead = Math.min(80, 0.4 * Math.hypot(p0[0] - q[0], p0[1] - q[1]));
  const c: [number, number] = [q[0] + pd[0] * lead, q[1] + pd[1] * lead];
  const bez = (w: number): [number, number] => {
    const b0 = (1 - w) * (1 - w);
    const b1 = 2 * w * (1 - w);
    const b2 = w * w;
    return [b0 * p0[0] + b1 * c[0] + b2 * q[0], b0 * p0[1] + b1 * c[1] + b2 * q[1]];
  };
  const N = 10;
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
 * Where a docking substrate is during its approach (rigid pose): one smooth path clocked by thermal
 * phase — out of its own drift, along a gentle curve to a point in front of the active site (turning
 * to line up only near the end), then sliding straight in end-on. The planner checks exactly this path.
 */
const dockApproach = (drift: Pose, e: Pose, n: number, rel: number, u: number) => {
  const docked = dockedPose(e, n, rel);
  const path = approachPath([drift.x, drift.y], e, docked);
  const sPath = PROF_DOCK(u);
  const [x, y] = path.at(sPath);
  const turn = smooth((sPath - (path.sq - 0.3)) / 0.3);
  return { pose: { x, y, rot: lerpAngle(drift.rot, docked.rot, turn) } as Pose, sPath, sq: path.sq };
};

// ------------------------------------------------------------------ collisions
export type EvKind = "dock" | "bounce";
export type Ev = {
  readonly kind: EvKind;
  readonly at: number; // contact frame (absolute)
  readonly t0: number; // approach starts (absolute, fractional)
  readonly e: number;
  readonly s: number;
  readonly A: number; // approach frames (rounded at - t0)
  readonly hold: number; // dock: frames in the pocket before the snip
  readonly energy: number; // 0..1+ (sets the flash size)
  readonly rel: number; // dock: chain angle relative to the enzyme once docked (0 or 180)
  readonly n: number; // rings on the chain when this collision happens
  readonly ret: number; // bounce: frames to drift back into the crowd afterwards
  readonly side: number; // dock: which way the maltose leaves (+1 / −1); the leftover chain goes the other way
};

/** Approach speeds, as multiples of the crowd's mean drift speed at that temperature. */
const DOCK_K = 1.6; // average (cruise ≈ 2 × drift)
const BUMP_K = 1.7;
const RELAX_K = 1.0; // a leftover chain drifting back into the crowd
const RESPAWN_K = 2.0; // a fresh chain drifting into view
const energyOf = (T: number) => 0.35 + (T / 37) * 0.65;
const holdOf = (T: number) => Math.round(lerp(24, 9, clamp01((T - 10) / 27)));
/** After a snip, the leftover chain backs out of the pocket (and steps aside) over this many frames. */
const BACK_T = 20;
const BACK_D = 44; // world px straight back out of the pocket
const BACK_SIDE = 66; // world px sideways (out of the lane the maltose leaves by)
/** The maltose waits this long before leaving the pocket, then takes PROD_OUT_T frames to get clear. */
const PROD_WAIT = 5;
const PROD_OUT_T = 32;
const PROD_OUT = 96; // world px straight out along the pocket axis (its inner ring clears the lips)
const PROD_VEER_T = 30;
const PROD_VEER_OUT = 34;
const PROD_VEER_SIDE = 62;
/** Maltose leaving the lens: products and fully digested chains fade after this long. */
const PRODUCT_LIFE = 46;
/** Maltose is a much smaller molecule than starch, so it diffuses away faster than the crowd drifts. */
const MALTOSE_K = 1.4;
const PRODUCT_FADE = 28;
/** A fresh chain drifts in from this far out (world px, radially from the middle of the lens)… */
const RESPAWN_D = 250;
/** …starting this long after the old chain was finished off. */
const RESPAWN_DELAY = 12;
/** The farthest a substrate travels to make a collision (world px): partners must already be close. */
const MAX_DOCK_TRAVEL = 300;
const MAX_BUMP_TRAVEL = 200;
/** Docking partners must already be in front of the active site and lying roughly along its axis. */
const MIN_FACING = 0.5;
const MAX_TWIST = 60;

/** No approach (except the hand-placed ones) takes longer than this: partners must already be close. */
const MAX_APPROACH = 150;

/**
 * Solve for the approach start t0 so that covering travel(t0) at k × drift ends exactly at `end`
 * (the travel depends on where the substrate is when it sets off). NaN if it doesn't settle.
 */
const solveStart = (end: number, travel: (t0: number) => number, k: number) => {
  // h(t0) = t0 − (when it would have to set off from where it is at t0); find its root by bisection
  const h = (t0: number) => t0 - startFor(end, travel(t0), k);
  let lo = end - 420;
  let hi = end - 2;
  if (h(hi) < 0 || h(lo) > 0) return NaN;
  for (let it = 0; it < 28 && hi - lo > 0.25; it++) {
    const mid = (lo + hi) / 2;
    if (h(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

type Plan = {
  at: number;
  kind: EvKind;
  e?: number;
  s?: number;
  hold?: number;
  /** Fixed approach start (hero), instead of the thermal-phase rule. */
  t0?: number;
  shift?: number;
  /** Bounce: "body" = hits the enzyme away from its active site; "site" = at a (denatured) active site. */
  where?: "body" | "site";
  /** A key moment that must happen exactly on its word: may take longer than MAX_APPROACH. */
  long?: boolean;
};

/** Until here the molecules fill the frame (S08 before the pull-back into the lens). */
const LENS_FROM = O8 + K8.irisB;

/** From this frame on, S10 shows a fresh sample: earlier reactions (and denaturing) are forgotten. */
export const RESET = O10 + K10.coldA;

const PLAN: Plan[] = (() => {
  const k = K8;
  const p8 = (f: number, kind: EvKind, shift = 10): Plan => ({ at: O8 + f, kind, shift, where: "body" });
  const p9 = (f: number, kind: EvKind, shift = 8): Plan => ({ at: O9 + f, kind, shift, where: "body" });
  const p10 = (f: number, kind: EvKind, shift = 10, where: "body" | "site" = "body"): Plan => ({ at: O10 + f, kind, shift, where });
  // (candidate moments: a couple while it's still warming, then every ~0.5 s once it's at 37 °C — the planner
  // keeps the ones where a substrate is close enough and facing the active site)
  const lensDocks = [
    k.traceA + 14,
    Math.round((k.riseA + k.riseB) / 2),
    ...Array.from({ length: 24 }, (_, q) => k.riseB - 14 + q * 15),
  ].filter((f) => f < k.end - 12);
  const lensBumps = [26, 82, 130, 178, 226, 274].map((d) => k.traceA + d).filter((f) => f < k.end - 6);
  return [
    // S08 — cold: rare, gentle bumps
    p8(k.jiggle + 40, "bounce", 14),
    p8(k.heatA + 46, "bounce", 14),
    // "bump into each other more often, and with more energy"
    p8(k.collide + 12, "bounce", 8),
    p8(k.bump, "bounce", 6),
    p8(k.often - 8, "bounce", 6),
    p8(k.often + 8, "bounce", 6),
    p8(k.energy, "bounce", 6),
    // the first successful collision, in full view: it drifts in during "So more collisions are
    // successful" and lands in the active site on "landing"
    { at: O8 + k.heroDock, kind: "dock" as const, e: 0, s: 0, hold: k.heroSnip - k.heroDock, t0: O8 + k.heroApproach },
    // "More enzyme–substrate complexes form"
    p8(k.complexWord - 6, "dock", 10),
    p8(k.complexWord + 16, "dock", 10),
    p8(k.heroDock + 22, "bounce", 8),
    // the lens: reactions get more frequent as it warms to 37 °C
    ...lensDocks.map((f) => p8(f, "dock", 10)),
    ...lensBumps.map((f) => p8(f, "bounce", 10)),
    // S09 — still near the optimum (37 → 41 °C): reactions carry on, a little less often…
    p9(4, "dock"),
    p9(16, "bounce"),
    p9(16, "dock"),
    p9(28, "dock"),
    p9(40, "dock"),
    p9(50, "dock", 4),
    // …then the lens goes soft (no claim while the question is open) until the reveal.
    // S10 — once the active sites have visibly lost their shape: starch bounces off them
    ...[K10.penMid + 8, K10.penMid + 22, K10.penB + 10, K10.coolA + 22, K10.coolA + 38].map((f) => p10(f, "bounce", 8, "site")),
    // S10 — a fresh sample, cooled: fewer, gentler collisions… but it still works
    p10(K10.coldCoolA + 30, "bounce", 10),
    p10(K10.fewerBump, "bounce", 6),
    // (one bump on "fewer collisions"; the one successful collision is the one we lean in on)
    { at: O10 + K10.siteDock, kind: "dock" as const, e: 0, s: 0, long: true },
    // …warm it up and it works again: one reaction, with the "snip" sound (nothing else starts before the scene ends)
    { at: O10 + K10.reDock, kind: "dock" as const, hold: K10.reSnip - K10.reDock, shift: 0, long: true },
  ].sort((a, b) => a.at - b.at);
})();

// ------------------------------------------------------------------ each starch slot's drift (+ offsets)
/**
 * A decaying offset added to a slot's free drift: after a snip the leftover chain is wherever it
 * backed out to, and it relaxes back into the crowd from there; a fresh chain starts far out and
 * drifts in. Relaxation is clocked by thermal phase (slower when cold).
 */
type Offset = { t: number; dW: number; dx: number; dy: number; dr: number; fadeIn: boolean; hold?: number };
const OFFS: Offset[][] = SUB.map(() => []);
/** Frames at which a slot starts a new chain (its earlier offsets no longer apply). */
const GEN: number[][] = SUB.map(() => [RESET]);

/**
 * The fresh sample (S10, from RESET) is a new tube, so its chains needn't sit exactly where the old
 * ones did: a couple start a little nearer an active site, because at 10 °C the drift is slow and a
 * collision can only come from close by. (Constant offsets for that whole stretch.)
 */
const FRESH_SHIFT: Record<number, [number, number]> = { 0: [14, -62], 2: [-10, 24], 7: [-22, 10] };
for (const [i, [dx, dy]] of Object.entries(FRESH_SHIFT)) OFFS[Number(i)].push({ t: RESET, dW: 1e9, dx, dy, dr: 0, fadeIn: false });

const genStart = (i: number, abs: number) => {
  let g = -Infinity;
  for (const t of GEN[i]) if (t <= abs && t > g) g = t;
  return g;
};

/** Where slot i's chain drifts when nothing is happening to it (world space, no jiggle). */
export const driftPose = (i: number, abs: number): Pose => {
  const b = freeSub(i, abs);
  const g = genStart(i, abs);
  let x = b.x;
  let y = b.y;
  let r = b.rot;
  const w = wanderAt(abs);
  for (const o of OFFS[i]) {
    if (o.t < g || o.t > abs) continue;
    const k = 1 - smooth((w - wanderAt(o.t + (o.hold ?? 0))) / o.dW);
    x += o.dx * k;
    y += o.dy * k;
    r += o.dr * k;
  }
  return { x, y, rot: r };
};
/** A fresh chain fades in while it drifts in from the edge (0..1); 1 otherwise. */
const fadeInOf = (i: number, abs: number) => {
  const g = genStart(i, abs);
  const o = OFFS[i].find((q) => q.fadeIn && q.t === g);
  if (!o || abs < o.t) return 1;
  return smooth(((wanderAt(abs) - wanderAt(o.t)) / o.dW - 0.04) / 0.4);
};
/** When a fresh chain has drifted far enough in to take part in collisions. */
const readyAfterRespawn = (o: Offset) => wanderInv(wanderAt(o.t) + o.dW * 0.45);

/**
 * Contact pose for a bump: turned a little towards end-on (at most 25°, so it never swings round), sitting
 * so that its nearest ring just touches the enzyme's outline.
 */
const bumpContact = (e: Pose, s0: Pose, n: number, rotFree: number): { pose: Pose; ux: number; uy: number } => {
  const dx = s0.x - e.x;
  const dy = s0.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const aligned = (Math.atan2(-uy, -ux) * 180) / Math.PI;
  const alignedNear = Math.abs(angDiff(rotFree, aligned)) <= 90 ? aligned : aligned + 180;
  const rotC = rotFree + Math.max(-25, Math.min(25, angDiff(rotFree, alignedNear) * 0.55));
  const dX = Math.cos(rad(rotC));
  const dY = Math.sin(rad(rotC));
  const halfL = ((n - 1) / 2) * SPACING * MOL_S;
  const along = Math.abs(dX * ux + dY * uy);
  const side = Math.sqrt(Math.max(0, 1 - along * along));
  // the end ring sits off the line of centres by halfL·side; the outline is roughly round, so push out a bit for that
  const reach = supportOf(e, ux, uy) + RING_R + 3 + halfL * along + Math.min(30, halfL * side * 0.25);
  return { pose: { x: e.x + ux * reach, y: e.y + uy * reach, rot: rotC }, ux, uy };
};

/** Pose of the leftover chain while it backs out of the pocket and steps aside (rigid, world space). */
const leftoverPose = (e: Pose, n: number, rel: number, side: number, snip: number, abs: number): Pose => {
  const rest = dockedPose(e, n - 2, rel, 2 * SPACING);
  const pd = pocketDir(e);
  const perp: [number, number] = [-pd[1], pd[0]];
  const b = quadOut((abs - snip) / BACK_T) * BACK_D;
  const l = smooth((abs - snip - 2) / (BACK_T - 2)) * BACK_SIDE * -side;
  return { x: rest.x + pd[0] * b + perp[0] * l, y: rest.y + pd[1] * b + perp[1] * l, rot: rest.rot };
};

// ------------------------------------------------------------------ maltose leaving the pocket
/** Which way (degrees from straight out of the pocket; + = towards +perp) each maltose heads once it's clear. */
const HEAD = new Map<number, { prod: number; rem: number }>();
const headOf = (ev: Ev) => {
  const h = HEAD.get(ev.at);
  if (!h) throw new Error(`no maltose heading planned for the dock at ${ev.at}`);
  return h;
};
const VEER_LEN = Math.hypot(PROD_VEER_OUT, PROD_VEER_SIDE);

/** The released maltose's pose (before it's nudged clear of other molecules). */
const productRaw = (ev: Ev, abs: number, head: number): Pose => {
  const snip = ev.at + ev.hold;
  // (no bump ever hits an enzyme while its maltose is leaving, so its free pose is exact)
  const e = freeEnzyme(ev.e, Math.min(abs, snip + PROD_WAIT + PROD_OUT_T));
  const inPocket = dockedPose(e, 2, ev.rel);
  const pd = pocketDir(e);
  const h = rotV(pd[0], pd[1], head);
  const t1 = snip + PROD_WAIT;
  const t2 = t1 + PROD_OUT_T;
  const t3 = t2 + PROD_VEER_T;
  // 1. straight out along the pocket's axis (it can't go sideways while it's between the lips)…
  // 2. …then it heads off (the planner picks the clearest way: away from the leftover chain and the crowd)…
  const k1 = ramp(abs, t1, t2, EASE.inOut);
  const k2 = ramp(abs, t2 - 6, t3, EASE.inOut);
  // 3. …and keeps drifting that way (a little faster than the crowd: it's a much smaller molecule)
  const along = k2 * VEER_LEN + Math.max(0, wanderAt(abs) - wanderAt(t3)) * DRIFT_PER_PHASE * MALTOSE_K;
  const pFree = Math.max(0, wanderAt(abs) - wanderAt(t2));
  const seed = `m${ev.at}`;
  const wx = (noise2D(`${seed}x`, pFree * 0.9, 0) - noise2D(`${seed}x`, 0, 0)) * 26;
  const wy = (noise2D(`${seed}y`, pFree * 0.9, 4) - noise2D(`${seed}y`, 0, 4)) * 22;
  const turn = Math.sign(head) * 24 * k2;
  return {
    x: inPocket.x + pd[0] * k1 * PROD_OUT + h[0] * along + wx,
    y: inPocket.y + pd[1] * k1 * PROD_OUT + h[1] * along + wy,
    rot: inPocket.rot + turn + (noise2D(`${seed}r`, pFree * 0.6, 7) - noise2D(`${seed}r`, 0, 7)) * 40,
  };
};

/** The remnant maltose of a chain's last dock (before it's nudged clear): backs out, steps aside, drifts off. */
const remnantRaw = (ev: Ev, abs: number, head: number): Pose => {
  const snip = ev.at + ev.hold;
  const tb = snip + BACK_T;
  const e = freeEnzyme(ev.e, Math.min(abs, tb));
  const base = leftoverPose(e, ev.n, ev.rel, ev.side, snip, Math.min(abs, tb));
  const pd = pocketDir(e);
  const dir = rotV(pd[0], pd[1], head);
  // afterwards: keeps drifting away (the planner picks the clearest way) at about the crowd's drift speed
  const w = Math.max(0, wanderAt(abs) - wanderAt(tb));
  const away = DRIFT_PER_PHASE * MALTOSE_K * w;
  const seed = `r${ev.at}`;
  const wx = (noise2D(`${seed}x`, w * 0.9, 0) - noise2D(`${seed}x`, 0, 0)) * 26;
  const wy = (noise2D(`${seed}y`, w * 0.9, 4) - noise2D(`${seed}y`, 0, 4)) * 22;
  return { x: base.x + dir[0] * away + wx, y: base.y + dir[1] * away + wy, rot: base.rot + (noise2D(`${seed}r`, w * 0.6, 7) - noise2D(`${seed}r`, 0, 7)) * 30 };
};

// ------------------------------------------------------------------ planning
const PLANNED = (() => {
  const busyE: [number, number][][] = ENZ.map(() => []);
  const busyS: [number, number][][] = SUB.map(() => []);
  const nS = SUB.map(() => SUB_RINGS);
  /** [from, to): this slot can't start a collision (being finished off, drifting in, or gone until the fresh sample). */
  const notReady: [number, number][][] = SUB.map(() => []);
  const emptyS: [number, number][][] = SUB.map(() => []); // [from, to): no chain in this slot
  const docksE = ENZ.map(() => 0);
  const usedE = ENZ.map(() => 0);
  const usedS = SUB.map(() => 0);
  const events: Ev[] = [];
  const overlaps = (busy: [number, number][], a: number, b: number) => busy.some(([x, y]) => a < y && b > x);
  let resetDone = false;

  /** Rings on chain s at frame t (from the docks planned so far, fresh chains after a respawn / RESET). */
  const ringsAt = (s: number, t: number) => {
    let n = SUB_RINGS;
    const items = [
      ...events.filter((ev) => ev.s === s && ev.kind === "dock").map((ev) => ({ t: ev.at + ev.hold, fresh: false })),
      ...GEN[s].map((g) => ({ t: g, fresh: true })),
    ].sort((a, b) => a.t - b.t);
    for (const it of items) {
      if (it.t > t) break;
      n = it.fresh ? SUB_RINGS : n - 2;
    }
    return n;
  };
  const isEmpty = (s: number, a: number, b: number) => emptyS[s].some(([x, y]) => a < y && b > x);

  /** Maltose already released (each on its planned way out): later approaches must keep clear of them. */
  const malts: { ev: Ev; rem: boolean }[] = [];
  const maltRings = (t: number): RingXY[][] => {
    const out: RingXY[][] = [];
    for (const m of malts) {
      const snip = m.ev.at + m.ev.hold;
      if (t < snip || t > snip + PRODUCT_LIFE + PRODUCT_FADE + (m.rem ? 10 : 0) - 8) continue;
      if (t >= RESET && m.ev.at < RESET) continue;
      const hd = headOf(m.ev);
      out.push(layout(m.rem ? remnantRaw(m.ev, t, hd.rem) : productRaw(m.ev, t, hd.prod), 2));
    }
    return out;
  };
  const minDistRings = (a: readonly RingXY[], b: readonly RingXY[]) => {
    let m = 1e9;
    for (const p of a) for (const q of b) m = Math.min(m, Math.hypot(p.x - q.x, p.y - q.y));
    return m;
  };

  /** Rough "is the way clear" test along an approach: the moving chain must not pass through another enzyme or chain. */
  const pathClear = (s: number, e: number, t0: number, at: number, poseAt: (t: number) => Pose, n: number, dock: boolean) => {
    const N = Math.max(11, Math.ceil((at - t0) / (at < LENS_FROM ? 2 : 4)));
    for (let q = 1; q <= N; q++) {
      const u = q / (N + 0.5);
      const t = lerp(t0, at, u);
      const rings = layout(poseAt(t), n);
      for (let j = 0; j < ENZ.length; j++) {
        // a docking chain ends up inside its own enzyme's pocket: only check its way there
        if (j === e && dock && u > 0.76) continue;
        // (in the small lens view, a docking chain may graze its own enzyme's lip a little as it lines up;
        // full frame, it must stay clear)
        const sk = sinkInto(rings, freeEnzyme(j, t));
        if (sk > (j === e ? (t < LENS_FROM ? 6 : 9) : 3)) return false;
      }
      for (let o = 0; o < SUB.length; o++) {
        if (o === s || isEmpty(o, t - 1, t + 1)) continue;
        const other = layout(driftPose(o, t), ringsAt(o, t));
        if (minDistRings(rings, other) < 36) return false;
      }
      // (a small maltose in the way gets nudged aside, so it only has to be clear of the chain itself)
      for (const mr of maltRings(t)) if (minDistRings(rings, mr) < 26) return false;
    }
    return true;
  };

  /**
   * How clear a maltose's way out is: the closest it comes (world px, ring centre to ring centre) to any
   * starch chain or other maltose over its life, minus a penalty for drifting out of view.
   */
  const wayOutScore = (ev: Ev, poseAt: (f: number) => Pose, from: number, to: number, extra: ((f: number) => RingXY[]) | null) => {
    const snip = ev.at + ev.hold;
    let m = 90;
    let out = 0;
    for (let f = from; f <= to; f += 2) {
      const p = poseAt(f);
      const rings = layout(p, 2);
      for (let o = 0; o < SUB.length; o++) {
        if (isEmpty(o, f - 0.5, f + 0.5)) continue;
        const other =
          o === ev.s && f < snip + BACK_T
            ? layout(leftoverPose(freeEnzyme(ev.e, f), ev.n, ev.rel, ev.side, snip, f), ev.n - 2)
            : layout(driftPose(o, f), ringsAt(o, f));
        m = Math.min(m, minDistRings(rings, other));
      }
      for (const mr of maltRings(f)) m = Math.min(m, minDistRings(rings, mr));
      if (extra) m = Math.min(m, minDistRings(rings, extra(f)));
      out = Math.max(out, Math.hypot(p.x - LENS_WC[0], p.y - LENS_WC[1]) - 520);
    }
    return m - Math.max(0, out) * 0.5;
  };
  /** Pick the clearest way out for a dock's maltose (and, for a chain's last dock, its remnant). */
  const planWayOut = (ev: Ev) => {
    const snip = ev.at + ev.hold;
    const end = snip + PRODUCT_LIFE + PRODUCT_FADE - 8;
    const final = ev.n - 2 <= 2;
    let rem = -ev.side * 45;
    if (final) {
      let best = -Infinity;
      for (const a of [20, 35, 50, 65, 80]) {
        const head = -ev.side * a;
        const sc = wayOutScore(ev, (f) => remnantRaw(ev, f, head), snip + BACK_T, end + 10, null) - Math.abs(a - 45) * 0.04;
        if (sc > best) {
          best = sc;
          rem = head;
        }
      }
    }
    let prod = ev.side * 60;
    let best = -Infinity;
    for (const a of [-80, -60, -40, -20, 20, 40, 60, 80]) {
      const head = ev.side * a;
      const extra = final ? (f: number) => layout(remnantRaw(ev, f, rem), 2) : null;
      const sc = wayOutScore(ev, (f) => productRaw(ev, f, head), snip + PROD_WAIT + PROD_OUT_T - 6, end, extra) - Math.abs(a - 60) * 0.04;
      if (sc > best) {
        best = sc;
        prod = head;
      }
    }
    HEAD.set(ev.at, { prod, rem });
    malts.push({ ev, rem: false });
    if (final) malts.push({ ev, rem: true });
  };

  // Reserve hand-placed collisions (enzyme AND substrate fixed) first.
  for (const pl of PLAN) {
    if (pl.e === undefined || pl.s === undefined) continue;
    const hold = pl.hold ?? holdOf(tempAt(pl.at));
    busyE[pl.e].push([(pl.t0 ?? pl.at - 120) - 2, pl.at + hold + PROD_WAIT + PROD_OUT_T]);
    busyS[pl.s].push([(pl.t0 ?? pl.at - 120) - 2, pl.at + hold + BACK_T + 4]);
  }

  // Docks first, in time order (they ARE the rate), then bumps fill in around them.
  for (const pl of [...PLAN.filter((x) => x.kind === "dock"), ...PLAN.filter((x) => x.kind === "bounce")]) {
    if (pl.kind === "dock" && pl.at >= RESET && !resetDone) {
      // a fresh sample: every chain is whole again, nothing is half-digested or fading
      resetDone = true;
      for (let i = 0; i < SUB.length; i++) nS[i] = SUB_RINGS;
    }
    const fixed = pl.e !== undefined && pl.s !== undefined;
    const shifts = fixed ? [0] : [0, ...Array.from({ length: Math.floor((pl.shift ?? 0) / 2) }, (_, q) => [(q + 1) * 2, -(q + 1) * 2]).flat()];
    let best: (Ev & { score: number }) | null = null;
    for (const dt of shifts) {
      const at = pl.at + dt;
      const T = tempAt(at);
      const es = pl.e !== undefined ? [pl.e] : ENZ.map((_, i) => i);
      const ss = pl.s !== undefined ? [pl.s] : SUB.map((_, i) => i);
      for (const e of es) {
        for (const s of ss) {
          const nNow = pl.kind === "dock" ? nS[s] : ringsAt(s, at);
          if (nNow < 4) continue; // only starch takes part (maltose is a product)
          const ep = freeEnzyme(e, at);
          const hold = pl.kind === "dock" ? pl.hold ?? holdOf(T) : 0;
          let t0 = pl.t0 ?? at - 60;
          let travel = 0;
          let rel = 0;
          let poseAt: (t: number) => Pose = (t) => driftPose(s, t);
          let ok = true;
          if (pl.kind === "dock") {
            const travelFrom = (t: number) => {
              const s0 = driftPose(s, t);
              const r = Math.abs(angDiff(s0.rot, ep.rot)) <= 90 ? 0 : 180;
              return { L: approachPath([s0.x, s0.y], ep, dockedPose(ep, nNow, r)).L, r };
            };
            if (pl.t0 === undefined) t0 = solveStart(at, (t) => travelFrom(t).L, DOCK_K);
            ({ L: travel, r: rel } = travelFrom(t0));
            const s0 = driftPose(s, t0);
            const e0 = freeEnzyme(e, t0);
            const pd = pocketDir(e0);
            const vx = s0.x - e0.x;
            const vy = s0.y - e0.y;
            const facing = (vx * pd[0] + vy * pd[1]) / (Math.hypot(vx, vy) || 1);
            const twist = Math.min(Math.abs(angDiff(s0.rot, e0.rot)), Math.abs(angDiff(s0.rot, e0.rot + 180)));
            if (!fixed && (facing < MIN_FACING || twist > MAX_TWIST || travel > MAX_DOCK_TRAVEL)) ok = false;
            if (!pl.long && at - t0 > MAX_APPROACH) ok = false;
            poseAt = (t) => dockApproach(driftPose(s, t), freeEnzyme(e, t), nNow, rel, phaseU(t0, at, t)).pose;
          } else {
            const rotAt = driftPose(s, at).rot;
            const travelFrom = (t: number) => {
              const s0 = driftPose(s, t);
              const c = bumpContact(ep, s0, nNow, rotAt);
              return Math.hypot(s0.x - c.pose.x, s0.y - c.pose.y);
            };
            t0 = solveStart(at, travelFrom, BUMP_K);
            travel = travelFrom(t0);
            const s0 = driftPose(s, t0);
            const pd = pocketDir(ep);
            const vx = s0.x - ep.x;
            const vy = s0.y - ep.y;
            const facing = (vx * pd[0] + vy * pd[1]) / (Math.hypot(vx, vy) || 1);
            // intact enzymes are only ever bumped away from the active site (never "rejected" by it)
            if (pl.where === "site" ? facing < 0.5 : facing > 0.35) ok = false;
            if (travel > MAX_BUMP_TRAVEL || at - t0 > MAX_APPROACH) ok = false;
            poseAt = (t) => {
              const p0 = driftPose(s, t);
              const c = bumpContact(freeEnzyme(e, t), driftPose(s, t0), nNow, rotAt);
              return lerpPose(p0, c.pose, PROF_BUMP(phaseU(t0, at, t)));
            };
          }
          if (!Number.isFinite(t0)) ok = false;
          if (!ok) continue;
          const A = Math.round(at - t0);
          const ret = pl.kind === "bounce" ? Math.round(Math.max(26, Math.min(80, (travel * 0.9) / (1.4 * driftSpeed(T)) + 10))) : 0;
          const snip = at + hold;
          const final = pl.kind === "dock" && nNow - 2 <= 2;
          const [wa, wb] = pl.kind === "dock" ? [t0 - 2, final ? snip + 2 : snip + BACK_T + 2] : [t0 - 2, at + ret + 2];
          // the enzyme is taken from shortly before the substrate arrives until its maltose is out of the pocket
          // (the next substrate's way in is checked against that maltose's way out)
          const [ea, eb] = pl.kind === "dock" ? [at - 24, snip + PROD_WAIT + PROD_OUT_T] : [at - Math.max(18, Math.round(A * 0.4)), at + 20];
          if (!fixed) {
            if (overlaps(busyE[e], ea, eb) || overlaps(busyS[s], wa, wb)) continue;
            if (overlaps(notReady[s], wa, wb) || isEmpty(s, wa, wb)) continue;
            if (pl.at < RESET && wb > RESET) continue;
            if (pl.at >= RESET && wa < RESET) continue;
            if (!pathClear(s, e, t0, at, poseAt, nNow, pl.kind === "dock")) continue;
          }
          const twistPen = (() => {
            const s0 = driftPose(s, t0);
            return Math.min(Math.abs(angDiff(s0.rot, ep.rot)), Math.abs(angDiff(s0.rot, ep.rot + 180)));
          })();
          const score =
            travel +
            Math.abs(dt) * 6 +
            (pl.kind === "dock" ? twistPen * 1.5 + (nNow < SUB_RINGS ? 30 : 0) + docksE[e] * 40 : usedS[s] * 30 + usedE[e] * 20);
          if (!best || score < best.score) {
            // which way the maltose leaves: away from where the leftover chain will relax back to
            const eAt = freeEnzyme(e, at);
            const pd = pocketDir(eAt);
            const perp: [number, number] = [-pd[1], pd[0]];
            const home = freeSub(s, snip + 30);
            const m = mouthPoint(eAt);
            const homeSide = (home.x - m[0]) * perp[0] + (home.y - m[1]) * perp[1];
            const side = homeSide >= 0 ? -1 : 1;
            best = { kind: pl.kind, at, t0, e, s, A, hold, energy: energyOf(T), rel, n: nNow, ret, side, score };
          }
        }
      }
    }
    if (!best) continue; // (a candidate moment with no partner close enough: skipped)
    const { score: _score, ...ev } = best;
    void _score;
    const snip = ev.at + ev.hold;
    const final = ev.kind === "dock" && ev.n - 2 <= 2;
    if (!fixed) {
      busyE[ev.e].push(ev.kind === "dock" ? [ev.at - 24, snip + PROD_WAIT + PROD_OUT_T] : [ev.at - Math.max(18, Math.round(ev.A * 0.4)), ev.at + 20]);
      busyS[ev.s].push(ev.kind === "dock" ? [ev.t0 - 2, final ? snip + 2 : snip + BACK_T + 2] : [ev.t0 - 2, ev.at + ev.ret + 2]);
    }
    events.push(ev);
    usedE[ev.e]++;
    usedS[ev.s]++;
    if (ev.kind === "dock") {
      docksE[ev.e]++;
      nS[ev.s] -= 2;
      if (!final) {
        // the leftover chain: wherever it backed out to, it relaxes back into the crowd from there
        const tb = snip + BACK_T;
        const target = leftoverPose(freeEnzyme(ev.e, tb), ev.n, ev.rel, ev.side, snip, tb);
        const here = driftPose(ev.s, tb);
        const dx = target.x - here.x;
        const dy = target.y - here.y;
        const dr = angDiff(here.rot, target.rot);
        const dW = Math.max(0.25, (Math.hypot(dx, dy) + Math.abs(dr) * 1.2) / (DRIFT_PER_PHASE * RELAX_K));
        // it only starts drifting back once the maltose is out of the pocket and on its way (so it can't
        // wander back across the maltose's way out)
        OFFS[ev.s].push({ t: tb, dW, dx, dy, dr, fadeIn: false, hold: PROD_WAIT + PROD_OUT_T + 8 - BACK_T });
      }
      planWayOut(ev);
      if (final) {
        // cut down to maltose: the remnant drifts off as its own item; a fresh chain drifts in from the edge
        const tr = snip + RESPAWN_DELAY;
        if (ev.at >= RESET || tr < RESET) {
          // it drifts in from beyond the edge of the view, along a way that is clear of the others
          const home = freeSub(ev.s, tr);
          const base = Math.atan2(home.y - LENS_WC[1], home.x - LENS_WC[0]);
          const dW = RESPAWN_D / (DRIFT_PER_PHASE * RESPAWN_K);
          let o: Offset | null = null;
          let bestScore = Infinity;
          for (const da of [0, 20, -20, 40, -40, 60, -60, 80, -80, 100, -100, 125, -125, 150, -150, 180]) {
            const a = base + rad(da);
            const cand: Offset = { t: tr, dW, dx: Math.cos(a) * RESPAWN_D, dy: Math.sin(a) * RESPAWN_D, dr: 0, fadeIn: true };
            // how badly this way in runs into anything (0 = clear): enzymes, other chains, the maltose's way out
            let bad = 0;
            for (let q = 0; q <= 10; q++) {
              const u = (q / 10) * 0.9;
              const t = wanderInv(wanderAt(tr) + dW * u);
              const kk = 1 - smooth(u);
              const b = freeSub(ev.s, t);
              const rings = layout({ x: b.x + cand.dx * kk, y: b.y + cand.dy * kk, rot: b.rot }, SUB_RINGS);
              for (let j = 0; j < ENZ.length; j++) bad += Math.max(0, sinkInto(rings, freeEnzyme(j, t)) + 6);
              for (let o2 = 0; o2 < SUB.length; o2++) {
                if (o2 === ev.s || isEmpty(o2, t - 1, t + 1)) continue;
                const other = layout(driftPose(o2, t), ringsAt(o2, t));
                let m = 1e9;
                for (const r of rings) for (const p of other) m = Math.min(m, Math.hypot(r.x - p.x, r.y - p.y));
                bad += Math.max(0, 42 - m);
              }
              for (const mr of maltRings(t)) bad += Math.max(0, 50 - minDistRings(rings, mr));
            }
            const startD = Math.hypot(home.x + cand.dx - LENS_WC[0], home.y + cand.dy - LENS_WC[1]);
            // it must start out of view (or nearly), and the more direct the way in, the better
            const score = bad * 10 + Math.abs(da) * 0.2 + Math.max(0, 640 - startD) * 0.6;
            if (score < bestScore) {
              bestScore = score;
              o = cand;
            }
          }
          if (!o) throw new Error("respawn: no way in");
          OFFS[ev.s].push(o);
          GEN[ev.s].push(tr);
          emptyS[ev.s].push([snip, tr]);
          nS[ev.s] = SUB_RINGS;
          notReady[ev.s].push([snip, readyAfterRespawn(o)]);
        } else {
          emptyS[ev.s].push([snip, RESET]);
          notReady[ev.s].push([snip, RESET]); // stays gone until the fresh sample
        }
      }
    }
  }
  events.sort((x, y) => x.at - y.at);
  return { events, emptyS };
})();

export const EVENTS: Ev[] = PLANNED.events;
const EMPTY = PLANNED.emptyS;
const EV_BY_ENZ: Ev[][] = ENZ.map((_, i) => EVENTS.filter((e) => e.e === i));
const EV_BY_SUB: Ev[][] = SUB.map((_, i) => EVENTS.filter((e) => e.s === i).sort((a, b) => a.t0 - b.t0));
export const DOCKS = EVENTS.filter((e) => e.kind === "dock");
export const BOUNCES = EVENTS.filter((e) => e.kind === "bounce");

/** Enzyme pose (no jiggle) including a small recoil when something hits it. */
export const enzymePose = (i: number, abs: number): Pose => {
  const p = freeEnzyme(i, abs);
  let dx = 0;
  let dy = 0;
  for (const ev of EV_BY_ENZ[i]) {
    if (ev.kind !== "bounce" || abs < ev.at || abs > ev.at + 16) continue;
    const s = driftPose(ev.s, ev.t0);
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
  /** Remaining rings are maltose. */
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

/** Where substrate i is (and how many rings it has) at this moment, including any collision. */
export const substrateState = (i: number, abs: number): SubState => {
  const g = genStart(i, abs);
  let n = SUB_RINGS;
  for (const ev of EV_BY_SUB[i]) {
    if (ev.t0 < g && ev.at + ev.hold + BACK_T < g) continue; // an earlier chain in this slot
    if (abs < ev.t0) break;
    if (ev.t0 < g) continue;
    n = ev.n;
    const fade = fadeInOf(i, abs);
    if (ev.kind === "bounce") {
      if (abs > ev.at + ev.ret) continue;
      const e = enzymePose(ev.e, abs);
      const p0 = driftPose(i, abs);
      const c = bumpContact(e, driftPose(i, ev.t0), n, driftPose(i, ev.at).rot);
      const w = abs <= ev.at ? PROF_BUMP(phaseU(ev.t0, ev.at, abs)) : 1 - ramp(abs, ev.at, ev.at + ev.ret, EASE.inOut);
      const kick = abs > ev.at ? Math.sin(clamp01((abs - ev.at) / 18) * Math.PI) * 30 * ev.energy : 0;
      const p = lerpPose(p0, c.pose, w);
      return state({ x: p.x + c.ux * kick, y: p.y + c.uy * kick, rot: p.rot }, n, { lockE: ev.e, opacity: fade });
    }
    // dock
    const snip = ev.at + ev.hold;
    const final = n - 2 <= 2;
    if (abs >= (final ? snip : snip + BACK_T)) {
      n -= 2;
      continue;
    }
    const e = enzymePose(ev.e, abs);
    const docked = dockedPose(e, n, ev.rel);
    // which link sits at the mouth depends on which way round the chain docked
    const mouthLink = ev.rel === 0 ? n - 3 : 1;
    if (abs < ev.at) {
      const a = dockApproach(driftPose(i, abs), e, n, ev.rel, phaseU(ev.t0, ev.at, abs));
      return state(a.pose, n, { lock: ramp(a.sPath, a.sq - 0.1, a.sq + 0.12, EASE.inOut), lockE: ev.e, opacity: fade });
    }
    if (abs < snip) {
      const strain = ramp(abs, snip - 8, snip, EASE.in);
      return state(docked, n, { breakLink: mouthLink, strain, lock: 1, lockE: ev.e, opacity: fade });
    }
    // after the snip: the leftover chain (n − 2 rings) backs out of the pocket as one rigid piece and
    // steps aside, then (from snip + BACK_T) relaxes back into the crowd via its drift offset
    return state(leftoverPose(e, n, ev.rel, ev.side, snip, abs), n - 2, {
      lock: 1 - ramp(abs, snip, snip + 12, EASE.out),
      lockE: ev.e,
      opacity: fade,
    });
  }
  if (EMPTY[i].some(([a, b]) => abs >= a && abs < b)) return state(driftPose(i, abs), n, { opacity: 0 });
  return state(driftPose(i, abs), n, { opacity: fadeInOf(i, abs) });
};

/** A short-lived maltose (2 rings) leaving an enzyme: drawn on its own, then fading out of the field of view. */
export type ProductState = {
  rings: RingXY[];
  glow: number;
  opacity: number;
  seed: string;
  born: number;
  lock: number;
  lockE: number;
  pivot: [number, number];
};

const keepInView = (x: number, y: number): [number, number] => {
  const dx = x - LENS_WC[0];
  const dy = y - LENS_WC[1];
  const dl = Math.hypot(dx, dy);
  const R = 560;
  if (dl > R) {
    // soft limit: ease towards the rim instead of stopping dead
    const over = dl - R;
    const k = (R + 40 * Math.tanh(over / 40)) / dl;
    x = LENS_WC[0] + dx * k;
    y = LENS_WC[1] + dy * k;
  }
  return [Math.max(140, Math.min(1780, x)), Math.max(140, Math.min(940, y))];
};

/**
 * Nudge a free maltose (2 rings at pose p) so it slides past the starch chains around it (and `extra`)
 * instead of through them. k (0..1) scales it in once the maltose is out of the pocket.
 */
const clearOfChains = (p: Pose, abs: number, k: number, extra: Pose | null = null): Pose => {
  if (k <= 0) return p;
  const h2 = (SPACING * MOL_S) / 2;
  const others: { pose: Pose; h: number; w: number }[] = [];
  for (let i = 0; i < SUB.length; i++) {
    const st = substrateState(i, abs);
    // (weighted by opacity, so a chain fading in or out never switches the push on or off in one frame)
    if (st.opacity > 0.01) others.push({ pose: st.pose, h: ((st.n - 1) / 2) * SPACING * MOL_S, w: smooth(st.opacity) });
  }
  if (extra) others.push({ pose: extra, h: h2, w: 1 });
  let px = 0;
  let py = 0;
  for (const o of others) {
    const q = segClosest(p, o.pose, h2, o.h);
    const d = Math.hypot(q.ax - q.bx, q.ay - q.by);
    const pen = softPush(2 * RING_R + CLEAR_S + SOFT - d);
    if (pen <= 0) continue;
    const cx = p.x - o.pose.x;
    const cy = p.y - o.pose.y;
    const cl = Math.hypot(cx, cy) || 1;
    const nx = q.ax - q.bx + (cx / cl) * 14;
    const ny = q.ay - q.by + (cy / cl) * 14;
    const nl = Math.hypot(nx, ny) || 1;
    px += (nx / nl) * pen * o.w;
    py += (ny / nl) * pen * o.w;
  }
  return { x: p.x + px * k, y: p.y + py * k, rot: p.rot };
};

/**
 * Maltose released from the pocket: waits for the leftover chain to clear, slides straight out of the
 * mouth until it is past the lips, only then veers off (to the side the leftover chain didn't take),
 * drifts and fades.
 */
export const productState = (ev: Ev, abs: number): ProductState | null => {
  const snip = ev.at + ev.hold;
  if (abs < snip) return null;
  if (abs >= RESET && ev.at < RESET) return null; // fresh sample
  if (abs > snip + PRODUCT_LIFE + PRODUCT_FADE) return null;
  const e = enzymePose(ev.e, Math.min(abs, snip + PROD_WAIT + PROD_OUT_T));
  const t1 = snip + PROD_WAIT;
  const t2 = t1 + PROD_OUT_T;
  const seed = `m${ev.at}`;
  const raw = productRaw(ev, abs, headOf(ev).prod);
  // once it's out between the lips, it slides past the leftover chain (and anything else) rather than through it
  const cleared = clearOfChains(raw, abs, ramp(abs, t1 + PROD_OUT_T * 0.45, t2, EASE.inOut), ev.n - 2 <= 2 ? remnantPose(ev, abs) : null);
  const [x, y] = keepInView(cleared.x, cleared.y);
  const pose: Pose = { x, y, rot: cleared.rot };
  return {
    rings: layout(pose, 2),
    glow: ramp(abs, snip, snip + 14, EASE.out),
    opacity: 1 - ramp(abs, snip + PRODUCT_LIFE, snip + PRODUCT_LIFE + PRODUCT_FADE, EASE.in),
    seed,
    born: snip,
    lock: 1 - ramp(abs, t1 + 6, t2, EASE.inOut),
    lockE: ev.e,
    pivot: [e.x, e.y],
  };
};

/** Where the remnant maltose of a chain's last dock is (see remnantState). */
const remnantPose = (ev: Ev, abs: number): Pose => {
  const snip = ev.at + ev.hold;
  const cleared = clearOfChains(remnantRaw(ev, abs, headOf(ev).rem), abs, ramp(abs, snip + 4, snip + BACK_T, EASE.inOut));
  const [x, y] = keepInView(cleared.x, cleared.y);
  return { x, y, rot: cleared.rot };
};

/** A chain cut down to maltose by its last dock: it backs out, steps aside, drifts off and fades (its own item). */
export const remnantState = (ev: Ev, abs: number): ProductState | null => {
  if (ev.kind !== "dock" || ev.n - 2 > 2) return null;
  const snip = ev.at + ev.hold;
  if (abs < snip) return null;
  if (abs >= RESET && ev.at < RESET) return null;
  if (abs > snip + PRODUCT_LIFE + PRODUCT_FADE + 10) return null;
  const e = enzymePose(ev.e, Math.min(abs, snip + BACK_T));
  const seed = `r${ev.at}`;
  const pose = remnantPose(ev, abs);
  return {
    rings: layout(pose, 2),
    glow: ramp(abs, snip, snip + 16, EASE.out),
    opacity: 1 - ramp(abs, snip + PRODUCT_LIFE + 10, snip + PRODUCT_LIFE + PRODUCT_FADE + 10, EASE.in),
    seed,
    born: snip,
    lock: 1 - ramp(abs, snip, snip + 12, EASE.out),
    lockE: ev.e,
    pivot: [e.x, e.y],
  };
};

/**
 * Second look at each maltose's way out, now that every collision is planned: the planner chose it before
 * later approaches existed, so pick again (if clearly better) the heading that stays clearest of every
 * chain as it really moves (approaches and fresh chains included) and of the other maltose.
 */
{
  const ringsMin = (a: readonly RingXY[], b: readonly RingXY[]) => {
    let m = 1e9;
    for (const p of a) for (const q of b) m = Math.min(m, Math.hypot(p.x - q.x, p.y - q.y));
    return m;
  };
  const others = (f: number, skip: Ev) => {
    const out: RingXY[][] = [];
    for (let i = 0; i < SUB.length; i++) {
      const st = substrateState(i, f);
      if (st.opacity > 0.3) out.push(st.rings);
    }
    for (const d of DOCKS) {
      if (d === skip) continue;
      const sn = d.at + d.hold;
      if (f < sn || f > sn + PRODUCT_LIFE + PRODUCT_FADE - 8 || (f >= RESET && d.at < RESET)) continue;
      const h = headOf(d);
      out.push(layout(productRaw(d, f, h.prod), 2));
      if (d.n - 2 <= 2) out.push(layout(remnantRaw(d, f, h.rem), 2));
    }
    return out;
  };
  const clearance = (poseAt: (f: number) => Pose, from: number, to: number, skip: Ev, extra: ((f: number) => RingXY[]) | null) => {
    let m = 90;
    let out = 0;
    for (let f = from; f <= to; f += 2) {
      const p = poseAt(f);
      const r = layout(p, 2);
      for (const o of others(f, skip)) m = Math.min(m, ringsMin(r, o));
      if (extra) m = Math.min(m, ringsMin(r, extra(f)));
      out = Math.max(out, Math.hypot(p.x - LENS_WC[0], p.y - LENS_WC[1]) - 520);
    }
    return m - Math.max(0, out) * 0.5;
  };
  for (const ev of DOCKS) {
    const snip = ev.at + ev.hold;
    const end = snip + PRODUCT_LIFE + PRODUCT_FADE - 8;
    const final = ev.n - 2 <= 2;
    const h0 = headOf(ev);
    let rem = h0.rem;
    if (final) {
      const sc = (head: number) => clearance((f) => remnantRaw(ev, f, head), snip + BACK_T, end + 10, ev, null);
      let best = sc(rem) + 3;
      for (const a of [20, 35, 50, 65, 80]) {
        const v = sc(-ev.side * a);
        if (v > best) {
          best = v;
          rem = -ev.side * a;
        }
      }
    }
    const extra = final ? (f: number) => layout(remnantRaw(ev, f, rem), 2) : null;
    const sc = (head: number) => clearance((f) => productRaw(ev, f, head), snip + PROD_WAIT + PROD_OUT_T - 6, end, ev, extra);
    let prod = h0.prod;
    let best = sc(prod) + 3;
    for (const a of [-80, -60, -40, -20, 20, 40, 60, 80]) {
      const v = sc(ev.side * a);
      if (v > best) {
        best = v;
        prod = ev.side * a;
      }
    }
    HEAD.set(ev.at, { prod, rem });
  }
}

/** Flash for every contact: where, how big, how far through (0..1). */
export const flashes = (abs: number) =>
  EVENTS.flatMap((ev) => {
    const out: { x: number; y: number; p: number; kind: "bump" | "dock" | "snip"; energy: number }[] = [];
    const span = 14;
    if (ev.kind === "bounce" && abs >= ev.at && abs < ev.at + span) {
      const e = enzymePose(ev.e, ev.at);
      const s0 = driftPose(ev.s, ev.t0);
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
