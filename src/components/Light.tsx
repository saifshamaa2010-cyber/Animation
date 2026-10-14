import React from "react";
import { C } from "../brand/tokens";
import { Pt } from "../lib/geometry";
import { mix } from "./kit/shared";
import { useSvgId } from "./ids";

/**
 * Light as a visible character (EP002+): soft beams from a source, and light "particles" that travel
 * in straight lines and deliver energy where they land. Use only when light is part of the explanation.
 */

export type SunBeamsProps = {
  /** Where the light comes from (usually off-frame, top-left). */
  readonly source: Pt;
  /** Each beam is a wedge from the source to the segment [a, b]. */
  readonly beams: readonly (readonly [Pt, Pt])[];
  /** 0..1 overall visibility (= light intensity). */
  readonly on: number;
  readonly color?: string;
  /** Where the gradient fades out (defaults to the frame's far corner). */
  readonly fadeTo?: Pt;
};

export const SunBeams: React.FC<SunBeamsProps> = ({ source, beams, on, color = C.sun, fadeTo = [1500, 1000] }) => {
  const id = useSvgId("beam");
  if (on <= 0) return null;
  return (
    <g opacity={on} style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={source[0]} y1={source[1]} x2={fadeTo[0]} y2={fadeTo[1]}>
          <stop offset="0" stopColor={color} stopOpacity={0.5} />
          <stop offset="0.55" stopColor={color} stopOpacity={0.14} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-b`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={22} />
        </filter>
      </defs>
      {beams.map(([a, b], i) => (
        <polygon
          key={i}
          points={`${source[0]},${source[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}`}
          fill={`url(#${id}-g)`}
          opacity={i % 2 ? 0.55 : 0.8}
          filter={`url(#${id}-b)`}
        />
      ))}
    </g>
  );
};

/** One packet of light travelling from `from` to `to`. p = 0..1 along the path (linear: light doesn't ease). */
export const Photon: React.FC<{ readonly from: Pt; readonly to: Pt; readonly p: number; readonly size?: number; readonly color?: string }> = ({
  from,
  to,
  p,
  size = 1,
  color = C.sun,
}) => {
  if (p <= 0 || p >= 1) return null;
  const at = (q: number): Pt => [from[0] + (to[0] - from[0]) * q, from[1] + (to[1] - from[1]) * q];
  const [x, y] = at(p);
  const [tx, ty] = at(Math.max(0, p - 0.2));
  const fade = Math.min(1, p * 6) * Math.min(1, (1 - p) * 10);
  return (
    <g opacity={fade}>
      <line x1={tx} y1={ty} x2={x} y2={y} stroke={color} strokeOpacity={0.55} strokeWidth={7 * size} strokeLinecap="round" />
      <circle cx={x} cy={y} r={24 * size} fill={color} opacity={0.22} />
      <circle cx={x} cy={y} r={13 * size} fill={color} opacity={0.4} />
      <circle cx={x} cy={y} r={7.5 * size} fill={mix(color, C.paper, 0.6)} />
    </g>
  );
};

/**
 * A stream of photons: `count` packets leaving every `every` frames from `start`.
 * `path(i)` gives each packet's [from, to]. Returns nothing outside its time window.
 */
export const PhotonStream: React.FC<{
  readonly frame: number;
  readonly start: number;
  readonly count: number;
  readonly every: number;
  readonly travel: number;
  readonly path: (i: number) => readonly [Pt, Pt];
  readonly size?: number;
  readonly color?: string;
}> = ({ frame, start, count, every, travel, path, size, color }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const [a, b] = path(i);
      return <Photon key={i} from={a} to={b} p={(frame - start - i * every) / travel} size={size} color={color} />;
    })}
  </g>
);

/** A lit sun disc with soft rays — an icon for "light" (e.g. a limiting factor, a condition). */
export const SunIcon: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly progress?: number; readonly glow?: number }> = ({
  x,
  y,
  r = 60,
  progress = 1,
  glow = 0.5,
}) => {
  const id = useSvgId("sun");
  if (progress <= 0) return null;
  const s = 0.6 + 0.4 * progress;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, progress * 1.4)}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor={mix(C.sun, C.paper, 0.45)} />
          <stop offset="1" stopColor={C.amber} />
        </radialGradient>
        <filter id={`${id}-b`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={r * 0.35} />
        </filter>
      </defs>
      <circle r={r * 1.5} fill={C.sun} opacity={0.35 * glow} filter={`url(#${id}-b)`} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={Math.cos(a) * r * 1.28}
            y1={Math.sin(a) * r * 1.28}
            x2={Math.cos(a) * r * 1.62}
            y2={Math.sin(a) * r * 1.62}
            stroke={C.sun}
            strokeWidth={r * 0.12}
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}
      <circle r={r} fill={`url(#${id}-g)`} />
      <circle r={r - 2} fill="none" stroke={C.paper} strokeOpacity={0.5} strokeWidth={3} strokeDasharray={`${r * 1.2} ${r * 9}`} transform="rotate(200)" />
    </g>
  );
};
