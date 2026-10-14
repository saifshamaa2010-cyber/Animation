import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { Pt, rng } from "../../lib/geometry";
import { LitShape, mix, roundRectPath } from "../kit/shared";
import { useSvgId } from "../ids";

/**
 * School-lab apparatus in the house style (glass = thin light outline, faint fill, one highlight;
 * liquids lit from above). Reusable for every practical. All positions are screen pixels.
 */

const GLASS_STROKE = { stroke: C.paper, strokeOpacity: 0.75, strokeWidth: 4, fill: C.glass, fillOpacity: 0.08 } as const;

const Liquid: React.FC<{ d: string; color: string; clipId: string; top: number; bottom: number; level: number }> = ({ d, color, clipId, top, bottom, level }) => {
  if (level <= 0) return null;
  const surf = bottom - (bottom - top) * Math.min(1, level);
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={-5000} y={surf} width={10000} height={bottom - surf + 20} fill={color} opacity={0.82} />
        <rect x={-5000} y={surf} width={10000} height={Math.min(24, bottom - surf)} fill={C.paper} opacity={0.12} />
        <line x1={-5000} y1={surf} x2={5000} y2={surf} stroke={mix(color, C.paper, 0.5)} strokeWidth={3} opacity={0.9} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ tubes
export type TubeProps = {
  /** centre of the tube's mouth */
  readonly x: number;
  readonly y: number;
  readonly w?: number;
  readonly h?: number;
  /** 0..1 fill level */
  readonly liquid?: number;
  readonly liquidColor?: string;
  /** rotation in degrees around the mouth */
  readonly rot?: number;
  readonly progress?: number;
  /** things inside the tube (screen coords), drawn under the liquid surface highlight */
  readonly children?: React.ReactNode;
  /** a stopper in the mouth */
  readonly bung?: boolean;
};

/** Boiling tube (default size) or test tube (pass smaller w/h). */
export const Tube: React.FC<TubeProps> = ({ x, y, w = 74, h = 330, liquid = 0, liquidColor = C.ice, rot = 0, progress = 1, children, bung = false }) => {
  const id = useSvgId("tube");
  if (progress <= 0) return null;
  const r = w / 2;
  const d = `M${x - r},${y} L${x - r},${y + h - r} A${r},${r} 0 0 0 ${x + r},${y + h - r} L${x + r},${y} Z`;
  return (
    <g transform={`rotate(${rot} ${x} ${y})`} opacity={Math.min(1, progress * 1.5)}>
      <path d={d} {...GLASS_STROKE} strokeWidth={0} />
      <Liquid d={d} color={liquidColor} clipId={`${id}-l`} top={y} bottom={y + h} level={liquid} />
      {children}
      <path d={`M${x - r},${y - 6} L${x - r},${y + h - r} A${r},${r} 0 0 0 ${x + r},${y + h - r} L${x + r},${y - 6}`} fill="none" stroke={C.paper} strokeOpacity={0.78} strokeWidth={4} strokeLinejoin="round" />
      <ellipse cx={x} cy={y - 6} rx={r + 4} ry={6} fill="none" stroke={C.paper} strokeOpacity={0.6} strokeWidth={3} />
      <line x1={x - r + 12} y1={y + 18} x2={x - r + 12} y2={y + h - r - 4} stroke={C.paper} strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" />
      {bung ? <LitShape d={roundRectPath(x - r + 2, y - 38, w - 4, 44, 8)} top={C.terracotta} bottom={C.terracottaDeep} rimOpacity={0.4} shadow={0} /> : null}
    </g>
  );
};

/** A rack holding tubes: draw the rack, then put Tubes with their mouths at rackSlots(). */
export const rackSlots = (x: number, y: number, n: number, gap = 190): Pt[] => Array.from({ length: n }, (_, i) => [x + (i - (n - 1) / 2) * gap, y]);
export const Rack: React.FC<{ readonly x: number; readonly y: number; readonly n: number; readonly gap?: number; readonly progress?: number }> = ({ x, y, n, gap = 190, progress = 1 }) => {
  if (progress <= 0) return null;
  const w = gap * n + 40;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <LitShape d={roundRectPath(x - w / 2, y + 120, w, 26, 8)} top={C.ink400} bottom={C.ink600} rimOpacity={0.4} shadow={0.4} />
      <LitShape d={roundRectPath(x - w / 2, y + 300, w, 30, 8)} top={C.ink400} bottom={C.ink600} rimOpacity={0.4} shadow={0.5} />
      <rect x={x - w / 2 + 10} y={y + 140} width={14} height={170} fill={C.ink500} />
      <rect x={x + w / 2 - 24} y={y + 140} width={14} height={170} fill={C.ink500} />
    </g>
  );
};

