/**
 * S17 helpers: the two-rate comparison (photosynthesis takes CO2 in, respiration gives it out — the
 * difference is the NET exchange that the indicator shows), a "few hours later" clock, and the myth
 * sentence drawn with real Lexend metrics (see the workaround note on MythLine).
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { LitShape, mix, textWidth } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { useSvgId } from "../../../../components/ids";

// ------------------------------------------------------------------ rate bars
/** Left column, clear of the lamp (x ≥ 650) and of the colour key (y ≥ 790). */
/** Photosynthesis label above its bar, respiration label below its bar, so the gap between the bars stays
 * clear for the dashed line that compares their lengths. */
export const BARS = { x: 130, w: 400, h: 46, psY: 338, rY: 420 } as const;

const Bar: React.FC<{ readonly x: number; readonly y: number; readonly len: number; readonly top: string; readonly bottom: string }> = ({ x, y, len, top, bottom }) => {
  if (len < 2) return null;
  const h = BARS.h;
  return <LitShape d={roundRectPath(x, y, len, h, Math.min(h / 2, len / 2))} top={top} bottom={bottom} rimOpacity={0.55} shadow={0.35} shadowDy={6} shadowBlur={8} />;
};

export const RateBars: React.FC<{
  /** bar lengths 0..1 (rate) */
  readonly ps: number;
  readonly r: number;
  /** labels + empty tracks appear */
  readonly psIn: number;
  readonly rIn: number;
  /** respiration keeps going: soft glow */
  readonly rGlow?: number;
  /** photosynthesis named / emphasised: soft glow */
  readonly psGlow?: number;
  /** the two ends line up: dashed line + "rates equal" */
  readonly equal?: number;
  /** the part of photosynthesis not cancelled by respiration = net uptake */
  readonly net?: number;
  readonly netPulse?: number;
  readonly opacity?: number;
}> = ({ ps, r, psIn, rIn, rGlow = 0, psGlow = 0, equal = 0, net = 0, netPulse = 0, opacity = 1 }) => {
  const id = useSvgId("rates");
  if (opacity <= 0 || (psIn <= 0 && rIn <= 0)) return null;
  const { x, w, h, psY, rY } = BARS;
  const xr = x + r * w;
  const xp = x + ps * w;
  const guide = Math.max(equal, net);
  const rows = [
    { y: psY, p: psIn, label: "photosynthesis", col: C.leaf, ty: psY - 18 },
    { y: rY, p: rIn, label: "respiration", col: C.coral, ty: rY + h + 50 },
  ];
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${id}-b`} x="-30%" y="-100%" width="160%" height="300%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {rows.map((row, i) =>
        row.p > 0 ? (
          <g key={i} opacity={Math.min(1, row.p * 1.4)}>
            <text
              x={x - 2}
              y={row.ty + (1 - EASE.out(Math.min(1, row.p))) * 10}
              fontFamily={FONT}
              fontWeight={600}
              fontSize={44}
              fill={row.col}
              letterSpacing={-0.5}
              stroke={C.ink900}
              strokeWidth={8}
              strokeOpacity={0.55}
              paintOrder="stroke"
            >
              {row.label}
            </text>
            <rect x={x} y={row.y} width={w} height={h} rx={h / 2} fill={C.ink800} opacity={0.75} stroke={C.ink600} strokeWidth={2} />
          </g>
        ) : null,
      )}
      {/* respiration: never stops (glow) */}
      {rGlow > 0 && r > 0.02 ? <rect x={x - 6} y={rY - 6} width={r * w + 12} height={h + 12} rx={h / 2 + 6} fill={C.coral} opacity={0.55 * rGlow} filter={`url(#${id}-b)`} /> : null}
      {psGlow > 0 && ps > 0.02 ? <rect x={x - 6} y={psY - 6} width={ps * w + 12} height={h + 12} rx={h / 2 + 6} fill={C.leaf} opacity={0.55 * psGlow} filter={`url(#${id}-b)`} /> : null}
      <Bar x={x} y={psY} len={ps * w} top={mix(C.leaf, C.paper, 0.18)} bottom={C.leafDeep} />
      <Bar x={x} y={rY} len={r * w} top={mix(C.coral, C.paper, 0.15)} bottom={C.coralDeep} />
      {/* net: the share of photosynthesis that respiration cancels steps back; the rest is the net uptake */}
      {net > 0 && ps > r ? (
        <g>
          <rect x={x} y={psY} width={xr - x} height={h} rx={Math.min(h / 2, (xr - x) / 2)} fill={C.ink900} opacity={0.5 * net} />
          <rect
            x={xr + 2}
            y={psY - 4}
            width={Math.max(0, xp - xr - 2)}
            height={h + 8}
            rx={(h + 8) / 2}
            fill="none"
            stroke={C.paper}
            strokeWidth={3 + 2 * netPulse}
            opacity={net}
          />
          <text x={(xr + xp) / 2} y={psY + h / 2 + 14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.ink900} opacity={net}>
            net
          </text>
        </g>
      ) : null}
      {guide > 0 && r > 0.02 ? (
        <line x1={xr} y1={rY - 6} x2={xr} y2={psY + h + 6} stroke={C.paper} strokeWidth={3} strokeDasharray="8 8" strokeLinecap="round" opacity={0.85 * guide} />
      ) : null}
      {equal > 0 ? (
        <text
          x={x - 2}
          y={rY + h + 124 + (1 - EASE.out(Math.min(1, equal))) * 10}
          fontFamily={FONT}
          fontWeight={700}
          fontSize={44}
          fill={C.paper}
          opacity={equal}
          letterSpacing={-0.5}
        >
          rates equal
        </text>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ "a few hours later"
export const HoursLater: React.FC<{ readonly x: number; readonly y: number; readonly p: number; readonly sweep: number; readonly opacity?: number }> = ({ x, y, p, sweep, opacity = 1 }) => {
  if (p <= 0 || opacity <= 0) return null;
  const cx = x + 30;
  const cy = y - 15;
  const R = 30;
  const hand = (deg: number, len: number, wdt: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return <line x1={cx} y1={cy} x2={cx + Math.cos(a) * len} y2={cy + Math.sin(a) * len} stroke={C.paper} strokeWidth={wdt} strokeLinecap="round" />;
  };
  // the minute hand goes round a few times while the hour hand moves on a few hours
  const s = EASE.inOut(Math.min(1, sweep));
  return (
    <g opacity={Math.min(1, p) * opacity} transform={`translate(${(1 - EASE.out(Math.min(1, p))) * -12} 0)`}>
      <circle cx={cx} cy={cy} r={R} fill={C.ink800} stroke={C.paper} strokeWidth={4} />
      {hand(60 + s * 90, 15, 5)}
      {hand(s * 360 * 3, 23, 3.5)}
      <circle cx={cx} cy={cy} r={4} fill={C.paper} />
      <text x={x + 78} y={y} fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paper} letterSpacing={-0.5}>
        a few hours later
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ the myth sentence
/**
 * Text layer for a `MythCard` (pass it empty text): MythCard estimates widths at 0.56 em per
 * character, which is ~13 % wider than Lexend really is, so its strike-through misses the word.
 * This draws the same sentence, strike and replacement with real metrics. Same enter motion as the card.
 */
export const MythLine: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly before: string;
  readonly word: string;
  readonly replacement: string;
  readonly enter: number;
  readonly strike: number;
  readonly replace: number;
  /** px the card rises while entering (MythCard uses 40; more if the card is scaled) */
  readonly shift?: number;
}> = ({ x, y, before, word, replacement, enter, strike, replace, shift = 40 }) => {
  if (enter <= 0) return null;
  const fs = 76;
  const wB = textWidth(before, fs, 600);
  const wW = textWidth(word, fs, 600);
  const startX = x - (wB + wW) / 2;
  const wordX = startX + wB;
  const ty = y + 52;
  return (
    <g opacity={enter} transform={`translate(0 ${(1 - enter) * shift})`}>
      <text x={startX} y={ty} fontFamily={FONT} fontWeight={600} fontSize={fs} fill={C.paper} xmlSpace="preserve">
        <tspan>{before}</tspan>
        <tspan fill={strike > 0.98 ? C.ink400 : C.paper}>{word}</tspan>
      </text>
      {strike > 0 ? (
        <line x1={wordX - 10} x2={wordX - 10 + (wW + 20) * strike} y1={ty - fs * 0.32} y2={ty - fs * 0.32} stroke={C.coral} strokeWidth={9} strokeLinecap="round" />
      ) : null}
      {replace > 0 ? (
        <text x={wordX + wW / 2} y={ty - fs - 18 + (1 - replace) * 18} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={fs * 0.82} fill={C.teal} opacity={replace}>
          {replacement}
        </text>
      ) : null}
    </g>
  );
};
