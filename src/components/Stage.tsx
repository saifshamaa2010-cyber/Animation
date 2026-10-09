import React from "react";
import { AbsoluteFill } from "remotion";
import { H, W } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { Background, BackgroundProps } from "./Background";

/** Background + one full-frame SVG in 1920×1080 coordinates. Every scene is built on this. */
export const Stage: React.FC<{ readonly bg?: BackgroundProps; readonly children: React.ReactNode }> = ({ bg, children }) => (
  <AbsoluteFill style={{ fontFamily: FONT }}>
    <Background {...bg} />
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {children}
    </svg>
  </AbsoluteFill>
);
