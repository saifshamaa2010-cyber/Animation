/**
 * Van Helmont's willow (S01 hook, S18 resolve, thumbnail).
 *
 * Built locally because the shared `bio/Willow` places its leaves on straight lines while its branches
 * are drawn as curves (the leaves float off the branches and the arches over the crown are bare).
 * Here every leaf sits exactly on the curve that is drawn, and the geometry is exposed so scenes can
 * aim carbon dioxide at real leaves, run water up the real trunk and lock glucose into the real wood.
 */
import React from "react";
import { C } from "../../../../brand/tokens";
import { LitShape, mix } from "../../../../components/kit";
import { useSvgId } from "../../../../components/ids";
import { Pt, rng } from "../../../../lib/geometry";
import type { Cam } from "../../../../lib/camera";
import { WILLOW } from "../layout";

/** Where the trunk meets the soil (centre of the pot's soil surface). */
export const WILLOW_BASE: Pt = [WILLOW.potX, WILLOW.potY + 8];

/** S01 opens slightly pulled back so the scale clears the caption band; ends framing the grown tree. S18 starts here too. */
export const START_CAM: Cam = { x: 960, y: 566, z: 0.96 };
export const END_CAM: Cam = { x: 1050, y: 512, z: 0.84 };

type Bez = readonly [Pt, Pt, Pt, Pt];
const bz = (b: Bez, t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u;
  const c = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [a * b[0][0] + c * b[1][0] + d * b[2][0] + e * b[3][0], a * b[0][1] + c * b[1][1] + d * b[2][1] + e * b[3][1]];
};
const bzTan = (b: Bez, t: number): Pt => {
  const u = 1 - t;
  return [
    3 * u * u * (b[1][0] - b[0][0]) + 6 * u * t * (b[2][0] - b[1][0]) + 3 * t * t * (b[3][0] - b[2][0]),
    3 * u * u * (b[1][1] - b[0][1]) + 6 * u * t * (b[2][1] - b[1][1]) + 3 * t * t * (b[3][1] - b[2][1]),
  ];
};
const n2 = (p: Pt) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const bzD = (b: Bez) => `M${n2(b[0])} C${n2(b[1])} ${n2(b[2])} ${n2(b[3])}`;
const dirOf = (deg: number): Pt => [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** A tapered limb outline along a Bézier (round tip). */
const taper = (b: Bez, w0: number, w1: number) => {
  const N = 12;
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = bz(b, t);
    const tg = bzTan(b, t);
    const m = Math.hypot(tg[0], tg[1]) || 1;
    const nx = -tg[1] / m;
    const ny = tg[0] / m;
    const w = w0 + (w1 - w0) * t;
    L.push([p[0] + nx * w, p[1] + ny * w]);
    R.push([p[0] - nx * w, p[1] - ny * w]);
  }
  return `M${L.map(n2).join(" L")} A${w1.toFixed(1)},${w1.toFixed(1)} 0 0 1 ${R.slice(-1).map(n2)[0]} L${R.reverse().map(n2).join(" L")} Z`;
};

export type WLeaf = { readonly x: number; readonly y: number; readonly rot: number; readonly len: number; readonly w: number; readonly fill: string; readonly op: number; readonly key: number };
export type WStrand = { readonly d: string; readonly width: number; readonly leaves: readonly WLeaf[] };
export type WillowGeo = {
  readonly g: number;
  readonly base: Pt;
  readonly trunkD: string;
  readonly trunkH: number;
  /** centre line of the trunk, t = 0 (soil) … 1 (where the limbs split) */
  readonly trunkAt: (t: number) => Pt;
  readonly trunkHalf: (t: number) => number;
  readonly crotch: Pt;
  readonly limbs: readonly { readonly d: string; readonly b: Bez }[];
  readonly back: readonly WStrand[];
  readonly front: readonly WStrand[];
  /** lowest point of the hanging curtain, and the crown's extent */
  readonly bounds: { readonly top: number; readonly left: number; readonly right: number; readonly hem: number };
  /** point along limb i (t 0..1) — the path glucose and water take through the crown */
  readonly limbAt: (i: number, t: number) => Pt;
};

