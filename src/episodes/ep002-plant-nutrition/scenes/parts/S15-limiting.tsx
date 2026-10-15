/** S15 helpers: definition pills and the three "conditions" cards (dawn / winter / summer). */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { CarbonDioxide, LitShape, mix, textWidth } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { SunIcon } from "../../../../components/Light";
import { Thermometer } from "../../../../components/Thermometer";
import { prog } from "../../../../lib/motion";
import { useSvgId } from "../../../../components/ids";

/** A lit pill with one short phrase. (x, y) = centre. */
export const Pill: React.FC<{ readonly x: number; readonly y: number; readonly text: string; readonly color: string; readonly progress: number; readonly opacity?: number }> = ({
  x,
  y,
  text,
  color,
  progress,
  opacity = 1,
}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const size = 50;
  const w = textWidth(text, size, 600) + 70;
  const h = 88;
  const p = EASE.out(Math.min(1, progress));
  const t = y - h / 2 + (1 - p) * 22;
  return (
    <g opacity={Math.min(1, progress * 2) * opacity}>
      <LitShape d={roundRectPath(x - w / 2, t, w, h, 44)} top={C.ink700} bottom={C.ink800} rimOpacity={0.5} shadow={0.5} shadowDy={10} shadowBlur={12} />
      <rect x={x - w / 2 + 1.5} y={t + 1.5} width={w - 3} height={h - 3} rx={42.5} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={3} />
      <text x={x} y={t + 60} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size} fill={mix(color, C.paper, 0.3)} letterSpacing={-0.5}>
        {text}
      </text>
    </g>
  );
};
export const pillWidth = (text: string) => textWidth(text, 50, 600) + 70;

// ------------------------------------------------------------------ condition cards
export const CARD = { w: 500, h: 580, top: 250, xs: [400, 960, 1520] } as const;

/** Empty slot (dashed) shown when "different conditions" is said, before each card fills it. */
export const CardSlot: React.FC<{ readonly cx: number; readonly progress: number; readonly opacity?: number }> = ({ cx, progress, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  return (
    <rect
      x={cx - CARD.w / 2}
      y={CARD.top}
      width={CARD.w}
      height={CARD.h}
      rx={30}
      fill={C.paper}
      fillOpacity={0.03}
      stroke={C.ink400}
      strokeOpacity={0.7}
      strokeWidth={3}
      strokeDasharray="14 14"
      opacity={Math.min(1, progress * 1.5) * opacity}
    />
  );
};

/** A condition card: picture on top, the condition, then (on its own cue) the usual limiting factor. */
export const ConditionCard: React.FC<{
  readonly cx: number;
  readonly title: string;
  readonly factor: string;
  readonly factorColor: string;
  readonly progress: number;
  readonly factorP: number;
  readonly children?: React.ReactNode;
}> = ({ cx, title, factor, factorColor, progress, factorP, children }) => {
  if (progress <= 0) return null;
  const p = EASE.out(Math.min(1, progress));
  const l = cx - CARD.w / 2;
  const t = CARD.top + (1 - p) * 34;
  return (
    <g opacity={Math.min(1, progress * 1.6)}>
      <LitShape d={roundRectPath(l, t, CARD.w, CARD.h, 30)} top={C.ink700} bottom={C.ink800} rimOpacity={0.5} shadow={0.6} shadowDy={16} shadowBlur={18} />
      <g transform={`translate(0 ${t - CARD.top})`}>{children}</g>
      <text x={cx} y={t + 412} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paper} letterSpacing={-0.5}>
        {title}
      </text>
      {factorP > 0 ? (
        <g opacity={Math.min(1, factorP * 1.5)} transform={`translate(0 ${(1 - EASE.out(Math.min(1, factorP))) * 14})`}>
          <path
            d={`M${cx},${t + 446} L${cx},${t + 478} M${cx - 12},${t + 466} L${cx},${t + 480} L${cx + 12},${t + 466}`}
            fill="none"
            stroke={C.ink300}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x={cx} y={t + 536} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={52} fill={factorColor} letterSpacing={-0.5}>
            {factor}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** Picture area of a card: y from CARD.top + 30 to CARD.top + 340. */
const PIC_TOP = CARD.top + 30;
const PIC_BOTTOM = CARD.top + 340;

/** Dawn / dull day: the sun low on the horizon; a cloud slides over it on "dull". */
export const DawnPicture: React.FC<{ readonly cx: number; readonly f: number; readonly start: number; readonly dull: number }> = ({ cx, f, start, dull }) => {
  const id = useSvgId("dawn");
  const sunUp = prog(f, start, 40, EASE.out);
  const cloud = prog(f, dull - 6, 30, EASE.inOut);
  const horizon = PIC_BOTTOM - 40;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-sky`}>
          <rect x={cx - CARD.w / 2 + 20} y={PIC_TOP} width={CARD.w - 40} height={horizon - PIC_TOP} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-sky)`}>
        <SunIcon x={cx - 40} y={horizon + 30 - 40 * sunUp} r={58} progress={1} glow={0.35 * (1 - 0.6 * cloud)} />
      </g>
      <line x1={cx - CARD.w / 2 + 40} x2={cx + CARD.w / 2 - 40} y1={horizon} y2={horizon} stroke={C.ink300} strokeWidth={4} strokeLinecap="round" />
      {cloud > 0 ? (
        <g opacity={Math.min(1, cloud * 1.5)} transform={`translate(${(1 - cloud) * 150} 0)`}>
          <LitShape
            d={`M${cx - 130},${horizon - 70} a46,46 0 0 1 60,-44 a58,58 0 0 1 106,-6 a42,42 0 0 1 64,50 Z`}
            top={mix(C.paper, C.ink300, 0.35)}
            bottom={C.ink400}
            rimOpacity={0.6}
            shadow={0.35}
          />
        </g>
      ) : null}
    </g>
  );
};

/** A small ice crystal. */
const Snowflake: React.FC<{ readonly x: number; readonly y: number; readonly r: number; readonly opacity?: number }> = ({ x, y, r, opacity = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <line x1={-r} x2={r} y1={0} y2={0} stroke={C.ice} strokeWidth={4} strokeLinecap="round" />
        <path
          d={`M${r * 0.55},${-r * 0.25} L${r * 0.75},0 L${r * 0.55},${r * 0.25} M${-r * 0.55},${-r * 0.25} L${-r * 0.75},0 L${-r * 0.55},${r * 0.25}`}
          fill="none"
          stroke={C.ice}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
    ))}
  </g>
);

