/**
 * Notebook doodles for the v2 "worlds" look (light paper worlds: notebook, journal, desk notes).
 * Everything here looks drawn by a student with a fine pen and then coloured in with felt tips:
 *  - InkShape: an ink outline that draws on like a pen (`draw`), then its colour fills in (`fill`),
 *    a few px out of register like real colouring-in;
 *  - SandwichDoodle ("you eat food"), PottedPlantDoodle (+ plantSunLeaf geometry), HammerDoodle ("make");
 *  - WaterDropBuddy: water as a little drop character (matches CO2Buddy / GlucoseBuddy);
 *  - HighlightSwipe: a highlighter-pen band behind written words (multiply blend, chisel ends);
 *  - HandBox: a hand-drawn box round something to learn; InkTab: a small ink label tab ("LEARN THIS").
 * SVG in the caller's coordinates, all driven by props from the frame (no CSS animation). Reusable.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, EASE, W2 } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { rng } from "../../lib/geometry";
import { useSvgId } from "../ids";
import { HandLayer, InkPath, mix } from "../kit/shared";
import {
  inkGeometry,
  penEase,
  prepareStroke,
  seg,
  type InkStyle,
} from "../kit/ink";
import { textWidth } from "../kit/text";

type Pt = readonly [number, number];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c1 + 1) * x * x * x + c1 * x * x;
};
/** Pen ink on paper (all doodle outlines). */
export const DOODLE_INK = W2.inkText;

// ------------------------------------------------------------------------------------ ink shape

/**
 * One doodle part. Its outline draws on with `draw` 0..1 (pen speed eased), then the colour fills in
 * with `fill` 0..1, slightly offset from the line like real felt-tip colouring.
 */
