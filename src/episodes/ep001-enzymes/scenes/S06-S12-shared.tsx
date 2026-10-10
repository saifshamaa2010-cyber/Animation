/**
 * Scene-local building blocks shared by S06, S07, S11 and S12 (they only exist here so that the
 * shared component library stays untouched while other scenes are built in parallel).
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Pt, distToPolygon, pointInPolygon, rng, roundedPolygon, smoothClosedPath, smoothOpenPath } from "../../../lib/geometry";
import { useSvgId } from "../../../components/ids";
import { ENZYME_PALETTES } from "../../../components/Enzyme";
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
  /** 0..1 the sentence is written on left → right (drive it from the spoken words). Default 1. */
  readonly reveal?: number;
  /**
   * 0..1 the card opens out of its tag: at 0 only the "MYTH #n" tag shows (large, centred — said on
   * "myth number n"); it then unfolds into the full card just before the sentence is spoken, so the
   * card is never an empty template waiting for its text. Default 1.
   */
  readonly open?: number;
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
  reveal = 1,
  open = 1,
}) => {
  const id = useSvgId("myth");
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
  // the tag: big and centred while it is said, then it moves to its corner as the card opens out of it
  const o = EASE.inOut(clamp01(open));
  const T0 = 1.5;
  const tagS = T0 + (1 - T0) * o;
  const tagX = -(tagW * T0) / 2 + (-w / 2 + 60 + (tagW * T0) / 2) * o;
  const tagY = -30 * T0 + (-h / 2 + 42 + 30 * T0) * o;
  const pad = 22;
  const rx0 = tagX - pad;
  const ry0 = tagY - pad;
  const rw0 = tagW * tagS + pad * 2;
  const rh0 = 60 * tagS + pad * 2;
  const cardX = rx0 + (-w / 2 - rx0) * o;
  const cardY = ry0 + (-h / 2 - ry0) * o;
  const cardW = rw0 + (w - rw0) * o;
  const cardH = rh0 + (h - rh0) * o;
  return (
    <g opacity={opacity * clamp01(enter * 1.4)} transform={`translate(${x} ${y + (1 - e) * 36}) scale(${scale * (0.97 + 0.03 * e)})`}>
      {open > 0 ? (
        <g opacity={clamp01(open * 3)}>
          <LitShape
            d={roundRectPath(cardX, cardY, cardW, cardH, Math.min(44, cardH / 2))}
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
        </g>
      ) : null}
      {/* tag */}
      <g transform={`translate(${tagX} ${tagY}) scale(${tagS})`}>
        <rect x={0} y={0} width={tagW} height={60} rx={30} fill={C.coral} />
        <rect x={18} y={4} width={tagW - 36} height={18} rx={9} fill={C.paper} opacity={0.16} />
        <text x={tagW / 2} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={tagFs} fill={C.ink900} letterSpacing={3}>
          {tagText}
        </text>
      </g>
      {reveal < 1 ? (
        <defs>
          <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={x0 - 50 + (total + 100) * clamp01(reveal) - 50} y1="0" x2={x0 - 50 + (total + 100) * clamp01(reveal)} y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={x0 - 60} y={base - fs * 1.4} width={total + 120} height={fs * 2}>
            <rect x={x0 - 60} y={base - fs * 1.4} width={total + 120} height={fs * 2} fill={`url(#${id}-g)`} />
          </mask>
        </defs>
      ) : null}
      <text x={x0} y={base} fontFamily={FONT} fontWeight={600} fontSize={fs} fill={C.paper} xmlSpace="preserve" letterSpacing={0} mask={reveal < 1 ? `url(#${id}-m)` : undefined}>
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

// ---------------------------------------------------------------------------------------------
// Catalase (S07). Not amylase with a different colour: its own body and its own small, rounded
// active site, complementary to ONE hydrogen peroxide molecule (S05 taught specificity — catalase
// must not carry amylase's glucose-shaped pocket). Units: 1 = 1 px at scale 1.
// TODO(shared): promote foldedChainIn + a pocket-shape prop on <Enzyme> into src/components.

/** Same space-filling "packed noodle" as molecule-geometry's foldedChain, for any outline. */
const chainCache = new Map<string, Pt[]>();
export const foldedChainIn = (poly: readonly Pt[], seed: number, cell = 44): Pt[] => {
  const ck = `${seed}:${cell}:${poly.length}:${poly[0][0].toFixed(1)}`;
  const hit = chainCache.get(ck);
  if (hit) return hit;
  const rand = rng(seed);
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const cols = Math.ceil((Math.max(...xs) - x0) / cell);
  const rows = Math.ceil((Math.max(...ys) - y0) / cell);
  const key = (c: number, r: number) => r * cols + c;
  const centre = (c: number, r: number): Pt => [x0 + (c + 0.5) * cell, y0 + (r + 0.5) * cell];
  const ok = new Set<number>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = centre(c, r);
      if (pointInPolygon(p, poly) && distToPolygon(p, poly) > cell * 0.55) ok.add(key(c, r));
    }
  }
  const dirs: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const start = [...ok][Math.floor(ok.size / 2)];
  const inTree = new Set<number>([start]);
  const edges = new Set<string>();
  const frontier: [number, number][] = [];
  const pushFrontier = (k: number) => {
    const c = k % cols;
    const r = Math.floor(k / cols);
    for (const [dc, dr] of dirs) {
      const nk = key(c + dc, r + dr);
      if (c + dc >= 0 && c + dc < cols && ok.has(nk) && !inTree.has(nk)) frontier.push([k, nk]);
    }
  };
  pushFrontier(start);
  while (frontier.length) {
    const [a, b] = frontier.splice(Math.floor(rand() * frontier.length), 1)[0];
    if (inTree.has(b)) continue;
    inTree.add(b);
    edges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    pushFrontier(b);
  }
  const has = (a: number, b: number) => edges.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
  const adj = new Map<string, string[]>();
  const link = (u: string, v: string) => {
    adj.set(u, [...(adj.get(u) ?? []), v]);
    adj.set(v, [...(adj.get(v) ?? []), u]);
  };
  for (const k of inTree) {
    const c = k % cols;
    const r = Math.floor(k / cols);
    const n = key(c, r - 1);
    const e = key(c + 1, r);
    const s = key(c, r + 1);
    const w = key(c - 1, r);
    const N = inTree.has(n) && has(k, n);
    const E = c + 1 < cols && inTree.has(e) && has(k, e);
    const S = inTree.has(s) && has(k, s);
    const Wd = c - 1 >= 0 && inTree.has(w) && has(k, w);
    if (!N) link(`${k}:0`, `${k}:1`);
    if (!E) link(`${k}:1`, `${k}:2`);
    if (!S) link(`${k}:2`, `${k}:3`);
    if (!Wd) link(`${k}:3`, `${k}:0`);
    if (E) {
      link(`${k}:1`, `${e}:0`);
      link(`${k}:2`, `${e}:3`);
    }
    if (S) {
      link(`${k}:3`, `${s}:0`);
      link(`${k}:2`, `${s}:1`);
    }
  }
  const pos = (id: string): Pt => {
    const [ks, qs] = id.split(":");
    const k = Number(ks);
    const q = Number(qs);
    const [cx, cy] = centre(k % cols, Math.floor(k / cols));
    const o = cell / 4;
    return [cx + (q === 1 || q === 2 ? o : -o), cy + (q >= 2 ? o : -o)];
  };
  const first = `${start}:0`;
  const order: string[] = [first];
  let prev = "";
  let cur = first;
  for (let guard = 0; guard < adj.size + 2; guard++) {
    const nb = (adj.get(cur) ?? []).find((v) => v !== prev);
    if (!nb || nb === first) break;
    order.push(nb);
    prev = cur;
    cur = nb;
  }
  let pts: Pt[] = [];
  for (let i = 0; i < order.length; i++) {
    const a = pos(order[i]);
    const b = pos(order[(i + 1) % order.length]);
    for (let s = 0; s < 2; s++) {
      const t = s / 2;
      pts.push([a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * 9, a[1] + (b[1] - a[1]) * t + (rand() - 0.5) * 9]);
    }
  }
  for (let it = 0; it < 4; it++) {
    pts = pts.map((p, i) => {
      const q = pts[(i - 1 + pts.length) % pts.length];
      const r = pts[(i + 1) % pts.length];
      return [p[0] * 0.4 + (q[0] + r[0]) * 0.3, p[1] * 0.4 + (q[1] + r[1]) * 0.3] as Pt;
    });
  }
  chainCache.set(ck, pts);
  return pts;
};

