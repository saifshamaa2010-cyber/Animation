import { LEXEND_ADVANCE } from "./lexend-metrics";

export type Weight = 400 | 500 | 600 | 700;

/**
 * Width in px of `text` set in Lexend at `size`. Lets hand-drawn marks
 * (circles, underlines, strike-throughs) hug a word exactly.
 */
export const textWidth = (text: string, size: number, weight: Weight = 600, letterSpacing = 0) => {
  const table = LEXEND_ADVANCE[String(weight)];
  let w = 0;
  for (const ch of text) w += table[ch] ?? 0.6;
  return w * size + letterSpacing * Math.max(0, [...text].length - 1);
};

/** Bounding box of a single line of Lexend text drawn with <text x y textAnchor>. */
export const textBox = (
  text: string,
  x: number,
  baselineY: number,
  size: number,
  weight: Weight = 600,
  anchor: "start" | "middle" | "end" = "start",
  letterSpacing = 0,
) => {
  const w = textWidth(text, size, weight, letterSpacing);
  const x0 = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
  // Lexend: cap height ≈ 0.70 em, x-height ≈ 0.52 em, descender ≈ 0.25 em.
  return {
    x0,
    x1: x0 + w,
    w,
    top: baselineY - size * 0.72,
    xTop: baselineY - size * 0.52,
    bottom: baselineY + size * 0.22,
    /** Where a strike-through sits (middle of the lowercase letters). */
    strikeY: baselineY - size * 0.3,
    cx: x0 + w / 2,
    cy: baselineY - size * 0.3,
  };
};

/** Ellipse that comfortably loops a text box (for HandCircle). */
export const circleAround = (
  box: { readonly x0: number; readonly x1: number; readonly top: number; readonly bottom: number },
  padX = 30,
  padY = 22,
) => ({
  cx: (box.x0 + box.x1) / 2,
  cy: (box.top + box.bottom) / 2,
  rx: (box.x1 - box.x0) / 2 + padX,
  ry: (box.bottom - box.top) / 2 + padY,
});

/** True for chemical formulas like "H2O2" (a letter followed by a digit). */
export const isFormula = (t: string) => /[A-Za-z]\d/.test(t);

/** Width of a formula drawn by <Formula> (digits are subscripts at 0.64 size). */
export const formulaWidth = (text: string, size: number, weight: Weight = 600) =>
  (text.match(/(\d+|[^\d]+)/g) ?? []).reduce(
    (w, part) => w + textWidth(part, /^\d+$/.test(part) ? size * 0.64 : size, weight),
    0,
  );
