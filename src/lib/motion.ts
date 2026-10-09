import { noise2D } from "@remotion/noise";
import { interpolate } from "remotion";
import { EASE } from "../brand/tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 progress between two frames, eased. */
export const prog = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EASE.out,
) => interpolate(frame, [start, start + Math.max(1, duration)], [0, 1], { ...clamp, easing });

/** Fades in at `start`, out at `end` (both over `fade` frames). */
export const window01 = (frame: number, start: number, end: number, fade = 10) =>
  Math.min(prog(frame, start, fade), 1 - prog(frame, end - fade, fade, EASE.in));

/**
 * Thermal motion. Molecules really do jiggle; amplitude is tied to temperature,
 * so this is explanatory motion, not decoration.
 */
export const jitter = (
  seed: string | number,
  frame: number,
  amplitude: number,
  speed = 0.02,
) => ({
  dx: noise2D(`${seed}-x`, frame * speed, 0) * amplitude,
  dy: noise2D(`${seed}-y`, frame * speed, 10) * amplitude,
  rot: noise2D(`${seed}-r`, frame * speed, 20) * amplitude * 0.25,
});

/** Temperature (°C) → jiggle amplitude in px. */
export const thermalAmplitude = (celsius: number) =>
  interpolate(celsius, [0, 37, 70], [1.5, 6, 16], clamp);
