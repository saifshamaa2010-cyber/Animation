import React from "react";
import { C } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { WorldStage } from "../../../components/fun";

/** EP002 v2 · S06 — placeholder until built. */
export const V2S06Tip: React.FC = () => (
  <WorldStage world="desk">
    <text x={960} y={540} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={64} fill={C.paper}>
      v2 S06
    </text>
  </WorldStage>
);
