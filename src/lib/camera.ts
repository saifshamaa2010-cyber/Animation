import { interpolate } from "remotion";
import { EASE, H, W } from "../brand/tokens";

/**
 * A camera is just "which point of the world is in the centre of the screen, and how close".
 * Camera moves are only used to change scale or shift focus — never decoration.
 */
export type Cam = { readonly x: number; readonly y: number; readonly z: number };
export type CamKey = Cam & { readonly f: number; readonly ease?: (t: number) => number };

export const REST: Cam = { x: W / 2, y: H / 2, z: 1 };

/** Interpolate between camera keyframes (each segment eased; default ease-in-out). */
export const camAt = (frame: number, keys: readonly CamKey[]): Cam => {
  if (keys.length === 0) return REST;
  if (frame <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: b.ease ?? EASE.inOut,
      });
      // Zoom is interpolated in log space so it feels even (perceptual).
      const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z };
    }
  }
  return keys[keys.length - 1];
};

/** SVG transform for a camera. Put world content inside <g transform={camTransform(cam)}>. */
export const camTransform = (c: Cam) => `translate(${W / 2} ${H / 2}) scale(${c.z}) translate(${-c.x} ${-c.y})`;

/** Generic eased keyframes for any number: keys = [[frame, value], …]. */
export const keys = (frame: number, k: readonly (readonly [number, number])[], ease: (t: number) => number = EASE.inOut) => {
  if (frame <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    if (frame <= k[i + 1][0]) {
      return interpolate(frame, [k[i][0], k[i + 1][0]], [k[i][1], k[i + 1][1]], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: ease,
      });
    }
  }
  return k[k.length - 1][1];
};
