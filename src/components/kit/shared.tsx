import React from "react";
import { C } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { InkGeometry } from "./ink";

/** Mix two token colours (hex) — for tints that stay inside the palette. */
export const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const m = (s: number) => {
    const ca = (pa >> s) & 255;
    const cb = (pb >> s) & 255;
    return Math.round(ca + (cb - ca) * Math.max(0, Math.min(1, t)));
  };
  return `#${((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1)}`;
};

/** Clockwise circle (same winding as roundRectPath, so shapes can be unioned in one path). */
export const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r},${cy}a${r},${r} 0 1,1 ${r * 2},0a${r},${r} 0 1,1 ${-r * 2},0Z`;

export const roundRectPath = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h - rr}Q${x + w},${y + h} ${x + w - rr},${y + h}H${x + rr}Q${x},${y + h} ${x},${y + h - rr}V${y + rr}Q${x},${y} ${x + rr},${y}Z`;
};

/**
 * Wrapper for hand-drawn marks: one opacity for the whole mark (so overlapping
 * strokes never double up) and a very slight, static edge roughness — the
 * felt-tip edge that separates a drawn mark from a vector primitive.
 */
export const HandLayer: React.FC<{
  readonly opacity?: number;
  readonly rough?: number;
  readonly seed?: number;
  readonly children: React.ReactNode;
}> = ({ opacity = 1, rough = 0.6, seed = 1, children }) => {
  const id = useSvgId("hand");
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity} filter={rough > 0 ? `url(#${id})` : undefined}>
      {rough > 0 ? (
        <defs>
          <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={seed % 997} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={rough * 2.6} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      ) : null}
      {children}
    </g>
  );
};

/** One stroke of ink: tapered ribbon + a thin core that fills any pinch on tight turns. */
export const InkPath: React.FC<{ readonly geo: InkGeometry | null; readonly color: string }> = ({ geo, color }) => {
  if (!geo) return null;
  return (
    <>
      <path d={geo.core} fill="none" stroke={color} strokeWidth={geo.coreWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d={geo.ribbon} fill={color} />
    </>
  );
};

/**
 * A flat vector shape lit like the rest of the channel: one soft gradient,
 * a thin rim light along the upper edge, and a soft drop shadow underneath.
 */
export const LitShape: React.FC<{
  readonly d: string;
  readonly top: string;
  readonly bottom: string;
  readonly rim?: string;
  readonly rimWidth?: number;
  readonly rimOpacity?: number;
  /** Gradient direction: 0 = straight down, 1 = towards bottom-right. */
  readonly slant?: number;
  readonly shadow?: number;
  readonly shadowDy?: number;
  readonly shadowBlur?: number;
  readonly fillOpacity?: number;
}> = ({
  d,
  top,
  bottom,
  rim = C.paper,
  rimWidth = 8,
  rimOpacity = 0.75,
  slant = 0.35,
  shadow = 0.4,
  shadowDy = 10,
  shadowBlur = 12,
  fillOpacity = 1,
}) => {
  const id = useSvgId("lit");
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2={slant} y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor={rim} stopOpacity={rimOpacity} />
          <stop offset="0.42" stopColor={rim} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={d} />
        </clipPath>
        {shadow > 0 ? (
          <filter id={`${id}-s`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={shadowBlur} />
          </filter>
        ) : null}
      </defs>
      {shadow > 0 ? (
        <path d={d} transform={`translate(0 ${shadowDy})`} fill={C.ink950} opacity={shadow} filter={`url(#${id}-s)`} />
      ) : null}
      <path d={d} fill={`url(#${id}-f)`} fillOpacity={fillOpacity} />
      {rimWidth > 0 ? (
        <path d={d} fill="none" stroke={`url(#${id}-r)`} strokeWidth={rimWidth * 2} clipPath={`url(#${id}-c)`} />
      ) : null}
    </g>
  );
};
