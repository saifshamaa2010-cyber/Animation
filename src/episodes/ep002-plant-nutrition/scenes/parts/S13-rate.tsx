/**
 * S13 helpers: the rate-of-photosynthesis apparatus (pondweed in a beaker, lamp + ruler, funnel →
 * gas syringe) and the deterministic bubble / photon schedules. The bubble rate is computed from the
 * lamp's distance (light intensity ∝ 1 / distance²), so the animation itself shows the relationship.
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { LitShape, mix } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { Pt, rng } from "../../../../lib/geometry";
import { prog } from "../../../../lib/motion";
import { track } from "../../../../lib/track";
import { useSvgId } from "../../../../components/ids";
import type { s13Timing } from "../S13RateMethod.timing";

type K = ReturnType<typeof s13Timing>;

// ------------------------------------------------------------------ layout
export const BENCH_Y = 850;
export const BEAKER = { x: 1000, y: BENCH_Y, w: 300, h: 400, liquid: 0.8 } as const;
export const SURFACE_Y = BEAKER.y - BEAKER.h * BEAKER.liquid; // 530
export const WEED = { x: 992, y: 832, len: 180 } as const;
export const TIP: Pt = [WEED.x + WEED.len * 0.04, WEED.y - WEED.len]; // the cut end (= pondweedTip)
/** inverted funnel over the pondweed, its stem leading to the gas syringe */
export const FUNNEL = { mouthY: 744, mouthHalf: 84, neckY: 568, neckHalf: 10, x: TIP[0], tubeY: 404 } as const;
export const SYRINGE = { x: 1180, y: FUNNEL.tubeY, length: 420 } as const;
export const LAMP_Y = 602;
export const LAMP_X = { far: 320, mid: 500, close: 700, next: 560 } as const;
export const RULER = { x: 250, y: 866, length: 750, step: 37.5 } as const;
export const THERMO = { x: 1118, top: 462, bulbY: 598 } as const;
/** right-hand column for counters, labels and the method steps */
export const COL_X = 1250;
export const WATER = mix(C.iceDeep, C.ink700, 0.45);

// ------------------------------------------------------------------ lamp position and light
export const lampX = (f: number, k: K) => {
  const mv = (a: number, b: number, max: number) => Math.min(max, Math.max(10, b - a - 2));
  return track(f, [
    [k.closer1 - 4, LAMP_X.mid],
    [k.closer1 - 4 + mv(k.closer1, k.further, 26), LAMP_X.close, EASE.inOut],
    [k.further - 2, LAMP_X.close],
    [k.further - 2 + mv(k.further, k.closer2, 34), LAMP_X.far, EASE.inOut],
    [k.closer2 - 2, LAMP_X.far],
    [k.closer2 - 2 + 46, LAMP_X.close, EASE.inOut],
    [k.newDistance - 4, LAMP_X.close],
    [k.newDistance - 4 + 30, LAMP_X.next, EASE.inOut],
  ]);
};
export const lampOn = (f: number, k: K) => prog(f, k.light - 4, 12);
/** light intensity at the plant, relative to the mid distance (∝ 1 / distance²) */
export const intensity = (x: number) => ((BEAKER.x - LAMP_X.mid) / (BEAKER.x - x)) ** 2;

// ------------------------------------------------------------------ deterministic schedules
export type BubbleEv = { readonly e: number; readonly r: number; readonly speed: number; readonly drift: number; readonly funnel: boolean; readonly seed: number };
export type Schedule = {
  readonly bubbles: readonly BubbleEv[];
  readonly photons: readonly { readonly e: number; readonly dy: number; readonly to: Pt }[];
  /** smoothed bubble rate per frame (index = scene frame) */
  readonly rate: Float32Array;
};

const cache = new Map<string, Schedule>();

/** Bubbles: rate follows the light intensity (the plant takes a little while to adjust after each move). */
export const schedule = (k: K, funnelReady: number): Schedule => {
  const key = JSON.stringify(k) + funnelReady;
  const hit = cache.get(key);
  if (hit) return hit;
  const n = Math.max(1, k.end + 2);
  const rate = new Float32Array(n);
  const bubbles: BubbleEv[] = [];
  const photons: { e: number; dy: number; to: Pt }[] = [];
  const rb = rng(1307);
  const rp = rng(4411);
  let r = 0;
  let phase = 0.999;
  let pPhase = 0.6;
  for (let f = 0; f < n; f++) {
    const on = lampOn(f, k);
    const I = intensity(lampX(f, k));
    const target = f >= k.gives ? on * Math.min(0.15, 0.05 * I) : 0;
    // after "At each new distance" the plant needs time to adjust → slower response
    const tau = f >= k.newDistance ? 44 : 9;
    r += (target - r) / tau;
    if (f === k.gives) r = target; // the first bubble comes on the word
    rate[f] = r;
    phase += r;
    if (phase >= 1) {
      phase -= 1;
      const rad = 6.5 + rb() * 8;
      bubbles.push({ e: f, r: rad, speed: 2.1 + rad * 0.07, drift: (rb() - 0.5) * 2, funnel: f >= funnelReady, seed: bubbles.length });
    }
    if (on > 0.5) {
      pPhase += 0.1 * I * on;
      if (pPhase >= 1) {
        pPhase -= 1;
        photons.push({ e: f, dy: (rp() - 0.5) * 40, to: [TIP[0] - 34 + rp() * 52, TIP[1] + 10 + rp() * 150] });
      }
    }
  }
  const s = { bubbles, photons, rate };
  cache.set(key, s);
  return s;
};

