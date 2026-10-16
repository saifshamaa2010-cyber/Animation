import React from "react";
import { W2 } from "../../brand/tokens";
import { Pt, rng, smoothClosedPath } from "../../lib/geometry";
import { mix } from "../kit/shared";

/**
 * Glossy cartoon plant cells for the "inside the leaf" world (v2 look): rounded blobs with a dark rim,
 * one soft gradient, a gloss highlight and chloroplasts lining the wall. Reusable for any tissue
 * (spongy / palisade mesophyll, epidermis, root hair cells…).
 *
 * Gradients use objectBoundingBox units, so ONE <CellPaint> serves every cell drawn with it.
 */
export const CellPaint: React.FC<{ readonly id: string; readonly light: string; readonly mid: string; readonly deep: string }> = ({ id, light, mid, deep }) => (
  <defs>
    <radialGradient id={id} cx="0.36" cy="0.28" r="0.85">
      <stop offset="0" stopColor={light} />
      <stop offset="0.55" stopColor={mid} />
      <stop offset="1" stopColor={deep} />
    </radialGradient>
  </defs>
);

/** Irregular rounded outline around (cx, cy). Same seed = same cell every frame. */
export const blobPath = (cx: number, cy: number, rx: number, ry: number, seed: number, rot = 0, wobble = 0.09, n = 9) => {
  const r = rng(seed);
  const a0 = r() * Math.PI * 2;
  const c = Math.cos((rot * Math.PI) / 180);
  const s = Math.sin((rot * Math.PI) / 180);
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = a0 + (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 2 * wobble;
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k;
    return [cx + x * c - y * s, cy + x * s + y * c];
  });
  return smoothClosedPath(pts, 0.9);
};

export type CellBlobProps = {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly rot?: number;
  readonly seed: number;
  /** fill, e.g. "url(#my-cell-paint)" */
  readonly paint: string;
  readonly line?: string;
  /** number of chloroplasts lining the wall (0 = a clear cell, like an epidermal cell) */
  readonly plastids?: number;
  readonly plastidColor?: string;
  /** 0..1 rim glow (e.g. "a large surface area"), in `glowColor` */
  readonly glow?: number;
  readonly glowColor?: string;
  /** 0..1 pop-in */
  readonly pop?: number;
  /** extra scale (e.g. a gulp when a molecule is taken in) */
  readonly scale?: number;
  readonly opacity?: number;
};

const back = (t: number) => {
  const c1 = 1.70158;
  const x = Math.max(0, Math.min(1, t));
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const CellBlob: React.FC<CellBlobProps> = ({
  cx,
  cy,
  rx,
  ry,
  rot = 0,
  seed,
  paint,
  line = W2.cellLine,
  plastids = 6,
  plastidColor = W2.cellDeep,
  glow = 0,
  glowColor = "#FFFFFF",
  pop = 1,
  scale = 1,
  opacity = 1,
}) => {
  if (pop <= 0 || opacity <= 0) return null;
  const s = back(pop) * scale;
  const d = blobPath(0, 0, rx, ry, seed, rot);
  const r = rng(seed * 31 + 7);
  const m = Math.min(rx, ry);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={Math.min(1, pop * 2) * opacity}>
      <path d={d} fill="#000" opacity={0.22} transform="translate(4 7)" />
      <path d={d} fill={paint} />
      {Array.from({ length: plastids }, (_, i) => {
        const a = (i / plastids) * Math.PI * 2 + r() * 0.5;
        const px = Math.cos(a) * rx * 0.66;
        const py = Math.sin(a) * ry * 0.66;
        const deg = (a * 180) / Math.PI + 90;
        const pr = m * (0.17 + r() * 0.04);
        return (
          <g key={i} transform={`translate(${px} ${py}) rotate(${deg})`}>
            <ellipse rx={pr} ry={pr * 0.6} fill={plastidColor} stroke={line} strokeOpacity={0.55} strokeWidth={1.6} />
            <path d={`M${-pr * 0.5},0 L${pr * 0.5},0`} stroke={mix(plastidColor, "#FFFFFF", 0.45)} strokeOpacity={0.65} strokeWidth={1.4} strokeLinecap="round" />
          </g>
        );
      })}
      <ellipse cx={-rx * 0.38} cy={-ry * 0.46} rx={rx * 0.26} ry={ry * 0.13} fill="#FFFFFF" opacity={0.42} transform={`rotate(-24 ${-rx * 0.38} ${-ry * 0.46})`} />
      {glow > 0 ? <path d={d} fill="none" stroke={glowColor} strokeOpacity={0.85 * glow} strokeWidth={9} /> : null}
      <path d={d} fill="none" stroke={line} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

/** A flat rounded "pill" cell (epidermis): clear, glassy, with a rim light on the upper edge. */
export const PillCell: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly paint: string;
  readonly line?: string;
  readonly opacity?: number;
}> = ({ x, y, w, h, paint, line = W2.cellLine, opacity = 1 }) => {
  if (w <= 4) return null;
  const r = Math.min(h / 2, w / 2, 30);
  return (
    <g opacity={opacity}>
      <rect x={x + 3} y={y + 6} width={w} height={h} rx={r} fill="#000" opacity={0.2} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={paint} />
      <path d={`M${x + r},${y + 7} H${x + w - r}`} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={line} strokeWidth={4} />
    </g>
  );
};