export const InkShape: React.FC<{
  readonly d: string;
  readonly draw: number;
  readonly fill?: number;
  readonly color?: string;
  readonly ink?: string;
  readonly width?: number;
  readonly fillOpacity?: number;
  readonly offset?: Pt;
}> = ({
  d,
  draw,
  fill = 0,
  color,
  ink = DOODLE_INK,
  width = 5,
  fillOpacity = 1,
  offset = [3, 3],
}) => (
  <g>
    {fill > 0 && color ? (
      <path
        d={d}
        fill={color}
        opacity={clamp01(fill) * fillOpacity}
        transform={`translate(${offset[0]} ${offset[1]})`}
      />
    ) : null}
    {draw > 0 ? (
      <path
        d={d}
        fill="none"
        stroke={ink}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${penEase(clamp01(draw))} 2`}
      />
    ) : null}
  </g>
);

// ------------------------------------------------------------------------------------ sandwich

const lettucePath = () => {
  let d = "M-194,66";
  for (let i = 0; i < 10; i++) {
    const x = -194 + i * 38.8;
    d += ` Q${(x + 19.4).toFixed(1)},${i % 2 ? 40 : 46} ${(x + 38.8).toFixed(1)},${i % 2 ? 66 : 62}`;
  }
  d += " L190,84 Q0,92 -190,84 Z";
  return d;
};
const SANDWICH = {
  plate: "M-236,122 A236,46 0 1 0 236,122 A236,46 0 1 0 -236,122 Z",
  plateRim: "M-172,116 A172,26 0 1 0 172,116",
  bottom: "M-178,74 Q-182,112 -150,114 L150,114 Q182,112 178,74 Z",
  lettuce: lettucePath(),
  tomatoA: "M-150,40 H-34 A11,11 0 0 1 -34,62 H-150 A11,11 0 0 1 -150,40 Z",
  tomatoB: "M30,40 H146 A11,11 0 0 1 146,62 H30 A11,11 0 0 1 30,40 Z",
  cheese:
    "M-176,24 L176,24 L176,40 L124,40 Q112,74 100,72 Q90,70 84,40 L-176,40 Z",
  top: "M-182,30 C-188,-38 -112,-94 0,-96 C112,-94 188,-38 182,30 Z",
  seeds: [
    [-96, -46, -20],
    [-34, -70, 8],
    [40, -64, -12],
    [104, -40, 22],
    [-130, -6, -28],
    [-8, -28, 4],
    [72, -10, 16],
  ] as const,
};

/** "You eat food": a sandwich on a plate, side on, drawn in ink then coloured in. ~480 × 270 px at scale 1. */
export const SandwichDoodle: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly progress: number;
  readonly opacity?: number;
  readonly rough?: number;
}> = ({ x, y, scale = 1, progress, opacity = 1, rough = 1.1 }) => {
  if (progress <= 0) return null;
  const p = progress;
  const bread = mix(C.amber, C.cream, 0.35);
  return (
    <HandLayer opacity={opacity} rough={rough} seed={17}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <InkShape
          d={SANDWICH.plate}
          draw={seg(p, 0, 0.18)}
          fill={seg(p, 0.5, 0.72)}
          color="#FFFFFF"
          fillOpacity={0.9}
          offset={[0, 0]}
        />
        <InkShape d={SANDWICH.plateRim} draw={seg(p, 0.12, 0.24)} width={3} />
        <InkShape
          d={SANDWICH.bottom}
          draw={seg(p, 0.14, 0.3)}
          fill={seg(p, 0.55, 0.78)}
          color={bread}
        />
        <InkShape
          d={SANDWICH.lettuce}
          draw={seg(p, 0.24, 0.42)}
          fill={seg(p, 0.6, 0.82)}
          color={C.leaf}
        />
        <InkShape
          d={SANDWICH.tomatoA}
          draw={seg(p, 0.34, 0.46)}
          fill={seg(p, 0.64, 0.86)}
          color={C.coral}
        />
        <InkShape
          d={SANDWICH.tomatoB}
          draw={seg(p, 0.38, 0.5)}
          fill={seg(p, 0.66, 0.88)}
          color={C.coral}
        />
        <InkShape
          d={SANDWICH.cheese}
          draw={seg(p, 0.44, 0.58)}
          fill={seg(p, 0.7, 0.9)}
          color={C.sun}
        />
        <InkShape
          d={SANDWICH.top}
          draw={seg(p, 0.52, 0.74)}
          fill={seg(p, 0.74, 0.96)}
          color={C.amber}
        />
        {/* a soft highlight on the bun (felt-tip left a lighter streak) */}
        <path
          d="M-120,-40 Q-70,-80 -10,-82"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.55 * seg(p, 0.85, 1)}
          strokeWidth={10}
          strokeLinecap="round"
        />
        {SANDWICH.seeds.map(([sx, sy, r], i) => {
          const s = seg(p, 0.8 + i * 0.025, 0.9 + i * 0.015);
          return s > 0 ? (
            <ellipse
              key={i}
              cx={sx}
              cy={sy}
              rx={9}
              ry={4.6}
              transform={`rotate(${r} ${sx} ${sy})`}
              fill={C.paper}
              stroke={DOODLE_INK}
              strokeWidth={2.5}
              opacity={s}
            />
          ) : null;
        })}
      </g>
    </HandLayer>
  );
};

// ------------------------------------------------------------------------------------ potted plant

type LeafSpec = { readonly base: Pt; readonly tip: Pt; readonly w: number };
/** The plant's leaves (pot-top-centre coordinates at scale 1). Leaf 0 is the big sunlit one (top right). */
const PLANT_LEAVES: readonly LeafSpec[] = [
  { base: [2, -170], tip: [212, -262], w: 66 },
  { base: [-4, -96], tip: [-186, -150], w: 54 },
  { base: [-2, -258], tip: [-80, -330], w: 32 },
];
const leafGeo = ({ base, tip, w }: LeafSpec) => {
  const dx = tip[0] - base[0];
  const dy = tip[1] - base[1];
  const L = Math.hypot(dx, dy);
  const n: Pt = [-dy / L, dx / L];
  const mid: Pt = [base[0] + dx * 0.5, base[1] + dy * 0.5];
  const c1: Pt = [mid[0] + n[0] * w, mid[1] + n[1] * w];
  const c2: Pt = [mid[0] - n[0] * w * 0.92, mid[1] - n[1] * w * 0.92];
  const outline = `M${base[0]},${base[1]} Q${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${tip[0]},${tip[1]} Q${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${base[0]},${base[1]} Z`;
  const at = (u: number, side: number): Pt => [
    base[0] + dx * u + n[0] * side,
    base[1] + dy * u + n[1] * side,
  ];
  const rib = `M${at(0.04, 0)[0].toFixed(1)},${at(0.04, 0)[1].toFixed(1)} Q${at(0.5, w * 0.08)[0].toFixed(1)},${at(0.5, w * 0.08)[1].toFixed(1)} ${at(0.9, 0)[0].toFixed(1)},${at(0.9, 0)[1].toFixed(1)}`;
  const veins = [0.3, 0.5, 0.7].flatMap((u) =>
    [1, -1].map((s) => {
      const a = at(u, w * 0.04);
      const b = at(u + 0.13, s * w * 0.34);
      return `M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    }),
  );
  return { outline, rib, veins, mid };
};

/** Where things happen on the plant's big sunlit leaf (screen coordinates). */
export const plantSunLeaf = (x: number, y: number, scale = 1) => {
  const L = PLANT_LEAVES[0];
  const to = (p: Pt): Pt => [x + p[0] * scale, y + p[1] * scale];
  const g = leafGeo(L);
  return { base: to(L.base), tip: to(L.tip), mid: to(g.mid) };
};

/**
 * A potted plant, drawn in ink then coloured. (x, y) = the centre of the pot's top; the plant grows up
 * ~340 px and the pot hangs down ~150 px at scale 1. `lit` 0..1 lights up the big leaf (light landing).
 */
export const PottedPlantDoodle: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly progress: number;
  readonly lit?: number;
  readonly opacity?: number;
  readonly rough?: number;
}> = ({ x, y, scale = 1, progress, lit = 0, opacity = 1, rough = 1.1 }) => {
  const id = useSvgId("pplant");
  if (progress <= 0) return null;
  const p = progress;
  const leaves = PLANT_LEAVES.map(leafGeo);
  const order = [1, 0, 2];
  const drawAt = [
    [0.5, 0.7],
    [0.4, 0.6],
    [0.6, 0.78],
  ];
  const stem = "M0,-28 C-8,-110 10,-190 -2,-262";
  const stemDraw = penEase(seg(p, 0.26, 0.48));
  return (
    <HandLayer opacity={opacity} rough={rough} seed={23}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <defs>
          <filter
            id={`${id}-glow`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation={18} />
          </filter>
        </defs>
        {/* stem: ink edges with a green core */}
        {stemDraw > 0 ? (
          <g>
            <path
              d={stem}
              fill="none"
              stroke={DOODLE_INK}
              strokeWidth={15}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${stemDraw} 2`}
            />
            <path
              d={stem}
              fill="none"
              stroke={C.leaf}
              strokeWidth={8}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${stemDraw} 2`}
              opacity={seg(p, 0.4, 0.6)}
            />
          </g>
        ) : null}
        {order.map((i) => {
          const g = leaves[i];
          const [a, b] = drawAt[i];
          const glow = i === 0 ? clamp01(lit) : 0;
          return (
            <g key={i}>
              {glow > 0 ? (
                <path
                  d={g.outline}
                  fill={C.sun}
                  opacity={0.7 * glow}
                  filter={`url(#${id}-glow)`}
                />
              ) : null}
              <InkShape
                d={g.outline}
                draw={seg(p, a, b)}
                fill={seg(p, b - 0.02, b + 0.2)}
                color={glow > 0 ? mix(C.leaf, C.leafLight, 0.6 * glow) : C.leaf}
              />
              <InkShape
                d={g.rib}
                draw={seg(p, b + 0.04, b + 0.16)}
                width={3}
                ink={C.leafDark}
              />
              {g.veins.map((v, j) => (
                <InkShape
                  key={j}
                  d={v}
                  draw={seg(p, b + 0.1 + j * 0.012, b + 0.2 + j * 0.012)}
                  width={2.5}
                  ink={C.leafDark}
                />
              ))}
            </g>
          );
        })}
        {/* pot */}
        <InkShape
          d="M-90,0 L90,0 L72,128 Q70,140 58,140 L-58,140 Q-70,140 -72,128 Z"
          draw={seg(p, 0, 0.18)}
          fill={seg(p, 0.42, 0.62)}
          color={C.terracotta}
        />
        <InkShape
          d="M-106,-30 L106,-30 Q112,-30 112,-24 L112,4 Q112,10 106,10 L-106,10 Q-112,10 -112,4 L-112,-24 Q-112,-30 -106,-30 Z"
          draw={seg(p, 0.1, 0.28)}
          fill={seg(p, 0.46, 0.66)}
          color={mix(C.terracotta, "#FFFFFF", 0.2)}
        />
        <path
          d="M-60,40 Q-50,90 -40,120"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.4 * seg(p, 0.7, 0.9)}
          strokeWidth={8}
          strokeLinecap="round"
        />
      </g>
    </HandLayer>
  );
};

