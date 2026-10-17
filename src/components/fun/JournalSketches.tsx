/**
 * Journal sketches (v2 worlds look): the things a 17th-century naturalist would draw in a notebook,
 * as sepia ink drawings that come alive — a willow (any tree geometry with trunk, limbs and hanging
 * strands of leaves), a cut-away clay pot of soil, an old equal-arm balance with brass weights, a heap
 * of soil and a watering can with falling drops.
 *
 * Every sketch takes the same three knobs:
 *   ink   0..1  the pen lines draw on
 *   wash  0..1  the watercolour is brushed in (a pale period tint)
 *   full  0..1  the tint warms into full colour
 * All SVG in the caller's coordinates; frame-driven, deterministic.
 */
import React from "react";
import { C, EASE, W2 } from "../../brand/tokens";
import { rng } from "../../lib/geometry";
import { useSvgId } from "../ids";
import { mix } from "../kit/shared";
import { DrawPath, JOURNAL_INK, Watercolour, washColour } from "./Journal";

type Pt = readonly [number, number];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

// ------------------------------------------------------------------------------------------ willow

export type SketchLeaf = { readonly x: number; readonly y: number; readonly rot: number; readonly len: number; readonly w: number; readonly fill: string; readonly op: number; readonly key: number };
export type SketchStrand = { readonly d: string; readonly width: number; readonly leaves: readonly SketchLeaf[] };
/** Tree geometry (structurally the same as EP002's `willowGeometry`). */
export type SketchTree = {
  readonly g: number;
  readonly trunkD: string;
  readonly limbs: readonly { readonly d: string }[];
  readonly back: readonly SketchStrand[];
  readonly front: readonly SketchStrand[];
  readonly trunkAt?: (t: number) => Pt;
  readonly trunkHalf?: (t: number) => number;
};

const leafD = (len: number, w: number) =>
  `M0,0 C${(w * 1.1).toFixed(1)},${(len * 0.22).toFixed(1)} ${(w * 0.9).toFixed(1)},${(len * 0.72).toFixed(1)} 0,${len.toFixed(1)} C${(-w * 0.9).toFixed(1)},${(len * 0.72).toFixed(1)} ${(-w * 1.1).toFixed(1)},${(len * 0.22).toFixed(1)} 0,0Z`;

/**
 * A tree drawn in ink and watercolour. Leaves are inked as small sepia strokes that take on their
 * green as the wash comes in; trunk and limbs are outlined in ink and washed in bark brown.
 * `glow` warms the wood amber; `glint(key)` flashes a leaf (e.g. when carbon dioxide enters it).
 */
