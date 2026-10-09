/**
 * S14 · End (4 s of music). The title stays; three recap chips settle in beneath it — the three
 * things that decide whether an enzyme works — then everything fades to ink.
 */
import React from "react";
import { C, EASE, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { prog } from "../../../lib/motion";
import { useScene } from "../../../lib/timeline";
import { TitleCard } from "./TitleCard";
import { TL } from "../timeline";
import { cueFns } from "../../../lib/cues";
import { s13Timing } from "./S13Resolve.timing";

/** Continue S13's title exactly where it left off (S14 arrives with a hard cut). */
const TITLE_T0 = (() => {
  const s13 = TL.scenes.find((s) => s.id === "S13");
  if (!s13) return 200;
  const k = s13Timing(cueFns(s13, TL.words, TL.fps));
  return s13.endFrame - s13.startFrame - k.title;
})();

const CHIPS = [
  { text: "shape", color: C.tealLight },
  { text: "temperature", color: C.coral },
  { text: "pH", color: C.violetLight },
];

export const S14End: React.FC = () => {
  const { f, dur } = useScene();
  const fade = 1 - prog(f, dur - 26, 26, EASE.in);
  const gap = 60;
  const widths = CHIPS.map((c) => c.text.length * 26 + 70);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (CHIPS.length - 1);
  let x = W / 2 - total / 2;
  return (
    <Stage bg={{ tone: "warm", lightX: 0.42, lightY: 0.5 }}>
      <g opacity={fade}>
        <TitleCard t={TITLE_T0 + f} />
        {CHIPS.map((c, i) => {
          const p = prog(f, 4 + i * 6, 16);
          const x0 = x;
          x += widths[i] + gap;
          return (
            <g key={c.text} opacity={p} transform={`translate(0 ${(1 - p) * 16})`}>
              <rect x={x0} y={890} width={widths[i]} height={64} rx={32} fill={C.ink800} stroke={c.color} strokeWidth={3} />
              <text x={x0 + widths[i] / 2} y={934} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={c.color}>
                {c.text}
              </text>
            </g>
          );
        })}
      </g>
    </Stage>
  );
};
