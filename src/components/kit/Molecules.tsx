import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { Pt } from "../../lib/geometry";
import { jitter, thermalAmplitude } from "../../lib/motion";
import { useSvgId } from "../ids";
import { seg } from "./ink";
import { mix } from "./shared";

/**
 * Flat ball-and-stick glyphs. Colours follow the school (CPK) convention as far
 * as the palette allows: oxygen = coral (our red), hydrogen = paper (white).
 */
export const ATOM = {
  O: { r: 26, top: mix(C.coral, C.paper, 0.22), bottom: C.coralDeep },
  H: { r: 16, top: C.paper, bottom: mix(C.paperDim, C.ink300, 0.45) },
} as const;

type AtomKind = keyof typeof ATOM;
type Atom = { readonly k: AtomKind; readonly p: Pt };
type Bond = { readonly a: number; readonly b: number; readonly order?: 1 | 2 };

const deg = (d: number) => (d * Math.PI) / 180;
const OH = 54;
const OO = 64;

export const MOLECULES: Record<"H2O2" | "H2O" | "O2", { atoms: Atom[]; bonds: Bond[]; formula: string }> = {
  // H–O–O–H drawn as a skewed "Z": each H–O–O angle ≈ 100°.
  H2O2: {
    atoms: [
      { k: "O", p: [-OO / 2, 0] },
      { k: "O", p: [OO / 2, 0] },
      { k: "H", p: [-OO / 2 + Math.cos(deg(-100)) * OH, Math.sin(deg(-100)) * OH] },
      { k: "H", p: [OO / 2 + Math.cos(deg(80)) * OH, Math.sin(deg(80)) * OH] },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
      { a: 1, b: 3 },
    ],
    formula: "H2O2",
  },
  // Bent water, H–O–H ≈ 104.5°.
  H2O: {
    atoms: [
      { k: "O", p: [0, -10] },
      { k: "H", p: [-Math.sin(deg(52.25)) * OH, -10 + Math.cos(deg(52.25)) * OH] },
      { k: "H", p: [Math.sin(deg(52.25)) * OH, -10 + Math.cos(deg(52.25)) * OH] },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
    ],
    formula: "H2O",
  },
  // O=O double bond.
  O2: {
    atoms: [
      { k: "O", p: [-OO / 2 - 4, 0] },
      { k: "O", p: [OO / 2 + 4, 0] },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }],
    formula: "O2",
  },
};

export type MoleculeKind = keyof typeof MOLECULES;

export type MoleculeProps = {
  readonly kind: MoleculeKind;
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly rotate?: number;
  /** 0..1 arrival: grows in with an ease-out (no bounce). Default 1. */
  readonly progress?: number;
  /** Thermal jiggle (°C). Use `still` to freeze. */
  readonly temperature?: number;
  readonly still?: boolean;
  readonly seed?: number;
  /** Formula under the molecule (true = the standard one, or your own string). */
  readonly label?: boolean | string;
  readonly labelSize?: number;
  readonly labelColor?: string;
  readonly opacity?: number;
};

/** Formula with real subscripts ("H2O2" → H₂O₂) — Lexend has no subscript glyphs. */
export const Formula: React.FC<{
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly color?: string;
  readonly anchor?: "start" | "middle" | "end";
  readonly weight?: number;
  readonly opacity?: number;
}> = ({ text, x, y, size = 44, color = C.paper, anchor = "middle", weight = 600, opacity = 1 }) => {
  const parts = text.match(/(\d+|[^\d]+)/g) ?? [];
  const dy = size * 0.24;
  let lowered = false;
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={weight} fontSize={size} fill={color} opacity={opacity}>
      {parts.map((p, i) => {
        const isSub = /^\d+$/.test(p);
        const shift = isSub && !lowered ? dy : !isSub && lowered ? -dy : 0;
        lowered = isSub;
        return (
          <tspan key={i} dy={shift} fontSize={isSub ? size * 0.64 : size}>
            {p}
          </tspan>
        );
      })}
    </text>
  );
};

