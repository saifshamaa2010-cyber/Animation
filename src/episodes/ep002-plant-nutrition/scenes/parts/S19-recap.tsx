/**
 * S19 helpers: the recap card (an empty numbered place that turns into a lit card), and the small
 * hand-made icons that don't exist as shared components (energy bolt, cell-wall bricks, thermometer,
 * a plus sign, a mini rate graph).
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { LitShape, mix, textWidth } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { useSvgId } from "../../../../components/ids";
import { Pt } from "../../../../lib/geometry";

export const CARD = { w: 540, h: 330, gapX: 30, gapY: 40 } as const;
const X0 = (1920 - (3 * CARD.w + 2 * CARD.gapX)) / 2;
const Y0 = (1080 - (2 * CARD.h + CARD.gapY)) / 2;
/** Top-left of card i (0..5): two rows of three. */
export const cardPos = (i: number) => ({ x: X0 + (i % 3) * (CARD.w + CARD.gapX), y: Y0 + Math.floor(i / 3) * (CARD.h + CARD.gapY) });
/** Centre of card i's icon area. */
export const iconCentre = (i: number): Pt => {
  const { x, y } = cardPos(i);
  return [x + CARD.w / 2, y + 150];
};

/** The empty, numbered place a card will fill (dashed outline). */
export const CardSlot: React.FC<{ readonly i: number; readonly color: string; readonly p: number }> = ({ i, color, p }) => {
  if (p <= 0) return null;
  const { x, y } = cardPos(i);
  const e = EASE.out(Math.min(1, p));
  const cx = x + CARD.w / 2;
  const cy = y + CARD.h / 2;
  return (
    <g opacity={Math.min(1, p * 1.5)} transform={`translate(${cx} ${cy}) scale(${0.94 + 0.06 * e}) translate(${-cx} ${-cy})`}>
      <rect x={x + 1.5} y={y + 1.5} width={CARD.w - 3} height={CARD.h - 3} rx={30} fill={color} fillOpacity={0.03} stroke={color} strokeOpacity={0.35} strokeWidth={3} strokeDasharray="14 14" />
      <circle cx={x + 46} cy={y + 46} r={24} fill="none" stroke={color} strokeOpacity={0.6} strokeWidth={3} />
      <text x={x + 46} y={y + 60} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={mix(color, C.paper, 0.3)} opacity={0.8}>
        {i + 1}
      </text>
    </g>
  );
};

/**
 * A recap card: lit ink card, number, title at the bottom; children = the icon (screen coordinates).
 * `active` 0..1 = being talked about (outline in its colour, soft glow); `past` 0..1 = settled (quieter).
 */