// ------------------------------------------------------------------ beaker & flask
export const Beaker: React.FC<{ readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly liquid?: number; readonly liquidColor?: string; readonly progress?: number; readonly children?: React.ReactNode }> = ({
  x,
  y,
  w = 300,
  h = 340,
  liquid = 0.6,
  liquidColor = C.ice,
  progress = 1,
  children,
}) => {
  const id = useSvgId("beaker");
  if (progress <= 0) return null;
  // (x, y) = bottom centre
  const l = x - w / 2;
  const t = y - h;
  const d = `M${l},${t} L${l},${y - 18} Q${l},${y} ${l + 18},${y} L${l + w - 18},${y} Q${l + w},${y} ${l + w},${y - 18} L${l + w},${t} Z`;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <path d={d} fill={C.glass} fillOpacity={0.08} />
      <Liquid d={d} color={liquidColor} clipId={`${id}-l`} top={t} bottom={y} level={liquid} />
      {children}
      <path d={`M${l - 14},${t - 8} Q${l},${t - 6} ${l},${t + 8} L${l},${y - 18} Q${l},${y} ${l + 18},${y} L${l + w - 18},${y} Q${l + w},${y} ${l + w},${y - 18} L${l + w},${t - 4}`} fill="none" stroke={C.paper} strokeOpacity={0.78} strokeWidth={4} strokeLinejoin="round" />
      <line x1={l + 16} y1={t + 30} x2={l + 16} y2={y - 30} stroke={C.paper} strokeOpacity={0.28} strokeWidth={6} strokeLinecap="round" />
      {[0.25, 0.45, 0.65].map((k) => (
        <line key={k} x1={l + w - 50} y1={y - h * k} x2={l + w - 18} y2={y - h * k} stroke={C.paper} strokeOpacity={0.45} strokeWidth={3} />
      ))}
    </g>
  );
};

export const ConicalFlask: React.FC<{ readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly liquid?: number; readonly liquidColor?: string; readonly bung?: boolean; readonly progress?: number; readonly children?: React.ReactNode }> = ({
  x,
  y,
  w = 300,
  h = 360,
  liquid = 0,
  liquidColor = C.ice,
  bung = true,
  progress = 1,
  children,
}) => {
  const id = useSvgId("flask");
  if (progress <= 0) return null;
  const neckW = w * 0.3;
  const neckH = h * 0.26;
  const t = y - h;
  const d = `M${x - neckW / 2},${t} L${x - neckW / 2},${t + neckH} L${x - w / 2},${y - 16} Q${x - w / 2},${y} ${x - w / 2 + 18},${y} L${x + w / 2 - 18},${y} Q${x + w / 2},${y} ${x + w / 2},${y - 16} L${x + neckW / 2},${t + neckH} L${x + neckW / 2},${t} Z`;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <path d={d} fill={C.glass} fillOpacity={0.08} />
      <Liquid d={d} color={liquidColor} clipId={`${id}-l`} top={t} bottom={y} level={liquid} />
      {children}
      <path d={d} fill="none" stroke={C.paper} strokeOpacity={0.78} strokeWidth={4} strokeLinejoin="round" />
      <line x1={x - w / 2 + 40} y1={y - 26} x2={x - neckW / 2 - 6} y2={t + neckH + 26} stroke={C.paper} strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
      {bung ? <LitShape d={roundRectPath(x - neckW / 2 - 6, t - 34, neckW + 12, 50, 10)} top={C.terracotta} bottom={C.terracottaDeep} rimOpacity={0.4} shadow={0.3} /> : null}
    </g>
  );
};

