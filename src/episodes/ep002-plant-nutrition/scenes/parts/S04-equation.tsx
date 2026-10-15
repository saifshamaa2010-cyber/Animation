/**
 * The photosynthesis word equation as built in S04, plus helpers to find where each term sits
 * (so molecules, icons and highlights can line up with it). S05 opens on the same equation in the
 * same place (WORD_EQ_TOP), so the cut between the two scenes is seamless.
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { chemWidth, type EqArrow, type EqTerm } from "../../../../components/Equation";
import { mix } from "../../../../components/kit";
import { Pt, rng } from "../../../../lib/geometry";
import { useSvgId } from "../../../../components/ids";

export type EqLayout = { readonly x: number; readonly y: number; readonly size: number; readonly gap: number; readonly arrow: number };

/** Centre stage while the equation is built (S04 first half). */
export const WORD_EQ_MID: EqLayout = { x: 960, y: 590, size: 56, gap: 24, arrow: 320 };
/** Top of the frame while the plant shows where the raw materials come from (S04 second half, S05 start). */
export const WORD_EQ_TOP: EqLayout = { x: 960, y: 248, size: 44, gap: 20, arrow: 250 };

export const lerpLayout = (a: EqLayout, b: EqLayout, t: number): EqLayout => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  size: a.size + (b.size - a.size) * t,
  gap: a.gap + (b.gap - a.gap) * t,
  arrow: a.arrow + (b.arrow - a.arrow) * t,
});

export type TermKey = "co2" | "plus1" | "water" | "arrow" | "glucose" | "plus2" | "oxygen";
export const TERM_KEYS: readonly TermKey[] = ["co2", "plus1", "water", "arrow", "glucose", "plus2", "oxygen"];

export type WordEqState = {
  /** arrival 0..1 per term */
  readonly p: Readonly<Record<TermKey, number>>;
  readonly light: number;
  readonly chlorophyll: number;
  readonly emphasis?: Partial<Record<TermKey, number>>;
  readonly dim?: Partial<Record<TermKey, number>>;
  readonly arrowLength: number;
};

/** Colour code (constant through the episode): inputs ice blue, glucose amber, oxygen coral. */
export const wordEqTerms = (s: WordEqState): (EqTerm | EqArrow)[] => {
  const e = s.emphasis ?? {};
  const d = s.dim ?? {};
  return [
    { text: "carbon dioxide", color: C.ice, p: s.p.co2, emphasis: e.co2, dim: d.co2 },
    { text: "+", color: C.ink300, p: s.p.plus1, dim: d.plus1 },
    { text: "water", color: C.ice, p: s.p.water, emphasis: e.water, dim: d.water },
    {
      arrow: true,
      p: s.p.arrow,
      length: s.arrowLength,
      over: "light",
      under: "chlorophyll",
      overColor: C.sun,
      underColor: C.leaf,
      overP: s.light,
      underP: s.chlorophyll,
      emphasis: e.arrow,
    },
    { text: "glucose", color: C.amber, p: s.p.glucose, emphasis: e.glucose, dim: d.glucose },
    { text: "+", color: C.ink300, p: s.p.plus2, dim: d.plus2 },
    { text: "oxygen", color: C.coral, p: s.p.oxygen, emphasis: e.oxygen, dim: d.oxygen },
  ];
};

/** Where each term of an `Equation` sits (same layout maths as the component). */
export const termBoxes = (terms: readonly (EqTerm | EqArrow)[], x: number, size: number, gap: number) => {
  const widths = terms.map((t) => ("arrow" in t ? t.length ?? 260 : chemWidth(t.text, size)));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (terms.length - 1);
  let cx = x - total / 2;
  return widths.map((w) => {
    const left = cx;
    cx += w + gap;
    return { left, right: left + w, cx: left + w / 2, w };
  });
};

// ------------------------------------------------------------------ workaround

/**
 * Equation draws its arrow as a line from `left` to `left + length × p` with round caps, so at
 * p = 0 a zero-length line still shows as a dot. Until the arrow starts drawing, mask that spot out.
 */
export const HideArrowDot: React.FC<{ readonly hide: boolean; readonly x: number; readonly y: number; readonly children: React.ReactNode }> = ({ hide, x, y, children }) => {
  const id = useSvgId("nodot");
  if (!hide) return <>{children}</>;
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <rect x={0} y={0} width={1920} height={1080} fill="white" />
          <circle cx={x} cy={y} r={10} fill="black" />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>{children}</g>
    </g>
  );
};

// ------------------------------------------------------------------ chloroplast icon

/** A single chloroplast (as in the approved preview): lens-shaped, green, with stacked grana. */
export const ChloroplastIcon: React.FC<{ readonly x: number; readonly y: number; readonly scale?: number; readonly progress: number; readonly glow?: number; readonly opacity?: number }> = ({
  x,
  y,
  scale = 1,
  progress,
  glow = 0,
  opacity = 1,
}) => {
  const id = useSvgId("chl");
  if (progress <= 0 || opacity <= 0) return null;
  const s = scale * (0.7 + 0.3 * EASE.out(Math.min(1, progress)));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, progress * 1.4) * opacity}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={mix(C.chloro, C.leafLight, 0.3)} />
          <stop offset="1" stopColor={C.leafDeep} />
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
      {/* the approved preview's chloroplast, drawn 2.2× larger */}
      <g transform="scale(2.2)">
        <ellipse rx={23} ry={13} fill={`url(#${id}-g)`} />
        {[-10, 0, 10].map((dx) => (
          <line key={dx} x1={dx} y1={-6} x2={dx} y2={6} stroke={C.leafDark} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
        ))}
        <ellipse rx={21.5} ry={11.5} fill="none" stroke={C.leafLight} strokeOpacity={0.55} strokeWidth={1.8} strokeDasharray="0 16 34 200" />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ roots (same geometry as the Roots component)

/** The side roots of `<Roots x y depth spread seed>`: each one from where it leaves the main root to its tip. */
export const rootGeometry = (x: number, y: number, depth: number, spread: number, seed: number) => {
  const r = rng(seed);
  const side: { pts: Pt[]; side: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const t = 0.12 + i * 0.1;
    const sx = x + (r() - 0.5) * 8;
    const sy = y + depth * t;
    const sd = i % 2 ? 1 : -1;
    const L = spread * (0.55 + r() * 0.45) * (1 - t * 0.5);
    const pts: Pt[] = [
      [sx, sy],
      [sx + sd * L * 0.4, sy + 16 + r() * 18],
      [sx + sd * L * 0.8, sy + 40 + r() * 40],
      [sx + sd * L, sy + 70 + r() * 50],
    ];
    side.push({ pts, side: sd });
  }
  return side;
};

/** Point at fraction u (0..1) along a polyline. */
export const alongPolyline = (pts: readonly Pt[], u: number): Pt => {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const t = lens[i] > 0 ? Math.min(1, d / lens[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
};

/** Sample the same smooth curve `smoothOpenPath(pts)` draws (Catmull–Rom, tension 0.5) into a dense polyline. */
export const sampleSmooth = (pts: readonly Pt[], steps = 16, tension = 0.5): Pt[] => {
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const k = tension / 3;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const v = 1 - t;
      out.push([
        v * v * v * p1[0] + 3 * v * v * t * c1[0] + 3 * v * t * t * c2[0] + t * t * t * p2[0],
        v * v * v * p1[1] + 3 * v * v * t * c1[1] + 3 * v * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  return out;
};
