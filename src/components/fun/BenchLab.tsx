/**
 * Lab-bench apparatus for the v2 "worlds" look (EP002 v2 onwards): cartoon glassware with dark ink
 * outlines that reads on the light pastel bench wall (the Soft Lab `lab/` parts are drawn for dark
 * backgrounds). A boiling tube of liquid, a bung that can pop out and back, crinkly foil, a test-tube
 * rack, an angle-poise lamp and its beam, a cartoon sprig of pondweed, the hydrogencarbonate-indicator
 * colour key card, a "?" buddy that can look around, a thought cloud, an ink topic tag, a wall clock
 * (it can spin forward for "a few hours later"), a dropper bottle of reagent and cartoon light packets.
 * All SVG in 1920×1080 coordinates, all driven by props from the frame (no CSS animation). Reusable.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, EASE, W2 } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { rng } from "../../lib/geometry";
import { useSvgId } from "../ids";
import { mix, roundRectPath } from "../kit/shared";
import { HandArrow } from "../kit/hand";
import { ChemText } from "../Equation";

type Pt = readonly [number, number];
const INK = W2.inkText;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c1 + 1) * x * x * x + c1 * x * x;
};

/** Hydrogencarbonate indicator colour: −1 yellow (more CO2) · 0 red (air) · +1 purple (less CO2). */
export const indicatorColour = (s: number) => (s < 0 ? mix(C.indRed, C.indYellow, Math.min(1, -s)) : mix(C.indRed, C.indPurple, Math.min(1, s)));

// ------------------------------------------------------------------------------------ tube

export type BenchTubeProps = {
  /** centre of the mouth */
  readonly x: number;
  readonly y: number;
  readonly w?: number;
  readonly h?: number;
  /** 0..1 fill level */
  readonly level?: number;
  readonly colour: string;
  /** 0..1 the surface sloshes (something just dropped in) */
  readonly slosh?: number;
  /** 0..1 warm lamp light on the glass */
  readonly lit?: number;
  /** drawn inside the glass (clipped to it, but open above the mouth so things can drop in) */
  readonly inside?: React.ReactNode;
  /** drawn over the liquid, under the glass outline, not clipped */
  readonly children?: React.ReactNode;
  readonly progress?: number;
  readonly opacity?: number;
};

