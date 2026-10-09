import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C } from "../../brand/tokens";
import { Pt, rng } from "../../lib/geometry";
import { InkStyle, endTangent, inkGeometry, penEase, prepareStroke, seg } from "./ink";
import { HandLayer, InkPath } from "./shared";

/**
 * Hand-drawn annotation marks (marker on glass). Every mark:
 *  - draws on with `progress` 0..1 (pass it LINEAR — pen speed easing is built in),
 *  - is shaped by `seed` (same seed = identical mark on every frame),
 *  - never boils unless you set `boil` (0.3 is plenty).
 */
export type HandCommon = {
  readonly progress: number;
  readonly color?: string;
  /** Marker width in px at 1080p. */
  readonly width?: number;
  readonly seed?: number;
  readonly opacity?: number;
  /** 0..1 felt-tip edge roughness. Default 0.6. */
  readonly rough?: number;
  /** 0..1 stepped redraw wobble ("on fours"). Default 0 (off). */
  readonly boil?: number;
};

const useStyle = (p: HandCommon, defaults: Partial<InkStyle> & { width: number }, salt = 0): InkStyle => {
  const frame = useCurrentFrame();
  return {
    ...defaults,
    width: p.width ?? defaults.width,
    seed: (p.seed ?? 1) * 7919 + salt,
    boil: p.boil ?? 0,
    frame,
  };
};

const rot = ([x, y]: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

// ---------------------------------------------------------------------------

export type HandCircleProps = HandCommon & {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry?: number;
  /** Where the pen lands, degrees (0 = 3 o'clock, −90 = 12 o'clock). Default −35. */
  readonly startAngle?: number;
  /** Extra fraction of a turn past the start. Default 0.16. */
  readonly overshoot?: number;
  readonly clockwise?: boolean;
};

/** A marker loop around something, overshooting its own start like a real hand. */
export const HandCircle: React.FC<HandCircleProps> = (p) => {
  const { cx, cy, rx, ry = rx, startAngle = -35, overshoot = 0.16, clockwise = false, color = C.paper, progress } = p;
  const style = useStyle(p, { width: 7, wobble: 0.6, minStart: 0.45, minEnd: 0.2, taperEnd: 60 });
  const r = rng(style.seed);
  const tilt = (r() - 0.5) * 10;
  const turns = 1 + overshoot + (r() - 0.5) * 0.04;
  const dir = clockwise ? 1 : -1;
  const n = Math.ceil(turns * 28);
  const ctrl: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = ((startAngle + dir * t * turns * 360) * Math.PI) / 180;
    // Starts a touch inside, finishes a touch outside: the loop never meets itself exactly.
    const spiral = 0.965 + 0.075 * t;
    const egg = 1 + noise2D(`circ-${style.seed}`, Math.cos(a) * 0.7, Math.sin(a) * 0.7) * 0.045;
    const k = spiral * egg;
    const local = rot([Math.cos(a) * rx * k, Math.sin(a) * ry * k], tilt);
    ctrl.push([cx + local[0], cy + local[1]]);
  }
  const { poly, L } = prepareStroke(ctrl, style);
  const geo = inkGeometry(poly, L, style, penEase(Math.max(0, Math.min(1, progress))));
  return (
    <HandLayer opacity={p.opacity} rough={p.rough} seed={style.seed}>
      <InkPath geo={geo} color={color} />
    </HandLayer>
  );
};

// ---------------------------------------------------------------------------

export type HandUnderlineProps = HandCommon & {
  readonly x1: number;
  readonly x2: number;
  readonly y: number;
  /** Second, shorter stroke underneath (emphasis). */
  readonly double?: boolean;
  /** Px the line bows down in the middle. Default ≈ 0.6% of the length. */
  readonly sag?: number;
  /** Px the end drifts up (a right hand pulls upward). Default ≈ 1.2% of length. */
  readonly rise?: number;
};

