/**
 * A cartoon garden plant cut away at the ground, for "where does it come from / where does it go"
 * explanations (EP002 v2 onwards): a soil slice under any world's sky, and a plant whose stem, leaves,
 * roots and xylem are all known as geometry, so molecules can be routed into a leaf, up the stem or out
 * of a root exactly. Outlined like Chloro and the Sprouts (one family).
 * All SVG in 1920×1080 coordinates; frame-driven through props (no CSS animation).
 */
import React from "react";
import { C, EASE, H, W, W2 } from "../../brand/tokens";
import { Pt, rng } from "../../lib/geometry";
import { useSvgId } from "../ids";
import { mix } from "../kit/shared";
import { CartoonLeaf } from "./Sprouts";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ------------------------------------------------------------------------------------ geometry

export type GardenLeafSpec = {
  /** 0..1 up the stem */
  readonly t: number;
  /** base → tip direction, degrees (0 = right, −90 = up, 180 = left) */
  readonly angle: number;
  readonly len: number;
  readonly wid?: number;
  readonly tone?: "fresh" | "deep";
};
export type GardenRootSpec = {
  /** 0..1 down the main root, where this side root branches */
  readonly at: number;
  readonly side: -1 | 1;
  readonly reach: number;
  readonly drop: number;
};
export type GardenPlantSpec = {
  readonly x: number;
  readonly groundY: number;
  readonly height: number;
  /** sideways lean of the top, as a fraction of the height */
  readonly lean?: number;
  readonly leaves: readonly GardenLeafSpec[];
  readonly rootDepth?: number;
  readonly roots?: readonly GardenRootSpec[];
};

export type GardenLeaf = GardenLeafSpec & {
  readonly base: Pt;
  /** point at (u along the blade 0..1 from the base, v across it −1..1; for a leaf pointing left, +v is its upper edge) */
  readonly P: (u: number, v: number) => Pt;
};

const cubic = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
};
const quad = (a: Pt, b: Pt, c: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
};
const sample = (fn: (t: number) => Pt, n: number, upto = 1): Pt[] => Array.from({ length: n + 1 }, (_, i) => fn((i / n) * upto));

/** All the plant's geometry (pure: use it to route things along the plant). */
export const gardenPlantGeometry = (s: GardenPlantSpec) => {
  const lean = s.lean ?? 0.06;
  const base: Pt = [s.x, s.groundY];
  const top: Pt = [s.x + lean * s.height, s.groundY - s.height];
  const c1: Pt = [s.x - lean * s.height * 0.5, s.groundY - s.height * 0.38];
  const c2: Pt = [s.x + lean * s.height * 1.5, s.groundY - s.height * 0.7];
  const stemAt = (t: number) => cubic(base, c1, c2, top, clamp01(t));
  const stemPts = sample(stemAt, 28);
  const leaves: GardenLeaf[] = s.leaves.map((l) => {
    const b = stemAt(l.t);
    const a = (l.angle * Math.PI) / 180;
    const wid = l.wid ?? l.len * 0.5;
    const P = (u: number, v: number): Pt => [b[0] + Math.cos(a) * u * l.len - Math.sin(a) * v * (wid / 2), b[1] + Math.sin(a) * u * l.len + Math.cos(a) * v * (wid / 2)];
    return { ...l, wid, base: b, P };
  });
  const depth = s.rootDepth ?? 200;
  const mainEnd: Pt = [s.x + 10, s.groundY + depth];
  const mainCtrl: Pt = [s.x - 16, s.groundY + depth * 0.55];
  const mainAt = (t: number) => quad(base, mainCtrl, mainEnd, clamp01(t));
  const mainRoot = sample(mainAt, 18);
  const sideRoots = (s.roots ?? []).map((r) => {
    const st = mainAt(r.at);
    const end: Pt = [st[0] + r.side * r.reach, st[1] + r.drop];
    const ctrl: Pt = [st[0] + r.side * r.reach * 0.5, st[1] + r.drop * 0.08];
    return { ...r, start: st, tip: end, pts: sample((t) => quad(st, ctrl, end, t), 16) };
  });
  return { base, top, stemAt, stemPts, leaves, mainAt, mainRoot, sideRoots };
};
export type GardenPlantGeometry = ReturnType<typeof gardenPlantGeometry>;

