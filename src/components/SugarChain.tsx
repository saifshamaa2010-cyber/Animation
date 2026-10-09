import React from "react";
import { C } from "../brand/tokens";
import { Pt, hexPoints, roundedPolygon } from "../lib/geometry";
import { useSvgId } from "./ids";
import { BOND, HEX_H, HEX_R, SPACING } from "./molecule-geometry";

export type RingTone = "starch" | "sugar" | "cellulose";

export type Ring = {
  readonly x: number;
  readonly y: number;
  readonly rot?: number;
  /** Flipped rings = how cellulose's alternate units are drawn. */
  readonly flip?: boolean;
  readonly tone?: RingTone;
  /** 0..1 warm glow = "this tastes sweet". */
  readonly glow?: number;
  readonly opacity?: number;
  readonly scale?: number;
};

export type Link = {
  readonly a: number;
  readonly b: number;
  /** 0 = intact, 1 = fully snapped apart. */
  readonly broken?: number;
  /** 0..1 highlight (the bond we're talking about). */
  readonly highlight?: number;
  /** Zig-zag link (cellulose's β-link look). Sign sets direction. */
  readonly zig?: number;
  readonly opacity?: number;
};

const TONES: Record<RingTone, { top: string; bottom: string; dot: string; rim: string }> = {
  starch: { top: C.cream, bottom: C.creamDeep, dot: "#8C7651", rim: "#FFF6E2" },
  sugar: { top: C.amberLight, bottom: C.amber, dot: C.amberDeep, rim: "#FFF7E0" },
  cellulose: { top: C.paper, bottom: C.paperDim, dot: "#8E897F", rim: "#FFFFFF" },
};

const HEX = hexPoints(HEX_R);
const HEX_D = roundedPolygon(HEX, 6);

/** One glucose ring. Stylised hexagon + ring oxygen + CH₂OH stub. */
export const GlucoseRing: React.FC<Ring & { readonly gid: string }> = ({
  x,
  y,
  rot = 0,
  flip = false,
  tone = "starch",
  glow = 0,
  opacity = 1,
  scale = 1,
  gid,
}) => {
  const t = TONES[tone];
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale} ${flip ? -scale : scale})`}
      opacity={opacity}
    >
      {glow > 0 ? (
        <path d={HEX_D} fill={C.amber} opacity={0.75 * glow} filter={`url(#${gid}-glow)`} transform="scale(1.25)" />
      ) : null}
      <path d={HEX_D} fill={`url(#${gid}-${tone})`} />
      <path d={HEX_D} fill="none" stroke={t.rim} strokeOpacity={0.55} strokeWidth={2.5} clipPath={`url(#${gid}-upper)`} />
      {/* CH2OH stub on the upper-left vertex */}
      <line x1={-HEX_R / 2} y1={-HEX_H} x2={-HEX_R / 2 - 4} y2={-HEX_H - 13} stroke={t.bottom} strokeWidth={4} strokeLinecap="round" />
      <circle cx={-HEX_R / 2 - 5} cy={-HEX_H - 16} r={4} fill={t.top} />
      {/* Ring oxygen on the upper-right vertex */}
      <circle cx={HEX_R / 2} cy={-HEX_H} r={5.5} fill={t.dot} />
    </g>
  );
};

export type SugarChainProps = {
  readonly rings: readonly Ring[];
  readonly links: readonly Link[];
  readonly opacity?: number;
};

