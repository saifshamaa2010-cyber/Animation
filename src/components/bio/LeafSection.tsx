import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../brand/tokens";
import { Pt, rng, smoothClosedPath } from "../../lib/geometry";
import { mix } from "../kit/shared";
import { useSvgId } from "../ids";

/**
 * Cross-section of a dicot leaf (Cambridge IGCSE 0610 §6.2): cuticle, upper epidermis, palisade
 * mesophyll, spongy mesophyll with air spaces, a vascular bundle (xylem above, phloem below),
 * lower epidermis with stomata and guard cells. Simplified but correct in proportion and order.
 *
 * Coordinates: (x, y) = top-left of the slice, `w` = its width; height = 0.34 × w.
 * Use `leafSectionAnchors` for label anchor points and `leafSectionPaths` for gas/water routes.
 */

export const LEAF_LAYERS = ["cuticle", "upper", "palisade", "spongy", "bundle", "lower", "stomata"] as const;
export type LeafLayer = (typeof LEAF_LAYERS)[number];

const BASE_W = 1500;
// layer bands in local units (BASE_W wide)
const Y = { cutTop: 0, upTop: 12, upBot: 66, palTop: 72, palBot: 272, spTop: 276, spBot: 452, loTop: 456, loBot: 500, cutBot: 508 } as const;
const BUNDLE = { x: 760, y: 352, r: 96 };
const STOMATA = [330, 1110, 1360];
export const LEAF_SECTION_H = 0.34;

type Blob = { x: number; y: number; rx: number; ry: number; seed: number };

const layout = (() => {
  const r = rng(61);
  // palisade: tall cells side by side; shorter above the vein
  const pal: { x: number; w: number; top: number; bot: number }[] = [];
  for (let x = 6; x + 56 < BASE_W; x += 62) {
    const cx = x + 28;
    const dx = Math.abs(cx - BUNDLE.x);
    const bot = dx < BUNDLE.r + 20 ? Math.min(Y.palBot, BUNDLE.y - Math.sqrt(Math.max(0, (BUNDLE.r + 18) ** 2 - dx * dx)) - 6) : Y.palBot - r() * 6;
    pal.push({ x, w: 56, top: Y.palTop + r() * 4, bot });
  }
  // spongy: irregular, loosely packed, with air spaces; nothing directly above a stoma
  const sp: Blob[] = [];
  let k = 0;
  for (let row = 0; row < 2; row++) {
    for (let x = 40 + row * 46; x < BASE_W - 20; x += 96) {
      const bx = x + (r() - 0.5) * 24;
      const by = (row === 0 ? 322 : 408) + (r() - 0.5) * 16;
      if (Math.hypot(bx - BUNDLE.x, by - BUNDLE.y) < BUNDLE.r + 42) continue;
      if (row === 1 && STOMATA.some((s) => Math.abs(s - bx) < 62)) continue;
      sp.push({ x: bx, y: by, rx: 34 + r() * 10, ry: 26 + r() * 9, seed: k++ });
    }
  }
  // epidermis cells (flat bricks), leaving gaps for stomata in the lower one
  const upper: { x: number; w: number }[] = [];
  for (let x = 4; x < BASE_W - 30; ) {
    const w = 84 + r() * 34;
    upper.push({ x, w: Math.min(w, BASE_W - 4 - x) });
    x += w + 4;
  }
  const lower: { x: number; w: number }[] = [];
  for (let x = 4; x < BASE_W - 30; ) {
    let w = 70 + r() * 40;
    const hit = STOMATA.find((s) => x < s + 40 && x + w > s - 40);
    if (hit !== undefined) {
      if (x < hit - 40) w = hit - 40 - x - 4;
      else {
        x = hit + 44;
        continue;
      }
    }
    if (w > 18) lower.push({ x, w: Math.min(w, BASE_W - 4 - x) });
    x += w + 4;
  }
  // vascular bundle: xylem (big, empty, thick-walled) on top, phloem (small) below
  const xylem: Blob[] = [];
  const phloem: Blob[] = [];
  const xyl: Pt[] = [[-40, -38], [-6, -50], [30, -36], [-24, -6], [12, -12], [46, -6], [-50, -2]];
  xyl.forEach(([dx, dy], i) => xylem.push({ x: BUNDLE.x + dx, y: BUNDLE.y + dy, rx: 15 + (i % 3) * 3, ry: 15 + (i % 3) * 3, seed: i }));
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.12 + (i / 10) * 0.76);
    const rr = 32 + (i % 2) * 18;
    phloem.push({ x: BUNDLE.x + Math.cos(a) * rr, y: BUNDLE.y + 22 + Math.sin(a) * rr * 0.75, rx: 8 + (i % 3), ry: 8 + (i % 3), seed: 20 + i });
  }
  // chloroplasts: around the edges of palisade cells (most) and spongy cells (fewer)
  const chl: { x: number; y: number; rot: number; layer: "palisade" | "spongy" }[] = [];
  pal.forEach((c) => {
    const n = Math.max(2, Math.floor((c.bot - c.top) / 34));
    for (let j = 0; j < n; j++) {
      const yy = c.top + 22 + (j * (c.bot - c.top - 40)) / Math.max(1, n - 1);
      chl.push({ x: c.x + 12, y: yy + (r() - 0.5) * 6, rot: 90 + (r() - 0.5) * 30, layer: "palisade" });
      chl.push({ x: c.x + c.w - 12, y: yy + 14 + (r() - 0.5) * 6, rot: 90 + (r() - 0.5) * 30, layer: "palisade" });
    }
  });
  sp.forEach((b) => {
    for (let j = 0; j < 3; j++) {
      const a = (j / 3) * Math.PI * 2 + r();
      chl.push({ x: b.x + Math.cos(a) * b.rx * 0.68, y: b.y + Math.sin(a) * b.ry * 0.62, rot: (a * 180) / Math.PI + 90, layer: "spongy" });
    }
  });
  return { pal, sp, upper, lower, xylem, phloem, chl };
})();

