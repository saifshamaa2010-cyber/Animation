/**
 * S08 helpers: a chain of amino acids that can fold into a protein, a nitrogen atom ball in the style
 * of S05's AtomBall, a chloroplast whose greenness can change (magnesium → chlorophyll), and the
 * small icons of the exam chain.
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { LitShape, mix, textWidth } from "../../../../components/kit";
import { circlePath, roundRectPath } from "../../../../components/kit/shared";
import { useSvgId } from "../../../../components/ids";
import { Pt, lerpPt, smoothOpenPath } from "../../../../lib/geometry";

// ------------------------------------------------------------------ amino acids → protein

/** Same bead colours as the shared `AminoChain`, so amino acids look the same in every scene. */
const AA_COLOURS = [C.coral, C.violet, C.teal, C.amber, C.ice, C.paper];

/** A folded protein: 6 beads, each bonded to the next (~78 units apart), none overlapping. Units of r = 34. */
const FOLDED: readonly Pt[] = [
  [-110, 20],
  [-60, -40],
  [15, -60],
  [80, -15],
  [40, 50],
  [-35, 55],
];

export const chainBeads = (x: number, y: number, r: number, fold: number, n = 6): Pt[] => {
  const s = r / 34;
  const step = r * 2.45;
  return Array.from({ length: n }, (_, i) => {
    const straight: Pt = [x + (i - (n - 1) / 2) * step, y + Math.sin(i * 1.1 + 0.6) * r * 0.5];
    const f = FOLDED[i % FOLDED.length];
    const folded: Pt = [x + f[0] * s, y + f[1] * s];
    // beads unfold one after another (a little stagger), never all at once
    const q = Math.max(0, Math.min(1, fold * 1.4 - (i / n) * 0.4));
    return lerpPt(straight, folded, EASE.inOut(q));
  });
};

/**
 * Amino acids (beads) joined into a chain. `fold` 1 = folded protein, 0 = laid out straight.
 * `shown` 0..n beads (fractional = the next bead popping in). `glow` lights the beads (ice = nitrogen).
 */
