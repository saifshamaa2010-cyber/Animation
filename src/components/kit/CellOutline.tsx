import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C } from "../../brand/tokens";
import { Pt, smoothClosedPath } from "../../lib/geometry";
import { useSvgId } from "../ids";
import { seg } from "./ink";

export type CellOutlineProps = {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry?: number;
  /** 0..1: membrane draws round, then the inside fills. */
  readonly progress: number;
  readonly seed?: number;
  /** Membrane colour. Default ink300 (quiet); paper to make it the subject. */
  readonly color?: string;
  /** Interior tint. */
  readonly fill?: string;
  /** How lumpy (0..0.1 of radius). Default 0.05. */
  readonly lumpiness?: number;
  /** px of slow membrane flow (membranes are fluid). Default 2; 0 = static. */
  readonly flow?: number;
  readonly opacity?: number;
};

/** A soft cell: organic outline with a double membrane line and a faint lit interior. */
export const CellOutline: React.FC<CellOutlineProps> = ({
  cx,
  cy,
  rx,
  ry = rx,
  progress,
  seed = 5,
  color = C.ink300,
  fill = C.ink700,
  lumpiness = 0.05,
  flow = 2,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const id = useSvgId("cell");
  if (progress <= 0 || opacity <= 0) return null;
  const n = 64;
  const shape = (inset: number): Pt[] =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const lump = noise2D(`cell-${seed}`, Math.cos(a) * 0.6, Math.sin(a) * 0.6) * lumpiness;
      const f = flow > 0 ? noise2D(`flow-${seed}`, Math.cos(a) * 1.3 + frame * 0.006, Math.sin(a) * 1.3) * flow : 0;
      const k = 1 + lump;
      return [cx + Math.cos(a) * (rx * k + f - inset), cy + Math.sin(a) * (ry * k + f - inset)] as Pt;
    });
  const outer = smoothClosedPath(shape(0), 0.9);
  const inner = smoothClosedPath(shape(11), 0.9);
  const band = smoothClosedPath(shape(5.5), 0.9);
  const draw = seg(progress, 0, 0.75);
  const inside = seg(progress, 0.45, 1);
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={`${id}-in`} cx="0.42" cy="0.36" r="0.7">
          <stop offset="0" stopColor={fill} stopOpacity={0.55} />
          <stop offset="0.75" stopColor={fill} stopOpacity={0.25} />
          <stop offset="1" stopColor={fill} stopOpacity={0.05} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.5} />
          <stop offset="0.5" stopColor={C.paper} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={outer} fill={`url(#${id}-in)`} opacity={inside} />
      {/* The band between the two lines: the membrane itself. */}
      <path d={band} fill="none" stroke={color} strokeOpacity={0.12 * inside} strokeWidth={11} />
      {draw > 0 ? (
        <path d={outer} fill="none" stroke={color} strokeOpacity={0.85} strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} />
      ) : null}
      {seg(progress, 0.1, 0.85) > 0 ? (
        <path d={inner} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={2.5} strokeLinecap="round" pathLength={1} strokeDasharray={`${seg(progress, 0.1, 0.85)} 1`} />
      ) : null}
      {/* Rim light on the upper edge, like every other object in the world. */}
      <path d={outer} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={3.5} opacity={inside} />
    </g>
  );
};
