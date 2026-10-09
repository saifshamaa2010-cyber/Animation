import React from "react";
import { interpolate } from "remotion";
import { C, FONT_SIZES } from "../brand/tokens";
import { FONT } from "../brand/fonts";

export type LabelProps = {
  /** The thing being labelled. */
  readonly anchor: readonly [number, number];
  /** Where the text sits. */
  readonly at: readonly [number, number];
  readonly text: string;
  readonly sub?: string;
  /** 0..1 — line draws, then text appears. 0 = hidden. */
  readonly progress: number;
  readonly align?: "start" | "middle" | "end";
  readonly color?: string;
  readonly size?: number;
  /** Fade the whole label out (1 = fully visible). */
  readonly opacity?: number;
};

const c = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** A leader-line label. Lines draw on, then the words arrive — never a wall of text. */
export const Label: React.FC<LabelProps> = ({
  anchor,
  at,
  text,
  sub,
  progress,
  align = "start",
  color = C.paper,
  size = FONT_SIZES.label,
  opacity = 1,
}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const line = interpolate(progress, [0, 0.55], [0, 1], c);
  const dot = interpolate(progress, [0, 0.2], [0, 1], c);
  const txt = interpolate(progress, [0.35, 1], [0, 1], c);
  const [ax, ay] = anchor;
  const [tx, ty] = at;
  const lx = ax + (tx - ax) * line;
  const ly = ay + (ty - ay) * line;
  const gap = 14;
  const textX = align === "start" ? tx + gap : align === "end" ? tx - gap : tx;
  const hasLine = Math.hypot(tx - ax, ty - ay) > 2;
  return (
    <g opacity={opacity}>
      {hasLine ? (
        <>
          <circle cx={ax} cy={ay} r={7 * dot} fill={color} />
          <circle cx={ax} cy={ay} r={14 * dot} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={2} />
          <line x1={ax} y1={ay} x2={lx} y2={ly} stroke={color} strokeWidth={3} strokeLinecap="round" />
        </>
      ) : null}
      <g opacity={txt} transform={`translate(${(1 - txt) * (align === "end" ? 12 : align === "start" ? -12 : 0)} 0)`}>
        <text
          x={textX}
          y={ty + size * 0.34}
          textAnchor={align}
          fontFamily={FONT}
          fontWeight={600}
          fontSize={size}
          fill={color}
          stroke={C.ink900}
          strokeWidth={8}
          strokeOpacity={0.6}
          paintOrder="stroke"
          letterSpacing={-0.5}
        >
          {text}
        </text>
        {sub ? (
          <text
            x={textX}
            y={ty + size * 0.34 + Math.max(size * 0.95, 46)}
            textAnchor={align}
            fontFamily={FONT}
            fontWeight={400}
            fontSize={Math.max(40, size * 0.68)}
            fill={C.ink300}
            stroke={C.ink900}
            strokeWidth={6}
            strokeOpacity={0.6}
            paintOrder="stroke"
          >
            {sub}
          </text>
        ) : null}
      </g>
    </g>
  );
};

/** Plain on-screen caption/keyword (centred), for key terms only. */
export const Keyword: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly progress: number;
  readonly size?: number;
  readonly color?: string;
  readonly weight?: number;
  readonly align?: "start" | "middle" | "end";
}> = ({ x, y, text, progress, size = FONT_SIZES.title, color = C.paper, weight = 700, align = "middle" }) => {
  if (progress <= 0) return null;
  return (
    <text
      x={x}
      y={y + (1 - progress) * 16}
      textAnchor={align}
      fontFamily={FONT}
      fontWeight={weight}
      fontSize={size}
      fill={color}
      opacity={progress}
      letterSpacing={-1}
    >
      {text}
    </text>
  );
};
