import React from "react";
import { C, EASE } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { LitShape, roundRectPath } from "./kit/shared";
import { textWidth } from "./kit/text";

/**
 * "Exam tip" card: the exact words that earn the mark (≤ 6 words), optionally with the wording
 * that loses it struck through underneath. Slides up from below its resting place.
 */
export const ExamTip: React.FC<{
  /** centre */
  readonly x: number;
  readonly y: number;
  readonly text: string;
  /** wrong wording, shown struck through (optional) */
  readonly not?: string;
  readonly progress: number;
  /** 0..1 strike-through of `not` */
  readonly strike?: number;
  readonly label?: string;
  readonly opacity?: number;
}> = ({ x, y, text, not, progress, strike = 1, label = "EXAM TIP", opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const p = EASE.out(Math.min(1, progress));
  const size = 50;
  const w = Math.max(textWidth(text, size, 700), not ? textWidth(not, 42, 500) : 0, textWidth(label, 30, 700) + 60) + 90;
  const h = not ? 210 : 150;
  const l = x - w / 2;
  const t = y - h / 2 + (1 - p) * 40;
  const nw = not ? textWidth(not, 42, 500) : 0;
  return (
    <g opacity={Math.min(1, progress * 2) * opacity}>
      <LitShape d={roundRectPath(l, t, w, h, 24)} top={C.ink700} bottom={C.ink800} rimOpacity={0.55} shadow={0.6} shadowDy={16} shadowBlur={18} />
      <rect x={l} y={t} width={10} height={h} rx={5} fill={C.amber} />
      <text x={l + 44} y={t + 46} fontFamily={FONT} fontWeight={700} fontSize={30} fill={C.amber} letterSpacing={2}>
        {label}
      </text>
      <text x={l + 44} y={t + 108} fontFamily={FONT} fontWeight={700} fontSize={size} fill={C.paper} letterSpacing={-0.5}>
        {text}
      </text>
      {not ? (
        <g>
          <text x={l + 44} y={t + 172} fontFamily={FONT} fontWeight={500} fontSize={42} fill={C.ink300}>
            {not}
          </text>
          <line x1={l + 38} y1={t + 158} x2={l + 38 + (nw + 12) * EASE.inOut(Math.min(1, strike))} y2={t + 156} stroke={C.coral} strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};