/** Where a bubble is `age` frames after leaving the cut end, and whether it has reached the end of its path. */
export const bubbleAt = (b: BubbleEv, age: number, funnelPath: readonly Pt[]): { pos: Pt; done: number; inTube: number } => {
  const d = age * b.speed;
  if (!b.funnel) {
    const total = TIP[1] - SURFACE_Y;
    const u = Math.min(1, d / total);
    return { pos: [TIP[0] + b.drift * 6 * Math.sin(u * 3), TIP[1] - total * u], done: d >= total ? (d - total) / (b.speed * 8) : 0, inTube: 0 };
  }
  // up through the funnel and its stem, then along the delivery tube (faster once in the tube)
  let rem = d;
  for (let i = 1; i < funnelPath.length; i++) {
    const a = funnelPath[i - 1];
    const c = funnelPath[i];
    const L = Math.hypot(c[0] - a[0], c[1] - a[1]) / (i >= 2 ? 1.8 : 1);
    if (rem <= L) {
      const u = rem / L;
      return { pos: [a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u], done: 0, inTube: i === 1 ? 0.6 * Math.max(0, (u - 0.8) / 0.2) : i === 2 ? 0.6 + 0.4 * Math.min(1, u * 5) : 1 };
    }
    rem -= L;
  }
  return { pos: funnelPath[funnelPath.length - 1], done: 1 + rem / 10, inTube: 1 };
};

export const FUNNEL_PATH: readonly Pt[] = [TIP, [FUNNEL.x, FUNNEL.neckY], [FUNNEL.x, FUNNEL.tubeY], [SYRINGE.x + 8, FUNNEL.tubeY]];

// ------------------------------------------------------------------ apparatus pieces
/** Inverted glass funnel (in the water over the pondweed); `dy` lowers it into place. */
export const Funnel: React.FC<{ readonly dy: number; readonly progress: number }> = ({ dy, progress }) => {
  if (progress <= 0) return null;
  const { x, mouthY, mouthHalf, neckY, neckHalf, tubeY } = FUNNEL;
  const d = `M${x - mouthHalf},${mouthY + dy} L${x - neckHalf},${neckY + dy} L${x - neckHalf + 2},${tubeY + 40 + dy} L${x + neckHalf - 2},${tubeY + 40 + dy} L${x + neckHalf},${neckY + dy} L${x + mouthHalf},${mouthY + dy}`;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <path d={`${d} Z`} fill={C.glass} fillOpacity={0.08} stroke="none" />
      <path d={d} fill="none" stroke={C.paper} strokeOpacity={0.78} strokeWidth={4} strokeLinejoin="round" />
      <line x1={x - mouthHalf + 16} y1={mouthY + dy - 8} x2={x - neckHalf - 2} y2={neckY + dy + 10} stroke={C.paper} strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** Delivery tube from the funnel stem to the gas syringe; draws on with `p`. */
export const DeliveryTube: React.FC<{ readonly p: number }> = ({ p }) => {
  if (p <= 0) return null;
  const { x, tubeY } = FUNNEL;
  const d = `M${x},${tubeY + 44} L${x},${tubeY + 18} Q${x},${tubeY} ${x + 18},${tubeY} L${SYRINGE.x},${tubeY}`;
  return (
    <g>
      <path d={d} fill="none" stroke={C.paper} strokeOpacity={0.7} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      <path d={d} fill="none" stroke={mix(C.ink800, C.glass, 0.25)} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    </g>
  );
};

/** A thermometer standing in the beaker (no numbers: it only has to show "kept the same"). */
export const BeakerThermometer: React.FC<{ readonly dy: number; readonly progress: number; readonly glow: number }> = ({ dy, progress, glow }) => {
  const id = useSvgId("bthermo");
  if (progress <= 0) return null;
  const { x, top, bulbY } = THERMO;
  const col = C.paperDim;
  return (
    <g opacity={Math.min(1, progress * 1.5)} transform={`translate(0 ${dy})`}>
      <defs>
        <filter id={`${id}-g`} x="-200%" y="-50%" width="500%" height="200%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {glow > 0.01 ? <rect x={x - 22} y={top + 40} width={44} height={bulbY - top - 10} rx={22} fill={C.paper} opacity={0.35 * glow} filter={`url(#${id}-g)`} /> : null}
      <rect x={x - 10} y={top} width={20} height={bulbY - top} rx={10} fill={C.ink800} fillOpacity={0.6} stroke={C.paper} strokeOpacity={0.7} strokeWidth={3} />
      <circle cx={x} cy={bulbY + 6} r={15} fill={col} stroke={C.paper} strokeOpacity={0.7} strokeWidth={3} />
      <rect x={x - 4} y={top + 70} width={8} height={bulbY - top - 66} rx={4} fill={col} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={x + 10} x2={x + 2} y1={top + 30 + i * 36} y2={top + 30 + i * 36} stroke={C.paper} strokeOpacity={0.5} strokeWidth={2} />
      ))}
    </g>
  );
};