/** Soda lime (absorbs carbon dioxide): a small dish of white granules. */
export const SodaLime: React.FC<{ readonly x: number; readonly y: number; readonly w?: number; readonly progress?: number }> = ({ x, y, w = 130, progress = 1 }) => {
  if (progress <= 0) return null;
  const r = rng(9);
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <path d={`M${x - w / 2},${y - 22} L${x - w / 2 + 8},${y} L${x + w / 2 - 8},${y} L${x + w / 2},${y - 22}`} fill={C.glass} fillOpacity={0.15} stroke={C.paper} strokeOpacity={0.7} strokeWidth={3} />
      {Array.from({ length: 18 }, (_, i) => (
        <circle key={i} cx={x - w / 2 + 14 + r() * (w - 28)} cy={y - 6 - r() * 16} r={5 + r() * 3} fill={i % 3 ? C.paper : mix(C.paper, C.ice, 0.3)} opacity={0.95} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ heating
/** Bunsen burner. `flame` 0 = off, 1 = full blue flame. (x, y) = base centre. */
export const Bunsen: React.FC<{ readonly x: number; readonly y: number; readonly flame?: number; readonly scale?: number; readonly progress?: number }> = ({ x, y, flame = 0, scale = 1, progress = 1 }) => {
  const frame = useCurrentFrame();
  if (progress <= 0) return null;
  const s = scale;
  const fl = Math.max(0, Math.min(1, flame));
  const flick = 1 + noise2D("bunsen", frame * 0.25, 0) * 0.06;
  const fh = 150 * s * fl * flick;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <LitShape d={roundRectPath(x - 70 * s, y - 22 * s, 140 * s, 22 * s, 8 * s)} top={C.ink400} bottom={C.ink600} rimOpacity={0.4} shadow={0.5} />
      <LitShape d={roundRectPath(x - 16 * s, y - 210 * s, 32 * s, 190 * s, 6 * s)} top={C.ink300} bottom={C.ink500} rimOpacity={0.5} shadow={0} />
      <rect x={x - 20 * s} y={y - 78 * s} width={40 * s} height={22 * s} rx={5 * s} fill={C.ink400} />
      <circle cx={x} cy={y - 67 * s} r={6 * s} fill={C.ink800} />
      {fl > 0 ? (
        <g>
          <path d={`M${x - 15 * s},${y - 210 * s} Q${x - 18 * s},${y - 210 * s - fh * 0.6} ${x},${y - 210 * s - fh} Q${x + 18 * s},${y - 210 * s - fh * 0.6} ${x + 15 * s},${y - 210 * s} Z`} fill={C.flame} opacity={0.45} />
          <path d={`M${x - 9 * s},${y - 210 * s} Q${x - 10 * s},${y - 210 * s - fh * 0.35} ${x},${y - 210 * s - fh * 0.55} Q${x + 10 * s},${y - 210 * s - fh * 0.35} ${x + 9 * s},${y - 210 * s} Z`} fill={mix(C.flame, C.paper, 0.35)} opacity={0.85} />
        </g>
      ) : null}
    </g>
  );
};

/** Electric water bath: a tank of hot water; `heat` 0..1 shows the heating light and rising steam. (x, y) = bottom centre. */
export const WaterBath: React.FC<{ readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly heat?: number; readonly progress?: number; readonly children?: React.ReactNode }> = ({
  x,
  y,
  w = 520,
  h = 230,
  heat = 1,
  progress = 1,
  children,
}) => {
  const frame = useCurrentFrame();
  if (progress <= 0) return null;
  const l = x - w / 2;
  const t = y - h;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      {/* back wall and water */}
      <rect x={l + 16} y={t + 40} width={w - 32} height={h - 56} rx={10} fill={C.ice} opacity={0.55} />
      <rect x={l + 16} y={t + 40} width={w - 32} height={14} fill={C.paper} opacity={0.18} />
      {children}
      {/* front of the tank: lower panel */}
      <LitShape d={roundRectPath(l, t + h * 0.55, w, h * 0.45, 16)} top={C.ink400} bottom={C.ink600} rimOpacity={0.4} shadow={0.5} />
      <path d={`M${l},${t + 20} L${l},${t + h * 0.6} M${l + w},${t + 20} L${l + w},${t + h * 0.6}`} stroke={C.ink300} strokeWidth={8} strokeLinecap="round" />
      <circle cx={l + w - 60} cy={y - h * 0.22} r={12} fill={heat > 0 ? C.coral : C.ink700} opacity={0.4 + 0.6 * heat} />
      <text x={l + 36} y={y - h * 0.16} fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.paper} opacity={0.9}>
        hot water
      </text>
      {/* steam */}
      {heat > 0
        ? [0, 1, 2].map((i) => {
            const ph = ((frame + i * 25) % 75) / 75;
            return (
              <path
                key={i}
                d={`M${l + 90 + i * (w - 180) / 2},${t + 30 - ph * 80} q-12,-20 0,-40 q12,-20 0,-40`}
                fill="none"
                stroke={C.paper}
                strokeOpacity={0.35 * heat * Math.sin(ph * Math.PI)}
                strokeWidth={6}
                strokeLinecap="round"
              />
            );
          })
        : null}
    </g>
  );
};

// ------------------------------------------------------------------ testing
/** A white tile (for spreading out a leaf to test it). (x, y) = centre. */
export const Tile: React.FC<{ readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly progress?: number }> = ({ x, y, w = 520, h = 340, progress = 1 }) => {
  if (progress <= 0) return null;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <LitShape d={roundRectPath(x - w / 2, y - h / 2, w, h, 18)} top={C.paper} bottom={C.paperDim} rimOpacity={0.9} shadow={0.6} shadowDy={14} shadowBlur={14} />
    </g>
  );
};

