/**
 * Cartoon "inside the leaf" pieces for the v2 worlds look: a glowing glass lens and a palisade-layer
 * cross-section (waxy cuticle, upper epidermis, tall palisade mesophyll cells with chloroplasts lining
 * their walls, the top of the spongy layer). Glossy, rounded, outlined like the owner's references.
 *
 * Everything inside the lens is drawn in LOCAL coordinates: (0, 0) = the lens centre, designed for a
 * lens radius of 290 (pass `r` and the layer scales with it). Use `palisade(r)` for the positions of the
 * cells and chloroplasts so a scene can aim light at a chloroplast or grow glucose inside a cell.
 */
import React from "react";
import { C, EASE, W2 } from "../../brand/tokens";
import { rng } from "../../lib/geometry";
import { useSvgId } from "../ids";
import { mix } from "../kit/shared";

type Pt = readonly [number, number];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c1 + 1) * x * x * x + c1 * x * x;
};

export type CartoonChloroplast = { readonly x: number; readonly y: number; readonly rot: number; readonly s: number; readonly cell: number };
export type PalisadeCell = { readonly cx: number; readonly top: number; readonly bottom: number; readonly w: number };

/** Layout of the cross-section for a lens of radius r (local coordinates). */
export const palisade = (r = 290) => {
  const k = r / 290;
  const cells: PalisadeCell[] = [-280, -140, 0, 140, 280].map((cx) => ({ cx: cx * k, top: -168 * k, bottom: 176 * k, w: 126 * k }));
  const rnd = rng(23);
  const chloroplasts: CartoonChloroplast[] = [];
  cells.forEach((c, ci) => {
    [-128, -62, 4, 70, 134].forEach((y) => chloroplasts.push({ x: c.cx - 38 * k, y: (y + (rnd() - 0.5) * 8) * k, rot: -6 + (rnd() - 0.5) * 10, s: k * (0.94 + rnd() * 0.12), cell: ci }));
    [-104, -38, 28, 96].forEach((y) => chloroplasts.push({ x: c.cx + 38 * k, y: (y + (rnd() - 0.5) * 8) * k, rot: 6 + (rnd() - 0.5) * 10, s: k * (0.94 + rnd() * 0.12), cell: ci }));
  });
  const epidermis = Array.from({ length: 6 }, (_, i) => ({ x: (-336 + i * 136) * k, y: -228 * k, w: 130 * k, h: 50 * k }));
  const spongy = [
    [-236, 238, 74, 44],
    [-96, 262, 64, 46],
    [36, 234, 72, 42],
    [172, 260, 66, 46],
    [300, 232, 62, 40],
  ].map(([x, y, rx, ry]) => ({ x: x * k, y: y * k, rx: rx * k, ry: ry * k }));
  /** chloroplasts inside the visible circle */
  const visible = chloroplasts.map((c, i) => ({ c, i })).filter(({ c }) => Math.hypot(c.x, c.y) < r - 30 * k).map(({ i }) => i);
  /** index of the chloroplast nearest a local point */
  const nearest = (p: Pt) => {
    let bi = 0;
    let bd = Infinity;
    chloroplasts.forEach((c, i) => {
      const d = Math.hypot(c.x - p[0], c.y - p[1]);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    return bi;
  };
  return { k, r, cells, chloroplasts, epidermis, spongy, visible, nearest, cuticleY: -240 * k };
};

/**
 * A round magnifier with a glowing glass rim (the "look closer" window). Children are drawn in LOCAL
 * coordinates centred on the lens and clipped to it. `open` 0..1 pops it open; `dim` 0..1 lays a soft
 * shade over the inside (to pull attention elsewhere for a moment).
 */
export const GlowLens: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly open: number;
  readonly dim?: number;
  readonly rim?: string;
  readonly children?: React.ReactNode;
}> = ({ x, y, r, open, dim = 0, rim = C.violetLight, children }) => {
  const id = useSvgId("glens");
  if (open <= 0) return null;
  const s = 0.55 + 0.45 * back(open);
  return (
    <g opacity={Math.min(1, open * 2.5)} transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <clipPath id={`${id}-c`}>
          <circle r={r} />
        </clipPath>
        <radialGradient id={`${id}-bg`} cx="0.45" cy="0.35" r="0.8">
          <stop offset="0" stopColor={mix(W2.cellLine, W2.cellDeep, 0.35)} />
          <stop offset="1" stopColor={mix(W2.cellLine, "#000000", 0.45)} />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="170%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      <circle cy={22} r={r + 6} fill="#000000" opacity={0.4} filter={`url(#${id}-sh)`} />
      <circle r={r + 10} fill="none" stroke={rim} strokeWidth={18} opacity={0.55} filter={`url(#${id}-glow)`} />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={-r} y={-r} width={r * 2} height={r * 2} fill={`url(#${id}-bg)`} />
        {children}
        {dim > 0 ? <circle r={r} fill={W2.deskBottom} opacity={0.42 * clamp01(dim)} /> : null}
        {/* glass reflection */}
        <path d={`M${-r * 0.78},${-r * 0.22} A${r * 0.82},${r * 0.82} 0 0 1 ${-r * 0.28},${-r * 0.76}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={16} strokeLinecap="round" />
      </g>
      <circle r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.95} strokeWidth={9} />
      <circle r={r - 9} fill="none" stroke={rim} strokeOpacity={0.55} strokeWidth={3} />
    </g>
  );
};

/** Shared gradients for the cross-section (draw once, inside the lens). */
const PalisadeDefs: React.FC<{ readonly gid: string }> = ({ gid }) => (
  <defs>
    <linearGradient id={`${gid}-cell`} x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stopColor={mix(W2.cellFill, "#FFFFFF", 0.18)} />
      <stop offset="1" stopColor={mix(W2.cellFill, W2.cellDeep, 0.55)} />
    </linearGradient>
    <linearGradient id={`${gid}-epi`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={mix(W2.cellFill, "#FFFFFF", 0.62)} />
      <stop offset="1" stopColor={mix(W2.cellFill, "#FFFFFF", 0.3)} />
    </linearGradient>
    <linearGradient id={`${gid}-chl`} x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stopColor={W2.chloroMid} />
      <stop offset="1" stopColor={W2.chloroLine} />
    </linearGradient>
    <filter id={`${gid}-glow`} x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation={9} />
    </filter>
  </defs>
);

/** One cartoon chloroplast (local coordinates). `glow` = light energy just absorbed. */
export const ChloroplastBean: React.FC<{ readonly c: CartoonChloroplast; readonly glow?: number; readonly gid: string; readonly appear?: number }> = ({ c, glow = 0, gid, appear = 1 }) => {
  if (appear <= 0) return null;
  const s = c.s * (0.5 + 0.5 * back(appear)) * (1 + 0.12 * glow);
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${c.rot}) scale(${s})`} opacity={Math.min(1, appear * 2)}>
      {glow > 0.02 ? <ellipse rx={30} ry={42} fill={C.sun} opacity={0.85 * glow} filter={`url(#${gid}-glow)`} /> : null}
      <ellipse rx={15} ry={27} fill={`url(#${gid}-chl)`} stroke={W2.chloroLine} strokeWidth={3} />
      {glow > 0.02 ? <ellipse rx={15} ry={27} fill={mix(W2.chloroLight, C.sun, 0.55)} opacity={0.8 * glow} /> : null}
      {[-13, 0, 13].map((gy) => (
        <rect key={gy} x={-8} y={gy - 3} width={16} height={6} rx={3} fill={W2.chloroLight} opacity={0.55} />
      ))}
      <ellipse cx={-5} cy={-14} rx={3.6} ry={7} fill="#FFFFFF" opacity={0.45} />
    </g>
  );
};

/**
 * The cross-section itself (local coordinates, for a lens of radius r). `glowOf(i)` lights chloroplast i;
 * `appear` 0..1 builds the layers in (cells, then chloroplasts). `children` are drawn above the cells
 * (glucose, sparks…).
 */
export const PalisadeCells: React.FC<{
  readonly r?: number;
  readonly glowOf?: (i: number) => number;
  readonly appear?: number;
  readonly children?: React.ReactNode;
}> = ({ r = 290, glowOf, appear = 1, children }) => {
  const gid = useSvgId("pal");
  const L = palisade(r);
  const { k } = L;
  const cellsIn = EASE.out(clamp01(appear * 1.6));
  const chlIn = (i: number) => clamp01((appear - 0.35 - (i % 9) * 0.03) / 0.35);
  return (
    <g>
      <PalisadeDefs gid={gid} />
      {/* spongy mesophyll (below), with air spaces between the cells */}
      <g opacity={cellsIn}>
        {L.spongy.map((s, i) => (
          <g key={i}>
            <ellipse cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={mix(W2.cellFill, W2.cellDeep, 0.5)} stroke={W2.cellLine} strokeWidth={4 * k} />
            <ellipse cx={s.x - s.rx * 0.3} cy={s.y - s.ry * 0.45} rx={s.rx * 0.32} ry={s.ry * 0.16} fill="#FFFFFF" opacity={0.25} />
            <ellipse cx={s.x + s.rx * 0.35} cy={s.y + 4 * k} rx={9 * k} ry={15 * k} fill={W2.chloroDeep} stroke={W2.chloroLine} strokeWidth={2.5 * k} transform={`rotate(70 ${s.x + s.rx * 0.35} ${s.y + 4 * k})`} />
          </g>
        ))}
      </g>
      {/* waxy cuticle + upper epidermis */}
      <g opacity={cellsIn}>
        <rect x={-r} y={L.cuticleY - 8 * k} width={r * 2} height={14 * k} fill={mix(C.leafLight, "#FFFFFF", 0.45)} opacity={0.85} />
        {L.epidermis.map((e, i) => (
          <g key={i}>
            <rect x={e.x} y={e.y} width={e.w} height={e.h} rx={20 * k} fill={`url(#${gid}-epi)`} stroke={W2.cellLine} strokeWidth={4 * k} />
            <rect x={e.x + 14 * k} y={e.y + 9 * k} width={e.w * 0.45} height={7 * k} rx={3.5 * k} fill="#FFFFFF" opacity={0.5} />
          </g>
        ))}
      </g>
      {/* palisade mesophyll */}
      {L.cells.map((c, i) => {
        const h = c.bottom - c.top;
        const grow = cellsIn;
        return (
          <g key={i} opacity={grow} transform={`translate(0 ${(1 - grow) * 30 * k})`}>
            <rect x={c.cx - c.w / 2} y={c.top} width={c.w} height={h} rx={48 * k} fill={`url(#${gid}-cell)`} stroke={W2.cellLine} strokeWidth={4.5 * k} />
            {/* vacuole: the paler middle of the cell */}
            <rect x={c.cx - c.w * 0.2} y={c.top + 34 * k} width={c.w * 0.4} height={h - 68 * k} rx={22 * k} fill={mix(W2.cellFill, "#FFFFFF", 0.32)} opacity={0.45} />
            {/* gloss */}
            <rect x={c.cx - c.w / 2 + 12 * k} y={c.top + 26 * k} width={9 * k} height={h * 0.38} rx={4.5 * k} fill="#FFFFFF" opacity={0.45} />
          </g>
        );
      })}
      {L.chloroplasts.map((c, i) => (
        <ChloroplastBean key={i} c={c} gid={gid} glow={glowOf ? glowOf(i) : 0} appear={chlIn(i)} />
      ))}
      {children}
    </g>
  );
};
