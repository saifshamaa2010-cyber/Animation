/**
 * The "hand" engine behind every annotation in the kit.
 *
 * A mark is a centre line (a few control points) that is:
 *  1. smoothed (centripetal Catmull–Rom, so no loops or kinks),
 *  2. nudged by LOW-frequency seeded noise (a hand drifts; it doesn't shake),
 *  3. turned into a filled ribbon whose width follows a pen-pressure profile:
 *     a quick press-in at the start, gentle pressure variation, a lift-off taper.
 *
 * Width is computed from the position along the FULL stroke, so while a mark is
 * drawing on, the part already drawn never changes shape (no "boiling").
 * Everything is deterministic: same seed, same mark, every frame, every render.
 */
import { noise2D } from "@remotion/noise";
import { Easing } from "remotion";
import { Pt } from "../../lib/geometry";

export type InkStyle = {
  /** Body width in px. */
  readonly width: number;
  readonly seed: number;
  /** Low-frequency drift of the centre line, px. Default ≈ 0.28 × width + 1. */
  readonly wobble?: number;
  /** Wavelength of the drift, px (bigger = lazier, smoother hand). Default 320. */
  readonly wobbleScale?: number;
  /** Length of the press-in at the start, px. Default 2.2 × width. */
  readonly taperStart?: number;
  /** Length of the lift-off at the end, px. Default 3.2 × width. */
  readonly taperEnd?: number;
  /** Width fraction at the very first point. Default 0.5. */
  readonly minStart?: number;
  /** Width fraction at the very last point. Default 0.22. */
  readonly minEnd?: number;
  /** ± width variation from pen pressure (0..0.3). Default 0.12. */
  readonly pressure?: number;
  /** Optional time-varying extra wobble (stepped, "on fours"); 0 = none. */
  readonly boil?: number;
  readonly frame?: number;
};

export type Poly = Pt[];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/** Sub-progress of one stroke inside a multi-stroke mark. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/** Pen speed: a hand starts slow, travels fast, settles at the end. */
export const penEase = Easing.bezier(0.42, 0, 0.28, 1);

/** Centripetal Catmull–Rom through `pts`, sampled every ~`step` px. */
export const sampleSpline = (pts: readonly Pt[], closed = false, step = 3): Poly => {
  if (pts.length < 2) return pts.map((p) => [p[0], p[1]] as Pt);
  const n = pts.length;
  const get = (i: number): Pt => {
    if (closed) return pts[((i % n) + n) % n];
    if (i < 0) {
      // Reflect the first segment so the curve starts tangent to it.
      return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
    }
    if (i >= n) return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]];
    return pts[i];
  };
  const out: Poly = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const d = (a: Pt, b: Pt) => Math.max(1e-4, Math.sqrt(Math.hypot(a[0] - b[0], a[1] - b[1])));
    const t0 = 0;
    const t1 = t0 + d(p0, p1);
    const t2 = t1 + d(p1, p2);
    const t3 = t2 + d(p2, p3);
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(3, Math.ceil(len / step));
    for (let s = 0; s < steps; s++) {
      const t = t1 + ((t2 - t1) * s) / steps;
      const lerpT = (a: Pt, b: Pt, ta: number, tb: number): Pt => {
        const k = (t - ta) / (tb - ta);
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      };
      const A1 = lerpT(p0, p1, t0, t1);
      const A2 = lerpT(p1, p2, t1, t2);
      const A3 = lerpT(p2, p3, t2, t3);
      const B1 = lerpT(A1, A2, t0, t2);
      const B2 = lerpT(A2, A3, t1, t3);
      out.push(lerpT(B1, B2, t1, t2));
    }
  }
  if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
  return out;
};

