import React from "react";
import { C } from "../brand/tokens";

/**
 * Simple line icons, all drawn on a 100×100 grid centred on (0,0) and scaled
 * with `size`. Stroke-based, rounded caps: the channel's "diagram" look.
 */
type IconProps = {
  readonly x: number;
  readonly y: number;
  readonly size?: number;
  readonly color?: string;
  readonly opacity?: number;
  readonly stroke?: number;
};

const Wrap: React.FC<IconProps & { readonly children: React.ReactNode }> = ({
  x,
  y,
  size = 100,
  color = C.paper,
  opacity = 1,
  stroke = 6,
  children,
}) => (
  <g
    transform={`translate(${x} ${y}) scale(${size / 100})`}
    opacity={opacity}
    fill="none"
    stroke={color}
    strokeWidth={(stroke * 100) / size}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </g>
);

/** Hourglass. `sand` 0..1 = how much has fallen. */
export const Hourglass: React.FC<IconProps & { readonly sand?: number }> = ({ sand = 0.3, ...p }) => (
  <Wrap {...p}>
    <line x1={-32} y1={-46} x2={32} y2={-46} />
    <line x1={-32} y1={46} x2={32} y2={46} />
    <path d="M-25,-46 C-25,-12 -4,-8 -4,0 C-4,8 -25,12 -25,46 M25,-46 C25,-12 4,-8 4,0 C4,8 25,12 25,46" />
    <path d={`M${-18 + sand * 10},${-36 + sand * 26} L${18 - sand * 10},${-36 + sand * 26} L0,-4 Z`} fill={p.color ?? C.paper} stroke="none" opacity={0.85} />
    <path d={`M-20,40 L20,40 L${14 - sand * 6},${40 - sand * 26} L${-14 + sand * 6},${40 - sand * 26} Z`} fill={p.color ?? C.paper} stroke="none" opacity={0.85} />
  </Wrap>
);

/** Stopwatch. `t` 0..1 = hand position. */
export const Stopwatch: React.FC<IconProps & { readonly t?: number }> = ({ t = 0.15, ...p }) => {
  const a = t * Math.PI * 2 - Math.PI / 2;
  return (
    <Wrap {...p}>
      <circle cx={0} cy={6} r={40} />
      <line x1={0} y1={-34} x2={0} y2={-46} />
      <line x1={-12} y1={-48} x2={12} y2={-48} />
      <line x1={0} y1={6} x2={Math.cos(a) * 28} y2={6 + Math.sin(a) * 28} />
      <circle cx={0} cy={6} r={3} fill={p.color ?? C.paper} />
    </Wrap>
  );
};

export const PaperSheet: React.FC<IconProps> = (p) => (
  <Wrap {...p}>
    <path d="M-30,-44 L16,-44 L32,-28 L32,44 L-30,44 Z" />
    <path d="M16,-44 L16,-28 L32,-28" />
    <line x1={-18} y1={-14} x2={20} y2={-14} />
    <line x1={-18} y1={4} x2={20} y2={4} />
    <line x1={-18} y1={22} x2={8} y2={22} />
  </Wrap>
);

export const Lock: React.FC<IconProps> = (p) => (
  <Wrap {...p}>
    <rect x={-34} y={-6} width={68} height={52} rx={10} />
    <path d="M-20,-6 L-20,-24 C-20,-50 20,-50 20,-24 L20,-6" />
    <circle cx={0} cy={16} r={6} />
    <line x1={0} y1={22} x2={0} y2={32} />
  </Wrap>
);

export const Key: React.FC<IconProps> = (p) => (
  <Wrap {...p}>
    <circle cx={-26} cy={0} r={18} />
    <path d="M-8,0 L44,0 L44,14 M32,0 L32,10 M20,0 L20,14" />
  </Wrap>
);

/** Frying pan seen from above with an egg. `cooked` 0..1 turns the white opaque. */
export const PanEgg: React.FC<IconProps & { readonly cooked?: number }> = ({ cooked = 0, ...p }) => (
  <g transform={`translate(${p.x} ${p.y}) scale(${(p.size ?? 100) / 100})`} opacity={p.opacity ?? 1}>
    <rect x={44} y={-7} width={58} height={14} rx={7} fill={C.ink500} />
    <circle cx={0} cy={0} r={50} fill={C.ink700} stroke={C.ink500} strokeWidth={5} />
    <path
      d="M-30,-6 C-34,-28 -6,-36 8,-28 C26,-34 38,-12 30,4 C38,22 14,36 -2,30 C-22,38 -40,20 -30,-6 Z"
      fill={C.paper}
      fillOpacity={0.12 + cooked * 0.88}
      stroke={C.paper}
      strokeOpacity={0.5 - cooked * 0.3}
      strokeWidth={2}
    />
    <circle cx={2} cy={-2} r={13} fill={C.amber} />
    <circle cx={-2} cy={-6} r={4} fill={C.amberLight} />
  </g>
);

export const Stomach: React.FC<IconProps> = (p) => (
  <Wrap {...p}>
    <path d="M-18,-46 C-18,-30 -14,-22 -6,-16 C-30,-10 -40,14 -30,32 C-18,52 18,50 34,30 C48,12 42,-20 20,-24 C8,-26 2,-30 2,-46" />
  </Wrap>
);

export const Snowflake: React.FC<IconProps> = (p) => (
  <Wrap {...p}>
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <line x1={0} y1={-44} x2={0} y2={44} />
        <path d="M-10,-34 L0,-24 L10,-34 M-10,34 L0,24 L10,34" />
      </g>
    ))}
  </Wrap>
);

export const Tick: React.FC<IconProps> = (p) => (
  <Wrap {...p}>
    <path d="M-30,2 L-8,24 L32,-22" />
  </Wrap>
);

export const Cross: React.FC<IconProps> = (p) => (
  <Wrap {...p}>
    <path d="M-26,-26 L26,26 M26,-26 L-26,26" />
  </Wrap>
);

/** Sugar cube (isometric), for "no added sugar". */
export const SugarCube: React.FC<IconProps> = (p) => (
  <Wrap {...p}>
    <path d="M0,-40 L36,-20 L36,22 L0,42 L-36,22 L-36,-20 Z M0,-40 L0,0 M0,0 L36,-20 M0,0 L-36,-20 M0,0 L0,42" />
  </Wrap>
);
