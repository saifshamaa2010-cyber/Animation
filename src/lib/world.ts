import { H, W } from "../brand/tokens";
import type { Cam } from "./camera";
import type { Ring } from "../components/SugarChain";
import { jitter } from "./motion";

/** World point → screen point for a camera (for drawing fixed-size labels over a moving world). */
export const toScreen = (cam: Cam, p: readonly [number, number]): [number, number] => [
  W / 2 + (p[0] - cam.x) * cam.z,
  H / 2 + (p[1] - cam.y) * cam.z,
];

export type Jit = { readonly dx: number; readonly dy: number; readonly rot: number };

export const blendJit = (a: Jit, b: Jit, t: number): Jit => ({
  dx: a.dx + (b.dx - a.dx) * t,
  dy: a.dy + (b.dy - a.dy) * t,
  rot: a.rot + (b.rot - a.rot) * t,
});

/** Thermal jiggle as an SVG transform, rotating about a pivot (e.g. the enzyme's centre). */
export const jitTransform = (j: Jit, pivot: readonly [number, number]) =>
  `translate(${j.dx.toFixed(2)} ${j.dy.toFixed(2)}) rotate(${j.rot.toFixed(3)} ${pivot[0]} ${pivot[1]})`;

export const jit = (seed: string | number, frame: number, amplitude: number): Jit => jitter(seed, frame, amplitude);

/** Move/rotate a set of rings rigidly. */
export const moveRings = (
  rings: readonly Ring[],
  dx: number,
  dy: number,
  rotDeg = 0,
  pivot?: readonly [number, number],
): Ring[] => {
  const px = pivot ? pivot[0] : rings.reduce((s, r) => s + r.x, 0) / Math.max(1, rings.length);
  const py = pivot ? pivot[1] : rings.reduce((s, r) => s + r.y, 0) / Math.max(1, rings.length);
  const a = (rotDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  return rings.map((r) => {
    const x = r.x - px;
    const y = r.y - py;
    return { ...r, x: px + x * ca - y * sa + dx, y: py + x * sa + y * ca + dy, rot: (r.rot ?? 0) + rotDeg };
  });
};