/** Closed outline of a tapered ribbon along `pts` (width w0 at the start, w1 at the end). */
export const ribbonPath = (pts: readonly Pt[], w0: number, w1: number) => {
  if (pts.length < 2) return "";
  const n = pts.length;
  const L: Pt[] = [];
  const R: Pt[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push([p[0] - (dy / len) * w, p[1] + (dx / len) * w]);
    R.push([p[0] + (dy / len) * w, p[1] - (dx / len) * w]);
  });
  const e = pts[n - 1];
  const f = (q: Pt) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`;
  return `M${L.map(f).join(" L")} Q${f([e[0] + (e[0] - pts[n - 2][0]) * 0.4, e[1] + (e[1] - pts[n - 2][1]) * 0.4])} ${f(R[n - 1])} L${[...R].reverse().map(f).join(" L")} Z`;
};

/** The first fraction `u` (by point count) of a polyline. */
export const polyUpTo = (pts: readonly Pt[], u: number): Pt[] => {
  const k = clamp01(u) * (pts.length - 1);
  const i = Math.floor(k);
  const out = pts.slice(0, i + 1) as Pt[];
  if (i < pts.length - 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const r = k - i;
    out.push([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]);
  }
  return out;
};

// ------------------------------------------------------------------------------------ ground slice

/**
 * The ground cut away like a cake slice: soil layers with pebbles from `groundY` down, a grass edge on
 * top and (optionally) soft distant hills behind. Draw it over any world's sky.
 */
export const GroundSlice: React.FC<{ readonly groundY: number; readonly hills?: boolean; readonly progress?: number; readonly seed?: number }> = ({
  groundY,
  hills = true,
  progress = 1,
  seed = 3,
}) => {
  const id = useSvgId("ground");
  if (progress <= 0) return null;
  const r = rng(seed);
  const pebbles = Array.from({ length: 30 }, (_, i) => ({
    x: ((i * 211 + 61) % (W - 40)) + 20,
    y: groundY + 70 + ((i * 137) % Math.max(40, H - groundY - 90)),
    s: 7 + (i % 5) * 4,
    a: (r() - 0.5) * 40,
  }));
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <defs>
        <linearGradient id={`${id}-soil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={W2.soilTop} />
          <stop offset="0.45" stopColor={W2.soilMid} />
          <stop offset="1" stopColor={W2.soilDeep} />
        </linearGradient>
      </defs>
      {hills ? (
        <g>
          <path d={`M0,${groundY - 70} C320,${groundY - 130} 640,${groundY - 60} 980,${groundY - 96} C1320,${groundY - 132} 1620,${groundY - 70} ${W},${groundY - 104} V${groundY + 10} H0 Z`} fill={W2.hillDeep} opacity={0.6} />
          <path d={`M0,${groundY - 30} C420,${groundY - 74} 820,${groundY - 22} 1200,${groundY - 48} C1520,${groundY - 70} 1760,${groundY - 30} ${W},${groundY - 44} V${groundY + 10} H0 Z`} fill={W2.hill} opacity={0.85} />
        </g>
      ) : null}
      <rect x={0} y={groundY} width={W} height={H - groundY} fill={`url(#${id}-soil)`} />
      {/* soil layers */}
      {[0.32, 0.62].map((t, i) => (
        <path
          key={i}
          d={`M0,${groundY + (H - groundY) * t} C${W * 0.25},${groundY + (H - groundY) * t - 14} ${W * 0.6},${groundY + (H - groundY) * t + 16} ${W},${groundY + (H - groundY) * t - 6}`}
          fill="none"
          stroke={mix(W2.soilDeep, "#000000", 0.2)}
          strokeOpacity={0.25}
          strokeWidth={3}
        />
      ))}
      {pebbles.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={p.s * 1.4} ry={p.s} fill={W2.pebble} opacity={0.32} transform={`rotate(${p.a} ${p.x} ${p.y})`} />
      ))}
      {/* the cut edge catches the light */}
      <rect x={0} y={groundY + 8} width={W} height={10} fill={mix(W2.soilTop, "#FFFFFF", 0.2)} opacity={0.35} />
      {/* grass edge */}
      <path d={`M0,${groundY + 4} ${Array.from({ length: 49 }, (_, i) => `L${i * 40},${groundY - (i % 2 ? 16 : 2)}`).join(" ")} L${W},${groundY + 4} Z`} fill={W2.grass} />
      <rect x={0} y={groundY} width={W} height={12} fill={W2.grassDeep} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ plant

/**
 * The plant, drawn from its spec: tapered roots in the soil, a stem, cartoon leaves, and (optionally)
 * the xylem as a glowing blue line from deep in the main root, up the stem, along the midrib of leaf
 * `xylemLeaf`. `grow` 0..1 grows the shoot; `rootsGrow` 0..1 the roots; `xylem` 0..1 draws the line.
 */