/** A spatula tipping a little white powder (sodium hydrogencarbonate) into the water. */
export const Spatula: React.FC<{ readonly f: number; readonly start: number; readonly leave: number }> = ({ f, start, leave }) => {
  const inP = prog(f, start - 14, 16);
  const outP = prog(f, leave, 16, EASE.in);
  if (inP <= 0 || outP >= 1) return null;
  const tilt = 14 * prog(f, start + 4, 14, EASE.inOut);
  const tip: Pt = [952, 418];
  const r = rng(77);
  const grains = Array.from({ length: 12 }, (_, i) => ({ i, d: r() * 3, x: (r() - 0.5) * 16, vx: (r() - 0.5) * 1.5 }));
  const pour = start + 10;
  return (
    <g opacity={inP * (1 - outP)}>
      <g transform={`translate(${(1 - EASE.out(inP)) * -40 - outP * 60} ${-outP * 30}) rotate(${tilt} ${tip[0]} ${tip[1]})`}>
        <LitShape d={roundRectPath(tip[0] - 210, tip[1] - 12, 160, 20, 9)} top={C.ink300} bottom={C.ink500} rimOpacity={0.5} shadow={0.3} />
        <LitShape
          d={`M${tip[0] - 60},${tip[1] - 16} L${tip[0] + 6},${tip[1] - 14} Q${tip[0] + 18},${tip[1] - 4} ${tip[0] + 6},${tip[1] + 8} L${tip[0] - 60},${tip[1] + 10} Z`}
          top={C.paperDim}
          bottom={C.ink400}
          rimOpacity={0.6}
          shadow={0.3}
        />
        {prog(f, pour, 20) < 1 ? <ellipse cx={tip[0] - 26} cy={tip[1] - 16} rx={26 * (1 - prog(f, pour, 20))} ry={8 * (1 - prog(f, pour, 20))} fill={C.paper} /> : null}
      </g>
      {grains.map(({ i, d, x, vx }) => {
        const e = pour + i * 1.6 + d;
        const age = f - e;
        if (age < 0) return null;
        const x0 = tip[0] + 6 + x;
        const fall = Math.min(SURFACE_Y - tip[1], 0.5 * 0.9 * age * age);
        const inWater = Math.max(0, age - Math.sqrt((2 * (SURFACE_Y - tip[1])) / 0.9));
        const dissolve = Math.min(1, inWater / 22);
        if (dissolve >= 1) return null;
        return <circle key={i} cx={x0 + inWater * vx} cy={tip[1] + fall + inWater * 1.4} r={3.5 * (1 - dissolve * 0.6)} fill={C.paper} opacity={1 - dissolve} />;
      })}
    </g>
  );
};

/** Three repeat readings that merge into their mean. `merge` 0..1. (x, y) = left end of the middle bar. */
export const RepeatBars: React.FC<{ readonly x: number; readonly y: number; readonly p: readonly number[]; readonly merge: number; readonly opacity: number }> = ({ x, y, p, merge, opacity }) => {
  if (opacity <= 0) return null;
  const lens = [318, 372, 342];
  const mean = (lens[0] + lens[1] + lens[2]) / 3;
  const m = EASE.inOut(Math.min(1, Math.max(0, merge)));
  return (
    <g opacity={opacity}>
      {lens.map((L, i) => {
        if (p[i] <= 0) return null;
        const yy = y + (i - 1) * 64 * (1 - m);
        const len = (L + (mean - L) * m) * EASE.out(Math.min(1, p[i]));
        const col = mix(C.coral, C.paper, m * 0.85);
        return (
          <g key={i} opacity={Math.min(1, p[i] * 2) * (i === 1 ? 1 : 1 - m * 0.999)}>
            <text x={x - 22} y={yy + 14} textAnchor="end" fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.ink300} opacity={1 - m}>
              {i + 1}
            </text>
            <LitShape d={roundRectPath(x, yy - 18, Math.max(36, len), 36, 12)} top={mix(col, C.paper, 0.2)} bottom={mix(col, C.ink700, 0.25)} rimOpacity={0.5} shadow={0.35} />
          </g>
        );
      })}
    </g>
  );
};
export const REPEAT_MEAN_LEN = (318 + 372 + 342) / 3;
