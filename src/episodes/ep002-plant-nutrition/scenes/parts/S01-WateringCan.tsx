/**
 * S01: "for five years, he gave it nothing but water" — a watering can tipping drops into the pot.
 * World coordinates (inside the camera). Drops are ice blue (water in this episode's colour code).
 */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { LitShape, mix } from "../../../../components/kit";
import { Pt } from "../../../../lib/geometry";
import { prog } from "../../../../lib/motion";

const BODY = "M-46,-30 Q-46,-38 -38,-38 L36,-38 Q44,-38 45,-30 L48,32 Q48,42 38,42 L-38,42 Q-48,42 -48,32 Z";
/** spout from the lower front of the body, rising to the rose */
const SPOUT = "M34.9,17.8 L119.1,-47.5 L124.9,-40.5 L45.1,30.2 Z";
const SPOUT_ANG = (Math.atan2(-68, 82) * 180) / Math.PI;
const TIP: Pt = [122, -44];
/** centre of the rose's face, where the water comes out */
const ROSE_AT: Pt = [TIP[0] + 0.77 * 15, TIP[1] - 0.64 * 15];

/** Where the spout's rose is, in world space, for a can at (x, y) tilted by `tilt` degrees. */
export const roseOf = (x: number, y: number, tilt: number, scale = 1): Pt => {
  const a = (tilt * Math.PI) / 180;
  const [rx, ry] = [ROSE_AT[0] * scale, ROSE_AT[1] * scale];
  return [x + rx * Math.cos(a) - ry * Math.sin(a), y + rx * Math.sin(a) + ry * Math.cos(a)];
};

/** A watering can, side view (handle at the back, spout and rose at the front). */
export const WateringCan: React.FC<{ readonly x: number; readonly y: number; readonly tilt: number; readonly opacity?: number; readonly scale?: number }> = ({ x, y, tilt, opacity = 1, scale = 1 }) => {
  if (opacity <= 0) return null;
  const handle = "M-40,-28 C-98,-40 -100,34 -46,26";
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`} opacity={opacity}>
      <path d={handle} fill="none" stroke={C.ink500} strokeWidth={12} strokeLinecap="round" />
      <path d={handle} fill="none" stroke={C.ink300} strokeOpacity={0.55} strokeWidth={3.5} strokeLinecap="round" transform="translate(-1 -3)" />
      <LitShape d={SPOUT} top={C.ink300} bottom={C.ink500} rimOpacity={0.5} shadow={0} />
      <g transform={`translate(${TIP[0]} ${TIP[1]}) rotate(${SPOUT_ANG})`}>
        <path d="M-2,-8 L13,-16 Q17,-16 17,-12 L17,12 Q17,16 13,16 L-2,8 Z" fill={mix(C.ink300, C.paper, 0.2)} />
        <rect x={14} y={-15} width={4} height={30} rx={2} fill={C.ink500} />
      </g>
      <LitShape d={BODY} top={mix(C.ink300, C.paper, 0.12)} bottom={C.ink500} rimOpacity={0.6} shadow={0.45} shadowDy={10} shadowBlur={10} />
      <rect x={-46} y={-38} width={92} height={10} rx={5} fill={C.ink400} />
      <rect x={-36} y={2} width={72} height={8} rx={4} fill={C.ink600} opacity={0.45} />
    </g>
  );
};

/**
 * Drops from the rose to the soil: one every `every` frames between `start` and `stop`.
 * Each falls under gravity (ease-in), then splashes and soaks in.
 */
export const Drops: React.FC<{ readonly f: number; readonly start: number; readonly stop: number; readonly every: number; readonly from: (i: number) => Pt; readonly soilY: number }> = ({ f, start, stop, every, from, soilY }) => {
  const n = Math.max(0, Math.floor((stop - start) / every));
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = start + i * every;
    if (f < t0 || f > t0 + 34) continue;
    const [sx, sy] = from(i);
    const fall = 16;
    const p = prog(f, t0, fall, EASE.in);
    const x = sx + 6 * p + (i % 3) * 2;
    const y = sy + (soilY - sy) * p;
    if (f < t0 + fall) {
      const stretch = 1 + p * 0.5;
      out.push(
        <g key={i} transform={`translate(${x} ${y}) scale(${1 / Math.sqrt(stretch)} ${stretch})`}>
          <path d="M0,-11 C5,-3 7,2 7,5 C7,9 4,11 0,11 C-4,11 -7,9 -7,5 C-7,2 -5,-3 0,-11Z" fill={C.ice} />
          <circle cx={-2.5} cy={4} r={2} fill={C.paper} opacity={0.7} />
        </g>,
      );
    } else {
      const s = prog(f, t0 + fall, 16);
      out.push(<ellipse key={i} cx={x} cy={soilY + 2} rx={6 + 16 * s} ry={2 + 4 * s} fill="none" stroke={C.ice} strokeWidth={2.5} opacity={0.8 * (1 - s)} />);
    }
  }
  return <g>{out}</g>;
};
