import React from "react";
import { useCurrentFrame } from "remotion";
import { W2 } from "../../brand/tokens";
import { useSvgId } from "../ids";

export type ChloroMood = "happy" | "explain" | "thinking" | "shocked" | "celebrate" | "worried";
export type ChloroPose = "rest" | "point" | "wave" | "cheer" | "chin" | "hold" | "present";

export type ChloroProps = {
  /** bottom-centre (between the feet) */
  readonly x: number;
  readonly y: number;
  /** total height in px (feet to top of the sprout) */
  readonly size?: number;
  readonly mood?: ChloroMood;
  readonly pose?: ChloroPose;
  /** for pose="point": direction of the pointing arm in degrees (0 = right, -90 = up, 180 = left) */
  readonly pointAngle?: number;
  /** pupils: -1..1 each way */
  readonly look?: readonly [number, number];
  /** 0..1 how open the mouth is right now (drive it from the narration to make Chloro talk) */
  readonly talk?: number;
  /** 0..1 arrival: pops up from the ground with a little squash */
  readonly enter?: number;
  /** 0..1 a one-off squash-and-stretch bounce (e.g. on a mood change) */
  readonly bounce?: number;
  readonly cap?: boolean;
  readonly glasses?: boolean;
  readonly flip?: boolean;
  readonly opacity?: number;
  /** varies blink timing between several Chloros on screen */
  readonly seed?: number;
};

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** How shut the eyes are (0 open … 1 shut) at frame f: a quick blink every ~3–4 s. */
const blinkAt = (f: number, seed: number) => {
  const period = 104 + (seed % 5) * 9;
  const t = (f + seed * 37) % period;
  if (t < 3) return t / 3;
  if (t < 6) return 1 - (t - 3) / 3;
  return 0;
};

// Local drawing box: 200 wide, 240 tall, feet on y = 240.
const BODY =
  "M100,34 C150,34 178,76 178,128 C178,182 146,212 100,212 C54,212 22,182 22,128 C22,76 50,34 100,34 Z";
const SHOULDER_L: readonly [number, number] = [30, 142];
const SHOULDER_R: readonly [number, number] = [170, 142];

type Arm = { hand: readonly [number, number]; bend: number };
const armsFor = (pose: ChloroPose, angle: number, f: number): [Arm, Arm] => {
  const at = (s: readonly [number, number], deg: number, len = 50): readonly [number, number] => [
    s[0] + Math.cos((deg * Math.PI) / 180) * len,
    s[1] + Math.sin((deg * Math.PI) / 180) * len,
  ];
  switch (pose) {
    case "point":
      return [{ hand: at(SHOULDER_L, 118), bend: -10 }, { hand: at(SHOULDER_R, angle, 58), bend: 8 }];
    case "wave": {
      const w = Math.sin(f / 4) * 16;
      return [{ hand: at(SHOULDER_L, 118), bend: -10 }, { hand: at(SHOULDER_R, -70 + w, 54), bend: 12 }];
    }
    case "cheer": {
      const w = Math.sin(f / 5) * 6;
      return [{ hand: at(SHOULDER_L, -122 - w, 56), bend: -12 }, { hand: at(SHOULDER_R, -58 + w, 56), bend: 12 }];
    }
    case "chin":
      return [{ hand: at(SHOULDER_L, 118), bend: -10 }, { hand: [120, 168], bend: 26 }];
    case "hold":
      return [{ hand: [52, 196], bend: -16 }, { hand: [148, 196], bend: 16 }];
    case "present":
      return [{ hand: at(SHOULDER_L, 118), bend: -10 }, { hand: at(SHOULDER_R, -20, 58), bend: 14 }];
    default:
      return [{ hand: at(SHOULDER_L, 116), bend: -10 }, { hand: at(SHOULDER_R, 64), bend: 10 }];
  }
};

