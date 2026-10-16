import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, W2 } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { ATOM } from "../kit/Molecules";

export type BuddyMood = "happy" | "excited" | "worried" | "sleepy";

/** A small cartoon face (two eyes + mouth) centred on (0,0), sized for a ball of radius ~26. */
const Face: React.FC<{ mood: BuddyMood; look?: number; seed: number }> = ({ mood, look = 0, seed }) => {
  const f = useCurrentFrame();
  const blink = (f + seed * 23) % 97 < 4;
  const ex = 9;
  const eye = (cx: number) =>
    mood === "sleepy" || blink ? (
      <path d={`M${cx - 4},-4 Q${cx},-1 ${cx + 4},-4`} fill="none" stroke="#1C1830" strokeWidth={2.6} strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={cx} cy={-4} rx={4.6} ry={5.6} fill="#FFFFFF" />
        <circle cx={cx + look * 1.6} cy={-3} r={2.8} fill="#1C1830" />
      </g>
    );
  const mouth =
    mood === "worried" ? (
      <path d="M-5,9 Q0,5 5,9" fill="none" stroke="#1C1830" strokeWidth={2.6} strokeLinecap="round" />
    ) : mood === "excited" ? (
      <path d="M-6,5 Q0,14 6,5 Z" fill="#4A1D2B" />
    ) : (
      <path d="M-5,6 Q0,11 5,6" fill="none" stroke="#1C1830" strokeWidth={2.6} strokeLinecap="round" />
    );
  return (
    <g>
      {eye(-ex)}
      {eye(ex)}
      {mouth}
      <ellipse cx={-14} cy={5} rx={4} ry={2.4} fill={W2.cheek} opacity={0.55} />
      <ellipse cx={14} cy={5} rx={4} ry={2.4} fill={W2.cheek} opacity={0.55} />
    </g>
  );
};

const Ball: React.FC<{ cx: number; cy: number; r: number; top: string; bottom: string; id: string }> = ({ cx, cy, r, top, bottom, id }) => (
  <g>
    <defs>
      <radialGradient id={id} cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor={top} />
        <stop offset="1" stopColor={bottom} />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} stroke="#1C1830" strokeOpacity={0.55} strokeWidth={2.5} />
    <ellipse cx={cx - r * 0.35} cy={cy - r * 0.42} rx={r * 0.32} ry={r * 0.18} fill="#FFFFFF" opacity={0.5} transform={`rotate(-25 ${cx - r * 0.35} ${cy - r * 0.42})`} />
  </g>
);

export type BuddyProps = {
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly rotate?: number;
  readonly mood?: BuddyMood;
  /** pupils -1..1 */
  readonly look?: number;
  /** 0..1 arrival (pops in) */
  readonly progress?: number;
  readonly opacity?: number;
  /** thermal jiggle in px (molecules really do move) */
  readonly jiggle?: number;
  readonly seed?: number;
};

const useJiggle = (seed: number, amp: number) => {
  const f = useCurrentFrame();
  return [noise2D(`bx${seed}`, f / 40, 0) * amp, noise2D(`by${seed}`, f / 40, 0) * amp] as const;
};
const popScale = (p: number) => {
  const t = Math.max(0, Math.min(1, p));
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Carbon dioxide as a character: O=C=O, the face on the carbon. Colours match the channel's atom colours. */
export const CO2Buddy: React.FC<BuddyProps> = ({ x, y, scale = 1, rotate = 0, mood = "happy", look = 0, progress = 1, opacity = 1, jiggle = 3, seed = 1 }) => {
  const id = useSvgId("co2b");
  const [jx, jy] = useJiggle(seed, jiggle);
  if (progress <= 0 || opacity <= 0) return null;
  const s = scale * popScale(progress);
  return (
    <g opacity={Math.min(1, progress * 2) * opacity} transform={`translate(${x + jx} ${y + jy}) rotate(${rotate}) scale(${s})`}>
      <rect x={-48} y={-5} width={96} height={10} rx={5} fill="#1C1830" opacity={0.35} />
      <Ball cx={-44} cy={0} r={22} top={ATOM.O.top} bottom={ATOM.O.bottom} id={`${id}-a`} />
      <Ball cx={44} cy={0} r={22} top={ATOM.O.top} bottom={ATOM.O.bottom} id={`${id}-b`} />
      <Ball cx={0} cy={0} r={29} top={ATOM.C.top} bottom={ATOM.C.bottom} id={`${id}-c`} />
      <g transform={`rotate(${-rotate})`}>
        <Face mood={mood} look={look} seed={seed} />
      </g>
    </g>
  );
};

/** Oxygen (O2) as a character: two coral atoms, the face across both. */
export const O2Buddy: React.FC<BuddyProps> = ({ x, y, scale = 1, rotate = 0, mood = "happy", look = 0, progress = 1, opacity = 1, jiggle = 3, seed = 2 }) => {
  const id = useSvgId("o2b");
  const [jx, jy] = useJiggle(seed, jiggle);
  if (progress <= 0 || opacity <= 0) return null;
  const s = scale * popScale(progress);
  return (
    <g opacity={Math.min(1, progress * 2) * opacity} transform={`translate(${x + jx} ${y + jy}) rotate(${rotate}) scale(${s})`}>
      <Ball cx={-17} cy={0} r={25} top={ATOM.O.top} bottom={ATOM.O.bottom} id={`${id}-a`} />
      <Ball cx={17} cy={0} r={25} top={ATOM.O.top} bottom={ATOM.O.bottom} id={`${id}-b`} />
      <g transform={`rotate(${-rotate})`}>
        <Face mood={mood} look={look} seed={seed} />
      </g>
    </g>
  );
};

/** A "?" with eyes that bobs over something the viewer should predict. */
export const QuestionBuddy: React.FC<{ x: number; y: number; size?: number; progress?: number; color?: string; seed?: number; opacity?: number }> = ({
  x,
  y,
  size = 90,
  progress = 1,
  color = C.amber,
  seed = 1,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  if (progress <= 0 || opacity <= 0) return null;
  const bob = Math.sin((f + seed * 17) / 11) * 5;
  const tilt = Math.sin((f + seed * 29) / 23) * 6;
  const s = (size / 90) * popScale(progress);
  return (
    <g opacity={Math.min(1, progress * 2) * opacity} transform={`translate(${x} ${y + bob}) rotate(${tilt}) scale(${s})`}>
      <path
        d="M-22,-24 C-22,-44 22,-46 22,-22 C22,-6 4,-2 4,14"
        fill="none"
        stroke="#1C1830"
        strokeOpacity={0.6}
        strokeWidth={22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M-22,-24 C-22,-44 22,-46 22,-22 C22,-6 4,-2 4,14" fill="none" stroke={color} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={4} cy={36} r={10} fill={color} stroke="#1C1830" strokeOpacity={0.6} strokeWidth={3.5} />
      {/* eyes on the hook */}
      <g transform="translate(0 -33)">
        <ellipse cx={-8} cy={0} rx={6} ry={7.5} fill="#FFFFFF" stroke="#1C1830" strokeWidth={2} />
        <ellipse cx={8} cy={0} rx={6} ry={7.5} fill="#FFFFFF" stroke="#1C1830" strokeWidth={2} />
        <circle cx={-7} cy={1.5} r={3} fill="#1C1830" />
        <circle cx={9} cy={1.5} r={3} fill="#1C1830" />
      </g>
    </g>
  );
};
