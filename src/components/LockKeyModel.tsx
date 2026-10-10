import React from "react";
import { C } from "../brand/tokens";
import { roundedPolygon } from "../lib/geometry";
import { DOCK, ENZYME_REST, POCKET_INDICES } from "./molecule-geometry";
import { SugarChain } from "./SugarChain";

/** The active site's inner walls, closed with a straight entry channel: the lock's keyhole. */
const KEYHOLE_PTS = [
  [-190, 30] as const,
  ...POCKET_INDICES.slice(1, -1).map((i) => ENZYME_REST[i]),
  [-190, -30] as const,
];
/** The pocket outline as a closed path (enzyme space, unit scale). Shared with the enzyme's dashed site outline. */
export const POCKET_SHAPE = roundedPolygon(KEYHOLE_PTS, KEYHOLE_PTS.map((_, i) => (i === 0 || i === KEYHOLE_PTS.length - 1 ? 2 : 6)));

/**
 * The lock-and-key model, drawn from the SAME pocket outline as the enzyme (the keyhole) and the
 * SAME two glucose rings as the substrate (the key's bit). One design for every scene that uses the
 * analogy, so viewers recognise it as the same model. Neutral ink lock — never amylase teal.
 *
 * (x, y) is the lock body's centre; `keyIn` is how far the key still has to slide (0 = fully home).
 */
export const LockKeyModel: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly keyIn?: number;
  readonly opacity?: number;
  readonly showKey?: boolean;
}> = ({ x, y, scale = 1, keyIn = 0, opacity = 1, showKey = true }) => (
  <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M -60,-150 V -230 A 110 110 0 0 1 160,-230 V -150" fill="none" stroke={C.ink400} strokeWidth={26} strokeLinecap="round" />
    <rect x={-230} y={-160} width={460} height={330} rx={46} fill={C.ink700} />
    <rect x={-230} y={-160} width={460} height={330} rx={46} fill="none" stroke={C.ink400} strokeWidth={5} />
    <rect x={-224} y={-154} width={448} height={60} rx={30} fill={C.paper} opacity={0.05} />
    <g transform="translate(150 0)">
      <path d={POCKET_SHAPE} fill={C.ink950} />
      <path d={POCKET_SHAPE} fill="none" stroke={C.paper} strokeWidth={3} strokeDasharray="9 8" opacity={0.7} />
      {showKey ? (
        <g transform={`translate(${keyIn} 0)`}>
          <line x1={DOCK.cut[0] - 210} y1={0} x2={DOCK.cut[0] + 6} y2={0} stroke={C.creamDeep} strokeWidth={16} strokeLinecap="round" />
          <circle cx={DOCK.cut[0] - 262} cy={0} r={52} fill="none" stroke={C.creamDeep} strokeWidth={20} />
          <circle cx={DOCK.cut[0] - 262} cy={0} r={52} fill="none" stroke={C.cream} strokeWidth={6} opacity={0.6} />
          <SugarChain
            rings={[
              { x: DOCK.outer[0], y: 0 },
              { x: DOCK.inner[0], y: 0 },
            ]}
            links={[{ a: 0, b: 1 }]}
          />
        </g>
      ) : null}
    </g>
  </g>
);