export const FoldChain: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly r?: number;
  readonly fold: number;
  readonly shown?: number;
  readonly n?: number;
  readonly hull?: number;
  readonly glow?: number;
  readonly opacity?: number;
}> = ({ x, y, r = 34, fold, shown = 6, n = 6, hull = 0, glow = 0, opacity = 1 }) => {
  const id = useSvgId("fold");
  if (opacity <= 0 || shown <= 0) return null;
  const pts = chainBeads(x, y, r, fold, n);
  const whole = Math.floor(shown);
  const vis = pts.slice(0, Math.min(n, Math.ceil(shown)));
  const cx = pts.reduce((a, p) => a + p[0], 0) / n;
  const cy = pts.reduce((a, p) => a + p[1], 0) / n;
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${id}-b`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={r * 0.5} />
        </filter>
      </defs>
      {/* the protein's soft outline: only while it is folded */}
      {hull > 0.01 ? <ellipse cx={cx} cy={cy} rx={r * 4.4} ry={r * 3.7} fill={mix(C.ink600, C.paper, 0.08)} opacity={0.55 * hull} stroke={C.paper} strokeOpacity={0.22 * hull} strokeWidth={3} /> : null}
      {vis.length > 1 ? <path d={smoothOpenPath(vis)} fill="none" stroke={C.ink300} strokeWidth={Math.max(4, r * 0.18)} strokeLinecap="round" /> : null}
      {vis.map(([px, py], i) => {
        const pop = i < whole ? 1 : shown - whole;
        const s = 0.5 + 0.5 * EASE.out(pop);
        const col = AA_COLOURS[i % AA_COLOURS.length];
        return (
          <g key={i} opacity={Math.min(1, pop * 1.6)} transform={`translate(${px} ${py}) scale(${s}) translate(${-px} ${-py})`}>
            {glow > 0.01 ? <circle cx={px} cy={py} r={r * 1.45} fill={C.ice} opacity={0.4 * glow} filter={`url(#${id}-b)`} /> : null}
            <LitShape d={circlePath(px, py, r)} top={mix(col, C.paper, 0.3)} bottom={col} rimOpacity={0.6} shadow={0.3} shadowDy={r * 0.18} shadowBlur={r * 0.22} />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ nitrogen atom (school colour: blue)

/** An N atom ball, drawn exactly like S05's `AtomBall` (C, H, O) — blue (ice) for nitrogen. */
export const NBall: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly p: number; readonly glow?: number }> = ({ x, y, r = 36, p, glow = 0 }) => {
  const id = useSvgId("nball");
  if (p <= 0) return null;
  const s = 0.8 + 0.2 * EASE.out(Math.min(1, p));
  const top = mix(C.ice, C.paper, 0.25);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, p * 1.5)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={C.iceDeep} />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.85} />
          <stop offset="0.4" stopColor={C.paper} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-s`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {glow > 0.01 ? <circle r={r * 1.6} fill={C.ice} opacity={0.4 * glow} filter={`url(#${id}-s)`} /> : null}
      <circle cy={8} r={r} fill={C.ink950} opacity={0.45} filter={`url(#${id}-s)`} />
      <circle r={r} fill={`url(#${id}-g)`} />
      <circle r={r - 2} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={4} />
      <text y={r * 0.42} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill={C.ink900}>
        N
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ chloroplast with a variable amount of chlorophyll

/**
 * The approved preview's chloroplast (as S04's ChloroplastIcon), but `green` sets how much chlorophyll
 * it has: 0 = pale yellow (no magnesium), 1 = full green.
 */
export const GreeningChloroplast: React.FC<{ readonly x: number; readonly y: number; readonly scale?: number; readonly green: number; readonly glow?: number; readonly progress?: number; readonly opacity?: number }> = ({
  x,
  y,
  scale = 1,
  green,
  glow = 0,
  progress = 1,
  opacity = 1,
}) => {
  const id = useSvgId("gchl");
  if (progress <= 0 || opacity <= 0) return null;
  const s = scale * (0.7 + 0.3 * EASE.out(Math.min(1, progress)));
  const g = Math.max(0, Math.min(1, green));
  const top = mix(mix(C.leafYellow, C.paper, 0.35), mix(C.chloro, C.leafLight, 0.3), g);
  const bottom = mix(mix(C.leafYellow, C.creamDeep, 0.45), C.leafDeep, g);
  const stack = mix(mix(C.creamDeep, C.ink500, 0.3), C.leafDark, g);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, progress * 1.4) * opacity}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <filter id={`${id}-b`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
        <filter id={`${id}-s`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {glow > 0.01 ? <ellipse rx={62} ry={40} fill={C.leafLight} opacity={0.45 * glow} filter={`url(#${id}-b)`} /> : null}
      <ellipse cy={8} rx={50} ry={29} fill={C.ink950} opacity={0.45} filter={`url(#${id}-s)`} />
      <g transform="scale(2.2)">
        <ellipse rx={23} ry={13} fill={`url(#${id}-g)`} />
        {[-10, 0, 10].map((dx) => (
          <line key={dx} x1={dx} y1={-6} x2={dx} y2={6} stroke={stack} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
        ))}
        <ellipse rx={21.5} ry={11.5} fill="none" stroke={C.paper} strokeOpacity={0.5} strokeWidth={1.8} strokeDasharray="0 16 34 200" />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ small drawn marks

/** A straight arrow (shaft + open head) that draws on with p. */
export const StraightArrow: React.FC<{ readonly from: Pt; readonly to: Pt; readonly p: number; readonly color?: string; readonly width?: number; readonly head?: number; readonly opacity?: number }> = ({
  from,
  to,
  p,
  color = C.ink300,
  width = 5,
  head = 16,
  opacity = 1,
}) => {
  if (p <= 0 || opacity <= 0) return null;
  const q = EASE.out(Math.min(1, p));
  const ex = from[0] + (to[0] - from[0]) * q;
  const ey = from[1] + (to[1] - from[1]) * q;
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const hp = Math.max(0, (q - 0.7) / 0.3);
  const h1: Pt = [ex - Math.cos(a - 0.6) * head, ey - Math.sin(a - 0.6) * head];
  const h2: Pt = [ex - Math.cos(a + 0.6) * head, ey - Math.sin(a + 0.6) * head];
  return (
    <g opacity={opacity}>
      <line x1={from[0]} y1={from[1]} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeLinecap="round" />
      {hp > 0 ? <path d={`M${h1[0]},${h1[1]} L${ex},${ey} L${h2[0]},${h2[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={hp} /> : null}
    </g>
  );
};

/** A small ion travelling inside the plant (soil → root → xylem → leaf), drawn as a glowing dot. */
export const IonDot: React.FC<{ readonly at: Pt; readonly color: string; readonly opacity?: number; readonly blurId: string }> = ({ at, color, opacity = 1, blurId }) =>
  opacity > 0 ? (
    <g opacity={opacity}>
      <circle cx={at[0]} cy={at[1]} r={16} fill={color} opacity={0.45} filter={`url(#${blurId})`} />
      <circle cx={at[0]} cy={at[1]} r={8.5} fill={mix(color, C.paper, 0.35)} />
    </g>
  ) : null;

/** A numbered header chip for the exam chain: [n | text]. Centred at (cx, cy). */
export const StepChip: React.FC<{ readonly cx: number; readonly cy: number; readonly n: number; readonly text: string; readonly width: number; readonly color: string; readonly p: number; readonly glow?: number }> = ({
  cx,
  cy,
  n,
  text,
  width,
  color,
  p,
  glow = 0,
}) => {
  if (p <= 0) return null;
  const h = 78;
  const l = cx - width / 2;
  const t = cy - h / 2;
  const e = EASE.out(Math.min(1, p));
  return (
    <g opacity={Math.min(1, p * 1.6)} transform={`translate(0 ${(1 - e) * 18})`}>
      {glow > 0.01 ? <rect x={l - 8} y={t - 8} width={width + 16} height={h + 16} rx={(h + 16) / 2} fill={color} opacity={0.18 * glow} /> : null}
      <LitShape d={roundRectPath(l, t, width, h, h / 2)} top={C.ink700} bottom={C.ink800} rimOpacity={0.5} shadow={0.5} shadowDy={10} shadowBlur={12} />
      <rect x={l + 1.5} y={t + 1.5} width={width - 3} height={h - 3} rx={(h - 3) / 2} fill="none" stroke={color} strokeOpacity={0.85} strokeWidth={3} />
      <circle cx={l + h / 2} cy={cy} r={h / 2 - 9} fill={mix(color, C.ink800, 0.15)} />
      <text x={l + h / 2} y={cy + 15} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42} fill={C.ink900}>
        {n}
      </text>
      <text x={l + h + (width - h - 18) / 2} y={cy + 15} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={mix(color, C.paper, 0.35)} letterSpacing={-0.5}>
        {text}
      </text>
    </g>
  );
};

/** The empty place of a StepChip (dashed outline + its number), shown before the chip is filled. */
export const ChipSlot: React.FC<{ readonly cx: number; readonly cy: number; readonly n: number; readonly width: number; readonly color: string; readonly p: number }> = ({ cx, cy, n, width, color, p }) => {
  if (p <= 0) return null;
  const h = 78;
  const l = cx - width / 2;
  const t = cy - h / 2;
  const e = EASE.out(Math.min(1, p));
  return (
    <g opacity={Math.min(1, p * 1.6)} transform={`translate(${cx} ${cy}) scale(${0.92 + 0.08 * e}) translate(${-cx} ${-cy})`}>
      <rect x={l + 1.5} y={t + 1.5} width={width - 3} height={h - 3} rx={(h - 3) / 2} fill={color} fillOpacity={0.04} stroke={color} strokeOpacity={0.5} strokeWidth={3} strokeDasharray="12 12" />
      <circle cx={l + h / 2} cy={cy} r={h / 2 - 9} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={3} />
      <text x={l + h / 2} y={cy + 15} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42} fill={mix(color, C.paper, 0.3)}>
        {n}
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ ions with legible charges

/**
 * A mineral ion drawn like the shared `Ion`, but with the subscript and charge at 40 px (the channel
 * minimum) instead of 64 % of the formula size: formula letters 52 px, scripts 40 px. For nitrate the
 * charge sits above the subscript (NO₃⁻), as it is printed in textbooks.
 */
export type IonKind = "nitrate" | "magnesium";
const ION_MAIN = 52;
const ION_SCRIPT = 40;
const ION_TEXT: Record<IonKind, { main: string; sub: string; sup: string }> = {
  nitrate: { main: "NO", sub: "3", sup: "−" },
  magnesium: { main: "Mg", sub: "", sup: "2+" },
};
const ionTextWidth = (kind: IonKind) => {
  const t = ION_TEXT[kind];
  const main = textWidth(t.main, ION_MAIN, 700);
  const scripts = Math.max(t.sub ? textWidth(t.sub, ION_SCRIPT, 700) : 0, textWidth(t.sup, ION_SCRIPT, 700));
  return main + 2 + scripts;
};
/** Radius of an IonBall (the circle grows to fit its text). */
export const ionRadius = (kind: IonKind) => Math.max(58, ionTextWidth(kind) * 0.58);

export const IonBall: React.FC<{ readonly x: number; readonly y: number; readonly kind: IonKind; readonly color: string; readonly progress?: number; readonly opacity?: number }> = ({
  x,
  y,
  kind,
  color,
  progress = 1,
  opacity = 1,
}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const s = 0.6 + 0.4 * EASE.out(Math.min(1, progress));
  const r = ionRadius(kind);
  const t = ION_TEXT[kind];
  const w = ionTextWidth(kind);
  const x0 = -w / 2;
  const mainW = textWidth(t.main, ION_MAIN, 700);
  const base = ION_MAIN * 0.36;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, progress * 1.6) * opacity}>
      <LitShape d={circlePath(0, 0, r)} top={mix(color, C.paper, 0.3)} bottom={mix(color, C.ink800, 0.35)} rimOpacity={0.6} shadow={0.4} shadowDy={6} shadowBlur={7} />
      <text x={x0} y={base} fontFamily={FONT} fontWeight={700} fontSize={ION_MAIN} fill={C.ink900}>
        {t.main}
      </text>
      {t.sub ? (
        <text x={x0 + mainW + 3} y={base + ION_MAIN * 0.24} fontFamily={FONT} fontWeight={700} fontSize={ION_SCRIPT} fill={C.ink900}>
          {t.sub}
        </text>
      ) : null}
      <text x={x0 + mainW + 3} y={base - ION_MAIN * (t.sub ? 0.56 : 0.36)} fontFamily={FONT} fontWeight={700} fontSize={ION_SCRIPT} fill={C.ink900}>
        {t.sup}
      </text>
    </g>
  );
};