/** A boiling tube with a dark ink outline, glossy glass and lit liquid. */
export const BenchTube: React.FC<BenchTubeProps> = ({ x, y, w = 96, h = 300, level = 0.82, colour, slosh = 0, lit = 0, inside, children, progress = 1, opacity = 1 }) => {
  const id = useSvgId("btube");
  const f = useCurrentFrame();
  if (progress <= 0 || opacity <= 0) return null;
  const r = w / 2;
  const bottom = y + h;
  const surf = bottom - h * clamp01(level);
  const open = `M${x - r},${y} L${x - r},${bottom - r} A${r},${r} 0 0 0 ${x + r},${bottom - r} L${x + r},${y}`;
  const closed = `${open} Z`;
  const column = `M${x - r},${y - 900} L${x - r},${bottom - r} A${r},${r} 0 0 0 ${x + r},${bottom - r} L${x + r},${y - 900} Z`;
  // the liquid's surface (a small wave while it sloshes)
  const amp = 7 * clamp01(slosh);
  const surfPts: Pt[] = Array.from({ length: 9 }, (_, i) => {
    const px = x - r - 4 + ((w + 8) * i) / 8;
    return [px, surf + Math.sin(i * 1.3 + f * 0.55) * amp];
  });
  const surfLine = surfPts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  return (
    <g opacity={Math.min(1, progress * 2) * opacity}>
      <defs>
        <clipPath id={`${id}-glass`}>
          <path d={closed} />
        </clipPath>
        <clipPath id={`${id}-col`}>
          <path d={column} />
        </clipPath>
        <linearGradient id={`${id}-liq`} gradientUnits="userSpaceOnUse" x1={x - r} y1={surf} x2={x + r} y2={bottom}>
          <stop offset="0" stopColor={mix(colour, "#FFFFFF", 0.28)} />
          <stop offset="0.45" stopColor={colour} />
          <stop offset="1" stopColor={mix(colour, INK, 0.28)} />
        </linearGradient>
        <filter id={`${id}-glow`} x="-100%" y="-50%" width="300%" height="200%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      {lit > 0 ? <ellipse cx={x} cy={y + h * 0.5} rx={r + 34} ry={h * 0.62} fill={C.sun} opacity={0.55 * lit} filter={`url(#${id}-glow)`} /> : null}
      {/* glass (back) */}
      <path d={closed} fill="#FFFFFF" opacity={0.42} />
      {level > 0 ? (
        <g clipPath={`url(#${id}-glass)`}>
          <path d={`${surfLine} L${x + r + 4},${bottom + 10} L${x - r - 4},${bottom + 10} Z`} fill={`url(#${id}-liq)`} />
          <path d={surfLine} fill="none" stroke={mix(colour, "#FFFFFF", 0.6)} strokeWidth={5} />
        </g>
      ) : null}
      {inside ? <g clipPath={`url(#${id}-col)`}>{inside}</g> : null}
      {children}
      {lit > 0 ? <path d={closed} fill={C.sun} opacity={0.08 * lit} /> : null}
      {/* gloss */}
      <line x1={x - r + 14} y1={y + 22} x2={x - r + 14} y2={bottom - r - 4} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={8} strokeLinecap="round" />
      <line x1={x + r - 13} y1={y + 30} x2={x + r - 13} y2={y + 70} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round" />
      <path d={open} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={x - r - 8} y={y - 8} width={w + 16} height={15} rx={7.5} fill="#FFFFFF" fillOpacity={0.75} stroke={INK} strokeWidth={4} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ bung

/** A rubber bung sitting in a tube mouth at (x, y). `lift` raises it out (px), `tilt` in degrees. */
export const Bung: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly lift?: number; readonly tilt?: number; readonly squash?: number; readonly progress?: number }> = ({
  x,
  y,
  w,
  lift = 0,
  tilt = 0,
  squash = 0,
  progress = 1,
}) => {
  const id = useSvgId("bung");
  if (progress <= 0) return null;
  const drop = (1 - EASE.out(clamp01(progress))) * 70;
  const top = y - 36;
  const bot = y + 12;
  const tw = w + 14;
  const bw = w - 10;
  const s = 1 + 0.12 * squash;
  const d = `M${x - tw / 2 + 6},${top} L${x + tw / 2 - 6},${top} Q${x + tw / 2},${top} ${x + tw / 2 - 1},${top + 6} L${x + bw / 2},${bot} L${x - bw / 2},${bot} L${x - tw / 2 + 1},${top + 6} Q${x - tw / 2},${top} ${x - tw / 2 + 6},${top} Z`;
  return (
    <g opacity={Math.min(1, progress * 3)} transform={`translate(0 ${-lift - drop}) rotate(${tilt} ${x} ${y - 12}) translate(${x} ${bot}) scale(${s} ${1 / s}) translate(${-x} ${-bot})`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(C.terracotta, "#FFFFFF", 0.18)} />
          <stop offset="1" stopColor={C.terracottaDeep} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id}-g)`} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <rect x={x - tw / 2 + 10} y={top + 6} width={tw - 34} height={7} rx={3.5} fill="#FFFFFF" opacity={0.42} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ foil

/** Crinkly aluminium foil wrapped round a tube (mouth centre x, y; tube w × h). Wraps from the bottom up. */
export const TubeFoil: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly progress: number; readonly seed?: number; readonly glint?: number }> = ({
  x,
  y,
  w,
  h,
  progress,
  seed = 4,
  glint = 0,
}) => {
  const id = useSvgId("foil");
  if (progress <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const W = w + 16;
  const R = W / 2;
  const top = y + 4;
  const bottom = y + h + 8;
  const r = rng(seed);
  // outline with small random crumples
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const yy = top + ((bottom - R - top) * i) / 8;
    left.push([x - R + (r() - 0.5) * 7, yy]);
    right.push([x + R + (r() - 0.5) * 7, yy]);
  }
  const d = `M${left.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" L")} A${R},${R} 0 0 0 ${right[right.length - 1][0].toFixed(1)},${right[right.length - 1][1].toFixed(1)} L${right
    .slice()
    .reverse()
    .map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`)
    .join(" L")} Z`;
  // the wrap rises from the bottom; its top edge is torn (zig-zag)
  const cut = bottom - (bottom - top + 12) * p;
  const zig = Array.from({ length: 9 }, (_, i) => `${(x - R - 10 + ((W + 20) * i) / 8).toFixed(1)},${(cut + (i % 2 ? 8 : -4) * (p < 1 ? 1 : 0)).toFixed(1)}`).join(" L");
  const facets = Array.from({ length: 9 }, () => {
    const cx = x + (r() - 0.5) * (W - 20);
    const cy = top + 20 + r() * (h - 40);
    const s = 16 + r() * 22;
    return `M${cx.toFixed(1)},${(cy - s).toFixed(1)} L${(cx + s * 0.8).toFixed(1)},${(cy + s * 0.3).toFixed(1)} L${(cx - s * 0.5).toFixed(1)},${(cy + s * 0.7).toFixed(1)} Z`;
  });
  const creases = Array.from({ length: 6 }, (_, i) => {
    const yy = top + 30 + i * ((h - 60) / 6) + (r() - 0.5) * 16;
    return `M${x - R + 4},${yy.toFixed(1)} L${(x - R * 0.2).toFixed(1)},${(yy + (r() - 0.5) * 22).toFixed(1)} L${(x + R * 0.35).toFixed(1)},${(yy + (r() - 0.5) * 22).toFixed(1)} L${x + R - 4},${(yy + (r() - 0.5) * 14).toFixed(1)}`;
  });
  return (
    <g>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={`M${zig} L${x + R + 20},${bottom + 20} L${x - R - 20},${bottom + 20} Z`} />
        </clipPath>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0" stopColor={mix(C.foil, INK, 0.12)} />
          <stop offset="0.3" stopColor={mix(C.foil, "#FFFFFF", 0.62)} />
          <stop offset="0.55" stopColor={C.foil} />
          <stop offset="0.8" stopColor={mix(C.foil, "#FFFFFF", 0.35)} />
          <stop offset="1" stopColor={mix(C.foil, INK, 0.3)} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <path d={d} fill={`url(#${id}-g)`} />
        {facets.map((fd, i) => (
          <path key={i} d={fd} fill={i % 3 === 0 ? INK : "#FFFFFF"} opacity={i % 3 === 0 ? 0.07 : 0.3} />
        ))}
        {creases.map((cd, i) => (
          <path key={i} d={cd} fill="none" stroke={i % 2 ? "#FFFFFF" : mix(C.foil, INK, 0.35)} strokeOpacity={i % 2 ? 0.8 : 0.55} strokeWidth={2.5} strokeLinejoin="round" />
        ))}
        <path d={d} fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {p < 1 ? <path d={`M${zig}`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" /> : null}
      </g>
      {glint > 0 ? (
        <path
          d={`M${x + R * 0.3},${top + 70 - 22 * glint} Q${x + R * 0.36},${top + 64} ${x + R * 0.3 + 22 * glint},${top + 70} Q${x + R * 0.36},${top + 76} ${x + R * 0.3},${top + 70 + 22 * glint} Q${x + R * 0.24},${top + 76} ${x + R * 0.3 - 22 * glint},${top + 70} Q${x + R * 0.24},${top + 64} ${x + R * 0.3},${top + 70 - 22 * glint} Z`}
          fill="#FFFFFF"
          opacity={glint}
        />
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------------------------ rack

/** A slate-blue test-tube rack standing on `floor`; draw it before the tubes. `xs` are the tube centres. */
export const BenchRack: React.FC<{ readonly cx: number; readonly floor: number; readonly w: number; readonly barY: number; readonly xs: readonly number[]; readonly tubeW?: number; readonly progress?: number }> = ({
  cx,
  floor,
  w,
  barY,
  xs,
  tubeW = 96,
  progress = 1,
}) => {
  const id = useSvgId("rack");
  if (progress <= 0) return null;
  const s = back(progress);
  const x0 = cx - w / 2;
  return (
    <g opacity={Math.min(1, progress * 2)} transform={`translate(${cx} ${floor}) scale(${0.85 + 0.15 * s} ${s}) translate(${-cx} ${-floor})`}>
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(C.ink400, "#FFFFFF", 0.22)} />
          <stop offset="1" stopColor={C.ink500} />
        </linearGradient>
        <filter id={`${id}-s`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      <ellipse cx={cx} cy={floor + 2} rx={w / 2 + 20} ry={12} fill={INK} opacity={0.22} filter={`url(#${id}-s)`} />
      {[x0 + 16, x0 + w - 34].map((px) => (
        <rect key={px} x={px} y={barY + 10} width={18} height={floor - 26 - barY - 6} fill={`url(#${id}-m)`} stroke={INK} strokeWidth={4} />
      ))}
      <path d={roundRectPath(x0, barY, w, 26, 11)} fill={`url(#${id}-m)`} stroke={INK} strokeWidth={4} />
      {xs.map((tx) => (
        <ellipse key={tx} cx={tx} cy={barY + 9} rx={tubeW / 2 + 6} ry={6} fill={INK} opacity={0.55} />
      ))}
      <path d={roundRectPath(x0 - 10, floor - 26, w + 20, 26, 11)} fill={`url(#${id}-m)`} stroke={INK} strokeWidth={4} />
      <rect x={x0 + 4} y={barY + 4} width={w - 8} height={5} rx={2.5} fill="#FFFFFF" opacity={0.35} />
      <rect x={x0 - 6} y={floor - 22} width={w + 12} height={5} rx={2.5} fill="#FFFFFF" opacity={0.35} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ lamp

/** Unit direction and length from a to b. */
const dir = (a: Pt, b: Pt) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return { ux: dx / L, uy: dy / L, L };
};

/** Where the lamp's bulb face is (the beam starts here). */
export const lampMouth = (head: Pt, aim: Pt): Pt => {
  const { ux, uy } = dir(head, aim);
  return [head[0] + ux * 44, head[1] + uy * 44];
};

/** Warm light beam from the lamp's mouth towards `aim`, `length` px long, `spread` px half-width at its end. */
export const LampBeam: React.FC<{ readonly head: Pt; readonly aim: Pt; readonly on: number; readonly length?: number; readonly spread?: number }> = ({ head, aim, on, length = 420, spread = 170 }) => {
  const id = useSvgId("beam");
  const f = useCurrentFrame();
  if (on <= 0) return null;
  const m = lampMouth(head, aim);
  const { ux, uy } = dir(head, aim);
  const nx = -uy;
  const ny = ux;
  const e: Pt = [m[0] + ux * length, m[1] + uy * length];
  const pts = (k: number) =>
    `${m[0] + nx * 40 * k},${m[1] + ny * 40 * k} ${e[0] + nx * spread * k},${e[1] + ny * spread * k} ${e[0] - nx * spread * k},${e[1] - ny * spread * k} ${m[0] - nx * 40 * k},${m[1] - ny * 40 * k}`;
  const shimmer = 0.94 + 0.06 * noise2D("beam", f / 30, 0);
  return (
    <g opacity={on * shimmer}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={m[0]} y1={m[1]} x2={e[0]} y2={e[1]}>
          <stop offset="0" stopColor={mix(C.sun, "#FFFFFF", 0.35)} stopOpacity={0.95} />
          <stop offset="0.6" stopColor={C.sun} stopOpacity={0.5} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-b`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>
      <polygon points={pts(1)} fill={`url(#${id}-g)`} filter={`url(#${id}-b)`} />
      <polygon points={pts(0.55)} fill={`url(#${id}-g)`} opacity={0.6} />
    </g>
  );
};

/** An angle-poise desk lamp: base on the bench, two arms, a shade pointing at `aim`. `on` 0..1 lights the bulb. */
export const DeskLamp: React.FC<{ readonly base: Pt; readonly elbow: Pt; readonly head: Pt; readonly aim: Pt; readonly on: number; readonly shake?: number; readonly progress?: number }> = ({
  base,
  elbow,
  head,
  aim,
  on,
  shake = 0,
  progress = 1,
}) => {
  const id = useSvgId("lamp");
  if (progress <= 0) return null;
  const { ux, uy } = dir(head, aim);
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI + shake * 5;
  const s = back(progress);
  const metal = `url(#${id}-m)`;
  const arm = (a: Pt, b: Pt) => (
    <g>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={20} strokeLinecap="round" />
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={mix(C.ink400, "#FFFFFF", 0.15)} strokeWidth={11} strokeLinecap="round" />
    </g>
  );
  return (
    <g opacity={Math.min(1, progress * 2)} transform={`translate(${base[0]} ${base[1]}) scale(${s}) translate(${-base[0]} ${-base[1]})`}>
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(C.ink400, "#FFFFFF", 0.25)} />
          <stop offset="1" stopColor={C.ink600} />
        </linearGradient>
        <radialGradient id={`${id}-bulb`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={C.sun} />
        </radialGradient>
        <filter id={`${id}-s`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      <ellipse cx={base[0]} cy={base[1] + 2} rx={92} ry={11} fill={INK} opacity={0.22} filter={`url(#${id}-s)`} />
      <path d={roundRectPath(base[0] - 78, base[1] - 24, 156, 26, 12)} fill={metal} stroke={INK} strokeWidth={4} />
      {arm([base[0], base[1] - 20], elbow)}
      {arm(elbow, head)}
      <circle cx={elbow[0]} cy={elbow[1]} r={13} fill={mix(C.ink400, "#FFFFFF", 0.2)} stroke={INK} strokeWidth={4} />
      <g transform={`translate(${head[0]} ${head[1]}) rotate(${ang})`}>
        {on > 0 ? <ellipse cx={46} cy={0} rx={30} ry={64} fill={C.sun} opacity={0.6 * on} filter={`url(#${id}-s)`} /> : null}
        <path d="M-42,-20 Q-50,0 -42,20 L36,48 Q46,0 36,-48 Z" fill={metal} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <path d="M-34,-14 L26,-36" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={40} cy={0} rx={12} ry={46} fill={on > 0 ? `url(#${id}-bulb)` : C.ink300} stroke={INK} strokeWidth={4} />
        {on > 0 ? <ellipse cx={40} cy={0} rx={12} ry={46} fill="#FFFFFF" opacity={0.5 * on} /> : null}
      </g>
      <circle cx={head[0]} cy={head[1]} r={12} fill={mix(C.ink400, "#FFFFFF", 0.2)} stroke={INK} strokeWidth={4} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ pondweed

/** A cartoon sprig of pondweed (Elodea): a stem with whorls of small outlined leaves, cut end at the top. */
export const Sprig: React.FC<{ readonly x: number; readonly y: number; readonly len?: number; readonly scale?: number; readonly sway?: number; readonly lit?: number; readonly progress?: number }> = ({
  x,
  y,
  len = 210,
  scale = 1,
  sway = 0,
  lit = 0,
  progress = 1,
}) => {
  const id = useSvgId("sprig");
  if (progress <= 0) return null;
  const tip: Pt = [x + len * 0.04, y - len];
  const stem = `M${x},${y} C${x + len * 0.08},${y - len * 0.35} ${x - len * 0.07},${y - len * 0.68} ${tip[0]},${tip[1]}`;
  const at = (t: number): Pt => {
    const u = 1 - t;
    const p0: Pt = [x, y];
    const p1: Pt = [x + len * 0.08, y - len * 0.35];
    const p2: Pt = [x - len * 0.07, y - len * 0.68];
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * tip[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * tip[1],
    ];
  };
  const whorls = Math.max(3, Math.floor(len / 30));
  const leafFill = lit > 0 ? `url(#${id}-lit)` : `url(#${id}-g)`;
  return (
    <g opacity={Math.min(1, progress * 2)} transform={`rotate(${sway} ${x} ${y})`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(C.leaf, "#FFFFFF", 0.2)} />
          <stop offset="1" stopColor={C.leafDeep} />
        </linearGradient>
        <linearGradient id={`${id}-lit`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(mix(C.leaf, "#FFFFFF", 0.2), C.sun, 0.35 * lit)} />
          <stop offset="1" stopColor={mix(C.leafDeep, C.sun, 0.2 * lit)} />
        </linearGradient>
      </defs>
      <path d={stem} fill="none" stroke={C.leafDark} strokeWidth={11 * scale} strokeLinecap="round" />
      <path d={stem} fill="none" stroke={C.stem} strokeWidth={5.5 * scale} strokeLinecap="round" />
      {Array.from({ length: whorls }, (_, i) => {
        const t = 0.07 + (i / whorls) * 0.88;
        const [wx, wy] = at(t);
        const L = (30 - t * 9) * scale;
        return (
          <g key={i}>
            {[-1, 1, 0].map((k) => {
              const a = k === 0 ? -90 + (i % 2 ? 18 : -18) : k * (i % 2 ? 52 : 40) - 90 + k * 64;
              const rad = (a * Math.PI) / 180;
              const cx = wx + Math.cos(rad) * L * 0.55;
              const cy = wy + Math.sin(rad) * L * 0.55 + 4;
              return (
                <ellipse
                  key={k}
                  cx={cx}
                  cy={cy}
                  rx={L * (k === 0 ? 0.42 : 0.56)}
                  ry={L * 0.2}
                  fill={leafFill}
                  stroke={C.leafDark}
                  strokeWidth={2.4}
                  transform={`rotate(${a} ${cx} ${cy})`}
                />
              );
            })}
          </g>
        );
      })}
      <ellipse cx={tip[0]} cy={tip[1]} rx={6.5 * scale} ry={3.8 * scale} fill={C.leafLight} stroke={C.leafDark} strokeWidth={2.4} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ indicator key card

const KEY_ITEMS = [
  { s: -1, text: "more CO2" },
  { s: 0, text: "air" },
  { s: 1, text: "less CO2" },
] as const;

/**
 * The hydrogencarbonate-indicator colour key on a taped card: yellow ← red → purple with what each
 * colour means. (x, y) = top-left. `show` [yellow, red, purple] and `arrows` [to yellow, to purple] build it.
 */
export const IndicatorKeyCard: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w?: number;
  readonly h?: number;
  readonly rotate?: number;
  readonly progress: number;
  readonly show: readonly [number, number, number];
  readonly arrows: readonly [number, number];
  readonly hi?: readonly [number, number, number];
  /** 0..1 a little wiggle ("look here") */
  readonly wiggle?: number;
  readonly title?: string;
}> = ({ x, y, w = 600, h = 160, rotate = -1.5, progress, show, arrows, hi = [0, 0, 0], wiggle = 0, title = "Indicator key" }) => {
  const id = useSvgId("ikey");
  if (progress <= 0) return null;
  const p = clamp01(progress);
  const s = (1.15 - 0.15 * EASE.out(p)) * (1 + 0.04 * Math.sin(clamp01(wiggle) * Math.PI));
  const rot = rotate + (1 - p) * 5 + Math.sin(clamp01(wiggle) * Math.PI * 3) * 2.5 * (1 - clamp01(wiggle));
  const cols = [0.18, 0.5, 0.82].map((k) => w * k);
  const sy = 62;
  const sh = 40;
  const sw = 112;
  return (
    <g opacity={Math.min(1, p * 3)} transform={`translate(${x + w / 2} ${y + h / 2}) rotate(${rot}) scale(${s}) translate(${-w / 2} ${-h / 2})`}>
      <defs>
        <filter id={`${id}-s`} x="-20%" y="-30%" width="140%" height="170%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <rect x={8} y={14} width={w} height={h} rx={14} fill="#000000" opacity={0.3} filter={`url(#${id}-s)`} />
      <rect width={w} height={h} rx={14} fill={C.paper} stroke={INK} strokeWidth={4} />
      <rect x={4} y={4} width={w - 8} height={6} rx={3} fill="#FFFFFF" opacity={0.7} />
      {/* tape */}
      <rect x={-22} y={-8} width={86} height={28} rx={2} fill={W2.tape} opacity={0.85} transform="rotate(-32 20 6)" />
      <rect x={w - 64} y={-8} width={86} height={28} rx={2} fill={W2.tape} opacity={0.85} transform={`rotate(32 ${w - 20} 6)`} />
      <text x={w / 2} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={INK} letterSpacing={1}>
        {title}
      </text>
      {KEY_ITEMS.map((it, i) => {
        const q = show[i];
        if (q <= 0) return null;
        const cx = cols[i];
        const ps = back(q) * (1 + 0.1 * hi[i]);
        const col = indicatorColour(it.s);
        return (
          <g key={i} opacity={Math.min(1, q * 2)}>
            <g transform={`translate(${cx} ${sy + sh / 2}) scale(${ps}) translate(${-cx} ${-(sy + sh / 2)})`}>
              <rect x={cx - sw / 2} y={sy} width={sw} height={sh} rx={13} fill={col} stroke={INK} strokeWidth={4} />
              <rect x={cx - sw / 2 + 10} y={sy + 6} width={sw - 40} height={7} rx={3.5} fill="#FFFFFF" opacity={0.5} />
            </g>
            <ChemText text={it.text} x={cx} y={h - 16} size={40} weight={600} color={INK} anchor="middle" />
          </g>
        );
      })}
      {[0, 1].map((k) => {
        const q = arrows[k];
        if (q <= 0) return null;
        const from = cols[1] + (k === 0 ? -1 : 1) * (sw / 2 + 6);
        const to = cols[k === 0 ? 0 : 2] + (k === 0 ? 1 : -1) * (sw / 2 + 6);
        return <HandArrow key={k} from={[from, sy + sh / 2]} to={[to, sy + sh / 2]} bend={0} progress={q} width={4} head={13} color={INK} seed={71 + k} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------------------------ "?" buddy that looks around

/** A "?" with eyes that bobs over something to predict, and can look left/right (`look` −1..1). */
export const PeekQuestion: React.FC<{ readonly x: number; readonly y: number; readonly size?: number; readonly progress?: number; readonly color?: string; readonly seed?: number; readonly look?: number; readonly opacity?: number }> = ({
  x,
  y,
  size = 90,
  progress = 1,
  color = C.amber,
  seed = 1,
  look = 0,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  if (progress <= 0 || opacity <= 0) return null;
  const bob = Math.sin((f + seed * 17) / 11) * 6;
  const tilt = Math.sin((f + seed * 29) / 23) * 5 + look * 6;
  const pop = back(progress);
  const sq = 1 + 0.1 * Math.sin(clamp01(progress * 1.4) * Math.PI);
  const s = (size / 90) * pop;
  const blink = (f + seed * 41) % 89 < 4;
  const hook = "M-22,-24 C-22,-44 22,-46 22,-22 C22,-6 4,-2 4,14";
  const eye = (cx: number) =>
    blink ? (
      <path d={`M${cx - 5},1 Q${cx},4 ${cx + 5},1`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={cx} cy={0} rx={6.5} ry={8} fill="#FFFFFF" stroke={INK} strokeWidth={2.2} />
        <circle cx={cx + look * 3.4} cy={1.5} r={3.4} fill={INK} />
        <circle cx={cx + look * 3.4 - 1.2} cy={0} r={1.1} fill="#FFFFFF" />
      </g>
    );
  return (
    <g opacity={Math.min(1, progress * 2) * opacity} transform={`translate(${x} ${y + bob}) rotate(${tilt}) scale(${s / sq} ${s * sq})`}>
      <path d={hook} fill="none" stroke={INK} strokeWidth={23} strokeLinecap="round" strokeLinejoin="round" />
      <path d={hook} fill="none" stroke={color} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-16,-30 C-14,-38 -4,-42 6,-40" fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
      <circle cx={4} cy={36} r={10.5} fill={color} stroke={INK} strokeWidth={4} />
      <g transform="translate(0 -33)">
        {eye(-8)}
        {eye(8)}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------ thought cloud

/**
 * A thought cloud centred (x, y), w × h, with a trail of little bubbles from `from` (the thinker's head).
 * `progress` 0..1: the trail bubbles pop first, then the cloud. Children are drawn centred on (x, y).
 */
export const ThoughtCloud: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly from: Pt; readonly progress: number; readonly children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  from,
  progress,
  children,
}) => {
  const id = useSvgId("think");
  const f = useCurrentFrame();
  if (progress <= 0) return null;
  const p = clamp01(progress);
  // bumps round an ellipse
  const n = 12;
  const bumps = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + 0.2;
    const k = i % 2 ? 0.22 : 0.27;
    return [Math.cos(a) * (w / 2 - h * k), Math.sin(a) * (h / 2 - h * k), h * k] as const;
  });
  const shapes = (extra: number) => (
    <g>
      <ellipse cx={0} cy={0} rx={w / 2 - h * 0.2 + extra} ry={h / 2 - h * 0.2 + extra} />
      {bumps.map(([bx, by, br], i) => (
        <circle key={i} cx={bx} cy={by} r={br + extra} />
      ))}
    </g>
  );
  // the cloud's edge nearest the thinker
  const toward = Math.atan2(from[1] - y, from[0] - x);
  const edge: Pt = [x + Math.cos(toward) * (w / 2) * 0.82, y + Math.sin(toward) * (h / 2) * 0.86];
  const trail = [0.25, 0.52, 0.76].map((t, i) => ({
    c: [from[0] + (edge[0] - from[0]) * t, from[1] + (edge[1] - from[1]) * t] as Pt,
    r: 9 + i * 5,
    q: back(clamp01((p - i * 0.1) / 0.22)),
  }));
  const cq = back(clamp01((p - 0.25) / 0.75));
  const breathe = 1 + 0.012 * Math.sin(f / 14);
  return (
    <g>
      <defs>
        <filter id={`${id}-s`} x="-30%" y="-30%" width="160%" height="170%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>
      {trail.map((t, i) =>
        t.q > 0 ? (
          <circle key={i} cx={t.c[0]} cy={t.c[1]} r={t.r * t.q} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
        ) : null,
      )}
      {cq > 0 ? (
        <g transform={`translate(${x} ${y}) scale(${cq * breathe})`} opacity={Math.min(1, cq * 2)}>
          <g fill="#000000" opacity={0.22} transform="translate(8 16)" filter={`url(#${id}-s)`}>
            {shapes(0)}
          </g>
          <g fill={INK}>{shapes(5)}</g>
          <g fill="#FFFFFF">{shapes(0)}</g>
          <g transform={`translate(0 0)`}>{children}</g>
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------------------------ topic tag (dark ink)

/** The chapter tag for light worlds (the bench wall): ink badge with the number, title in ink. */
export const InkTopicTag: React.FC<{ readonly x?: number; readonly y?: number; readonly n: number; readonly title: string; readonly progress?: number }> = ({ x = 110, y = 104, n, title, progress = 1 }) => {
  if (progress <= 0) return null;
  const p = EASE.out(clamp01(progress));
  return (
    <g opacity={p} transform={`translate(${x - (1 - p) * 30} ${y})`}>
      <rect x={4} y={6} width={60} height={60} rx={16} fill="#000000" opacity={0.18} />
      <rect width={60} height={60} rx={16} fill={INK} />
      <text x={30} y={45} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42} fill={C.paper}>
        {n}
      </text>
      <text x={84} y={45} fontFamily={FONT} fontWeight={600} fontSize={42} fill={INK}>
        {title}
      </text>
    </g>
  );
};

// ------------------------------------------------------------------------------------ wall clock

/**
 * A lab wall clock. `hours` is the time shown (e.g. 9.08 = 9:05); the red second hand ticks once a second
 * from the frame. `spin` (hours) sweeps the hands forward (time passing); `wobble` 0..1 rattles it.
 */
export const WallClock: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly hours?: number; readonly spin?: number; readonly wobble?: number; readonly progress?: number }> = ({
  x,
  y,
  r = 62,
  hours = 9.08,
  spin = 0,
  wobble = 0,
  progress = 1,
}) => {
  const id = useSvgId("clock");
  const f = useCurrentFrame();
  if (progress <= 0) return null;
  const t = hours + spin;
  const hA = (t % 12) * 30;
  const mA = (t % 1) * 360;
  const sA = Math.floor(f / 30) * 6 + (spin > 0 ? spin * 360 * 60 : 0);
  const rot = Math.sin(clamp01(wobble) * Math.PI * 4) * 6 * (1 - clamp01(wobble));
  const hand = (deg: number, len: number, width: number, color: string) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return <line x1={-Math.cos(a) * len * 0.18} y1={-Math.sin(a) * len * 0.18} x2={Math.cos(a) * len} y2={Math.sin(a) * len} stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };
  return (
    <g opacity={Math.min(1, progress * 2)} transform={`translate(${x} ${y}) rotate(${rot}) scale(${back(progress)})`}>
      <defs>
        <filter id={`${id}-s`} x="-40%" y="-40%" width="180%" height="190%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
        <radialGradient id={`${id}-face`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={C.paper} />
        </radialGradient>
      </defs>
      <circle cx={5} cy={10} r={r + 8} fill="#000000" opacity={0.2} filter={`url(#${id}-s)`} />
      <circle r={r + 8} fill={mix(C.ink400, "#FFFFFF", 0.15)} stroke={INK} strokeWidth={4.5} />
      <circle r={r - 2} fill={`url(#${id}-face)`} stroke={INK} strokeWidth={3.5} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const l = i % 3 === 0 ? 13 : 7;
        return <line key={i} x1={Math.cos(a) * (r - 10)} y1={Math.sin(a) * (r - 10)} x2={Math.cos(a) * (r - 10 - l)} y2={Math.sin(a) * (r - 10 - l)} stroke={INK} strokeWidth={i % 3 === 0 ? 4.5 : 3} strokeLinecap="round" />;
      })}
      {hand(hA, r * 0.5, 7, INK)}
      {hand(mA, r * 0.74, 5, INK)}
      {hand(sA, r * 0.8, 2.5, C.coralDeep)}
      <circle r={6} fill={C.coralDeep} stroke={INK} strokeWidth={2.5} />
      <path d={`M${-r * 0.55},${-r * 0.45} A${r * 0.78},${r * 0.78} 0 0 1 ${-r * 0.05},${-r * 0.72}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** A cartoon packet of light travelling from `from` to `to` (p 0..1): a little sun-yellow ball with a streak. */
export const LightDot: React.FC<{ readonly from: Pt; readonly to: Pt; readonly p: number; readonly r?: number }> = ({ from, to, p, r = 7 }) => {
  if (p <= 0 || p >= 1) return null;
  const at = (q: number): Pt => [from[0] + (to[0] - from[0]) * q, from[1] + (to[1] - from[1]) * q];
  const [x, y] = at(p);
  const [tx, ty] = at(Math.max(0, p - 0.22));
  const fade = Math.min(1, p * 6) * Math.min(1, (1 - p) * 8);
  return (
    <g opacity={fade}>
      <line x1={tx} y1={ty} x2={x} y2={y} stroke={C.amber} strokeOpacity={0.7} strokeWidth={r * 0.9} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r} fill={mix(C.sun, "#FFFFFF", 0.3)} stroke={C.amberDeep} strokeWidth={2.5} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ reagent bottle

/** A dropper bottle of reagent standing on the bench at (x, floor), with a blank paper label. */
export const ReagentBottle: React.FC<{ readonly x: number; readonly floor: number; readonly w?: number; readonly h?: number; readonly colour: string; readonly level?: number; readonly progress?: number; readonly tilt?: number }> = ({
  x,
  floor,
  w = 92,
  h = 150,
  colour,
  level = 0.62,
  progress = 1,
  tilt = 0,
}) => {
  const id = useSvgId("bottle");
  if (progress <= 0) return null;
  const top = floor - h;
  const shoulder = top + 40;
  const body = `M${x - w / 2 + 14},${floor} Q${x - w / 2},${floor} ${x - w / 2},${floor - 14} L${x - w / 2},${shoulder + 16} Q${x - w / 2},${shoulder} ${x - 18},${shoulder - 6} L${x - 16},${top + 12} L${x + 16},${top + 12} L${x + 18},${shoulder - 6} Q${x + w / 2},${shoulder} ${x + w / 2},${shoulder + 16} L${x + w / 2},${floor - 14} Q${x + w / 2},${floor} ${x + w / 2 - 14},${floor} Z`;
  const surf = floor - (floor - shoulder) * level;
  return (
    <g opacity={Math.min(1, progress * 2)} transform={`rotate(${tilt} ${x} ${floor}) translate(${x} ${floor}) scale(${back(progress)}) translate(${-x} ${-floor})`}>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={body} />
        </clipPath>
        <filter id={`${id}-s`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <ellipse cx={x} cy={floor + 2} rx={w / 2 + 12} ry={9} fill={INK} opacity={0.22} filter={`url(#${id}-s)`} />
      <path d={body} fill="#FFFFFF" opacity={0.45} />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={x - w} y={surf} width={w * 2} height={floor - surf + 4} fill={colour} />
        <rect x={x - w} y={surf} width={w * 2} height={5} fill={mix(colour, "#FFFFFF", 0.5)} />
      </g>
      <path d={roundRectPath(x - w / 2 + 12, shoulder + 34, w - 24, 52, 6)} fill={C.paper} stroke={INK} strokeWidth={3} />
      <line x1={x - w / 2 + 24} y1={shoulder + 52} x2={x + w / 2 - 30} y2={shoulder + 52} stroke={INK} strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
      <line x1={x - w / 2 + 24} y1={shoulder + 68} x2={x + 4} y2={shoulder + 68} stroke={INK} strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
      <line x1={x - w / 2 + 9} y1={shoulder + 22} x2={x - w / 2 + 9} y2={floor - 18} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={6} strokeLinecap="round" />
      <path d={body} fill="none" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      {/* dropper: collar + rubber teat */}
      <path d={roundRectPath(x - 21, top + 2, 42, 16, 5)} fill={mix(C.ink400, "#FFFFFF", 0.2)} stroke={INK} strokeWidth={3.5} />
      <path d={`M${x - 13},${top + 4} Q${x - 15},${top - 34} ${x},${top - 38} Q${x + 15},${top - 34} ${x + 13},${top + 4} Z`} fill={C.terracotta} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={`M${x - 6},${top - 26} Q${x - 4},${top - 32} ${x + 2},${top - 33}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};
