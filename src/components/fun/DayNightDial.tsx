import React from "react";
import { useCurrentFrame } from "remotion";
import { C, EASE, W2 } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { mix } from "../kit/shared";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t);
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/**
 * A round "window to the sky" that shows whether it is light or dark: a smiling sun sets behind a hill and a
 * sleepy moon rises (night 0 → 1), and back again. Use it wherever light/dark is the variable
 * (stomata, respiration vs photosynthesis, the indicator practical…).
 */
export const DayNightDial: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly r?: number;
  /** 0 = day (sun up) … 1 = night (moon up) */
  readonly night: number;
  readonly progress?: number;
}> = ({ x, y, r = 80, night, progress = 1 }) => {
  const id = useSvgId("dial");
  const f = useCurrentFrame();
  if (progress <= 0) return null;
  const n = clamp01(night);
  const sunset = EASE.inOut(clamp01(n * 2));
  const moonrise = EASE.out(clamp01(n * 2 - 1));
  const skyTop = mix(mix(W2.skyGold, "#FFFFFF", 0.25), W2.leafNightDeep, n);
  const skyBottom = mix(W2.skyCoral, C.violetDeep, n);
  const hill = mix(W2.hill, mix(W2.hillDeep, W2.leafNightDeep, 0.6), n);
  const sunY = -r * 0.12 + sunset * r * 1.35;
  const moonY = r * 1.25 - moonrise * r * 1.37;
  const s = back(progress);
  const sr = r * 0.4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, progress * 2)}>
      <defs>
        <clipPath id={`${id}-c`}>
          <circle r={r} />
        </clipPath>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
        <mask id={`${id}-moon`}>
          <circle cx={0} cy={0} r={sr} fill="#FFFFFF" />
          <circle cx={sr * 0.48} cy={-sr * 0.28} r={sr * 0.86} fill="#000000" />
        </mask>
      </defs>
      {/* drop shadow + frame */}
      <circle cx={4} cy={9} r={r + 10} fill="#000" opacity={0.3} />
      <circle r={r + 10} fill={W2.inkText} />
      <g clipPath={`url(#${id}-c)`}>
        <rect x={-r} y={-r} width={r * 2} height={r * 2} fill={`url(#${id}-sky)`} />
        {/* stars */}
        {[
          [-0.5, -0.45],
          [0.42, -0.58],
          [0.6, -0.12],
          [-0.18, -0.7],
        ].map(([sx, sy], i) => {
          const tw = 0.55 + 0.45 * Math.sin((f + i * 23) / 8);
          const k = r * 0.07 * (0.7 + 0.3 * tw);
          const cx = sx * r;
          const cy = sy * r;
          return (
            <path
              key={i}
              d={`M${cx},${cy - k} Q${cx + k * 0.2},${cy - k * 0.2} ${cx + k},${cy} Q${cx + k * 0.2},${cy + k * 0.2} ${cx},${cy + k} Q${cx - k * 0.2},${cy + k * 0.2} ${cx - k},${cy} Q${cx - k * 0.2},${cy - k * 0.2} ${cx},${cy - k} Z`}
              fill={C.amberLight}
              opacity={n * tw}
            />
          );
        })}
        {/* sun with a face */}
        {sunset < 1 ? (
          <g transform={`translate(0 ${sunY})`}>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2 + f / 90;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * sr * 1.3}
                  y1={Math.sin(a) * sr * 1.3}
                  x2={Math.cos(a) * sr * 1.62}
                  y2={Math.sin(a) * sr * 1.62}
                  stroke={C.sun}
                  strokeWidth={r * 0.06}
                  strokeLinecap="round"
                />
              );
            })}
            <circle r={sr} fill={C.sun} stroke={C.amberDeep} strokeWidth={3} />
            <ellipse cx={-sr * 0.35} cy={-sr * 0.45} rx={sr * 0.28} ry={sr * 0.15} fill="#FFFFFF" opacity={0.5} transform={`rotate(-25 ${-sr * 0.35} ${-sr * 0.45})`} />
            <path d={`M${-sr * 0.48},${-sr * 0.05} q${sr * 0.15},${-sr * 0.2} ${sr * 0.3},0 M${sr * 0.18},${-sr * 0.05} q${sr * 0.15},${-sr * 0.2} ${sr * 0.3},0`} fill="none" stroke={W2.inkText} strokeWidth={3} strokeLinecap="round" />
            <path d={`M${-sr * 0.3},${sr * 0.22} Q0,${sr * 0.55} ${sr * 0.3},${sr * 0.22} Z`} fill="#4A1D2B" />
            <ellipse cx={-sr * 0.6} cy={sr * 0.2} rx={sr * 0.14} ry={sr * 0.09} fill={W2.cheek} opacity={0.7} />
            <ellipse cx={sr * 0.6} cy={sr * 0.2} rx={sr * 0.14} ry={sr * 0.09} fill={W2.cheek} opacity={0.7} />
          </g>
        ) : null}
        {/* sleepy moon */}
        {moonrise > 0 ? (
          <g transform={`translate(${-r * 0.06} ${moonY}) rotate(-12)`}>
            <circle r={sr} fill={C.amberLight} mask={`url(#${id}-moon)`} />
            <path d={`M${-sr * 0.62},${-sr * 0.02} q${sr * 0.13},${sr * 0.13} ${sr * 0.26},0`} fill="none" stroke={W2.inkText} strokeWidth={2.6} strokeLinecap="round" />
            <path d={`M${-sr * 0.55},${sr * 0.32} q${sr * 0.1},${sr * 0.08} ${sr * 0.2},0`} fill="none" stroke={W2.inkText} strokeWidth={2.4} strokeLinecap="round" />
            {/* z z */}
            {[0, 1].map((i) => {
              const k = ((f / 40 + i * 0.5) % 1);
              const zx = sr * 0.55 + k * sr * 0.6 + i * 4;
              const zy = -sr * 0.4 - k * sr * 0.9;
              const zs = sr * (0.18 + 0.08 * i);
              return (
                <path
                  key={i}
                  d={`M${zx},${zy} h${zs} l${-zs},${zs} h${zs}`}
                  fill="none"
                  stroke={C.amberLight}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={moonrise * Math.sin(k * Math.PI)}
                />
              );
            })}
          </g>
        ) : null}
        {/* horizon */}
        <path d={`M${-r},${r * 0.42} C${-r * 0.4},${r * 0.22} ${r * 0.1},${r * 0.5} ${r},${r * 0.32} V${r} H${-r} Z`} fill={hill} />
        <path d={`M${-r},${r * 0.62} C${-r * 0.3},${r * 0.5} ${r * 0.4},${r * 0.72} ${r},${r * 0.56} V${r} H${-r} Z`} fill={mix(hill, "#000000", 0.18)} />
      </g>
      <circle r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={6} />
      <circle r={r + 8} fill="none" stroke={W2.inkText} strokeWidth={4} />
      <ellipse cx={-r * 0.45} cy={-r * 0.62} rx={r * 0.3} ry={r * 0.1} fill="#FFFFFF" opacity={0.35} transform={`rotate(-35 ${-r * 0.45} ${-r * 0.62})`} />
    </g>
  );
};
