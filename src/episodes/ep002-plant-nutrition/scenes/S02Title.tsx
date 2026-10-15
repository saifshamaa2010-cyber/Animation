/**
 * S02 · Title (a 3-second silence in the narration). One photon lands on a leaf and a glucose ring
 * comes out of it — the episode in one gesture — as "Plant Nutrition" rises into place.
 * Everything clears before S03 focuses in.
 */
import React from "react";
import { C, EASE, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { prog } from "../../../lib/motion";
import { useScene } from "../../../lib/timeline";
import { s02Timing } from "./S02Title.timing";
import { TitleMotif, TitleWords } from "./parts/S02-TitleCard";

export const S02Title: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s02Timing(sc);
  const out = 1 - prog(f, k.out, 10, EASE.in);
  const sub = prog(f, k.subtitle, 16);
  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.36 }}>
      <g opacity={out}>
        <TitleMotif t={f} cx={930} cy={372} land={k.land} />
        <TitleWords t={f} y={676} delay={k.words} />
        <text x={W / 2} y={776 + (1 - sub) * 10} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.ink300} opacity={sub} letterSpacing={0.5}>
          Photosynthesis · IGCSE Biology
        </text>
      </g>
    </Stage>
  );
};
