import React from "react";
import { C } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { textWidth } from "./text";

export type CounterProps = {
  readonly x: number;
  /** Vertical centre of the digits. */
  readonly y: number;
  /** Animate this (e.g. interpolate 0 → 1,000,000). Integers sit still; fractions roll. */
  readonly value: number;
  readonly size?: number;
  readonly color?: string;
  readonly align?: "start" | "middle" | "end";
  readonly minDigits?: number;
  /** Thousands separator (British style ","). */
  readonly separator?: string;
  /** Value change per frame; fast wheels get motion blur. Optional. */
  readonly speed?: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly suffixColor?: string;
  /** 0..1 entrance. */
  readonly progress?: number;
  readonly opacity?: number;
};

/**
 * Mechanical odometer counter: each wheel only turns while the wheel to its
 * right rolls over 9 → 0, so the big digits stay readable while the small ones blur.
 */
export const Counter: React.FC<CounterProps> = ({
  x,
  y,
  value,
  size = 84,
  color = C.paper,
  align = "middle",
  minDigits = 1,
  separator = ",",
  speed = 0,
  prefix,
  suffix,
  suffixColor = C.ink300,
  progress = 1,
  opacity = 1,
}) => {
  const id = useSvgId("ctr");
  if (progress <= 0 || opacity <= 0) return null;
  const v = Math.max(0, value);
  const nd = Math.max(minDigits, String(Math.floor(v)).length);
  const entering = Math.max(0, Math.min(1, v - (10 ** nd - 1)));
  const cols = nd + (entering > 0 ? 1 : 0);
  const cw = size * 0.64;
  const sw = textWidth(separator, size, 600) + size * 0.04;
  const lineH = size * 1.08;
  const vis = (k: number) => (k < nd ? 1 : k === nd ? entering : 0);
  let width = 0;
  for (let k = 0; k < cols; k++) width += cw * vis(k) + (k > 0 && k % 3 === 0 ? sw * vis(k) : 0);
  const xRight = align === "start" ? x + width : align === "middle" ? x + width / 2 : x;
  const colX = (k: number) => {
    let off = 0;
    for (let j = 0; j < k; j++) off += cw * vis(j);
    for (let j = 3; j <= k; j += 3) off += sw * vis(j);
    return xRight - off - (cw * vis(k)) / 2;
  };
  /** Column k shows the number formed by digits ≥ k; f = how far it has rolled to the next. */
  const wheel = (k: number) => {
    const p = 10 ** k;
    const N = Math.floor(v / p);
    const f = k === 0 ? v - Math.floor(v) : Math.max(0, Math.min(1, (v % p) - (p - 1)));
    return { N, f };
  };
  const baseline = size * 0.355;

  const digit = (k: number, N: number, dy: number, op: number) => {
    if (op <= 0.01 || N < 0) return null;
    // Leading zeros are blank (the ones column always shows).
    if (N === 0 && k > 0 && k >= minDigits) return null;
    return (
      <text
        key={`${k}-${N}`}
        x={colX(k)}
        y={y + baseline + dy}
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight={600}
        fontSize={size}
        fill={color}
        opacity={op}
      >
        {N % 10}
      </text>
    );
  };

  const columns = Array.from({ length: cols }, (_, k) => {
    const { N: d0, f } = wheel(k);
    const rate = Math.abs(speed) / 10 ** k;
    const filter = rate >= 1 ? `url(#${id}-fast)` : rate >= 0.3 ? `url(#${id}-mid)` : undefined;
    const fade = vis(k);
    return (
      <g key={k} filter={filter} opacity={fade}>
        {rate >= 1 ? (
          <>
            {digit(k, d0 - 1, -lineH * (1 + f), 0.2)}
            {digit(k, d0, -f * lineH, 0.5)}
            {digit(k, d0 + 1, (1 - f) * lineH, 0.5)}
            {digit(k, d0 + 2, (2 - f) * lineH, 0.2)}
          </>
        ) : (
          <>
            {digit(k, d0, -f * lineH, 1)}
            {f > 0.001 ? digit(k, d0 + 1, (1 - f) * lineH, 1) : null}
          </>
        )}
      </g>
    );
  });

  const seps = [];
  for (let k = 3; k < cols; k += 3) {
    const sx = colX(k) + (cw * vis(k)) / 2 + sw / 2 - size * 0.02;
    seps.push(
      <text key={`s${k}`} x={sx} y={y + baseline} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size} fill={color} opacity={vis(k)}>
        {separator}
      </text>,
    );
  }
  const subSize = Math.max(40, size * 0.5);
  const xLeft = xRight - width;
  return (
    <g opacity={opacity * progress} transform={`translate(0 ${(1 - progress) * 14})`}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="0" y1={y - lineH * 0.78} x2="0" y2={y + lineH * 0.78}>
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.24" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.76" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={xLeft - size} y={y - lineH} width={width + size * 2} height={lineH * 2}>
          <rect x={xLeft - size} y={y - lineH} width={width + size * 2} height={lineH * 2} fill={`url(#${id}-g)`} />
        </mask>
        <filter id={`${id}-fast`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={`0 ${size * 0.16}`} />
        </filter>
        <filter id={`${id}-mid`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={`0 ${size * 0.06}`} />
        </filter>
      </defs>
      <g mask={`url(#${id}-m)`}>{columns}</g>
      {seps}
      {prefix ? (
        <text x={xLeft - size * 0.18} y={y + baseline} textAnchor="end" fontFamily={FONT} fontWeight={600} fontSize={size} fill={color}>
          {prefix}
        </text>
      ) : null}
      {suffix ? (
        <text x={xRight + size * 0.22} y={y + baseline} textAnchor="start" fontFamily={FONT} fontWeight={500} fontSize={subSize} fill={suffixColor}>
          {suffix}
        </text>
      ) : null}
    </g>
  );
};