// ------------------------------------------------------------------------------------ hammer

/** A small hammer ("make", "build"). (x, y) = centre; drawn in ink then coloured. ~110 px tall at scale 1. */
export const HammerDoodle: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly rotate?: number;
  readonly progress: number;
  readonly opacity?: number;
}> = ({ x, y, scale = 1, rotate = 30, progress, opacity = 1 }) => {
  if (progress <= 0) return null;
  const p = progress;
  return (
    <HandLayer opacity={opacity} rough={1} seed={29}>
      <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
        <InkShape
          d="M-9,-30 H9 V58 Q9,66 0,66 Q-9,66 -9,58 Z"
          draw={seg(p, 0, 0.4)}
          fill={seg(p, 0.45, 0.8)}
          color={C.bark}
          width={4}
        />
        <InkShape
          d="M-44,-58 H34 Q46,-58 46,-46 V-34 Q46,-26 38,-26 H-44 Q-50,-26 -50,-34 V-50 Q-50,-58 -44,-58 Z"
          draw={seg(p, 0.3, 0.75)}
          fill={seg(p, 0.6, 1)}
          color={C.ink300}
          width={4}
        />
        <path
          d="M-36,-50 H24"
          stroke="#FFFFFF"
          strokeOpacity={0.7 * seg(p, 0.8, 1)}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
    </HandLayer>
  );
};

