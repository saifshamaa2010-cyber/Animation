import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../brand/tokens";

/** Frames on each side of a scene boundary used by the soft "focus pull" between scenes. */
export const TRANSITION = 9;

/**
 * Wraps a scene for the episode timeline. Neighbouring scenes overlap by 2×TRANSITION frames:
 * the outgoing scene drifts out of focus while the incoming one comes into focus — like a camera
 * racking focus from one subject to the next, rather than a generic crossfade.
 */
export const SceneShell: React.FC<{
  readonly pre: number;
  readonly post: number;
  readonly total: number;
  readonly children: React.ReactNode;
}> = ({ pre, post, total, children }) => {
  const frame = useCurrentFrame();
  const c = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const inP = pre > 0 ? interpolate(frame, [0, pre * 2], [0, 1], { ...c, easing: EASE.out }) : 1;
  const outP = post > 0 ? interpolate(frame, [total - post * 2, total], [1, 0], { ...c, easing: EASE.in }) : 1;
  const vis = Math.min(inP, outP);
  const blur = (1 - inP) * 10 + (1 - outP) * 10;
  return (
    <AbsoluteFill style={{ opacity: vis, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};
