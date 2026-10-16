/**
 * S12 helpers: the "=" / "≠" sign drawn between a test row and its control row; a pot plant whose
 * leaves hang (still attached) down into flasks.
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { Leaf, Pot, leafGeometry } from "../../../../components/bio";
import { mix } from "../../../../components/kit";
import { Pt, smoothOpenPath } from "../../../../lib/geometry";

/**
 * A hand-sized equals sign, drawn vertically between two rows (they are the same).
 * `neq` 0..1 strikes it through and turns it coral (they differ).
 */
export const EqualSign: React.FC<{ readonly x: number; readonly y: number; readonly progress: number; readonly neq?: number; readonly size?: number }> = ({ x, y, progress, neq = 0, size = 46 }) => {
  if (progress <= 0) return null;
  const p = EASE.out(Math.min(1, progress));
  const col = mix(C.ink300, C.coral, neq);
  const h = size / 2;
  const g = size * 0.2;
  const s = EASE.out(Math.min(1, neq));
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <line x1={x - h * p} y1={y - g} x2={x + h * p} y2={y - g} stroke={col} strokeWidth={7} strokeLinecap="round" />
      <line x1={x - h * p} y1={y + g} x2={x + h * p} y2={y + g} stroke={col} strokeWidth={7} strokeLinecap="round" />
      {s > 0 ? <line x1={x + h * 0.55} y1={y - h * 1.1} x2={x + h * 0.55 - (h * 1.1) * s} y2={y - h * 1.1 + h * 2.2 * s} stroke={col} strokeWidth={7} strokeLinecap="round" /> : null}
    </g>
  );
};

// ------------------------------------------------------------------ the carbon-dioxide set-up: a leaf still attached

/** A cubic stalk from a point on the stem (`from`) to a leaf base (`to`), leaving the stem along `c1` and reaching the leaf along `c2`. */
export type StalkGeo = { readonly from: Pt; readonly c1: Pt; readonly c2: Pt; readonly to: Pt };
const stalkD = (s: StalkGeo) => `M${s.from[0]},${s.from[1]} C${s.c1[0]},${s.c1[1]} ${s.c2[0]},${s.c2[1]} ${s.to[0]},${s.to[1]}`;

/** Point on a stalk at t (0 = stem … 1 = leaf base), e.g. to anchor a label. */
export const stalkAt = (s: StalkGeo, t: number): Pt => {
  const u = 1 - t;
  const b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  const P = [s.from, s.c1, s.c2, s.to];
  return [P.reduce((a, p, i) => a + p[0] * b[i], 0), P.reduce((a, p, i) => a + p[1] * b[i], 0)];
};

/** The points of a gently wavy stem from the soil (x, soilY) up to topY. */
export const stemPoints = (x: number, soilY: number, topY: number): Pt[] => {
  const H = soilY - topY;
  return [
    [x, soilY],
    [x + 4, soilY - H * 0.4],
    [x - 3, soilY - H * 0.75],
    [x, topY],
  ];
};
/** Point on the stem at height y (linear along the stem points; within a pixel or two of the drawn curve). */
export const stemAt = (pts: readonly Pt[], y: number): Pt => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if (y <= a[1] && y >= b[1]) {
      const u = (a[1] - y) / (a[1] - b[1]);
      return [a[0] + (b[0] - a[0]) * u, y];
    }
  }
  return [pts[pts.length - 1][0], y];
};

/**
 * A destarched pot plant (same style as bio/Plant: stem colour, light stripe, terracotta pot) whose
 * leaves hang on long stalks, e.g. down through a flask's bung. Leaves are drawn by the caller.
 * `grow` 0..1: pot, then the stem draws up and the shoot tip opens; `stalks[i].p` draws stalk i out
 * from the stem; `stalks[i].glow` 0..1 lights it up (to show the leaf is still joined to the plant).
 */
export const HangingShoot: React.FC<{
  readonly x: number;
  readonly soilY: number;
  readonly topY: number;
  readonly potW?: number;
  readonly potH?: number;
  readonly grow: number;
  readonly stalks: readonly (StalkGeo & { readonly p: number; readonly glow?: number })[];
  readonly opacity?: number;
}> = ({ x, soilY, topY, potW = 92, potH = 80, grow, stalks, opacity = 1 }) => {
  if (grow <= 0 || opacity <= 0) return null;
  const pts = stemPoints(x, soilY, topY);
  const d = smoothOpenPath(pts);
  const stemP = EASE.out(Math.max(0, Math.min(1, (grow - 0.2) / 0.6)));
  const tipP = Math.max(0, Math.min(1, (grow - 0.7) / 0.3));
  const tip = [-150, -30].map((a) => {
    const r = (a * Math.PI) / 180;
    const len = 46;
    return leafGeometry({ cx: x + Math.cos(r) * len * 0.62, cy: topY + Math.sin(r) * len * 0.62, len, wid: 24, ang: a, stalk: 0.12, veinPairs: 2 });
  });
  return (
    <g opacity={opacity}>
      <Pot x={x} y={soilY - 4} w={potW} h={potH} progress={Math.min(1, grow * 3)} />
      {stalks.map((s, i) =>
        s.p > 0 ? (
          <g key={i}>
            <path d={stalkD(s)} pathLength={1} strokeDasharray={`${EASE.out(Math.min(1, s.p))} 2`} fill="none" stroke={mix(C.stem, C.leafLight, 0.55 * (s.glow ?? 0))} strokeWidth={7 + 2 * (s.glow ?? 0)} strokeLinecap="round" />
            <path d={stalkD(s)} pathLength={1} strokeDasharray={`${EASE.out(Math.min(1, s.p))} 2`} fill="none" stroke={C.paper} strokeOpacity={0.22} strokeWidth={2} strokeLinecap="round" transform="translate(-2 -2)" />
          </g>
        ) : null,
      )}
      {stemP > 0 ? (
        <g>
          <path d={d} pathLength={1} strokeDasharray={`${stemP} 2`} fill="none" stroke={C.stem} strokeWidth={12} strokeLinecap="round" />
          <path d={d} pathLength={1} strokeDasharray={`${stemP} 2`} fill="none" stroke={C.leafLight} strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" transform="translate(-3 0)" />
        </g>
      ) : null}
      {tip.map((g, i) => (
        <Leaf key={i} geo={g} tone="green" progress={tipP} shadow={0.3} veins={0.6} />
      ))}
    </g>
  );
};
