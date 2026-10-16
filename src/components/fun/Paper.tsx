import React from "react";
import { useCurrentFrame } from "remotion";
import { C, EASE, W2 } from "../../brand/tokens";
import { FONT, HAND } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { textWidth } from "../kit/text";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** Width of Caveat (bold) text: about 0.64 of Lexend's (measured on rendered frames). */
export const handWidth = (text: string, size: number) => textWidth(text, size, 600) * 0.64;
const back = (t: number) => {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(clamp01(t) - 1, 3) + c1 * Math.pow(clamp01(t) - 1, 2);
};

/** A taped sticky note (slightly rotated, soft shadow, curled corner). Children are drawn in its local box (0,0)-(w,h). */
export const StickyNote: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rotate?: number;
  /** 0..1: slaps onto the surface */
  readonly progress: number;
  readonly color?: string;
  readonly children?: React.ReactNode;
}> = ({ x, y, w, h, rotate = -3, progress, color = W2.sticky, children }) => {
  const id = useSvgId("sticky");
  if (progress <= 0) return null;
  const p = clamp01(progress);
  const s = 1.25 - 0.25 * EASE.out(p);
  return (
    <g opacity={Math.min(1, p * 3)} transform={`translate(${x + w / 2} ${y + h / 2}) rotate(${rotate + (1 - p) * 8}) scale(${s}) translate(${-w / 2} ${-h / 2})`}>
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={W2.stickyDeep} />
        </linearGradient>
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="150%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>
      <rect x={10} y={22} width={w - 10} height={h - 4} rx={6} fill="#000" opacity={0.35 * p} filter={`url(#${id}-sh)`} />
      <path d={`M0,0 H${w} V${h - 46} L${w - 46},${h} H0 Z`} fill={`url(#${id}-p)`} />
      <path d={`M${w},${h - 46} L${w - 46},${h} L${w - 40},${h - 40} Z`} fill={W2.stickyDeep} />
      <path d={`M${w - 46},${h} Q${w - 30},${h - 26} ${w},${h - 46} L${w - 40},${h - 40} Z`} fill="#000" opacity={0.12} />
      {/* tape */}
      <rect x={w / 2 - 70} y={-18} width={140} height={38} rx={3} fill={W2.tape} opacity={0.82} transform={`rotate(${2 - rotate} ${w / 2} 0)`} />
      {children}
    </g>
  );
};

/** Rounded speech bubble with a tail pointing at (tx, ty). Pops in. */
export const SpeechBubble: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w?: number;
  readonly h?: number;
  readonly tail: readonly [number, number];
  readonly progress: number;
  readonly children?: React.ReactNode;
  readonly fill?: string;
  /** simple one-line bubble: the bubble sizes itself to this text (x, y = its top-left) */
  readonly text?: string;
  readonly size?: number;
}> = ({ x, y, w: w0, h: h0, tail, progress, children, fill = "#FFFFFF", text, size = 46 }) => {
  const id = useSvgId("bub");
  if (progress <= 0) return null;
  const w = text ? textWidth(text, size, 700) + 84 : (w0 ?? 400);
  const h = text ? size * 2.2 : (h0 ?? 150);
  const s = back(progress);
  const cx = x + w / 2;
  const cy = y + h / 2;
  // tail base on the bubble edge nearest the target
  const bx = Math.max(x + 40, Math.min(x + w - 40, tail[0]));
  const by = tail[1] > y + h ? y + h - 4 : tail[1] < y ? y + 4 : cy;
  const d = `M${bx - 22},${by} L${tail[0]},${tail[1]} L${bx + 22},${by} Z`;
  return (
    <g opacity={Math.min(1, progress * 3)} transform={`translate(${tail[0]} ${tail[1]}) scale(${s}) translate(${-tail[0]} ${-tail[1]})`}>
      <defs>
        <filter id={`${id}-sh`} x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      <rect x={x + 6} y={y + 14} width={w} height={h} rx={34} fill="#000" opacity={0.28} filter={`url(#${id}-sh)`} />
      <path d={d} fill={fill} stroke="#1C1830" strokeWidth={4} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx={34} fill={fill} stroke="#1C1830" strokeWidth={4} />
      <path d={`M${bx - 19},${by - 3} L${bx + 19},${by - 3}`} stroke={fill} strokeWidth={8} />
      <g transform={`translate(${cx} ${cy})`}>
        {text ? (
          <text textAnchor="middle" y={size * 0.36} fontFamily={FONT} fontWeight={700} fontSize={size} fill={W2.inkText}>
            {text}
          </text>
        ) : null}
        {children}
      </g>
    </g>
  );
};

