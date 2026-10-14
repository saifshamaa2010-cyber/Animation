import React from "react";
import { C, EASE } from "../brand/tokens";
import { Pt } from "../lib/geometry";
import { mix } from "./kit/shared";
import { useSvgId } from "./ids";

export type LensProps = {
  /** Centre and radius of the magnified view. */
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  /** The small spot being magnified, and its ring radius. Omit for a free-standing inset. */
  readonly from?: Pt;
  readonly fromR?: number;
  /** 0..1: the two "cone" lines draw from the spot to the lens. */
  readonly cone?: number;
  /** 0..1: the lens opens (grows from 70 % and fades in). */
  readonly open: number;
  /** Background tint inside the lens. */
  readonly tint?: string;
  readonly opacity?: number;
  /** Content drawn in SCREEN coordinates, clipped to the lens. */
  readonly children?: React.ReactNode;
};

/**
 * A magnifying inset: "here's what's inside this bit". Use it to change scale without
 * leaving the bigger picture (leaf → cells, root → ions…).
 */
export const Lens: React.FC<LensProps> = ({ cx, cy, r, from, fromR = 34, cone = 1, open, tint = C.leafDark, opacity = 1, children }) => {
  const id = useSvgId("lens");
  if (open <= 0 && cone <= 0) return null;
  const rr = r * (0.7 + 0.3 * EASE.out(Math.min(1, open)));
  let coneEl: React.ReactNode = null;
  if (from && cone > 0) {
    const dx = cx - from[0];
    const dy = cy - from[1];
    const d = Math.hypot(dx, dy);
    const base = Math.atan2(dy, dx);
    const off = Math.asin(Math.max(-1, Math.min(1, (r - fromR) / d)));
    coneEl = (
      <g opacity={Math.min(1, cone * 2)}>
        <circle cx={from[0]} cy={from[1]} r={fromR} fill="none" stroke={C.paper} strokeOpacity={0.75} strokeWidth={3.5} />
        {[1, -1].map((s) => {
          const a = base + s * (Math.PI / 2 + off);
          const p1: Pt = [from[0] + Math.cos(a) * fromR, from[1] + Math.sin(a) * fromR];
          const p2: Pt = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
          return <line key={s} x1={p1[0]} y1={p1[1]} x2={p1[0] + (p2[0] - p1[0]) * cone} y2={p1[1] + (p2[1] - p1[1]) * cone} stroke={C.paper} strokeOpacity={0.3} strokeWidth={2.5} />;
        })}
      </g>
    );
  }
  return (
    <g opacity={opacity}>
      {coneEl}
      {open > 0 ? (
        <g opacity={Math.min(1, open * 1.5)}>
          <defs>
            <clipPath id={`${id}-c`}>
              <circle cx={cx} cy={cy} r={rr} />
            </clipPath>
            <radialGradient id={`${id}-bg`} cx="0.35" cy="0.2" r="0.95">
              <stop offset="0" stopColor={mix(tint, C.ink700, 0.35)} />
              <stop offset="1" stopColor={C.ink900} />
            </radialGradient>
            <filter id={`${id}-s`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={12} />
            </filter>
          </defs>
          <circle cx={cx} cy={cy + 14} r={rr} fill={C.ink950} opacity={0.5} filter={`url(#${id}-s)`} />
          <g clipPath={`url(#${id}-c)`}>
            <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={`url(#${id}-bg)`} />
            {children}
          </g>
          <circle cx={cx} cy={cy} r={rr} fill="none" stroke={C.paper} strokeOpacity={0.85} strokeWidth={5} />
          <circle cx={cx} cy={cy} r={rr + 9} fill="none" stroke={C.paper} strokeOpacity={0.18} strokeWidth={2} />
        </g>
      ) : null}
    </g>
  );
};