const LIMBS = [
  { a: -68, L: 0.9, from: 0.9, curl: -38, w: 0.76 },
  { a: -40, L: 1.0, from: 0.97, curl: -36, w: 0.86 },
  { a: -12, L: 1.02, from: 1, curl: -18, w: 0.92 },
  { a: 2, L: 1.08, from: 1, curl: 4, w: 0.95 },
  { a: 16, L: 1.02, from: 1, curl: 20, w: 0.92 },
  { a: 42, L: 1.0, from: 0.95, curl: 36, w: 0.86 },
  { a: 68, L: 0.9, from: 0.88, curl: 40, w: 0.76 },
  { a: -86, L: 0.6, from: 0.78, curl: -22, w: 0.56 },
  { a: 84, L: 0.58, from: 0.82, curl: 24, w: 0.56 },
] as const;
const LOW = 7;

/** Pure geometry for growth g (0 = just planted … 1 = five years on). Deterministic. */
export const willowGeometry = (g: number, base: Pt = WILLOW_BASE): WillowGeo => {
  const [bx, by] = base;
  const trunkH = 64 + 262 * g;
  const bw = 4.5 + 25 * g;
  const tw = 2.6 + 12 * g;
  const Lmax = 34 + 236 * g;
  const trunkAt = (t: number): Pt => [bx + g * (8 * Math.sin(t * 2.4) - 5 * t), by - trunkH * t];
  const trunkHalf = (t: number) => tw + (bw - tw) * Math.pow(1 - clamp01(t), 1.3) + bw * 0.55 * Math.pow(1 - clamp01(t), 10);
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= 18; i++) {
    const t = (i / 18) * 1.03;
    const c = trunkAt(t);
    const h = trunkHalf(t);
    left.push([c[0] - h, c[1]]);
    right.push([c[0] + h, c[1]]);
  }
  const trunkD = `M${left.map(n2).join(" L")} L${right.reverse().map(n2).join(" L")} Z`;
  const crotch = trunkAt(1);

  const limbB: Bez[] = LIMBS.map((l) => {
    const S = trunkAt(l.from);
    const len = l.L * Lmax;
    const P1: Pt = [S[0] + dirOf(l.a)[0] * len * 0.42, S[1] + dirOf(l.a)[1] * len * 0.42];
    const P3: Pt = [S[0] + dirOf(l.a + l.curl * 0.5)[0] * len, S[1] + dirOf(l.a + l.curl * 0.5)[1] * len];
    const P2: Pt = [P3[0] - dirOf(l.a + l.curl)[0] * len * 0.3, P3[1] - dirOf(l.a + l.curl)[1] * len * 0.3];
    return [S, P1, P2, P3] as const;
  });
  const limbs = limbB.map((b, i) => ({ b, d: taper(b, (1.2 + 7.5 * g) * LIMBS[i].w + 0.6, 0.7 + 0.8 * g) }));

  // crown extent (for lighting the leaves from the top-left)
  const tops = limbB.map((b) => b[3][1]);
  const crownTop = Math.min(...tops) - 10;
  const crownMidY = (crownTop + crotch[1]) / 2;
  const crownH = Math.max(40, crotch[1] - crownTop + 60);
  const halfW = Lmax * 1.15 + 20;

  const shade = (x: number, y: number, r: number, back: boolean) => {
    const L = clamp01(0.5 + 0.6 * ((crownMidY - y) / crownH) + 0.2 * ((bx - x) / halfW) + (r - 0.5) * 0.36);
    if (back) return mix(C.leafDark, C.leafDeep, 0.15 + L * 0.85);
    return L < 0.5 ? mix(C.leafDeep, C.leaf, L * 2) : mix(C.leaf, C.leafLight, (L - 0.5) * 1.5);
  };

  const strands = (back: boolean): WStrand[] => {
    const out: WStrand[] = [];
    LIMBS.forEach((l, li) => {
      const low = li >= LOW;
      const central = Math.abs(l.a) < 30;
      const ts = low ? (back ? [0.5, 0.82] : [0.66, 1]) : back ? [0.28, 0.44, 0.6, 0.76, 0.9, 1] : [0.42, 0.58, 0.74, 0.88, 1];
      ts.forEach((t, k) => {
        const idx = li * 10 + k + (back ? 500 : 0);
        const r = rng(4000 + idx * 37);
        const A = bz(limbB[li], t);
        const tg = bzTan(limbB[li], t);
        // central limbs shed strands to both sides (filling the top of the dome); outer limbs mostly outward
        const outward = Math.sign(tg[0]) || 1;
        const o = central ? (k % 2 ? 1 : -1) : k % 3 === 2 ? -outward : outward;
        const arch = (5 + 36 * g) * (0.7 + 0.6 * r()) * (central ? 0.8 : 1.18);
        // front strands from the middle stop above the fork, so the trunk stays in view
        const hemFrac = back ? 0.44 : central ? 0.98 : 0.3;
        const hem = by - trunkH * (hemFrac + 0.3 * (1 - g)) - r() * 28 * g;
        const Ls = Math.max(10 + 8 * g, (hem - A[1]) * (0.86 + 0.26 * r()));
        const sway = (r() - 0.5) * 16 * g;
        const b: Bez = [A, [A[0] + o * arch * 0.8, A[1] - arch * 0.6], [A[0] + o * arch * 1.55, A[1] + Ls * 0.3], [A[0] + o * arch * 1.65 + sway, A[1] + Ls]];
        const nVis = (back ? 5 : 5) + 12 * g * Math.min(1, 0.45 + Ls / 260);
        const leaves: WLeaf[] = [];
        for (let j = 0; j < Math.ceil(nVis); j++) {
          const q = rng(9000 + idx * 131 + j * 7);
          const tt = Math.min(1, 0.1 + (0.9 * j) / Math.max(1, nVis - 1));
          const p = bz(b, tt);
          const tn = bzTan(b, tt);
          const side = j % 2 ? 1 : -1;
          const ang = (Math.atan2(tn[1], tn[0]) * 180) / Math.PI + side * (24 + 18 * q());
          const len = (7.5 + 16 * g) * (0.8 + 0.4 * q()) * (back ? 0.95 : 1);
          leaves.push({ x: p[0], y: p[1], rot: ang - 90, len, w: len * 0.23, fill: shade(p[0], p[1], q(), back), op: clamp01(nVis - j), key: idx * 100 + j });
        }
        out.push({ d: bzD(b), width: 0.9 + 1.5 * g, leaves });
      });
    });
    return out;
  };
  const back = strands(true);
  const front = strands(false);
  const all = [...back, ...front].flatMap((s) => s.leaves);
  const xs = all.map((p) => p.x);
  return {
    g,
    base,
    trunkD,
    trunkH,
    trunkAt,
    trunkHalf,
    crotch,
    limbs,
    back,
    front,
    bounds: { top: Math.min(crownTop, ...all.map((p) => p.y)) - 12, left: Math.min(...xs) - 14, right: Math.max(...xs) + 14, hem: Math.max(...all.map((p) => p.y)) + 14 },
    limbAt: (i, t) => bz(limbB[Math.max(0, Math.min(limbB.length - 1, i))], clamp01(t)),
  };
};

