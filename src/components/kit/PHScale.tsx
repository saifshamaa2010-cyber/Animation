import React from "react";
import { C, EASE } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { seg } from "./ink";
import { mix } from "./shared";

export type PHScaleProps = {
  /** Left end of the bar (pH 0). */
  readonly x: number;
  /** Centre line of the bar. */
  readonly y: number;
  readonly width?: number;
  /** Bar thickness. */
  readonly height?: number;
  /** 0..1 draw-on: bar sweeps in from the acid end, then ticks and numbers. */
  readonly progress: number;
  /** pH the marker points at (animate it). Omit for no marker. */
  readonly marker?: number;
  /** Text above the marker. Default "pH {marker}" (rounded). */
  readonly markerLabel?: string;
  /** Marker colour (e.g. the enzyme's colour). Default paper. */
  readonly markerColor?: string;
  /** 0..1 marker visibility. */
  readonly markerProgress?: number;
  /** Which numbers to print under the ticks. */
  readonly numbers?: "all" | "key";
  /** "acidic · neutral · alkaline" captions under the bar. */
  readonly zones?: boolean;
  readonly opacity?: number;
};

export const PH_COLOURS = {
  acid: C.coral,
  neutral: C.paper,
  alkali: C.violet,
};

/** pH colour at a value 0..14 (for markers, graph fills…). */
export const phColour = (ph: number) => {
  const t = Math.max(0, Math.min(14, ph)) / 7;
  return t <= 1 ? mix(C.coral, C.paper, t) : mix(C.paper, C.violet, t - 1);
};

/** The 0–14 pH bar: acid coral → neutral paper → alkaline violet. */
export const PHScale: React.FC<PHScaleProps> = ({
  x,
  y,
  width = 1200,
  height = 26,
  progress,
  marker,
  markerLabel,
  markerColor = C.paper,
  markerProgress = 1,
  numbers = "key",
  zones = false,
  opacity = 1,
}) => {
  const id = useSvgId("ph");
  if (progress <= 0 || opacity <= 0) return null;
  const sweep = EASE.out(seg(progress, 0, 0.6));
  const ticksP = EASE.out(seg(progress, 0.35, 0.85));
  const numsP = EASE.out(seg(progress, 0.5, 1));
  const r = height / 2;
  const barW = Math.max(height * Math.min(1, sweep * 20), (width + height) * sweep);
  const at = (ph: number) => x + (ph / 14) * width;
  const numSize = 40;
  const shown = numbers === "all" ? Array.from({ length: 15 }, (_, i) => i) : [0, 7, 14];
  const mp = marker === undefined ? 0 : EASE.out(Math.max(0, Math.min(1, markerProgress))) * numsP;
  const mx = marker === undefined ? 0 : at(Math.max(0, Math.min(14, marker)));
  const label = markerLabel ?? (marker === undefined ? "" : `pH ${Math.round(marker * 10) / 10}`);
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={x} y1="0" x2={x + width} y2="0">
          <stop offset="0" stopColor={C.coral} />
          <stop offset="0.22" stopColor={mix(C.coral, C.paper, 0.45)} />
          <stop offset="0.5" stopColor={C.paper} />
          <stop offset="0.78" stopColor={mix(C.paper, C.violet, 0.55)} />
          <stop offset="1" stopColor={C.violet} />
        </linearGradient>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.45} />
          <stop offset="0.35" stopColor={C.paper} stopOpacity={0} />
          <stop offset="0.7" stopColor={C.ink950} stopOpacity={0} />
          <stop offset="1" stopColor={C.ink950} stopOpacity={0.3} />
        </linearGradient>
        <filter id={`${id}-s`} x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      {/* The bar grows from the acid end with a rounded leading edge; the colours stay put. */}
      <rect x={x - r} y={y - r + 8} width={barW} height={height} rx={r} fill={C.ink950} opacity={0.5} filter={`url(#${id}-s)`} />
      <rect x={x - r} y={y - r} width={barW} height={height} rx={r} fill={`url(#${id}-g)`} />
      <rect x={x - r} y={y - r} width={barW} height={height} rx={r} fill={`url(#${id}-shade)`} />
      {/* Ticks under the bar, one per pH unit; 7 is longer (neutral). */}
      <g opacity={ticksP}>
        {Array.from({ length: 15 }, (_, i) => (
          <line
            key={i}
            x1={at(i)}
            y1={y + r + 8}
            x2={at(i)}
            y2={y + r + 8 + (i % 7 === 0 ? 18 : 10) * ticksP}
            stroke={C.paperDim}
            strokeOpacity={i % 7 === 0 ? 0.9 : 0.5}
            strokeWidth={i % 7 === 0 ? 3.5 : 2.5}
            strokeLinecap="round"
          />
        ))}
      </g>
      <g opacity={numsP}>
        {shown.map((i) => (
          <text key={i} x={at(i)} y={y + r + 36 + numSize * 0.72} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={numSize} fill={C.paperDim}>
            {i}
          </text>
        ))}
        {zones
          ? (
              [
                [2.5, "acidic", C.coral],
                [7, "neutral", C.paper],
                [11.5, "alkaline", C.violetLight],
              ] as const
            ).map(([ph, t, col]) => (
              <text key={t} x={at(ph)} y={y + r + 36 + numSize * 0.72 + 58} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={40} fill={col} opacity={0.85}>
                {t}
              </text>
            ))
          : null}
      </g>
      {marker !== undefined && mp > 0 ? (
        <g opacity={mp} transform={`translate(${mx} ${y - r - 14 - (1 - mp) * 16})`}>
          {/* Pointer: a rounded drop pointing at the bar. */}
          <path d="M0,0 C-6,-8 -16,-16 -16,-28 A16,16 0 1 1 16,-28 C16,-16 6,-8 0,0 Z" fill={C.ink950} opacity={0.4} transform="translate(0 5)" />
          <path d="M0,0 C-6,-8 -16,-16 -16,-28 A16,16 0 1 1 16,-28 C16,-16 6,-8 0,0 Z" fill={markerColor} />
          <circle cx={0} cy={-28} r={6} fill={C.ink900} />
          <text x={0} y={-64} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={markerColor} stroke={C.ink900} strokeWidth={8} strokeOpacity={0.55} paintOrder="stroke">
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};