const blobPath = (b: Blob, k = 1) => {
  const pts: Pt[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const n = 1 + noise2D(`sp${b.seed}`, Math.cos(a), Math.sin(a)) * 0.16;
    pts.push([b.x + Math.cos(a) * b.rx * n * k, b.y + Math.sin(a) * b.ry * n * k]);
  }
  return smoothClosedPath(pts, 0.55);
};

/** Points (screen space) to hang labels on. */
export const leafSectionAnchors = (x: number, y: number, w: number) => {
  const s = w / BASE_W;
  const P = (lx: number, ly: number): Pt => [x + lx * s, y + ly * s];
  const pal = layout.pal[4];
  const sp = layout.sp[2];
  return {
    cuticle: P(220, 5),
    upperEpidermis: P(560, 40),
    palisade: P(pal.x + pal.w / 2, (pal.top + pal.bot) / 2),
    chloroplast: P(layout.pal[6].x + 12, layout.pal[6].top + 56),
    spongy: P(sp.x, sp.y),
    airSpace: P(STOMATA[0], 420),
    vascularBundle: P(BUNDLE.x + BUNDLE.r * 0.7, BUNDLE.y - BUNDLE.r * 0.7),
    xylem: P(BUNDLE.x - 6, BUNDLE.y - 40),
    phloem: P(BUNDLE.x, BUNDLE.y + 52),
    lowerEpidermis: P(700, 478),
    stoma: P(STOMATA[0], 478),
    guardCell: P(STOMATA[0] - 17, 478),
    stomata: STOMATA.map((sx) => P(sx, 478)),
  };
};

/** Routes (screen space) for animating gases and water through the leaf. */
export const leafSectionPaths = (x: number, y: number, w: number) => {
  const s = w / BASE_W;
  const P = (lx: number, ly: number): Pt => [x + lx * s, y + ly * s];
  const st = STOMATA[0];
  return {
    /** from below the leaf, in through a stoma, across the air space, into a palisade cell */
    co2In: [P(st - 40, 640), P(st, 520), P(st, 478), P(st + 10, 420), P(st + 60, 340), P(st + 90, 240)],
    /** the reverse, from a palisade cell out through the stoma */
    o2Out: [P(st - 60, 230), P(st - 40, 330), P(st - 8, 420), P(st, 478), P(st + 20, 540), P(st + 60, 660)],
    /** water: from the xylem up into the palisade cells */
    water: [P(BUNDLE.x - 6, BUNDLE.y - 40), P(BUNDLE.x - 60, 250), P(BUNDLE.x - 150, 180), P(BUNDLE.x - 210, 120)],
    /** sucrose: from the cells into the phloem */
    sucrose: [P(BUNDLE.x + 210, 330), P(BUNDLE.x + 130, 370), P(BUNDLE.x + 30, BUNDLE.y + 50)],
    /** light: from above, through the transparent cuticle and epidermis */
    light: (i: number): [Pt, Pt] => [P(200 + i * 110, -220), P(240 + i * 110, 150 + (i % 3) * 30)],
  };
};