/** Catalase active site: a rounded slot that fits one H₂O₂ (lips at x = −156, floor at x = −72). */
export const CAT_SITE = { lipX: -156, h: 38, floorX: -72 } as const;
/** Where a bound H₂O₂ sits (catalase-local), and the glyph scale/rotation that fits the slot. */
export const CAT_DOCK: Pt = [-112, 0];
export const CAT_H2O2 = { scale: 0.46, rotate: 90 } as const;

const catalaseOutline = (() => {
  const { lipX, h, floorX } = CAT_SITE;
  const R = (a: number) => 172 * (1 + 0.06 * Math.sin(2 * a + 0.7) + 0.045 * Math.sin(3 * a + 2.2) + 0.03 * Math.sin(5 * a + 0.4));
  const pts: Pt[] = [];
  const radii: number[] = [];
  pts.push([lipX - 4, -h - 6]);
  radii.push(12);
  const N = 24;
  const d = 0.5;
  for (let i = 0; i < N; i++) {
    const a = Math.PI + d + ((2 * Math.PI - 2 * d) * i) / (N - 1);
    pts.push([Math.cos(a) * R(a), Math.sin(a) * R(a)]);
    radii.push(46);
  }
  pts.push([lipX - 4, h + 6]);
  radii.push(12);
  // slot: lower wall → rounded floor → upper wall
  const cx = floorX - h;
  pts.push([lipX + 6, h]);
  radii.push(5);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI / 2 - (Math.PI * i) / 10;
    pts.push([cx + Math.cos(a) * h, Math.sin(a) * h]);
    radii.push(2);
  }
  pts.push([lipX + 6, -h]);
  radii.push(5);
  return { pts, radii };
})();
export const CATALASE_OUTLINE: readonly Pt[] = catalaseOutline.pts;
const CATALASE_D = roundedPolygon(catalaseOutline.pts, catalaseOutline.radii);
/** The site's outline only (lower lip → floor → upper lip), for a highlight. */
const CAT_SITE_PTS = catalaseOutline.pts.slice(25);

