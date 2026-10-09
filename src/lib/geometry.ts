export type Pt = readonly [number, number];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
];

export const lerpPts = (a: readonly Pt[], b: readonly Pt[], t: number): Pt[] =>
  a.map((p, i) => lerpPt(p, b[i], t));

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Closed polygon with rounded corners. `radii` is per-vertex (clamped so
 * neighbouring corners never overlap). Straight edges stay straight, which keeps
 * hexagonal pockets crisp while big radii make the body look organic.
 */
export const roundedPolygon = (
  pts: readonly Pt[],
  radii: number | readonly number[],
): string => {
  const n = pts.length;
  const r = (i: number) => (typeof radii === "number" ? radii : radii[i]);
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const lenIn = dist(prev, cur);
    const lenOut = dist(cur, next);
    const rad = Math.min(r(i), lenIn / 2, lenOut / 2);
    const a: Pt = lerpPt(cur, prev, lenIn === 0 ? 0 : rad / lenIn);
    const b: Pt = lerpPt(cur, next, lenOut === 0 ? 0 : rad / lenOut);
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(2)},${a[1].toFixed(2)} `;
    d += `Q${cur[0].toFixed(2)},${cur[1].toFixed(2)} ${b[0].toFixed(2)},${b[1].toFixed(2)} `;
  }
  return d + "Z";
};

/** Smooth open curve through points (Catmull–Rom converted to cubic Béziers). */
export const smoothOpenPath = (pts: readonly Pt[], tension = 0.5): string => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const k = tension / 3;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
};

/** Smooth closed curve through points. */
export const smoothClosedPath = (pts: readonly Pt[], tension = 0.5): string => {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const k = tension / 3;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + "Z";
};

export const pointInPolygon = (p: Pt, poly: readonly Pt[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

/** Distance from point to polygon edge (for keeping things away from walls). */
export const distToPolygon = (p: Pt, poly: readonly Pt[]) => {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const t = Math.max(
      0,
      Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / (abx * abx + aby * aby || 1)),
    );
    best = Math.min(best, Math.hypot(p[0] - (a[0] + abx * t), p[1] - (a[1] + aby * t)));
  }
  return best;
};

/** Deterministic pseudo-random generator (mulberry32). */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Regular hexagon with vertices pointing left and right. */
export const hexPoints = (r: number): Pt[] =>
  [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI / 3) * i;
    return [r * Math.cos(a), r * Math.sin(a)] as Pt;
  });
