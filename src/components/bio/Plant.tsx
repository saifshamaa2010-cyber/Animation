import React from "react";
import { C, EASE } from "../../brand/tokens";
import { Pt, rng, smoothOpenPath } from "../../lib/geometry";
import { LitShape, mix } from "../kit/shared";
import { useSvgId } from "../ids";
import { Leaf, LeafTone, leafGeometry } from "./Leaf";

/** Plants, pots, soil and roots (reusable for any plant topic). */

// ------------------------------------------------------------------ pot
export const Pot: React.FC<{
  /** centre of the pot's rim */
  readonly x: number;
  readonly y: number;
  readonly w?: number;
  readonly h?: number;
  readonly progress?: number;
  /** show the soil surface */
  readonly soil?: boolean;
}> = ({ x, y, w = 300, h = 260, progress = 1, soil = true }) => {
  if (progress <= 0) return null;
  const rimH = h * 0.14;
  const top = w / 2;
  const bot = w * 0.36;
  const body = `M${x - top * 0.94},${y + rimH} L${x + top * 0.94},${y + rimH} L${x + bot},${y + h} Q${x},${y + h + 10} ${x - bot},${y + h} Z`;
  const rim = `M${x - top},${y} L${x + top},${y} L${x + top},${y + rimH} L${x - top},${y + rimH} Z`;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      {soil ? <ellipse cx={x} cy={y + 6} rx={top * 0.9} ry={rimH * 0.5} fill={C.soil} /> : null}
      <LitShape d={body} top={C.terracotta} bottom={C.terracottaDeep} rimOpacity={0.4} shadow={0.5} shadowDy={14} shadowBlur={14} />
      <LitShape d={rim} top={mix(C.terracotta, C.paper, 0.15)} bottom={C.terracotta} rimOpacity={0.55} shadow={0} />
      {soil ? <ellipse cx={x} cy={y + 4} rx={top * 0.86} ry={rimH * 0.36} fill={mix(C.soil, C.soilLight, 0.35)} /> : null}
    </g>
  );
};

