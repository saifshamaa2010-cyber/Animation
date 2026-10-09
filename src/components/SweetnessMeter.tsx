import React from "react";
import { C } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { useSvgId } from "./ids";

/**
 * The episode's running "how sweet does it taste?" gauge. Amber = sweet everywhere in EP001,
 * so the bar shares the maltose glow. Screen-space SVG.
 */
export const SweetnessMeter: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly value: number; // 0..1
  readonly opacity?: number;
  readonly width?: number;
  readonly label?: string;
}> = ({ x, y, value, opacity = 1, width = 420, label = "sweetness" }) => {
  const id = useSvgId("sweet");
  if (opacity <= 0) return null;
  const v = Math.max(0, Math.min(1, value));
  const h = 24;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="1">
          <stop offset="0" stopColor={C.amberDeep} />
          <stop offset="1" stopColor={C.amberLight} />
        </linearGradient>
        <filter id={`${id}-b`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <text x={0} y={-22} fontFamily={FONT} fontWeight={500} fontSize={36} fill={C.ink300}>
        {label}
      </text>
      <rect x={0} y={0} width={width} height={h} rx={h / 2} fill={C.ink700} />
      {v > 0.005 ? (
        <>
          <rect x={0} y={0} width={Math.max(h, width * v)} height={h} rx={h / 2} fill={C.amber} opacity={0.6 * v} filter={`url(#${id}-b)`} />
          <rect x={0} y={0} width={Math.max(h, width * v)} height={h} rx={h / 2} fill={`url(#${id}-g)`} />
          <rect x={6} y={4} width={Math.max(0, width * v - 12)} height={5} rx={2.5} fill="#FFFFFF" opacity={0.35} />
        </>
      ) : null}
    </g>
  );
};
