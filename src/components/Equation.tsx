import React from "react";
import { C, EASE } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { textWidth } from "./kit/text";

/**
 * Word and symbol equations that build up term by term, colour-coded
 * (reactants and products keep the colour of their molecule on screen).
 *
 * Chemistry text: "6CO2" → 6CO₂ (a leading number is a coefficient, numbers after a letter are
 * subscripts), "C6H12O6" → C₆H₁₂O₆, "NO3^-" → NO₃⁻, "Mg^2+" → Mg²⁺. Lexend has no sub/superscript
 * glyphs, so they are drawn as smaller, shifted text.
 */

type Run = { readonly t: string; readonly kind: "n" | "sub" | "sup" };

export const parseChem = (s: string): Run[] => {
  const runs: Run[] = [];
  let i = 0;
  let prevLetter = false;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "^") {
      let j = i + 1;
      while (j < s.length && s[j] !== " ") j++;
      runs.push({ t: s.slice(i + 1, j).replace(/-/g, "−"), kind: "sup" });
      i = j;
      prevLetter = false;
      continue;
    }
    if (/\d/.test(ch)) {
      let j = i;
      while (j < s.length && /\d/.test(s[j])) j++;
      runs.push({ t: s.slice(i, j), kind: prevLetter ? "sub" : "n" });
      i = j;
      continue;
    }
    runs.push({ t: ch, kind: "n" });
    prevLetter = /[A-Za-z)]/.test(ch);
    i++;
  }
  // merge neighbours of the same kind
  return runs.reduce<Run[]>((acc, r) => {
    const last = acc[acc.length - 1];
    if (last && last.kind === r.kind) acc[acc.length - 1] = { t: last.t + r.t, kind: r.kind };
    else acc.push(r);
    return acc;
  }, []);
};

const SMALL = 0.64;
/** Sub/superscript size: 0.64 of the text, but never under 32 px so a "2" stays readable on a phone. */
export const chemSmall = (size: number) => Math.max(size * SMALL, Math.min(32, size * 0.8));

export const chemWidth = (s: string, size: number, weight: 400 | 500 | 600 | 700 = 600) =>
  parseChem(s).reduce((w, r) => w + textWidth(r.t, r.kind === "n" ? size : chemSmall(size), weight), 0);

/** Text with chemistry sub/superscripts. `x` is the left edge (or centre with anchor="middle"). */
export const ChemText: React.FC<{
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly color?: string;
  readonly weight?: 400 | 500 | 600 | 700;
  readonly anchor?: "start" | "middle" | "end";
  readonly opacity?: number;
}> = ({ text, x, y, size = 50, color = C.paper, weight = 600, anchor = "start", opacity = 1 }) => {
  const w = chemWidth(text, size, weight);
  const x0 = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
  let cx = x0;
  return (
    <g opacity={opacity}>
      {parseChem(text).map((r, i) => {
        const s = r.kind === "n" ? size : chemSmall(size);
        const dy = r.kind === "sub" ? size * 0.24 : r.kind === "sup" ? -size * 0.42 : 0;
        const el = (
          <text key={i} x={cx} y={y + dy} fontFamily={FONT} fontWeight={weight} fontSize={s} fill={color} letterSpacing={0} style={{ whiteSpace: "pre" }}>
            {r.t}
          </text>
        );
        cx += textWidth(r.t, s, weight);
        return el;
      })}
    </g>
  );
};

export type EqTerm = {
  readonly text: string;
  readonly color?: string;
  /** 0..1 arrival. */
  readonly p: number;
  /** 0..1 highlight (underline glow) — "this is the one we're talking about". */
  readonly emphasis?: number;
  readonly dim?: number;
};
export type EqArrow = {
  readonly arrow: true;
  readonly p: number;
  readonly length?: number;
  readonly over?: string;
  readonly under?: string;
  readonly overColor?: string;
  readonly underColor?: string;
  readonly overP?: number;
  readonly underP?: number;
  readonly emphasis?: number;
};

export type EquationProps = {
  /** Centre x, and the text baseline. */
  readonly x: number;
  readonly y: number;
  readonly terms: readonly (EqTerm | EqArrow)[];
  readonly size?: number;
  readonly gap?: number;
  readonly opacity?: number;
};

const isArrow = (t: EqTerm | EqArrow): t is EqArrow => (t as EqArrow).arrow === true;

/** Width of an equation laid out with these terms (for layout checks). */
export const equationWidth = (terms: readonly (EqTerm | EqArrow)[], size = 50, gap = 22) =>
  terms.reduce((w, t) => w + (isArrow(t) ? t.length ?? 260 : chemWidth(t.text, size)), 0) + gap * (terms.length - 1);

export const Equation: React.FC<EquationProps> = ({ x, y, terms, size = 50, gap = 22, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const total = equationWidth(terms, size, gap);
  let cx = x - total / 2;
  const small = Math.max(40, size * 0.82);
  return (
    <g opacity={opacity}>
      {terms.map((t, i) => {
        const left = cx;
        if (isArrow(t)) {
          const w = t.length ?? 260;
          cx += w + gap;
          const ay = y - size * 0.32;
          const p = EASE.inOut(Math.max(0, Math.min(1, t.p)));
          const head = Math.max(0, p - 0.8) / 0.2;
          return (
            <g key={i}>
              {t.emphasis ? <rect x={left - 8} y={ay - 6} width={(w + 16) * t.emphasis} height={12} rx={6} fill={C.paper} opacity={0.18} /> : null}
              <line x1={left} y1={ay} x2={left + (w - 6) * p} y2={ay} stroke={C.paper} strokeWidth={5} strokeLinecap="round" />
              {head > 0 ? (
                <path d={`M${left + w - 26},${ay - 16} L${left + w - 4},${ay} L${left + w - 26},${ay + 16}`} fill="none" stroke={C.paper} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={head} />
              ) : null}
              {t.over ? (
                <text x={left + w / 2} y={ay - 22} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={small} fill={t.overColor ?? C.sun} opacity={t.overP ?? p}>
                  {t.over}
                </text>
              ) : null}
              {t.under ? (
                <text x={left + w / 2} y={ay + small + 12} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={small} fill={t.underColor ?? C.leaf} opacity={t.underP ?? p}>
                  {t.under}
                </text>
              ) : null}
            </g>
          );
        }
        const w = chemWidth(t.text, size);
        cx += w + gap;
        const p = Math.max(0, Math.min(1, t.p));
        if (p <= 0) return null;
        const col = t.color ?? C.paper;
        return (
          <g key={i} transform={`translate(0 ${(1 - EASE.out(p)) * 14})`} opacity={p * (1 - (t.dim ?? 0) * 0.65)}>
            {t.emphasis ? <rect x={left - 10} y={y + 12} width={(w + 20) * t.emphasis} height={7} rx={3.5} fill={col} opacity={0.9} /> : null}
            <ChemText text={t.text} x={left} y={y} size={size} color={col} />
          </g>
        );
      })}
    </g>
  );
};
