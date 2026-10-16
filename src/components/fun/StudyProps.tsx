/**
 * Study-desk props for the v2 "worlds" look (EP002 v2 onwards): a writing pen and a felt marker that
 * really hold the tip where the ink is, a comic shout bubble, taped paper-slip labels, a topic tag, a
 * smiling sun, a marker loop whose tip position is known, and cartoon impact lines.
 * All SVG in 1920×1080 coordinates, all driven by the frame (no CSS animation). Reusable in any episode.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, EASE, W2 } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { rng } from "../../lib/geometry";
import { useSvgId } from "../ids";
import { HandLayer, mix } from "../kit/shared";
import { textWidth } from "../kit/text";

type Pt = readonly [number, number];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c1 + 1) * x * x * x + c1 * x * x;
};

// ------------------------------------------------------------------------------------------ pens

export type PenKind = "pen" | "marker";

/**
 * A pen (or felt marker) whose TIP is at (x, y). `angle` = direction from the tip to the back end, in
 * degrees (−58 = held by a right hand, body up and to the right). `progress` 0..1 slides it in along
 * its own axis; pass a falling value to take it away again.
 */
export const Pen: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly angle?: number;
  readonly kind?: PenKind;
  /** body colour (the marker's ink colour too) */
  readonly color?: string;
  readonly progress?: number;
  readonly scale?: number;
}> = ({ x, y, angle = -58, kind = "pen", color = C.ink600, progress = 1, scale = 1 }) => {
  const id = useSvgId("pen");
  if (progress <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const slide = (1 - p) * 320;
  const dark = mix(color, "#000000", 0.35);
  const light = mix(color, "#FFFFFF", 0.3);
  const body =
    kind === "pen" ? (
      <g>
        <path d="M0,0 L26,-6 L26,6 Z" fill={C.foil} />
        <circle cx={1} cy={0} r={2.4} fill={W2.inkText} />
        <path d="M26,-6 L50,-12 L50,12 L26,6 Z" fill={C.ink800} />
        <rect x={48} y={-13} width={52} height={26} rx={5} fill={C.ink800} />
        {[60, 70, 80, 90].map((gx) => (
          <line key={gx} x1={gx} y1={-11} x2={gx} y2={11} stroke="#000000" strokeOpacity={0.35} strokeWidth={2} />
        ))}
        <rect x={98} y={-14} width={170} height={28} rx={10} fill={`url(#${id}-b)`} />
        <rect x={262} y={-13} width={22} height={26} rx={8} fill={dark} />
        <rect x={198} y={-21} width={70} height={9} rx={4} fill={C.foil} />
        <line x1={108} y1={-6} x2={256} y2={-6} stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
      </g>
    ) : (
      <g>
        <path d="M0,-4 L0,5 L20,11 L20,-11 Z" fill={color} />
        <rect x={18} y={-15} width={26} height={30} rx={4} fill={dark} />
        <rect x={42} y={-20} width={214} height={40} rx={13} fill={`url(#${id}-b)`} />
        <rect x={112} y={-20} width={96} height={40} fill={C.paper} opacity={0.92} />
        <rect x={122} y={-8} width={76} height={6} rx={3} fill={color} opacity={0.8} />
        <rect x={122} y={4} width={50} height={5} rx={2.5} fill={color} opacity={0.5} />
        <rect x={250} y={-18} width={22} height={36} rx={8} fill={dark} />
        <line x1={52} y1={-10} x2={244} y2={-10} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  return (
    <g opacity={Math.min(1, progress * 2.5)} transform={`translate(${x} ${y}) rotate(${angle}) translate(${slide} 0) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
        <filter id={`${id}-s`} x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {/* soft shadow on the paper, offset down-right (the pen is lifted a little) */}
      <g transform={`rotate(${-angle}) translate(14 18) rotate(${angle})`} opacity={0.28} filter={`url(#${id}-s)`}>
        <rect x={20} y={-15} width={260} height={30} rx={14} fill="#000000" />
      </g>
      {body}
    </g>
  );
};

/** Where a pen tip should be while HandText (Paper.tsx) writes `w` px of text from x at `progress`. */
export const writingTip = (x: number, y: number, w: number, size: number, progress: number, frame: number): Pt => {
  const edge = x - 10 + (w + 30) * clamp01(progress) - 10;
  const bob = Math.sin(frame * 1.9) * size * 0.13;
  return [Math.min(x + w, edge), y - size * 0.3 + bob];
};

// ------------------------------------------------------------------------------------ marker loop

/** Point on a marker loop (an ellipse drawn clockwise from `start`°, spiralling out slightly). */
export const loopPoint = (cx: number, cy: number, rx: number, ry: number, t: number, start = -160, turns = 1.12, tilt = -4): Pt => {
  const a = ((start + 360 * turns * t) * Math.PI) / 180;
  const k = 0.95 + 0.09 * t;
  const px = Math.cos(a) * rx * k;
  const py = Math.sin(a) * ry * k;
  const tr = (tilt * Math.PI) / 180;
  return [cx + px * Math.cos(tr) - py * Math.sin(tr), cy + px * Math.sin(tr) + py * Math.cos(tr)];
};

/** A felt-marker loop around a word. `progress` 0..1 (linear; the pen speed is eased inside). */
export const MarkerLoop: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly progress: number;
  readonly color?: string;
  readonly width?: number;
  readonly start?: number;
  readonly turns?: number;
  readonly tilt?: number;
  readonly opacity?: number;
}> = ({ cx, cy, rx, ry, progress, color = C.leafDeep, width = 9, start = -160, turns = 1.12, tilt = -4, opacity = 1 }) => {
  if (progress <= 0) return null;
  const t = loopEase(progress);
  const n = Math.max(2, Math.ceil(90 * t));
  const pts = Array.from({ length: n + 1 }, (_, i) => loopPoint(cx, cy, rx, ry, (t * i) / n, start, turns, tilt));
  const d = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("");
  return (
    <HandLayer opacity={opacity} rough={0.7} seed={11}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
    </HandLayer>
  );
};
/** The pen speed used by MarkerLoop (so a marker prop can follow its tip). */
export const loopEase = (p: number) => EASE.inOut(clamp01(p));

// ------------------------------------------------------------------------------------ burst bubble

/**
 * A comic "shout" bubble (spiky burst) for a shocked line. Centre (x, y), half-size rx × ry, the
 * longest spike points at `tail`. Children are drawn centred on (0, 0).
 */
export const BurstBubble: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
  readonly tail: Pt;
  readonly progress: number;
  readonly spikes?: number;
  readonly seed?: number;
  readonly fill?: string;
  readonly children?: React.ReactNode;
}> = ({ x, y, rx, ry, tail, progress, spikes = 15, seed = 3, fill = "#FFFFFF", children }) => {
  const id = useSvgId("burst");
  const f = useCurrentFrame();
  if (progress <= 0) return null;
  const r = rng(seed);
  const ta = Math.atan2((tail[1] - y) / ry, (tail[0] - x) / rx);
  const pts: Pt[] = [];
  const n = spikes * 2;
  // which outer point is closest to the tail direction → becomes the tail
  let tailI = 0;
  let best = 9;
  for (let i = 0; i < n; i += 2) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const d = Math.abs(Math.atan2(Math.sin(a - ta), Math.cos(a - ta)));
    if (d < best) {
      best = d;
      tailI = i;
    }
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const outer = i % 2 === 0;
    const k = outer ? 1.16 + r() * 0.12 : 0.93 + r() * 0.04;
    if (outer && i === tailI) {
      pts.push([tail[0] - x, tail[1] - y]);
      continue;
    }
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  const d = `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" L")} Z`;
  const s = back(progress);
  const wob = Math.sin(clamp01(progress) * Math.PI * 3) * (1 - clamp01(progress)) * 6 + Math.sin(f / 9) * 0.6;
  return (
    <g opacity={Math.min(1, progress * 3)} transform={`translate(${x} ${y}) rotate(${wob}) scale(${s})`}>
      <defs>
        <filter id={`${id}-s`} x="-30%" y="-30%" width="160%" height="170%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      <path d={d} fill="#000000" opacity={0.3} transform="translate(8 14)" filter={`url(#${id}-s)`} />
      <path d={d} fill={fill} stroke={W2.inkText} strokeWidth={5} strokeLinejoin="round" />
      {children}
    </g>
  );
};

// ------------------------------------------------------------------------------------ paper slip

/** A taped paper slip (a label stuck onto the scene, collage style). Children centred on (0, 0). */
export const PaperSlip: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rotate?: number;
  readonly progress: number;
  readonly color?: string;
  readonly tape?: "left" | "right" | "top";
  readonly children?: React.ReactNode;
}> = ({ x, y, w, h, rotate = -3, progress, color = C.paper, tape = "left", children }) => {
  const id = useSvgId("slip");
  if (progress <= 0) return null;
  const p = clamp01(progress);
  const s = 1.18 - 0.18 * EASE.out(p);
  const tx = tape === "left" ? -w / 2 + 18 : tape === "right" ? w / 2 - 18 : 0;
  const ty = tape === "top" ? -h / 2 : -h / 2 + 6;
  const trot = tape === "left" ? -38 : tape === "right" ? 38 : 2;
  return (
    <g opacity={Math.min(1, p * 3)} transform={`translate(${x} ${y}) rotate(${rotate + (1 - p) * 6}) scale(${s})`}>
      <defs>
        <filter id={`${id}-s`} x="-20%" y="-40%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      <rect x={-w / 2 + 6} y={-h / 2 + 12} width={w} height={h} rx={6} fill="#000000" opacity={0.3 * p} filter={`url(#${id}-s)`} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={color} />
      <rect x={-w / 2} y={-h / 2} width={w} height={5} rx={2} fill="#FFFFFF" opacity={0.6} />
      <rect x={tx - 34} y={ty - 13} width={68} height={26} rx={2} fill={W2.tape} opacity={0.8} transform={`rotate(${trot} ${tx} ${ty})`} />
      {children}
    </g>
  );
};

// ------------------------------------------------------------------------------------ topic tag

/** Small chapter tag, top-left: numbered badge + chapter title. */
export const TopicTag: React.FC<{ readonly x?: number; readonly y?: number; readonly n: number; readonly title: string; readonly progress?: number }> = ({
  x = 110,
  y = 104,
  n,
  title,
  progress = 1,
}) => {
  if (progress <= 0) return null;
  const p = EASE.out(clamp01(progress));
  return (
    <g opacity={p} transform={`translate(${x - (1 - p) * 30} ${y})`}>
      <rect x={4} y={6} width={60} height={60} rx={16} fill="#000000" opacity={0.25} />
      <rect width={60} height={60} rx={16} fill={C.paper} />
      <text x={30} y={45} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={42} fill={W2.deskBottom}>
        {n}
      </text>
      <text x={84} y={45} fontFamily={FONT} fontWeight={600} fontSize={42} fill={C.paper}>
        {title}
      </text>
    </g>
  );
};

// ------------------------------------------------------------------------------------ sun

/** A smiling sun (the light source as a character). Rays turn slowly; `shine` 0..1 pulses it brighter. */
export const SunBuddy: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly progress?: number; readonly shine?: number; readonly seed?: number }> = ({
  x,
  y,
  r = 60,
  progress = 1,
  shine = 0,
  seed = 1,
}) => {
  const id = useSvgId("sunb");
  const f = useCurrentFrame();
  if (progress <= 0) return null;
  const s = back(progress) * (1 + 0.05 * shine);
  const spin = f * 0.35;
  const blink = (f + seed * 31) % 118 < 4;
  const eye = (cx: number) =>
    blink ? (
      <path d={`M${cx - 8},${-6} Q${cx},${-2} ${cx + 8},${-6}`} fill="none" stroke={W2.inkText} strokeWidth={4} strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={cx} cy={-8} rx={7} ry={9} fill={W2.inkText} />
        <circle cx={cx - 2.5} cy={-11} r={2.6} fill="#FFFFFF" />
      </g>
    );
  return (
    <g opacity={Math.min(1, progress * 2)} transform={`translate(${x} ${y}) scale(${s * (r / 60)})`}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor={mix(C.sun, "#FFFFFF", 0.45)} />
          <stop offset="0.6" stopColor={C.sun} />
          <stop offset="1" stopColor={C.amber} />
        </radialGradient>
        <filter id={`${id}-b`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={22} />
        </filter>
      </defs>
      <circle r={96} fill={C.sun} opacity={0.32 + 0.3 * shine} filter={`url(#${id}-b)`} />
      <g transform={`rotate(${spin})`}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const l = i % 2 ? 0.86 : 1;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 74}
              y1={Math.sin(a) * 74}
              x2={Math.cos(a) * (74 + 26 * l)}
              y2={Math.sin(a) * (74 + 26 * l)}
              stroke={C.sun}
              strokeWidth={10}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <circle r={60} fill={`url(#${id}-g)`} stroke={C.amberDeep} strokeOpacity={0.55} strokeWidth={3} />
      <ellipse cx={-22} cy={-30} rx={14} ry={8} fill="#FFFFFF" opacity={0.5} transform="rotate(-30 -22 -30)" />
      {eye(-18)}
      {eye(18)}
      <ellipse cx={-33} cy={12} rx={10} ry={6} fill={W2.cheek} opacity={0.7} />
      <ellipse cx={33} cy={12} rx={10} ry={6} fill={W2.cheek} opacity={0.7} />
      <path d="M-15,12 Q0,32 15,12 Z" fill="#4A1D2B" stroke={W2.inkText} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={0} cy={21} rx={6} ry={3.5} fill="#FF8C98" />
    </g>
  );
};