export const Catalase: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly rotate?: number;
  readonly opacity?: number;
  /** 0..1 body fill (0 = only the folded chain shows, for the rebuild). */
  readonly fill?: number;
  /** 0..1 soft glow in the active site (a reaction happening). */
  readonly glow?: number;
  readonly seed?: number;
  /** Cheap version for small/far copies: no inner chain, no blurred shadow. */
  readonly lod?: "high" | "low";
}> = ({ x, y, scale = 1, rotate = 0, opacity = 1, fill = 1, glow = 0, seed = 23, lod = "high" }) => {
  const id = useSvgId("cat");
  const pal = ENZYME_PALETTES.violet;
  const chain = lod === "high" ? foldedChainIn(CATALASE_OUTLINE, seed * 97 + 11) : [];
  if (opacity <= 0) return null;
  const site = CAT_SITE;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pal.main} />
          <stop offset="0.65" stopColor={pal.deep} />
          <stop offset="1" stopColor={pal.dark} />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={pal.light} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={pal.light} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={CATALASE_D} />
        </clipPath>
        {lod === "high" ? (
          <filter id={`${id}-s`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        ) : null}
        <radialGradient id={`${id}-g`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={pal.light} stopOpacity={0.85} />
          <stop offset="1" stopColor={pal.light} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={CATALASE_D} transform="translate(0 14)" fill={C.ink950} opacity={0.35 * fill} filter={lod === "high" ? `url(#${id}-s)` : undefined} />
      <g opacity={fill}>
        <path d={CATALASE_D} fill={`url(#${id}-f)`} />
        {lod === "high" ? (
          <g clipPath={`url(#${id}-c)`}>
            <path d={smoothOpenPath(chain, 0.9)} fill="none" stroke={pal.dark} strokeOpacity={0.22} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            <path d={smoothOpenPath(chain, 0.9)} fill="none" stroke={pal.light} strokeOpacity={0.14} strokeWidth={3} strokeLinecap="round" transform="translate(-1.5 -2)" />
          </g>
        ) : null}
        <path d={CATALASE_D} fill="none" stroke={`url(#${id}-r)`} strokeWidth={16} clipPath={`url(#${id}-c)`} />
        {/* the active site's walls: a slightly darker rim so the pocket reads as a pocket */}
        <path d={smoothOpenPath(CAT_SITE_PTS, 0.2)} fill="none" stroke={pal.dark} strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" />
      </g>
      {glow > 0.01 ? <ellipse cx={(site.lipX + site.floorX) / 2 + 4} cy={0} rx={70} ry={56} fill={`url(#${id}-g)`} opacity={glow} /> : null}
    </g>
  );
};

