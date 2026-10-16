import React from "react";
import { C } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { WorldStage } from "../../../components/fun";

/** EP002 v2 · S16 — placeholder until built. */
export const V2S16Bench: React.FC = () => (
  <WorldStage world="bench">
    <text x={960} y={540} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={64} fill={C.paper}>
      v2 S16
    </text>
  </WorldStage>
);
