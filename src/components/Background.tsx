import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, H, W } from "../brand/tokens";
import { thermalAmplitude } from "../lib/motion";
import { rng } from "../lib/geometry";

export type BackgroundProps = {
  /** Where the soft light pools (0..1 of frame). */
  readonly lightX?: number;
  readonly lightY?: number;
  /** "ink" for the molecular world, "warm" for the everyday (macro) world, "heat" for hot scenes. */
  readonly tone?: "ink" | "warm" | "heat" | "cold";
  /** Faint water molecules drifting — the solution everything happens in. */
  readonly particles?: number;
  readonly temperature?: number;
};

const LIGHT: Record<NonNullable<BackgroundProps["tone"]>, string> = {
  ink: "#1C3352",
  warm: "#3A3442",
  heat: "#4A2C38",
  cold: "#1B3A5E",
};

export const Background: React.FC<BackgroundProps> = ({
  lightX = 0.5,
  lightY = 0.42,
  tone = "ink",
  particles = 0,
  temperature = 25,
}) => {
  const frame = useCurrentFrame();
  const amp = thermalAmplitude(temperature) * 3;
  const rand = rng(99);
  const pts = Array.from({ length: particles }, (_, i) => ({
    x: rand() * W,
    y: rand() * H,
    s: 0.5 + rand() * 0.6,
    i,
  }));
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 85% at ${lightX * 100}% ${lightY * 100}%, ${LIGHT[tone]} 0%, ${C.ink900} 58%, ${C.ink950} 100%)`,
      }}
    >
      {particles > 0 ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {pts.map((p) => {
            const dx = noise2D(`wx${p.i}`, frame * 0.01, 0) * amp * 4 + frame * 0.15 * p.s;
            const dy = noise2D(`wy${p.i}`, frame * 0.01, 5) * amp * 4;
            const x = ((p.x + dx) % W + W) % W;
            return <WaterMolecule key={p.i} x={x} y={p.y + dy} s={p.s} rot={noise2D(`wr${p.i}`, frame * 0.01, 9) * 90} />;
          })}
        </svg>
      ) : null}
      {/* Static grain: dithers the dark gradient so it doesn't band after YouTube compression. */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Tiny water molecule (O with two H) — used as faint background texture in solution scenes. */
export const WaterMolecule: React.FC<{ x: number; y: number; s?: number; rot?: number; opacity?: number }> = ({
  x,
  y,
  s = 1,
  rot = 0,
  opacity = 0.09,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
    <circle cx={0} cy={0} r={7} fill={C.ink300} />
    <circle cx={-8} cy={6} r={4} fill={C.ink300} />
    <circle cx={8} cy={6} r={4} fill={C.ink300} />
  </g>
);
