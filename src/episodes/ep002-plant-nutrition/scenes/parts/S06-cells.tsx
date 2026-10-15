/**
 * S06: the inside of the leaf as seen through the lens (same cells and chloroplasts as the approved
 * preview): a transparent upper epidermis, then tall palisade cells with chloroplasts lining their
 * walls (the middle of each cell is the vacuole). All in screen coordinates at zoom 1.
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { mix } from "../../../../components/kit";
import { Pt, rng } from "../../../../lib/geometry";
import { LEAF_LENS } from "../layout";

const LENS = LEAF_LENS.lens;

export const CELLS = Array.from({ length: 5 }, (_, i) => ({ x: LENS.cx - 240 + i * 100, y: 352, w: 88, h: 380 }));

export type Chloro = { readonly x: number; readonly y: number; readonly rot: number; readonly cell: number };

export const CHLOROPLASTS: readonly Chloro[] = (() => {
  const r = rng(7);
  const out: Chloro[] = [];
  CELLS.forEach((c, ci) => {
    for (let k = 0; k < 5; k++) {
      const y = c.y + 34 + k * 68 + (r() - 0.5) * 10;
      out.push({ x: c.x + 20 + (r() - 0.5) * 4, y, rot: 80 + (r() - 0.5) * 30, cell: ci });
      out.push({ x: c.x + c.w - 20 + (r() - 0.5) * 4, y: y + 22, rot: 95 + (r() - 0.5) * 30, cell: ci });
    }
  });
  return out;
})();

/** Chloroplasts we can see through the lens at zoom 1. */
export const IN_LENS = CHLOROPLASTS.map((c, i) => ({ c, i })).filter(({ c }) => Math.hypot(c.x - LENS.cx, c.y - LENS.cy) < LENS.r - 26).map(({ i }) => i);

/** The chloroplast we follow when light energy is transferred into glucose. */
export const SYNTH = 25;
/** Where the glucose ring forms (just beside that chloroplast, inside the same cell). */
export const RING_AT: Pt = [CHLOROPLASTS[SYNTH].x - 36, CHLOROPLASTS[SYNTH].y + 54];
/** Zoom focus: halfway between the chloroplast and the ring. */
export const FOCUS: Pt = [(CHLOROPLASTS[SYNTH].x + RING_AT[0]) / 2, (CHLOROPLASTS[SYNTH].y + RING_AT[1]) / 2];

export const ChloroDefs: React.FC<{ readonly gid: string }> = ({ gid }) => (
  <defs>
    <linearGradient id={`${gid}-chl`} x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stopColor={mix(C.chloro, C.leafLight, 0.25)} />
      <stop offset="1" stopColor={C.leafDeep} />
    </linearGradient>
    <filter id={`${gid}-glow`} x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation={8} />
    </filter>
  </defs>
);

/**
 * One chloroplast. `glow` = light energy it has just absorbed (sun yellow); `green` = the
 * chlorophyll highlighted (a brighter green). Thylakoid stacks drawn as three short bars.
 */
export const Chloroplast: React.FC<{ readonly c: Chloro; readonly glow: number; readonly appear: number; readonly green?: number; readonly gid: string }> = ({
  c,
  glow,
  appear,
  green = 0,
  gid,
}) => {
  if (appear <= 0) return null;
  const s = 0.6 + 0.4 * EASE.out(Math.min(1, appear));
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${c.rot}) scale(${s})`} opacity={Math.min(1, appear)}>
      {glow > 0.01 ? <ellipse rx={40} ry={30} fill={C.sun} opacity={0.75 * glow} filter={`url(#${gid}-glow)`} /> : null}
      {green > 0.01 ? <ellipse rx={34} ry={24} fill={C.leaf} opacity={0.55 * green} filter={`url(#${gid}-glow)`} /> : null}
      <ellipse rx={23} ry={13} fill={`url(#${gid}-chl)`} />
      {green > 0.01 ? <ellipse rx={23} ry={13} fill={C.leafLight} opacity={0.35 * green} /> : null}
      <ellipse rx={23} ry={13} fill={mix(C.leafLight, C.sun, 0.35)} opacity={0.7 * glow} />
      {[-10, 0, 10].map((dx) => (
        <line key={dx} x1={dx} y1={-6} x2={dx} y2={6} stroke={C.leafDark} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
      ))}
      <ellipse rx={21.5} ry={11.5} fill="none" stroke={C.leafLight} strokeOpacity={0.55} strokeWidth={1.8} strokeDasharray="0 16 34 200" />
    </g>
  );
};

/** Cuticle, upper epidermis (transparent: light passes straight through) and the palisade cells. */
export const LeafInterior: React.FC<{ readonly p: number }> = ({ p }) => {
  if (p <= 0) return null;
  return (
    <g opacity={Math.min(1, p)}>
      <rect x={LENS.cx - LENS.r} y={286} width={LENS.r * 2} height={8} rx={4} fill={C.paper} opacity={0.22} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={LENS.cx - 330 + i * 96} y={298} width={90} height={44} rx={14} fill={C.paper} opacity={0.07} stroke={C.paper} strokeOpacity={0.28} strokeWidth={2.5} />
      ))}
      {CELLS.map((c, i) => (
        <rect
          key={i}
          x={c.x}
          y={c.y + (1 - EASE.out(Math.min(1, p))) * 10}
          width={c.w}
          height={c.h}
          rx={30}
          fill={mix(C.leafDark, C.ink900, 0.35)}
          stroke={C.leafLight}
          strokeOpacity={0.4}
          strokeWidth={3}
        />
      ))}
    </g>
  );
};
