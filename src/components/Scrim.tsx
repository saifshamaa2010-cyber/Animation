import React from "react";
import { C, H, W } from "../brand/tokens";

/** Soft dark band at the bottom of the frame so captions stay readable over busy scenes. */
export const Scrim: React.FC<{ readonly opacity: number; readonly height?: number }> = ({ opacity, height = 340 }) => {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id="scrim-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ink950} stopOpacity={0} />
          <stop offset="0.55" stopColor={C.ink950} stopOpacity={0.78} />
          <stop offset="1" stopColor={C.ink950} stopOpacity={0.92} />
        </linearGradient>
      </defs>
      <rect x={0} y={H - height} width={W} height={height} fill="url(#scrim-grad)" />
    </g>
  );
};
