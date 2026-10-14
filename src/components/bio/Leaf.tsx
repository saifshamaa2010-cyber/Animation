import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../brand/tokens";
import { Pt, smoothClosedPath, smoothOpenPath } from "../../lib/geometry";
import { LitShape, mix } from "../kit/shared";
import { useSvgId } from "../ids";

/**
 * A leaf seen from above (dicot: net veins, a midrib and a stalk). Reusable for any plant topic:
 * colour states for the starch test, variegation, a black-paper strip, deficiency yellowing.
 */

export type LeafGeo = {
  readonly cx: number;
  readonly cy: number;
  readonly len: number;
  readonly wid: number;
  readonly ang: number;
  readonly outline: Pt[];
  readonly midrib: Pt[];
  readonly veins: Pt[][];
  readonly petiole: Pt[];
  /** Leaf-local → screen: u along the midrib (−len/2 base … +len/2 tip), v across. */
  readonly P: (u: number, v: number) => Pt;
  /** Half-width at t = 0 (base) … 1 (tip). */
  readonly half: (t: number) => number;
};

export const leafGeometry = (o: {
  cx: number;
  cy: number;
  len: number;
  wid: number;
  /** degrees, 0 = tip pointing right */
  ang?: number;
  /** stalk length as a fraction of the blade length */
  stalk?: number;
  /** which way the stalk curves (1 or −1) */
  stalkBend?: number;
  veinPairs?: number;
  /** >1 = blunter base, <1 = narrower */
  shape?: number;
}): LeafGeo => {
  const { cx, cy, len, wid, ang = 0, stalk = 0.3, stalkBend = 1, veinPairs = 6, shape = 0.82 } = o;
  const a = (ang * Math.PI) / 180;
  const P = (u: number, v: number): Pt => [cx + u * Math.cos(a) - v * Math.sin(a), cy + u * Math.sin(a) + v * Math.cos(a)];
  const half = (t: number) => (wid / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(Math.min(1, Math.max(0, t)), shape))), 0.8);
  const top: Pt[] = [];
  const bot: Pt[] = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = -len / 2 + t * len;
    top.push(P(u, -half(t)));
    bot.push(P(u, half(t)));
  }
  const outline = [...top, ...bot.slice(1, -1).reverse()];
  const midrib = Array.from({ length: 9 }, (_, i) => P(-len / 2 + (i / 8) * len * 0.97, Math.sin((i / 8) * Math.PI) * -len * 0.011));
  const veins: Pt[][] = [];
  for (let k = 1; k <= veinPairs; k++) {
    const t = k / (veinPairs + 1.3);
    const u = -len / 2 + t * len;
    for (const s of [-1, 1]) {
      const h = half(Math.min(0.97, t + 0.08)) * 0.8;
      veins.push([P(u, -4 * s), P(u + len * 0.07, s * h * 0.55), P(u + len * 0.14, s * h)]);
    }
  }
  const L = len * stalk;
  const base = P(-len / 2, 0);
  const petiole: Pt[] = [base, P(-len / 2 - L * 0.35, stalkBend * L * 0.12), P(-len / 2 - L * 0.7, stalkBend * L * 0.3), P(-len / 2 - L, stalkBend * L * 0.52)];
  return { cx, cy, len, wid, ang, outline, midrib, veins, petiole, P, half };
};

/** Colour pairs [lit top, shaded bottom] for the states a leaf can be in. */
export const LEAF_TONES = {
  green: [C.leaf, C.leafDeep],
  /** the white parts of a variegated leaf (no chlorophyll) */
  white: [C.paper, mix(C.paperDim, C.cream, 0.4)],
  /** older leaves short of nitrate */
  yellow: [mix(C.leafYellow, C.paper, 0.15), mix(C.leafYellow, C.creamDeep, 0.5)],
  /** after boiling in ethanol: chlorophyll removed */
  decolourised: [mix(C.paper, C.cream, 0.5), C.creamDeep],
  /** iodine solution, no starch */
  orange: [mix(C.iodine, C.amber, 0.35), C.iodine],
  /** iodine + starch */
  blueBlack: [mix(C.blueBlack, C.ink500, 0.45), C.blueBlack],
  /** boiled (killed) but still green */
  dullGreen: [mix(C.leaf, C.creamDeep, 0.35), mix(C.leafDeep, C.ink700, 0.3)],
} as const;
export type LeafTone = keyof typeof LEAF_TONES;

