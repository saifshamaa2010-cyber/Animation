import React from "react";
import { interpolate } from "remotion";
import { evolvePath } from "@remotion/paths";
import { C } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { Pt, smoothOpenPath } from "../lib/geometry";
import { useSvgId } from "./ids";

export type Curve = {
  /** y = f(x), y in 0..1 */
  readonly f: (x: number) => number;
  readonly color: string;
  /** Draw the curve from xFrom up to this x (data units). */
  readonly revealTo: number;
  readonly revealFrom?: number;
  readonly dashed?: boolean;
  readonly width?: number;
  readonly fill?: boolean;
  readonly opacity?: number;
};

export type GraphProps = {
  readonly x: number; // left of plot area
  readonly y: number; // top of plot area
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly xTicks?: readonly number[];
  readonly xTickFormat?: (v: number) => string;
  readonly xLabel?: string;
  readonly yLabel?: string;
  readonly curves: readonly Curve[];
  /** Dot riding on curve 0 at this x. */
  readonly marker?: { readonly x: number; readonly curve?: number; readonly opacity?: number };
  /** Vertical guide lines (e.g. the optimum). */
  readonly guides?: readonly { readonly x: number; readonly label?: string; readonly color?: string; readonly opacity: number }[];
  /** 0..1 axes draw-on. */
  readonly axes?: number;
  readonly opacity?: number;
};

/** A deliberately simple, qualitative graph: no y numbers, few ticks, curves that draw on. */
export const Graph: React.FC<GraphProps> = ({
  x,
  y,
  width,
  height,
  xDomain,
  xTicks = [],
  xTickFormat = (v) => `${v}`,
  xLabel,
  yLabel,
  curves,
  marker,
  guides = [],
  axes = 1,
  opacity = 1,
}) => {
  const id = useSvgId("graph");
  const sx = (v: number) => x + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * width;
  const sy = (v: number) => y + height - v * height * 0.92;
  const sample = (cv: Curve): Pt[] => {
    const from = cv.revealFrom ?? xDomain[0];
    const to = Math.max(from, Math.min(xDomain[1], cv.revealTo));
    const n = 90;
    return Array.from({ length: n + 1 }, (_, i) => {
      const v = from + ((to - from) * i) / n;
      return [sx(v), sy(cv.f(v))] as Pt;
    });
  };
  const axisPath = `M${x},${y} L${x},${y + height} L${x + width},${y + height}`;
  const ev = evolvePath(axes, axisPath);
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <path d={axisPath} fill="none" stroke={C.ink300} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" {...ev} />
      {axes > 0.9 && xLabel ? (
        <text x={x + width / 2} y={y + height + 96} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={36} fill={C.ink300}>
          {xLabel}
        </text>
      ) : null}
      {axes > 0.9 && yLabel ? (
        <text
          x={x - 30}
          y={y + height / 2}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={500}
          fontSize={36}
          fill={C.ink300}
          transform={`rotate(-90 ${x - 30} ${y + height / 2})`}
        >
          {yLabel}
        </text>
      ) : null}
      {xTicks.map((t) => (
        <g key={t} opacity={interpolate(axes, [0.7, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          <line x1={sx(t)} x2={sx(t)} y1={y + height} y2={y + height + 14} stroke={C.ink300} strokeWidth={3} />
          <text x={sx(t)} y={y + height + 52} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={32} fill={C.ink300}>
            {xTickFormat(t)}
          </text>
        </g>
      ))}
      {guides.map((g, i) => (
        <g key={i} opacity={g.opacity}>
          <line x1={sx(g.x)} x2={sx(g.x)} y1={y + 10} y2={y + height} stroke={g.color ?? C.paper} strokeWidth={3} strokeDasharray="8 10" />
          {g.label ? (
            <text x={sx(g.x)} y={y - 8} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={38} fill={g.color ?? C.paper}>
              {g.label}
            </text>
          ) : null}
        </g>
      ))}
      {curves.map((cv, i) => {
        const pts = sample(cv);
        const d = smoothOpenPath(pts, 0.5);
        return (
          <g key={i} opacity={cv.opacity ?? 1}>
            {cv.fill ? (
              <path d={`${d} L${pts[pts.length - 1][0]},${y + height} L${pts[0][0]},${y + height} Z`} fill={cv.color} opacity={0.12} />
            ) : null}
            {!cv.dashed ? (
              <path d={d} fill="none" stroke={cv.color} strokeWidth={(cv.width ?? 7) + 8} opacity={0.35} filter={`url(#${id}-glow)`} />
            ) : null}
            <path
              d={d}
              fill="none"
              stroke={cv.color}
              strokeWidth={cv.width ?? 7}
              strokeLinecap="round"
              strokeDasharray={cv.dashed ? "4 16" : undefined}
            />
          </g>
        );
      })}
      {marker && (marker.opacity ?? 1) > 0 ? (
        <g opacity={marker.opacity ?? 1}>
          {(() => {
            const cv = curves[marker.curve ?? 0];
            const mx = sx(marker.x);
            const my = sy(cv.f(marker.x));
            return (
              <>
                <circle cx={mx} cy={my} r={26} fill={cv.color} opacity={0.25} />
                <circle cx={mx} cy={my} r={13} fill={C.paper} stroke={cv.color} strokeWidth={5} />
              </>
            );
          })()}
        </g>
      ) : null}
    </g>
  );
};

/** Qualitative enzyme rate curves. */
export const rateVsTemperature = (t: number) => {
  const peak = 37;
  const s = t < peak ? 18 : 8;
  return Math.exp(-(((t - peak) / s) ** 2));
};

export const bell = (centre: number, width: number) => (v: number) =>
  Math.exp(-(((v - centre) / width) ** 2));
