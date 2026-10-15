/**
 * Helpers for the leaf cross-section in S09 (second half) and S10 (all of it). Both scenes draw the shared
 * `LeafSection` at `layout.ts` SECTION, so the cut between them is seamless; this file adds what the two
 * scenes draw on top of it: the cell layout (to tint the air spaces, outline cells and route gases through
 * real gaps), the left label column, and small glyphs (drops, dots, amino acids, sub-lines).
 *
 * The cell layout mirrors `components/bio/LeafSection.tsx` exactly (same seed, same order of random calls).
 * If that component's layout ever changes, update `SEC_LAYOUT` here too (the S09/S10 QA frames show it at once:
 * the outlines would no longer sit on the cells).
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { Label } from "../../../../components/Label";
import { leafSectionAnchors, leafSectionPaths } from "../../../../components/bio";
import { mix } from "../../../../components/kit";
import { useSvgId } from "../../../../components/ids";
import { Pt, rng, smoothClosedPath } from "../../../../lib/geometry";
import { SECTION } from "../layout";

// ------------------------------------------------------------------ geometry (mirrors LeafSection)
const BASE_W = 1500;
export const SEC_S = SECTION.w / BASE_W;
/** Local band edges (LeafSection units, 1500 wide). */
export const SEC_Y = { cutTop: 0, upTop: 12, upBot: 66, palTop: 72, palBot: 272, spTop: 276, spBot: 452, loTop: 456, loBot: 500, cutBot: 508 } as const;
export const SEC_BUNDLE = { x: 760, y: 352, r: 96 } as const;
export const SEC_STOMATA = [330, 1110, 1360] as const;
/** Section height on screen. */
export const SEC_H = SEC_Y.cutBot * SEC_S;
/** LeafSection-local → screen. */
export const secP = (lx: number, ly: number): Pt => [SECTION.x + lx * SEC_S, SECTION.y + ly * SEC_S];
export const ANCH = leafSectionAnchors(SECTION.x, SECTION.y, SECTION.w);
export const PATHS = leafSectionPaths(SECTION.x, SECTION.y, SECTION.w);

type Blob = { x: number; y: number; rx: number; ry: number; seed: number };
type PalCell = { x: number; w: number; top: number; bot: number };

export const SEC_LAYOUT = (() => {
  const r = rng(61);
  const pal: PalCell[] = [];
  for (let x = 6; x + 56 < BASE_W; x += 62) {
    const cx = x + 28;
    const dx = Math.abs(cx - SEC_BUNDLE.x);
    const bot = dx < SEC_BUNDLE.r + 20 ? Math.min(SEC_Y.palBot, SEC_BUNDLE.y - Math.sqrt(Math.max(0, (SEC_BUNDLE.r + 18) ** 2 - dx * dx)) - 6) : SEC_Y.palBot - r() * 6;
    pal.push({ x, w: 56, top: SEC_Y.palTop + r() * 4, bot });
  }
  const sp: Blob[] = [];
  let k = 0;
  for (let row = 0; row < 2; row++) {
    for (let x = 40 + row * 46; x < BASE_W - 20; x += 96) {
      const bx = x + (r() - 0.5) * 24;
      const by = (row === 0 ? 322 : 408) + (r() - 0.5) * 16;
      if (Math.hypot(bx - SEC_BUNDLE.x, by - SEC_BUNDLE.y) < SEC_BUNDLE.r + 42) continue;
      if (row === 1 && SEC_STOMATA.some((s) => Math.abs(s - bx) < 62)) continue;
      sp.push({ x: bx, y: by, rx: 34 + r() * 10, ry: 26 + r() * 9, seed: k++ });
    }
  }
  return { pal, sp };
})();

export const blobPath = (b: Blob, k = 1) => {
  const pts: Pt[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const n = 1 + noise2D(`sp${b.seed}`, Math.cos(a), Math.sin(a)) * 0.16;
    pts.push([b.x + Math.cos(a) * b.rx * n * k, b.y + Math.sin(a) * b.ry * n * k]);
  }
  return smoothClosedPath(pts, 0.55);
};

/** Centre of a palisade cell / spongy cell on screen. */
export const palCentre = (i: number): Pt => {
  const c = SEC_LAYOUT.pal[i];
  return secP(c.x + c.w / 2, (c.top + c.bot) / 2);
};
export const spCentre = (i: number): Pt => {
  const b = SEC_LAYOUT.sp[i];
  return secP(b.x, b.y);
};

