import React from "react";
import { C } from "../../brand/tokens";
import { Pt, hexPoints, roundedPolygon } from "../../lib/geometry";
import { useSvgId } from "../ids";
import { DOCK, ENZYME_RADII, ENZYME_REST, HEX_R, LIP_BOT } from "../molecule-geometry";
import { seg } from "./ink";
import { LitShape, circlePath, roundRectPath } from "./shared";

/**
 * Lock and key built from the SAME numbers as the enzyme's active site:
 * the keyhole is the pocket outline, the key's bit is the docked substrate end
 * (two glucose rings). Put them next to the enzyme and the model rhymes.
 */

/** The active-site pocket polygon, in enzyme-local units (mouth at x = −150, tip at x = −4). */
export const POCKET_POINTS: readonly Pt[] = ENZYME_REST.slice(LIP_BOT + 1);
const POCKET_RADII: readonly number[] = ENZYME_RADII.slice(LIP_BOT + 1);
const MOUTH_X = Math.min(...POCKET_POINTS.map((p) => p[0]));
const TIP_X = Math.max(...POCKET_POINTS.map((p) => p[0]));
/** Pocket length along its axis (≈146 units). */
export const POCKET_LEN = TIP_X - MOUTH_X;

/**
 * Pocket outline with the mouth at x = 0 and the tip pointing to +x, scaled by `k`.
 * Wound clockwise, so it can be unioned with other clockwise shapes in one path.
 */
export const pocketPath = (k = 1, shrink = 1): string => {
  const cx = (MOUTH_X + TIP_X) / 2;
  const pts = POCKET_POINTS.map(([x, y]) => [((x - cx) * shrink + cx - MOUTH_X) * k, y * shrink * k] as Pt).reverse();
  return roundedPolygon(
    pts,
    [...POCKET_RADII].reverse().map((r) => r * k * shrink),
  );
};

type IconBase = {
  readonly x: number;
  readonly y: number;
  readonly rotate?: number;
  /** "solid" = lit illustration, "line" = paper outline that draws on. */
  readonly variant?: "solid" | "line";
  /** 0..1 (line: draw-on; solid: fade + rise). */
  readonly progress?: number;
  readonly color?: string;
  readonly opacity?: number;
};

export type LockIconProps = IconBase & {
  /** Body width in px. Default 220. */
  readonly size?: number;
};

/** Padlock whose keyhole is the enzyme's active-site pocket. Body = enzyme teal. */
export const LockIcon: React.FC<LockIconProps> = ({ x, y, size = 220, rotate = 0, variant = "solid", progress = 1, color, opacity = 1 }) => {
  const id = useSvgId("lock");
  if (progress <= 0 || opacity <= 0) return null;
  const bw = size;
  const bh = size * 0.8;
  const top = -bh / 2 + size * 0.14;
  const sh = size * 0.3; // shackle half-width
  const shH = size * 0.36;
  const sw = size * 0.1;
  const shackle = `M${-sh},${top + 4}V${top - shH + sh}A${sh},${sh} 0 0 1 ${sh},${top - shH + sh}V${top + 4}`;
  const body = roundRectPath(-bw / 2, top, bw, bh, size * 0.16);
  const k = (bh * 0.56) / POCKET_LEN;
  // Keyhole: pocket rotated so the tip points up and the mouth opens downward.
  const holeY = top + bh * 0.5;
  const hole = (
    <g transform={`translate(0 ${holeY + (POCKET_LEN * k) / 2}) rotate(-90)`}>
      <path d={pocketPath(k)} />
    </g>
  );
  if (variant === "line") {
    const c = color ?? C.paper;
    const a = seg(progress, 0, 0.45);
    const b = seg(progress, 0.2, 0.75);
    const h = seg(progress, 0.55, 1);
    return (
      <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
        {a > 0 ? <path d={shackle} pathLength={1} strokeDasharray={`${a} 1`} /> : null}
        {b > 0 ? <path d={body} pathLength={1} strokeDasharray={`${b} 1`} /> : null}
        {h > 0 ? (
          <g transform={`translate(0 ${holeY + (POCKET_LEN * k) / 2}) rotate(-90)`}>
            <path d={pocketPath(k)} pathLength={1} strokeDasharray={`${h} 1`} strokeWidth={5} />
          </g>
        ) : null}
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y + (1 - progress) * 20}) rotate(${rotate})`} opacity={opacity * progress}>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.ink300} />
          <stop offset="0.45" stopColor={C.ink400} />
          <stop offset="1" stopColor={C.ink600} />
        </linearGradient>
      </defs>
      {/* Shackle */}
      <path d={shackle} fill="none" stroke={C.ink950} strokeOpacity={0.35} strokeWidth={sw} strokeLinecap="round" transform="translate(0 6)" />
      <path d={shackle} fill="none" stroke={`url(#${id}-metal)`} strokeWidth={sw} strokeLinecap="round" />
      <path d={`M${-sh - sw * 0.2},${top - 2}V${top - shH + sh}A${sh + sw * 0.2},${sh + sw * 0.2} 0 0 1 ${-sh * 0.2},${top - shH - sw * 0.2}`} fill="none" stroke={C.paper} strokeOpacity={0.35} strokeWidth={Math.max(2, sw * 0.16)} strokeLinecap="round" />
      {/* Body (enzyme teal) */}
      <LitShape d={body} top={color ?? C.teal} bottom={C.tealDeep} rim={C.tealLight} rimWidth={size * 0.035} slant={0.5} shadow={0.5} shadowDy={size * 0.06} shadowBlur={size * 0.07} />
      {/* Keyhole = the active site */}
      <g fill={C.ink950} opacity={0.92}>
        {hole}
      </g>
      {/* Light catches the lower inner wall of the hole. */}
      <clipPath id={`${id}-hc`}>{hole}</clipPath>
      <g clipPath={`url(#${id}-hc)`}>
        <g transform="translate(0 -3)" fill="none" stroke={C.tealLight} strokeOpacity={0.4} strokeWidth={2.5}>
          {hole}
        </g>
      </g>
    </g>
  );
};