/** Cold winter's day: a thermometer that reads low, and frost. */
export const WinterPicture: React.FC<{ readonly cx: number; readonly f: number; readonly start: number }> = ({ cx, f, start }) => {
  const drop = prog(f, start + 4, 40, EASE.inOut);
  const temp = 22 - 19 * drop;
  return (
    <g>
      <g transform={`translate(${cx - 60} ${PIC_TOP + 10}) scale(0.62) translate(${-(cx - 60)} ${-(PIC_TOP + 10)})`}>
        <Thermometer x={cx - 60} y={PIC_TOP + 10} height={330} temperature={temp} min={0} max={40} ticks={[]} showValue={false} />
      </g>
      {[
        [cx + 70, PIC_TOP + 80, 26],
        [cx + 140, PIC_TOP + 170, 20],
        [cx + 60, PIC_TOP + 240, 18],
      ].map(([x, y, r], i) => (
        <Snowflake key={i} x={x} y={y} r={r} opacity={prog(f, start + 10 + i * 8, 16)} />
      ))}
    </g>
  );
};

/** Bright, warm summer's day: a high bright sun; only a little carbon dioxide in the air. */
export const SummerPicture: React.FC<{ readonly cx: number; readonly f: number; readonly start: number; readonly co2: number }> = ({ cx, f, start, co2 }) => {
  const glow = 0.6 + 0.35 * prog(f, start, 30);
  return (
    <g>
      <SunIcon x={cx - 70} y={PIC_TOP + 110} r={62} progress={prog(f, start - 4, 20)} glow={glow} />
      {[
        [cx + 110, PIC_TOP + 90, 15],
        [cx + 80, PIC_TOP + 230, -20],
      ].map(([x, y, rot], i) => (
        <CarbonDioxide key={i} x={x} y={y} scale={0.52} rotate={rot} progress={prog(f, co2 - 6 + i * 6, 16)} seed={150 + i} />
      ))}
    </g>
  );
};