export const RecapCard: React.FC<{
  readonly i: number;
  readonly title: string;
  readonly color: string;
  readonly p: number;
  readonly active: number;
  readonly past: number;
  readonly extended?: boolean;
  readonly exit?: number;
  readonly children?: React.ReactNode;
}> = ({ i, title, color, p, active, past, extended = false, exit = 0, children }) => {
  const id = useSvgId("rcard");
  if (p <= 0 || exit >= 1) return null;
  const { x, y } = cardPos(i);
  const e = EASE.out(Math.min(1, p));
  const cx = x + CARD.w / 2;
  const cy = y + CARD.h / 2;
  const s = (0.94 + 0.06 * e) * (1 - 0.06 * exit);
  const dy = (1 - e) * 22 + exit * 46;
  const quiet = 1 - 0.28 * past;
  const badgeW = textWidth("EXTENDED", 40, 700) + 32;
  return (
    <g opacity={Math.min(1, p * 1.5) * (1 - exit)} transform={`translate(${cx} ${cy + dy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <defs>
        <filter id={`${id}-g`} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation={22} />
        </filter>
      </defs>
      {active > 0.01 ? <rect x={x - 6} y={y - 6} width={CARD.w + 12} height={CARD.h + 12} rx={36} fill={color} opacity={0.22 * active} filter={`url(#${id}-g)`} /> : null}
      <LitShape d={roundRectPath(x, y, CARD.w, CARD.h, 30)} top={mix(C.ink700, color, 0.05 * active)} bottom={C.ink800} rimOpacity={0.45} shadow={0.55} shadowDy={14} shadowBlur={16} />
      <rect x={x + 1.5} y={y + 1.5} width={CARD.w - 3} height={CARD.h - 3} rx={28.5} fill="none" stroke={mix(C.ink500, color, active)} strokeOpacity={0.5 + 0.4 * active} strokeWidth={3} />
      <circle cx={x + 46} cy={y + 46} r={24} fill={mix(C.ink500, color, 0.35 + 0.65 * active)} />
      <text x={x + 46} y={y + 60} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.ink900}>
        {i + 1}
      </text>
      {extended ? (
        <g opacity={0.75 + 0.25 * active}>
          <rect x={x + CARD.w - 26 - badgeW} y={y + 20} width={badgeW} height={54} rx={14} fill="none" stroke={C.violetLight} strokeWidth={3} />
          <text x={x + CARD.w - 26 - badgeW / 2} y={y + 61} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.violetLight} letterSpacing={1}>
            EXTENDED
          </text>
        </g>
      ) : null}
      <g opacity={quiet}>{children}</g>
      <text x={cx} y={y + CARD.h - 38} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={46} fill={mix(C.paper, color, 0.25 * active)} opacity={1 - 0.22 * past} letterSpacing={-0.5}>
        {title}
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ small icons

/** A drawn plus sign (no text, so it never counts as on-screen words). */
export const PlusMark: React.FC<{ readonly x: number; readonly y: number; readonly s?: number; readonly p: number }> = ({ x, y, s = 13, p }) =>
  p > 0 ? (
    <g opacity={Math.min(1, p * 1.5)} stroke={C.ink300} strokeWidth={4} strokeLinecap="round">
      <line x1={x - s} y1={y} x2={x + s} y2={y} />
      <line x1={x} y1={y - s} x2={x} y2={y + s} />
    </g>
  ) : null;

/** An energy bolt: energy released (respiration). */
export const EnergyBolt: React.FC<{ readonly x: number; readonly y: number; readonly s?: number; readonly p: number; readonly glow?: number }> = ({ x, y, s = 1, p, glow = 0 }) => {
  const id = useSvgId("bolt");
  if (p <= 0) return null;
  const k = s * (0.7 + 0.3 * EASE.out(Math.min(1, p)));
  const d = "M 6,-30 L -16,4 L -2,4 L -8,30 L 16,-6 L 2,-6 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={Math.min(1, p * 1.5)}>
      <defs>
        <filter id={`${id}-b`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      {glow > 0.01 ? <circle r={30} fill={C.amberLight} opacity={0.45 * glow} filter={`url(#${id}-b)`} /> : null}
      <LitShape d={d} top={C.amberLight} bottom={C.amber} rimOpacity={0.6} shadow={0.35} shadowDy={4} shadowBlur={5} />
    </g>
  );
};

/** A patch of cell wall: bricks of cellulose. */
export const WallBricks: React.FC<{ readonly x: number; readonly y: number; readonly p: number }> = ({ x, y, p }) => {
  if (p <= 0) return null;
  const e = EASE.out(Math.min(1, p));
  const bw = 24;
  const bh = 14;
  const rows = [
    [-1.5, -0.5, 0.5],
    [-1, 0, 1],
    [-1.5, -0.5, 0.5],
  ];
  return (
    <g opacity={Math.min(1, p * 1.5)} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * e})`}>
      {rows.map((r, ri) =>
        r.map((c, ci) => (
          <LitShape key={`${ri}${ci}`} d={roundRectPath(c * (bw + 3) - bw / 2 + (ri === 1 ? 0 : 12), (ri - 1) * (bh + 3) - bh / 2, bw, bh, 4)} top={C.paper} bottom={C.paperDim} rimOpacity={0.5} shadow={0.2} shadowDy={2} shadowBlur={3} />
        )),
      )}
    </g>
  );
};

/** A small thermometer (no scale, no numbers): temperature as a factor. */
export const MiniThermometer: React.FC<{ readonly x: number; readonly y: number; readonly p: number; readonly level?: number }> = ({ x, y, p, level = 0.55 }) => {
  if (p <= 0) return null;
  const e = EASE.out(Math.min(1, p));
  const h = 52;
  return (
    <g opacity={Math.min(1, p * 1.5)} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * e})`}>
      <rect x={-8} y={-h / 2 - 8} width={16} height={h} rx={8} fill={mix(C.ink700, C.paper, 0.1)} stroke={C.paper} strokeOpacity={0.6} strokeWidth={2.5} />
      <rect x={-3.5} y={-h / 2 - 8 + h * (1 - level)} width={7} height={h * level} rx={3.5} fill={C.coral} />
      <circle cy={h / 2 + 2} r={13} fill={C.coral} stroke={C.paper} strokeOpacity={0.6} strokeWidth={2.5} />
      <circle cx={-4} cy={h / 2 - 2} r={4} fill={C.paper} opacity={0.5} />
    </g>
  );
};

/** A mini rate graph: axes and a curve that rises then levels off (draws on with p). */
export const MiniRateGraph: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly p: number; readonly axes: number; readonly plateauGlow?: number }> = ({
  x,
  y,
  w,
  h,
  p,
  axes,
  plateauGlow = 0,
}) => {
  const id = useSvgId("mgraph");
  if (axes <= 0) return null;
  // origin at (x, y + h); the curve rises then plateaus
  const N = 40;
  const pts: Pt[] = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    const v = 1 - Math.exp(-t * 5.2);
    return [x + 10 + t * (w - 20), y + h - 8 - v * (h - 26)];
  });
  const shown = Math.max(2, Math.round(EASE.inOut(Math.min(1, p)) * N) + 1);
  const d = pts.slice(0, shown).map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");
  const plateauY = pts[N][1];
  return (
    <g opacity={Math.min(1, axes * 1.5)}>
      <defs>
        <filter id={`${id}-b`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <path d={`M${x},${y} L${x},${y + h} L${x + w},${y + h}`} fill="none" stroke={C.paper} strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      {p > 0 ? <path d={d} fill="none" stroke={C.leafLight} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {plateauGlow > 0.01 ? (
        <line x1={x + w * 0.55} y1={plateauY} x2={x + w - 10} y2={plateauY} stroke={C.leafLight} strokeWidth={14} strokeLinecap="round" opacity={0.5 * plateauGlow} filter={`url(#${id}-b)`} />
      ) : null}
    </g>
  );
};