export const GardenPlant: React.FC<{
  readonly spec: GardenPlantSpec;
  readonly grow?: number;
  readonly rootsGrow?: number;
  readonly xylem?: number;
  readonly xylemLeaf?: number;
  /** 0..1 down the main root: where the drawn xylem starts */
  readonly xylemFrom?: number;
  readonly opacity?: number;
}> = ({ spec, grow = 1, rootsGrow = 1, xylem = 0, xylemLeaf = 0, xylemFrom = 0.55, opacity = 1 }) => {
  const id = useSvgId("gplant");
  if (opacity <= 0) return null;
  const g = gardenPlantGeometry(spec);
  const gp = EASE.out(clamp01(grow));
  const rp = clamp01(rootsGrow);
  const rootFill = mix(C.cream, C.paper, 0.25);
  const rootLine = mix(C.barkDeep, W2.soilDeep, 0.3);
  const route = xylemPath(g, xylemLeaf, xylemFrom);
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {/* roots */}
      {rp > 0 ? (
        <g>
          {g.sideRoots.map((r, i) => {
            const show = clamp01((rp - r.at * 0.6) / 0.4);
            if (show <= 0) return null;
            const pts = polyUpTo(r.pts, EASE.out(show));
            return (
              <g key={i}>
                <path d={ribbonPath(pts, 13, 4)} fill={rootFill} stroke={rootLine} strokeWidth={3.5} strokeLinejoin="round" />
              </g>
            );
          })}
          <path d={ribbonPath(polyUpTo(g.mainRoot, EASE.out(rp)), 22, 6)} fill={rootFill} stroke={rootLine} strokeWidth={4} strokeLinejoin="round" />
        </g>
      ) : null}
      {/* leaves (behind the stem) */}
      {g.leaves.map((l, i) => {
        const lg = clamp01((gp - l.t * 0.75) / 0.25);
        return <CartoonLeaf key={i} x={l.base[0]} y={l.base[1]} angle={l.angle} len={l.len} wid={l.wid} grow={lg} tone={l.tone ?? (i % 2 ? "deep" : "fresh")} />;
      })}
      {/* stem */}
      {gp > 0 ? (
        <g>
          <path d={ribbonPath(polyUpTo(g.stemPts, gp), 26, 12)} fill={C.stem} stroke={W2.chloroLine} strokeWidth={4.5} strokeLinejoin="round" />
          <path d={ribbonPath(polyUpTo(g.stemPts, gp * 0.97), 7, 3)} fill="#FFFFFF" opacity={0.18} transform="translate(-6 0)" />
        </g>
      ) : null}
      {/* xylem */}
      {xylem > 0 ? (
        <g>
          <path d={route.d} fill="none" stroke={C.ice} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${clamp01(xylem)} 2`} opacity={0.55} filter={`url(#${id}-glow)`} />
          <path d={route.d} fill="none" stroke={C.iceDeep} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${clamp01(xylem)} 2`} />
          <path d={route.d} fill="none" stroke={mix(C.ice, "#FFFFFF", 0.25)} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${clamp01(xylem)} 2`} />
        </g>
      ) : null}
    </g>
  );
};

/** The xylem route as points (deep in the main root → up the stem → along the midrib of `leaf`). */
export const xylemPoints = (g: GardenPlantGeometry, leaf: number, from = 0.55): Pt[] => {
  const l = g.leaves[leaf];
  const rootPart = sample((t) => g.mainAt(from * (1 - t)), 10);
  const stemPart = sample((t) => g.stemAt(t), 24, l?.t ?? 1);
  const leafPart = l ? sample((t) => l.P(t * 0.62, 0), 8) : [];
  return [...rootPart, ...stemPart.slice(1), ...leafPart.slice(1)];
};

const xylemPath = (g: GardenPlantGeometry, leaf: number, from: number) => {
  const pts = xylemPoints(g, leaf, from);
  return { pts, d: `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" L")}` };
};

// ------------------------------------------------------------------------------------ chloroplast icon

/** A small chloroplast (green bean with grana stripes) as an icon for "chlorophyll". `glow` 0..1. */
export const ChloroplastIcon: React.FC<{ readonly x: number; readonly y: number; readonly scale?: number; readonly rotate?: number; readonly progress?: number; readonly glow?: number; readonly opacity?: number }> = ({
  x,
  y,
  scale = 1,
  rotate = -28,
  progress = 1,
  glow = 0,
  opacity = 1,
}) => {
  const id = useSvgId("chlicon");
  if (progress <= 0 || opacity <= 0) return null;
  const c1 = 1.70158;
  const t = clamp01(progress) - 1;
  const s = scale * (1 + (c1 + 1) * t * t * t + c1 * t * t);
  return (
    <g opacity={Math.min(1, progress * 2.5) * opacity} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={W2.chloroLight} />
          <stop offset="0.5" stopColor={W2.chloroMid} />
          <stop offset="1" stopColor={W2.chloroDeep} />
        </linearGradient>
        <filter id={`${id}-b`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {glow > 0.02 ? <ellipse rx={46} ry={30} fill={C.sun} opacity={0.7 * glow} filter={`url(#${id}-b)`} /> : null}
      <ellipse cx={3} cy={5} rx={38} ry={22} fill="#000000" opacity={0.16} />
      <ellipse rx={38} ry={22} fill={`url(#${id}-g)`} stroke={W2.chloroLine} strokeWidth={4} />
      {[-18, 0, 18].map((gx) => (
        <g key={gx}>
          {[-6, 0, 6].map((gy) => (
            <rect key={gy} x={gx - 6} y={gy - 2} width={12} height={4} rx={2} fill={W2.chloroLine} opacity={0.45} />
          ))}
        </g>
      ))}
      <ellipse cx={-16} cy={-10} rx={10} ry={4} fill="#FFFFFF" opacity={0.5} transform="rotate(-12 -16 -10)" />
    </g>
  );
};
