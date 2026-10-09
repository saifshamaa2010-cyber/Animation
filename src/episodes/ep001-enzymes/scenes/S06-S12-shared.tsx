/**
 * Scene-local building blocks shared by S06, S07, S11 and S12 (they only exist here so that the
 * shared component library stays untouched while other scenes are built in parallel).
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Pt } from "../../../lib/geometry";
import { useSvgId } from "../../../components/ids";
import { HandLayer, InkPath, LitShape, StrikeThrough, inkGeometry, penEase, prepareStroke, seg, textBox, textWidth } from "../../../components/kit";
import { roundRectPath } from "../../../components/kit/shared";
import { foldedChain } from "../../../components/molecule-geometry";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ---------------------------------------------------------------------------------------------
/** A "written on" reveal: soft-edged wipe left → right across a piece of text. */
export const WipeText: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly size: number;
  readonly progress: number;
  readonly color?: string;
  readonly weight?: 400 | 500 | 600 | 700;
  readonly anchor?: "start" | "middle" | "end";
  readonly opacity?: number;
}> = ({ x, y, text, size, progress, color = C.paper, weight = 600, anchor = "start", opacity = 1 }) => {
  const id = useSvgId("wipe");
  if (progress <= 0 || opacity <= 0) return null;
  const b = textBox(text, x, y, size, weight, anchor);
  const soft = size * 0.6;
  const edge = b.x0 - soft + (b.w + soft * 2) * clamp01(progress);
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={edge - soft} y1="0" x2={edge} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={b.x0 - size} y={y - size * 1.4} width={b.w + size * 2} height={size * 2}>
          <rect x={b.x0 - size} y={y - size * 1.4} width={b.w + size * 2} height={size * 2} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={weight} fontSize={size} fill={color} mask={`url(#${id}-m)`} letterSpacing={-0.5}>
        {text}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
export type MythCardProps = {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  readonly number: number;
  /** Text before the wrong word (include the trailing space). */
  readonly before: string;
  readonly word: string;
  /** Text after the wrong word (include the leading space). */
  readonly after?: string;
  readonly replacement?: string;
  readonly enter: number;
  /** 0..1 hand strike-through (linear). */
  readonly strike: number;
  /** 0..1 replacement written in above the struck word. */
  readonly replace?: number;
  readonly scale?: number;
  readonly opacity?: number;
  readonly seed?: number;
};

/**
 * Myth card: the wrong word is scratched out by hand and the correct word is written in above it,
 * so the correction itself is what's on screen. Text is measured exactly (Lexend metrics).
 */
export const MythCard2: React.FC<MythCardProps> = ({
  x,
  y,
  number,
  before,
  word,
  after = "",
  replacement,
  enter,
  strike,
  replace = 0,
  scale = 1,
  opacity = 1,
  seed = 4,
}) => {
  if (enter <= 0 || opacity <= 0) return null;
  const fs = 84;
  const wB = textWidth(before, fs, 600);
  const wW = textWidth(word, fs, 600);
  const wA = textWidth(after, fs, 600);
  const total = wB + wW + wA;
  const w = Math.max(1080, total + 260);
  const h = 390;
  const x0 = -total / 2;
  const base = 124;
  const wordX0 = x0 + wB;
  const box = textBox(word, wordX0, base, fs, 600, "start");
  const tagFs = 40;
  const tagText = `MYTH #${number}`;
  const tagW = textWidth(tagText, tagFs, 700, 3) + 60;
  const e = EASE.out(clamp01(enter));
  const struck = strike > 0.6;
  const repFs = 72;
  return (
    <g opacity={opacity * clamp01(enter * 1.4)} transform={`translate(${x} ${y + (1 - e) * 36}) scale(${scale * (0.97 + 0.03 * e)})`}>
      <LitShape
        d={roundRectPath(-w / 2, -h / 2, w, h, 44)}
        top={C.ink700}
        bottom={C.ink800}
        rim={C.paper}
        rimOpacity={0.22}
        rimWidth={5}
        slant={0.2}
        shadow={0.55}
        shadowDy={18}
        shadowBlur={26}
      />
      {/* tag */}
      <g transform={`translate(${-w / 2 + 60} ${-h / 2 + 42})`}>
        <rect x={0} y={0} width={tagW} height={60} rx={30} fill={C.coral} />
        <rect x={18} y={4} width={tagW - 36} height={18} rx={9} fill={C.paper} opacity={0.16} />
        <text x={tagW / 2} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={tagFs} fill={C.ink900} letterSpacing={3}>
          {tagText}
        </text>
      </g>
      <text x={x0} y={base} fontFamily={FONT} fontWeight={600} fontSize={fs} fill={C.paper} xmlSpace="preserve" letterSpacing={0}>
        <tspan>{before}</tspan>
        <tspan fill={struck ? C.ink400 : C.paper}>{word}</tspan>
        <tspan>{after}</tspan>
      </text>
      <StrikeThrough x1={box.x0} x2={box.x1} y={box.strikeY} progress={strike} passes={2} width={9} seed={seed} />
      {replacement ? (
        <>
          <WipeText x={box.cx} y={base - fs - 14} text={replacement} size={repFs} progress={replace} color={C.teal} weight={700} anchor="middle" />
        </>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
/** Pill-shaped tag (e.g. "GCSE · IGCSE"). Width follows the text exactly. */
export const Chip: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly progress: number;
  readonly size?: number;
  readonly color?: string;
  readonly fill?: string;
  readonly textColor?: string;
  readonly anchor?: "start" | "middle";
  readonly opacity?: number;
}> = ({ x, y, text, progress, size = 44, color = C.paper, fill = C.ink800, textColor, anchor = "middle", opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const tw = textWidth(text, size, 600, 1);
  const w = tw + size * 1.2;
  const h = size * 1.5;
  const left = anchor === "middle" ? x - w / 2 : x;
  return (
    <g opacity={opacity * p} transform={`translate(0 ${(1 - p) * 14})`}>
      <rect x={left} y={y - h / 2 + 6} width={w} height={h} rx={h / 2} fill={C.ink950} opacity={0.35} />
      <rect x={left} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeOpacity={0.6} strokeWidth={2.5} />
      <text x={left + w / 2} y={y + size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size} fill={textColor ?? color} letterSpacing={1}>
        {text}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
/**
 * A paper luggage tag hanging on a short string from `anchor`. `angle` swings it (degrees);
 * drive it with a damped settle when it is hung on, so it moves like something that really hangs.
 */
export const HangingTag: React.FC<{
  readonly anchor: Pt;
  readonly text: string;
  readonly angle: number;
  readonly progress: number;
  readonly size?: number;
  readonly opacity?: number;
  readonly glow?: number;
}> = ({ anchor, text, angle, progress, size = 42, opacity = 1, glow = 0 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const tw = textWidth(text, size, 600);
  const bw = tw + size * 1.5;
  const bh = size * 1.55;
  const L = 46; // string length
  // Tag shape: rectangle with the left end tapered to a blunt point (where the hole is).
  const tip = size * 0.5;
  const r = 10;
  const d = `M${tip},${-bh / 2} H${bw - r} Q${bw},${-bh / 2} ${bw},${-bh / 2 + r} V${bh / 2 - r} Q${bw},${bh / 2} ${bw - r},${bh / 2} H${tip} L0,${bh / 2 - tip * 0.75} V${-bh / 2 + tip * 0.75} Z`;
  const holeX = size * 0.42;
  return (
    <g opacity={opacity * clamp01(progress * 1.5)} transform={`translate(${anchor[0]} ${anchor[1]}) rotate(${angle})`}>
      {/* string: from the anchor, down and out to the hole */}
      <path d={`M0,0 C8,${L * 0.5} ${L * 0.4},${L * 0.9} ${L * 0.62 + holeX},${L}`} fill="none" stroke={C.paperDim} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      <g transform={`translate(${L * 0.62} ${L}) rotate(${-14 + (1 - p) * 10})`}>
        {glow > 0 ? <path d={d} fill={C.paper} opacity={0.25 * glow} transform="translate(0 0) scale(1.04)" /> : null}
        <LitShape d={d} top={C.paper} bottom={C.paperDim} rim={C.paper} rimWidth={3} rimOpacity={0.9} slant={0.3} shadow={0.5} shadowDy={8} shadowBlur={9} />
        <circle cx={holeX} cy={0} r={7} fill={C.ink900} />
        <circle cx={holeX} cy={0} r={7} fill="none" stroke={C.creamDeep} strokeWidth={2} />
        <text x={holeX + 18 + tw / 2 + size * 0.1} y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size} fill={C.ink900}>
          {text}
        </text>
      </g>
    </g>
  );
};

/** Damped pendulum settle (degrees) — for things that hang. */
export const settleSwing = (f: number, start: number, amp = 12, rest = 0, period = 26, decay = 18) => {
  if (f < start) return rest + amp;
  const t = f - start;
  return rest + amp * Math.exp(-t / decay) * Math.cos((t / period) * Math.PI * 2);
};

// ---------------------------------------------------------------------------------------------
/** Camera-viewfinder corners that close in around a region. */
export const Viewfinder: React.FC<{
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly progress: number;
  readonly color?: string;
  readonly arm?: number;
  readonly opacity?: number;
}> = ({ x0, y0, x1, y1, progress, color = C.paper, arm = 74, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const o = (1 - p) * 60;
  const corners: [number, number, number, number][] = [
    [x0 - o, y0 - o, 1, 1],
    [x1 + o, y0 - o, -1, 1],
    [x1 + o, y1 + o, -1, -1],
    [x0 - o, y1 + o, 1, -1],
  ];
  return (
    <g opacity={opacity * clamp01(progress * 2)} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      {corners.map(([cx, cy, sx, sy], i) => (
        <path key={i} d={`M${cx},${cy + sy * arm} V${cy + sy * 8} Q${cx},${cy} ${cx + sx * 8},${cy} H${cx + sx * arm}`} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
/** Hand-drawn "≈" (approximately equal): two short wavy strokes. */
export const HandApprox: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly size?: number;
  readonly progress: number;
  readonly color?: string;
  readonly seed?: number;
  readonly opacity?: number;
}> = ({ cx, cy, size = 90, progress, color = C.paper, seed = 2, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const mk = (dy: number, salt: number) => {
    const st = { width: Math.max(7, size * 0.075), seed: seed * 7919 + salt, wobble: 0.5, minStart: 0.6, minEnd: 0.35, taperEnd: size * 0.15 };
    // A tilde: up, then down, ending level — drawn left to right.
    const pts: Pt[] = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      return [cx - size / 2 + size * t, cy + dy - Math.sin(t * Math.PI * 2) * size * 0.085];
    });
    return { ...prepareStroke(pts, st), st };
  };
  const a = mk(-size * 0.15, 1);
  const b = mk(size * 0.17, 2);
  return (
    <HandLayer opacity={opacity} seed={seed}>
      <InkPath geo={inkGeometry(a.poly, a.L, a.st, penEase(seg(progress, 0, 0.45)))} color={color} />
      <InkPath geo={inkGeometry(b.poly, b.L, b.st, penEase(seg(progress, 0.55, 1)))} color={color} />
    </HandLayer>
  );
};

// ---------------------------------------------------------------------------------------------
/** Marker pin (same drop shape as the PHScale pointer), tip at (x, y). */
export const Pin: React.FC<{ readonly x: number; readonly y: number; readonly color: string; readonly progress: number; readonly scale?: number }> = ({
  x,
  y,
  color,
  progress,
  scale = 1,
}) => {
  if (progress <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const d = "M0,0 C-6,-8 -16,-16 -16,-28 A16,16 0 1 1 16,-28 C16,-16 6,-8 0,0 Z";
  return (
    <g opacity={clamp01(progress * 2)} transform={`translate(${x} ${y - (1 - p) * 16}) scale(${scale})`}>
      <path d={d} fill={C.ink950} opacity={0.4} transform="translate(0 5)" />
      <path d={d} fill={color} />
      <circle cx={0} cy={-28} r={6} fill={C.ink900} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------
/**
 * The weak bonds holding an enzyme's fold together, drawn big enough to read: pairs of points that
 * are close in space but far apart along the folded chain. Sorted so the bonds nearest the active
 * site come first (they are the first to break).
 */
const bondCache = new Map<number, { a: number; b: number }[]>();
export const foldBonds = (seed: number, max = 26) => {
  const hit = bondCache.get(seed);
  if (hit) return hit;
  const ch = foldedChain(seed * 97 + 11);
  const pairs: { a: number; b: number; d: number }[] = [];
  const used = new Set<number>();
  for (let i = 0; i < ch.length; i += 3) {
    let best = -1;
    let bestD = 1e9;
    for (let j = i + 18; j < ch.length; j++) {
      const d = Math.hypot(ch[i][0] - ch[j][0], ch[i][1] - ch[j][1]);
      if (d > 14 && d < 30 && d < bestD) {
        best = j;
        bestD = d;
      }
    }
    if (best >= 0 && !used.has(i) && !used.has(best)) {
      // keep bonds spread out: skip ones too close to an existing bond
      const mid: Pt = [(ch[i][0] + ch[best][0]) / 2, (ch[i][1] + ch[best][1]) / 2];
      const crowded = pairs.some((p) => Math.hypot((ch[p.a][0] + ch[p.b][0]) / 2 - mid[0], (ch[p.a][1] + ch[p.b][1]) / 2 - mid[1]) < 46);
      if (!crowded) {
        pairs.push({ a: i, b: best, d: Math.hypot(mid[0] + 75, mid[1]) });
        used.add(i);
        used.add(best);
      }
    }
  }
  const out = pairs.sort((p, q) => p.d - q.d).slice(0, max).map(({ a, b }) => ({ a, b }));
  bondCache.set(seed, out);
  return out;
};

/** Chain point i of a (still) enzyme, deformed exactly as <Enzyme denature> deforms it. */
const chainPoint = (ch: readonly Pt[], i: number, seed: number, denature: number): Pt => {
  const p = ch[i];
  const n = noise2D(`loop${seed}`, i * 0.045, 0);
  const push = denature * Math.max(0, n) * 0.55;
  return [p[0] + (p[0] - 20) * push, p[1] + p[1] * push];
};

/**
 * Weak-bond overlay for a still <Enzyme> at (x, y, scale) with the same seed and denature value.
 * `broken` 0..1 = fraction snapped (nearest the active site first); each one flashes coral as it goes.
 */
export const FoldBonds: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly seed: number;
  readonly denature: number;
  readonly visible: number;
  readonly broken: number;
}> = ({ x, y, scale, seed, denature, visible, broken }) => {
  if (visible <= 0) return null;
  const ch = foldedChain(seed * 97 + 11);
  const bonds = foldBonds(seed);
  const nb = bonds.length;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={visible}>
      {bonds.map(({ a, b }, i) => {
        // this bond's own break progress (staggered)
        const t = Math.max(0, Math.min(1, broken * nb - i));
        if (t >= 1) return null;
        const pa = chainPoint(ch, a, seed, denature);
        const pb = chainPoint(ch, b, seed, denature);
        const snap = t > 0 ? t : 0;
        const col = snap > 0 ? C.coral : C.amberLight;
        const mx = (pa[0] + pb[0]) / 2;
        const my = (pa[1] + pb[1]) / 2;
        const k = 1 + snap * 0.6; // ends spring apart as it snaps
        return (
          <g key={i} opacity={1 - snap}>
            <circle cx={mx} cy={my} r={15} fill={col} opacity={0.2} />
            <line
              x1={mx + (pa[0] - mx) * k}
              y1={my + (pa[1] - my) * k}
              x2={mx + (pb[0] - mx) * k}
              y2={my + (pb[1] - my) * k}
              stroke={col}
              strokeWidth={6.5}
              strokeLinecap="round"
              strokeDasharray="0.1 8.5"
            />
          </g>
        );
      })}
    </g>
  );
};
