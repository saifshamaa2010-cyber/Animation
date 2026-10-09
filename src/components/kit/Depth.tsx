import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, H, W } from "../../brand/tokens";
import { hexPoints, rng, roundedPolygon } from "../../lib/geometry";
import { useSvgId } from "../ids";

export type FocusPullProps = {
  /** Blur radius in px (0 = sharp). Animate it for a rack focus. */
  readonly blur: number;
  /** Optional dimming while out of focus (0..1 of the blur's effect). Default 0.25. */
  readonly dim?: number;
  readonly opacity?: number;
  readonly children: React.ReactNode;
};

/**
 * Rack-focus wrapper. Blur the layer you are leaving and sharpen the one you are
 * going to — a camera-like shift of attention, without moving anything.
 */
export const FocusPull: React.FC<FocusPullProps> = ({ blur, dim = 0.25, opacity = 1, children }) => {
  const id = useSvgId("focus");
  const b = Math.max(0, blur);
  const fade = 1 - Math.min(1, b / 24) * dim;
  if (b < 0.05) return <g opacity={opacity}>{children}</g>;
  return (
    <g opacity={opacity * fade} filter={`url(#${id})`}>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={-W * 0.25} y={-H * 0.25} width={W * 1.5} height={H * 1.5}>
          <feGaussianBlur stdDeviation={b} />
        </filter>
      </defs>
      {children}
    </g>
  );
};

export type DepthMoleculesProps = {
  /** How many out-of-focus foreground molecules. Default 5. */
  readonly count?: number;
  readonly seed?: number;
  readonly kind?: "glucose" | "water" | "mixed";
  /** Base blur in px (the nearest ones get more). Default 12. */
  readonly blur?: number;
  /** Overall strength. Default 0.45 (keep it subtle). */
  readonly opacity?: number;
  /** Drift speed multiplier. Default 1. */
  readonly speed?: number;
  /** Keep the middle of the frame clear for the subject. Default true. */
  readonly keepCentreClear?: boolean;
};

/**
 * A few big, blurry molecules drifting very close to the "lens". They give the
 * frame depth (foreground / subject / background) like a macro lens would.
 */
export const DepthMolecules: React.FC<DepthMoleculesProps> = ({
  count = 5,
  seed = 11,
  kind = "glucose",
  blur = 12,
  opacity = 0.45,
  speed = 1,
  keepCentreClear = true,
}) => {
  const frame = useCurrentFrame();
  const id = useSvgId("depth");
  const r = rng(seed);
  const items = Array.from({ length: count }, (_, i) => {
    // Spread round the edges of the frame (top/bottom/left/right bands).
    const band = (i + Math.floor(r() * 4)) % 4;
    const t = (i + 0.5) / count + (r() - 0.5) * 0.12;
    let x = 0;
    let y = 0;
    if (!keepCentreClear) {
      x = r() * W;
      y = r() * H;
    } else if (band === 0) {
      // Centres sit on or just past the frame edge: they frame the shot, never cover it.
      x = t * W;
      y = -40 + r() * 70;
    } else if (band === 1) {
      x = t * W;
      y = H + 40 - r() * 70;
    } else if (band === 2) {
      x = -40 + r() * 70;
      y = t * H;
    } else {
      x = W + 40 - r() * 70;
      y = t * H;
    }
    const near = r() > 0.5;
    const isGlucose = kind === "glucose" || (kind === "mixed" && i % 2 === 0);
    return { x, y, s: near ? 3.4 + r() * 1.4 : 2.2 + r() * 0.8, near, isGlucose, rot: r() * 60, i };
  });
  const hex = roundedPolygon(hexPoints(30), 6);
  const tiers = [false, true] as const;
  return (
    <g opacity={opacity} style={{ pointerEvents: "none" }}>
      <defs>
        <filter id={`${id}-a`} filterUnits="userSpaceOnUse" x={-W * 0.2} y={-H * 0.2} width={W * 1.4} height={H * 1.4}>
          <feGaussianBlur stdDeviation={blur} />
        </filter>
        <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-W * 0.2} y={-H * 0.2} width={W * 1.4} height={H * 1.4}>
          <feGaussianBlur stdDeviation={blur * 1.6} />
        </filter>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={C.amberLight} />
          <stop offset="1" stopColor={C.amber} />
        </linearGradient>
      </defs>
      {tiers.map((tierNear) => (
        <g key={String(tierNear)} filter={`url(#${id}-${tierNear ? "b" : "a"})`}>
          {items
            .filter((it) => it.near === tierNear)
            .map((it) => {
              const tt = frame * 0.004 * speed;
              const dx = noise2D(`dmx${seed}-${it.i}`, tt, 0) * 70 + frame * 0.12 * speed * (it.near ? 1.4 : 1);
              const dy = noise2D(`dmy${seed}-${it.i}`, tt, 3) * 50;
              const rot = it.rot + noise2D(`dmr${seed}-${it.i}`, tt, 6) * 25;
              return (
                <g key={it.i} transform={`translate(${it.x + dx} ${it.y + dy}) rotate(${rot}) scale(${it.s})`} opacity={it.near ? 0.55 : 0.75}>
                  {it.isGlucose ? (
                    <>
                      <path d={hex} fill={`url(#${id}-g)`} />
                      <circle cx={15} cy={-26} r={5.5} fill={C.creamDeep} />
                    </>
                  ) : (
                    <>
                      <circle cx={-17} cy={13} r={9} fill={C.paper} />
                      <circle cx={17} cy={13} r={9} fill={C.paper} />
                      <circle cx={0} cy={0} r={15} fill={C.coral} />
                    </>
                  )}
                </g>
              );
            })}
        </g>
      ))}
    </g>
  );
};
