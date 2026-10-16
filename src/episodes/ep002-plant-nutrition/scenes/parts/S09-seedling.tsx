/**
 * S09: a dicot seedling — "a plant whose seeds have two seed leaves". The stem rises out of the soil with
 * its two seed leaves (cotyledons) still folded together, as they come out of the seed, then they open out,
 * one each side. Small and simple: it is only a gloss for the word "dicotyledonous".
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { SoilBlock } from "../../../../components/bio";
import { LitShape, mix } from "../../../../components/kit";
import { Pt, smoothClosedPath, smoothOpenPath } from "../../../../lib/geometry";

const STEM = 92;
const LEN = 62;
const THICK = 34;

/** The seed leaves' axes: folded upright together (open 0) → spread out, a little above horizontal (open 1). */
const axis = (side: -1 | 1, open: number): Pt => {
  const a = ((8 + 64 * EASE.out(Math.min(1, Math.max(0, open)))) * Math.PI) / 180;
  return [side * Math.sin(a), -Math.cos(a)];
};

const stemTop = (x: number, y: number, s: number, grow: number): Pt => {
  const h = STEM * s * (0.15 + 0.85 * EASE.out(Math.min(1, Math.max(0, grow))));
  return [x + 2 * s, y - h];
};

/** Middle of each seed leaf (screen), for leader lines. */
export const seedLeafCentres = (x: number, y: number, s: number, grow: number, open: number): [Pt, Pt] => {
  const A = stemTop(x, y, s, grow);
  return ([-1, 1] as const).map((side) => {
    const [ux, uy] = axis(side, open);
    const d = (LEN * 0.55 + 2) * s;
    return [A[0] + ux * d, A[1] + uy * d] as Pt;
  }) as [Pt, Pt];
};

export const Seedling: React.FC<{
  /** soil surface, centre */
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  /** 0..1 the stem rises out of the soil */
  readonly grow: number;
  /** 0..1 the two seed leaves open out */
  readonly open: number;
  /** 0..1 both seed leaves light up ("two seed leaves") */
  readonly glow?: number;
  readonly opacity?: number;
}> = ({ x, y, scale: s = 1, grow, open, glow = 0, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const A = stemTop(x, y, s, grow);
  const stem: Pt[] = [
    [x, y + 4 * s],
    [x + 4 * s, y - (y - A[1]) * 0.45],
    [A[0], A[1] + 6 * s],
  ];
  const seedLeaf = (side: -1 | 1) => {
    const [ux, uy] = axis(side, open);
    const [nx, ny] = [-uy, ux];
    const c: Pt = [A[0] + ux * (LEN / 2 + 2) * s, A[1] + uy * (LEN / 2 + 2) * s];
    // a thick, rounded oval, a little fuller towards its outer end
    const pts: Pt[] = Array.from({ length: 16 }, (_, i) => {
      const t = (i / 16) * Math.PI * 2;
      const u = (Math.cos(t) * LEN * s) / 2;
      const v = ((Math.sin(t) * THICK * s) / 2) * (1 + 0.14 * Math.cos(t));
      return [c[0] + ux * u + nx * v, c[1] + uy * u + ny * v];
    });
    return { d: smoothClosedPath(pts, 0.5), c };
  };
  const leaves = ([-1, 1] as const).map(seedLeaf);
  return (
    <g opacity={opacity}>
      <ellipse cx={x} cy={y + 30 * s} rx={92 * s} ry={10 * s} fill={C.ink950} opacity={0.45} />
      <path d={smoothOpenPath(stem)} fill="none" stroke={C.stem} strokeWidth={9 * s} strokeLinecap="round" />
      <path d={smoothOpenPath(stem)} fill="none" stroke={C.leafLight} strokeOpacity={0.35} strokeWidth={3 * s} strokeLinecap="round" transform={`translate(${-2 * s} 0)`} />
      {leaves.map((l, i) => (
        <g key={i}>
          {glow > 0 ? <ellipse cx={l.c[0]} cy={l.c[1]} rx={LEN * 0.62 * s} ry={THICK * 0.8 * s} fill={C.leafLight} opacity={0.35 * glow} /> : null}
          <LitShape d={l.d} top={mix(C.leaf, C.leafLight, 0.25 * glow)} bottom={C.leafDeep} rimWidth={5} rimOpacity={0.6} shadow={0.3} shadowDy={6} shadowBlur={6} />
        </g>
      ))}
      <SoilBlock x={x - 85 * s} y={y} w={170 * s} h={34 * s} seed={12} />
    </g>
  );
};
