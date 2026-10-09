import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { LitShape, roundRectPath } from "./shared";

export type HourglassProps = {
  readonly x: number;
  readonly y: number;
  /** Total height in px. Default 340. */
  readonly size?: number;
  /** 0..1 how much sand has fallen. */
  readonly sand: number;
  /** Show the falling stream (default: while 0 < sand < 1). */
  readonly flowing?: boolean;
  readonly sandColor?: string;
  readonly sandDeep?: string;
  /** 0..1 entrance (fade + rise). */
  readonly progress?: number;
  readonly opacity?: number;
};

/** An illustrated hourglass: ink-metal frame, glass bulbs, sand that really drains. */
export const Hourglass: React.FC<HourglassProps> = ({
  x,
  y,
  size = 340,
  sand,
  flowing,
  sandColor = C.cream,
  sandDeep = C.creamDeep,
  progress = 1,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const id = useSvgId("hg");
  if (progress <= 0 || opacity <= 0) return null;
  const H = size;
  const h = H / 2;
  const pt = H * 0.075;
  const g = h - pt; // glass half-height
  const nw = Math.max(3, H * 0.018);
  const side = (s: 1 | -1) => {
    const X = (v: number) => (v * H * s).toFixed(2);
    return {
      down: `C${X(0.27)},${-g * 0.9} ${X(0.26)},${-g * 0.4} ${X(0.12)},${-g * 0.2} C${X(0.05)},${-g * 0.1} ${(nw * s).toFixed(2)},${-g * 0.06} ${(nw * s).toFixed(2)},0 C${(nw * s).toFixed(2)},${g * 0.06} ${X(0.05)},${g * 0.1} ${X(0.12)},${g * 0.2} C${X(0.26)},${g * 0.4} ${X(0.27)},${g * 0.9} ${X(0.16)},${g}`,
      up: `C${X(0.27)},${g * 0.9} ${X(0.26)},${g * 0.4} ${X(0.12)},${g * 0.2} C${X(0.05)},${g * 0.1} ${(nw * s).toFixed(2)},${g * 0.06} ${(nw * s).toFixed(2)},0 C${(nw * s).toFixed(2)},${-g * 0.06} ${X(0.05)},${-g * 0.1} ${X(0.12)},${-g * 0.2} C${X(0.26)},${-g * 0.4} ${X(0.27)},${-g * 0.9} ${X(0.16)},${-g}`,
    };
  };
  const R = side(1);
  const Lf = side(-1);
  const glass = `M${-0.16 * H},${-g}L${0.16 * H},${-g}${R.down}L${-0.16 * H},${g}${Lf.up}Z`;

  const s = Math.max(0, Math.min(1, sand));
  const W = H * 0.3;
  // Top: level drops towards the neck; the surface dips into a funnel while draining.
  const topLevel = -g * 0.8 + (g * 0.8 - g * 0.05) * Math.pow(s, 0.8);
  const draining = s > 0.001 && s < 0.999;
  const dip = draining ? H * 0.045 * Math.min(1, s * 6) * (1 - s * 0.6) : 0;
  const topSand = `M${-W},${topLevel}Q0,${topLevel + dip * 2} ${W},${topLevel}L${W},0L${-W},0Z`;
  // Bottom: a mound that grows.
  const hh = g * 0.74 * Math.pow(s, 0.9);
  const peak = g - hh;
  const wall = g - hh * 0.58;
  const bottomSand = `M${-W},${g + 2}L${-W},${wall}C${-W * 0.3},${wall - hh * 0.06} ${-W * 0.1},${peak} 0,${peak}C${W * 0.1},${peak} ${W * 0.3},${wall - hh * 0.06} ${W},${wall}L${W},${g + 2}Z`;
  const showStream = (flowing ?? draining) && s < 0.999;
  const streamTop = 0;
  const streamBottom = s > 0.001 ? peak : g;
  const streamLen = Math.max(0, streamBottom - streamTop);
  const grains = Array.from({ length: 7 }, (_, i) => {
    const yy = (frame * H * 0.018 + i * (streamLen / 7)) % Math.max(1, streamLen);
    return { yy: streamTop + yy, dx: ((i * 37) % 7) / 7 - 0.5 };
  });

  return (
    <g transform={`translate(${x} ${y + (1 - progress) * 24})`} opacity={opacity * progress}>
      <defs>
        <clipPath id={`${id}-glass`}>
          <path d={glass} transform={`scale(0.95 0.985)`} />
        </clipPath>
        <linearGradient id={`${id}-sand`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor={sandColor} />
          <stop offset="1" stopColor={sandDeep} />
        </linearGradient>
        <linearGradient id={`${id}-glassfill`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.1} />
          <stop offset="0.5" stopColor={C.paper} stopOpacity={0.03} />
          <stop offset="1" stopColor={C.paper} stopOpacity={0.07} />
        </linearGradient>
      </defs>

      <path d={glass} fill={`url(#${id}-glassfill)`} />
      <g clipPath={`url(#${id}-glass)`}>
        {s < 0.999 ? <path d={topSand} fill={`url(#${id}-sand)`} /> : null}
        {s < 0.999 ? (
          <path d={`M${-W},${topLevel}Q0,${topLevel + dip * 2} ${W},${topLevel}`} fill="none" stroke={C.paper} strokeOpacity={0.35} strokeWidth={2} />
        ) : null}
        {s > 0.001 ? <path d={bottomSand} fill={`url(#${id}-sand)`} /> : null}
        {s > 0.001 ? (
          <path
            d={`M${-W},${wall}C${-W * 0.3},${wall - hh * 0.06} ${-W * 0.1},${peak} 0,${peak}C${W * 0.1},${peak} ${W * 0.3},${wall - hh * 0.06} ${W},${wall}`}
            fill="none"
            stroke={C.paper}
            strokeOpacity={0.35}
            strokeWidth={2}
          />
        ) : null}
        {showStream ? (
          <>
            <line x1={0} y1={streamTop} x2={0} y2={streamBottom} stroke={sandColor} strokeWidth={Math.max(2, H * 0.009)} strokeLinecap="round" />
            {grains.map((gr, i) => (
              <circle key={i} cx={gr.dx * H * 0.012} cy={gr.yy} r={Math.max(1.4, H * 0.006)} fill={C.paper} opacity={0.6} />
            ))}
          </>
        ) : null}
      </g>
      {/* Glass edge + reflections. */}
      <path d={glass} fill="none" stroke={C.paper} strokeOpacity={0.32} strokeWidth={Math.max(2, H * 0.007)} strokeLinejoin="round" />
      <path
        d={`M${-H * 0.2},${-g * 0.78} C${-H * 0.235},${-g * 0.6} ${-H * 0.215},${-g * 0.38} ${-H * 0.14},${-g * 0.26}`}
        fill="none"
        stroke={C.paper}
        strokeOpacity={0.5}
        strokeWidth={Math.max(2.5, H * 0.011)}
        strokeLinecap="round"
      />
      <path
        d={`M${-H * 0.15},${g * 0.3} C${-H * 0.215},${g * 0.42} ${-H * 0.235},${g * 0.6} ${-H * 0.21},${g * 0.74}`}
        fill="none"
        stroke={C.paper}
        strokeOpacity={0.3}
        strokeWidth={Math.max(2.5, H * 0.011)}
        strokeLinecap="round"
      />

      {/* Front posts and the two plates. */}
      {[-1, 1].map((sx) => (
        <LitShape key={sx} d={roundRectPath(sx * H * 0.285 - H * 0.016, -g - 2, H * 0.032, g * 2 + 4, H * 0.016)} top={C.ink400} bottom={C.ink600} slant={0} rimWidth={2} shadow={0.35} shadowDy={4} shadowBlur={5} />
      ))}
      <LitShape d={roundRectPath(-H * 0.33, -h, H * 0.66, pt, pt * 0.42)} top={C.ink300} bottom={C.ink600} slant={0} rimWidth={4} shadow={0.3} shadowDy={6} shadowBlur={6} />
      <LitShape d={roundRectPath(-H * 0.33, h - pt, H * 0.66, pt, pt * 0.42)} top={C.ink400} bottom={C.ink700} slant={0} rimWidth={4} shadow={0.55} shadowDy={H * 0.03} shadowBlur={H * 0.04} />
    </g>
  );
};
