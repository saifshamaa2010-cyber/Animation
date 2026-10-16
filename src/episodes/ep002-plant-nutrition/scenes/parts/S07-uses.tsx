/**
 * S07: the five uses of glucose — layout and the five station icons.
 * Each icon is a tiny diagram of what the glucose becomes, built in time with the narration.
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { Glucose, SugarChain, type Link, type Ring } from "../../../../components/SugarChain";
import { LitShape, mix } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { Pt } from "../../../../lib/geometry";

// ------------------------------------------------------------------ layout
export const HUB: Pt = [960, 478];
export const HUB_SCALE = 2.4;
/** Clearance around the hub ring for the spokes. */
export const HUB_R = 92;

export type Station = {
  readonly n: number;
  readonly c: Pt;
  /** clearance around the icon where the spoke stops */
  readonly r: number;
  /** where the glucose ring from the hub arrives */
  readonly arrive: Pt;
  readonly title: string;
  readonly sub: string;
  /** label centre x and title baseline */
  readonly label: Pt;
};

export const TUBE = { x: 800, y: 780, w: 440, h: 64 } as const;
export const CELL_R = { w: 216, h: 140 } as const;
export const CELL_C = { w: 236, h: 150 } as const;

export const STATIONS: readonly Station[] = [
  { n: 1, c: [440, 296], r: 112, arrive: [440, 296], title: "respiration", sub: "releases energy", label: [440, 444] },
  { n: 2, c: [1480, 290], r: 104, arrive: [1351, 290], title: "starch", sub: "energy store", label: [1480, 444] },
  { n: 3, c: [1580, 732], r: 118, arrive: [1502, 657], title: "cellulose", sub: "cell walls", label: [1580, 874] },
  { n: 4, c: [960, 780], r: 40, arrive: [960, 780], title: "sucrose", sub: "transported in phloem", label: [TUBE.x + TUBE.w / 2, 874] },
  { n: 5, c: [340, 722], r: 96, arrive: [340, 722], title: "nectar", sub: "attracts insects", label: [340, 874] },
];

export const spokeOf = (s: Station) => {
  const dx = s.c[0] - HUB[0];
  const dy = s.c[1] - HUB[1];
  const d = Math.hypot(dx, dy);
  const u: Pt = [dx / d, dy / d];
  const from: Pt = [HUB[0] + u[0] * HUB_R, HUB[1] + u[1] * HUB_R];
  const to: Pt = [s.c[0] - u[0] * s.r, s.c[1] - u[1] * s.r];
  const badge: Pt = [from[0] + (to[0] - from[0]) * 0.46, from[1] + (to[1] - from[1]) * 0.46];
  return { from, to, badge, u };
};

// ------------------------------------------------------------------ shared bits
const prog01 = (v: number) => Math.max(0, Math.min(1, v));
/** Numbered badge on a spoke: dim until its use is named, then amber (a sugar). */
export const Badge: React.FC<{ readonly at: Pt; readonly n: number; readonly appear: number; readonly lit: number; readonly pulse: number }> = ({ at, n, appear, lit, pulse }) => {
  if (appear <= 0) return null;
  // the disc grows in; the number never drops below the channel's 40 px minimum
  const s = (0.6 + 0.4 * EASE.out(Math.min(1, appear))) * (1 + 0.14 * pulse);
  const ts = 1 + 0.14 * pulse;
  return (
    <g transform={`translate(${at[0]} ${at[1]})`} opacity={Math.min(1, appear * 1.5)}>
      <g transform={`scale(${s})`}>
        {pulse > 0 ? <circle r={44} fill={C.amber} opacity={0.3 * pulse} /> : null}
        <circle r={31} fill={mix(C.ink700, C.amber, lit)} stroke={mix(C.ink400, C.amberLight, lit)} strokeWidth={3} />
      </g>
      <text y={15 * ts} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42 * ts} fill={mix(C.ink300, C.ink900, lit)} opacity={prog01(appear * 2 - 0.6)}>
        {n}
      </text>
    </g>
  );
};

/**
 * Two-line label under a station: the use, then what it is for. Each line arrives on its own word.
 * `subText` / `subColor` replace the second line (e.g. sucrose: "another sugar" first, in amber, before it
 * becomes "transported in phloem").
 */
