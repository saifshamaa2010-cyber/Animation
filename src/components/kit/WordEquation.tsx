import React from "react";
import { C, EASE } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { HandArrow } from "./hand";
import { seg } from "./ink";
import { Formula } from "./Molecules";
import { formulaWidth, isFormula, textWidth } from "./text";

export type WordEquationProps = {
  /** Centre of the whole equation. */
  readonly x: number;
  /** Centre line (the arrow's height). */
  readonly y: number;
  /** e.g. "starch". */
  readonly left: string;
  /** e.g. "maltose". */
  readonly right: string;
  /** Written above the arrow, e.g. "amylase". */
  readonly over?: string;
  /** Written under the arrow (rarely needed). */
  readonly under?: string;
  /** 0..1: left word → arrow draws → enzyme name is written → right word. */
  readonly progress: number;
  readonly size?: number;
  readonly leftColor?: string;
  readonly rightColor?: string;
  readonly overColor?: string;
  readonly arrowColor?: string;
  readonly arrowLength?: number;
  readonly seed?: number;
  readonly opacity?: number;
};

/** A GCSE-style word equation: "starch —amylase→ maltose", built up in reading order. */
export const WordEquation: React.FC<WordEquationProps> = ({
  x,
  y,
  left,
  right,
  over,
  under,
  progress,
  size = 64,
  leftColor = C.cream,
  rightColor = C.amber,
  overColor = C.teal,
  arrowColor = C.paper,
  arrowLength,
  seed = 3,
  opacity = 1,
}) => {
  const id = useSvgId("weq");
  if (progress <= 0 || opacity <= 0) return null;
  const overSize = Math.max(40, size * 0.72);
  const width = (t: string) => (isFormula(t) ? formulaWidth(t, size) : textWidth(t, size, 600));
  const wl = width(left);
  const wr = width(right);
  const wo = over ? textWidth(over, overSize, 600) : 0;
  const wu = under ? textWidth(under, overSize, 500) : 0;
  const arrow = arrowLength ?? Math.max(220, Math.max(wo, wu) + 80);
  const gap = size * 0.45;
  const total = wl + gap + arrow + gap + wr;
  const x0 = x - total / 2;
  const ax0 = x0 + wl + gap;
  const ax1 = ax0 + arrow;
  const base = y + size * 0.35;

  const pL = EASE.out(seg(progress, 0, 0.22));
  const pA = seg(progress, 0.18, 0.55);
  const pO = seg(progress, 0.45, 0.78);
  const pR = EASE.out(seg(progress, 0.72, 1));
  // "Written" reveal: a soft-edged wipe left → right across the word.
  const ox0 = (ax0 + ax1) / 2 - wo / 2;
  const wipe = ox0 - 30 + (wo + 60) * pO;
  const ux0 = (ax0 + ax1) / 2 - wu / 2;
  const uwipe = ux0 - 30 + (wu + 60) * pO;

  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-w`} gradientUnits="userSpaceOnUse" x1={wipe - 30} y1="0" x2={wipe} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={ox0 - 80} y={y - size * 2} width={wo + 160} height={size * 2}>
          <rect x={ox0 - 80} y={y - size * 2} width={wo + 160} height={size * 2} fill={`url(#${id}-w)`} />
        </mask>
        <linearGradient id={`${id}-wu`} gradientUnits="userSpaceOnUse" x1={uwipe - 30} y1="0" x2={uwipe} y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-mu`} maskUnits="userSpaceOnUse" x={ux0 - 80} y={y} width={wu + 160} height={size * 2}>
          <rect x={ux0 - 80} y={y} width={wu + 160} height={size * 2} fill={`url(#${id}-wu)`} />
        </mask>
      </defs>
      <g opacity={pL} transform={`translate(${(1 - pL) * -14} 0)`}>
        <Term text={left} x={x0 + wl} y={base} size={size} color={leftColor} anchor="end" />
      </g>
      <HandArrow from={[ax0 + 6, y + 2]} to={[ax1 - 4, y]} bend={-0.025} progress={pA} color={arrowColor} width={6} seed={seed} head={24} />
      {over ? (
        <text
          x={(ax0 + ax1) / 2}
          y={y - size * 0.42}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={600}
          fontSize={overSize}
          fill={overColor}
          mask={`url(#${id}-m)`}
        >
          {over}
        </text>
      ) : null}
      {under ? (
        <text
          x={(ax0 + ax1) / 2}
          y={y + overSize * 1.15}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={500}
          fontSize={overSize}
          fill={C.ink300}
          mask={`url(#${id}-mu)`}
        >
          {under}
        </text>
      ) : null}
      <g opacity={pR} transform={`translate(${(1 - pR) * 14} 0)`}>
        <Term text={right} x={ax1 + gap} y={base} size={size} color={rightColor} anchor="start" />
      </g>
    </g>
  );
};

/** A word, or a chemical formula with proper subscripts. */
const Term: React.FC<{ text: string; x: number; y: number; size: number; color: string; anchor: "start" | "end" }> = ({
  text,
  x,
  y,
  size,
  color,
  anchor,
}) =>
  isFormula(text) ? (
    <Formula text={text} x={x} y={y} size={size} color={color} anchor={anchor} />
  ) : (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={600} fontSize={size} fill={color}>
      {text}
    </text>
  );
