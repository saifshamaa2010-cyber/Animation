/**
 * Handwriting that is measured, not guessed: Caveat (bold) advance widths measured in Chromium, so a pen
 * tip, a strike-through or a marker loop lands exactly on the written word. Use `Scribble` instead of
 * HandText whenever something has to hug the words (pens, loops, ticks), or the text is big.
 * All SVG in the caller's coordinates; driven by the frame through `progress` (no CSS animation).
 */
import React from "react";
import { C, W2 } from "../../brand/tokens";
import { HAND } from "../../brand/fonts";
import { useSvgId } from "../ids";

type Pt = readonly [number, number];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Caveat 700 advance widths in em (measured with canvas.measureText; Caveat has no kerning pairs that matter here). */
const CAVEAT_ADVANCE: Record<string, number> = { "0": 0.45, "1": 0.45, "2": 0.45, "3": 0.45, "4": 0.45, "5": 0.434, "6": 0.471, "7": 0.446, "8": 0.45, "9": 0.438, "a": 0.446, "b": 0.444, "c": 0.364, "d": 0.402, "e": 0.334, "f": 0.3, "g": 0.364, "h": 0.473, "i": 0.196, "j": 0.213, "k": 0.374, "l": 0.178, "m": 0.569, "n": 0.459, "o": 0.362, "p": 0.378, "q": 0.377, "r": 0.36, "s": 0.35, "t": 0.331, "u": 0.37, "v": 0.331, "w": 0.517, "x": 0.343, "y": 0.341, "z": 0.315, "A": 0.511, "B": 0.523, "C": 0.477, "D": 0.587, "E": 0.534, "F": 0.466, "G": 0.494, "H": 0.574, "I": 0.409, "J": 0.315, "K": 0.508, "L": 0.426, "M": 0.729, "N": 0.619, "O": 0.505, "P": 0.468, "Q": 0.492, "R": 0.544, "S": 0.495, "T": 0.458, "U": 0.482, "V": 0.49, "W": 0.72, "X": 0.524, "Y": 0.504, "Z": 0.522, " ": 0.242, ".": 0.198, ",": 0.198, "!": 0.21, "?": 0.374, "'": 0.117, "\u2019": 0.117, ":": 0.198, "-": 0.326, "(": 0.33, ")": 0.33, "\u2082": 0.3, "+": 0.446, "\u2192": 1, "\u2026": 0.594, "\"": 0.237, "%": 0.6, "=": 0.446, "/": 0.33 };

/** Width in px of `text` in Caveat bold at `size`. */
export const caveatWidth = (text: string, size: number) => {
  let w = 0;
  for (const ch of text) w += CAVEAT_ADVANCE[ch] ?? 0.4;
  return w * size;
};

/** Where a pen tip sits while <Scribble> writes `text` from (x, y) at `progress` (with a small writing bob). */
export const scribbleTip = (x: number, y: number, text: string, size: number, progress: number, frame: number): Pt => {
  const w = caveatWidth(text, size);
  const bob = Math.sin(frame * 1.9) * size * 0.12;
  return [x + w * clamp01(progress) + 2, y - size * 0.32 + bob];
};

/**
 * Handwritten text (Caveat bold) revealed left to right as if written, with an optional felt-marker
 * strike-through (`strike` 0..1, drawn left to right with a slight upward drift, like a real hand).
 */
export const Scribble: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly size?: number;
  readonly color?: string;
  readonly progress?: number;
  readonly strike?: number;
  readonly strikeColor?: string;
  readonly opacity?: number;
}> = ({ x, y, text, size = 64, color = W2.inkText, progress = 1, strike = 0, strikeColor = C.coralDeep, opacity = 1 }) => {
  const id = useSvgId("scrib");
  if (progress <= 0) return null;
  const w = caveatWidth(text, size);
  const s = clamp01(strike);
  const sy = y - size * 0.3;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`${id}-c`}>
          <rect x={x - size * 0.3} y={y - size * 1.2} width={size * 0.3 + (w + size * 0.25) * clamp01(progress)} height={size * 1.8} />
        </clipPath>
      </defs>
      <text x={x} y={y} fontFamily={HAND} fontWeight={700} fontSize={size} fill={color} clipPath={`url(#${id}-c)`}>
        {text}
      </text>
      {s > 0 ? (
        <path
          d={`M${x - 12},${sy + 6} Q${x + (w + 24) * 0.5 * s},${sy - 2} ${x - 12 + (w + 24) * s},${sy - 6 * s}`}
          fill="none"
          stroke={strikeColor}
          strokeWidth={Math.max(6, size * 0.1)}
          strokeLinecap="round"
          opacity={0.94}
        />
      ) : null}
    </g>
  );
};
