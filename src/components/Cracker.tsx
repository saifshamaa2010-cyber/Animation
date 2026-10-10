import React from "react";
import { C } from "../brand/tokens";
import { rng, roundedPolygon } from "../lib/geometry";
import { useSvgId } from "./ids";

export type CrackerProps = {
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly rotate?: number;
  /** 0..3 — how many bites are gone (fractional = the bite in progress). */
  readonly bites?: number;
  /** 0..1 warm "sweet" glow. */
  readonly glow?: number;
  readonly opacity?: number;
};

// Bite centres (relative to cracker size, from the top-right corner inward).
const BITES: [number, number, number][] = [
  [0.52, -0.52, 0.3],
  [0.18, -0.6, 0.27],
  [0.6, -0.12, 0.26],
];

/** A plain cracker: baked gradient, docking holes, speckles, optional bites. */
export const Cracker: React.FC<CrackerProps> = ({ x, y, size = 460, rotate = 0, bites = 0, glow = 0, opacity = 1 }) => {
  const id = useSvgId("cracker");
  const s = size;
  const rand = rng(42);
  const speckles = Array.from({ length: 70 }, () => [
    (rand() - 0.5) * s * 0.9,
    (rand() - 0.5) * s * 0.9,
    1.5 + rand() * 2.5,
    rand(),
  ]);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6D9A0" />
          <stop offset="0.6" stopColor="#E3B66E" />
          <stop offset="1" stopColor="#C38A44" />
        </linearGradient>
        <radialGradient id={`${id}-edge`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.62" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#7A4A1C" stopOpacity={0.55} />
        </radialGradient>
        <mask id={`${id}-bites`}>
          <rect x={-s} y={-s} width={s * 2} height={s * 2} fill="white" />
          {BITES.map(([bx, by, br], i) => {
            const p = Math.max(0, Math.min(1, bites - i));
            if (p <= 0) return null;
            return (
              <g key={i}>
                <circle cx={bx * s} cy={by * s} r={br * s * p} fill="black" />
                <circle cx={bx * s - br * s * 0.55} cy={by * s + br * s * 0.5} r={br * s * 0.42 * p} fill="black" />
                <circle cx={bx * s + br * s * 0.5} cy={by * s + br * s * 0.55} r={br * s * 0.4 * p} fill="black" />
              </g>
            );
          })}
        </mask>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      {glow > 0 ? <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={s * 0.09} fill={C.amber} opacity={glow * 0.7} filter={`url(#${id}-glow)`} /> : null}
      <g mask={`url(#${id}-bites)`}>
        <rect x={-s / 2 + 10} y={-s / 2 + 34} width={s} height={s} rx={s * 0.09} fill={C.ink950} opacity={0.55} filter={`url(#${id}-shadow)`} />
        <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={s * 0.09} fill={`url(#${id}-fill)`} />
        <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={s * 0.09} fill={`url(#${id}-edge)`} />
        <rect x={-s / 2 + 6} y={-s / 2 + 6} width={s - 12} height={s - 12} rx={s * 0.08} fill="none" stroke="#FFF1D2" strokeOpacity={0.5} strokeWidth={4} />
        {speckles.map(([sx, sy, r, o], i) => (
          <circle key={i} cx={sx} cy={sy} r={r} fill="#9C6630" opacity={0.25 + o * 0.35} />
        ))}
        {[0, 1, 2, 3].map((gx) =>
          [0, 1, 2, 3].map((gy) => {
            const hx = (-0.3 + gx * 0.2) * s;
            const hy = (-0.3 + gy * 0.2) * s;
            return (
              <g key={`${gx}-${gy}`}>
                <circle cx={hx} cy={hy + 2} r={s * 0.018} fill="#FFF1D2" opacity={0.5} />
                <circle cx={hx} cy={hy} r={s * 0.018} fill="#8A5524" opacity={0.85} />
              </g>
            );
          }),
        )}
      </g>
    </g>
  );
};

/** A loose crumb. */
/**
 * A crumb of the same cracker: same baked gradient, a rim highlight on the upper edge, a soft
 * contact shadow and (on bigger pieces) a docking-hole dot — never a flat outlined polygon.
 * `glow` warms it towards amber as it turns sweet.
 */
export const Crumb: React.FC<{ x: number; y: number; r: number; rot?: number; glow?: number; opacity?: number; seed?: number }> = ({
  x,
  y,
  r,
  rot = 0,
  glow = 0,
  opacity = 1,
  seed = 1,
}) => {
  const id = useSvgId("crumb");
  const rand = rng(seed);
  const ro = (rot * Math.PI) / 180;
  // rotate the outline itself so light (top) and shadow (bottom) stay put as the crumb turns
  const pts: [number, number][] = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + rand() * 0.25 + ro;
    const rr = r * (0.78 + rand() * 0.32);
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
  const d = roundedPolygon(pts, r * 0.22);
  const holeRoll = rand();
  const hole = r > 22 && holeRoll < 0.45 ? [(rand() - 0.5) * r * 0.6, (rand() - 0.5) * r * 0.5] : null;
  const top = glow > 0.01 ? mix("#F6D9A0", C.amberLight, glow) : "#F6D9A0";
  const midC = glow > 0.01 ? mix("#E3B66E", C.amber, glow) : "#E3B66E";
  const low = glow > 0.01 ? mix("#C38A44", C.amberDeep, glow) : "#C38A44";
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.55" stopColor={midC} />
          <stop offset="1" stopColor={low} />
        </linearGradient>
        <linearGradient id={`${id}-rg`} gradientUnits="userSpaceOnUse" x1="0" y1={-r} x2="0" y2={0}>
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-rm`} maskUnits="userSpaceOnUse" x={-r * 2} y={-r * 2} width={r * 4} height={r * 4}>
          <rect x={-r * 2} y={-r * 2} width={r * 4} height={r * 4} fill={`url(#${id}-rg)`} />
        </mask>
      </defs>
      <ellipse cx={r * 0.12} cy={r * 0.72} rx={r * 0.95} ry={r * 0.32} fill={C.ink950} opacity={0.32} />
      <path d={d} fill={`url(#${id}-f)`} />
      <path d={d} fill="none" stroke="#FFF1D2" strokeOpacity={0.6} strokeWidth={Math.max(1.5, r * 0.1)} mask={`url(#${id}-rm)`} />
      {hole ? <circle cx={hole[0]} cy={hole[1]} r={r * 0.11} fill="#8A5524" opacity={0.7} /> : null}
    </g>
  );
};

const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const m = (s: number) => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * t));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};
