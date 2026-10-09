import React from "react";
import { interpolate, interpolateColors } from "remotion";
import { C } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { useSvgId } from "./ids";

export type ThermometerProps = {
  readonly x: number;
  readonly y: number; // top of the tube
  readonly height?: number;
  readonly temperature: number; // °C
  readonly min?: number;
  readonly max?: number;
  readonly ticks?: readonly number[];
  readonly showValue?: boolean;
  readonly opacity?: number;
};

const c = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Temperature → liquid colour: cold blue, body-temperature teal-amber, hot coral. */
export const heatColor = (t: number) =>
  interpolateColors(t, [0, 20, 37, 50, 70], [C.ice, C.teal, C.amber, C.coral, C.coralDeep]);

export const Thermometer: React.FC<ThermometerProps> = ({
  x,
  y,
  height = 520,
  temperature,
  min = 0,
  max = 80,
  ticks = [0, 20, 37, 60, 80],
  showValue = true,
  opacity = 1,
}) => {
  const id = useSvgId("thermo");
  const tubeW = 34;
  const bulbR = 40;
  const top = y;
  const bottom = y + height;
  const level = interpolate(temperature, [min, max], [bottom, top + 14], c);
  const col = heatColor(temperature);
  const yOf = (t: number) => interpolate(t, [min, max], [bottom, top + 14], c);
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`${id}-tube`}>
          <rect x={x - tubeW / 2 + 7} y={top + 7} width={tubeW - 14} height={height + 10} rx={(tubeW - 14) / 2} />
          <circle cx={x} cy={bottom + bulbR - 6} r={bulbR - 8} />
        </clipPath>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      {/* glass */}
      <rect x={x - tubeW / 2} y={top} width={tubeW} height={height + 14} rx={tubeW / 2} fill={C.ink700} stroke={C.ink500} strokeWidth={3} />
      <circle cx={x} cy={bottom + bulbR - 6} r={bulbR} fill={C.ink700} stroke={C.ink500} strokeWidth={3} />
      {/* liquid */}
      <circle cx={x} cy={bottom + bulbR - 6} r={bulbR - 8} fill={col} opacity={0.5} filter={`url(#${id}-glow)`} />
      <g clipPath={`url(#${id}-tube)`}>
        <rect x={x - 30} y={level} width={60} height={bottom - level + bulbR * 2} fill={col} />
        <rect x={x - 12} y={level} width={5} height={bottom - level} fill="#FFFFFF" opacity={0.35} />
      </g>
      {/* ticks */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x + tubeW / 2 + 6} x2={x + tubeW / 2 + 22} y1={yOf(t)} y2={yOf(t)} stroke={C.ink300} strokeWidth={3} strokeLinecap="round" />
          <text x={x + tubeW / 2 + 32} y={yOf(t) + 11} fontFamily={FONT} fontWeight={500} fontSize={30} fill={C.ink300}>
            {t}
          </text>
        </g>
      ))}
      {showValue ? (
        <text x={x} y={top - 34} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={54} fill={col}>
          {Math.round(temperature)}°C
        </text>
      ) : null}
    </g>
  );
};
