/**
 * Shared molecular geometry. The enzyme pocket is built from the same numbers
 * as the glucose hexagons, so a docked starch chain genuinely fits (lock and key).
 * All values are in "molecule units" (1 unit = 1 px at scale 1).
 */
import { Pt, distToPolygon, pointInPolygon, rng } from "../lib/geometry";

export const HEX_R = 30; // glucose ring circumradius
export const HEX_H = (HEX_R * Math.sqrt(3)) / 2; // half-height ≈ 26
export const BOND = 20; // bond length between rings
export const SPACING = HEX_R * 2 + BOND; // 80, centre-to-centre

/** Where the two docked rings sit, in enzyme-local coordinates. */
export const DOCK = {
  inner: [-45, 0] as Pt, // ring deepest in the pocket
  outer: [-125, 0] as Pt, // ring at the mouth
  cut: [-165, 0] as Pt, // the bond that gets broken (at the mouth)
};

// --- Enzyme outlines (same vertex count in every state so they can morph) ---
// Order: lipTop, 13 body points (clockwise), lipBot, then the pocket walls.

const BODY_REST: Pt[] = [
  [-204, -92],
  [-158, -150],
  [-78, -162],
  [-20, -196],
  [74, -190],
  [148, -146],
  [214, -100],
  [242, -12],
  [214, 66],
  [168, 108],
  [154, 168],
  [72, 202],
  [-28, 178],
  [-108, 154],
  [-152, 98],
];
const N_BODY = BODY_REST.length;

const POCKET_REST: Pt[] = [
  [-150, 33], // A'
  [-100, 33], // B'
  [-85, 12], // lower tooth
  [-70, 33], // C'
  [-20, 33], // D'
  [-4, 0], // tip
  [-20, -33], // D
  [-70, -33], // C
  [-85, -12], // upper tooth
  [-100, -33], // B
  [-150, -33], // A
];

const assemble = (lipTop: Pt, body: Pt[], lipBot: Pt, pocket: Pt[]): Pt[] => [
  lipTop,
  ...body,
  lipBot,
  ...pocket,
];

/** Index of the lower lip; pocket points follow it. */
export const LIP_BOT = N_BODY + 1;

// Asymmetric lips (upper one longer) so it reads as a cleft, not a mouth.
export const ENZYME_REST = assemble([-198, -42], BODY_REST, [-162, 44], POCKET_REST);

/** Pocket slightly open (before induced fit closes it). */
export const ENZYME_OPEN = assemble(
  [-206, -70],
  BODY_REST.map(([x, y], i) => (i === 0 ? [x - 6, y - 12] : i === N_BODY - 1 ? [x - 4, y + 12] : [x, y]) as Pt),
  [-170, 70],
  [
    [-150, 46],
    [-100, 42],
    [-86, 22],
    [-70, 40],
    [-20, 38],
    [-2, 0],
    [-20, -38],
    [-70, -40],
    [-86, -22],
    [-100, -42],
    [-150, -46],
  ],
);

/** Denatured: the pocket has collapsed and the body has gone lumpy. */
export const ENZYME_DENATURED = assemble(
  [-190, -20],
  BODY_REST.map(([x, y], i) => {
    const r = rng(1234 + i * 17);
    const k = 1 + (r() - 0.5) * 0.3;
    return [x * k + (r() - 0.5) * 36, y * k + (r() - 0.5) * 36] as Pt;
  }),
  [-170, 52],
  [
    [-150, 22],
    [-112, 16],
    [-90, 30],
    [-62, 14],
    [-24, 30],
    [-8, 8],
    [-30, -8],
    [-62, -20],
    [-80, 4],
    [-110, -6],
    [-150, -16],
  ],
);

export const ENZYME_RADII: number[] = ENZYME_REST.map((_, i) => {
  if (i === 0 || i === LIP_BOT) return 16; // lips
  if (i >= 1 && i < LIP_BOT) return 70; // body: big radii = organic
  const pocketIndex = i - LIP_BOT - 1;
  if (pocketIndex === 5) return 12; // tip
  if (pocketIndex === 2 || pocketIndex === 8) return 6; // teeth
  return 7;
});

/** Indices of the pocket walls (for the active-site highlight), lower lip → upper lip. */
export const POCKET_INDICES = [
  LIP_BOT,
  ...POCKET_REST.map((_, i) => LIP_BOT + 1 + i),
  0,
];

// --- The folded amino-acid chain inside the enzyme ---------------------------

/**
 * The folded chain: a single path that fills the whole globule, so the enzyme
 * reads as "one long chain, packed tight". Built by walking around a random
 * spanning tree on a coarse grid (a classic space-filling-curve trick), then
 * wobbled slightly so it looks organic rather than machine-made.
 */
