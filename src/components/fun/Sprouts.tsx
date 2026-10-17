/**
 * Cartoon leaves and sprouts for the v2 "worlds" look (meadow, soil, title cards): outlined like
 * Chloro (dark green line, soft gradient, a gloss highlight), so plants and mascot read as one family.
 * SVG in the caller's coordinates; frame-driven via `grow` / `progress`.
 */
import React from "react";
import { C, EASE, W2 } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { mix } from "../kit/shared";

type Pt = readonly [number, number];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.4;
  const x = clamp01(t) - 1;
  return 1 + (c1 + 1) * x * x * x + c1 * x * x;
};

/**
 * One leaf. (x, y) = where the blade meets its stalk; `angle` = direction base → tip (degrees,
 * 0 = right, −90 = up); `grow` 0..1 unfurls it from the base.
 */
export const CartoonLeaf: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly angle?: number;
  readonly len?: number;
  readonly wid?: number;
  readonly grow?: number;
  readonly tone?: "fresh" | "deep";
  readonly veins?: boolean;
}> = ({ x, y, angle = -60, len = 140, wid = 70, grow = 1, tone = "fresh", veins = true }) => {
  const id = useSvgId("cleaf");
  if (grow <= 0) return null;
  const s = back(grow);
  const h = wid / 2;
  const d = `M0,0 C${len * 0.18},${-h * 1.15} ${len * 0.66},${-h * 1.05} ${len},0 C${len * 0.66},${h * 1.05} ${len * 0.18},${h * 1.15} 0,0 Z`;
  const [lt, mid, dp] = tone === "fresh" ? [W2.chloroLight, C.leaf, C.leafDeep] : [C.leaf, C.leafDeep, C.leafDark];
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`} opacity={Math.min(1, grow * 3)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={lt} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={dp} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id}-g)`} stroke={W2.chloroLine} strokeWidth={4.5} strokeLinejoin="round" />
      {veins ? (
        <g stroke={mix(lt, "#FFFFFF", 0.3)} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.55}>
          <path d={`M${len * 0.06},0 Q${len * 0.5},${-h * 0.06} ${len * 0.9},0`} />
          {[0.34, 0.58].map((t) => (
            <g key={t}>
              <path d={`M${len * t},${-h * 0.02} Q${len * (t + 0.08)},${-h * 0.4} ${len * (t + 0.16)},${-h * 0.62}`} />
              <path d={`M${len * t},${h * 0.02} Q${len * (t + 0.08)},${h * 0.4} ${len * (t + 0.16)},${h * 0.62}`} />
            </g>
          ))}
        </g>
      ) : null}
      <ellipse cx={len * 0.34} cy={-h * 0.45} rx={len * 0.13} ry={h * 0.16} fill="#FFFFFF" opacity={0.4} transform={`rotate(-12 ${len * 0.34} ${-h * 0.45})`} />
    </g>
  );
};

/**
 * A sprout: a curving stem that grows up from (x, y) and opens alternate leaves as it goes.
 * `progress` 0..1 grows it; `sway` (degrees) bends the whole plant from its base (wind).
 */
export const LeafSprout: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly h?: number;
  readonly lean?: number;
  readonly leaves?: number;
  readonly leafLen?: number;
  readonly progress?: number;
  readonly sway?: number;
  readonly flip?: boolean;
}> = ({ x, y, h = 300, lean = 0.12, leaves = 4, leafLen = 130, progress = 1, sway = 0, flip = false }) => {
  if (progress <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const dir = flip ? -1 : 1;
  const top: Pt = [dir * h * lean, -h];
  const c1: Pt = [dir * h * lean * -0.4, -h * 0.4];
  const c2: Pt = [dir * h * lean * 1.4, -h * 0.72];
  const at = (t: number): Pt => {
    const u = 1 - t;
    return [3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * top[0], 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * top[1]];
  };
  const stem = `M0,0 C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${top[0]},${top[1]}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${sway})`}>
      <path d={stem} fill="none" stroke={W2.chloroLine} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1.01`} />
      <path d={stem} fill="none" stroke={C.stem} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1.01`} />
      {Array.from({ length: leaves }, (_, i) => {
        const t = 0.32 + (i / Math.max(1, leaves - 1)) * 0.68;
        const grow = clamp01((p - t * 0.9) / 0.25);
        const side = i % 2 ? -1 : 1;
        const at0 = at(Math.min(t, 0.99));
        const isTop = i === leaves - 1;
        const ang = isTop ? -90 + dir * 18 : -90 + side * (52 - t * 14);
        const len = leafLen * (isTop ? 0.8 : 1 - t * 0.25);
        return <CartoonLeaf key={i} x={at0[0]} y={at0[1]} angle={ang} len={len} wid={len * 0.54} grow={grow} tone={i % 2 ? "deep" : "fresh"} />;
      })}
    </g>
  );
};
