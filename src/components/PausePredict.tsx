import React from "react";
import { C, H, W } from "../brand/tokens";
import { FONT } from "../brand/fonts";

export type PausePredictProps = {
  /** 0..1 overlay in/out */
  readonly visible: number;
  /** 0..1 countdown ring */
  readonly countdown: number;
  readonly question: string;
  /**
   * Compact mode: instead of dimming the whole frame, a small pause badge (ring + "Pause & predict")
   * sits at this point (the ring's centre; the words run to its right) and the scene stays fully
   * visible — use it when the viewer needs to look at the setup to make the prediction.
   * The question line is skipped when empty.
   */
  readonly badge?: { readonly x: number; readonly y: number };
};

const Ring: React.FC<{ cx: number; cy: number; r: number; w: number; countdown: number }> = ({ cx, cy, r, w, countdown }) => {
  const circ = 2 * Math.PI * r;
  const k = r / 118; // the pause glyph scales with the ring
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={C.ink900} fillOpacity={0.6} stroke={C.ink600} strokeWidth={w} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={C.amber}
        strokeWidth={w}
        strokeLinecap="round"
        strokeDasharray={`${circ * (1 - countdown)} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <rect x={cx - 38 * k} y={cy - 48 * k} width={26 * k} height={96 * k} rx={10 * k} fill={C.paper} />
      <rect x={cx + 12 * k} y={cy - 48 * k} width={26 * k} height={96 * k} rx={10 * k} fill={C.paper} />
    </g>
  );
};

/** The "pause and predict" moment: dims the scene, shows a pause glyph with a countdown ring. */
export const PausePredict: React.FC<PausePredictProps> = ({ visible, countdown, question, badge }) => {
  if (visible <= 0) return null;
  if (badge) {
    const r = 66;
    return (
      <g opacity={visible} transform={`translate(0 ${(1 - Math.min(1, visible)) * 16})`}>
        <Ring cx={badge.x} cy={badge.y} r={r} w={9} countdown={countdown} />
        <text x={badge.x + r + 34} y={badge.y + (question ? -4 : 30)} fontFamily={FONT} fontWeight={700} fontSize={84} fill={C.paper} letterSpacing={-1}>
          Pause & predict
        </text>
        {question ? (
          <text x={badge.x + r + 38} y={badge.y + 62} fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.ink300}>
            {question}
          </text>
        ) : null}
      </g>
    );
  }
  const cx = W / 2;
  const cy = H / 2 - 70;
  const r = 118;
  const circ = 2 * Math.PI * r;
  return (
    <g opacity={visible}>
      <rect x={0} y={0} width={W} height={H} fill={C.ink950} opacity={0.88} />
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