/** Neon tube sign: `on` 0..1 (with a short real-neon flicker while it strikes). */
export const NeonSign: React.FC<{ readonly x: number; readonly y: number; readonly text: string; readonly on: number; readonly size?: number; readonly color?: string; readonly progress?: number }> = ({
  x,
  y,
  text,
  on,
  size = 88,
  color = W2.neon,
  progress = 1,
}) => {
  const id = useSvgId("neon");
  const f = useCurrentFrame();
  if (progress <= 0) return null;
  const flick = on > 0 && on < 1 ? (Math.sin(f * 2.7) > 0.2 ? 1 : 0.35) : 1;
  const lit = clamp01(on) * flick;
  const tw = textWidth(text, size, 700) + 80;
  const col = lit > 0.05 ? color : W2.neonOff;
  return (
    <g opacity={Math.min(1, progress * 2)}>
      <defs>
        <filter id={`${id}-g`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      <rect x={x - tw / 2} y={y - size * 0.95} width={tw} height={size * 1.5} rx={28} fill="#0B0A1C" opacity={0.75} />
      {lit > 0 ? (
        <g opacity={lit} filter={`url(#${id}-g)`}>
          <rect x={x - tw / 2 + 10} y={y - size * 0.95 + 10} width={tw - 20} height={size * 1.5 - 20} rx={22} fill="none" stroke={color} strokeWidth={8} />
          <text x={x} y={y + size * 0.1} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill={color} letterSpacing={6}>
            {text}
          </text>
        </g>
      ) : null}
      <rect x={x - tw / 2 + 10} y={y - size * 0.95 + 10} width={tw - 20} height={size * 1.5 - 20} rx={22} fill="none" stroke={col} strokeWidth={4} opacity={0.4 + 0.6 * lit} />
      <text x={x} y={y + size * 0.1} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill={lit > 0.05 ? "#EFFFF5" : W2.neonOff} letterSpacing={6} opacity={0.5 + 0.5 * lit}>
        {text}
      </text>
    </g>
  );
};

/** Four-point sparkle that twinkles. */
export const Sparkle: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly seed?: number; readonly color?: string; readonly opacity?: number }> = ({
  x,
  y,
  r = 14,
  seed = 1,
  color = C.amberLight,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const tw = 0.55 + 0.45 * Math.sin((f + seed * 41) / 9);
  const s = r * (0.7 + 0.3 * tw);
  return (
    <path
      d={`M${x},${y - s} Q${x + s * 0.18},${y - s * 0.18} ${x + s},${y} Q${x + s * 0.18},${y + s * 0.18} ${x},${y + s} Q${x - s * 0.18},${y + s * 0.18} ${x - s},${y} Q${x - s * 0.18},${y - s * 0.18} ${x},${y - s} Z`}
      fill={color}
      opacity={opacity * (0.5 + 0.5 * tw)}
    />
  );
};

/** Handwritten text (Caveat), optionally struck through in red marker as it is written. */
export const HandText: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly size?: number;
  readonly color?: string;
  /** 0..1 reveal, left to right, like being written */
  readonly progress?: number;
  readonly strike?: number;
  readonly anchor?: "start" | "middle" | "end";
  readonly rotate?: number;
}> = ({ x, y, text, size = 64, color = W2.inkText, progress = 1, strike = 0, anchor = "start", rotate = 0 }) => {
  const id = useSvgId("hand");
  if (progress <= 0) return null;
  const w = handWidth(text, size);
  const x0 = anchor === "start" ? x : anchor === "middle" ? x - w / 2 : x - w;
  return (
    <g transform={`rotate(${rotate} ${x} ${y})`}>
      <defs>
        <clipPath id={`${id}-c`}>
          <rect x={x0 - 10} y={y - size * 1.2} width={(w + 30) * clamp01(progress)} height={size * 1.8} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <text x={x} y={y} textAnchor={anchor} fontFamily={HAND} fontWeight={700} fontSize={size} fill={color}>
          {text}
        </text>
      </g>
      {strike > 0 ? (
        <path
          d={`M${x0 - 8},${y - size * 0.28} q${w * 0.5},${-10} ${(w + 16) * clamp01(strike)},${4}`}
          fill="none"
          stroke={C.coralDeep}
          strokeWidth={size * 0.12}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
};

/** Pause-and-predict countdown ring (fills as the silence runs out). */
export const CountdownRing: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly countdown: number; readonly seconds: number; readonly progress: number; readonly dark?: boolean }> = ({
  x,
  y,
  r = 70,
  countdown,
  seconds,
  progress,
  dark = false,
}) => {
  if (progress <= 0) return null;
  const circ = 2 * Math.PI * r;
  const left = Math.max(1, Math.ceil(seconds * (1 - clamp01(countdown))));
  const fg = dark ? W2.inkText : C.paper;
  return (
    <g opacity={Math.min(1, progress * 2)} transform={`translate(${x} ${y}) scale(${back(progress)})`}>
      <circle r={r} fill={dark ? "#FFFFFF" : "#0B0A1C"} opacity={0.85} />
      <circle r={r} fill="none" stroke={dark ? "#E6DDF2" : C.ink600} strokeWidth={12} />
      <circle r={r} fill="none" stroke={C.amber} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${circ * (1 - clamp01(countdown))} ${circ}`} transform="rotate(-90)" />
      <text y={r * 0.34} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={r * 0.95} fill={fg}>
        {left}
      </text>
    </g>
  );
};

/**
 * Chapter bumper: huge outlined number, the chapter title, a strip of chloroplasts, and a progress bar
 * showing how far through the video we are. Full-frame; `t` = frames since it started, `dur` its length.
 */
export const ChapterCard: React.FC<{
  readonly n: number;
  readonly title: string;
  readonly t: number;
  readonly dur: number;
  readonly total: number;
  readonly bg?: readonly [string, string];
  readonly children?: React.ReactNode;
}> = ({ n, title, t, dur, total, bg = [W2.deskTop, W2.deskBottom], children }) => {
  const id = useSvgId("chap");
  const inP = EASE.out(clamp01(t / 14));
  const outP = clamp01((t - (dur - 10)) / 10);
  const op = Math.min(inP, 1 - outP);
  if (op <= 0) return null;
  const slide = (1 - inP) * 60;
  const titleSize = Math.min(120, (1920 - 656 - 110) / Math.max(1, textWidth(title, 120, 700)) * 120);
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id}-bg)`} />
      <text x={170 - slide} y={820} fontFamily={FONT} fontWeight={700} fontSize={760} fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={6}>
        {n}
      </text>
      <text x={660 + slide} y={430} fontFamily={FONT} fontWeight={700} fontSize={44} fill={C.amberLight} letterSpacing={12}>
        {`CHAPTER ${n}`}
      </text>
      <text x={656 + slide * 1.4} y={560} fontFamily={FONT} fontWeight={700} fontSize={titleSize} fill="#FFFFFF" letterSpacing={-2}>
        {title}
      </text>
      {/* progress through the video */}
      {Array.from({ length: total }, (_, i) => (
        <rect key={i} x={660 + i * 92} y={640} width={80} height={12} rx={6} fill="#FFFFFF" opacity={i < n ? 0.9 : 0.22} />
      ))}
      {children}
    </g>
  );
};
