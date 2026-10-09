import React from "react";
import { C, EASE } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { seg } from "./ink";

export type ScaleBarProps = {
  /** Centre of the bar. */
  readonly x: number;
  readonly y: number;
  /** Bar length in px (animate it to show the zoom). */
  readonly length: number;
  /** e.g. ["1 mm", "1 µm", "1 nm"]. */
  readonly labels: readonly string[];
  /** Fractional index into `labels`: 0 → first, 1.5 → halfway from 2nd to 3rd. */
  readonly step?: number;
  /** 0..1 draw-on: bar grows from its centre, then the label arrives. */
  readonly progress: number;
  readonly color?: string;
  readonly size?: number;
  readonly opacity?: number;
};

/** A scale bar whose label rolls from one unit to the next as you zoom. */
export const ScaleBar: React.FC<ScaleBarProps> = ({
  x,
  y,
  length,
  labels,
  step = 0,
  progress,
  color = C.paper,
  size = 44,
  opacity = 1,
}) => {
  const id = useSvgId("scale");
  if (progress <= 0 || opacity <= 0) return null;
  const grow = EASE.out(seg(progress, 0, 0.6));
  const tick = EASE.out(seg(progress, 0.25, 0.7));
  const txt = EASE.out(seg(progress, 0.45, 1));
  const half = (length / 2) * grow;
  const i = Math.max(0, Math.min(labels.length - 1, Math.floor(step)));
  const f = EASE.inOut(Math.max(0, Math.min(1, step - i)));
  const next = Math.min(labels.length - 1, i + 1);
  // Odometer-style: labels roll through a soft window and never overlap.
  const roll = size * 1.2;
  const base = y - 30;
  const th = 6;
  const tickH = 26 * tick;
  return (
    <g opacity={opacity}>
      {/* Bar with a soft dark halo so it reads over any background. */}
      <line x1={x - half} y1={y} x2={x + half} y2={y} stroke={C.ink950} strokeOpacity={0.45} strokeWidth={th + 6} strokeLinecap="round" />
      <line x1={x - half} y1={y} x2={x + half} y2={y} stroke={color} strokeWidth={th} strokeLinecap="round" />
      {tick > 0
        ? [-1, 1].map((sx) => (
            <line
              key={sx}
              x1={x + sx * half}
              y1={y - tickH / 2}
              x2={x + sx * half}
              y2={y + tickH / 2}
              stroke={color}
              strokeWidth={th - 1}
              strokeLinecap="round"
            />
          ))
        : null}
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="0" y1={base - size * 1.15} x2="0" y2={base + size * 0.45}>
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.22" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.78" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={x - 600} y={base - size * 1.15} width={1200} height={size * 1.6}>
          <rect x={x - 600} y={base - size * 1.15} width={1200} height={size * 1.6} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <g opacity={txt} transform={`translate(0 ${(1 - txt) * 10})`} mask={`url(#${id}-m)`}>
        {[
          { t: labels[i], dy: -f * roll, o: 1 - f * 0.5 },
          ...(next !== i ? [{ t: labels[next], dy: (1 - f) * roll, o: 0.5 + f * 0.5 }] : []),
        ].map((l, k) =>
          l.o > 0.01 ? (
            <text
              key={k}
              x={x}
              y={base + l.dy}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={600}
              fontSize={size}
              fill={color}
              opacity={l.o}
              stroke={C.ink900}
              strokeWidth={8}
              strokeOpacity={0.5}
              paintOrder="stroke"
            >
              {l.t}
            </text>
          ) : null,
        )}
      </g>
    </g>
  );
};