/** Children in LeafSection-local units, with the section's own soft left/right edge fade. */
export const SecLocal: React.FC<{ readonly children: React.ReactNode; readonly opacity?: number; readonly fade?: boolean }> = ({ children, opacity = 1, fade = true }) => {
  const id = useSvgId("secl");
  if (opacity <= 0) return null;
  return (
    <g transform={`translate(${SECTION.x} ${SECTION.y}) scale(${SEC_S})`} opacity={opacity}>
      {fade ? (
        <defs>
          <linearGradient id={`${id}-e`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.045" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.955" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-20} y={-60} width={BASE_W + 40} height={SEC_Y.cutBot + 120}>
            <rect x={-20} y={-60} width={BASE_W + 40} height={SEC_Y.cutBot + 120} fill={`url(#${id}-e)`} />
          </mask>
        </defs>
      ) : null}
      <g mask={fade ? `url(#${id}-m)` : undefined}>{children}</g>
    </g>
  );
};

// ------------------------------------------------------------------ overlays on the section
/** The air spaces: the gaps between the mesophyll cells, tinted ice (air). `p` 0..1. */
export const AirTint: React.FC<{ readonly p: number; readonly color?: string }> = ({ p, color = C.ice }) => {
  const id = useSvgId("air");
  if (p <= 0) return null;
  const L = SEC_LAYOUT;
  return (
    <SecLocal>
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={BASE_W} height={SEC_Y.cutBot}>
          <rect x={0} y={SEC_Y.palTop + 30} width={BASE_W} height={SEC_Y.loTop - SEC_Y.palTop - 30} fill="#fff" />
          {L.pal.map((c, i) => (
            <rect key={i} x={c.x - 1.5} y={c.top - 1.5} width={c.w + 3} height={c.bot - c.top + 3} rx={24} fill="#000" />
          ))}
          {L.sp.map((b, i) => (
            <path key={`s${i}`} d={blobPath(b)} fill="#000" stroke="#000" strokeWidth={4} />
          ))}
          <circle cx={SEC_BUNDLE.x} cy={SEC_BUNDLE.y} r={SEC_BUNDLE.r + 3} fill="#000" />
        </mask>
      </defs>
      <rect x={0} y={0} width={BASE_W} height={SEC_Y.cutBot} fill={color} opacity={0.26 * p} mask={`url(#${id}-m)`} />
    </SecLocal>
  );
};

/** Glowing outlines on spongy cells (their surface, facing the air spaces). */
export const SpongyOutlines: React.FC<{ readonly p: number; readonly color?: string; readonly only?: readonly number[] }> = ({ p, color = C.ice, only }) => {
  const id = useSvgId("spo");
  if (p <= 0) return null;
  const cells = SEC_LAYOUT.sp.filter((_, i) => !only || only.includes(i));
  return (
    <SecLocal>
      <defs>
        <filter id={`${id}-b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <g opacity={p}>
        {cells.map((b, i) => (
          <path key={`g${i}`} d={blobPath(b)} fill="none" stroke={color} strokeWidth={9} opacity={0.45} filter={`url(#${id}-b)`} />
        ))}
        {cells.map((b, i) => (
          <path key={i} d={blobPath(b)} fill="none" stroke={mix(color, C.paper, 0.35)} strokeWidth={3.5} />
        ))}
      </g>
    </SecLocal>
  );
};

/** Bright outline on palisade cells; `glow(i)` 0..1 per cell. */
export const PalisadeOutlines: React.FC<{ readonly glow: (i: number) => number; readonly color?: string }> = ({ glow, color = C.paper }) => {
  const id = useSvgId("pao");
  const cells = SEC_LAYOUT.pal.map((c, i) => ({ c, g: glow(i) })).filter((x) => x.g > 0.01);
  if (!cells.length) return null;
  return (
    <SecLocal>
      <defs>
        <filter id={`${id}-b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {cells.map(({ c, g }, i) => (
        <g key={i} opacity={g}>
          <rect x={c.x} y={c.top} width={c.w} height={c.bot - c.top} rx={24} fill="none" stroke={color} strokeWidth={10} opacity={0.4} filter={`url(#${id}-b)`} />
          <rect x={c.x} y={c.top} width={c.w} height={c.bot - c.top} rx={24} fill="none" stroke={color} strokeWidth={4} />
        </g>
      ))}
    </SecLocal>
  );
};

