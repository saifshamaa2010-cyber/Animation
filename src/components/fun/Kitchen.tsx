/**
 * Kitchen pieces for the v2 "worlds" look (the owner's "recipe card" idea): a warm tiled kitchen wall
 * with a wooden counter, a lined recipe index card taped to the wall, a chef's hat that sits on Chloro,
 * and a small chloroplast icon (for notes, keys and equation strips).
 * All SVG in the caller's coordinates (1920×1080), driven by props (no CSS animation). Colours are mixes
 * of the brand tokens only. Reusable in any episode.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, EASE, H, W, W2 } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { mix } from "../kit/shared";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (t: number) => {
  const c1 = 1.70158;
  const x = clamp01(t) - 1;
  return 1 + (c1 + 1) * x * x * x + c1 * x * x;
};

/** The kitchen palette (mixes of brand tokens). */
export const KITCHEN = {
  wallTop: mix(C.terracottaDeep, C.barkDeep, 0.45),
  wallBottom: mix(C.barkDeep, W2.inkText, 0.5),
  counterTop: mix(W2.woodDeep, C.barkDeep, 0.25),
  counterEdge: W2.wood,
  counterFront: mix(W2.woodDark, W2.inkText, 0.35),
  counterFrontDeep: mix(W2.woodDark, W2.inkText, 0.6),
} as const;

/**
 * A warm kitchen wall of glazed "metro" tiles, a soft window light from the top right, and a wooden
 * counter whose top edge is at `counterY` (stand things on y = counterY). Full frame.
 */
export const KitchenWall: React.FC<{ readonly counterY?: number; readonly opacity?: number }> = ({ counterY = 940, opacity = 1 }) => {
  const id = useSvgId("kitchen");
  const f = useCurrentFrame();
  if (opacity <= 0) return null;
  const tw = 128;
  const th = 64;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={KITCHEN.wallTop} />
          <stop offset="1" stopColor={KITCHEN.wallBottom} />
        </linearGradient>
        <pattern id={`${id}-tile`} width={tw} height={th * 2} patternUnits="userSpaceOnUse">
          {[
            [3, 3],
            [3 - tw / 2, th + 3],
            [3 + tw / 2, th + 3],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x} y={y} width={tw - 6} height={th - 6} rx={9} fill="#FFFFFF" opacity={0.055} />
              <rect x={x + 8} y={y + 5} width={tw - 22} height={5} rx={2.5} fill="#FFFFFF" opacity={0.07} />
            </g>
          ))}
        </pattern>
        <radialGradient id={`${id}-light`} cx="0.86" cy="0.08" r="0.75">
          <stop offset="0" stopColor={C.amberLight} stopOpacity={0.3} />
          <stop offset="0.45" stopColor={C.amberLight} stopOpacity={0.08} />
          <stop offset="1" stopColor={C.amberLight} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-vig`} cx="50%" cy="42%" r="78%">
          <stop offset="0.6" stopColor="#000000" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.42} />
        </radialGradient>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={KITCHEN.counterFront} />
          <stop offset="1" stopColor={KITCHEN.counterFrontDeep} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-wall)`} />
      <rect width={W} height={counterY} fill={`url(#${id}-tile)`} />
      <rect width={W} height={H} fill={`url(#${id}-light)`} opacity={0.9 + 0.1 * Math.sin(f / 50)} />
      {/* counter: worktop edge, then the cupboard front */}
      <rect x={0} y={counterY - 4} width={W} height={10} fill="#000000" opacity={0.25} />
      <rect x={0} y={counterY} width={W} height={26} fill={KITCHEN.counterTop} />
      <rect x={0} y={counterY} width={W} height={5} fill={KITCHEN.counterEdge} opacity={0.85} />
      <rect x={0} y={counterY + 26} width={W} height={H - counterY - 26} fill={`url(#${id}-front)`} />
      <rect x={0} y={counterY + 26} width={W} height={8} fill="#000000" opacity={0.25} />
      <rect width={W} height={H} fill={`url(#${id}-vig)`} />
    </g>
  );
};