/** Dropper with a drop forming and falling (`drop` 0..1). (x, y) = tip. */
export const Dropper: React.FC<{ readonly x: number; readonly y: number; readonly drop?: number; readonly fall?: number; readonly color?: string; readonly progress?: number }> = ({
  x,
  y,
  drop = 0,
  fall = 120,
  color = C.iodine,
  progress = 1,
}) => {
  if (progress <= 0) return null;
  const dy = drop > 0.5 ? EASE.in((drop - 0.5) / 0.5) * fall : 0;
  const dr = 9 * Math.min(1, drop * 2);
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <path d={`M${x - 10},${y - 170} L${x - 10},${y - 24} L${x},${y} L${x + 10},${y - 24} L${x + 10},${y - 170} Z`} fill={C.glass} fillOpacity={0.15} stroke={C.paper} strokeOpacity={0.75} strokeWidth={3} />
      <rect x={x - 8} y={y - 110} width={16} height={86} fill={color} opacity={0.8} />
      <LitShape d={roundRectPath(x - 22, y - 250, 44, 86, 20)} top={C.ink300} bottom={C.ink600} rimOpacity={0.4} shadow={0.3} />
      {drop > 0 && drop < 1 ? <ellipse cx={x} cy={y + dr + dy} rx={dr * 0.85} ry={dr} fill={color} /> : null}
    </g>
  );
};

/** A reagent bottle with a label (and an optional flammable hazard sign). (x, y) = bottom centre. */
export const Bottle: React.FC<{ readonly x: number; readonly y: number; readonly label: string; readonly liquidColor?: string; readonly flammable?: boolean; readonly w?: number; readonly h?: number; readonly progress?: number }> = ({
  x,
  y,
  label,
  liquidColor = C.glass,
  flammable = false,
  w = 170,
  h = 240,
  progress = 1,
}) => {
  const id = useSvgId("bottle");
  if (progress <= 0) return null;
  const l = x - w / 2;
  const t = y - h;
  const body = `M${l + 20},${t + 50} L${l + w - 20},${t + 50} Q${l + w},${t + 60} ${l + w},${t + 90} L${l + w},${y - 16} Q${l + w},${y} ${l + w - 16},${y} L${l + 16},${y} Q${l},${y} ${l},${y - 16} L${l},${t + 90} Q${l},${t + 60} ${l + 20},${t + 50} Z`;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <path d={body} fill={C.glass} fillOpacity={0.1} />
      <Liquid d={body} color={liquidColor} clipId={`${id}-l`} top={t + 50} bottom={y} level={0.75} />
      <path d={body} fill="none" stroke={C.paper} strokeOpacity={0.75} strokeWidth={4} />
      <LitShape d={roundRectPath(x - 34, t, 68, 54, 10)} top={C.ink300} bottom={C.ink600} rimOpacity={0.4} shadow={0} />
      <LitShape d={roundRectPath(l + 14, t + 110, w - 28, 74, 8)} top={C.paper} bottom={C.paperDim} rimOpacity={0.6} shadow={0} />
      <text x={x} y={t + 160} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.ink900}>
        {label}
      </text>
      {flammable ? <HazardFlammable x={l + w - 4} y={t + 76} size={70} /> : null}
    </g>
  );
};