// ------------------------------------------------------------------------------------ impact lines

/** Cartoon "slap" lines bursting out around a point (something landed with a smack). */
export const ImpactLines: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly progress: number;
  readonly r0?: number;
  readonly r1?: number;
  readonly angles?: readonly number[];
  readonly color?: string;
  readonly width?: number;
}> = ({ x, y, progress, r0 = 30, r1 = 90, angles = [-150, -120, -90, -60, -30], color = C.paper, width = 7 }) => {
  if (progress <= 0 || progress >= 1) return null;
  const e = EASE.out(progress);
  const a0 = r0 + (r1 - r0) * Math.max(0, e - 0.35) * 1.5;
  const a1 = r0 + (r1 - r0) * e;
  return (
    <g opacity={1 - progress * progress} stroke={color} strokeWidth={width} strokeLinecap="round">
      {angles.map((deg) => {
        const a = (deg * Math.PI) / 180;
        return <line key={deg} x1={x + Math.cos(a) * a0} y1={y + Math.sin(a) * a0} x2={x + Math.cos(a) * a1} y2={y + Math.sin(a) * a1} />;
      })}
    </g>
  );
};

/** Width of a line of Lexend bold (re-exported for burst/slip sizing). */
export const boldWidth = (text: string, size: number) => textWidth(text, size, 700);
