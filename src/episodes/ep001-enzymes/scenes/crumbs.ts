import { rng } from "../../../lib/geometry";

/** The chewed mouthful (shared by the hook S01 and the resolution S13 so it is the same pile). */
export const P = { x: 840, y: 600 } as const; // where the chewed mouthful sits

/** Crumbs: where they start (inside the cracker) and where they settle (a soft mound). */
export const CRUMBS = (() => {
  const r = rng(1701);
  return Array.from({ length: 44 }, (_, i) => {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    return {
      from: [P.x + (r() - 0.5) * 460, P.y - 90 + (r() - 0.5) * 460] as const,
      to: [P.x + Math.cos(a) * rad * 240, P.y + 50 + Math.sin(a) * rad * 92 - (1 - rad) * 60] as const,
      r: 16 + r() * 20,
      rot: r() * 360,
      delay: Math.floor(r() * 10),
      glowDelay: Math.floor(r() * 24),
      seed: i + 11,
    };
  });
})();