/** A soft band of light sweeping down the layers ("layer by layer, from the top"). `y` = local centre. */
export const LayerSweep: React.FC<{ readonly y: number; readonly opacity: number }> = ({ y, opacity }) => {
  const id = useSvgId("swp");
  if (opacity <= 0) return null;
  const h = 120;
  return (
    <SecLocal>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0} />
          <stop offset="0.5" stopColor={C.paper} stopOpacity={0.42} />
          <stop offset="1" stopColor={C.paper} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect x={0} y={0} width={BASE_W} height={SEC_Y.cutBot} />
        </clipPath>
      </defs>
      <rect x={0} y={y - h / 2} width={BASE_W} height={h} fill={`url(#${id}-g)`} opacity={opacity} clipPath={`url(#${id}-c)`} />
    </SecLocal>
  );
};

/** Soft highlight over one band of the section (used in the recap so each named layer lights up). */
export const BandGlow: React.FC<{ readonly y0: number; readonly y1: number; readonly p: number; readonly color?: string }> = ({ y0, y1, p, color = C.paper }) => {
  if (p <= 0) return null;
  return (
    <SecLocal>
      <rect x={0} y={y0} width={BASE_W} height={y1 - y0} rx={8} fill={color} opacity={0.16 * p} />
    </SecLocal>
  );
};

// ------------------------------------------------------------------ continuity S09 → S10
/** S09 ends (and S10 starts) with the palisade in focus at this strength and its chloroplasts glowing this much. */
export const FOCUS_MAX = 0.8;
export const END_GLOW = 0.85;

// ------------------------------------------------------------------ the label column
/** Column labels: text right-aligned at SECTION.labelX (+4), leader lines into the section. */
export const COL_AT_X = SECTION.labelX + 18;
export const COL_SIZE = 42;

export type ColKey = "cuticle" | "upper" | "palisade" | "spongy" | "air" | "lower" | "stomata";
export const COL: Record<ColKey, { readonly text: string; readonly y: number; readonly anchor: Pt; readonly color: string }> = {
  cuticle: { text: "waxy cuticle", y: 236, anchor: secP(155, 6), color: C.paper },
  upper: { text: "upper epidermis", y: 330, anchor: secP(210, 40), color: C.paper },
  palisade: { text: "palisade mesophyll", y: 440, anchor: palCentre(3), color: C.leafLight },
  spongy: { text: "spongy mesophyll", y: 560, anchor: spCentre(1), color: C.leafLight },
  air: { text: "air spaces", y: 658, anchor: secP(372, 418), color: C.ice },
  lower: { text: "lower epidermis", y: 745, anchor: secP(165, 478), color: C.paper },
  stomata: { text: "stomata", y: 835, anchor: secP(SEC_STOMATA[0], 476), color: C.paper },
};

export const ColLabel: React.FC<{ readonly k: ColKey; readonly progress: number; readonly opacity?: number }> = ({ k, progress, opacity = 1 }) => {
  const c = COL[k];
  return <Label anchor={c.anchor} at={[COL_AT_X, c.y]} text={c.text} align="end" color={c.color} size={COL_SIZE} progress={progress} opacity={opacity} />;
};

/** n-th sub-line under a column label (n = 1, 2). */
export const colSubY = (k: ColKey, n: number) => COL[k].y + COL_SIZE * 0.34 + 46 * n;

// ------------------------------------------------------------------ text bits
/** A second line under a label, arriving on its own cue (matches the Label's sub-text style). */
export const SubLine: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly color?: string;
  readonly p: number;
  readonly anchor?: "start" | "middle" | "end";
  readonly opacity?: number;
  readonly weight?: number;
  readonly size?: number;
}> = ({ x, y, text, color = C.ink300, p, anchor = "start", opacity = 1, weight = 400, size = 40 }) => {
  if (p <= 0 || opacity <= 0) return null;
  const dx = (1 - EASE.out(Math.min(1, p))) * (anchor === "end" ? 12 : anchor === "start" ? -12 : 0);
  return (
    <text
      x={x + dx}
      y={y}
      textAnchor={anchor}
      fontFamily={FONT}
      fontWeight={weight}
      fontSize={size}
      fill={color}
      stroke={C.ink900}
      strokeWidth={6}
      strokeOpacity={0.6}
      paintOrder="stroke"
      opacity={Math.min(1, p) * opacity}
    >
      {text}
    </text>
  );
};

