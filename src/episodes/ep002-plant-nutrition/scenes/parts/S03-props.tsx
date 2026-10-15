/**
 * S03 helpers: the plate (you eat food), the definition's keyword chips and the flow-chart
 * connectors that join them (raw materials + energy from light → synthesise → carbohydrates).
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { LitShape, mix, textWidth } from "../../../../components/kit";
import { circlePath, roundRectPath } from "../../../../components/kit/shared";
import { leafGeometry } from "../../../../components/bio";
import { Pt, smoothClosedPath } from "../../../../lib/geometry";
import { useSvgId } from "../../../../components/ids";

// ------------------------------------------------------------------ plate

/** A plate seen from above with a bread roll, fork and knife — "you eat food". */
export const PlateMeal: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly progress: number }> = ({ x, y, r = 150, progress }) => {
  if (progress <= 0) return null;
  const p = EASE.out(Math.min(1, progress));
  const s = 0.92 + 0.08 * p;
  // bread roll: a soft, slightly lumpy oval
  const roll: Pt[] = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const k = 1 + 0.035 * Math.sin(a * 3 + 0.6);
    const rx = r * 0.5 * k;
    const ry = r * 0.34 * k;
    const c = Math.cos((-12 * Math.PI) / 180);
    const sn = Math.sin((-12 * Math.PI) / 180);
    const ex = Math.cos(a) * rx;
    const ey = Math.sin(a) * ry;
    return [x + ex * c - ey * sn, y + 4 + ex * sn + ey * c];
  });
  const fx = x - r - 66;
  const kx = x + r + 66;
  const fork = [
    roundRectPath(fx - 9, y - 20, 18, 150, 9),
    roundRectPath(fx - 26, y - 118, 52, 44, 14),
    ...[-19, -6.5, 6.5, 19].map((dx) => roundRectPath(fx + dx - 4.5, y - 168, 9, 70, 4.5)),
    roundRectPath(fx - 6, y - 80, 12, 70, 6),
  ].join(" ");
  const blade = `M${kx - 10},${y - 6} L${kx - 10},${y - 150} Q${kx - 10},${y - 176} ${kx + 6},${y - 172} Q${kx + 18},${y - 160} ${kx + 13},${y - 100} L${kx + 10},${y - 6} Z`;
  const handle = roundRectPath(kx - 11, y - 14, 22, 146, 10);
  return (
    <g opacity={Math.min(1, progress * 1.4)} transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>
      <LitShape d={circlePath(x, y, r)} top={C.paper} bottom={C.paperDim} rimOpacity={0.9} shadow={0.55} shadowDy={16} shadowBlur={16} />
      <circle cx={x} cy={y} r={r * 0.72} fill={mix(C.paperDim, C.ink300, 0.45)} opacity={0.32} />
      <circle cx={x} cy={y} r={r * 0.72} fill="none" stroke={C.paper} strokeOpacity={0.7} strokeWidth={3} strokeDasharray={`${r * 1.1} ${r * 9}`} transform={`rotate(110 ${x} ${y})`} />
      <LitShape d={smoothClosedPath(roll, 0.5)} top={mix(C.cream, C.amberLight, 0.35)} bottom={C.creamDeep} rimOpacity={0.7} shadow={0.45} shadowDy={8} shadowBlur={8} />
      {[-0.42, 0, 0.42].map((u, i) => {
        const cx = x + u * r * 0.62;
        const cy = y + 4 - u * r * 0.13;
        return <path key={i} d={`M${cx - 10},${cy - 26} Q${cx + 4},${cy} ${cx - 4},${cy + 24}`} fill="none" stroke={C.creamDeep} strokeWidth={6} strokeLinecap="round" opacity={0.85} />;
      })}
      <LitShape d={fork} top={mix(C.ink300, C.paper, 0.35)} bottom={C.ink500} rimOpacity={0.6} shadow={0.45} shadowDy={8} shadowBlur={8} />
      <LitShape d={blade} top={mix(C.ink300, C.paper, 0.45)} bottom={C.ink400} rimOpacity={0.7} shadow={0.45} shadowDy={8} shadowBlur={8} />
      <LitShape d={handle} top={C.ink500} bottom={C.ink600} rimOpacity={0.5} shadow={0.4} shadowDy={8} shadowBlur={8} />
    </g>
  );
};

// ------------------------------------------------------------------ plant leaves

/** The geometry of leaf i of a `Plant` with these props (same formula as the component), fully grown. */
export const plantLeaf = (x: number, y: number, height: number, leaves: number, leafScale: number, i: number) => {
  const H = height;
  const stem: Pt[] = [[x, y], [x + 8, y - H * 0.35], [x - 6, y - H * 0.7], [x + 4, y - H]];
  const t = 0.22 + (i / Math.max(1, leaves - 1)) * 0.74;
  const k = Math.min(stem.length - 2, Math.floor(t * (stem.length - 1)));
  const u = t * (stem.length - 1) - k;
  const nx = stem[k][0] + (stem[k + 1][0] - stem[k][0]) * u;
  const ny = stem[k][1] + (stem[k + 1][1] - stem[k][1]) * u;
  const side = i % 2 ? 1 : -1;
  const size = (1 - i * 0.06) * height * 0.32 * leafScale;
  return leafGeometry({ cx: nx + side * size * 0.62, cy: ny - size * 0.2, len: size, wid: size * 0.52, ang: side > 0 ? -22 : 202, stalk: 0.18, veinPairs: 4 });
};

