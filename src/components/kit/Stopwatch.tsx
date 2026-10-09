import React from "react";
import { C } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { LitShape, circlePath, mix, roundRectPath } from "./shared";

export type StopwatchProps = {
  readonly x: number;
  readonly y: number;
  /** Diameter of the case in px. Default 320. */
  readonly size?: number;
  /** Elapsed time; the hand sweeps once per 60 s. */
  readonly seconds: number;
  /** Hand + elapsed-wedge colour. Default amber. */
  readonly color?: string;
  /** Amber arc from 12 o'clock to the hand (time that has passed). Default true. */
  readonly showElapsed?: boolean;
  /** Show "m:ss" under the hub. Default false. */
  readonly readout?: boolean;
  /** 0..1 entrance (fade + rise). Default 1. */
  readonly progress?: number;
  readonly opacity?: number;
};

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/** An illustrated stopwatch: brushed ink-metal case, crown, dial ticks, sweeping hand. */
export const Stopwatch: React.FC<StopwatchProps> = ({
  x,
  y,
  size = 320,
  seconds,
  color = C.amber,
  showElapsed = true,
  readout = false,
  progress = 1,
  opacity = 1,
}) => {
  const id = useSvgId("sw");
  if (progress <= 0 || opacity <= 0) return null;
  const R = size / 2;
  const face = R * 0.85;
  const turn = ((seconds % 60) + 60) % 60 / 60;
  const ang = turn * 360;
  const px = (n: number, min: number) => Math.max(min, n);
  // Elapsed arc from 12 o'clock to the hand.
  const ringR = face * 0.7;
  const a1 = (ang - 90) * (Math.PI / 180);
  const wedge = turn > 0.001;
  const handLen = face * 0.86;
  const tail = face * 0.2;
  const hw = px(R * 0.034, 3.5);
  const hand = `M${-hw},${tail}L${-hw * 0.42},${-handLen}Q0,${-handLen - hw} ${hw * 0.42},${-handLen}L${hw},${tail}Q0,${tail + hw * 1.6} ${-hw},${tail}Z`;
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <g transform={`translate(${x} ${y + (1 - progress) * 24})`} opacity={opacity * progress}>
      <defs>
        <radialGradient id={`${id}-face`} cx="0.45" cy="0.3" r="0.85">
          <stop offset="0" stopColor={C.ink700} />
          <stop offset="1" stopColor={C.ink900} />
        </radialGradient>
        <clipPath id={`${id}-faceclip`}>
          <circle r={face} />
        </clipPath>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={px(R * 0.03, 2)} />
        </filter>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.12} />
          <stop offset="0.5" stopColor={C.paper} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Crown stem + cap, and a side pusher at 45°. Drawn first so the case overlaps them. */}
      <g transform={`rotate(42)`}>
        <LitShape d={roundRectPath(-R * 0.09, -R * 1.13, R * 0.18, R * 0.22, R * 0.04)} top={C.ink400} bottom={C.ink600} rimWidth={3} shadow={0} />
      </g>
      <LitShape d={roundRectPath(-R * 0.07, -R * 1.16, R * 0.14, R * 0.24, R * 0.03)} top={C.ink400} bottom={C.ink600} rimWidth={3} shadow={0} />
      <LitShape d={roundRectPath(-R * 0.2, -R * 1.3, R * 0.4, R * 0.16, R * 0.07)} top={C.ink300} bottom={C.ink500} rimWidth={4} shadow={0} />

      {/* Case */}
      <LitShape d={circlePath(0, 0, R)} top={C.ink400} bottom={C.ink700} slant={0.5} rimWidth={px(R * 0.05, 4)} rimOpacity={0.8} shadow={0.5} shadowDy={R * 0.08} shadowBlur={R * 0.08} />
      {/* Bezel step: a darker inner ring gives the face some depth. */}
      <circle r={face + px(R * 0.035, 3)} fill={C.ink800} />
      <circle r={face} fill={`url(#${id}-face)`} />

      <g clipPath={`url(#${id}-faceclip)`}>
        {/* Inner shadow at the top of the face (the bezel shades it). */}
        <circle r={face} cy={-R * 0.06} fill="none" stroke={C.ink950} strokeOpacity={0.6} strokeWidth={R * 0.1} filter={`url(#${id}-soft)`} />
        {showElapsed && wedge ? (
          <path
            d={`M0,${-ringR}A${ringR},${ringR} 0 ${turn > 0.5 ? 1 : 0} 1 ${Math.cos(a1) * ringR},${Math.sin(a1) * ringR}`}
            fill="none"
            stroke={color}
            strokeOpacity={0.9}
            strokeWidth={px(R * 0.045, 4)}
            strokeLinecap="round"
          />
        ) : null}
        {ticks.map((i) => {
          const major = i % 5 === 0;
          const quarter = i % 15 === 0;
          const len = quarter ? face * 0.15 : major ? face * 0.11 : face * 0.055;
          const wdt = quarter ? px(R * 0.03, 3) : major ? px(R * 0.022, 2.5) : px(R * 0.01, 1.4);
          return (
            <line
              key={i}
              x1={0}
              y1={-face * 0.95}
              x2={0}
              y2={-face * 0.95 + len}
              stroke={major ? C.paper : C.ink300}
              strokeOpacity={major ? 0.95 : 0.55}
              strokeWidth={wdt}
              strokeLinecap="round"
              transform={`rotate(${i * 6})`}
            />
          );
        })}
      </g>

      {readout ? (
        <text
          y={face * 0.52}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={600}
          fontSize={Math.max(40, R * 0.27)}
          fill={C.paper}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {fmt(seconds)}
        </text>
      ) : null}

      {/* Hand: soft shadow, body, rim, hub. */}
      <g transform={`rotate(${ang})`}>
        <path d={hand} fill={C.ink950} opacity={0.55} transform={`translate(${R * 0.02} ${R * 0.035})`} filter={`url(#${id}-soft)`} />
        <path d={hand} fill={color} />
        <path d={hand} fill="none" stroke={mix(color, C.paper, 0.6)} strokeOpacity={0.5} strokeWidth={1.2} clipPath={`url(#${id}-faceclip)`} />
      </g>
      <circle r={px(R * 0.075, 6)} fill={color} />
      <circle r={px(R * 0.075, 6)} fill="none" stroke={C.paper} strokeOpacity={0.35} strokeWidth={1.5} />
      <circle r={px(R * 0.028, 2.5)} fill={C.ink900} />

      {/* Glass: one soft highlight across the upper left. */}
      <path d={`M${-face * 0.86},${-face * 0.2}A${face},${face} 0 0 1 ${face * 0.2},${-face * 0.86}A${face * 1.25},${face * 1.25} 0 0 0 ${-face * 0.86},${-face * 0.2}Z`} fill={`url(#${id}-glass)`} />
    </g>
  );
};