/**
 * A lined recipe index card (cream, red header rule, faint blue rules) taped to a wall at both top
 * corners. (x, y, w, h) = the card in screen coordinates; `rotate` about its centre. `rules` 0..1 fades
 * the ruling (fade it out when the card shrinks into a key strip). Children are drawn in SCREEN
 * coordinates inside the card's rotation.
 */
export const RecipeCard: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rotate?: number;
  /** 0..1: slaps onto the wall */
  readonly progress?: number;
  readonly rules?: number;
  /** y (screen) of the red header rule; blue rules follow every `ruleGap` px */
  readonly headerRuleY?: number;
  readonly ruleGap?: number;
  readonly children?: React.ReactNode;
}> = ({ x, y, w, h, rotate = -0.8, progress = 1, rules = 1, headerRuleY, ruleGap = 62, children }) => {
  const id = useSvgId("rcard");
  if (progress <= 0) return null;
  const p = clamp01(progress);
  const s = 1.06 - 0.06 * EASE.out(p);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const hr = headerRuleY ?? y + 94;
  const blue: number[] = [];
  for (let ry = hr + ruleGap; ry < y + h - 18; ry += ruleGap) blue.push(ry);
  const tapeW = Math.min(150, w * 0.18);
  const tapeH = Math.min(40, h * 0.3);
  return (
    <g opacity={Math.min(1, p * 3)} transform={`translate(${cx} ${cy}) rotate(${rotate + (1 - p) * 4}) scale(${s}) translate(${-cx} ${-cy})`}>
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor={W2.notePaper} />
          <stop offset="1" stopColor={W2.noteShade} />
        </linearGradient>
        <filter id={`${id}-sh`} x="-10%" y="-20%" width="120%" height="150%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      <rect x={x + 8} y={y + 22} width={w} height={h} rx={10} fill="#000000" opacity={0.42} filter={`url(#${id}-sh)`} />
      <rect x={x} y={y} width={w} height={h} rx={10} fill={`url(#${id}-p)`} />
      {rules > 0 ? (
        <g opacity={clamp01(rules)}>
          <line x1={x} x2={x + w} y1={hr} y2={hr} stroke={W2.noteMargin} strokeWidth={3} strokeOpacity={0.85} />
          {blue.map((ry) => (
            <line key={ry} x1={x} x2={x + w} y1={ry} y2={ry} stroke={W2.noteLine} strokeWidth={2} strokeOpacity={0.5} />
          ))}
        </g>
      ) : null}
      {/* tape at the two top corners */}
      {[
        [x + tapeW * 0.28, y + 2, -32],
        [x + w - tapeW * 0.28, y + 2, 32],
      ].map(([tx, ty, r], i) => (
        <rect key={i} x={tx - tapeW / 2} y={ty - tapeH / 2} width={tapeW} height={tapeH} rx={3} fill={W2.tape} opacity={0.85} transform={`rotate(${r} ${tx} ${ty})`} />
      ))}
      {children}
    </g>
  );
};

export type ChefHatProps = {
  /** the SAME x, y, size, enter, bounce, seed, flip and opacity you gave <Chloro> */
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly enter?: number;
  readonly bounce?: number;
  readonly seed?: number;
  readonly flip?: boolean;
  readonly opacity?: number;
};

/**
 * A chef's hat that sits on Chloro's head (draw it right AFTER <Chloro> with the same props). It follows
 * Chloro's breathing, pop-up and bounce, and covers the sprout.
 */
