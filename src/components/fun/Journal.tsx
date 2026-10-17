/**
 * The "old journal" kit (v2 worlds look): a naturalist's notebook page whose sepia ink drawings come
 * alive. Ink lines draw on (`progress` 0..1), watercolour washes bloom inside them, and a wash can warm
 * from a pale period tint (`full` 0) into real colour (`full` 1). Also: a feather quill whose nib sits
 * exactly where the ink is, a five-bar tally, and a big hand-inked question mark.
 * All SVG in the caller's coordinates, all driven by the frame (no CSS animation). Reusable in any episode.
 */
import React from "react";
import { C, EASE, W2 } from "../../brand/tokens";
import { useSvgId } from "../ids";
import { HandLayer, InkPath, mix } from "../kit/shared";
import { inkGeometry, penEase, prepareStroke, seg } from "../kit/ink";

type Pt = readonly [number, number];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** The journal's ink. */
export const JOURNAL_INK = W2.sepia;

/** A watercolour wash colour: pale period tint (full = 0) → the real colour (full = 1). */
export const washColour = (c: string, full: number) => mix(c, W2.parchment, 0.45 * (1 - clamp01(full)));

/**
 * Children drawn as watercolour: soft, slightly irregular edges (the pigment never sits exactly in the
 * lines). Put fills in here and the ink lines outside, on top.
 */
export const Watercolour: React.FC<{ readonly seed?: number; readonly strength?: number; readonly opacity?: number; readonly children: React.ReactNode }> = ({
  seed = 3,
  strength = 7,
  opacity = 1,
  children,
}) => {
  const id = useSvgId("wash");
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity} filter={`url(#${id})`}>
      <defs>
        <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed % 997} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={strength} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      {children}
    </g>
  );
};

/** One pen line through control points (smoothed, pressure-tapered), drawn on with `progress` (pass it linear). */
export const InkLine: React.FC<{
  readonly pts: readonly Pt[];
  readonly progress: number;
  readonly width?: number;
  readonly color?: string;
  readonly seed?: number;
  readonly opacity?: number;
  readonly rough?: number;
}> = ({ pts, progress, width = 5, color = JOURNAL_INK, seed = 1, opacity = 1, rough = 0.35 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const style = { width, seed: seed * 7919, wobble: 0.5, minStart: 0.5, minEnd: 0.25 };
  const st = prepareStroke(pts, style);
  return (
    <HandLayer opacity={opacity} rough={rough} seed={seed}>
      <InkPath geo={inkGeometry(st.poly, st.L, style, penEase(clamp01(progress)))} color={color} />
    </HandLayer>
  );
};

/** An SVG path drawn on like a pen line (uniform width). `progress` 0..1 along the path. */
export const DrawPath: React.FC<{
  readonly d: string;
  readonly progress: number;
  readonly width?: number;
  readonly color?: string;
  readonly opacity?: number;
}> = ({ d, progress, width = 3, color = JOURNAL_INK, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const p = clamp01(progress);
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      pathLength={1}
      strokeDasharray={p >= 1 ? undefined : `${p} 1.01`}
    />
  );
};

/**
 * A feather quill whose NIB is at (x, y). `angle` = direction from the nib to the feather's end
 * (−62 = held by a right hand). `progress` 0..1 slides it in along its own axis (pass a falling value
 * to take it away).
 */
export const Quill: React.FC<{ readonly x: number; readonly y: number; readonly angle?: number; readonly progress?: number; readonly scale?: number }> = ({
  x,
  y,
  angle = -62,
  progress = 1,
  scale = 1,
}) => {
  const id = useSvgId("quill");
  if (progress <= 0) return null;
  const p = EASE.out(clamp01(progress));
  const slide = (1 - p) * 380;
  const vane = "M84,-3 C120,-26 190,-44 262,-40 C300,-38 330,-30 352,-14 C330,-10 300,-2 262,4 C200,12 130,12 84,5 Z";
  const barbs = Array.from({ length: 13 }, (_, i) => {
    const bx = 112 + i * 18;
    return i % 2 ? `M${bx},0 L${bx + 22},-${18 + (i < 7 ? i * 2.6 : (13 - i) * 2.6)}` : `M${bx},1 L${bx + 16},${6 + (i < 7 ? i * 0.6 : (13 - i) * 0.6)}`;
  });
  return (
    <g opacity={Math.min(1, progress * 2.5)} transform={`translate(${x} ${y}) rotate(${angle}) translate(${slide} 0) scale(${scale})`}>
      <defs>
        <linearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paper} />
          <stop offset="1" stopColor={C.cream} />
        </linearGradient>
        <filter id={`${id}-s`} x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      {/* soft shadow on the page (the quill is lifted a little) */}
      <g transform={`rotate(${-angle}) translate(16 22) rotate(${angle})`} opacity={0.24} filter={`url(#${id}-s)`}>
        <path d={vane} fill="#000000" />
        <rect x={20} y={-5} width={80} height={10} rx={5} fill="#000000" />
      </g>
      {/* nib (dark, with its slit) */}
      <path d="M0,0 L30,-6 L36,0 L30,6 Z" fill={W2.inkText} />
      <path d="M2,0 L22,0" stroke={C.cream} strokeWidth={1.4} />
      {/* barrel */}
      <path d="M30,-6 L92,-4 L92,4 L30,6 Z" fill={C.cream} stroke={JOURNAL_INK} strokeWidth={2} strokeLinejoin="round" />
      {/* feather */}
      <path d={vane} fill={`url(#${id}-v)`} stroke={JOURNAL_INK} strokeWidth={2.5} strokeLinejoin="round" />
      {barbs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={JOURNAL_INK} strokeOpacity={0.35} strokeWidth={1.6} strokeLinecap="round" />
      ))}
      <path d="M84,0 C170,-4 270,-12 352,-14" fill="none" stroke={JOURNAL_INK} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
};

