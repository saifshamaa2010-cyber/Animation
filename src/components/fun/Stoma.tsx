import React from "react";
import { useCurrentFrame } from "remotion";
import { C, W2 } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { mix } from "../kit/shared";

/**
 * A cartoon stoma: two glossy kidney-shaped guard cells around a pore (worlds kit, v2 look).
 *
 * Science it shows (Cambridge 0610): guard cells have chloroplasts (other epidermal cells don't); their
 * inner walls (next to the pore) are thicker, so when they take in water and swell (turgid) they bow apart
 * and the pore opens; when they lose water (flaccid) they straighten and the pore closes.
 *
 * Drawn standing up: the pore runs top–bottom through (x, y), so in a leaf cross-section with the lower
 * epidermis across the frame, gases pass vertically through it. Draw `layer="back"` (pore + glow) under
 * anything that travels through the pore, then `layer="front"` (the guard cells) over it.
 */
export type StomaProps = {
  /** centre of the pore */
  readonly x: number;
  readonly y: number;
  /** guard-cell length, tip to tip */
  readonly length?: number;
  /** thickness of one guard cell when turgid */
  readonly girth?: number;
  /** pore width at its widest, fully open */
  readonly poreWidth?: number;
  /** 0 closed (flaccid) … 1 open (turgid); up to ~1.2 for a "swell" bounce */
  readonly open: number;
  /** 0..1 light on the guard cells: they and their chloroplasts glow */
  readonly light?: number;
  /** 0..1 night tint */
  readonly dim?: number;
  readonly layer?: "back" | "front" | "all";
  /** cartoon faces */
  readonly face?: boolean;
  /** sunglasses: undefined = none, 1 = on the eyes, 0 = pushed up onto the head */
  readonly shades?: number;
  readonly eyes?: "open" | "sleepy" | "happy";
  readonly mouth?: "smile" | "grin" | "flat" | "o";
  /** pupils, -1..1 each way */
  readonly look?: readonly [number, number];
  /** pore colours, top (inside the leaf) and bottom (outside air) */
  readonly poreColors?: readonly [string, string];
  readonly seed?: number;
  readonly opacity?: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Half-width of the pore at fraction `t` (-1 top tip … 1 bottom tip) for an opening `open`. */
export const stomaPoreHalf = (open: number, poreWidth: number, t: number) => (poreWidth / 2) * clamp(open, 0, 1.3) * (1 - t * t);

/** Outer and inner edge x (right cell; mirror for the left) at fraction t. */
const edgeAt = (open: number, girth: number, poreWidth: number, t: number) => {
  const o = clamp(open, 0, 1.3);
  const xi = stomaPoreHalf(o, poreWidth, t);
  // turgid cells are plumper than flaccid ones
  const thick = girth * (0.8 + 0.2 * Math.min(1, o) + 0.18 * Math.max(0, o - 1));
  const xo = xi + thick * Math.pow(Math.max(0, 1 - t * t), 0.42);
  return { xi, xo };
};

/** Outer half-width of the pair at fraction t — for fitting neighbouring epidermal cells. */
export const stomaOuterHalf = (open: number, girth: number, poreWidth: number, t: number) => edgeAt(open, girth, poreWidth, t).xo;

const N = 64;
const cellPath = (open: number, L: number, girth: number, poreWidth: number, side: 1 | -1) => {
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = -1 + (2 * i) / N;
    const { xi, xo } = edgeAt(open, girth, poreWidth, t);
    outer.push(`${(side * xo).toFixed(2)},${(t * L).toFixed(2)}`);
    inner.push(`${(side * xi).toFixed(2)},${(t * L).toFixed(2)}`);
  }
  inner.reverse();
  return `M${outer.join(" L")} L${inner.join(" L")} Z`;
};

