import { interpolate } from "remotion";
import { EASE } from "../brand/tokens";

/**
 * Keyframe track: [[frame, value, easeIntoThisKey?], …]. Each segment can have its own easing
 * (ease-out for arrivals, ease-in for exits, ease-in-out for moves), which is what makes motion
 * feel directed rather than mechanical.
 */
export type Key = readonly [number, number, ((t: number) => number)?];

export const track = (frame: number, k: readonly Key[]): number => {
  if (k.length === 0) return 0;
  if (frame <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, v0] = k[i];
    const [f1, v1, ease] = k[i + 1];
    if (frame <= f1) {
      if (f1 <= f0) return v1;
      return interpolate(frame, [f0, f1], [v0, v1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: ease ?? EASE.inOut,
      });
    }
  }
  return k[k.length - 1][1];
};

/** A smooth 0→1→0 bump starting at `start`, lasting `len` frames (for small "settle" reactions). */
export const pulse = (frame: number, start: number, len: number) => {
  if (frame < start || frame > start + len) return 0;
  return Math.sin(((frame - start) / len) * Math.PI);
};
