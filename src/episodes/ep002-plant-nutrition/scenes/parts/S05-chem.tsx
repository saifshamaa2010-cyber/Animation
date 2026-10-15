/**
 * S05 helpers: character positions inside a chemical formula (so single atoms can be highlighted),
 * the highlight "marker" behind them, the atom ball that heads each tally row, and the EXTENDED badge
 * (drawn exactly where SectionTag draws it, so it can arrive on the spoken word).
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { parseChem } from "../../../../components/Equation";
import { ATOM, textWidth } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { useSvgId } from "../../../../components/ids";

/** Same as Equation.tsx: subscripts/superscripts are drawn at 64 % size. */
const SMALL = 0.64;

export type CharBox = { readonly ch: string; readonly x0: number; readonly x1: number; readonly sub: boolean };

/** Left/right edge of every character of `text` drawn by ChemText at (left, size), weight 600. */
export const chemChars = (text: string, left: number, size: number): CharBox[] => {
  const out: CharBox[] = [];
  let x = left;
  parseChem(text).forEach((r) => {
    const s = r.kind === "n" ? size : size * SMALL;
    for (const ch of r.t) {
      const w = textWidth(ch, s, 600);
      out.push({ ch, x0: x, x1: x + w, sub: r.kind !== "n" });
      x += w;
    }
  });
  return out;
};

/** Contiguous runs of the chosen character indices → [x0, x1] spans. */
export const spans = (chars: readonly CharBox[], idx: readonly number[]): [number, number][] => {
  const sorted = [...idx].sort((a, b) => a - b);
  const out: [number, number][] = [];
  sorted.forEach((i, n) => {
    if (n > 0 && i === sorted[n - 1] + 1) out[out.length - 1][1] = chars[i].x1;
    else out.push([chars[i].x0, chars[i].x1]);
  });
  return out;
};

/** A soft marker box behind atoms in a formula ("these ones"). */
export const Marker: React.FC<{ readonly x0: number; readonly x1: number; readonly y: number; readonly size: number; readonly color: string; readonly p: number }> = ({ x0, x1, y, size, color, p }) => {
  if (p <= 0) return null;
  const e = EASE.out(Math.min(1, p));
  const padX = 2;
  const top = y - size * 0.78;
  const bottom = y + size * 0.36;
  const cx = (x0 + x1) / 2;
  const w = (x1 - x0 + padX * 2) * (0.85 + 0.15 * e);
  return (
    <g opacity={Math.min(1, p * 1.5)}>
      <path d={roundRectPath(cx - w / 2, top, w, bottom - top, 12)} fill={color} fillOpacity={0.26} stroke={color} strokeOpacity={0.7} strokeWidth={2.5} />
    </g>
  );
};

/** A lit atom ball (school colours: C charcoal, H white, O red/coral) with its symbol. */
export const AtomBall: React.FC<{ readonly kind: "C" | "H" | "O"; readonly x: number; readonly y: number; readonly r?: number; readonly p: number; readonly glow?: number }> = ({
  kind,
  x,
  y,
  r = 36,
  p,
  glow = 0,
}) => {
  const id = useSvgId("atom");
  if (p <= 0) return null;
  const a = ATOM[kind];
  const s = 0.8 + 0.2 * EASE.out(Math.min(1, p));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, p * 1.5)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={a.top} />
          <stop offset="1" stopColor={a.bottom} />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.85} />
          <stop offset="0.4" stopColor={C.paper} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-s`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {glow > 0.01 ? <circle r={r * 1.5} fill={a.top} opacity={0.35 * glow} filter={`url(#${id}-s)`} /> : null}
      <circle cy={8} r={r} fill={C.ink950} opacity={0.45} filter={`url(#${id}-s)`} />
      <circle r={r} fill={`url(#${id}-g)`} />
      <circle r={r - 2} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={4} />
      <text y={r * 0.42} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill={C.ink900}>
        {kind}
      </text>
    </g>
  );
};

/**
 * The EXTENDED badge, at exactly the place SectionTag puts it for this title (SectionTag can only
 * show it from the start of a scene; here it arrives on the word "Extended").
 */
export const ExtendedBadge: React.FC<{ readonly title: string; readonly p: number; readonly settle: number }> = ({ title, p, settle }) => {
  if (p <= 0) return null;
  const x = 100;
  const y = 100;
  const numW = 64;
  const tw = textWidth(title, 44, 600);
  const badgeW = textWidth("EXTENDED", 40, 700) + 36;
  const bx = x + numW + 44 + tw;
  const e = EASE.out(Math.min(1, p));
  const s = 0.88 + 0.12 * e;
  const cx = bx + badgeW / 2;
  const cy = y + 32;
  return (
    <g opacity={Math.min(1, p * 1.5) * (1 - 0.45 * settle)} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <rect x={bx} y={y + 4} width={badgeW} height={56} rx={14} fill="none" stroke={C.violetLight} strokeWidth={3} />
      <text x={bx + badgeW / 2} y={y + 46} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.violetLight} letterSpacing={1}>
        EXTENDED
      </text>
    </g>
  );
};
