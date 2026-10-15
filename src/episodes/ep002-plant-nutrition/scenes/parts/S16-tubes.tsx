/**
 * The hydrogencarbonate-indicator practical (S16 predict, S17 reveal): tubes of indicator whose colour
 * shows how much carbon dioxide is dissolved, CO2 drawn as small ice-blue dots inside the liquid
 * (fewer dots = less CO2 = purple, more = yellow), a leaf standing in the liquid, the lamp with its
 * photons, the foil, and the colour key. Both scenes draw the rack from here, so the cut is seamless.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { FoilWrap, Lamp, Rack, Tube, rackSlots } from "../../../../components/lab/Lab";
import { Leaf, leafGeometry, type LeafGeo } from "../../../../components/bio";
import { Photon } from "../../../../components/Light";
import { HandArrow, LitShape, mix, textWidth } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { chemSmall } from "../../../../components/Equation";
import { Pt, rng } from "../../../../lib/geometry";
import { prog } from "../../../../lib/motion";
import { useSvgId } from "../../../../components/ids";
import { TUBES } from "../layout";

// ------------------------------------------------------------------ layout
/** Mouth centres of tubes A (leaf + lamp), B (leaf + foil), C (no leaf). */
export const SLOTS = rackSlots(TUBES.rackX, TUBES.rackY, 3, TUBES.gap);
export const TUBE_TOP = TUBES.rackY;
export const TUBE_BOTTOM = TUBES.rackY + TUBES.tubeH;
export const LEVEL = 0.86;
export const SURFACE = TUBE_BOTTOM - TUBES.tubeH * LEVEL;
/** Lamp left of tube A, standing on the same bench as the rack. */
export const LAMP = { x: 700, y: 392, beam: 290 } as const;
export const LEAF = { cy: 410, len: 100, wid: 36 } as const;
/** Condition labels under the tubes, result labels / question marks above the bungs. */
export const COND_Y = 704;
export const TOP_Y = 236;
/** The demo tube (S16, first half). */
export const DEMO = { x: 960, y: 260, w: 130, h: 400, level: 0.78 } as const;

/** Seeds for the nine CO2 dots in each rack tube (S16 and S17 use the same, so the cut is seamless). */
export const RACK_SEEDS = [31, 32, 33] as const;

export const leafIn = (x: number): LeafGeo => leafGeometry({ cx: x, cy: LEAF.cy, len: LEAF.len, wid: LEAF.wid, ang: -90, stalk: 0.28 });

/** Indicator colour: −1 yellow (more CO2) · 0 red (air) · +1 purple (less CO2). */
export const indColour = (s: number) => (s < 0 ? mix(C.indRed, C.indYellow, -s) : mix(C.indRed, C.indPurple, s));
/** Readable text versions of the three colours (a little paper mixed in for the dark background). */
export const IND_TEXT = { yellow: C.indYellow, red: mix(C.indRed, C.paper, 0.18), purple: mix(C.indPurple, C.paper, 0.32) } as const;

// ------------------------------------------------------------------ CO2 dots
export type DotPlan = {
  readonly home: Pt;
  readonly seed: number;
  /** fades in at home */
  readonly appearAt?: number;
  /** arrives from `from` (e.g. given out by the leaf) */
  readonly enterAt?: number;
  readonly from?: Pt;
  /** leaves to `to` and disappears there (e.g. taken in by the leaf) */
  readonly exitAt?: number;
  readonly to?: Pt;
  readonly travel?: number;
  /** thermal jiggle amplitude, px */
  readonly jig?: number;
};
export type DotDraw = { readonly x: number; readonly y: number; readonly op: number; readonly s: number };