export const ChefHat: React.FC<ChefHatProps> = ({ x, y, size = 220, enter = 1, bounce = 0, seed = 1, flip = false, opacity = 1 }) => {
  const f = useCurrentFrame();
  const id = useSvgId("chef");
  if (enter <= 0 || opacity <= 0) return null;
  // the same body transform as Chloro (see Chloro.tsx)
  const k = size / 240;
  const pop = back(clamp01(enter));
  const breathe = Math.sin((f + seed * 11) / 16);
  const b = Math.sin(clamp01(bounce) * Math.PI);
  const sy = (1 + 0.012 * breathe) * (1 + 0.08 * b) * (0.6 + 0.4 * pop);
  const sx = (1 - 0.008 * breathe) * (1 - 0.06 * b) * (0.7 + 0.3 * pop);
  const line = W2.inkText;
  const puff = "M52,30 C30,26 26,-6 50,-10 C52,-34 84,-44 100,-28 C116,-44 148,-34 150,-10 C174,-6 170,26 148,30 Z";
  return (
    <g opacity={Math.min(1, enter * 3) * opacity} transform={`translate(${x} ${y}) scale(${k * (flip ? -1 : 1)} ${k}) translate(-100 -240)`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor={mix(C.paper, C.paperDim, 0.6)} />
        </linearGradient>
      </defs>
      <g transform={`translate(100 240) scale(${sx} ${sy}) translate(-100 -240) rotate(-7 100 40)`}>
        <path d={puff} fill={`url(#${id}-g)`} stroke={line} strokeOpacity={0.7} strokeWidth={4.5} strokeLinejoin="round" />
        <path d="M74,-2 Q78,14 76,26 M100,-14 Q102,8 100,26 M126,-2 Q122,14 124,26" fill="none" stroke={C.paperDim} strokeWidth={3.5} strokeLinecap="round" />
        <rect x={56} y={22} width={88} height={30} rx={8} fill={`url(#${id}-g)`} stroke={line} strokeOpacity={0.7} strokeWidth={4.5} />
        <ellipse cx={74} cy={-6} rx={9} ry={5} fill="#FFFFFF" opacity={0.9} transform="rotate(-25 74 -6)" />
      </g>
    </g>
  );
};

/**
 * A small cartoon chloroplast (green bean with grana stacks and a gloss) — an icon for "chlorophyll" /
 * "chloroplast" on notes, keys and equation strips. Centre (x, y); `size` = its length in px.
 */
export const ChloroplastIcon: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly rotate?: number;
  readonly progress?: number;
  readonly glow?: number;
  readonly opacity?: number;
}> = ({ x, y, size = 90, rotate = 30, progress = 1, glow = 0, opacity = 1 }) => {
  const id = useSvgId("chlicon");
  if (progress <= 0 || opacity <= 0) return null;
  const s = (size / 100) * back(progress);
  return (
    <g opacity={Math.min(1, progress * 2.5) * opacity} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor={W2.chloroLight} />
          <stop offset="0.6" stopColor={W2.chloroMid} />
          <stop offset="1" stopColor={W2.chloroDeep} />
        </radialGradient>
        <filter id={`${id}-b`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {glow > 0.01 ? <ellipse rx={40} ry={62} fill={C.sun} opacity={0.7 * clamp01(glow)} filter={`url(#${id}-b)`} /> : null}
      <ellipse cx={4} cy={6} rx={30} ry={50} fill="#000000" opacity={0.16} />
      <ellipse rx={30} ry={50} fill={`url(#${id}-g)`} stroke={W2.chloroLine} strokeWidth={5} />
      <ellipse rx={23} ry={42} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={2.5} />
      {[-22, 0, 22].map((gy) => (
        <g key={gy}>
          {[0, 1, 2].map((j) => (
            <rect key={j} x={-12} y={gy - 7 + j * 5} width={24} height={4} rx={2} fill={W2.chloroDeep} opacity={0.75} />
          ))}
        </g>
      ))}
      <ellipse cx={-11} cy={-26} rx={6} ry={12} fill="#FFFFFF" opacity={0.5} />
    </g>
  );
};