/** One label with several leader lines (e.g. "guard cells": one line to each cell of the pair). */
export const ForkLabel: React.FC<{
  readonly anchors: readonly Pt[];
  /** where the lines meet, just above (or beside) the text */
  readonly join: Pt;
  readonly text: string;
  /** text baseline position */
  readonly textAt: Pt;
  readonly align?: "start" | "middle" | "end";
  readonly color?: string;
  readonly size?: number;
  readonly progress: number;
  readonly opacity?: number;
}> = ({ anchors, join, text, textAt, align = "middle", color = C.paper, size = 44, progress, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const line = Math.min(1, progress / 0.55);
  const dot = Math.min(1, progress / 0.2);
  const txt = Math.max(0, Math.min(1, (progress - 0.35) / 0.65));
  return (
    <g opacity={opacity}>
      {anchors.map((a, i) => (
        <g key={i}>
          <circle cx={a[0]} cy={a[1]} r={7 * dot} fill={color} />
          <circle cx={a[0]} cy={a[1]} r={14 * dot} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={2} />
          <line x1={a[0]} y1={a[1]} x2={a[0] + (join[0] - a[0]) * line} y2={a[1] + (join[1] - a[1]) * line} stroke={color} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
      <text
        x={textAt[0]}
        y={textAt[1] + (1 - EASE.out(txt)) * 10}
        textAnchor={align}
        fontFamily={FONT}
        fontWeight={600}
        fontSize={size}
        fill={color}
        stroke={C.ink900}
        strokeWidth={8}
        strokeOpacity={0.6}
        paintOrder="stroke"
        letterSpacing={-0.5}
        opacity={txt}
      >
        {text}
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ small glyphs
/** A glowing dot (water in the xylem = ice; light energy = sun). */
export const GlowDot: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly color: string; readonly opacity?: number; readonly gid: string }> = ({
  x,
  y,
  r = 7,
  color,
  opacity = 1,
  gid,
}) => {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r * 2} fill={color} opacity={0.4} filter={`url(#${gid}-soft)`} />
      <circle cx={x} cy={y} r={r} fill={mix(color, C.paper, 0.35)} />
    </g>
  );
};

/** A water drop (teardrop, point up). `squash` flattens it against a surface. */
export const Drop: React.FC<{ readonly x: number; readonly y: number; readonly s?: number; readonly squash?: number; readonly opacity?: number }> = ({ x, y, s = 1, squash = 0, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const sx = s * (1 + 0.35 * squash);
  const sy = s * (1 - 0.3 * squash);
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`} opacity={opacity}>
      <path d="M0,-15 C5,-7 10,-1 10,5 C10,11 5.5,15 0,15 C-5.5,15 -10,11 -10,5 C-10,-1 -5,-7 0,-15 Z" fill={C.ice} />
      <path d="M-4.5,2 C-4.5,-1 -2.5,-4 -1,-6" fill="none" stroke={C.paper} strokeOpacity={0.75} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
};

/** A single amino acid (one bead of S08's amino-acid chain). */
export const AminoBead: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly color?: string; readonly opacity?: number }> = ({ x, y, r = 8, color = C.violet, opacity = 1 }) => {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={mix(color, C.ink800, 0.25)} />
      <circle cx={x - r * 0.15} cy={y - r * 0.15} r={r * 0.78} fill={mix(color, C.paper, 0.3)} />
      <circle cx={x} cy={y} r={r - 1} fill="none" stroke={C.paper} strokeOpacity={0.5} strokeWidth={1.6} strokeDasharray={`${r * 1.1} ${r * 9}`} transform={`rotate(200 ${x} ${y})`} />
    </g>
  );
};

/** Point along a polyline at fraction t (by length). */
export const alongPts = (pts: readonly Pt[], t: number): Pt => {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = segs[i] === 0 ? 0 : Math.min(1, d / segs[i]);
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};

/** Catmull–Rom sampled curve through points (so molecules follow smooth routes). */
export const smoothPts = (pts: readonly Pt[], per = 12): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

/** Shared soft-blur filter for glows (`${gid}-soft`). */
export const SoftDefs: React.FC<{ readonly gid: string }> = ({ gid }) => (
  <defs>
    <filter id={`${gid}-soft`} x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation={6} />
    </filter>
  </defs>
);