export const InkWillow: React.FC<{
  readonly geo: SketchTree;
  readonly ink?: number;
  readonly wash?: number;
  readonly full?: number;
  readonly glow?: number;
  readonly glint?: (key: number) => number;
  /** ink line width for the wood */
  readonly line?: number;
  readonly seed?: number;
}> = ({ geo, ink = 1, wash = 1, full = 0, glow = 0, glint, line = 3, seed = 5 }) => {
  const id = useSvgId("inkwil");
  if (ink <= 0) return null;
  const gl = glint ?? (() => 0);
  const inkTrunk = seg(ink, 0, 0.35);
  const inkLimbs = seg(ink, 0.2, 0.6);
  const inkStrands = seg(ink, 0.4, 0.8);
  const leafInk = (j: number, n: number) => seg(ink, 0.5 + 0.42 * (j / Math.max(1, n)), 0.58 + 0.42 * (j / Math.max(1, n)));
  const woodWash = mix(washColour(C.bark, full), mix(C.amber, C.amberLight, 0.25), 0.8 * clamp01(glow));
  const stemCol = mix(JOURNAL_INK, C.leafDark, 0.5 * full);
  const leafCol = (l: SketchLeaf) => {
    let c = mix(JOURNAL_INK, washColour(l.fill, full), clamp01(wash));
    const k = gl(l.key);
    if (k > 0) c = mix(c, mix(C.leafLight, C.paper, 0.5), k * 0.85);
    return c;
  };
  const strands = (list: readonly SketchStrand[], back: boolean) =>
    list.map((s, i) => (
      <g key={`${back ? "b" : "f"}${i}`}>
        <DrawPath d={s.d} progress={inkStrands} width={s.width * 0.9} color={stemCol} opacity={back ? 0.75 : 0.95} />
        {s.leaves.map((l, j) => {
          const a = leafInk(j, s.leaves.length);
          if (a <= 0 || l.op <= 0.01) return null;
          const k = 1 + 0.35 * gl(l.key);
          const sc = EASE.out(a) * k;
          return (
            <path
              key={l.key}
              d={leafD(l.len * sc, l.w * sc)}
              transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)})`}
              fill={leafCol(l)}
              stroke={JOURNAL_INK}
              strokeWidth={0.9}
              strokeOpacity={0.5 * clamp01(wash) * (1 - 0.5 * full)}
              opacity={l.op * (back ? 0.92 : 1)}
            />
          );
        })}
      </g>
    ));
  const grain =
    geo.trunkAt && geo.trunkHalf && geo.g > 0.25
      ? [-0.4, 0.15, 0.55].map((o, i) => {
          const pts = Array.from({ length: 8 }, (_, k) => {
            const t = 0.06 + (k / 7) * (0.78 - i * 0.12);
            const c = geo.trunkAt!(t);
            return `${(c[0] + o * geo.trunkHalf!(t) * 0.8).toFixed(1)},${c[1].toFixed(1)}`;
          });
          return `M${pts.join(" L")}`;
        })
      : [];
  return (
    <g>
      <defs>
        <filter id={`${id}-halo`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={20} />
        </filter>
      </defs>
      {strands(geo.back, true)}
      {glow > 0 ? (
        <g opacity={0.8 * Math.min(1, glow)} filter={`url(#${id}-halo)`}>
          <path d={geo.trunkD} fill={C.amber} />
          {geo.limbs.map((l, i) => (
            <path key={i} d={l.d} fill={C.amber} />
          ))}
        </g>
      ) : null}
      <Watercolour seed={seed} strength={5} opacity={clamp01(wash) * (0.82 + 0.18 * full)}>
        <path d={geo.trunkD} fill={woodWash} />
        {geo.limbs.map((l, i) => (
          <path key={i} d={l.d} fill={woodWash} />
        ))}
      </Watercolour>
      <DrawPath d={geo.trunkD} progress={inkTrunk} width={line} />
      {geo.limbs.map((l, i) => (
        <DrawPath key={i} d={l.d} progress={seg(inkLimbs, (i % 4) * 0.12, 0.64 + (i % 4) * 0.12)} width={line * 0.8} />
      ))}
      {grain.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={JOURNAL_INK} strokeOpacity={0.55 * inkTrunk} strokeWidth={line * 0.6} strokeLinecap="round" />
      ))}
      {strands(geo.front, false)}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ pot

/** Outer outline of the cut-away pot, local coords: (0, 0) = centre of the soil surface. Rim at y −16, base at y 208. */
const POT_OUTER =
  "M-150,-16 L150,-16 Q157,-16 156,-9 L153,11 Q152,18 145,18 L132,18 L105,200 Q103,208 95,208 L-95,208 Q-103,208 -105,200 L-132,18 L-145,18 Q-152,18 -153,11 L-156,-9 Q-157,-16 -150,-16 Z";
const SOIL = "M-128,4 C-90,-8 -40,-4 0,-7 C42,-10 90,-6 128,4 L106,194 L-106,194 Z";
const SOIL_TOP = "M-128,4 C-90,-8 -40,-4 0,-7 C42,-10 90,-6 128,4";
const STIPPLE = (() => {
  const r = rng(907);
  const out: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 70; i++) {
    const y = 10 + r() * 178;
    const half = 124 - (y / 194) * 20;
    out.push({ x: (r() * 2 - 1) * half * 0.92, y, r: 1.6 + r() * 2.4 });
  }
  return out;
})();
const PEBBLES = [
  [-62, 70, 9, 6],
  [48, 120, 11, 7],
  [-20, 160, 8, 5],
  [86, 46, 7, 5],
] as const;

/**
 * A clay pot drawn cut-away, so the soil inside shows. (x, y) = centre of the soil surface.
 * `potWash` and `soilWash` brush the colours in separately; `soilGlow` brightens the soil (when it's named).
 */