export type LeafProps = {
  readonly geo: LeafGeo;
  /** 0..1 appear (settles in from 94 %). */
  readonly progress?: number;
  /** Main colour. */
  readonly tone?: LeafTone;
  /** Variegation: the edge of the leaf has this colour (e.g. "white"); 0..1 how far it reaches in. */
  readonly margin?: { readonly tone: LeafTone; readonly depth?: number; readonly opacity?: number };
  /** A strip across the leaf (u0..u1 as fractions 0 base … 1 tip) in another colour. */
  readonly band?: { readonly u0: number; readonly u1: number; readonly tone: LeafTone; readonly opacity?: number };
  /** Black paper clipped over the strip [u0, u1]; 0..1 visibility. */
  readonly cover?: { readonly u0: number; readonly u1: number; readonly p: number };
  /** Magnesium deficiency: yellow between the veins (veins stay green), 0..1. */
  readonly interveinal?: number;
  /** Warm light falling on the leaf, 0..1. */
  readonly sunlit?: number;
  /** Vein visibility 0..1 (default 1). */
  readonly veins?: number;
  readonly showStalk?: boolean;
  readonly shadow?: number;
  readonly opacity?: number;
};

const bandPoly = (geo: LeafGeo, u0: number, u1: number): string => {
  const a = -geo.len / 2 + u0 * geo.len;
  const b = -geo.len / 2 + u1 * geo.len;
  const w = geo.wid;
  return [geo.P(a, -w), geo.P(b, -w), geo.P(b, w), geo.P(a, w)].map((p) => p.join(",")).join(" ");
};