export const HandUnderline: React.FC<HandUnderlineProps> = (p) => {
  const { x1, x2, y, double = false, color = C.paper, progress } = p;
  const len = Math.abs(x2 - x1);
  const sag = p.sag ?? len * 0.006 + 1;
  const rise = p.rise ?? len * 0.012;
  const s1 = useStyle(p, { width: 7, wobble: 1.2, minStart: 0.55, minEnd: 0.2 });
  const s2 = useStyle(p, { width: 6, wobble: 1.2, minStart: 0.5, minEnd: 0.15 }, 31);
  const line = (a: number, b: number, yy: number, r: number): Pt[] =>
    [0, 0.25, 0.5, 0.75, 1].map((t) => [a + (b - a) * t, yy + Math.sin(t * Math.PI) * sag - t * r]);
  const st1 = prepareStroke(line(x1 - 4, x2 + 4, y, rise), s1);
  const st2 = prepareStroke(line(x1 + len * 0.08, x2 - len * 0.18, y + 15, rise * 0.6), s2);
  const pa = double ? seg(progress, 0, 0.62) : progress;
  const pb = seg(progress, 0.68, 1);
  return (
    <HandLayer opacity={p.opacity} rough={p.rough} seed={s1.seed}>
      <InkPath geo={inkGeometry(st1.poly, st1.L, s1, penEase(pa))} color={color} />
      {double ? <InkPath geo={inkGeometry(st2.poly, st2.L, s2, penEase(pb))} color={color} /> : null}
    </HandLayer>
  );
};

// ---------------------------------------------------------------------------

export type HandArrowProps = HandCommon & {
  readonly from: Pt;
  readonly to: Pt;
  /** Curvature as a fraction of the length; sign picks the side. Default 0.18. */
  readonly bend?: number;
  /** Barb length in px. Default 26 + 1.6 × width. */
  readonly head?: number;
  /** Half-angle of the head, degrees. Default 30. */
  readonly headAngle?: number;
  /** Leave this many px clear at each end (so the arrow doesn't touch its targets). */
  readonly gapStart?: number;
  readonly gapEnd?: number;
};

/** A curved, hand-drawn arrow. The shaft draws first, then the two barbs. */
export const HandArrow: React.FC<HandArrowProps> = (p) => {
  const { from, to, bend = 0.18, headAngle = 30, gapStart = 0, gapEnd = 0, color = C.paper, progress } = p;
  const shaftStyle = useStyle(p, { width: 7, minStart: 0.4, minEnd: 0.85, taperEnd: 10 });
  const w = shaftStyle.width;
  const head = p.head ?? 26 + w * 1.6;
  const barbStyle = (salt: number): InkStyle => ({
    ...shaftStyle,
    seed: shaftStyle.seed + salt,
    wobble: 0.4,
    minStart: 0.85,
    minEnd: 0.3,
    taperStart: 2,
    taperEnd: head * 0.7,
    pressure: 0.05,
  });
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const a: Pt = [from[0] + ux * gapStart, from[1] + uy * gapStart];
  const b: Pt = [to[0] - ux * gapEnd, to[1] - uy * gapEnd];
  const L0 = len - gapStart - gapEnd;
  const c: Pt = [(a[0] + b[0]) / 2 - uy * bend * L0, (a[1] + b[1]) / 2 + ux * bend * L0];
  const ctrl: Pt[] = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => [
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ]);
  const shaft = prepareStroke(ctrl, { ...shaftStyle, wobble: shaftStyle.wobble ?? Math.min(3, L0 * 0.008 + 0.6) });
  const tip = shaft.poly[shaft.poly.length - 1];
  const tan = endTangent(shaft.poly, shaft.L, Math.min(40, L0 * 0.15));
  const r = rng(shaftStyle.seed + 5);
  const barb = (sign: number, salt: number) => {
    const ang = headAngle + (r() - 0.5) * 3;
    const back = rot([-tan[0], -tan[1]], sign * ang);
    const blen = head * (1 + (r() - 0.5) * 0.06);
    const perp: Pt = [-back[1] * sign, back[0] * sign];
    // Tiny inward curve on each barb: drawn with a flick, not a ruler.
    const pts: Pt[] = [0, 0.5, 1].map((t) => [
      tip[0] + back[0] * blen * t + perp[0] * blen * 0.05 * Math.sin(t * Math.PI),
      tip[1] + back[1] * blen * t + perp[1] * blen * 0.05 * Math.sin(t * Math.PI),
    ]);
    const st = barbStyle(salt);
    return { ...prepareStroke(pts, { ...st, wobble: 0 }), st };
  };
  const b1 = barb(1, 101);
  const b2 = barb(-1, 202);
  return (
    <HandLayer opacity={p.opacity} rough={p.rough} seed={shaftStyle.seed}>
      <InkPath geo={inkGeometry(shaft.poly, shaft.L, shaftStyle, penEase(seg(progress, 0, 0.72)))} color={color} />
      <InkPath geo={inkGeometry(b1.poly, b1.L, b1.st, penEase(seg(progress, 0.74, 0.87)))} color={color} />
      <InkPath geo={inkGeometry(b2.poly, b2.L, b2.st, penEase(seg(progress, 0.86, 1)))} color={color} />
    </HandLayer>
  );
};