/** One quill writing job: the nib follows `tip(frame)` from `start` to `end`. */
export type QuillJob = { readonly start: number; readonly end: number; readonly tip: (frame: number) => Pt };

/**
 * Where the quill is at frame f, given its writing jobs (sorted by start): it slides in just before a
 * job, follows the writing, glides straight to the next job when that starts soon after, otherwise
 * slides away. Returns the nib position and the quill's presence (0..1, its `progress`).
 */
export const quillAt = (jobs: readonly QuillJob[], f: number, glide = 26): { tip: Pt; on: number } => {
  if (!jobs.length) return { tip: [0, 0], on: 0 };
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    if (f >= j.start && f <= j.end) return { tip: j.tip(f), on: 1 };
    const next = jobs[i + 1];
    if (next && f > j.end && f < next.start && next.start - j.end <= glide) {
      const t = EASE.inOut((f - j.end) / (next.start - j.end));
      const a = j.tip(j.end);
      const b = next.tip(next.start);
      return { tip: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 30], on: 1 };
    }
  }
  // not writing: find the nearest job to slide in to / away from
  const upcoming = jobs.find((j) => j.start > f);
  const past = [...jobs].reverse().find((j) => j.end < f);
  const inP = upcoming ? clamp01(1 - (upcoming.start - f) / 12) : 0;
  const outP = past ? clamp01(1 - (f - past.end) / 14) : 0;
  if (inP >= outP && upcoming) return { tip: upcoming.tip(upcoming.start), on: inP };
  if (past) return { tip: past.tip(past.end), on: outP };
  return { tip: jobs[0].tip(jobs[0].start), on: 0 };
};

/**
 * A five-bar tally (four strokes and one across), `count` 0..5 (fractional = the stroke being drawn).
 * (x, y) = bottom-left of the first stroke.
 */
export const Tally: React.FC<{ readonly x: number; readonly y: number; readonly h?: number; readonly count: number; readonly color?: string; readonly width?: number; readonly gap?: number }> = ({
  x,
  y,
  h = 84,
  count,
  color = JOURNAL_INK,
  width = 7,
  gap = 30,
}) => (
  <g>
    {[0, 1, 2, 3].map((i) => (
      <InkLine
        key={i}
        pts={[
          [x + i * gap + 4, y - h],
          [x + i * gap + 1, y - h * 0.5],
          [x + i * gap - 2, y],
        ]}
        progress={clamp01(count - i)}
        width={width}
        color={color}
        seed={61 + i}
      />
    ))}
    <InkLine
      pts={[
        [x - 22, y - h * 0.22],
        [x + gap * 1.6, y - h * 0.52],
        [x + gap * 3 + 24, y - h * 0.84],
      ]}
      progress={clamp01(count - 4)}
      width={width}
      color={color}
      seed={71}
    />
  </g>
);

/** A big hand-inked "?" centred on (x, y); `progress` 0..1 draws the hook, then dots it. */
export const InkQuestion: React.FC<{ readonly x: number; readonly y: number; readonly size?: number; readonly progress: number; readonly color?: string; readonly opacity?: number }> = ({
  x,
  y,
  size = 260,
  progress,
  color = JOURNAL_INK,
  opacity = 1,
}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const k = size / 260;
  const P = (px: number, py: number): Pt => [x + px * k, y + py * k];
  const hook: Pt[] = [P(-62, -64), P(-48, -108), P(0, -128), P(52, -106), P(60, -62), P(30, -24), P(4, 0), P(-2, 30), P(0, 48)];
  const dot = clamp01((progress - 0.82) / 0.18);
  return (
    <g opacity={opacity}>
      <InkLine pts={hook} progress={seg(progress, 0, 0.78)} width={24 * k} color={color} seed={83} />
      {dot > 0 ? <ellipse cx={x + 2 * k} cy={y + 104 * k} rx={17 * k * EASE.out(dot)} ry={15 * k * EASE.out(dot)} fill={color} /> : null}
    </g>
  );
};