/** A generic globular protein seen from far away (no active site drawn): the crowd inside a cell. */
export const ProteinBlob: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly seed: number;
  readonly opacity?: number;
}> = ({ x, y, r, seed, opacity = 1 }) => {
  const id = useSvgId("blob");
  if (opacity <= 0) return null;
  const rr = rng(seed * 31 + 7);
  const k = [rr() * 6, rr() * 6, rr() * 6];
  const pts: Pt[] = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const m = 1 + 0.1 * Math.sin(2 * a + k[0]) + 0.07 * Math.sin(3 * a + k[1]) + 0.05 * Math.sin(5 * a + k[2]);
    return [x + Math.cos(a) * r * m, y + Math.sin(a) * r * m * 0.9];
  });
  const d = smoothClosedPath(pts, 0.9);
  const pal = ENZYME_PALETTES.violet;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pal.main} stopOpacity={0.75} />
          <stop offset="1" stopColor={pal.dark} stopOpacity={0.75} />
        </linearGradient>
      </defs>
      <path d={d} transform="translate(0 8)" fill={C.ink950} opacity={0.3} />
      <path d={d} fill={`url(#${id}-f)`} />
      <path d={d} fill="none" stroke={pal.light} strokeOpacity={0.35} strokeWidth={3} strokeDasharray={`${r * 2.2} ${r * 9}`} strokeDashoffset={r * 0.6} />
    </g>
  );
};

/**
 * A small desk calendar whose pages flip over: "time passes" without claiming a number of days.
 * `flips` counts pages turned (fractional = the current page mid-turn).
 */
export const Calendar: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly flips: number;
  readonly progress: number;
  readonly opacity?: number;
}> = ({ x, y, size = 150, flips, progress, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const w = size;
  const h = size * 1.05;
  const head = h * 0.24;
  const turning = flips - Math.floor(flips); // 0..1 of the page being turned
  // the turning page hinges on its top edge: squash towards the hinge, then it is gone
  const sy = Math.cos(turning * Math.PI);
  const page = (key: string, shade: number, scaleY = 1) => (
    <g key={key} transform={`translate(0 ${-h / 2 + head}) scale(1 ${scaleY}) translate(0 ${h / 2 - head})`} opacity={1 - shade}>
      <rect x={-w / 2} y={-h / 2 + head} width={w} height={h - head} rx={12} fill={scaleY < 0 ? C.paperDim : C.paper} />
      {scaleY >= 0
        ? Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={-w / 2 + w * (0.2 + (i % 4) * 0.2)} cy={-h / 2 + head + (h - head) * (0.24 + Math.floor(i / 4) * 0.26)} r={size * 0.035} fill={C.ink400} opacity={0.7} />
          ))
        : null}
    </g>
  );
  return (
    <g opacity={opacity * p} transform={`translate(${x} ${y + (1 - p) * 16})`}>
      <rect x={-w / 2} y={-h / 2 + 8} width={w} height={h} rx={14} fill={C.ink950} opacity={0.4} />
      {page("under", 0)}
      {turning > 0.001 ? page("turn", 0.15 * Math.abs(sy), sy) : null}
      <rect x={-w / 2} y={-h / 2} width={w} height={head + 6} rx={12} fill={C.ink500} />
      <rect x={-w / 2 + 12} y={-h / 2 + 5} width={w - 24} height={head * 0.3} rx={6} fill={C.paper} opacity={0.18} />
      {[-0.22, 0.22].map((t, i) => (
        <rect key={i} x={t * w - 6} y={-h / 2 - 14} width={12} height={34} rx={6} fill={C.paperDim} />
      ))}
    </g>
  );
};