// ------------------------------------------------------------------ soil block (cut-away ground)
export const SoilBlock: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly progress?: number; readonly seed?: number }> = ({
  x,
  y,
  w,
  h,
  progress = 1,
  seed = 3,
}) => {
  const id = useSvgId("soil");
  if (progress <= 0) return null;
  const r = rng(seed);
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.soilLight} />
          <stop offset="0.25" stopColor={C.soil} />
          <stop offset="1" stopColor={mix(C.soil, C.ink900, 0.55)} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={28} fill={`url(#${id}-g)`} />
      <rect x={x} y={y} width={w} height={8} rx={4} fill={mix(C.soilLight, C.paper, 0.25)} opacity={0.6} />
      {Array.from({ length: Math.round((w * h) / 9000) }, (_, i) => (
        <ellipse key={i} cx={x + 20 + r() * (w - 40)} cy={y + 24 + r() * (h - 44)} rx={4 + r() * 9} ry={3 + r() * 6} fill={mix(C.soil, C.paper, 0.18 + r() * 0.15)} opacity={0.5} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ roots
/** Branching roots growing down from (x, y). `progress` grows them; root hairs appear at the end. */
export const Roots: React.FC<{ readonly x: number; readonly y: number; readonly depth?: number; readonly spread?: number; readonly progress?: number; readonly seed?: number; readonly color?: string }> = ({
  x,
  y,
  depth = 260,
  spread = 220,
  progress = 1,
  seed = 5,
  color = C.cream,
}) => {
  if (progress <= 0) return null;
  const r = rng(seed);
  const roots: Pt[][] = [];
  const main: Pt[] = [[x, y], [x + 6, y + depth * 0.35], [x - 4, y + depth * 0.7], [x + 3, y + depth]];
  roots.push(main);
  for (let i = 0; i < 8; i++) {
    const t = 0.12 + i * 0.1;
    const sx = x + (r() - 0.5) * 8;
    const sy = y + depth * t;
    const side = i % 2 ? 1 : -1;
    const L = spread * (0.55 + r() * 0.45) * (1 - t * 0.5);
    roots.push([[sx, sy], [sx + side * L * 0.4, sy + 16 + r() * 18], [sx + side * L * 0.8, sy + 40 + r() * 40], [sx + side * L, sy + 70 + r() * 50]]);
  }
  const p = EASE.out(Math.min(1, progress));
  return (
    <g>
      {roots.map((pts, i) => (
        <path
          key={i}
          d={smoothOpenPath(pts)}
          fill="none"
          stroke={color}
          strokeWidth={i === 0 ? 9 : 5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - Math.max(0, Math.min(1, (p - i * 0.04) / 0.7))}
          opacity={0.92}
        />
      ))}
      {/* root hairs near the tips: big surface area for absorbing water and ions */}
      {p > 0.8
        ? roots.slice(1).map((pts, i) => {
            const [ex, ey] = pts[pts.length - 1];
            return (
              <g key={`h${i}`} opacity={(p - 0.8) / 0.2}>
                {[0, 1, 2, 3].map((k) => (
                  <line key={k} x1={ex - k * 8} y1={ey - k * 6} x2={ex - k * 8 + 6} y2={ey - k * 6 + 12} stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
                ))}
              </g>
            );
          })
        : null}
    </g>
  );
};

// ------------------------------------------------------------------ plant
export type PlantProps = {
  /** where the stem meets the soil */
  readonly x: number;
  readonly y: number;
  readonly height?: number;
  readonly leaves?: number;
  /** colour of leaf i (0 = lowest = oldest) */
  readonly leafTone?: (i: number) => LeafTone;
  /** interveinal yellowing per leaf (magnesium deficiency), 0..1 */
  readonly leafInterveinal?: (i: number) => number;
  /** 0..1 growth */
  readonly progress?: number;
  /** overall size of leaves relative to height */
  readonly leafScale?: number;
};

/** A young dicot plant (think bean): stem with alternate leaves, oldest at the bottom. */
export const Plant: React.FC<PlantProps> = ({ x, y, height = 420, leaves = 6, leafTone = () => "green", leafInterveinal = () => 0, progress = 1, leafScale = 1 }) => {
  if (progress <= 0) return null;
  const g = EASE.out(Math.min(1, progress));
  const H = height * (0.35 + 0.65 * g);
  const stem: Pt[] = [[x, y], [x + 8, y - H * 0.35], [x - 6, y - H * 0.7], [x + 4, y - H]];
  const at = (t: number): Pt => {
    const k = Math.min(stem.length - 2, Math.floor(t * (stem.length - 1)));
    const u = t * (stem.length - 1) - k;
    return [stem[k][0] + (stem[k + 1][0] - stem[k][0]) * u, stem[k][1] + (stem[k + 1][1] - stem[k][1]) * u];
  };
  return (
    <g>
      <path d={smoothOpenPath(stem)} fill="none" stroke={C.stem} strokeWidth={14} strokeLinecap="round" />
      <path d={smoothOpenPath(stem)} fill="none" stroke={C.leafLight} strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" transform="translate(-3 0)" />
      {Array.from({ length: leaves }, (_, i) => {
        const t = 0.22 + (i / Math.max(1, leaves - 1)) * 0.74;
        const side = i % 2 ? 1 : -1;
        const [nx, ny] = at(t);
        const size = (1 - i * 0.06) * height * 0.32 * leafScale;
        const appear = Math.max(0, Math.min(1, (g - i * 0.08) / 0.4));
        const geo = leafGeometry({ cx: nx + side * size * 0.62, cy: ny - size * 0.2, len: size, wid: size * 0.52, ang: side > 0 ? -22 : 202, stalk: 0.18, veinPairs: 4 });
        return <Leaf key={i} geo={geo} tone={leafTone(i)} interveinal={leafInterveinal(i)} progress={appear} shadow={0.35} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ willow
/** A young weeping willow growing out of a pot. `growth` 0 (sapling) … 1 (five years on). */
export const Willow: React.FC<{ readonly x: number; readonly y: number; readonly growth: number; readonly scale?: number; readonly opacity?: number }> = ({
  x,
  y,
  growth,
  scale = 1,
  opacity = 1,
}) => {
  const g = Math.max(0, Math.min(1, growth));
  const r = rng(17);
  const H = (110 + 380 * g) * scale;
  const tw = (8 + 26 * g) * scale;
  const trunk = `M${x - tw},${y} C${x - tw * 0.8},${y - H * 0.4} ${x - tw * 0.35},${y - H * 0.75} ${x - tw * 0.2},${y - H} L${x + tw * 0.2},${y - H} C${x + tw * 0.35},${y - H * 0.75} ${x + tw * 0.8},${y - H * 0.4} ${x + tw},${y} Z`;
  const nBranch = Math.round(5 + 9 * g);
  const crown = (90 + 300 * g) * scale;
  const branches = Array.from({ length: 14 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const k = (i + 1) / 15;
    const sx = x + side * tw * 0.2;
    const sy = y - H * (0.62 + 0.36 * k);
    const reach = crown * (0.45 + 0.55 * r()) * (0.6 + 0.4 * k);
    const peak: Pt = [sx + side * reach * 0.55, sy - (40 + 60 * r()) * scale * (0.5 + g)];
    const end: Pt = [sx + side * reach, sy + (H * 0.45 + r() * 60) * (0.55 + 0.45 * g)];
    return { pts: [[sx, sy], peak, end] as Pt[], side, show: i < nBranch };
  });
  return (
    <g opacity={opacity}>
      {branches
        .filter((b) => b.show)
        .map((b, i) => (
          <path key={`b${i}`} d={smoothOpenPath(b.pts)} fill="none" stroke={C.bark} strokeWidth={(3 + 4 * g) * scale} strokeLinecap="round" opacity={0.95} />
        ))}
      <LitShape d={trunk} top={C.bark} bottom={C.barkDeep} rimOpacity={0.4} shadow={0.4} shadowDy={8} shadowBlur={10} />
      {/* hanging leaves: long and thin, along each drooping branch */}
      {branches
        .filter((b) => b.show)
        .map((b, i) => {
          const [, peak, end] = b.pts;
          const n = Math.round(9 + 16 * g);
          return (
            <g key={`l${i}`}>
              {Array.from({ length: n }, (_, j) => {
                // each leaf has its own seed, so leaves don't jump around as the tree grows
                const q = rng(1000 + i * 97 + j * 13);
                const t = j / n;
                // leaves all along the branch: the rising part, then the long hanging part
                const [ax, ay] = b.pts[0];
                const rising = t < 0.3;
                const tt = rising ? t / 0.3 : (t - 0.3) / 0.7;
                const px = (rising ? ax + (peak[0] - ax) * tt : peak[0] + (end[0] - peak[0]) * tt) + (q() - 0.5) * 10;
                const py = (rising ? ay + (peak[1] - ay) * tt : peak[1] + (end[1] - peak[1]) * tt * tt) + (q() - 0.5) * 6;
                const len = (16 + 10 * q()) * scale * (0.7 + 0.5 * g);
                return (
                  <ellipse
                    key={j}
                    cx={px + b.side * 3}
                    cy={py + len * 0.5}
                    rx={len * 0.16}
                    ry={len * 0.62}
                    fill={j % 3 === 0 ? C.leafLight : j % 3 === 1 ? C.leaf : C.leafDeep}
                    transform={`rotate(${b.side * (8 + q() * 14)} ${px} ${py})`}
                    opacity={0.95}
                  />
                );
              })}
            </g>
          );
        })}
    </g>
  );
};