export const InkPot: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly ink?: number;
  readonly potWash?: number;
  readonly soilWash?: number;
  readonly full?: number;
  readonly soilGlow?: number;
}> = ({ x, y, scale = 1, ink = 1, potWash = 1, soilWash = 1, full = 0, soilGlow = 0 }) => {
  if (ink <= 0) return null;
  const inkOuter = seg(ink, 0, 0.55);
  const inkInner = seg(ink, 0.35, 0.75);
  const inkSoil = seg(ink, 0.55, 1);
  const soilCol = mix(washColour(C.soilLight, full), C.amberLight, 0.6 * clamp01(soilGlow));
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* hatched shadow on the ground */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M${-120 + i * 34},${222} l26,-12`}
          stroke={JOURNAL_INK}
          strokeOpacity={0.45}
          strokeWidth={2.4}
          strokeLinecap="round"
          opacity={seg(ink, 0.7 + i * 0.03, 0.85 + i * 0.03)}
        />
      ))}
      <Watercolour seed={13} strength={6} opacity={clamp01(potWash) * (0.85 + 0.15 * full)}>
        <path d={POT_OUTER} fill={washColour(C.terracotta, full)} />
        <path d="M-150,-16 L150,-16 L153,11 L-153,11 Z" fill={washColour(C.terracottaDeep, full)} opacity={0.5} />
      </Watercolour>
      <Watercolour seed={17} strength={6} opacity={clamp01(soilWash) * (0.88 + 0.12 * full)}>
        <path d={SOIL} fill={soilCol} />
        <path d="M-118,120 L118,120 L106,194 L-106,194 Z" fill={washColour(C.soil, full)} opacity={0.55} />
      </Watercolour>
      <DrawPath d={POT_OUTER} progress={inkOuter} width={3.4} />
      <DrawPath d="M-132,18 L132,18" progress={inkInner} width={2.6} />
      <DrawPath d="M-126,6 L-106,194 L106,194 L126,6" progress={inkInner} width={2.2} opacity={0.8} />
      <DrawPath d={SOIL_TOP} progress={inkSoil} width={2.6} />
      {STIPPLE.map((s, i) => (i / STIPPLE.length < inkSoil ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={JOURNAL_INK} opacity={0.45} /> : null))}
      {PEBBLES.map(([px, py, rx, ry], i) =>
        inkSoil > 0.5 ? <ellipse key={i} cx={px} cy={py} rx={rx} ry={ry} fill={washColour(C.creamDeep, full)} stroke={JOURNAL_INK} strokeWidth={1.8} opacity={seg(inkSoil, 0.5, 1)} /> : null,
      )}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ balance

/** A heap of soil (for a balance pan). (x, y) = middle of its base. */
export const SoilHeap: React.FC<{ readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly wash?: number; readonly full?: number; readonly opacity?: number }> = ({
  x,
  y,
  w = 150,
  h = 62,
  wash = 1,
  full = 0,
  opacity = 1,
}) => {
  if (opacity <= 0) return null;
  const d = `M${-w / 2},0 C${-w * 0.42},${-h * 0.6} ${-w * 0.2},${-h} 0,${-h} C${w * 0.22},${-h} ${w * 0.44},${-h * 0.55} ${w / 2},0 Z`;
  const r = rng(311);
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <Watercolour seed={23} strength={5} opacity={clamp01(wash)}>
        <path d={d} fill={washColour(C.soilLight, full)} />
      </Watercolour>
      <path d={d} fill="none" stroke={JOURNAL_INK} strokeWidth={2.6} strokeLinejoin="round" />
      {Array.from({ length: 16 }, (_, i) => {
        const px = (r() * 2 - 1) * w * 0.34;
        const py = -r() * h * 0.7 * (1 - Math.abs(px) / (w * 0.5)) - 6;
        return <circle key={i} cx={px} cy={py} r={1.6 + r() * 2} fill={JOURNAL_INK} opacity={0.5} />;
      })}
    </g>
  );
};

/** A brass weight (cylinder with a knob). (x, y) = middle of its base; `drop` 0..1 lowers it onto its spot. */
export const BrassWeight: React.FC<{ readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly drop?: number; readonly wash?: number; readonly full?: number }> = ({
  x,
  y,
  w = 46,
  h = 38,
  drop = 1,
  wash = 1,
  full = 0,
}) => {
  if (drop <= 0) return null;
  const dy = -(1 - EASE.out(clamp01(drop))) * 70;
  const body = `M${-w / 2},${-h} L${-w / 2},-4 Q${-w / 2},0 ${-w / 2 + 4},0 L${w / 2 - 4},0 Q${w / 2},0 ${w / 2},-4 L${w / 2},${-h} Z`;
  return (
    <g transform={`translate(${x} ${y + dy})`} opacity={Math.min(1, drop * 3)}>
      <Watercolour seed={29} strength={3} opacity={clamp01(wash)}>
        <path d={body} fill={washColour(C.amber, full)} />
        <ellipse cx={0} cy={-h} rx={w / 2} ry={w * 0.16} fill={washColour(C.amberLight, full)} />
        <rect x={-w * 0.12} y={-h - w * 0.36} width={w * 0.24} height={w * 0.3} rx={w * 0.08} fill={washColour(C.amber, full)} />
        <circle cx={0} cy={-h - w * 0.38} r={w * 0.15} fill={washColour(C.amberDeep, full)} />
      </Watercolour>
      <path d={body} fill="none" stroke={JOURNAL_INK} strokeWidth={2.4} strokeLinejoin="round" />
      <ellipse cx={0} cy={-h} rx={w / 2} ry={w * 0.16} fill="none" stroke={JOURNAL_INK} strokeWidth={2.2} />
      <rect x={-w * 0.12} y={-h - w * 0.36} width={w * 0.24} height={w * 0.3} rx={w * 0.08} fill="none" stroke={JOURNAL_INK} strokeWidth={2} />
      <circle cx={0} cy={-h - w * 0.38} r={w * 0.15} fill="none" stroke={JOURNAL_INK} strokeWidth={2} />
      <path d={`M${-w / 2 + 6},${-h + 8} L${-w / 2 + 6},-6`} stroke={JOURNAL_INK} strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
};

export type BalanceLayout = { readonly cx: number; readonly baseY: number; readonly pivotY: number; readonly arm: number; readonly hang: number; readonly panW: number };

/** Where the load on each pan sits (centre of the pan's floor) for a beam tilt in degrees (+ = left side down). */
export const balancePans = (b: BalanceLayout, tilt: number): { left: Pt; right: Pt } => {
  const t = (tilt * Math.PI) / 180;
  const lx = b.cx - b.arm * Math.cos(t);
  const ly = b.pivotY + b.arm * Math.sin(t);
  const rx = b.cx + b.arm * Math.cos(t);
  const ry = b.pivotY - b.arm * Math.sin(t);
  return { left: [lx, ly + b.hang + 8], right: [rx, ry + b.hang + 8] };
};

/**
 * An old equal-arm balance: a wooden foot, a brass post, a beam with a pointer that stands upright
 * when the two pans balance, and two pans hanging on chains. `left` / `right` are drawn on the pans
 * (their (0, 0) is the middle of the pan's floor).
 */
export const OldBalance: React.FC<{
  readonly b: BalanceLayout;
  readonly tilt?: number;
  readonly ink?: number;
  readonly wash?: number;
  readonly full?: number;
  readonly left?: React.ReactNode;
  readonly right?: React.ReactNode;
  readonly opacity?: number;
}> = ({ b, tilt = 0, ink = 1, wash = 1, full = 0, left, right, opacity = 1 }) => {
  if (ink <= 0 || opacity <= 0) return null;
  const { cx, baseY, pivotY, arm, hang, panW } = b;
  const brass = washColour(C.amber, full);
  const wood = washColour(W2.woodDeep, full);
  const t = (tilt * Math.PI) / 180;
  const ends: Pt[] = [
    [cx - arm * Math.cos(t), pivotY + arm * Math.sin(t)],
    [cx + arm * Math.cos(t), pivotY - arm * Math.sin(t)],
  ];
  const foot = `M${cx - 100},${baseY} L${cx - 76},${baseY - 30} L${cx + 76},${baseY - 30} L${cx + 100},${baseY} Z`;
  const post = `M${cx - 9},${baseY - 30} L${cx - 7},${pivotY + 12} L${cx + 7},${pivotY + 12} L${cx + 9},${baseY - 30} Z`;
  const beam = `M${cx - arm},${pivotY - 3} Q${cx},${pivotY - 13} ${cx + arm},${pivotY - 3} L${cx + arm},${pivotY + 5} Q${cx},${pivotY + 13} ${cx - arm},${pivotY + 5} Z`;
  const needle = `M${cx - 4},${pivotY} L${cx},${pivotY - 86} L${cx + 4},${pivotY} Z`;
  const pan = (p: Pt) => `M${p[0] - panW / 2},${p[1] + hang} Q${p[0]},${p[1] + hang + 40} ${p[0] + panW / 2},${p[1] + hang} Z`;
  const iFoot = seg(ink, 0, 0.3);
  const iBeam = seg(ink, 0.2, 0.55);
  const iChains = seg(ink, 0.45, 0.8);
  const iPans = seg(ink, 0.6, 1);
  return (
    <g opacity={opacity}>
      {/* the pointer's little scale: a mark straight above the pivot = balanced */}
      <DrawPath d={`M${cx - 40},${pivotY - 96} Q${cx},${pivotY - 108} ${cx + 40},${pivotY - 96}`} progress={iBeam} width={2.4} />
      <DrawPath d={`M${cx},${pivotY - 112} L${cx},${pivotY - 94}`} progress={iBeam} width={3} />
      <Watercolour seed={31} strength={4} opacity={clamp01(wash) * (0.85 + 0.15 * full)}>
        <path d={foot} fill={wood} />
        <path d={post} fill={brass} />
        <g transform={`rotate(${-tilt} ${cx} ${pivotY})`}>
          <path d={beam} fill={brass} />
          <path d={needle} fill={brass} />
        </g>
        {ends.map((e, i) => (
          <path key={i} d={pan(e)} fill={brass} />
        ))}
      </Watercolour>
      <DrawPath d={foot} progress={iFoot} width={3} />
      <DrawPath d={post} progress={iFoot} width={2.6} />
      <g transform={`rotate(${-tilt} ${cx} ${pivotY})`}>
        <DrawPath d={beam} progress={iBeam} width={3} />
        <DrawPath d={needle} progress={iBeam} width={2.2} />
      </g>
      {iBeam > 0 ? <circle cx={cx} cy={pivotY} r={9} fill={washColour(C.amberDeep, full)} stroke={JOURNAL_INK} strokeWidth={2.6} /> : null}
      {ends.map((e, i) => (
        <g key={i}>
          {iBeam > 0.9 ? <circle cx={e[0]} cy={e[1]} r={5} fill="none" stroke={JOURNAL_INK} strokeWidth={2.4} /> : null}
          <DrawPath d={`M${e[0]},${e[1] + 4} L${e[0] - panW / 2 + 6},${e[1] + hang}`} progress={iChains} width={2} />
          <DrawPath d={`M${e[0]},${e[1] + 4} L${e[0] + panW / 2 - 6},${e[1] + hang}`} progress={iChains} width={2} />
          <DrawPath d={pan(e)} progress={iPans} width={3} />
        </g>
      ))}
      {iPans >= 1 ? (
        <>
          {left ? <g transform={`translate(${ends[0][0]} ${ends[0][1] + hang + 8})`}>{left}</g> : null}
          {right ? <g transform={`translate(${ends[1][0]} ${ends[1][1] + hang + 8})`}>{right}</g> : null}
        </>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------------------------------ watering can

const CAN_BODY = "M-46,-30 Q-46,-38 -38,-38 L36,-38 Q44,-38 45,-30 L48,32 Q48,42 38,42 L-38,42 Q-48,42 -48,32 Z";
const CAN_SPOUT = "M34.9,17.8 L119.1,-47.5 L124.9,-40.5 L45.1,30.2 Z";
const CAN_HANDLE = "M-40,-28 C-98,-40 -100,34 -46,26";
const CAN_TIP: Pt = [122, -44];
const CAN_ROSE: Pt = [CAN_TIP[0] + 0.77 * 15, CAN_TIP[1] - 0.64 * 15];
const SPOUT_ANG = (Math.atan2(-68, 82) * 180) / Math.PI;

/** Where the can's rose is for a can at (x, y), tilted `tilt`° and scaled; `flip` mirrors it (spout to the left). */
export const canRose = (x: number, y: number, tilt: number, scale = 1, flip = false): Pt => {
  // the can is rotated in its own frame, then mirrored (flip), scaled and placed
  const a = (tilt * Math.PI) / 180;
  const lx = CAN_ROSE[0] * Math.cos(a) - CAN_ROSE[1] * Math.sin(a);
  const ly = CAN_ROSE[0] * Math.sin(a) + CAN_ROSE[1] * Math.cos(a);
  return [x + (flip ? -1 : 1) * scale * lx, y + scale * ly];
};

/** A watering can sketched in ink (side view). `flip` puts the spout on the left; `tilt` tips it forward to pour. */
export const InkWateringCan: React.FC<{ readonly x: number; readonly y: number; readonly tilt?: number; readonly scale?: number; readonly flip?: boolean; readonly wash?: number; readonly full?: number; readonly opacity?: number }> = ({
  x,
  y,
  tilt = 0,
  scale = 1,
  flip = false,
  wash = 1,
  full = 0,
  opacity = 1,
}) => {
  if (opacity <= 0) return null;
  const metal = washColour(C.foil, full);
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale}) rotate(${tilt})`}>
      <Watercolour seed={37} strength={4} opacity={clamp01(wash)}>
        <path d={CAN_SPOUT} fill={metal} />
        <path d={CAN_BODY} fill={metal} />
        <g transform={`translate(${CAN_TIP[0]} ${CAN_TIP[1]}) rotate(${SPOUT_ANG})`}>
          <path d="M-2,-8 L13,-16 Q17,-16 17,-12 L17,12 Q17,16 13,16 L-2,8 Z" fill={metal} />
        </g>
      </Watercolour>
      <path d={CAN_HANDLE} fill="none" stroke={JOURNAL_INK} strokeWidth={4} strokeLinecap="round" />
      <path d={CAN_SPOUT} fill="none" stroke={JOURNAL_INK} strokeWidth={2.6} strokeLinejoin="round" />
      <g transform={`translate(${CAN_TIP[0]} ${CAN_TIP[1]}) rotate(${SPOUT_ANG})`}>
        <path d="M-2,-8 L13,-16 Q17,-16 17,-12 L17,12 Q17,16 13,16 L-2,8 Z" fill="none" stroke={JOURNAL_INK} strokeWidth={2.6} strokeLinejoin="round" />
        {[-8, 0, 8].map((dy) => (
          <circle key={dy} cx={15} cy={dy} r={1.6} fill={JOURNAL_INK} />
        ))}
      </g>
      <path d={CAN_BODY} fill="none" stroke={JOURNAL_INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-46,-26 L45,-26" stroke={JOURNAL_INK} strokeWidth={2} opacity={0.7} />
      {[-30, -14, 2, 18].map((hx) => (
        <path key={hx} d={`M${hx},-18 l14,52`} stroke={JOURNAL_INK} strokeOpacity={0.28} strokeWidth={2} strokeLinecap="round" />
      ))}
    </g>
  );
};

