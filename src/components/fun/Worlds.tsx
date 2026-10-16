import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { H, W, W2 } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { useSvgId } from "../ids";

export type WorldKind = "desk" | "bench" | "leaf" | "meadow";

/** Soft, slow drifting light motes (a world's atmosphere). Deterministic. */
const Motes: React.FC<{ n: number; color: string; seed: string; opacity?: number; area?: readonly [number, number, number, number] }> = ({
  n,
  color,
  seed,
  opacity = 0.35,
  area = [0, 0, W, H],
}) => {
  const f = useCurrentFrame();
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const bx = area[0] + ((i * 397 + 113) % 1000) / 1000 * area[2];
        const by = area[1] + ((i * 613 + 71) % 1000) / 1000 * area[3];
        const x = bx + noise2D(`${seed}x${i}`, f / 220, 0) * 60;
        const y = by + noise2D(`${seed}y${i}`, f / 220, 0) * 40 - (f * 0.15 * ((i % 3) + 1)) % 80;
        const r = 3 + (i % 4) * 2;
        const tw = 0.5 + 0.5 * Math.sin((f + i * 31) / 24);
        return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={opacity * tw} />;
      })}
    </g>
  );
};

const Desk: React.FC = () => {
  const id = useSvgId("desk");
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={W2.deskTop} />
          <stop offset="1" stopColor={W2.deskBottom} />
        </linearGradient>
        <radialGradient id={`${id}-v`} cx="50%" cy="45%" r="75%">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <pattern id={`${id}-grid`} width={64} height={64} patternUnits="userSpaceOnUse">
          <path d="M64,0 H0 V64" fill="none" stroke={W2.deskGrid} strokeOpacity={0.12} strokeWidth={2} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-bg)`} />
      <rect width={W} height={H} fill={`url(#${id}-grid)`} />
      <Motes n={18} color="#FFE6A8" seed="desk" opacity={0.28} />
      <rect width={W} height={H} fill={`url(#${id}-v)`} />
    </g>
  );
};

/** Lab bench: tiled wall + wooden bench top at `benchY`. Draw apparatus standing on y = benchY. */
const Bench: React.FC<{ benchY: number }> = ({ benchY }) => {
  const id = useSvgId("bench");
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={W2.wallTop} />
          <stop offset="1" stopColor={W2.wallBottom} />
        </linearGradient>
        <pattern id={`${id}-tile`} width={120} height={80} patternUnits="userSpaceOnUse">
          <rect width={120} height={80} fill="none" stroke={W2.tile} strokeOpacity={0.55} strokeWidth={3} />
        </pattern>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={W2.wood} />
          <stop offset="1" stopColor={W2.woodDeep} />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={W2.woodDeep} />
          <stop offset="1" stopColor={W2.woodDark} />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx="30%" cy="10%" r="80%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={benchY} fill={`url(#${id}-wall)`} />
      <rect width={W} height={benchY} fill={`url(#${id}-tile)`} />
      <rect width={W} height={benchY} fill={`url(#${id}-light)`} />
      {/* bench top with a bevel and grain */}
      <rect x={0} y={benchY} width={W} height={46} fill={`url(#${id}-top)`} />
      <rect x={0} y={benchY} width={W} height={5} fill="#FFFFFF" opacity={0.45} />
      {[0.18, 0.45, 0.72].map((t, i) => (
        <path key={i} d={`M0,${benchY + 14 + i * 9} C${W * 0.3},${benchY + 10 + i * 9} ${W * 0.6},${benchY + 20 + i * 9} ${W},${benchY + 13 + i * 9}`} fill="none" stroke={W2.woodDark} strokeOpacity={0.18 + t * 0.1} strokeWidth={2} />
      ))}
      <rect x={0} y={benchY + 46} width={W} height={H - benchY - 46} fill={`url(#${id}-front)`} />
      {[320, 960, 1600].map((x) => (
        <rect key={x} x={x - 260} y={benchY + 80} width={520} height={H - benchY - 100} rx={14} fill="none" stroke="#000" strokeOpacity={0.16} strokeWidth={4} />
      ))}
      <rect x={0} y={benchY + 46} width={W} height={10} fill="#000" opacity={0.22} />
    </g>
  );
};

/** Inside the leaf at "night-purple": a deep backdrop that makes green cells glow. */
const LeafNight: React.FC = () => {
  const id = useSvgId("lnight");
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="40%" r="85%">
          <stop offset="0" stopColor="#3A2A80" />
          <stop offset="0.6" stopColor={W2.leafNight} />
          <stop offset="1" stopColor={W2.leafNightDeep} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-bg)`} />
      <Motes n={14} color="#B9F59A" seed="leafnight" opacity={0.18} />
    </g>
  );
};

const Meadow: React.FC = () => {
  const id = useSvgId("meadow");
  const f = useCurrentFrame();
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={W2.skyMagenta} />
          <stop offset="0.55" stopColor={W2.skyCoral} />
          <stop offset="1" stopColor={W2.skyGold} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      <path d={`M0,850 C300,${790 + Math.sin(f / 90) * 4} 620,820 960,800 C1300,780 1600,830 1920,790 V1080 H0 Z`} fill={W2.hillDeep} opacity={0.75} />
      <path d="M0,920 C380,860 760,900 1120,880 C1480,860 1700,900 1920,880 V1080 H0 Z" fill={W2.hill} />
    </g>
  );
};

/**
 * A full-frame stage in one of the channel's "worlds" (v2 look). Children are SVG in 1920×1080 coords.
 * `benchY` sets the bench height for the lab world.
 */
export const WorldStage: React.FC<{ readonly world: WorldKind; readonly benchY?: number; readonly children: React.ReactNode }> = ({ world, benchY = 760, children }) => (
  <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {world === "desk" ? <Desk /> : world === "bench" ? <Bench benchY={benchY} /> : world === "leaf" ? <LeafNight /> : <Meadow />}
      {children}
    </svg>
  </AbsoluteFill>
);