export const foldedChain = (seed: number, cell = 46): Pt[] => {
  const rand = rng(seed);
  const poly = ENZYME_REST;
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const cols = Math.ceil((Math.max(...xs) - x0) / cell);
  const rows = Math.ceil((Math.max(...ys) - y0) / cell);
  const key = (c: number, r: number) => r * cols + c;
  const centre = (c: number, r: number): Pt => [x0 + (c + 0.5) * cell, y0 + (r + 0.5) * cell];
  const ok = new Set<number>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = centre(c, r);
      if (pointInPolygon(p, poly) && distToPolygon(p, poly) > cell * 0.55) ok.add(key(c, r));
    }
  }
  // Largest connected component, grown as a random spanning tree.
  const dirs: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const start = [...ok][Math.floor(ok.size / 2)];
  const inTree = new Set<number>([start]);
  const edges = new Set<string>();
  const frontier: [number, number][] = [];
  const pushFrontier = (k: number) => {
    const c = k % cols;
    const r = Math.floor(k / cols);
    for (const [dc, dr] of dirs) {
      const nk = key(c + dc, r + dr);
      if (c + dc >= 0 && c + dc < cols && ok.has(nk) && !inTree.has(nk)) frontier.push([k, nk]);
    }
  };
  pushFrontier(start);
  while (frontier.length) {
    const [a, b] = frontier.splice(Math.floor(rand() * frontier.length), 1)[0];
    if (inTree.has(b)) continue;
    inTree.add(b);
    edges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    pushFrontier(b);
  }
  const has = (a: number, b: number) => edges.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
  // Each tree cell → 4 sub-nodes (0 TL, 1 TR, 2 BR, 3 BL); every sub-node gets degree 2.
  const adj = new Map<string, string[]>();
  const link = (u: string, v: string) => {
    adj.set(u, [...(adj.get(u) ?? []), v]);
    adj.set(v, [...(adj.get(v) ?? []), u]);
  };
  for (const k of inTree) {
    const c = k % cols;
    const r = Math.floor(k / cols);
    const n = key(c, r - 1);
    const e = key(c + 1, r);
    const s = key(c, r + 1);
    const w = key(c - 1, r);
    const N = inTree.has(n) && has(k, n);
    const E = c + 1 < cols && inTree.has(e) && has(k, e);
    const S = inTree.has(s) && has(k, s);
    const Wd = c - 1 >= 0 && inTree.has(w) && has(k, w);
    if (!N) link(`${k}:0`, `${k}:1`);
    if (!E) link(`${k}:1`, `${k}:2`);
    if (!S) link(`${k}:2`, `${k}:3`);
    if (!Wd) link(`${k}:3`, `${k}:0`);
    if (E) {
      link(`${k}:1`, `${e}:0`);
      link(`${k}:2`, `${e}:3`);
    }
    if (S) {
      link(`${k}:3`, `${s}:0`);
      link(`${k}:2`, `${s}:1`);
    }
  }
  const pos = (id: string): Pt => {
    const [ks, qs] = id.split(":");
    const k = Number(ks);
    const q = Number(qs);
    const [cx, cy] = centre(k % cols, Math.floor(k / cols));
    const o = cell / 4;
    return [cx + (q === 1 || q === 2 ? o : -o), cy + (q >= 2 ? o : -o)];
  };
  // Walk the cycle.
  const first = `${start}:0`;
  const order: string[] = [first];
  let prev = "";
  let cur = first;
  for (let guard = 0; guard < adj.size + 2; guard++) {
    const nb = (adj.get(cur) ?? []).find((v) => v !== prev);
    if (!nb || nb === first) break;
    order.push(nb);
    prev = cur;
    cur = nb;
  }
  // Subdivide, wobble, then relax (Laplacian smoothing) so the right angles
  // melt into soft loops — a packed noodle, not a maze.
  let pts: Pt[] = [];
  for (let i = 0; i < order.length; i++) {
    const a = pos(order[i]);
    const b = pos(order[(i + 1) % order.length]);
    for (let s = 0; s < 2; s++) {
      const t = s / 2;
      pts.push([
        a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * 9,
        a[1] + (b[1] - a[1]) * t + (rand() - 0.5) * 9,
      ]);
    }
  }
  for (let it = 0; it < 4; it++) {
    pts = pts.map((p, i) => {
      const q = pts[(i - 1 + pts.length) % pts.length];
      const r = pts[(i + 1) % pts.length];
      return [p[0] * 0.4 + (q[0] + r[0]) * 0.3, p[1] * 0.4 + (q[1] + r[1]) * 0.3] as Pt;
    });
  }
  return pts;
};

/** Where each amino acid goes when the chain is stretched out. */
export const unfoldedChain = (n: number, width = 1300): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const x = -width / 2 + (i / (n - 1)) * width;
    return [x, Math.sin(x / 85) * 46 + Math.sin(x / 31 + 1) * 16] as Pt;
  });

/** Pairs of chain points that are close in space but far apart along the chain: weak bonds. */
export const weakBonds = (chain: readonly Pt[], max = 30): [number, number][] => {
  const pairs: [number, number][] = [];
  const stride = Math.max(5, Math.floor(chain.length / 45));
  for (let i = 0; i < chain.length; i += stride) {
    for (let j = i + 25; j < chain.length; j += 3) {
      const d = Math.hypot(chain[i][0] - chain[j][0], chain[i][1] - chain[j][1]);
      if (d > 12 && d < 24) {
        pairs.push([i, j]);
        break;
      }
    }
    if (pairs.length >= max) break;
  }
  return pairs;
};