/** The stem centre line of a `Plant` (same points as the component), fully grown. */
export const plantStem = (x: number, y: number, height: number): Pt[] => [[x, y], [x + 8, y - height * 0.35], [x - 6, y - height * 0.7], [x + 4, y - height]];

// ------------------------------------------------------------------ chips

export const CHIP = { size: 48, pad: 30, h: 84 } as const;
export const chipWidth = (text: string, size: number = CHIP.size) => textWidth(text, size, 600) + CHIP.pad * 2;

/**
 * A keyword chip: lit ink card, thin outline in the term's colour, the term in Lexend.
 * `flip` 0..1 turns the card over (around its horizontal axis) to show `back` (two lines).
 */
export const Chip: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly text: string;
  readonly color: string;
  readonly textColor?: string;
  readonly progress: number;
  readonly opacity?: number;
  /** soft glow behind the card (0..1), e.g. energy arriving */
  readonly glow?: number;
  readonly glowColor?: string;
  readonly flip?: number;
  readonly back?: readonly [string, string];
  readonly backColor?: string;
}> = ({ cx, cy, text, color, textColor = color, progress, opacity = 1, glow = 0, glowColor = color, flip = 0, back, backColor = C.paper }) => {
  const id = useSvgId("chip");
  if (progress <= 0 || opacity <= 0) return null;
  const p = EASE.out(Math.min(1, progress));
  const size = CHIP.size;
  const w = chipWidth(text, size);
  const showBack = back && flip >= 0.5;
  const h = showBack ? 150 : CHIP.h;
  const sy = back ? Math.max(0.02, Math.abs(Math.cos(Math.min(1, flip) * Math.PI))) : 1;
  const s = 0.9 + 0.1 * p;
  const l = cx - w / 2;
  const t = cy - h / 2;
  return (
    <g opacity={Math.min(1, progress * 1.6) * opacity} transform={`translate(${cx} ${cy}) scale(${s} ${s * sy}) translate(${-cx} ${-cy})`}>
      {glow > 0.01 ? (
        <g>
          <defs>
            <filter id={`${id}-g`} x="-50%" y="-80%" width="200%" height="260%">
              <feGaussianBlur stdDeviation={22} />
            </filter>
          </defs>
          <rect x={l - 10} y={t - 10} width={w + 20} height={h + 20} rx={34} fill={glowColor} opacity={0.55 * glow} filter={`url(#${id}-g)`} />
        </g>
      ) : null}
      <LitShape d={roundRectPath(l, t, w, h, 26)} top={C.ink700} bottom={C.ink800} rimOpacity={0.5} shadow={0.55} shadowDy={12} shadowBlur={14} />
      <rect x={l + 1.5} y={t + 1.5} width={w - 3} height={h - 3} rx={24.5} fill="none" stroke={color} strokeOpacity={0.8} strokeWidth={3} />
      {glow > 0.01 ? <rect x={l + 1.5} y={t + 1.5} width={w - 3} height={h - 3} rx={24.5} fill={glowColor} opacity={0.12 * glow} /> : null}
      {showBack && back ? (
        <g>
          <text x={cx} y={cy - 14} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size} fill={textColor} letterSpacing={-0.5}>
            {back[0]}
          </text>
          <text x={cx} y={cy + 50} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size + 4} fill={backColor} letterSpacing={-0.5}>
            {back[1]}
          </text>
        </g>
      ) : (
        <text x={cx} y={cy + size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size} fill={textColor} letterSpacing={-0.5}>
          {text}
        </text>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ connectors

/** Cubic from a to b that leaves and arrives horizontally (a flow-chart elbow). */
export const elbow = (a: Pt, b: Pt) => {
  const mx = (a[0] + b[0]) / 2;
  const c1: Pt = [mx, a[1]];
  const c2: Pt = [mx, b[1]];
  const at = (u: number): Pt => {
    const v = 1 - u;
    return [
      v * v * v * a[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * b[0],
      v * v * v * a[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * b[1],
    ];
  };
  return { d: `M${a[0]},${a[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${b[0]},${b[1]}`, at };
};

/** A connector that draws on (p 0..1) and ends in a small arrowhead pointing right. */
export const Connector: React.FC<{ readonly a: Pt; readonly b: Pt; readonly p: number; readonly color: string; readonly opacity?: number; readonly width?: number }> = ({
  a,
  b,
  p,
  color,
  opacity = 1,
  width = 5,
}) => {
  if (p <= 0 || opacity <= 0) return null;
  const { d } = elbow(a, b);
  const q = EASE.inOut(Math.min(1, p));
  const head = Math.max(0, q - 0.82) / 0.18;
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - q} />
      {head > 0 ? (
        <path
          d={`M${b[0] - 20},${b[1] - 14} L${b[0]},${b[1]} L${b[0] - 20},${b[1] + 14}`}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={head}
        />
      ) : null}
    </g>
  );
};