export type KeyIconProps = IconBase & {
  /** Overall length in px. Default 340. */
  readonly size?: number;
  /** Show the two glucose rings inside the bit (the substrate rhyme). Default true. */
  readonly rings?: boolean;
};

/** A key whose bit is the substrate's docked end — the exact shape of the pocket. Cream = starch. */
export const KeyIcon: React.FC<KeyIconProps> = ({ x, y, size = 340, rotate = 0, variant = "solid", progress = 1, color, rings = true, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const units = POCKET_LEN + 150 + 112;
  const k = size / units;
  const bowR = 56 * k;
  const bowX = -(150 + 56) * k;
  const shaftH = 30 * k;
  const offX = -(units * k) / 2 - bowX + bowR; // centre the whole key on (x, y)
  const bit = pocketPath(k, 0.94);
  const ringsAt = [DOCK.outer[0], DOCK.inner[0]].map((rx) => (rx - MOUTH_X) * k);
  const hexD = roundedPolygon(
    hexPoints(HEX_R * k * 0.82),
    5 * k,
  );
  if (variant === "line") {
    const c = color ?? C.paper;
    const a = seg(progress, 0, 0.35);
    const b = seg(progress, 0.25, 0.55);
    const h = seg(progress, 0.45, 1);
    return (
      <g transform={`translate(${x + offX} ${y}) rotate(${rotate})`} opacity={opacity} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
        {a > 0 ? <path d={circlePath(bowX, 0, bowR)} pathLength={1} strokeDasharray={`${a} 1`} /> : null}
        {a > 0 ? <path d={circlePath(bowX, 0, bowR * 0.4)} pathLength={1} strokeDasharray={`${a} 1`} strokeWidth={4} /> : null}
        {b > 0 ? (
          <>
            <line x1={bowX + bowR} y1={-shaftH / 2} x2={bowX + bowR + (-bowX - bowR) * b} y2={-shaftH / 2} />
            <line x1={bowX + bowR} y1={shaftH / 2} x2={bowX + bowR + (-bowX - bowR) * b} y2={shaftH / 2} />
          </>
        ) : null}
        {h > 0 ? <path d={bit} pathLength={1} strokeDasharray={`${h} 1`} /> : null}
      </g>
    );
  }
  const top = color ?? C.cream;
  const keyShape = `${circlePath(bowX, 0, bowR)}${roundRectPath(bowX + bowR * 0.6, -shaftH / 2, -bowX - bowR * 0.6 + 6 * k, shaftH, shaftH * 0.3)}${bit}`;
  return (
    <g transform={`translate(${x + offX} ${y + (1 - progress) * 20}) rotate(${rotate})`} opacity={opacity * progress}>
      <LitShape d={keyShape} top={top} bottom={C.creamDeep} rim={C.paper} rimWidth={Math.max(2.5, 6 * k)} slant={0.2} shadow={0.5} shadowDy={size * 0.035} shadowBlur={size * 0.03} />
      {/* Hole in the bow. */}
      <circle cx={bowX} cy={0} r={bowR * 0.4} fill={C.ink900} />
      <circle cx={bowX} cy={2} r={bowR * 0.4} fill="none" stroke={C.paper} strokeOpacity={0.25} strokeWidth={2} />
      {rings
        ? ringsAt.map((rx, i) => (
            <path key={i} d={hexD} transform={`translate(${rx} 0)`} fill="none" stroke={C.creamDeep} strokeOpacity={0.9} strokeWidth={Math.max(2, 3.2 * k)} />
          ))
        : null}
    </g>
  );
};