const leafD = (len: number, w: number) =>
  `M0,0 C${(w * 1.1).toFixed(1)},${(len * 0.22).toFixed(1)} ${(w * 0.9).toFixed(1)},${(len * 0.72).toFixed(1)} 0,${len.toFixed(1)} C${(-w * 0.9).toFixed(1)},${(len * 0.72).toFixed(1)} ${(-w * 1.1).toFixed(1)},${(len * 0.22).toFixed(1)} 0,0Z`;

const StrandEl: React.FC<{ s: WStrand; stem: string; tint: (c: string, key: number) => string; scaleOf: (key: number) => number }> = ({ s, stem, tint, scaleOf }) => (
  <g>
    <path d={s.d} fill="none" stroke={stem} strokeWidth={s.width} strokeLinecap="round" opacity={0.9} />
    {s.leaves.map((l) =>
      l.op > 0.01 ? (
        <path
          key={l.key}
          d={leafD(l.len * scaleOf(l.key), l.w * scaleOf(l.key))}
          transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)})`}
          fill={tint(l.fill, l.key)}
          opacity={l.op}
        />
      ) : null,
    )}
  </g>
);

export type WillowTreeProps = {
  readonly geo: WillowGeo;
  /** 0..1 per leaf (by key): a leaf flashes when carbon dioxide enters it */
  readonly glint?: (key: number) => number;
  /** 0..1: "a living tree is full of water" (ice tint through wood and leaves) */
  readonly water?: number;
  /** 0..1: the wood glows amber ("built from glucose / carbon dioxide") */
  readonly glow?: number;
  /** drawn between the wood and the front curtain (e.g. glucose locking into the trunk) */
  readonly inWood?: React.ReactNode;
  readonly opacity?: number;
};

/** The willow, back curtain → trunk and limbs → front curtain. */
export const WillowTree: React.FC<WillowTreeProps> = ({ geo, glint, water = 0, glow = 0, inWood, opacity = 1 }) => {
  const id = useSvgId("wil");
  const gl = glint ?? (() => 0);
  const tint = (c: string, key: number) => {
    let out = water > 0 ? mix(c, C.ice, 0.32 * water) : c;
    const k = gl(key);
    if (k > 0) out = mix(out, mix(C.leafLight, C.paper, 0.5), k * 0.85);
    return out;
  };
  const scaleOf = (key: number) => 1 + 0.35 * gl(key);
  const stemBack = mix(C.barkDeep, C.leafDark, 0.4);
  const stemFront = mix(C.bark, C.stem, 0.4);
  const { trunkAt, trunkHalf, g } = geo;
  const grain = [-0.45, 0.05, 0.5].map((o, i) => {
    const pts: Pt[] = Array.from({ length: 8 }, (_, k) => {
      const t = 0.06 + (k / 7) * (0.8 - i * 0.12);
      const c = trunkAt(t);
      return [c[0] + o * trunkHalf(t) * 0.8, c[1]];
    });
    return `M${pts.map(n2).join(" L")}`;
  });
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${id}-halo`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      {geo.back.map((s, i) => (
        <StrandEl key={`b${i}`} s={s} stem={stemBack} tint={tint} scaleOf={scaleOf} />
      ))}
      {glow > 0 ? (
        <g opacity={0.55 * glow} filter={`url(#${id}-halo)`}>
          <path d={geo.trunkD} fill={C.amber} />
          {geo.limbs.map((l, i) => (
            <path key={i} d={l.d} fill={C.amber} />
          ))}
        </g>
      ) : null}
      <LitShape d={geo.trunkD} top={C.bark} bottom={C.barkDeep} rimOpacity={0.45} shadow={0} slant={0.6} />
      {g > 0.2
        ? grain.map((d, i) => <path key={i} d={d} fill="none" stroke={C.barkDeep} strokeOpacity={0.45} strokeWidth={1.4 + 1.2 * g} strokeLinecap="round" />)
        : null}
      {geo.limbs.map((l, i) => (
        <LitShape key={i} d={l.d} top={C.bark} bottom={C.barkDeep} rimOpacity={0.4} shadow={0} />
      ))}
      {water > 0 ? (
        <g opacity={0.38 * water}>
          <path d={geo.trunkD} fill={C.ice} />
          {geo.limbs.map((l, i) => (
            <path key={i} d={l.d} fill={C.ice} />
          ))}
        </g>
      ) : null}
      {glow > 0 ? (
        <g opacity={0.82 * glow}>
          <path d={geo.trunkD} fill={mix(C.amber, C.amberLight, 0.25)} />
          {geo.limbs.map((l, i) => (
            <path key={i} d={l.d} fill={mix(C.amber, C.amberLight, 0.25)} />
          ))}
        </g>
      ) : null}
      {inWood}
      {geo.front.map((s, i) => (
        <StrandEl key={`f${i}`} s={s} stem={stemFront} tint={tint} scaleOf={scaleOf} />
      ))}
    </g>
  );
};

/** Front-curtain leaves on the side facing (dx sign) — targets for carbon dioxide. Stable for a fixed growth. */
export const crownTargets = (geo: WillowGeo, n: number, side: 1 | -1, seed = 3): WLeaf[] => {
  const cand = geo.front
    .flatMap((s) => s.leaves)
    .filter((l) => l.op > 0.9 && (l.x - geo.base[0]) * side > 40 && l.y < geo.crotch[1] + 40);
  const r = rng(seed);
  const out: WLeaf[] = [];
  const used = new Set<number>();
  for (let i = 0; i < n && cand.length; i++) {
    let k = Math.floor(r() * cand.length);
    for (let tries = 0; used.has(k) && tries < cand.length; tries++) k = (k + 7) % cand.length;
    used.add(k);
    out.push(cand[k]);
  }
  return out;
};
