/**
 * A rubber-stamp impression on paper ("BALANCED ✓", "CORRECT", "LEARN THIS"…): a double rounded
 * border, a word in capitals and an optional tick, in slightly patchy stamp ink. `progress` slams it
 * down (it drops from above, lands, and the ink settles). Centre (x, y). SVG, driven by props only.
 */
import React from "react";
import { C } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { textWidth } from "../kit/text";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Width of an InkStamp (to place things beside it). */
export const inkStampWidth = (text: string, size = 48, tick = true) => textWidth(text, size, 700, size * 0.08) + size * (tick ? 2.6 : 1.4);

export const InkStamp: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly progress: number;
  readonly size?: number;
  readonly color?: string;
  readonly rotate?: number;
  readonly tick?: boolean;
  readonly seed?: number;
  readonly opacity?: number;
}> = ({ x, y, text, progress, size = 48, color = C.leafDeep, rotate = -6, tick = true, seed = 5, opacity = 1 }) => {
  const id = useSvgId("stamp");
  if (progress <= 0 || opacity <= 0) return null;
  const p = clamp01(progress);
  // 0..0.35 falling (big, faint), 0.35 lands, then the ink settles
  const fall = clamp01(p / 0.35);
  const s = 1 + 0.5 * (1 - fall * fall);
  const ink = p < 0.35 ? 0.25 * fall : 0.75 + 0.25 * clamp01((p - 0.35) / 0.65);
  const w = inkStampWidth(text, size, tick);
  const h = size * 1.7;
  const ls = size * 0.08;
  const tw = textWidth(text, size, 700, ls);
  const textX = -w / 2 + size * 0.7;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <defs>
        {/* patchy stamp ink: knock small holes out of the impression */}
        <filter id={`${id}-f`} x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={seed} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}-f)`} opacity={ink}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={size * 0.34} fill="none" stroke={color} strokeWidth={size * 0.12} />
        <rect x={-w / 2 + size * 0.17} y={-h / 2 + size * 0.17} width={w - size * 0.34} height={h - size * 0.34} rx={size * 0.22} fill="none" stroke={color} strokeWidth={size * 0.05} />
        <text x={textX} y={size * 0.36} fontFamily={FONT} fontWeight={700} fontSize={size} letterSpacing={ls} fill={color}>
          {text}
        </text>
        {tick ? (
          <path
            d={`M${textX + tw + size * 0.32},${size * 0.02} L${textX + tw + size * 0.62},${size * 0.32} L${textX + tw + size * 1.18},${-size * 0.36}`}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </g>
    </g>
  );
};
