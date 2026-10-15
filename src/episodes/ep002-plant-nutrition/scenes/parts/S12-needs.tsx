/** S12 helpers: the "=" / "≠" sign drawn between a test row and its control row. */
import React from "react";
import { C, EASE } from "../../../../brand/tokens";
import { mix } from "../../../../components/kit";

/**
 * A hand-sized equals sign, drawn vertically between two rows (they are the same).
 * `neq` 0..1 strikes it through and turns it coral (they differ).
 */
export const EqualSign: React.FC<{ readonly x: number; readonly y: number; readonly progress: number; readonly neq?: number; readonly size?: number }> = ({ x, y, progress, neq = 0, size = 46 }) => {
  if (progress <= 0) return null;
  const p = EASE.out(Math.min(1, progress));
  const col = mix(C.ink300, C.coral, neq);
  const h = size / 2;
  const g = size * 0.2;
  const s = EASE.out(Math.min(1, neq));
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <line x1={x - h * p} y1={y - g} x2={x + h * p} y2={y - g} stroke={col} strokeWidth={7} strokeLinecap="round" />
      <line x1={x - h * p} y1={y + g} x2={x + h * p} y2={y + g} stroke={col} strokeWidth={7} strokeLinecap="round" />
      {s > 0 ? <line x1={x + h * 0.55} y1={y - h * 1.1} x2={x + h * 0.55 - (h * 1.1) * s} y2={y - h * 1.1 + h * 2.2 * s} stroke={col} strokeWidth={7} strokeLinecap="round" /> : null}
    </g>
  );
};