const innerWallPath = (open: number, L: number, girth: number, poreWidth: number, side: 1 | -1) => {
  const pts: string[] = [];
  for (let i = 4; i <= N - 4; i++) {
    const t = -1 + (2 * i) / N;
    const { xi } = edgeAt(open, girth, poreWidth, t);
    pts.push(`${(side * (xi + 4.5)).toFixed(2)},${(t * L).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
};

const porePath = (open: number, L: number, poreWidth: number) => {
  const r: string[] = [];
  const l: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = -1 + (2 * i) / N;
    const xi = stomaPoreHalf(open, poreWidth, t);
    r.push(`${xi.toFixed(2)},${(t * L).toFixed(2)}`);
    l.push(`${(-xi).toFixed(2)},${(t * L).toFixed(2)}`);
  }
  l.reverse();
  return `M${r.join(" L")} L${l.join(" L")} Z`;
};

const Face: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly eyes: "open" | "sleepy" | "happy";
  readonly mouth: "smile" | "grin" | "flat" | "o";
  readonly look: readonly [number, number];
  readonly shades?: number;
  readonly blink: number;
  readonly side: 1 | -1;
}> = ({ cx, cy, eyes, mouth, look, shades, blink, side }) => {
  const line = W2.chloroLine;
  const ex = 13;
  const eye = (x: number) => {
    if (eyes === "sleepy") return <path d={`M${x - 7},${cy - 1} Q${x},${cy + 5} ${x + 7},${cy - 1}`} fill="none" stroke={line} strokeWidth={3.2} strokeLinecap="round" />;
    if (eyes === "happy") return <path d={`M${x - 7},${cy + 2} Q${x},${cy - 7} ${x + 7},${cy + 2}`} fill="none" stroke={line} strokeWidth={3.4} strokeLinecap="round" />;
    const ry = 10 * (1 - 0.9 * blink);
    return (
      <g>
        <ellipse cx={x} cy={cy} rx={8} ry={ry} fill="#FFFFFF" stroke={line} strokeWidth={2.4} />
        {blink < 0.6 ? (
          <g>
            <circle cx={x + look[0] * 2.6} cy={cy + 1 + look[1] * 2.6} r={4.6} fill="#1C1830" />
            <circle cx={x + look[0] * 2.6 - 1.6} cy={cy - 1 + look[1] * 2.6} r={1.6} fill="#FFFFFF" />
          </g>
        ) : null}
      </g>
    );
  };
  const my = cy + 19;
  const mouthEl =
    mouth === "grin" ? (
      <g>
        <path d={`M${cx - 9},${my - 2} Q${cx},${my + 13} ${cx + 9},${my - 2} Z`} fill="#4A1D2B" stroke={line} strokeWidth={2.4} strokeLinejoin="round" />
        <ellipse cx={cx} cy={my + 5} rx={4} ry={2.4} fill="#FF8C98" />
      </g>
    ) : mouth === "o" ? (
      <ellipse cx={cx} cy={my + 2} rx={4.5} ry={6} fill="#4A1D2B" />
    ) : mouth === "flat" ? (
      <path d={`M${cx - 6},${my + 1} L${cx + 6},${my + 1}`} stroke={line} strokeWidth={3} strokeLinecap="round" />
    ) : (
      <path d={`M${cx - 8},${my - 1} Q${cx},${my + 7} ${cx + 8},${my - 1}`} fill="none" stroke={line} strokeWidth={3} strokeLinecap="round" />
    );
  // sunglasses: slide from the eyes (1) up onto the head (0)
  const sh = shades === undefined ? null : clamp(shades, 0, 1);
  const gy = sh === null ? 0 : cy - (1 - sh) * 34;
  const lens = (x: number) => `M${x - 12},${gy - 7} H${x + 12} Q${x + 13},${gy + 9} ${x},${gy + 10} Q${x - 13},${gy + 9} ${x - 12},${gy - 7} Z`;
  return (
    <g>
      <ellipse cx={cx - 21} cy={cy + 12} rx={6} ry={3.6} fill={W2.cheek} opacity={0.75} />
      <ellipse cx={cx + 21} cy={cy + 12} rx={6} ry={3.6} fill={W2.cheek} opacity={0.75} />
      {eye(cx - ex)}
      {eye(cx + ex)}
      {mouthEl}
      {sh !== null ? (
        <g transform={`rotate(${(1 - sh) * -7 * side} ${cx} ${gy})`}>
          <path d={`M${cx - 26},${gy - 5} L${cx - 31},${gy - 2} M${cx + 26},${gy - 5} L${cx + 31},${gy - 2}`} stroke="#1C1830" strokeWidth={3} strokeLinecap="round" />
          <path d={`M${cx - 2},${gy - 4} Q${cx},${gy - 7} ${cx + 2},${gy - 4}`} fill="none" stroke="#1C1830" strokeWidth={3.4} />
          <path d={lens(cx - ex)} fill="#1C1830" />
          <path d={lens(cx + ex)} fill="#1C1830" />
          <path d={`M${cx - ex - 7},${gy - 3} L${cx - ex - 2},${gy - 3}`} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={2.4} strokeLinecap="round" />
          <path d={`M${cx + ex - 7},${gy - 3} L${cx + ex - 2},${gy - 3}`} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={2.4} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

/** How shut the eyes are (0 open … 1 shut): a quick blink every ~4 s. */
const blinkAt = (f: number, seed: number) => {
  const period = 113 + (seed % 4) * 11;
  const t = (f + seed * 41) % period;
  if (t < 3) return t / 3;
  if (t < 6) return 1 - (t - 3) / 3;
  return 0;
};

export const Stoma: React.FC<StomaProps> = ({
  x,
  y,
  length = 300,
  girth = 92,
  poreWidth = 74,
  open,
  light = 0,
  dim = 0,
  layer = "all",
  face = false,
  shades,
  eyes = "open",
  mouth = "smile",
  look = [0, 0],
  poreColors = [W2.leafNight, mix(W2.leafNight, C.ice, 0.25)],
  seed = 1,
  opacity = 1,
}) => {
  const id = useSvgId("stoma");
  const f = useCurrentFrame();
  if (opacity <= 0) return null;
  const L = length / 2;
  const lt = clamp(light, 0, 1);
  const dm = clamp(dim, 0, 1);
  const tone = (c: string) => mix(mix(c, W2.chloroLight, lt * 0.28), W2.leafNight, dm * 0.42);
  const light1 = tone(W2.chloroLight);
  const mid = tone(W2.chloroMid);
  const deep = tone(W2.chloroDeep);
  const back = layer !== "front";
  const front = layer !== "back";
  const sides: (1 | -1)[] = [-1, 1];
  // chloroplasts: (t along the cell, s across it 0 = pore side … 1 = outer side)
  const plastids: [number, number][] = [
    [0.2, 0.52],
    [0.47, 0.42],
    [0.72, 0.5],
    [-0.66, 0.56],
  ];
  const tFace = -0.3;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <radialGradient id={`${id}-body`} cx="0.35" cy="0.25" r="0.9">
          <stop offset="0" stopColor={light1} />
          <stop offset="0.5" stopColor={mid} />
          <stop offset="1" stopColor={deep} />
        </radialGradient>
        <linearGradient id={`${id}-pore`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={poreColors[0]} />
          <stop offset="1" stopColor={poreColors[1]} />
        </linearGradient>
        <radialGradient id={`${id}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.sun} stopOpacity={0.55} />
          <stop offset="0.6" stopColor={C.sun} stopOpacity={0.14} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {back ? (
        <g>
          {lt > 0 ? <ellipse cx={0} cy={0} rx={girth * 2.6} ry={L * 1.35} fill={`url(#${id}-halo)`} opacity={lt} /> : null}
          {open > 0.01 ? <path d={porePath(open, L, poreWidth)} fill={`url(#${id}-pore)`} /> : null}
          {open > 0.01 && lt > 0 ? <path d={porePath(open, L, poreWidth)} fill={C.sun} opacity={0.22 * lt} filter={`url(#${id}-soft)`} /> : null}
        </g>
      ) : null}
      {front ? (
        <g>
          {sides.map((side) => {
            const d = cellPath(open, L, girth, poreWidth, side);
            const fp = edgeAt(open, girth, poreWidth, tFace);
            const fx = side * (fp.xi + (fp.xo - fp.xi) * 0.52);
            const fy = tFace * L;
            const gl = edgeAt(open, girth, poreWidth, -0.55);
            return (
              <g key={side}>
                {/* contact shadow */}
                <path d={d} fill="#000" opacity={0.28} transform="translate(5 9)" />
                <path d={d} fill={`url(#${id}-body)`} />
                {/* thick inner wall (next to the pore): why the cells bow apart when they swell */}
                <path d={innerWallPath(open, L, girth, poreWidth, side)} fill="none" stroke={mix(deep, W2.chloroLine, 0.35)} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
                {/* chloroplasts */}
                {plastids.map(([t, s], i) => {
                  const e = edgeAt(open, girth, poreWidth, t);
                  const px = side * (e.xi + (e.xo - e.xi) * s);
                  const py = t * L;
                  const ang = side * (t > 0 ? -18 : 18) + 90;
                  return (
                    <g key={i} transform={`translate(${px} ${py}) rotate(${ang})`}>
                      {lt > 0 ? <ellipse rx={20} ry={14} fill={C.sun} opacity={0.32 * lt} filter={`url(#${id}-soft)`} /> : null}
                      <ellipse rx={14} ry={8.5} fill={mix(tone(W2.cellDeep), C.sun, lt * 0.22)} stroke={tone(W2.chloroLine)} strokeWidth={2.2} />
                      <path d="M-7,-2 L7,-2 M-6,2.5 L6,2.5" stroke={tone(W2.chloroLight)} strokeOpacity={0.7} strokeWidth={1.6} strokeLinecap="round" />
                    </g>
                  );
                })}
                {/* gloss + rim light on the upper outer edge */}
                <ellipse
                  cx={side * (gl.xi + (gl.xo - gl.xi) * 0.62)}
                  cy={-0.55 * L}
                  rx={girth * 0.17}
                  ry={girth * 0.09}
                  fill="#FFFFFF"
                  opacity={0.55 - dm * 0.3}
                  transform={`rotate(${side * 52} ${side * (gl.xi + (gl.xo - gl.xi) * 0.62)} ${-0.55 * L})`}
                />
                <path d={d} fill="none" stroke={W2.chloroLine} strokeWidth={5} strokeLinejoin="round" />
                {face ? (
                  <Face cx={fx} cy={fy} eyes={eyes} mouth={mouth} look={look} shades={shades} blink={blinkAt(f, seed + (side > 0 ? 3 : 0))} side={side} />
                ) : null}
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
};
