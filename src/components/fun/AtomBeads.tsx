/**
 * Atoms as counting beads for the light "worlds" (notebook, journal, desk notes): felt-tip coloured dots
 * with an ink outline, in the school model colours (carbon black, hydrogen white, oxygen red).
 *  - AtomPip: a small bead (counting atoms, e.g. balancing an equation);
 *  - AtomBadge: a bigger bead with the element's symbol on it (≥ 40 px), to head a row.
 * SVG in the caller's coordinates, driven by props only. Reusable.
 */
import React from "react";
import { C, W2 } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { mix } from "../kit/shared";

export type BeadAtom = "C" | "H" | "O";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c1 + 1) * x * x * x + c1 * x * x;
};

/** Felt-tip colours of each element's bead, and the colour of the symbol written on it. */
export const ATOM_BEAD: Record<BeadAtom, { readonly fill: string; readonly letter: string }> = {
  C: { fill: mix(W2.inkText, C.ink500, 0.35), letter: "#FFFFFF" },
  H: { fill: "#FFFFFF", letter: W2.inkText },
  O: { fill: C.coral, letter: W2.inkText },
};

/** A small atom bead centred on (x, y). `scale` lets it pop or squash as it lands. */
export const AtomPip: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly kind: BeadAtom;
  readonly r?: number;
  readonly scale?: number;
  readonly opacity?: number;
}> = ({ x, y, kind, r = 12, scale = 1, opacity = 1 }) => {
  if (opacity <= 0 || scale <= 0) return null;
  const a = ATOM_BEAD[kind];
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx={1.6} cy={1.8} r={r} fill={a.fill} />
      <circle r={r} fill="none" stroke={W2.inkText} strokeWidth={2.6} />
      <circle cx={-r * 0.36} cy={-r * 0.38} r={r * 0.26} fill="#FFFFFF" opacity={kind === "H" ? 0 : 0.55} />
    </g>
  );
};

/** A bigger atom bead with its symbol (Lexend, ≥ 40 px) — heads a row of beads. `progress` pops it in. */
export const AtomBadge: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly kind: BeadAtom;
  readonly r?: number;
  readonly progress?: number;
  readonly opacity?: number;
}> = ({ x, y, kind, r = 30, progress = 1, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const a = ATOM_BEAD[kind];
  const s = back(progress);
  return (
    <g opacity={Math.min(1, progress * 2.5) * opacity} transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={2.5} cy={2.5} r={r} fill={a.fill} />
      <circle r={r} fill="none" stroke={W2.inkText} strokeWidth={3.4} />
      <text y={r * 0.45} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={Math.max(40, r * 1.34)} fill={a.letter}>
        {kind}
      </text>
    </g>
  );
};
