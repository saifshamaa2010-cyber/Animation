/**
 * S14 (and S15) helpers: the qualitative rate curves, the generic substrate drawn to fit the EP001
 * enzyme's active site, the exam-command chips, and the deterministic enzyme-collision schedule.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { LitShape, mix, textWidth } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { DOCK, HEX_R } from "../../../../components/molecule-geometry";
import { Pt, hexPoints, roundedPolygon } from "../../../../lib/geometry";
import { prog } from "../../../../lib/motion";
import { track } from "../../../../lib/track";
import type { s14Timing } from "../S14RateResults.timing";

// ------------------------------------------------------------------ the curves (y in 0..1)
/** Smooth minimum: a straight rise, a rounded knee, then flat (the textbook "rises then levels off"). */
const softMin = (a: number, b: number, e = 0.003) => (a + b - Math.sqrt((a - b) ** 2 + e)) / 2;
export const LIGHT_SLOPE = 0.165;
export const LIGHT_PLATEAU = 0.62;
export const lightCurve = (x: number) => softMin(LIGHT_SLOPE * x, LIGHT_PLATEAU);
/** the same experiment at a higher carbon dioxide concentration (S15): same start, higher plateau */
export const lightCurveHighCo2 = (x: number) => softMin(LIGHT_SLOPE * x, 0.9);
export const co2Curve = (x: number) => softMin(0.15 * x, 0.6);
export const TEMP_OPT = 30;
export const tempCurve = (t: number) => 0.86 * Math.exp(-(((t - TEMP_OPT) / (t < TEMP_OPT ? 15 : 6.5)) ** 2));

// ------------------------------------------------------------------ substrate (fits the EP001 pocket)
const HEX_D = roundedPolygon(hexPoints(HEX_R), 6);
/** Ring centres of a docked two-ring substrate, in enzyme coordinates (scale 1, rotation 0). */
export const SUB_RINGS = [DOCK.inner, DOCK.outer] as const;
/** centre of the two-ring substrate when docked (enzyme coordinates) */
export const SUB_DOCK: Pt = [(DOCK.inner[0] + DOCK.outer[0]) / 2, 0];
const HALF = (DOCK.inner[0] - DOCK.outer[0]) / 2; // 40

/**
 * A generic two-ring substrate in the inputs' ice blue (so it reads as "a reactant", not a sugar).
 * `product` 0..1 turns it amber (after an effective collision it has been changed into product).
 * (x, y) = centre, `rot` in degrees.
 */