// ---------------------------------------------------------------------------

export type HandMarkProps = HandCommon & {
  readonly cx: number;
  readonly cy: number;
  /** Overall size in px. */
  readonly size?: number;
};

/** ✕ in two strokes (the second starts after a short pen lift). Default colour coral. */
export const HandCross: React.FC<HandMarkProps> = (p) => {
  const { cx, cy, size = 90, color = C.coral, progress } = p;
  const s1 = useStyle(p, { width: 9, wobble: 0.8, minStart: 0.6, minEnd: 0.3, taperEnd: size * 0.35 });
  const s2 = useStyle(p, { width: 9, wobble: 0.8, minStart: 0.6, minEnd: 0.3, taperEnd: size * 0.35 }, 17);
  const h = size / 2;
  const P = (x: number, y: number): Pt => [cx + x * h, cy + y * h];
  const a = prepareStroke([P(-0.92, -0.96), P(-0.02, 0.02), P(0.96, 0.92)], s1);
  const b = prepareStroke([P(0.9, -1.0), P(0.04, -0.04), P(-0.98, 0.9)], s2);
  return (
    <HandLayer opacity={p.opacity} rough={p.rough} seed={s1.seed}>
      <InkPath geo={inkGeometry(a.poly, a.L, s1, penEase(seg(progress, 0, 0.46)))} color={color} />
      <InkPath geo={inkGeometry(b.poly, b.L, s2, penEase(seg(progress, 0.56, 1)))} color={color} />
    </HandLayer>
  );
};

/** ✓ in one stroke: short press down, rounded turn, long flick up. Default colour teal. */
export const HandTick: React.FC<HandMarkProps> = (p) => {
  const { cx, cy, size = 100, color = C.teal, progress } = p;
  const style = useStyle(p, { width: 10, wobble: 0.6, minStart: 0.55, minEnd: 0.18, taperStart: 8, taperEnd: size * 0.55 });
  const h = size / 2;
  const P = (x: number, y: number): Pt => [cx + x * h, cy + y * h];
  const st = prepareStroke(
    [P(-0.86, 0.02), P(-0.56, 0.32), P(-0.3, 0.62), P(-0.16, 0.66), P(0.1, 0.24), P(0.5, -0.38), P(0.92, -0.84)],
    style,
  );
  return (
    <HandLayer opacity={p.opacity} rough={p.rough} seed={style.seed}>
      <InkPath geo={inkGeometry(st.poly, st.L, style, penEase(progress))} color={color} />
    </HandLayer>
  );
};

// ---------------------------------------------------------------------------

export type HandBracketProps = HandCommon & {
  readonly from: Pt;
  readonly to: Pt;
  /** How far the beak sticks out, px. Default 36. */
  readonly depth?: number;
  /** 1 = beak on the left of from→to (looking along it), −1 = right. */
  readonly side?: 1 | -1;
  readonly variant?: "curly" | "square";
};