// ------------------------------------------------------------------------------------ water drop buddy

/** Water as a drop character (a drop of water, not a molecule): matches CO2Buddy and GlucoseBuddy. ~112 px tall at scale 1. */
export const WaterDropBuddy: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly progress?: number;
  readonly look?: number;
  readonly opacity?: number;
  readonly seed?: number;
}> = ({ x, y, scale = 1, progress = 1, look = 0, opacity = 1, seed = 3 }) => {
  const id = useSvgId("drop");
  const f = useCurrentFrame();
  if (progress <= 0 || opacity <= 0) return null;
  const s = scale * back(progress);
  const bob = Math.sin((f + seed * 19) / 16) * 3;
  const blink = (f + seed * 23) % 101 < 4;
  const d =
    "M0,-62 C12,-42 40,-16 40,14 A40,40 0 0 1 -40,14 C-40,-16 -12,-42 0,-62 Z";
  const eye = (cx: number) =>
    blink ? (
      <path
        d={`M${cx - 5},12 Q${cx},16 ${cx + 5},12`}
        fill="none"
        stroke="#1C1830"
        strokeWidth={3}
        strokeLinecap="round"
      />
    ) : (
      <g>
        <ellipse cx={cx} cy={12} rx={5.6} ry={7} fill="#FFFFFF" />
        <circle cx={cx + look * 1.8} cy={13} r={3.4} fill="#1C1830" />
      </g>
    );
  return (
    <g
      opacity={Math.min(1, progress * 2) * opacity}
      transform={`translate(${x} ${y + bob}) scale(${s})`}
    >
      <defs>
        <radialGradient id={`${id}-g`} cx="0.38" cy="0.45" r="0.75">
          <stop offset="0" stopColor={mix(C.ice, "#FFFFFF", 0.55)} />
          <stop offset="0.55" stopColor={C.ice} />
          <stop offset="1" stopColor={C.iceDeep} />
        </radialGradient>
      </defs>
      <ellipse cx={4} cy={60} rx={34} ry={7} fill="#000000" opacity={0.12} />
      <path
        d={d}
        fill={`url(#${id}-g)`}
        stroke="#1C1830"
        strokeOpacity={0.6}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <ellipse
        cx={-18}
        cy={-2}
        rx={6}
        ry={13}
        fill="#FFFFFF"
        opacity={0.6}
        transform="rotate(24 -18 -2)"
      />
      {eye(-12)}
      {eye(12)}
      <path
        d="M-6,26 Q0,32 6,26"
        fill="none"
        stroke="#1C1830"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <ellipse cx={-22} cy={24} rx={5} ry={3} fill={W2.cheek} opacity={0.55} />
      <ellipse cx={22} cy={24} rx={5} ry={3} fill={W2.cheek} opacity={0.55} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ highlighter

/** Where the highlighter's chisel tip is along a swipe from x1 to x2 at `progress` (to hold a <Pen kind="marker">). */
export const swipeX = (x1: number, x2: number, progress: number) =>
  x1 - 8 + (x2 - x1 + 16) * EASE.inOut(clamp01(progress));

/**
 * A highlighter-pen band behind written words, swiped left to right. (x1, x2) = the words' extent,
 * y = the band's centre line. Drawn with a multiply blend so the ink stays crisp on top.
 */
export const HighlightSwipe: React.FC<{
  readonly x1: number;
  readonly x2: number;
  readonly y: number;
  readonly h?: number;
  readonly progress: number;
  readonly color: string;
  readonly seed?: number;
  readonly opacity?: number;
}> = ({ x1, x2, y, h = 58, progress, color, seed = 1, opacity = 0.6 }) => {
  const id = useSvgId("hl");
  if (progress <= 0) return null;
  const r = rng(seed * 131 + 7);
  const a = x1 - 10;
  const b = x2 + 10;
  const n = Math.max(3, Math.ceil((b - a) / 60));
  const rise = -0.012 * (b - a); // a right hand drifts up a touch
  const top: Pt[] = Array.from({ length: n + 1 }, (_, i) => [
    a + ((b - a) * i) / n,
    y - h / 2 + rise * (i / n) + (r() - 0.5) * 4,
  ]);
  const bot: Pt[] = Array.from({ length: n + 1 }, (_, i) => [
    a + ((b - a) * i) / n,
    y + h / 2 + rise * (i / n) + (r() - 0.5) * 4,
  ]);
  // chisel ends: slanted like a real highlighter nib
  const d =
    `M${top[0][0] + 10},${top[0][1]} ` +
    top
      .slice(1, -1)
      .map((q) => `L${q[0].toFixed(1)},${q[1].toFixed(1)}`)
      .join(" ") +
    ` L${top[n][0] + 6},${top[n][1]} L${bot[n][0] - 8},${bot[n][1]} ` +
    bot
      .slice(1, -1)
      .reverse()
      .map((q) => `L${q[0].toFixed(1)},${q[1].toFixed(1)}`)
      .join(" ") +
    ` L${bot[0][0] - 6},${bot[0][1]} Z`;
  const edge = swipeX(x1, x2, progress) + 6;
  return (
    <g style={{ mixBlendMode: "multiply" }} opacity={opacity}>
      <defs>
        <clipPath id={`${id}-c`}>
          <rect
            x={a - 20}
            y={y - h}
            width={Math.max(0, edge - a + 20)}
            height={h * 2}
          />
        </clipPath>
      </defs>
      <path d={d} fill={color} clipPath={`url(#${id}-c)`} />
    </g>
  );
};

// ------------------------------------------------------------------------------------ hand-drawn box

/**
 * A box drawn by hand round something to learn: four pen strokes (top, right, bottom, left) that
 * overshoot their corners a little. `progress` 0..1 (linear; pen speed is eased inside).
 */
export const HandBox: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly progress: number;
  readonly color?: string;
  readonly width?: number;
  readonly seed?: number;
  readonly opacity?: number;
}> = ({
  x,
  y,
  w,
  h,
  progress,
  color = DOODLE_INK,
  width = 5,
  seed = 1,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  if (progress <= 0) return null;
  const style = (salt: number): InkStyle => ({
    width,
    seed: seed * 7919 + salt,
    wobble: 1.4,
    minStart: 0.55,
    minEnd: 0.35,
    taperEnd: 16,
    taperStart: 8,
    frame,
  });
  const sides: Pt[][] = [
    [
      [x - 12, y + 3],
      [x + w * 0.5, y - 1],
      [x + w + 14, y - 3],
    ],
    [
      [x + w + 2, y - 12],
      [x + w + 1, y + h * 0.5],
      [x + w - 2, y + h + 12],
    ],
    [
      [x + w + 12, y + h + 1],
      [x + w * 0.5, y + h + 3],
      [x - 14, y + h - 1],
    ],
    [
      [x + 1, y + h + 10],
      [x - 1, y + h * 0.5],
      [x + 2, y - 14],
    ],
  ];
  const cuts = [
    [0, 0.3],
    [0.33, 0.48],
    [0.52, 0.82],
    [0.85, 1],
  ];
  return (
    <HandLayer opacity={opacity} rough={0.5} seed={seed}>
      {sides.map((pts, i) => {
        const st = style(i * 37);
        const s = prepareStroke(pts, st);
        return (
          <InkPath
            key={i}
            geo={inkGeometry(
              s.poly,
              s.L,
              st,
              penEase(seg(progress, cuts[i][0], cuts[i][1])),
            )}
            color={color}
          />
        );
      })}
    </HandLayer>
  );
};

// ------------------------------------------------------------------------------------ ink tab

/** A small label tab in ink (e.g. "LEARN THIS") stuck on a box edge. (x, y) = its left end, vertical centre. */
export const InkTab: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly progress: number;
  readonly size?: number;
  readonly rotate?: number;
  readonly fill?: string;
}> = ({ x, y, text, progress, size = 40, rotate = -2, fill = DOODLE_INK }) => {
  if (progress <= 0) return null;
  const w = textWidth(text, size, 700, 3) + size * 1.2;
  const h = size * 1.5;
  const s = back(progress);
  return (
    <g
      opacity={Math.min(1, progress * 2.5)}
      transform={`translate(${x + w / 2} ${y}) rotate(${rotate}) scale(${s}) translate(${-w / 2} 0)`}
    >
      <rect
        x={4}
        y={-h / 2 + 7}
        width={w}
        height={h}
        rx={12}
        fill="#000000"
        opacity={0.16}
      />
      <rect x={0} y={-h / 2} width={w} height={h} rx={12} fill={fill} />
      <text
        x={w / 2}
        y={size * 0.36}
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight={700}
        fontSize={size}
        letterSpacing={3}
        fill={C.paper}
      >
        {text}
      </text>
    </g>
  );
};

/** Width of an InkTab (to place things beside it). */
export const inkTabWidth = (text: string, size = 40) =>
  textWidth(text, size, 700, 3) + size * 1.2;
