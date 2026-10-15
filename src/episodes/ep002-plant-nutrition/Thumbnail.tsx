import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { Background } from "../../components/Background";
import { Pot } from "../../components/bio";
import { Scale } from "../../components/lab/Lab";
import { CarbonDioxide, textWidth } from "../../components/kit";
import { Pt } from "../../lib/geometry";
import { WILLOW } from "./scenes/layout";
import { WillowTree, crownTargets, willowGeometry } from "./scenes/parts/S01-Willow";

/**
 * EP002 thumbnail (1280×720, drawn in 1920×1080 units). Readable on a phone: van Helmont's grown willow
 * on its scale (+74 kg), carbon dioxide streaming into its leaves out of the air, and a four-word question.
 */
const FULL = willowGeometry(1);
const TARGETS = crownTargets(FULL, 14, 1, 5);
/** the tree group: world → thumbnail units */
const T = { dx: -70, dy: 36, s: 0.98 };
const toThumb = (p: Pt): Pt => [p[0] * T.s + T.dx, p[1] * T.s + T.dy];

const LINE1 = "BUILT FROM";
const LINE2 = "THIN AIR?";
const RIGHT = 1856;

export const Thumbnail: React.FC = () => {
  // a stream of carbon dioxide from the top right into three leaves on the crown's right side
  const ends = [TARGETS[0], TARGETS[2], TARGETS[4]].map((l) => toThumb([l.x, l.y]));
  const starts: Pt[] = [
    [1260, -70],
    [1560, 20],
    [1900, 150],
  ];
  const streams = ends.map((end, j) => {
    const start = starts[j];
    const ctrl: Pt = [(start[0] + end[0]) / 2 + 30, Math.min(start[1], end[1]) + 10 + j * 26];
    const at = (u: number): Pt => [
      (1 - u) * (1 - u) * start[0] + 2 * (1 - u) * u * ctrl[0] + u * u * end[0],
      (1 - u) * (1 - u) * start[1] + 2 * (1 - u) * u * ctrl[1] + u * u * end[1],
    ];
    return { start, ctrl, end, at };
  });
  const s1 = 132;
  const s2 = Math.min(176, ((RIGHT - 1040) / textWidth(LINE2, 100, 700, -4)) * 100);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", width: 1920, height: 1080, transform: "scale(0.6667)", transformOrigin: "0 0" }}>
        <Background tone="warm" lightX={0.3} lightY={0.3} />
      </div>
      <svg viewBox="0 0 1920 1080" width={1280} height={720} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="th2-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
        </defs>
        <g transform={`translate(${T.dx} ${T.dy}) scale(${T.s})`}>
          <Scale x={WILLOW.potX} y={WILLOW.scaleY} w={WILLOW.scaleW} reading="" />
          <text x={WILLOW.potX} y={WILLOW.scaleY + 104} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={60} fill={C.amberLight} letterSpacing={1}>
            +74 kg
          </text>
          <Pot x={WILLOW.potX} y={WILLOW.potY} w={WILLOW.potW} h={WILLOW.potH} />
          <WillowTree geo={FULL} glow={0.5} glint={(key) => (key === TARGETS[0].key || key === TARGETS[2].key || key === TARGETS[4].key ? 0.9 : 0)} />
        </g>
        {/* carbon dioxide drifting in: each molecule trails a faint streak back along its path */}
        {streams.map((s, j) =>
          [0.3, 0.58, 0.86].map((u0, i) => {
            const u = Math.min(0.9, u0 + j * 0.03);
            const [x, y] = s.at(u);
            const [ax, ay] = s.at(Math.max(0, u - 0.16));
            const [bx, by] = s.at(u - 0.05);
            return (
              <g key={`m${j}${i}`}>
                <line x1={ax} y1={ay} x2={bx} y2={by} stroke={C.ice} strokeOpacity={0.28} strokeWidth={9} strokeLinecap="round" />
                <CarbonDioxide x={x} y={y} scale={0.66} rotate={-24 + 18 * j + 20 * i} still progress={1} />
              </g>
            );
          }),
        )}
        <text x={RIGHT} y={560} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={s1} fill={C.paper} letterSpacing={-4}>
          {LINE1}
        </text>
        <text x={RIGHT} y={560 + s2 * 1.02} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={s2} fill={C.ice} letterSpacing={-4}>
          {LINE2}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