/** GHS-style "flammable" diamond. */
export const HazardFlammable: React.FC<{ readonly x: number; readonly y: number; readonly size?: number; readonly opacity?: number }> = ({ x, y, size = 80, opacity = 1 }) => {
  const s = size / 2;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <path d={`M0,${-s} L${s},0 L0,${s} L${-s},0 Z`} fill={C.paper} stroke={C.coralDeep} strokeWidth={s * 0.14} strokeLinejoin="round" />
      <path
        d={`M${-s * 0.1},${s * 0.42} C${-s * 0.42},${s * 0.3} ${-s * 0.4},${-s * 0.05} ${-s * 0.12},${-s * 0.42} C${-s * 0.08},${-s * 0.15} ${s * 0.08},${-s * 0.12} ${s * 0.12},${-s * 0.25} C${s * 0.36},${s * 0.02} ${s * 0.34},${s * 0.34} ${s * 0.1},${s * 0.42} Z`}
        fill={C.ink900}
      />
      <rect x={-s * 0.36} y={s * 0.42} width={s * 0.72} height={s * 0.08} fill={C.ink900} />
    </g>
  );
};

// ------------------------------------------------------------------ light sources & measuring
/** LED desk lamp; `on` 0..1 lights it and casts a beam towards `angle` (degrees, 0 = right). (x, y) = lamp head. */
export const Lamp: React.FC<{ readonly x: number; readonly y: number; readonly on?: number; readonly angle?: number; readonly beam?: number; readonly progress?: number; readonly label?: string }> = ({
  x,
  y,
  on = 1,
  angle = 0,
  beam = 520,
  progress = 1,
  label,
}) => {
  const id = useSvgId("lamp");
  if (progress <= 0) return null;
  const a = (angle * Math.PI) / 180;
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  const tip: Pt = [x + Math.cos(a) * 40, y + Math.sin(a) * 40];
  const far: Pt = [x + Math.cos(a) * beam, y + Math.sin(a) * beam];
  const spread = beam * 0.3;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <defs>
        <linearGradient id={`${id}-b`} gradientUnits="userSpaceOnUse" x1={tip[0]} y1={tip[1]} x2={far[0]} y2={far[1]}>
          <stop offset="0" stopColor={C.sun} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-f`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {on > 0 ? (
        <polygon
          points={`${tip[0] + nx * 30},${tip[1] + ny * 30} ${tip[0] - nx * 30},${tip[1] - ny * 30} ${far[0] - nx * spread},${far[1] - ny * spread} ${far[0] + nx * spread},${far[1] + ny * spread}`}
          fill={`url(#${id}-b)`}
          opacity={on}
          filter={`url(#${id}-f)`}
          style={{ mixBlendMode: "screen" }}
        />
      ) : null}
      {/* stand */}
      <line x1={x - Math.cos(a) * 30} y1={y + 10} x2={x - Math.cos(a) * 90} y2={y + 230} stroke={C.ink400} strokeWidth={12} strokeLinecap="round" />
      <LitShape d={roundRectPath(x - Math.cos(a) * 90 - 70, y + 226, 140, 22, 8)} top={C.ink400} bottom={C.ink600} rimOpacity={0.4} shadow={0.5} />
      {/* head */}
      <g transform={`rotate(${angle} ${x} ${y})`}>
        <LitShape d={`M${x - 50},${y - 30} L${x + 20},${y - 44} L${x + 40},${y - 44} L${x + 40},${y + 44} L${x + 20},${y + 44} L${x - 50},${y + 30} Z`} top={C.ink300} bottom={C.ink600} rimOpacity={0.5} shadow={0.4} />
        <rect x={x + 34} y={y - 40} width={12} height={80} rx={5} fill={on > 0 ? mix(C.sun, C.paper, 0.5) : C.ink500} opacity={0.5 + 0.5 * on} />
      </g>
      {label ? (
        <text x={x} y={y + 300} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.paper}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** A ruler from (x, y) of `length` px; `marks` every `step` px. */
export const Ruler: React.FC<{ readonly x: number; readonly y: number; readonly length: number; readonly step?: number; readonly progress?: number }> = ({ x, y, length, step = 40, progress = 1 }) => {
  if (progress <= 0) return null;
  const L = length * EASE.out(Math.min(1, progress));
  return (
    <g>
      <LitShape d={roundRectPath(x, y, L, 46, 6)} top={mix(C.amberLight, C.paper, 0.4)} bottom={C.creamDeep} rimOpacity={0.6} shadow={0.4} />
      {Array.from({ length: Math.floor(L / step) + 1 }, (_, i) => (
        <line key={i} x1={x + i * step} y1={y} x2={x + i * step} y2={y + (i % 5 === 0 ? 26 : 14)} stroke={C.ink800} strokeWidth={3} />
      ))}
    </g>
  );
};

/** Gas syringe: barrel from (x, y) to the right; `plunger` 0..1 = how much gas has been collected. */
export const GasSyringe: React.FC<{ readonly x: number; readonly y: number; readonly length?: number; readonly plunger?: number; readonly progress?: number }> = ({
  x,
  y,
  length = 420,
  plunger = 0,
  progress = 1,
}) => {
  if (progress <= 0) return null;
  const px = x + 20 + (length - 60) * Math.max(0, Math.min(1, plunger));
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <rect x={x} y={y - 34} width={length} height={68} rx={10} fill={C.glass} fillOpacity={0.1} stroke={C.paper} strokeOpacity={0.75} strokeWidth={4} />
      <rect x={x + 6} y={y - 28} width={Math.max(0, px - x - 6)} height={56} rx={6} fill={C.paper} opacity={0.12} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={x + 40 + i * ((length - 80) / 8)} y1={y - 34} x2={x + 40 + i * ((length - 80) / 8)} y2={y - 18} stroke={C.paper} strokeOpacity={0.6} strokeWidth={3} />
      ))}
      <rect x={px} y={y - 30} width={14} height={60} rx={4} fill={C.ink300} />
      <rect x={px + 14} y={y - 8} width={length + 40 - (px - x)} height={16} rx={6} fill={C.ink400} />
      <rect x={x + length + 40 - 0} y={y - 32} width={14} height={64} rx={5} fill={C.ink300} />
    </g>
  );
};

