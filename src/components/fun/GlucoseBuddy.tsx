/**
 * Glucose as a little glowing character (EP002 v2 "worlds" look): a rounded amber hexagon (the glucose
 * ring) with an inner ring highlight, a soft glow when it holds freshly stored energy, and an optional
 * face. Reusable wherever glucose is made, moved or stored (photosynthesis, respiration, starch).
 * SVG in the caller's coordinates; everything is driven by props (no CSS animation).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, W2 } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { mix } from "../kit/shared";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c1 + 1) * x * x * x + c1 * x * x;
};

/** Rounded pointy-top hexagon path of radius r centred on (0, 0). */
export const hexPath = (r: number, round = 0.22) => {
  const v = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  });
  const lerp = (a: readonly [number, number], b: readonly [number, number], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let d = "";
  v.forEach((p, i) => {
    const prev = v[(i + 5) % 6];
    const next = v[(i + 1) % 6];
    const a = lerp(p, prev, round);
    const b = lerp(p, next, round);
    d += `${i ? "L" : "M"}${a[0].toFixed(1)},${a[1].toFixed(1)} Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} `;
  });
  return `${d}Z`;
};

export const GlucoseBuddy: React.FC<{
  readonly x: number;
  readonly y: number;
  /** hexagon radius in px */
  readonly r?: number;
  /** 0..1 pops in */
  readonly progress?: number;
  /** 0..1 energy glow (bright centre + halo) */
  readonly lit?: number;
  readonly face?: boolean;
  readonly look?: readonly [number, number];
  readonly rotate?: number;
  readonly opacity?: number;
  readonly seed?: number;
}> = ({ x, y, r = 40, progress = 1, lit = 0, face = true, look = [0, 0], rotate = 0, opacity = 1, seed = 0 }) => {
  const id = useSvgId("glcb");
  const f = useCurrentFrame();
  if (progress <= 0 || opacity <= 0) return null;
  const s = back(progress);
  const L = clamp01(lit);
  const blink = (f + seed * 29) % 97 < 4;
  const ex = r * 0.27;
  const ey = r * 0.02;
  const lx = look[0] * r * 0.04;
  const ly = look[1] * r * 0.04;
  return (
    <g opacity={Math.min(1, progress * 2.5) * opacity} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <defs>
        <radialGradient id={`${id}-f`} cx="0.42" cy="0.36" r="0.7">
          <stop offset="0" stopColor={mix(C.amberLight, "#FFFFFF", 0.35 + 0.5 * L)} />
          <stop offset="0.55" stopColor={mix(C.sun, "#FFFFFF", 0.25 * L)} />
          <stop offset="1" stopColor={C.amber} />
        </radialGradient>
        <filter id={`${id}-g`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={r * 0.32} />
        </filter>
      </defs>
      {/* halo: the stored energy */}
      <path d={hexPath(r * 1.3)} fill={C.sun} opacity={0.25 + 0.6 * L} filter={`url(#${id}-g)`} />
      {/* contact shadow */}
      <path d={hexPath(r)} fill="#000000" opacity={0.18} transform={`translate(${r * 0.06} ${r * 0.12})`} />
      <path d={hexPath(r)} fill={`url(#${id}-f)`} stroke={C.amberDeep} strokeWidth={Math.max(3, r * 0.1)} strokeLinejoin="round" />
      {/* inner ring line */}
      <path d={hexPath(r * 0.66, 0.26)} fill="none" stroke="#FFFFFF" strokeOpacity={0.45 + 0.35 * L} strokeWidth={Math.max(2, r * 0.06)} />
      {/* gloss */}
      <ellipse cx={-r * 0.36} cy={-r * 0.5} rx={r * 0.2} ry={r * 0.09} fill="#FFFFFF" opacity={0.7} transform={`rotate(-32 ${-r * 0.36} ${-r * 0.5})`} />
      {face ? (
        <g>
          {blink ? (
            <g stroke={W2.inkText} strokeWidth={r * 0.07} strokeLinecap="round" fill="none">
              <path d={`M${-ex - r * 0.09},${ey} Q${-ex},${ey + r * 0.06} ${-ex + r * 0.09},${ey}`} />
              <path d={`M${ex - r * 0.09},${ey} Q${ex},${ey + r * 0.06} ${ex + r * 0.09},${ey}`} />
            </g>
          ) : (
            <g>
              <ellipse cx={-ex + lx} cy={ey + ly} rx={r * 0.085} ry={r * 0.12} fill={W2.inkText} />
              <ellipse cx={ex + lx} cy={ey + ly} rx={r * 0.085} ry={r * 0.12} fill={W2.inkText} />
              <circle cx={-ex + lx - r * 0.03} cy={ey + ly - r * 0.05} r={r * 0.035} fill="#FFFFFF" />
              <circle cx={ex + lx - r * 0.03} cy={ey + ly - r * 0.05} r={r * 0.035} fill="#FFFFFF" />
            </g>
          )}
          <ellipse cx={-r * 0.46} cy={r * 0.2} rx={r * 0.12} ry={r * 0.07} fill={W2.cheek} opacity={0.6} />
          <ellipse cx={r * 0.46} cy={r * 0.2} rx={r * 0.12} ry={r * 0.07} fill={W2.cheek} opacity={0.6} />
          <path
            d={`M${-r * 0.14},${r * 0.2} Q0,${r * (0.34 + 0.08 * L)} ${r * 0.14},${r * 0.2}`}
            fill={L > 0.4 ? "#4A1D2B" : "none"}
            stroke={W2.inkText}
            strokeWidth={r * 0.065}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : null}
    </g>
  );
};