const Mouth: React.FC<{ mood: ChloroMood; talk: number }> = ({ mood, talk }) => {
  const dark = "#4A1D2B";
  const tongue = "#FF8C98";
  if (mood === "shocked") {
    const ry = 11 + talk * 3;
    return (
      <g>
        <ellipse cx={100} cy={152} rx={9} ry={ry} fill={dark} />
        <ellipse cx={100} cy={152 + ry * 0.45} rx={6} ry={ry * 0.35} fill={tongue} />
      </g>
    );
  }
  if (mood === "thinking") return <path d="M88,152 q6,-5 12,0 t12,0" fill="none" stroke={W2.chloroLine} strokeWidth={4} strokeLinecap="round" />;
  if (mood === "worried") return <path d="M86,156 Q100,146 114,156" fill="none" stroke={W2.chloroLine} strokeWidth={4} strokeLinecap="round" />;
  const open = mood === "celebrate" ? 1 : mood === "explain" ? 0.45 + 0.55 * talk : 0.12 + 0.88 * talk;
  if (open < 0.18 && mood === "happy") return <path d="M85,145 Q100,160 115,145" fill="none" stroke={W2.chloroLine} strokeWidth={4.5} strokeLinecap="round" />;
  const w = mood === "celebrate" ? 22 : 17;
  const depth = 8 + 16 * open;
  const d = `M${100 - w},143 Q100,${143 + depth * 2} ${100 + w},143 Z`;
  return (
    <g>
      <path d={d} fill={dark} stroke={W2.chloroLine} strokeWidth={3} strokeLinejoin="round" />
      {open > 0.35 ? <ellipse cx={100} cy={143 + depth * 0.95} rx={w * 0.45} ry={depth * 0.32} fill={tongue} /> : null}
      {mood === "celebrate" ? <path d={`M${100 - w + 5},145 L${100 + w - 5},145`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" /> : null}
    </g>
  );
};

const Brows: React.FC<{ mood: ChloroMood }> = ({ mood }) => {
  const s = { fill: "none", stroke: W2.chloroLine, strokeWidth: 4.5, strokeLinecap: "round" as const };
  switch (mood) {
    case "shocked":
      return (
        <g {...s}>
          <path d="M62,78 Q76,66 90,76" />
          <path d="M110,76 Q124,66 138,78" />
        </g>
      );
    case "thinking":
      return (
        <g {...s}>
          <path d="M62,84 Q76,80 90,84" />
          <path d="M110,78 Q124,68 138,76" />
        </g>
      );
    case "worried":
      return (
        <g {...s}>
          <path d="M62,80 Q76,82 90,74" />
          <path d="M110,74 Q124,82 138,80" />
        </g>
      );
    case "celebrate":
      return null;
    default:
      return (
        <g {...s}>
          <path d="M64,82 Q76,75 88,80" />
          <path d="M112,80 Q124,75 136,82" />
        </g>
      );
  }
};

const Eye: React.FC<{ cx: number; cy: number; shut: number; look: readonly [number, number]; mood: ChloroMood }> = ({ cx, cy, shut, look, mood }) => {
  if (mood === "celebrate") {
    // happy closed eyes ^ ^
    return <path d={`M${cx - 13},${cy + 4} Q${cx},${cy - 12} ${cx + 13},${cy + 4}`} fill="none" stroke={W2.chloroLine} strokeWidth={5} strokeLinecap="round" />;
  }
  const big = mood === "shocked" ? 1.12 : 1;
  const rx = 16 * big;
  const ry = 19 * big * (1 - 0.92 * shut);
  const px = cx + look[0] * 5;
  const py = cy + look[1] * 5 + 2;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" stroke={W2.chloroLine} strokeWidth={3} />
      {shut < 0.6 ? (
        <g>
          <circle cx={px} cy={py} r={mood === "shocked" ? 7 : 9.5} fill="#1C1830" />
          <circle cx={px - 3.5} cy={py - 4.5} r={3.6} fill="#FFFFFF" />
          <circle cx={px + 3.5} cy={py + 3} r={1.7} fill="#FFFFFF" />
        </g>
      ) : null}
    </g>
  );
};

/**
 * Chloro — the channel's host: a chloroplast with a face (the grana stacks show through its body, the
 * double membrane is the inner rim line). Code-drawn, one component: change `mood`, `pose`, `talk`.
 * Idle life (breathing, blinking) runs on its own from the frame number.
 */
export const Chloro: React.FC<ChloroProps> = ({
  x,
  y,
  size = 220,
  mood = "happy",
  pose = "rest",
  pointAngle = -20,
  look = [0, 0],
  talk = 0,
  enter = 1,
  bounce = 0,
  cap = false,
  glasses = false,
  flip = false,
  opacity = 1,
  seed = 1,
}) => {
  const f = useCurrentFrame();
  const id = useSvgId("chloro");
  if (enter <= 0 || opacity <= 0) return null;
  const k = size / 240;
  const pop = easeOutBack(clamp01(enter));
  const breathe = Math.sin((f + seed * 11) / 16);
  const b = Math.sin(clamp01(bounce) * Math.PI);
  const sy = (1 + 0.012 * breathe) * (1 + 0.08 * b) * (0.6 + 0.4 * pop);
  const sx = (1 - 0.008 * breathe) * (1 - 0.06 * b) * (0.7 + 0.3 * pop);
  const shut = blinkAt(f, seed);
  const [armL, armR] = armsFor(pose, pointAngle, f);
  const arm = (s: readonly [number, number], a: Arm, key: string) => {
    const mx = (s[0] + a.hand[0]) / 2 + a.bend;
    const my = (s[1] + a.hand[1]) / 2 - Math.abs(a.bend) * 0.4;
    return (
      <g key={key}>
        <path d={`M${s[0]},${s[1]} Q${mx},${my} ${a.hand[0]},${a.hand[1]}`} fill="none" stroke={W2.chloroLine} strokeWidth={13} strokeLinecap="round" />
        <path d={`M${s[0]},${s[1]} Q${mx},${my} ${a.hand[0]},${a.hand[1]}`} fill="none" stroke={W2.chloroMid} strokeWidth={7} strokeLinecap="round" />
        <circle cx={a.hand[0]} cy={a.hand[1]} r={10.5} fill={W2.chloroMid} stroke={W2.chloroLine} strokeWidth={3.5} />
      </g>
    );
  };
  return (
    <g opacity={Math.min(1, enter * 3) * opacity} transform={`translate(${x} ${y}) scale(${k * (flip ? -1 : 1)} ${k}) translate(-100 -240)`}>
      <defs>
        <radialGradient id={`${id}-body`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor={W2.chloroLight} />
          <stop offset="0.55" stopColor={W2.chloroMid} />
          <stop offset="1" stopColor={W2.chloroDeep} />
        </radialGradient>
        <filter id={`${id}-sh`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {/* contact shadow (stays on the ground while the body squashes) */}
      <ellipse cx={100} cy={240} rx={62 * (0.8 + 0.2 * pop)} ry={10} fill="#000000" opacity={0.28} filter={`url(#${id}-sh)`} />
      <g transform={`translate(100 240) scale(${sx} ${sy}) translate(-100 -240)`}>
        {/* legs */}
        {[78, 122].map((lx) => (
          <g key={lx}>
            <rect x={lx - 9} y={200} width={18} height={30} rx={9} fill={W2.chloroDeep} stroke={W2.chloroLine} strokeWidth={3.5} />
            <ellipse cx={lx + (lx < 100 ? -4 : 4)} cy={232} rx={17} ry={9} fill={W2.chloroMid} stroke={W2.chloroLine} strokeWidth={3.5} />
          </g>
        ))}
        {/* arms behind the body when resting */}
        {pose === "rest" ? [arm(SHOULDER_L, armL, "l"), arm(SHOULDER_R, armR, "r")] : null}
        {/* sprout */}
        {!cap ? (
          <g>
            <path d="M100,36 C100,24 103,16 108,8" fill="none" stroke={W2.chloroLine} strokeWidth={5} strokeLinecap="round" />
            <path d="M106,12 C116,0 132,2 136,8 C126,16 114,18 106,12 Z" fill={W2.chloroLight} stroke={W2.chloroLine} strokeWidth={3} strokeLinejoin="round" />
            <path d="M104,16 C94,6 82,8 78,14 C86,22 98,22 104,16 Z" fill={W2.chloroMid} stroke={W2.chloroLine} strokeWidth={3} strokeLinejoin="round" />
          </g>
        ) : null}
        {/* body + double-membrane rim */}
        <path d={BODY} fill={`url(#${id}-body)`} stroke={W2.chloroLine} strokeWidth={5} />
        <path d={BODY} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={3} transform="translate(100 124) scale(0.9) translate(-100 -124)" />
        {/* grana stacks */}
        {[
          [56, 176],
          [144, 176],
          [100, 196],
        ].map(([gx, gy], i) => (
          <g key={i} opacity={0.42}>
            {[0, 1, 2].map((j) => (
              <ellipse key={j} cx={gx} cy={gy - j * 6} rx={13} ry={4} fill={W2.chloroDeep} stroke={W2.chloroLine} strokeWidth={1.5} />
            ))}
          </g>
        ))}
        {/* gloss */}
        <ellipse cx={66} cy={70} rx={20} ry={11} fill="#FFFFFF" opacity={0.45} transform="rotate(-28 66 70)" />
        {/* face */}
        <ellipse cx={58} cy={140} rx={12} ry={7} fill={W2.cheek} opacity={0.8} />
        <ellipse cx={142} cy={140} rx={12} ry={7} fill={W2.cheek} opacity={0.8} />
        <Eye cx={76} cy={110} shut={shut} look={look} mood={mood} />
        <Eye cx={124} cy={110} shut={shut} look={look} mood={mood} />
        <Brows mood={mood} />
        <Mouth mood={mood} talk={talk} />
        {glasses ? (
          <g fill="none" stroke="#1C1830" strokeWidth={4}>
            <circle cx={76} cy={110} r={23} />
            <circle cx={124} cy={110} r={23} />
            <path d="M99,108 L101,108" />
          </g>
        ) : null}
        {/* arms in front for gestures */}
        {pose !== "rest" ? [arm(SHOULDER_L, armL, "l"), arm(SHOULDER_R, armR, "r")] : null}
        {cap ? (
          <g transform="rotate(-8 100 40)">
            <path d="M66,46 Q100,30 134,46 L132,58 Q100,46 68,58 Z" fill="#232046" stroke="#0F0D24" strokeWidth={3} />
            <path d="M44,34 L100,14 L156,34 L100,54 Z" fill="#2E2A5C" stroke="#0F0D24" strokeWidth={3.5} strokeLinejoin="round" />
            <path d="M100,34 Q128,40 140,58" fill="none" stroke="#F5C04A" strokeWidth={3.5} />
            <path d="M136,58 L144,58 L142,74 L138,74 Z" fill="#F5C04A" />
            <circle cx={100} cy={34} r={4} fill="#F5C04A" />
          </g>
        ) : null}
      </g>
    </g>
  );
};