export const StationLabel: React.FC<{
  readonly s: Station;
  readonly title: number;
  readonly sub: number;
  readonly glow?: number;
  readonly subText?: string;
  readonly subColor?: string;
}> = ({ s, title, sub, glow = 0, subText, subColor = C.ink300 }) => {
  const line = (text: string, p: number, y: number, size: number, weight: number, color: string) =>
    p > 0 ? (
      <text
        x={s.label[0]}
        y={y + (1 - EASE.out(Math.min(1, p))) * 10}
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight={weight}
        fontSize={size}
        fill={color}
        stroke={C.ink900}
        strokeWidth={size > 40 ? 8 : 6}
        strokeOpacity={0.6}
        paintOrder="stroke"
        letterSpacing={size > 40 ? -0.5 : 0}
        opacity={Math.min(1, p)}
      >
        {text}
      </text>
    ) : null;
  return (
    <g>
      {line(s.title, title, s.label[1], 46, 600, mix(C.paper, C.amberLight, glow))}
      {line(subText ?? s.sub, sub, s.label[1] + 52, 40, 400, subColor)}
    </g>
  );
};

// ------------------------------------------------------------------ 1 · respiration
/**
 * A plant cell; glucose inside is broken down and energy bursts out (amber = energy from the sugar).
 * Afterwards small waves of energy keep spreading through the cell (`waves`: 0..1 phase of each wave).
 */