export const Leaf: React.FC<LeafProps> = ({
  geo,
  progress = 1,
  tone = "green",
  margin,
  band,
  cover,
  interveinal = 0,
  sunlit = 0,
  veins = 1,
  showStalk = true,
  shadow = 0.5,
  opacity = 1,
}) => {
  const id = useSvgId("leaf");
  if (progress <= 0 || opacity <= 0) return null;
  const d = smoothClosedPath(geo.outline, 0.5);
  const [top, bottom] = LEAF_TONES[tone];
  const s = 0.94 + 0.06 * EASE.out(Math.min(1, progress));
  const veinCol = tone === "green" || tone === "dullGreen" ? C.leafLight : tone === "blueBlack" ? C.ink400 : mix(bottom, C.paper, 0.45);
  const stalkCol = tone === "green" ? C.stem : mix(bottom, C.paper, 0.2);

  // the variegation boundary: an irregular line part-way in from the edge
  let marginInner: string | null = null;
  if (margin) {
    const depth = margin.depth ?? 0.42;
    const N = 30;
    const pts: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const t = 0.08 + (i / N) * 0.84;
      const u = -geo.len / 2 + t * geo.len;
      const k = (1 - depth) * (1 + noise2D(`vg${geo.cx}`, t * 4, 0) * 0.22);
      pts.push(geo.P(u, -geo.half(t) * k));
    }
    for (let i = N; i >= 0; i--) {
      const t = 0.08 + (i / N) * 0.84;
      const u = -geo.len / 2 + t * geo.len;
      const k = (1 - depth) * (1 + noise2D(`vg${geo.cx}`, t * 4, 3) * 0.22);
      pts.push(geo.P(u, geo.half(t) * k));
    }
    marginInner = smoothClosedPath(pts, 0.5);
  }

  return (
    <g opacity={Math.min(1, progress * 1.6) * opacity} transform={`translate(${geo.cx} ${geo.cy}) scale(${s}) translate(${-geo.cx} ${-geo.cy})`}>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={d} />
        </clipPath>
        <radialGradient id={`${id}-sun`} cx="0.2" cy="0.1" r="0.9">
          <stop offset="0" stopColor={C.sun} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </radialGradient>
        {margin ? (
          <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={LEAF_TONES[margin.tone][0]} />
            <stop offset="1" stopColor={LEAF_TONES[margin.tone][1]} />
          </linearGradient>
        ) : null}
        {band ? (
          <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={LEAF_TONES[band.tone][0]} />
            <stop offset="1" stopColor={LEAF_TONES[band.tone][1]} />
          </linearGradient>
        ) : null}
      </defs>
      {showStalk ? (
        <>
          <path d={smoothOpenPath(geo.petiole)} fill="none" stroke={stalkCol} strokeWidth={Math.max(6, geo.wid * 0.04)} strokeLinecap="round" />
          <path d={smoothOpenPath(geo.petiole)} fill="none" stroke={C.paper} strokeOpacity={0.22} strokeWidth={Math.max(2, geo.wid * 0.012)} strokeLinecap="round" transform="translate(-2 -2)" />
        </>
      ) : null}
      <LitShape d={d} top={top} bottom={bottom} rimOpacity={0.6} shadow={shadow} shadowDy={geo.wid * 0.05} shadowBlur={geo.wid * 0.055} />
      <g clipPath={`url(#${id}-c)`}>
        {margin && marginInner ? (
          <g opacity={margin.opacity ?? 1}>
            {/* everything outside the inner boundary is margin colour */}
            <path d={`${d} ${marginInner}`} fill={`url(#${id}-m)`} fillRule="evenodd" />
          </g>
        ) : null}
        {band ? <polygon points={bandPoly(geo, band.u0, band.u1)} fill={`url(#${id}-b)`} opacity={band.opacity ?? 1} /> : null}
        {interveinal > 0 ? <path d={d} fill={C.leafYellow} opacity={0.75 * interveinal} /> : null}
        {sunlit > 0 ? <path d={d} fill={`url(#${id}-sun)`} opacity={sunlit} /> : null}
      </g>
      {veins > 0 ? (
        <g opacity={veins}>
          {interveinal > 0 ? (
            <g opacity={interveinal}>
              <path d={smoothOpenPath(geo.midrib)} fill="none" stroke={C.leaf} strokeWidth={geo.wid * 0.05} strokeLinecap="round" />
              {geo.veins.map((v, i) => (
                <path key={i} d={smoothOpenPath(v)} fill="none" stroke={C.leaf} strokeWidth={geo.wid * 0.035} strokeLinecap="round" />
              ))}
            </g>
          ) : null}
          <path d={smoothOpenPath(geo.midrib)} fill="none" stroke={veinCol} strokeOpacity={0.6} strokeWidth={Math.max(3, geo.wid * 0.015)} strokeLinecap="round" />
          {geo.veins.map((v, i) => (
            <path key={i} d={smoothOpenPath(v)} fill="none" stroke={veinCol} strokeOpacity={0.38} strokeWidth={Math.max(2, geo.wid * 0.009)} strokeLinecap="round" />
          ))}
        </g>
      ) : null}
      {cover && cover.p > 0 ? <PaperStrip geo={geo} u0={cover.u0} u1={cover.u1} p={cover.p} /> : null}
    </g>
  );
};

/** Black paper folded over both sides of a leaf, held with a clip. */
const PaperStrip: React.FC<{ geo: LeafGeo; u0: number; u1: number; p: number }> = ({ geo, u0, u1, p }) => {
  const a = -geo.len / 2 + u0 * geo.len;
  const b = -geo.len / 2 + u1 * geo.len;
  const w = geo.wid * 0.62;
  const drop = (1 - EASE.out(p)) * -60;
  const pts = [geo.P(a, -w), geo.P(b, -w), geo.P(b, w), geo.P(a, w)];
  const d = `M${pts.map((q) => `${q[0]},${q[1] + drop}`).join("L")}Z`;
  const clipC = geo.P((a + b) / 2, -w);
  return (
    <g opacity={Math.min(1, p * 2)}>
      <LitShape d={d} top={C.ink700} bottom={C.ink950} rimOpacity={0.35} shadow={0.6} shadowDy={8} shadowBlur={10} />
      <rect x={clipC[0] - 16} y={clipC[1] - 22 + drop} width={32} height={44} rx={6} fill={C.ink400} transform={`rotate(${geo.ang} ${clipC[0]} ${clipC[1] + drop})`} />
      <rect x={clipC[0] - 10} y={clipC[1] - 18 + drop} width={20} height={8} rx={3} fill={C.ink300} transform={`rotate(${geo.ang} ${clipC[0]} ${clipC[1] + drop})`} />
    </g>
  );
};