export type LeafSectionProps = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  /** 0..1 build-up, top layer first. Ignored for layers given explicitly in `layers`. */
  readonly reveal?: number;
  /** Per-layer visibility 0..1 (overrides `reveal`). */
  readonly layers?: Partial<Record<LeafLayer, number>>;
  /** Spotlight one layer (others dim) — 0..1 strength. */
  readonly focus?: LeafLayer | null;
  readonly focusAmount?: number;
  /** 0 = stomata closed, 1 = fully open. */
  readonly stomataOpen?: number;
  /** 0..1 chloroplasts glow (light energy being absorbed). */
  readonly chloroGlow?: number;
  readonly opacity?: number;
};

const LAYER_WINDOWS: Record<LeafLayer, [number, number]> = {
  cuticle: [0, 0.12],
  upper: [0.08, 0.26],
  palisade: [0.2, 0.46],
  spongy: [0.4, 0.66],
  bundle: [0.56, 0.8],
  lower: [0.7, 0.9],
  stomata: [0.82, 1],
};

export const LeafSection: React.FC<LeafSectionProps> = ({
  x,
  y,
  w,
  reveal = 1,
  layers = {},
  focus = null,
  focusAmount = 0,
  stomataOpen = 0.7,
  chloroGlow = 0,
  opacity = 1,
}) => {
  const id = useSvgId("lsec");
  if (opacity <= 0) return null;
  const s = w / BASE_W;
  const vis = (l: LeafLayer) => {
    const v = layers[l];
    if (v !== undefined) return v;
    const [a, b] = LAYER_WINDOWS[l];
    return EASE.out(Math.max(0, Math.min(1, (reveal - a) / (b - a))));
  };
  const dim = (l: LeafLayer) => (focus && l !== focus ? 1 - 0.68 * focusAmount : 1);
  const lit = (l: LeafLayer) => (focus === l ? focusAmount : 0);
  const op = (l: LeafLayer) => vis(l) * dim(l);
  const wall = mix(C.leafLight, C.paper, 0.2);
  const clearCell = mix(C.ink700, C.glass, 0.18);

  const chloro = (c: (typeof layout.chl)[number], i: number) => (
    <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
      {chloroGlow > 0 ? <ellipse rx={20} ry={14} fill={C.sun} opacity={0.5 * chloroGlow} filter={`url(#${id}-glow)`} /> : null}
      <ellipse rx={11} ry={6.5} fill={`url(#${id}-chl)`} />
      {chloroGlow > 0 ? <ellipse rx={11} ry={6.5} fill={mix(C.leafLight, C.sun, 0.35)} opacity={0.6 * chloroGlow} /> : null}
      <line x1={-4} y1={-3} x2={-4} y2={3} stroke={C.leafDark} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <line x1={3} y1={-3} x2={3} y2={3} stroke={C.leafDark} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
    </g>
  );

  // a stoma: two sausage-shaped guard cells either side of a pore; they bow apart to open it
  const guard = (sx: number, i: number) => {
    const gap = 4 + 16 * stomataOpen;
    const cy = (Y.loTop + Y.loBot) / 2;
    return (
      <g key={i}>
        <rect x={sx - gap / 2 - 2} y={Y.loTop - 2} width={gap + 4} height={Y.loBot - Y.loTop + 4} fill={C.ink950} opacity={0.9} />
        {[-1, 1].map((side) => {
          const gx = sx + side * (gap / 2 + 17);
          return (
            <g key={side}>
              <ellipse cx={gx} cy={cy} rx={17} ry={27} fill={mix(C.leaf, C.leafDeep, 0.35)} stroke={wall} strokeOpacity={0.75 + 0.25 * lit("stomata")} strokeWidth={3} />
              {/* thick inner wall next to the pore */}
              <path d={`M${gx - side * 13},${cy - 20} Q${gx - side * 19},${cy} ${gx - side * 13},${cy + 20}`} fill="none" stroke={C.paper} strokeOpacity={0.75} strokeWidth={5} strokeLinecap="round" />
              <ellipse cx={gx + side * 4} cy={cy - 9} rx={5} ry={3.5} fill={C.leafDark} opacity={0.7} />
              <ellipse cx={gx + side * 4} cy={cy + 9} rx={5} ry={3.5} fill={C.leafDark} opacity={0.7} />
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-chl`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={mix(C.chloro, C.leafLight, 0.25)} />
          <stop offset="1" stopColor={C.leafDeep} />
        </linearGradient>
        <linearGradient id={`${id}-cell`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(C.leafDark, C.ink800, 0.2)} />
          <stop offset="1" stopColor={mix(C.leafDark, C.ink900, 0.5)} />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.045" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.955" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-20} y={-40} width={BASE_W + 40} height={Y.cutBot + 80}>
          <rect x={-20} y={-40} width={BASE_W + 40} height={Y.cutBot + 80} fill={`url(#${id}-edge)`} />
        </mask>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <g mask={`url(#${id}-m)`}>
        {/* the inside of the leaf: what shows through the gaps is air */}
        <rect x={0} y={Y.upBot} width={BASE_W} height={Y.loTop - Y.upBot} fill={mix(C.ink800, C.leafDark, 0.22)} opacity={Math.max(vis("palisade"), vis("spongy"))} />

        {/* cuticle (waxy, transparent) */}
        <g opacity={op("cuticle")}>
          <rect x={0} y={Y.cutTop} width={BASE_W} height={Y.upTop - Y.cutTop + 2} rx={5} fill={mix(C.paper, C.sun, 0.25)} opacity={0.55 + 0.35 * lit("cuticle")} />
          <rect x={0} y={Y.loBot - 2} width={BASE_W} height={Y.cutBot - Y.loBot + 2} rx={4} fill={mix(C.paper, C.sun, 0.25)} opacity={0.4 + 0.35 * lit("cuticle")} />
        </g>

        {/* upper epidermis: transparent cells, no chloroplasts */}
        <g opacity={op("upper")}>
          {layout.upper.map((c, i) => (
            <rect key={i} x={c.x} y={Y.upTop + 3} width={c.w} height={Y.upBot - Y.upTop - 4} rx={14} fill={clearCell} fillOpacity={0.45 + 0.25 * lit("upper")} stroke={wall} strokeOpacity={0.42 + 0.4 * lit("upper")} strokeWidth={3} />
          ))}
        </g>

        {/* palisade mesophyll */}
        <g opacity={op("palisade")}>
          {layout.pal.map((c, i) => (
            <rect key={i} x={c.x} y={c.top} width={c.w} height={c.bot - c.top} rx={24} fill={`url(#${id}-cell)`} stroke={wall} strokeOpacity={0.45 + 0.4 * lit("palisade")} strokeWidth={3} />
          ))}
          {layout.chl.filter((c) => c.layer === "palisade").map(chloro)}
        </g>

        {/* spongy mesophyll: rounder, loosely packed — the gaps are the air spaces */}
        <g opacity={op("spongy")}>
          {layout.sp.map((b, i) => (
            <path key={i} d={blobPath(b)} fill={`url(#${id}-cell)`} stroke={wall} strokeOpacity={0.45 + 0.4 * lit("spongy")} strokeWidth={3} />
          ))}
          {layout.chl.filter((c) => c.layer === "spongy").map(chloro)}
        </g>

        {/* vascular bundle: xylem (top) and phloem (bottom) inside a sheath */}
        <g opacity={op("bundle")}>
          <circle cx={BUNDLE.x} cy={BUNDLE.y} r={BUNDLE.r} fill={mix(C.ink700, C.leafDark, 0.3)} stroke={wall} strokeOpacity={0.5 + 0.4 * lit("bundle")} strokeWidth={4} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <circle key={i} cx={BUNDLE.x + Math.cos(a) * (BUNDLE.r - 13)} cy={BUNDLE.y + Math.sin(a) * (BUNDLE.r - 13)} r={11} fill={mix(C.leafDark, C.paper, 0.12)} stroke={wall} strokeOpacity={0.35} strokeWidth={2} />;
          })}
          {layout.xylem.map((b, i) => (
            <circle key={`x${i}`} cx={b.x} cy={b.y} r={b.rx} fill={C.ink900} stroke={mix(C.paper, C.ice, 0.3)} strokeOpacity={0.85} strokeWidth={5} />
          ))}
          {layout.phloem.map((b, i) => (
            <circle key={`p${i}`} cx={b.x} cy={b.y} r={b.rx} fill={mix(C.leafDark, C.amber, 0.22)} stroke={wall} strokeOpacity={0.6} strokeWidth={2.5} />
          ))}
        </g>

        {/* lower epidermis */}
        <g opacity={op("lower")}>
          {layout.lower.map((c, i) => (
            <rect key={i} x={c.x} y={Y.loTop + 2} width={c.w} height={Y.loBot - Y.loTop - 4} rx={13} fill={clearCell} fillOpacity={0.45 + 0.25 * lit("lower")} stroke={wall} strokeOpacity={0.42 + 0.4 * lit("lower")} strokeWidth={3} />
          ))}
        </g>

        {/* stomata: a pore between two guard cells */}
        <g opacity={op("stomata")}>{STOMATA.map(guard)}</g>
      </g>
    </g>
  );
};