/** A ball-and-stick molecule glyph (H₂O₂, H₂O, O₂). */
export const Molecule: React.FC<MoleculeProps> = ({
  kind,
  x,
  y,
  scale = 1,
  rotate = 0,
  progress = 1,
  temperature = 25,
  still = false,
  seed = 1,
  label = false,
  labelSize = 44,
  labelColor = C.paper,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const id = useSvgId("mol");
  if (progress <= 0 || opacity <= 0) return null;
  const m = MOLECULES[kind];
  const j = still ? { dx: 0, dy: 0, rot: 0 } : jitter(`mol${seed}`, frame, thermalAmplitude(temperature));
  const grow = EASE.out(progress);
  const s = scale * (0.6 + 0.4 * grow);
  const stickW = 11;
  const bondsEl = m.bonds.map((b, i) => {
    const A = m.atoms[b.a].p;
    const B = m.atoms[b.b].p;
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    const offs = b.order === 2 ? [-7.5, 7.5] : [0];
    return (
      <g key={i}>
        {offs.map((o) => (
          <g key={o}>
            <line x1={A[0] + nx * o} y1={A[1] + ny * o} x2={B[0] + nx * o} y2={B[1] + ny * o} stroke={C.ink500} strokeWidth={b.order === 2 ? stickW * 0.62 : stickW} strokeLinecap="round" />
            <line
              x1={A[0] + nx * o - 0.5}
              y1={A[1] + ny * o - 1.5}
              x2={B[0] + nx * o - 0.5}
              y2={B[1] + ny * o - 1.5}
              stroke={C.ink300}
              strokeOpacity={0.7}
              strokeWidth={(b.order === 2 ? stickW * 0.62 : stickW) * 0.38}
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    );
  });
  // Draw back-to-front: H first so oxygens overlap their bonds cleanly.
  const order = m.atoms.map((a, i) => ({ a, i })).sort((p, q) => (p.a.k === q.a.k ? 0 : p.a.k === "H" ? -1 : 1));
  const formulaY = Math.max(...m.atoms.map((a) => a.p[1] + ATOM[a.k].r)) * s + labelSize * 1.15;
  return (
    <g transform={`translate(${x + j.dx * scale} ${y + j.dy * scale})`} opacity={opacity * Math.min(1, progress * 1.5)}>
      <defs>
        {(Object.keys(ATOM) as AtomKind[]).map((k) => (
          <linearGradient key={k} id={`${id}-${k}`} x1="0.15" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor={ATOM[k].top} />
            <stop offset="1" stopColor={ATOM[k].bottom} />
          </linearGradient>
        ))}
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.85} />
          <stop offset="0.4" stopColor={C.paper} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-sh`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <g transform={`rotate(${rotate + j.rot}) scale(${s})`}>
        {/* Soft shadow of the whole molecule. */}
        <g transform="translate(2 8)" opacity={0.45} filter={`url(#${id}-sh)`}>
          {m.atoms.map((a, i) => (
            <circle key={i} cx={a.p[0]} cy={a.p[1]} r={ATOM[a.k].r} fill={C.ink950} />
          ))}
        </g>
        {bondsEl}
        {order.map(({ a, i }) => {
          const r = ATOM[a.k].r;
          return (
            <g key={i} transform={`translate(${a.p[0]} ${a.p[1]})`}>
              <circle r={r} fill={`url(#${id}-${a.k})`} />
              {/* Rim light: inner arc on the upper-left edge. */}
              <circle r={r - 1.6} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={3.2} />
            </g>
          );
        })}
      </g>
      {label ? (
        <Formula text={typeof label === "string" ? label : m.formula} x={0} y={formulaY} size={labelSize} color={labelColor} />
      ) : null}
    </g>
  );
};

export const H2O2: React.FC<Omit<MoleculeProps, "kind">> = (p) => <Molecule kind="H2O2" {...p} />;
export const Water: React.FC<Omit<MoleculeProps, "kind">> = (p) => <Molecule kind="H2O" {...p} />;
export const Oxygen: React.FC<Omit<MoleculeProps, "kind">> = (p) => <Molecule kind="O2" {...p} />;

// ---------------------------------------------------------------------------

export type BubbleProps = {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** 0..1 grows in. */
  readonly progress?: number;
  readonly tint?: string;
  /** 0..1 gentle shape wobble as it rises (driven by the frame). Default 0.5. */
  readonly wobble?: number;
  /** 0..1 pop: ring flashes out, droplets fly. */
  readonly pop?: number;
  readonly seed?: number;
  readonly opacity?: number;
};

/** A rim-lit gas bubble: clear centre, bright Fresnel edge, one highlight. */
export const Bubble: React.FC<BubbleProps> = ({ x, y, r, progress = 1, tint = C.paper, wobble = 0.5, pop = 0, seed = 1, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const id = useSvgId("bub");
  if (progress <= 0 || opacity <= 0) return null;
  const g = EASE.out(progress);
  const rr = r * (0.3 + 0.7 * g);
  const wob = noise2D(`bub${seed}`, frame * 0.05, 0) * 0.035 * wobble;
  const sx = 1 + wob;
  const sy = 1 - wob;
  const body = 1 - seg(pop, 0, 0.25);
  const ring = seg(pop, 0, 1);
  const arc = (a0: number, a1: number, rad: number) => {
    const p0 = [Math.cos(deg(a0)) * rad, Math.sin(deg(a0)) * rad];
    const p1 = [Math.cos(deg(a1)) * rad, Math.sin(deg(a1)) * rad];
    return `M${p0[0]},${p0[1]}A${rad},${rad} 0 0 1 ${p1[0]},${p1[1]}`;
  };
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <radialGradient id={`${id}-b`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={tint} stopOpacity={0.02} />
          <stop offset="0.68" stopColor={tint} stopOpacity={0.06} />
          <stop offset="0.9" stopColor={tint} stopOpacity={0.2} />
          <stop offset="1" stopColor={tint} stopOpacity={0.45} />
        </radialGradient>
      </defs>
      {body > 0 ? (
        <g opacity={body} transform={`scale(${sx * (1 + (1 - body) * 0.2)} ${sy * (1 + (1 - body) * 0.2)})`}>
          <circle r={rr} fill={`url(#${id}-b)`} />
          <circle r={rr} fill="none" stroke={tint} strokeOpacity={0.55} strokeWidth={Math.max(1.5, rr * 0.035)} />
          <path d={arc(195, 268, rr * 0.78)} fill="none" stroke={C.paper} strokeOpacity={0.8} strokeWidth={Math.max(2, rr * 0.075)} strokeLinecap="round" />
          <circle cx={Math.cos(deg(283)) * rr * 0.78} cy={Math.sin(deg(283)) * rr * 0.78} r={Math.max(1.4, rr * 0.04)} fill={C.paper} opacity={0.8} />
          <path d={arc(15, 70, rr * 0.8)} fill="none" stroke={C.paper} strokeOpacity={0.2} strokeWidth={Math.max(1.5, rr * 0.05)} strokeLinecap="round" />
        </g>
      ) : null}
      {pop > 0 && pop < 1 ? (
        <g opacity={1 - ring}>
          <circle r={rr * (1 + ring * 0.6)} fill="none" stroke={tint} strokeOpacity={0.7} strokeWidth={Math.max(1.5, rr * 0.05 * (1 - ring))} />
          {Array.from({ length: 7 }, (_, i) => {
            const a = deg(i * 51 + seed * 13);
            const d = rr * (1 + ring * 0.9);
            return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={Math.max(1, rr * 0.07 * (1 - ring))} fill={tint} />;
          })}
        </g>
      ) : null}
    </g>
  );
};