export const cumulative = (poly: Poly): number[] => {
  const L = [0];
  for (let i = 1; i < poly.length; i++) {
    L.push(L[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  }
  return L;
};

const normals = (poly: Poly): Pt[] =>
  poly.map((_, i) => {
    const a = poly[Math.max(0, i - 1)];
    const b = poly[Math.min(poly.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l] as Pt;
  });

/**
 * Displace a dense polyline sideways with smooth noise. Amplitude fades in over
 * the first and last few px so the ends stay where they were aimed.
 */
export const handDrift = (poly: Poly, style: InkStyle): Poly => {
  const amp = style.wobble ?? style.width * 0.28 + 1;
  const boil = style.boil ?? 0;
  if (amp <= 0 && boil <= 0) return poly;
  const lam = style.wobbleScale ?? 320;
  const L = cumulative(poly);
  const total = L[L.length - 1] || 1;
  const N = normals(poly);
  const step = boil > 0 ? Math.floor((style.frame ?? 0) / 4) : 0;
  return poly.map((p, i) => {
    const s = L[i];
    const edge = Math.min(1, s / 24, (total - s) / 24) * 0.6 + 0.4;
    let off = noise2D(`ink-${style.seed}`, s / lam, 0) * amp * edge;
    if (boil > 0) off += noise2D(`boil-${style.seed}`, s / 140, step * 0.61) * boil * 1.4;
    return [p[0] + N[i][0] * off, p[1] + N[i][1] * off];
  });
};

/** Pen-pressure width at arc length `s` of a stroke `total` px long. */
export const widthAt = (s: number, total: number, style: InkStyle) => {
  const w = style.width;
  const tS = Math.min(style.taperStart ?? w * 2.2, total * 0.3);
  const tE = Math.min(style.taperEnd ?? w * 3.2, total * 0.4);
  const minS = style.minStart ?? 0.5;
  const minE = style.minEnd ?? 0.22;
  const press = 1 + noise2D(`press-${style.seed}`, s / 150, 3) * (style.pressure ?? 0.12);
  const a = minS + (1 - minS) * smooth(s / Math.max(1, tS));
  const b = minE + (1 - minE) * Math.sin((Math.PI / 2) * clamp01((total - s) / Math.max(1, tE)));
  return Math.max(1.2, w * a * b * press);
};

const f = (n: number) => n.toFixed(2);

/** Cut a dense polyline at arc length `upto` (interpolating the last point). */
export const truncate = (poly: Poly, L: number[], upto: number): { pts: Poly; lens: number[] } => {
  if (upto >= L[L.length - 1]) return { pts: poly, lens: L };
  const pts: Poly = [];
  const lens: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    if (L[i] <= upto) {
      pts.push(poly[i]);
      lens.push(L[i]);
    } else {
      const k = (upto - L[i - 1]) / (L[i] - L[i - 1] || 1);
      pts.push([poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * k, poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * k]);
      lens.push(upto);
      break;
    }
  }
  return { pts, lens };
};

export type InkGeometry = {
  /** Filled ribbon outline. */
  readonly ribbon: string;
  /** Centre line (stroked thinly underneath to fill any pinch at tight turns). */
  readonly core: string;
  readonly coreWidth: number;
  /** Where the pen is now. */
  readonly tip: Pt;
};

/**
 * The visible part of a stroke at `progress` (0..1 of its length, already eased).
 * `poly` must be the dense, drifted polyline from `prepareStroke`.
 */
export const inkGeometry = (
  poly: Poly,
  L: number[],
  style: InkStyle,
  progress: number,
): InkGeometry | null => {
  const total = L[L.length - 1];
  const upto = total * clamp01(progress);
  if (upto < 0.6 || poly.length < 2) return null;
  const { pts, lens } = truncate(poly, L, upto);
  if (pts.length < 2) return null;
  const N = normals(pts);
  const W = lens.map((s) => widthAt(s, total, style));
  const left = pts.map((p, i) => [p[0] + (N[i][0] * W[i]) / 2, p[1] + (N[i][1] * W[i]) / 2] as Pt);
  const right = pts.map((p, i) => [p[0] - (N[i][0] * W[i]) / 2, p[1] - (N[i][1] * W[i]) / 2] as Pt);
  const last = pts.length - 1;
  const rEnd = W[last] / 2;
  const rStart = W[0] / 2;
  let d = `M${f(left[0][0])},${f(left[0][1])}`;
  for (let i = 1; i <= last; i++) d += `L${f(left[i][0])},${f(left[i][1])}`;
  d += `A${f(rEnd)},${f(rEnd)} 0 0 0 ${f(right[last][0])},${f(right[last][1])}`;
  for (let i = last - 1; i >= 0; i--) d += `L${f(right[i][0])},${f(right[i][1])}`;
  d += `A${f(rStart)},${f(rStart)} 0 0 0 ${f(left[0][0])},${f(left[0][1])}Z`;
  let core = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 1; i <= last; i++) core += `L${f(pts[i][0])},${f(pts[i][1])}`;
  const minW = Math.min(...W);
  return { ribbon: d, core, coreWidth: Math.max(1, minW * 0.85), tip: pts[last] };
};

/** Dense, drifted polyline + cumulative lengths for a set of control points. */
export const prepareStroke = (ctrl: readonly Pt[], style: InkStyle, closed = false) => {
  const dense = sampleSpline(ctrl, closed, 2.5);
  if (closed) dense.push(dense[0]);
  const poly = handDrift(dense, style);
  return { poly, L: cumulative(poly) };
};

/** Unit tangent at the end of a polyline, averaged over the last `over` px (stable arrowheads). */
export const endTangent = (poly: Poly, L: number[], over = 22): Pt => {
  const total = L[L.length - 1];
  let i = poly.length - 1;
  while (i > 0 && total - L[i] < over) i--;
  const a = poly[i];
  const b = poly[poly.length - 1];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
};
