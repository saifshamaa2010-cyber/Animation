/**
 * A see-saw drawn in the notebook-doodle style (ink outline drawn on, then coloured in with felt tips):
 * a triangular fulcrum with a small face and a wooden plank that tilts. Made for "does it balance?"
 * moments (balancing an equation, comparing two amounts). Whatever is passed as `children` sits ON the
 * plank and tilts with it: children are drawn in the plank's frame, origin at the pivot, the plank's top
 * surface at y = −thick. `seeSawToPage` maps a plank-frame point to the page (to fly things onto it).
 * Tilt in degrees: + = left end down. SVG in 1920×1080 coordinates, driven by props only. Reusable.
 */
import React from "react";
import { C, W2 } from "../../brand/tokens";
import { HandLayer, mix } from "../kit/shared";
import { seg } from "../kit/ink";
import { InkShape } from "./NotebookDoodles";

type Pt = readonly [number, number];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type SeeSawLayout = {
  /** the pivot: apex of the fulcrum = middle of the plank's underside */
  readonly cx: number;
  readonly cy: number;
  /** half the plank's length */
  readonly half: number;
  /** plank thickness (default 24) */
  readonly thick?: number;
  /** the floor the fulcrum stands on */
  readonly footY: number;
  /** width of the fulcrum's base (default 200) */
  readonly footW?: number;
};

/** Page position of a point given in the plank's frame (origin at the pivot), for a tilt in degrees. */
export const seeSawToPage = (L: SeeSawLayout, tilt: number, p: Pt): Pt => {
  const a = (-tilt * Math.PI) / 180;
  return [L.cx + p[0] * Math.cos(a) - p[1] * Math.sin(a), L.cy + p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};

const roundedTri = (cx: number, top: number, bottom: number, halfW: number, r = 14) => {
  // apex slightly rounded, base corners rounded
  const ax = cx;
  const ay = top;
  const lx = cx - halfW;
  const rx = cx + halfW;
  return `M${ax - 8},${ay + 10} Q${ax},${ay - 2} ${ax + 8},${ay + 10} L${rx - r * 0.4},${bottom - r} Q${rx},${bottom} ${rx - r * 1.4},${bottom} L${lx + r * 1.4},${bottom} Q${lx},${bottom} ${lx + r * 0.4},${bottom - r} Z`;
};

export const SeeSaw: React.FC<{
  readonly layout: SeeSawLayout;
  readonly tilt?: number;
  /** 0..1 ink: fulcrum, then plank */
  readonly draw: number;
  /** 0..1 felt-tip colour */
  readonly fill?: number;
  /** 0..1 the fulcrum's face (0 = none) */
  readonly face?: number;
  /** 0 worried … 1 happy */
  readonly mood?: number;
  /** pupils −1 (left) … 1 (right) */
  readonly look?: number;
  readonly opacity?: number;
  readonly children?: React.ReactNode;
}> = ({ layout: L, tilt = 0, draw, fill = 1, face = 0, mood = 1, look = 0, opacity = 1, children }) => {
  if (draw <= 0 || opacity <= 0) return null;
  const thick = L.thick ?? 24;
  const footW = L.footW ?? 200;
  const tri = roundedTri(L.cx, L.cy, L.footY, footW / 2);
  const plank = `M${-L.half + 12},${-thick} H${L.half - 12} Q${L.half},${-thick} ${L.half},${-thick + 12} V-10 Q${L.half},0 ${L.half - 12},0 H${-L.half + 12} Q${-L.half},0 ${-L.half},-10 V${-thick + 12} Q${-L.half},${-thick} ${-L.half + 12},${-thick} Z`;
  // the face sits low in the triangle, where it is widest
  const fy = L.cy + (L.footY - L.cy) * 0.6;
  const m = clamp01(mood);
  const mouthY = fy + 22;
  const curve = (m - 0.5) * 2 * 9; // + = smile
  const lx = clamp01((look + 1) / 2) * 2 - 1;
  return (
    <g opacity={opacity}>
      {/* soft contact shadow + a short floor line */}
      <ellipse cx={L.cx} cy={L.footY + 6} rx={footW * 0.62 * seg(draw, 0, 0.3)} ry={9} fill="#000000" opacity={0.1} />
      <HandLayer rough={0.8} seed={53}>
        <InkShape d={tri} draw={seg(draw, 0, 0.45)} fill={seg(fill, 0, 0.6)} color={W2.woodDeep} width={5} />
        <path
          d={`M${L.cx - footW * 0.7},${L.footY + 2} L${L.cx + footW * 0.7},${L.footY - 1}`}
          stroke={W2.inkText}
          strokeWidth={4}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${seg(draw, 0.1, 0.4)} 2`}
          fill="none"
        />
      </HandLayer>
      {face > 0 ? (
        <g opacity={clamp01(face)}>
          {[-17, 17].map((dx) => (
            <g key={dx}>
              <ellipse cx={L.cx + dx} cy={fy} rx={7.5} ry={9} fill="#FFFFFF" stroke={W2.inkText} strokeWidth={2.4} />
              <circle cx={L.cx + dx + lx * 3} cy={fy + 1.5 + Math.abs(lx) * 1.2} r={4} fill={W2.inkText} />
            </g>
          ))}
          <path d={`M${L.cx - 12},${mouthY - curve * 0.3} Q${L.cx},${mouthY + curve} ${L.cx + 12},${mouthY - curve * 0.3}`} fill="none" stroke={W2.inkText} strokeWidth={3} strokeLinecap="round" />
          <ellipse cx={L.cx - 30} cy={fy + 16} rx={6} ry={3.5} fill={W2.cheek} opacity={0.5 * m} />
          <ellipse cx={L.cx + 30} cy={fy + 16} rx={6} ry={3.5} fill={W2.cheek} opacity={0.5 * m} />
        </g>
      ) : null}
      <g transform={`translate(${L.cx} ${L.cy}) rotate(${-tilt})`}>
        <HandLayer rough={0.8} seed={54}>
          <InkShape d={plank} draw={seg(draw, 0.3, 1)} fill={seg(fill, 0.3, 1)} color={W2.wood} width={5} />
          {[0.3, 0.62].map((t, i) => (
            <path
              key={i}
              d={`M${-L.half * 0.8 + i * 90},${-thick * t} C${-L.half * 0.3},${-thick * t - 3} ${L.half * 0.2},${-thick * t + 3} ${L.half * 0.7 - i * 120},${-thick * t}`}
              fill="none"
              stroke={mix(W2.woodDeep, W2.woodDark, 0.4)}
              strokeOpacity={0.45 * seg(fill, 0.6, 1)}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}
          <circle cx={0} cy={-thick / 2} r={6} fill={C.ink600} opacity={seg(draw, 0.8, 1)} />
        </HandLayer>
        {children}
      </g>
    </g>
  );
};
