/**
 * Handwritten chemistry for the light "worlds" (notebook, journal): formulas and equations in Caveat
 * with REAL subscripts / superscripts, laid out glyph by glyph from the measured Caveat widths, so
 *  - a pen can write an equation exactly as it is read ("six · C · O · two" → 6 C O ₂),
 *  - single atoms can be marked, dimmed or used as the source of something (an atom pip flying out).
 *
 *   const eq = layoutHandEquation([{ formula: "6CO2" }, { op: "+" }, { formula: "6H2O" }, { arrow: 170 }, …], 112);
 *   <HandEquationText eq={eq} x={left} y={baseline} reveal={px} color={(g) => …} opacity={(g) => …} />
 *
 * Formula syntax (as Equation.tsx's ChemText): leading digits = coefficient (full size), digits after an
 * element = subscript, "^…" = superscript ("NO3^-", "Mg^2+"). Each coefficient, element symbol, subscript
 * and superscript is ONE glyph (so "C6H12O6" = C · 6 · H · 12 · O · 6). Arrows are placeholders: the caller
 * draws them (e.g. with HandArrow) over the glyph's box. Pure layout + SVG, no animation inside.
 */
import React from "react";
import { HAND } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { caveatWidth } from "./Handwriting";

export type HandGlyphKind = "n" | "sub" | "sup" | "op" | "arrow";
export type HandGlyph = {
  readonly ch: string;
  readonly kind: HandGlyphKind;
  /** left / right edge, px from the equation's left edge (at the layout size) */
  readonly x0: number;
  readonly x1: number;
  /** font size of this glyph and its baseline shift (sub: down, sup: up) */
  readonly size: number;
  readonly dy: number;
  /** which part of the equation (formula, operator or arrow) it belongs to, and its index inside that part */
  readonly part: number;
  readonly idx: number;
  /** running index over the whole equation */
  readonly i: number;
};
export type HandPart = { readonly formula: string } | { readonly op: string } | { readonly arrow: number };
export type HandEquationLayout = {
  readonly size: number;
  readonly glyphs: readonly HandGlyph[];
  readonly parts: readonly { readonly x0: number; readonly x1: number; readonly cx: number }[];
  readonly width: number;
};

/** Subscript / superscript size as a fraction of the main size. */
export const HAND_SMALL = 0.6;

/** Split a formula into glyph runs: coefficient, element symbols, subscripts, superscripts. */
export const parseHandChem = (s: string): { t: string; kind: "n" | "sub" | "sup" }[] => {
  const out: { t: string; kind: "n" | "sub" | "sup" }[] = [];
  let i = 0;
  let afterSymbol = false;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "^") {
      let j = i + 1;
      while (j < s.length && s[j] !== " ") j++;
      out.push({ t: s.slice(i + 1, j).replace(/-/g, "−"), kind: "sup" });
      i = j;
      afterSymbol = false;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9]/.test(s[j])) j++;
      out.push({ t: s.slice(i, j), kind: afterSymbol ? "sub" : "n" });
      i = j;
      continue;
    }
    if (/[A-Z]/.test(ch)) {
      // an element symbol: a capital plus any lower-case letters
      let j = i + 1;
      while (j < s.length && /[a-z]/.test(s[j])) j++;
      out.push({ t: s.slice(i, j), kind: "n" });
      i = j;
      afterSymbol = true;
      continue;
    }
    out.push({ t: ch, kind: "n" });
    afterSymbol = ch === ")";
    i++;
  }
  return out;
};

const glyphSize = (kind: HandGlyphKind, size: number) => (kind === "sub" || kind === "sup" ? size * HAND_SMALL : size);
const glyphDy = (kind: HandGlyphKind, size: number) => (kind === "sub" ? size * 0.2 : kind === "sup" ? -size * 0.44 : 0);
/** Caveat sets tight; a hair of tracking keeps handwritten formulas legible. */
const track = (size: number) => size * 0.025;

/** Lay out a handwritten equation (or a single formula) at `size`. `gap` = space around operators and arrows. */
export const layoutHandEquation = (parts: readonly HandPart[], size: number, gap = size * 0.3): HandEquationLayout => {
  const glyphs: HandGlyph[] = [];
  const boxes: { x0: number; x1: number; cx: number }[] = [];
  let x = 0;
  parts.forEach((p, pi) => {
    if (pi > 0) x += "formula" in p && "formula" in parts[pi - 1] ? gap * 0.6 : gap;
    const start = x;
    if ("formula" in p) {
      parseHandChem(p.formula).forEach((r, ri) => {
        const s = glyphSize(r.kind, size);
        const w = caveatWidth(r.t, s);
        glyphs.push({ ch: r.t, kind: r.kind, x0: x, x1: x + w, size: s, dy: glyphDy(r.kind, size), part: pi, idx: ri, i: glyphs.length });
        x += w + track(size);
      });
      x -= track(size);
    } else if ("op" in p) {
      const w = caveatWidth(p.op, size);
      glyphs.push({ ch: p.op, kind: "op", x0: x, x1: x + w, size, dy: 0, part: pi, idx: 0, i: glyphs.length });
      x += w;
    } else {
      glyphs.push({ ch: "→", kind: "arrow", x0: x, x1: x + p.arrow, size, dy: 0, part: pi, idx: 0, i: glyphs.length });
      x += p.arrow;
    }
    if (pi < parts.length - 1 && !("formula" in p)) x += 0; // gaps are added before each part
    boxes.push({ x0: start, x1: x, cx: (start + x) / 2 });
  });
  return { size, glyphs, parts: boxes, width: x };
};

/** Centre of a glyph (x from the equation's left edge, y relative to the baseline), at the layout size. */
export const glyphCentre = (g: HandGlyph): readonly [number, number] => [(g.x0 + g.x1) / 2, g.dy - g.size * 0.32];

/**
 * Draws a laid-out handwritten equation with its left edge at x and baseline at y (scaled by `scale`).
 * `reveal` = px (layout units) written so far — everything right of it is hidden (arrows are skipped:
 * draw them yourself). `color` / `opacity` are per glyph.
 */
export const HandEquationText: React.FC<{
  readonly eq: HandEquationLayout;
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly reveal?: number;
  readonly color: (g: HandGlyph) => string;
  readonly opacity?: (g: HandGlyph) => number;
  readonly weight?: 600 | 700;
}> = ({ eq, x, y, scale = 1, reveal = Infinity, color, opacity, weight = 700 }) => {
  const id = useSvgId("hchem");
  if (reveal <= 0) return null;
  const clip = Number.isFinite(reveal);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {clip ? (
        <defs>
          <clipPath id={`${id}-c`}>
            <rect x={-eq.size * 0.3} y={-eq.size * 1.3} width={eq.size * 0.3 + reveal} height={eq.size * 2} />
          </clipPath>
        </defs>
      ) : null}
      <g clipPath={clip ? `url(#${id}-c)` : undefined}>
        {eq.glyphs.map((g) => {
          if (g.kind === "arrow") return null;
          const o = opacity ? opacity(g) : 1;
          if (o <= 0) return null;
          return (
            <text key={g.i} x={g.x0} y={g.dy} fontFamily={HAND} fontWeight={weight} fontSize={g.size} fill={color(g)} opacity={o}>
              {g.ch}
            </text>
          );
        })}
      </g>
    </g>
  );
};