/** Aluminium foil wrapped round a tube (blocks light). (x, y) = top centre of the wrap. */
export const FoilWrap: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly progress?: number }> = ({ x, y, w, h, progress = 1 }) => {
  if (progress <= 0) return null;
  const p = EASE.out(Math.min(1, progress));
  const r = rng(4);
  const hh = h * p;
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) pts.push([x - w / 2 - 6 + (r() - 0.5) * 6, y + (i / 10) * hh]);
  for (let i = 10; i >= 0; i--) pts.push([x + w / 2 + 6 + (r() - 0.5) * 6, y + (i / 10) * hh]);
  const d = `M${pts.map((q) => q.join(",")).join("L")}Z`;
  return (
    <g>
      <LitShape d={d} top={C.foil} bottom={mix(C.foil, C.ink500, 0.5)} rimOpacity={0.7} shadow={0.3} />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${x - w / 2},${y + (i + 0.5) * (hh / 7)} l${w * 0.4},${(r() - 0.5) * 20} l${w * 0.6},${(r() - 0.5) * 20}`} fill="none" stroke={C.paper} strokeOpacity={0.4} strokeWidth={2} />
      ))}
    </g>
  );
};

/** Kitchen-style scale with a digital readout. (x, y) = centre of the weighing plate's top. */
export const Scale: React.FC<{ readonly x: number; readonly y: number; readonly w?: number; readonly reading?: string; readonly progress?: number; readonly glow?: number }> = ({
  x,
  y,
  w = 420,
  reading = "",
  progress = 1,
  glow = 0,
}) => {
  if (progress <= 0) return null;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <LitShape d={roundRectPath(x - w / 2, y, w, 26, 10)} top={C.ink300} bottom={C.ink500} rimOpacity={0.6} shadow={0.4} />
      <LitShape d={roundRectPath(x - w / 2 - 20, y + 26, w + 40, 110, 22)} top={C.ink500} bottom={C.ink700} rimOpacity={0.45} shadow={0.6} shadowDy={14} />
      <rect x={x - 150} y={y + 50} width={300} height={66} rx={10} fill={C.ink950} />
      {glow > 0 ? <rect x={x - 150} y={y + 50} width={300} height={66} rx={10} fill={C.amber} opacity={0.12 * glow} /> : null}
      <text x={x + 134} y={y + 98} textAnchor="end" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.amberLight} letterSpacing={1}>
        {reading}
      </text>
    </g>
  );
};
