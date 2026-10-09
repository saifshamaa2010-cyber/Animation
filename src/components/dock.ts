import { DOCK, SPACING } from "./molecule-geometry";
import { Link, Ring, RingTone } from "./SugarChain";

/**
 * A starch chain whose last ring sits exactly in an enzyme's pocket.
 * (ex, ey, s) are the enzyme's position and scale (rotation 0).
 * `offset` slides the whole chain (e.g. to animate it arriving or leaving).
 */
export const dockedChain = (
  n: number,
  ex: number,
  ey: number,
  s: number,
  opts: {
    readonly offset?: readonly [number, number];
    readonly tone?: RingTone;
    readonly cellulose?: boolean;
    readonly wave?: number;
  } = {},
): { rings: Ring[]; links: Link[] } => {
  const { offset = [0, 0], tone = "starch", cellulose = false, wave = 0 } = opts;
  const rings: Ring[] = Array.from({ length: n }, (_, idx) => {
    const k = n - 1 - idx; // k = 0 is the ring deepest in the pocket
    const bend = wave * Math.max(0, k - 2) ** 1.4; // the free end can curve away
    return {
      x: ex + s * (DOCK.inner[0] - SPACING * k) + offset[0],
      y: ey + s * (DOCK.inner[1] + bend + (cellulose ? (idx % 2 === 0 ? -7 : 7) : 0)) + offset[1],
      rot: 0,
      flip: cellulose && idx % 2 === 1,
      tone: cellulose ? "cellulose" : tone,
      scale: s,
    };
  });
  const links: Link[] = Array.from({ length: n - 1 }, (_, i) => ({
    a: i,
    b: i + 1,
    zig: cellulose ? (i % 2 === 0 ? 1 : -1) : 0,
  }));
  return { rings, links };
};
