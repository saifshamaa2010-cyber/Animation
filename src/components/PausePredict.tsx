import React from "react";
import { C, H, W } from "../brand/tokens";
import { FONT } from "../brand/fonts";

export type PausePredictProps = {
  /** 0..1 overlay in/out */
  readonly visible: number;
  /** 0..1 countdown ring */
  readonly countdown: number;
  readonly question: string;
};

/** The "pause and predict" moment: dims the scene, shows a pause glyph with a countdown ring. */
export const PausePredict: React.FC<PausePredictProps> = ({ visible, countdown, question }) => {
  if (visible <= 0) return null;
  const cx = W / 2;
  const cy = H / 2 - 70;
  const r = 118;
  const circ = 2 * Math.PI * r;
  return (
    <g opacity={visible}>
      <rect x={0} y={0} width={W} height={H} fill={C.ink950} opacity={0.78} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.ink600} strokeWidth={12} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={C.amber}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${circ * (1 - countdown)} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <rect x={cx - 38} y={cy - 48} width={26} height={96} rx={10} fill={C.paper} />
      <rect x={cx + 12} y={cy - 48} width={26} height={96} rx={10} fill={C.paper} />
      <text x={cx} y={cy + r + 120} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={84} fill={C.paper} letterSpacing={-1}>
        Pause & predict
      </text>
      <text x={cx} y={cy + r + 196} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={46} fill={C.ink300}>
        {question}
      </text>
    </g>
  );
};
