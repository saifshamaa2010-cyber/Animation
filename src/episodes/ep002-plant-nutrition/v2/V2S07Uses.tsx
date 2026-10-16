import React from "react";
import { W2 } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { WorldStage } from "../../../components/fun";

/** EP002 v2 · S07 — placeholder until built. */
export const V2S07Uses: React.FC = () => (
  <WorldStage world="meadow">
    <text x={960} y={540} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={64} fill={W2.inkText} opacity={0.6}>
      v2 S07
    </text>
  </WorldStage>
);