export const Substrate: React.FC<{ readonly x: number; readonly y: number; readonly rot?: number; readonly product?: number; readonly opacity?: number; readonly flash?: number }> = ({
  x,
  y,
  rot = 0,
  product = 0,
  opacity = 1,
  flash = 0,
}) => {
  if (opacity <= 0) return null;
  const top = mix(mix(C.ice, C.paper, 0.35), C.amberLight, product);
  const bottom = mix(C.iceDeep, C.amber, product);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
      {flash > 0.01 ? <circle r={70 + 40 * flash} fill="none" stroke={C.paper} strokeOpacity={0.6 * (1 - flash)} strokeWidth={5} /> : null}
      <line x1={-HALF} y1={0} x2={HALF} y2={0} stroke={mix(bottom, C.paper, 0.3)} strokeWidth={8} strokeLinecap="round" />
      {[-HALF, HALF].map((dx) => (
        <g key={dx} transform={`translate(${dx} 0)`}>
          <LitShape d={HEX_D} top={top} bottom={bottom} rimOpacity={0.7} shadow={0.35} shadowDy={6} shadowBlur={6} />
        </g>
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ exam-command chip
/** "describe → what happens + numbers": the command word in amber, its meaning in paper. (x, y) = centre. */
export const CommandChip: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly word: string;
  readonly meaning: string;
  readonly progress: number;
  readonly meaningP?: number;
  readonly opacity?: number;
}> = ({ x, y, word, meaning, progress, meaningP = 1, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const size = 46;
  const ww = textWidth(word, size, 700);
  const arrow = 64;
  const mw = textWidth(meaning, size, 600);
  const w = ww + arrow + mw + 72;
  const h = 84;
  const p = EASE.out(Math.min(1, progress));
  const l = x - w / 2;
  const t = y - h / 2 + (1 - p) * 26;
  return (
    <g opacity={Math.min(1, progress * 2) * opacity}>
      <LitShape d={roundRectPath(l, t, w, h, 22)} top={C.ink700} bottom={C.ink800} rimOpacity={0.5} shadow={0.55} shadowDy={12} shadowBlur={14} />
      <rect x={l + 1.5} y={t + 1.5} width={w - 3} height={h - 3} rx={20.5} fill="none" stroke={C.amber} strokeOpacity={0.55} strokeWidth={3} />
      <text x={l + 36} y={t + 58} fontFamily={FONT} fontWeight={700} fontSize={size} fill={C.amber} letterSpacing={-0.5}>
        {word}
      </text>
      <g opacity={meaningP}>
        <path
          d={`M${l + 36 + ww + 16},${t + h / 2} L${l + 36 + ww + arrow - 18},${t + h / 2} M${l + 36 + ww + arrow - 30},${t + h / 2 - 12} L${l + 36 + ww + arrow - 18},${t + h / 2} L${l + 36 + ww + arrow - 30},${t + h / 2 + 12}`}
          fill="none"
          stroke={C.ink300}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x={l + 36 + ww + arrow} y={t + 58} fontFamily={FONT} fontWeight={600} fontSize={size} fill={C.paper} letterSpacing={-0.5}>
          {meaning}
        </text>
      </g>
    </g>
  );
};
export const commandChipWidth = (word: string, meaning: string) => textWidth(word, 46, 700) + 64 + textWidth(meaning, 46, 600) + 72;

// ------------------------------------------------------------------ the enzyme panel's timeline
type K = ReturnType<typeof s14Timing>;

export const ENZ = { x: 820, y: 540, s: 1 } as const;
/** where a substrate waits at the mouth before sliding into the pocket (screen) */
export const MOUTH: Pt = [ENZ.x - 250, ENZ.y];
export const HOMES: readonly Pt[] = [
  [300, 420],
  [290, 660],
  [450, 830],
  [520, 250],
];

/** Temperature of the scene (°C): cool, raised towards the optimum, then past it. */
export const temperatureAt = (f: number, k: K) =>
  track(f, [
    [k.raising - 2, 12],
    [Math.max(k.raising + 40, k.collisions + 10), 28, EASE.inOut],
    [k.optimum3 - 4, 28],
    [k.optimum3 - 4 + Math.max(40, Math.min(90, k.denaturedWord - k.optimum3 + 30)), 42, EASE.inOut],
  ]);

export type DockEv = { readonly at: number; readonly sub: number };
export const DOCK_IN = 12; // frames from the mouth into the pocket
export const BOUND = 12; // frames bound (the reaction)
export const LEAVE = 26; // product leaves
export const RESPAWN = 16;

type Sched = { readonly phase: Float32Array; readonly docks: readonly DockEv[] };
const cache = new Map<string, Sched>();

/** Wander phase (∝ ∫ speed dt, so faster molecules at higher temperature) and the docking events. */
export const enzymeSchedule = (k: K): Sched => {
  const key = JSON.stringify(k);
  const hit = cache.get(key);
  if (hit) return hit;
  const n = Math.max(1, k.end + 2);
  const phase = new Float32Array(n);
  let ph = 0;
  for (let f = 0; f < n; f++) {
    const T = temperatureAt(f, k);
    ph += 0.006 + 0.0011 * (T - 8);
    phase[f] = ph;
  }
  const docks: DockEv[] = [];
  // the first one lands on "catalysed"
  let t = k.catalysed - DOCK_IN - 18;
  let sub = 0;
  const stop = k.above - DOCK_IN - BOUND - 18;
  while (t < stop) {
    docks.push({ at: t, sub });
    sub = (sub + 1) % 3; // substrate 3 never docks: the "kinetic energy" label follows it
    const T = temperatureAt(t, k);
    const gap = T < 13 ? 90 : 90 - (62 * (T - 12)) / 16; // 90 frames when cool → ~28 near the optimum
    t += Math.max(t < k.raising ? Math.max(gap, k.raising + 6 - t) : gap, DOCK_IN + BOUND + 18 + 2);
  }
  const s = { phase, docks };
  cache.set(key, s);
  return s;
};

/** Free (wandering) position of substrate i at frame f. */
export const wanderAt = (i: number, f: number, k: K, phase: Float32Array): { pos: Pt; rot: number } => {
  const T = temperatureAt(f, k);
  const amp = 26 + 2.4 * (T - 12);
  const p = phase[Math.max(0, Math.min(phase.length - 1, Math.round(f)))];
  const [hx, hy] = HOMES[i];
  return {
    pos: [hx + noise2D(`s14w${i}x`, p, 0) * amp, hy + noise2D(`s14w${i}y`, p, 5) * amp],
    rot: noise2D(`s14w${i}r`, p * 0.7, 9) * 70,
  };
};

export const enterP = (f: number, at: number) => prog(f, at, 18, EASE.inOut);