export const dotAt = (f: number, d: DotPlan): DotDraw | null => {
  const jig = d.jig ?? 3;
  let x = d.home[0] + noise2D(`co2d${d.seed}x`, f * 0.035, 0) * jig;
  let y = d.home[1] + noise2D(`co2d${d.seed}y`, f * 0.035, 7) * jig;
  let op = 1;
  let s = 1;
  const travel = d.travel ?? 30;
  if (d.appearAt !== undefined) {
    if (f < d.appearAt) return null;
    op = prog(f, d.appearAt, 12);
  }
  if (d.enterAt !== undefined && d.from) {
    if (f < d.enterAt) return null;
    const q = prog(f, d.enterAt, travel, EASE.inOut);
    x = d.from[0] + (x - d.from[0]) * q;
    y = d.from[1] + (y - d.from[1]) * q;
    op *= Math.min(1, prog(f, d.enterAt, 8));
    s = 0.55 + 0.45 * Math.min(1, q * 2);
  }
  if (d.exitAt !== undefined && d.to && f >= d.exitAt) {
    const q = prog(f, d.exitAt, travel, EASE.inOut);
    if (q >= 1) return null;
    x = x + (d.to[0] - x) * q;
    y = y + (d.to[1] - y) * q;
    const fade = Math.max(0, (q - 0.62) / 0.38);
    op *= 1 - fade;
    s *= 1 - 0.5 * fade;
  }
  return { x, y, op, s };
};

/** Non-overlapping homes for `n` dots inside a tube's liquid, keeping clear of the leaf (if any). */
export const tubeHomes = (
  x: number,
  n: number,
  seed: number,
  o: { leaf?: boolean; w?: number; top?: number; bottom?: number; minD?: number } = {},
): Pt[] => {
  const w = o.w ?? TUBES.tubeW;
  const top = o.top ?? SURFACE + 15;
  const bottom = o.bottom ?? TUBE_BOTTOM - 13;
  const minD = o.minD ?? 16;
  const R = w / 2;
  const cyB = bottom + 13 - R;
  const geo = o.leaf ? leafIn(x) : null;
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let guard = 0; pts.length < n && guard < 6000; guard++) {
    const px = x + (r() - 0.5) * (w - 26);
    const py = top + r() * (bottom - top);
    if (py > cyB && Math.hypot(px - x, py - cyB) > R - 13) continue;
    if (geo) {
      const t = (LEAF.cy + LEAF.len / 2 - py) / LEAF.len; // 0 base … 1 tip
      if (t >= -0.02 && t <= 1.02 && Math.abs(px - x) < geo.half(Math.max(0, Math.min(1, t))) + 9) continue;
      if (py > LEAF.cy + LEAF.len / 2 - 4 && py < LEAF.cy + LEAF.len / 2 + 38 && Math.abs(px - (x + 8)) < 15) continue; // stalk
    }
    if (pts.some((q) => Math.hypot(q[0] - px, q[1] - py) < minD)) continue;
    pts.push([px, py]);
  }
  return pts;
};

/** A point on the leaf surface (where a dot goes in or comes out). */
export const leafPoint = (x: number, i: number): Pt => {
  const g = leafIn(x);
  const r = rng(900 + i * 17);
  return g.P((r() - 0.5) * LEAF.len * 0.62, (r() - 0.5) * LEAF.wid * 0.45);
};

export const Co2Dot: React.FC<{ readonly d: DotDraw | null; readonly r?: number }> = ({ d, r = 6 }) => {
  if (!d || d.op <= 0) return null;
  return (
    <g opacity={d.op}>
      <circle cx={d.x} cy={d.y} r={r * 1.9 * d.s} fill={C.ice} opacity={0.3} />
      <circle cx={d.x} cy={d.y} r={r * d.s} fill={mix(C.ice, C.paper, 0.35)} stroke={C.ink900} strokeOpacity={0.6} strokeWidth={2} />
    </g>
  );
};

// ------------------------------------------------------------------ text with a chemical subscript
/** "more CO2" → "more CO₂" in ONE <text> (the subscript is a tspan, so the label reads as one size). */
export const ChemLabel: React.FC<{
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly weight?: 400 | 500 | 600 | 700;
  readonly color?: string;
  readonly anchor?: "start" | "middle" | "end";
  readonly opacity?: number;
}> = ({ text, x, y, size = 44, weight = 600, color = C.paper, anchor = "middle", opacity = 1 }) => {
  if (opacity <= 0) return null;
  const parts = text.split(/(\d)/).filter(Boolean);
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={FONT}
      fontWeight={weight}
      fontSize={size}
      fill={color}
      opacity={opacity}
      letterSpacing={-0.5}
      stroke={C.ink900}
      strokeWidth={8}
      strokeOpacity={0.55}
      paintOrder="stroke"
    >
      {parts.map((p, i) =>
        /\d/.test(p) ? (
          <tspan key={i} fontSize={chemSmall(size)} dy={size * 0.24}>
            {p}
          </tspan>
        ) : (
          <tspan key={i} dy={i > 0 && /\d/.test(parts[i - 1]) ? -size * 0.24 : 0}>
            {p}
          </tspan>
        ),
      )}
    </text>
  );
};
export const chemLabelWidth = (text: string, size = 44, weight: 400 | 500 | 600 | 700 = 600) =>
  text
    .split(/(\d)/)
    .filter(Boolean)
    .reduce((w, p) => w + textWidth(p, /\d/.test(p) ? chemSmall(size) : size, weight), 0);