/** A chain of glucose rings joined by glycosidic links (starch, maltose, cellulose…). */
export const SugarChain: React.FC<SugarChainProps> = ({ rings, links, opacity = 1 }) => {
  const gid = useSvgId("sugar");
  return (
    <g opacity={opacity}>
      <defs>
        {(Object.keys(TONES) as RingTone[]).map((k) => (
          <linearGradient key={k} id={`${gid}-${k}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={TONES[k].top} />
            <stop offset="1" stopColor={TONES[k].bottom} />
          </linearGradient>
        ))}
        <clipPath id={`${gid}-upper`}>
          <rect x={-HEX_R - 4} y={-HEX_H - 4} width={HEX_R * 2 + 8} height={HEX_H} />
        </clipPath>
        <filter id={`${gid}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      {links.map((l, i) => (
        <Bond key={i} from={rings[l.a]} to={rings[l.b]} link={l} />
      ))}
      {rings.map((r, i) => (
        <GlucoseRing key={i} {...r} gid={gid} />
      ))}
    </g>
  );
};

const Bond: React.FC<{ readonly from: Ring; readonly to: Ring; readonly link: Link }> = ({
  from,
  to,
  link,
}) => {
  const { broken = 0, highlight = 0, zig = 0, opacity = 1 } = link;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const sa = from.scale ?? 1;
  const sb = to.scale ?? 1;
  const start: Pt = [from.x + ux * HEX_R * sa, from.y + uy * HEX_R * sa];
  const end: Pt = [to.x - ux * HEX_R * sb, to.y - uy * HEX_R * sb];
  const zs = ((from.scale ?? 1) + (to.scale ?? 1)) / 2;
  const mid: Pt = [(start[0] + end[0]) / 2 - uy * zig * 12 * zs, (start[1] + end[1]) / 2 + ux * zig * 12 * zs];
  const color = highlight > 0 ? mixHex(C.creamDeep, C.paper, highlight) : C.creamDeep;
  const ss = (sa + sb) / 2;
  const width = (7 + highlight * 3) * ss;
  const linkOpacity = Math.min(from.opacity ?? 1, to.opacity ?? 1) * opacity;

  if (broken > 0) {
    // Each half retracts toward its own ring.
    const k = 1 - broken * 0.85;
    const a2: Pt = [start[0] + (mid[0] - start[0]) * k, start[1] + (mid[1] - start[1]) * k];
    const b2: Pt = [end[0] + (mid[0] - end[0]) * k, end[1] + (mid[1] - end[1]) * k];
    return (
      <g opacity={linkOpacity}>
        <line x1={start[0]} y1={start[1]} x2={a2[0]} y2={a2[1]} stroke={color} strokeWidth={width} strokeLinecap="round" />
        <line x1={end[0]} y1={end[1]} x2={b2[0]} y2={b2[1]} stroke={color} strokeWidth={width} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g opacity={linkOpacity}>
      {highlight > 0 ? (
        <polyline
          points={`${start[0]},${start[1]} ${mid[0]},${mid[1]} ${end[0]},${end[1]}`}
          fill="none"
          stroke={C.paper}
          strokeOpacity={0.35 * highlight}
          strokeWidth={22 * ss}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      <polyline
        points={`${start[0]},${start[1]} ${mid[0]},${mid[1]} ${end[0]},${end[1]}`}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bridging oxygen */}
      <circle cx={mid[0]} cy={mid[1]} r={(5 + highlight * 2) * ss} fill={highlight > 0 ? C.paper : "#8C7651"} />
    </g>
  );
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};

/** Rings laid out in a line (optionally gently waving), plus links between neighbours. */
export const straightChain = (
  n: number,
  x0: number,
  y0: number,
  opts: {
    readonly angle?: number;
    readonly wave?: number;
    readonly phase?: number;
    readonly tone?: RingTone;
    readonly cellulose?: boolean;
    readonly spacing?: number;
  } = {},
): { rings: Ring[]; links: Link[] } => {
  const { angle = 0, wave = 0, phase = 0, tone = "starch", cellulose = false, spacing = SPACING } = opts;
  const ca = Math.cos((angle * Math.PI) / 180);
  const sa = Math.sin((angle * Math.PI) / 180);
  const rings: Ring[] = Array.from({ length: n }, (_, i) => {
    const along = i * spacing;
    const off = wave * Math.sin(i * 0.55 + phase) + (cellulose ? (i % 2 === 0 ? -7 : 7) : 0);
    return {
      x: x0 + along * ca - off * sa,
      y: y0 + along * sa + off * ca,
      rot: angle + (cellulose ? 0 : wave * 0.12 * Math.cos(i * 0.55 + phase)),
      flip: cellulose && i % 2 === 1,
      tone: cellulose ? "cellulose" : tone,
    };
  });
  const links: Link[] = Array.from({ length: n - 1 }, (_, i) => ({
    a: i,
    b: i + 1,
    zig: cellulose ? (i % 2 === 0 ? 1 : -1) : 0,
  }));
  return { rings, links };
};

export { BOND, SPACING };
