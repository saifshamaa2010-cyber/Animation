import React from "react";
import { C, EASE } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { textWidth } from "./kit/text";

/**
 * Where-are-we tag for long episodes: "3 · Mineral ions", top-left inside the safe area.
 * Arrives with the section, then settles to a quiet 55 % so it never competes with the diagram.
 * `extended` adds a badge for Supplement (Extended-paper) content: `true`, or a 0..1 progress to bring the
 * badge in (and out) on a cue when only part of a scene is Extended.
 */
export const SectionTag: React.FC<{
  readonly n: number;
  readonly title: string;
  /** frames since the section started (negative = not yet) */
  readonly t: number;
  readonly extended?: boolean | number;
  readonly opacity?: number;
}> = ({ n, title, t, extended = false, opacity = 1 }) => {
  if (t < 0 || opacity <= 0) return null;
  const inP = EASE.out(Math.min(1, t / 16));
  const settle = 1 - 0.45 * EASE.inOut(Math.max(0, Math.min(1, (t - 90) / 30)));
  const x = 100;
  const y = 100;
  const size = 44;
  const numW = 64;
  const tw = textWidth(title, size, 600);
  const badgeW = textWidth("EXTENDED", 40, 700) + 36;
  const ex = extended === true ? 1 : extended === false ? 0 : Math.max(0, Math.min(1, extended));
  return (
    <g opacity={inP * settle * opacity} transform={`translate(${(1 - inP) * -24} 0)`}>
      <rect x={x} y={y} width={numW} height={64} rx={16} fill={C.paper} />
      <text x={x + numW / 2} y={y + 47} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill={C.ink900}>
        {n}
      </text>
      <text x={x + numW + 22} y={y + 48} fontFamily={FONT} fontWeight={600} fontSize={size} fill={C.paper} letterSpacing={-0.5}>
        {title}
      </text>
      {ex > 0 ? (
        <g opacity={ex} transform={`translate(${(1 - EASE.out(ex)) * -16} 0)`}>
          <rect x={x + numW + 44 + tw} y={y + 4} width={badgeW} height={56} rx={14} fill="none" stroke={C.violetLight} strokeWidth={3} />
          <text x={x + numW + 44 + tw + badgeW / 2} y={y + 46} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.violetLight} letterSpacing={1}>
            EXTENDED
          </text>
        </g>
      ) : null}
    </g>
  );
};