/** A leader-line label (same look as `Label`) whose text may contain a subscript. */
export const ChemLeader: React.FC<{ readonly anchor: Pt; readonly at: Pt; readonly text: string; readonly progress: number; readonly color?: string; readonly opacity?: number }> = ({
  anchor,
  at,
  text,
  progress,
  color = C.paper,
  opacity = 1,
}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const line = Math.min(1, progress / 0.55);
  const dot = Math.min(1, progress / 0.2);
  const txt = Math.max(0, Math.min(1, (progress - 0.35) / 0.65));
  const lx = anchor[0] + (at[0] - anchor[0]) * line;
  const ly = anchor[1] + (at[1] - anchor[1]) * line;
  return (
    <g opacity={opacity}>
      <circle cx={anchor[0]} cy={anchor[1]} r={14 * dot} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={2} />
      <line x1={anchor[0]} y1={anchor[1]} x2={lx} y2={ly} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <g opacity={txt} transform={`translate(${(1 - txt) * -12} 0)`}>
        <ChemLabel text={text} x={at[0] + 14} y={at[1] + 15} anchor="start" color={color} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ one tube of indicator
export type IndicatorTubeProps = {
  readonly x: number;
  readonly y?: number;
  readonly w?: number;
  readonly h?: number;
  /** 0..1 fill level */
  readonly level?: number;
  readonly colour: string;
  /** a new colour spreading out from a point (the leaf), 0..1 */
  readonly spread?: { readonly colour: string; readonly p: number; readonly at: Pt; readonly reach?: number };
  readonly leaf?: number;
  readonly sunlit?: number;
  /** soft glow round the leaf (it caused the change) */
  readonly leafGlow?: number;
  readonly dots?: readonly (DotDraw | null)[];
  readonly dotR?: number;
  /** 0..1 the bung is pushed in (sealed) */
  readonly bung?: number;
  readonly foil?: number;
  /** 0..1 the foil is lifted off */
  readonly foilLift?: number;
  readonly progress?: number;
  readonly opacity?: number;
  /** vertical offset (lifting the tube out of the rack) */
  readonly dy?: number;
};

export const IndicatorTube: React.FC<IndicatorTubeProps> = ({
  x,
  y = TUBE_TOP,
  w = TUBES.tubeW,
  h = TUBES.tubeH,
  level = LEVEL,
  colour,
  spread,
  leaf = 0,
  sunlit = 0,
  leafGlow = 0,
  dots = [],
  dotR = 6,
  bung = 0,
  foil = 0,
  foilLift = 0,
  progress = 1,
  opacity = 1,
  dy = 0,
}) => {
  const id = useSvgId("itube");
  if (progress <= 0 || opacity <= 0) return null;
  const r = w / 2;
  const bottom = y + h;
  const surf = bottom - h * level;
  const d = `M${x - r},${y} L${x - r},${bottom - r} A${r},${r} 0 0 0 ${x + r},${bottom - r} L${x + r},${y} Z`;
  const sp = spread && spread.p > 0 ? spread : null;
  const reach = sp ? (sp.reach ?? 300) * EASE.out(Math.min(1, sp.p)) : 0;
  const tint = sp ? mix(colour, sp.colour, Math.min(1, sp.p * 1.3)) : colour;
  const geo = leafIn(x);
  return (
    <g opacity={opacity} transform={dy ? `translate(0 ${dy})` : undefined}>
      <Tube x={x} y={y} w={w} h={h} liquid={0} progress={progress}>
        {level > 0 ? (
          <g>
            <defs>
              <clipPath id={`${id}-c`}>
                <path d={d} />
              </clipPath>
              <clipPath id={`${id}-l`}>
                <rect x={x - r - 4} y={surf} width={w + 8} height={bottom - surf + 10} />
              </clipPath>
              {sp ? (
                <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={sp.at[0]} cy={sp.at[1]} r={Math.max(1, reach)}>
                  <stop offset="0" stopColor={sp.colour} stopOpacity={1} />
                  <stop offset="0.7" stopColor={sp.colour} stopOpacity={1} />
                  <stop offset="1" stopColor={sp.colour} stopOpacity={0} />
                </radialGradient>
              ) : null}
            </defs>
            <g clipPath={`url(#${id}-c)`}>
              <g clipPath={`url(#${id}-l)`}>
                <g opacity={0.82}>
                  <rect x={x - r - 4} y={surf} width={w + 8} height={bottom - surf + 10} fill={colour} />
                  {sp && reach > 1 ? <circle cx={sp.at[0]} cy={sp.at[1]} r={reach} fill={`url(#${id}-g)`} /> : null}
                </g>
              </g>
              <rect x={x - r - 4} y={surf} width={w + 8} height={Math.min(24, bottom - surf)} fill={C.paper} opacity={0.12} />
              <line x1={x - r - 4} y1={surf} x2={x + r + 4} y2={surf} stroke={mix(tint, C.paper, 0.5)} strokeWidth={3} opacity={0.9} />
              {leafGlow > 0 && leaf > 0 ? <ellipse cx={x} cy={LEAF.cy} rx={34} ry={78} fill={C.leafLight} opacity={0.35 * leafGlow} /> : null}
              {leaf > 0 ? (
                <g>
                  <Leaf geo={geo} progress={leaf} sunlit={sunlit} shadow={0} veins={0.8} />
                  {/* the leaf is under the liquid: a little of the indicator's colour over it */}
                  <g clipPath={`url(#${id}-l)`}>
                    <rect x={x - r - 4} y={surf} width={w + 8} height={bottom - surf + 10} fill={tint} opacity={0.16 * Math.min(1, leaf)} />
                  </g>
                </g>
              ) : null}
              {dots.map((dd, i) => (
                <Co2Dot key={i} d={dd} r={dotR} />
              ))}
            </g>
          </g>
        ) : null}
      </Tube>
      {foil > 0 && foilLift < 1 ? (
        <g opacity={1 - foilLift} transform={`translate(0 ${-150 * EASE.inOut(foilLift)})`}>
          <FoilWrap x={x} y={y - 2} w={w} h={h + 8} progress={foil} />
        </g>
      ) : null}
      {bung > 0 ? (
        <g opacity={Math.min(1, bung * 2)} transform={`translate(0 ${-34 * (1 - EASE.out(bung))})`}>
          <LitShape d={roundRectPath(x - r + 2, y - 38, w - 4, 44, 8)} top={C.terracotta} bottom={C.terracottaDeep} rimOpacity={0.4} shadow={0} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ rack, lamp, photons
export const RackBase: React.FC<{ readonly progress: number; readonly opacity?: number }> = ({ progress, opacity = 1 }) =>
  progress > 0 ? (
    <g opacity={opacity}>
      <Rack x={TUBES.rackX} y={TUBES.rackY} n={3} gap={TUBES.gap} progress={progress} />
    </g>
  ) : null;

/** The lamp beside tube A, with photons streaming to the leaf (`every` frames apart: fewer = dimmer). */
export const LampWithLight: React.FC<{
  readonly f: number;
  readonly progress: number;
  readonly on: number;
  /** first photon leaves at */
  readonly start: number;
  readonly every: (f: number) => number;
  readonly opacity?: number;
}> = ({ f, progress, on, start, every, opacity = 1 }) => {
  if (progress <= 0) return null;
  const travel = 20;
  const tx = SLOTS[0][0];
  const photons: React.ReactNode[] = [];
  if (on > 0.05 && f >= start) {
    // photons are emitted at a rate set by the lamp's brightness; walk back over the last `travel` frames
    let t = start;
    let i = 0;
    const list: number[] = [];
    while (t <= f && i < 400) {
      list.push(t);
      t += Math.max(4, every(t));
      i++;
    }
    list.forEach((t0, k) => {
      const p = (f - t0) / travel;
      if (p <= 0 || p >= 1) return;
      const r = rng(500 + k * 13);
      const from: Pt = [LAMP.x + 48, LAMP.y + (r() - 0.5) * 40];
      const to: Pt = [tx + (r() - 0.5) * 20, LEAF.cy + (r() - 0.5) * 70];
      photons.push(<Photon key={k} from={from} to={to} p={p} size={0.42} />);
    });
  }
  return (
    <g opacity={opacity}>
      <Lamp x={LAMP.x} y={LAMP.y} on={on} beam={LAMP.beam} progress={progress} />
      <g opacity={Math.min(1, on * 1.4)}>{photons}</g>
    </g>
  );
};

/** Plain centred label (condition under a tube, result above it). */
export const TubeText: React.FC<{ readonly x: number; readonly y: number; readonly text: string; readonly p: number; readonly color?: string; readonly size?: number; readonly weight?: 600 | 700 }> = ({
  x,
  y,
  text,
  p,
  color = C.paper,
  size = 44,
  weight = 600,
}) => {
  if (p <= 0) return null;
  return (
    <text
      x={x}
      y={y + (1 - EASE.out(Math.min(1, p))) * 12}
      textAnchor="middle"
      fontFamily={FONT}
      fontWeight={weight}
      fontSize={size}
      fill={color}
      opacity={Math.min(1, p)}
      letterSpacing={-0.5}
      stroke={C.ink900}
      strokeWidth={8}
      strokeOpacity={0.55}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
};

// ------------------------------------------------------------------ colour key
export const KEY = { y: TUBES.keyY, w: 120, h: 56, gap: 200 } as const;
/** Centre x of the key while it is being explained (S16) and once it has moved aside (S16 end, S17). */
export const KEY_CX = { centre: 960, aside: 430 } as const;
const KEY_ITEMS = [
  { s: -1, text: "more CO2" },
  { s: 0, text: "air" },
  { s: 1, text: "less CO2" },
] as const;

/** yellow ← red → purple, with what each colour means. Index 0 yellow, 1 red, 2 purple. */
export const ColourKey: React.FC<{
  readonly cx: number;
  readonly show: readonly [number, number, number];
  readonly arrows: readonly [number, number];
  readonly hi?: readonly [number, number, number];
  readonly opacity?: number;
}> = ({ cx, show, arrows, hi = [0, 0, 0], opacity = 1 }) => {
  if (opacity <= 0 || Math.max(...show) <= 0) return null;
  const y = KEY.y;
  return (
    <g opacity={opacity}>
      {KEY_ITEMS.map((it, i) => {
        const p = show[i];
        if (p <= 0) return null;
        const x = cx + (i - 1) * KEY.gap;
        const e = EASE.out(Math.min(1, p));
        const s = (0.85 + 0.15 * e) * (1 + 0.08 * hi[i]);
        const col = indColour(it.s);
        return (
          <g key={i} opacity={Math.min(1, p * 1.5)}>
            <g transform={`translate(${x} ${y + KEY.h / 2}) scale(${s}) translate(${-x} ${-(y + KEY.h / 2)})`}>
              {hi[i] > 0 ? (
                <rect x={x - KEY.w / 2 - 10} y={y - 10} width={KEY.w + 20} height={KEY.h + 20} rx={24} fill="none" stroke={C.paper} strokeWidth={4} opacity={hi[i]} />
              ) : null}
              <LitShape d={roundRectPath(x - KEY.w / 2, y, KEY.w, KEY.h, 16)} top={mix(col, C.paper, 0.18)} bottom={mix(col, C.ink900, 0.18)} rimOpacity={0.5} shadow={0.45} />
            </g>
            <ChemLabel text={it.text} x={x} y={y + KEY.h + 58} size={40} color={hi[i] > 0.5 ? C.paper : mix(C.paper, C.ink300, 0.35)} />
          </g>
        );
      })}
      {/* from red (air) the colour can go either way */}
      {[0, 1].map((k) => {
        const p = arrows[k];
        if (p <= 0) return null;
        const dir = k === 0 ? -1 : 1;
        const x0 = cx + dir * (KEY.w / 2 + 10);
        const x1 = cx + dir * (KEY.gap - KEY.w / 2 - 10);
        return <HandArrow key={k} from={[x0, y + KEY.h / 2]} to={[x1, y + KEY.h / 2]} bend={0} progress={p} width={4} head={14} color={C.paper} seed={60 + k} opacity={0.8} />;
      })}
    </g>
  );
};

/** Width helper re-exported for scenes that place text beside things. */
export { textWidth };