/** A brace or bracket grouping things (e.g. "these two = maltose"). */
export const HandBracket: React.FC<HandBracketProps> = (p) => {
  const { from, to, depth = 36, side = 1, variant = "curly", color = C.paper, progress } = p;
  const s1 = useStyle(p, { width: 6, wobble: 0.7, minStart: 0.35, minEnd: 0.35, taperEnd: 18, taperStart: 14 });
  const s2 = useStyle(p, { width: 6, wobble: 0.7, minStart: 0.35, minEnd: 0.35, taperEnd: 18, taperStart: 14 }, 23);
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const L = Math.hypot(dx, dy) || 1;
  const u: Pt = [dx / L, dy / L];
  const v: Pt = [u[1] * side, -u[0] * side];
  const at = (uu: number, vv: number): Pt => [from[0] + u[0] * uu + v[0] * vv, from[1] + u[1] * uu + v[1] * vv];
  const quad = (p0: Pt, c: Pt, p1: Pt, n = 6): Pt[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n;
      return [
        (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0],
        (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1],
      ] as Pt;
    });
  if (variant === "square") {
    const d = depth * 0.7;
    const rr = Math.min(12, L * 0.1);
    const pts: Pt[] = [
      at(0, 0),
      at(0, (d - rr) / 2),
      ...quad(at(0, d - rr), at(0, d), at(rr, d), 4),
      at(L / 2, d),
      ...quad(at(L - rr, d), at(L, d), at(L, d - rr), 4),
      at(L, (d - rr) / 2),
      at(L, 0),
    ];
    const st = prepareStroke(pts, s1);
    return (
      <HandLayer opacity={p.opacity} rough={p.rough} seed={s1.seed}>
        <InkPath geo={inkGeometry(st.poly, st.L, s1, penEase(progress))} color={color} />
      </HandLayer>
    );
  }
  const h = depth * 0.42;
  const r = Math.min(L * 0.14, depth * 1.1);
  const half1: Pt[] = [
    ...quad(at(0, 0), at(0, h), at(r, h), 5),
    ...quad(at(L / 2 - r, h), at(L / 2, h), at(L / 2, depth), 5),
  ];
  const half2: Pt[] = [
    ...quad(at(L / 2, depth), at(L / 2, h), at(L / 2 + r, h), 5),
    ...quad(at(L - r, h), at(L, h), at(L, 0), 5),
  ];
  // Two strokes meeting at the beak keep it a clean point (one stroke would pinch).
  const a = prepareStroke(dedupe(half1), s1);
  const b = prepareStroke(dedupe(half2), s2);
  return (
    <HandLayer opacity={p.opacity} rough={p.rough} seed={s1.seed}>
      <InkPath geo={inkGeometry(a.poly, a.L, s1, penEase(seg(progress, 0, 0.5)))} color={color} />
      <InkPath geo={inkGeometry(b.poly, b.L, s2, penEase(seg(progress, 0.5, 1)))} color={color} />
    </HandLayer>
  );
};

const dedupe = (pts: Pt[]): Pt[] =>
  pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 0.5);

// ---------------------------------------------------------------------------

export type StrikeThroughProps = HandCommon & {
  readonly x1: number;
  readonly x2: number;
  /** Centre line of the lowercase letters (textBox(...).strikeY). */
  readonly y: number;
  /** 1 = single decisive line, 2–3 = marker scratch back and forth. */
  readonly passes?: 1 | 2 | 3;
};

/** Marker scratch through a wrong word. Default colour coral. */
export const StrikeThrough: React.FC<StrikeThroughProps> = (p) => {
  const { x1, x2, y, passes = 1, color = C.coral, progress } = p;
  const len = Math.abs(x2 - x1);
  const styles = [
    useStyle(p, { width: 8, wobble: 1.4, minStart: 0.6, minEnd: 0.3, taperEnd: 26 }),
    useStyle(p, { width: 7, wobble: 1.4, minStart: 0.5, minEnd: 0.25, taperEnd: 26 }, 41),
    useStyle(p, { width: 7, wobble: 1.4, minStart: 0.5, minEnd: 0.25, taperEnd: 26 }, 83),
  ];
  const lines: [Pt, Pt][] = [
    [
      [x1 - 10, y + 6],
      [x2 + 10, y - 8],
    ],
    [
      [x2 + 4, y + 4],
      [x1 - 2, y + 18],
    ],
    [
      [x1 + 4, y - 16],
      [x2 - 6, y - 4],
    ],
  ];
  const n = passes;
  const strokes = lines.slice(0, n).map(([a, b], i) => {
    const pts: Pt[] = [0, 0.33, 0.66, 1].map((t) => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * (i === 1 ? -2 : 2) * (len / 300),
    ]);
    const st = prepareStroke(pts, styles[i]);
    const span = 1 / n;
    const pr = seg(progress, i * span, i * span + span * (n > 1 ? 0.88 : 1));
    return inkGeometry(st.poly, st.L, styles[i], penEase(pr));
  });
  return (
    <HandLayer opacity={p.opacity} rough={p.rough} seed={styles[0].seed}>
      {strokes.map((g, i) => (
        <InkPath key={i} geo={g} color={color} />
      ))}
    </HandLayer>
  );
};