export const RespirationIcon: React.FC<{
  readonly c: Pt;
  readonly cell: number;
  readonly ring: number;
  readonly burst: number;
  readonly warm: number;
  readonly waves: readonly number[];
  readonly gid: string;
}> = ({ c, cell, ring, burst, warm, waves, gid }) => {
  if (cell <= 0) return null;
  const { w, h } = CELL_R;
  const d = roundRectPath(c[0] - w / 2, c[1] - h / 2, w, h, 36);
  const b = Math.max(0, Math.min(1, burst));
  const eb = EASE.out(b);
  return (
    <g opacity={Math.min(1, cell * 1.5)} transform={`translate(0 ${(1 - EASE.out(Math.min(1, cell))) * 14})`}>
      <LitShape d={d} top={mix(C.leafDark, C.ink700, 0.45)} bottom={C.ink800} rimOpacity={0.45} shadow={0.45} shadowDy={10} shadowBlur={12} />
      <path d={d} fill="none" stroke={C.leafLight} strokeOpacity={0.55} strokeWidth={5} />
      {warm > 0 ? <ellipse cx={c[0]} cy={c[1]} rx={78} ry={46} fill={C.amber} opacity={0.32 * warm} filter={`url(#${gid}-blur)`} /> : null}
      {ring > 0 && b < 1 ? <Glucose x={c[0]} y={c[1]} tone="sugar" glow={0.3 + 0.7 * b} scale={0.62 * (1 + 0.25 * b)} opacity={Math.min(1, ring) * (1 - EASE.in(b))} /> : null}
      {waves.map((w, i) =>
        w > 0 && w < 1 ? (
          <g key={i} opacity={Math.min(1, w * 5) * (1 - w) * 0.9}>
            {Array.from({ length: 8 }, (_, j) => {
              const a = (j / 8) * Math.PI * 2 + 0.2 + i * 0.4;
              const r = 22 + 62 * EASE.out(w);
              return <circle key={j} cx={c[0] + Math.cos(a) * r} cy={c[1] + Math.sin(a) * r * 0.6} r={5} fill={C.amberLight} />;
            })}
          </g>
        ) : null,
      )}
      {b > 0 && b < 1 ? (
        <g opacity={1 - b}>
          <circle cx={c[0]} cy={c[1]} r={20 + 46 * eb} fill="none" stroke={C.amberLight} strokeWidth={4} opacity={0.8} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2 + 0.3;
            const r0 = 16 + 40 * eb;
            const r1 = r0 + 20 * (1 - 0.5 * eb);
            const sy = 0.62; // the cell is wider than tall
            return (
              <line
                key={i}
                x1={c[0] + Math.cos(a) * r0}
                y1={c[1] + Math.sin(a) * r0 * sy}
                x2={c[0] + Math.cos(a) * r1}
                y2={c[1] + Math.sin(a) * r1 * sy}
                stroke={C.amberLight}
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ 2 · starch
const STARCH_N = 7;
const STARCH_SCALE = 0.54;
const LINK_GAP = 43; // centre-to-centre at this scale

const spiral = (c: Pt): { p: Pt; rot: number }[] => {
  const out: { p: Pt; rot: number }[] = [];
  let th = Math.PI * 1.05;
  let rPrev = 68;
  for (let j = 0; j < STARCH_N; j++) {
    const r = 68 - j * 7;
    if (j > 0) th += LINK_GAP / ((r + rPrev) / 2);
    rPrev = r;
    out.push({ p: [c[0] + Math.cos(th) * r, c[1] + Math.sin(th) * r * 0.92], rot: (th * 180) / Math.PI + 90 });
  }
  return out;
};

/** Glucose rings join into a chain that coils up compactly: starch, an energy store. */
export const StarchIcon: React.FC<{ readonly c: Pt; readonly grow: number; readonly coil: number; readonly granule: number; readonly opacity?: number }> = ({
  c,
  grow,
  coil,
  granule,
  opacity = 1,
}) => {
  if (grow <= 0) return null;
  const sp = spiral(c);
  const e = EASE.inOut(Math.max(0, Math.min(1, coil)));
  const rings: Ring[] = Array.from({ length: STARCH_N }, (_, j) => {
    const a = Math.max(0, Math.min(1, grow * STARCH_N - j));
    const straight: Pt = [c[0] - 3 * LINK_GAP + j * LINK_GAP, c[1]];
    const x = straight[0] + (sp[j].p[0] - straight[0]) * e;
    const y = straight[1] + (sp[j].p[1] - straight[1]) * e;
    return { x, y, rot: sp[j].rot * e, tone: "starch", scale: STARCH_SCALE * (0.6 + 0.4 * EASE.out(a)), opacity: a };
  });
  const links: Link[] = Array.from({ length: STARCH_N - 1 }, (_, j) => ({ a: j, b: j + 1 }));
  return (
    <g opacity={opacity}>
      {granule > 0 ? (
        <g opacity={granule}>
          <ellipse cx={c[0] - 6} cy={c[1] + 2} rx={100} ry={88} fill={C.cream} opacity={0.1} />
          <ellipse cx={c[0] - 6} cy={c[1] + 2} rx={100} ry={88} fill="none" stroke={C.cream} strokeOpacity={0.5} strokeWidth={3} />
        </g>
      ) : null}
      <SugarChain rings={rings} links={links} />
    </g>
  );
};

// ------------------------------------------------------------------ 3 · cellulose
const WALL_N = 20;

/** Evenly spaced points (and tangent angles) around a rounded rectangle, clockwise from the top-left. */
const roundRectPerimeter = (cx: number, cy: number, w: number, h: number, r: number, n: number) => {
  const sw = w - 2 * r;
  const sh = h - 2 * r;
  const arc = (Math.PI * r) / 2;
  const segs: { len: number; at: (t: number) => { p: Pt; ang: number } }[] = [];
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const corner = (ox: number, oy: number, a0: number) => (t: number) => {
    const a = a0 + (t * Math.PI) / 2;
    return { p: [ox + Math.cos(a) * r, oy + Math.sin(a) * r] as Pt, ang: (a * 180) / Math.PI + 90 };
  };
  segs.push({ len: sw, at: (t) => ({ p: [x0 + r + t * sw, y0], ang: 0 }) });
  segs.push({ len: arc, at: corner(x0 + w - r, y0 + r, -Math.PI / 2) });
  segs.push({ len: sh, at: (t) => ({ p: [x0 + w, y0 + r + t * sh], ang: 90 }) });
  segs.push({ len: arc, at: corner(x0 + w - r, y0 + h - r, 0) });
  segs.push({ len: sw, at: (t) => ({ p: [x0 + w - r - t * sw, y0 + h], ang: 180 }) });
  segs.push({ len: arc, at: corner(x0 + r, y0 + h - r, Math.PI / 2) });
  segs.push({ len: sh, at: (t) => ({ p: [x0, y0 + h - r - t * sh], ang: 270 }) });
  segs.push({ len: arc, at: corner(x0 + r, y0 + r, Math.PI) });
  const total = segs.reduce((a, s) => a + s.len, 0);
  return Array.from({ length: n }, (_, i) => {
    let d = (i / n) * total;
    for (const s of segs) {
      if (d <= s.len) return s.at(d / s.len);
      d -= s.len;
    }
    return segs[0].at(0);
  });
};

/** A plant cell whose wall is built, unit by unit, from glucose: cellulose. */
export const CelluloseIcon: React.FC<{ readonly c: Pt; readonly cell: number; readonly built: number; readonly wall: number; readonly opacity?: number }> = ({
  c,
  cell,
  built,
  wall,
  opacity = 1,
}) => {
  if (cell <= 0) return null;
  const { w, h } = CELL_C;
  const d = roundRectPath(c[0] - w / 2, c[1] - h / 2, w, h, 40);
  const pts = roundRectPerimeter(c[0], c[1], w, h, 40, WALL_N);
  const rings: Ring[] = pts.map((q, i) => {
    const a = Math.max(0, Math.min(1, built * WALL_N - i));
    return { x: q.p[0], y: q.p[1], rot: q.ang, flip: i % 2 === 1, tone: "cellulose", scale: 0.34 * (0.6 + 0.4 * EASE.out(a)), opacity: a };
  });
  const links: Link[] = pts.map((_, i) => ({ a: i, b: (i + 1) % WALL_N, zig: i % 2 === 0 ? 1 : -1 }));
  return (
    <g opacity={Math.min(1, cell * 1.5) * opacity}>
      <LitShape d={d} top={mix(C.leafDark, C.ink700, 0.45)} bottom={C.ink800} rimOpacity={0.3} shadow={0.45} shadowDy={10} shadowBlur={12} />
      {wall > 0 ? <path d={d} fill="none" stroke={C.paper} strokeOpacity={0.2 * wall} strokeWidth={30} /> : null}
      <SugarChain rings={rings} links={links} />
    </g>
  );
};

// ------------------------------------------------------------------ 4 · sucrose in the phloem
/** A length of phloem (sieve tube) with sieve plates; sucrose is carried along it. */
export const PhloemTube: React.FC<{ readonly p: number; readonly arrow: number; readonly gid: string; readonly opacity?: number; readonly children?: React.ReactNode }> = ({
  p,
  arrow,
  gid,
  opacity = 1,
  children,
}) => {
  if (p <= 0) return null;
  const { x, y, w, h } = TUBE;
  const d = roundRectPath(x, y - h / 2, w, h, h / 2);
  const shown = EASE.out(Math.min(1, p));
  return (
    <g opacity={Math.min(1, p * 2) * opacity}>
      <defs>
        <clipPath id={`${gid}-tube`}>
          <rect x={x - 10} y={y - h} width={(w + 20) * shown} height={h * 2} />
        </clipPath>
        <clipPath id={`${gid}-tubein`}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${gid}-tube)`}>
        <LitShape d={d} top={mix(C.leafDark, C.amber, 0.3)} bottom={mix(C.leafDark, C.ink800, 0.3)} rimOpacity={0.5} shadow={0.45} shadowDy={8} shadowBlur={10} />
        {[x + w * 0.3, x + w * 0.66].map((sx) => (
          <line key={sx} x1={sx} y1={y - h / 2 + 6} x2={sx} y2={y + h / 2 - 6} stroke={C.paper} strokeOpacity={0.55} strokeWidth={4} strokeDasharray="7 7" strokeLinecap="round" />
        ))}
        <g clipPath={`url(#${gid}-tubein)`}>{children}</g>
      </g>
      {arrow > 0 ? (
        <path
          d={`M${x + w + 20},${y - 18} L${x + w + 40},${y} L${x + w + 20},${y + 18}`}
          fill="none"
          stroke={C.amber}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={arrow}
          transform={`translate(${(1 - EASE.out(arrow)) * -12} 0)`}
        />
      ) : null}
    </g>
  );
};