/**
 * Water drops falling from a point onto the soil: one every `every` frames between `start` and `stop`;
 * each falls under gravity, then splashes and soaks in. `from(i)` = where drop i leaves the rose.
 */
export const InkDrops: React.FC<{ readonly f: number; readonly start: number; readonly stop: number; readonly every: number; readonly from: (i: number) => Pt; readonly soilY: number; readonly full?: number }> = ({
  f,
  start,
  stop,
  every,
  from,
  soilY,
  full = 0,
}) => {
  const n = Math.max(0, Math.floor((stop - start) / every));
  const out: React.ReactNode[] = [];
  const water = washColour(C.ice, full);
  for (let i = 0; i < n; i++) {
    const t0 = start + i * every;
    if (f < t0 || f > t0 + 34) continue;
    const [sx, sy] = from(i);
    const fall = 16;
    const p = clamp01((f - t0) / fall);
    const pe = p * p;
    const x = sx - 4 * pe + (i % 3) * 3;
    const y = sy + (soilY - sy) * pe;
    if (f < t0 + fall) {
      const stretch = 1 + pe * 0.5;
      out.push(
        <g key={i} transform={`translate(${x} ${y}) scale(${1 / Math.sqrt(stretch)} ${stretch})`}>
          <path d="M0,-11 C5,-3 7,2 7,5 C7,9 4,11 0,11 C-4,11 -7,9 -7,5 C-7,2 -5,-3 0,-11Z" fill={water} stroke={JOURNAL_INK} strokeWidth={1.6} />
        </g>,
      );
    } else {
      const s = clamp01((f - t0 - fall) / 16);
      out.push(<ellipse key={i} cx={x} cy={soilY + 2} rx={6 + 16 * s} ry={2 + 4 * s} fill="none" stroke={JOURNAL_INK} strokeWidth={2} opacity={0.7 * (1 - s)} />);
    }
  }
  return <g>{out}</g>;
};
