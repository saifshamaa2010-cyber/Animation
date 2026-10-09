import React from "react";
import { interpolate } from "remotion";
import { C } from "../brand/tokens";
import { FONT } from "../brand/fonts";

export type MythCardProps = {
  readonly x: number; // centre
  readonly y: number; // centre
  readonly number: number;
  readonly before: string; // text before the key word
  readonly word: string; // the word that gets struck through
  readonly after?: string;
  readonly replacement?: string; // what the word becomes
  /** 0..1 card arrival */
  readonly enter: number;
  /** 0..1 strike-through */
  readonly strike: number;
  /** 0..1 replacement word appears */
  readonly replace?: number;
  readonly width?: number;
};

const c = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * "Myth #n" card. The wrong word is struck out and replaced, so the
 * correction itself is what's on screen (no paragraph of text).
 */
export const MythCard: React.FC<MythCardProps> = ({
  x,
  y,
  number,
  before,
  word,
  after = "",
  replacement,
  enter,
  strike,
  replace = 0,
  width = 1180,
}) => {
  if (enter <= 0) return null;
  const h = 300;
  const fs = 76;
  // Rough text metrics for Lexend 600 at this size (avg ~0.56em per char).
  const em = fs * 0.56;
  const wBefore = before.length * em;
  const wWord = word.length * em;
  const total = wBefore + wWord + after.length * em;
  const startX = x - total / 2;
  const wordX = startX + wBefore;
  const ty = y + 52;
  const strikeW = interpolate(strike, [0, 1], [0, wWord + 20], c);
  return (
    <g opacity={enter} transform={`translate(0 ${(1 - enter) * 40})`}>
      <rect x={x - width / 2} y={y - h / 2} width={width} height={h} rx={36} fill={C.ink800} stroke={C.ink600} strokeWidth={3} />
      <rect x={x - width / 2} y={y - h / 2} width={width} height={h} rx={36} fill="none" stroke={C.paper} strokeOpacity={0.06} strokeWidth={14} />
      {/* tag */}
      <g transform={`translate(${x - width / 2 + 56} ${y - h / 2 + 46})`}>
        <rect x={0} y={0} width={250} height={64} rx={32} fill={C.coral} />
        <text x={125} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill={C.ink900} letterSpacing={3}>
          {`MYTH #${number}`}
        </text>
      </g>
      <text x={startX} y={ty} fontFamily={FONT} fontWeight={600} fontSize={fs} fill={C.paper} xmlSpace="preserve">
        <tspan>{before}</tspan>
        <tspan fill={strike > 0.98 ? C.ink400 : C.paper}>{word}</tspan>
        <tspan>{after}</tspan>
      </text>
      {strike > 0 ? (
        <line x1={wordX - 10} x2={wordX - 10 + strikeW} y1={ty - fs * 0.32} y2={ty - fs * 0.32} stroke={C.coral} strokeWidth={9} strokeLinecap="round" />
      ) : null}
      {replacement && replace > 0 ? (
        <text
          x={wordX + wWord / 2}
          y={ty - fs - 18 + (1 - replace) * 18}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={700}
          fontSize={fs * 0.82}
          fill={C.teal}
          opacity={replace}
        >
          {replacement}
        </text>
      ) : null}
    </g>
  );
};
