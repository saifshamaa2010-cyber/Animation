/**
 * Shared layout + building blocks for the temperature arc (S08 temperature → S09 predict → S10 denature).
 * One layout for all three scenes: thermometer (left) · molecules in a lens (middle) · rate graph (right),
 * so the sequence plays like one continuous shot.
 */
import React from "react";
import { interpolate } from "remotion";
import { C, EASE, H, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Enzyme } from "../../../components/Enzyme";
import { Link, Ring, SugarChain } from "../../../components/SugarChain";
import { heatColor } from "../../../components/Thermometer";
import { rateVsTemperature } from "../../../components/Graph";
import { useSvgId } from "../../../components/ids";
import { Pt, smoothOpenPath } from "../../../lib/geometry";
import { textWidth } from "../../../components/kit/text";
import { WaterMolecule } from "../../../components/Background";
import {
  BOUNCES,
  DOCKS,
  ENZ,
  MOL_S,
  SUB,
  WATER,
  WORLD_C,
  waterPose,
  enzymePose,
  enzymeSettle,
  flashes,
  jig,
  productState,
  substrateState,
  tempAt,
} from "./S08-S10-arc";

// ------------------------------------------------------------------ layout
export const THERMO = { x: 212, y: 252, h: 520 } as const;
export const LENS = { cx: 688, cy: 560, r: 292, zoom: 0.5 } as const;
export const G = { x: 1104, y: 300, w: 616, h: 460, d0: 0, d1: 70 } as const;
export const gx = (v: number) => G.x + ((v - G.d0) / (G.d1 - G.d0)) * G.w;
export const gy = (r: number) => G.y + G.h - r * G.h * 0.86;
export const rate = rateVsTemperature;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ------------------------------------------------------------------ ambient light follows the thermometer
/** A soft wash of light whose colour is the temperature: icy blue when cold, coral when hot. */
export const AmbientTemp: React.FC<{ readonly T: number; readonly cx?: number; readonly cy?: number }> = ({ T, cx = 0.5, cy = 0.44 }) => {
  const id = useSvgId("amb");
  const cold = clamp01((22 - T) / 17) * 0.13;
  const hot = clamp01((T - 38) / 30) * 0.17;
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-c`} cx={cx} cy={cy} r={0.75}>
          <stop offset="0" stopColor={C.ice} stopOpacity={1} />
          <stop offset="1" stopColor={C.ice} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-h`} cx={cx} cy={cy} r={0.75}>
          <stop offset="0" stopColor={C.coral} stopOpacity={1} />
          <stop offset="0.6" stopColor={C.coralDeep} stopOpacity={0.45} />
          <stop offset="1" stopColor={C.coralDeep} stopOpacity={0} />
        </radialGradient>
      </defs>
      {cold > 0.002 ? <rect width={W} height={H} fill={`url(#${id}-c)`} opacity={cold} /> : null}
      {hot > 0.002 ? <rect width={W} height={H} fill={`url(#${id}-h)`} opacity={hot} /> : null}
    </g>
  );
};

// ------------------------------------------------------------------ lens camera
export type LensCam = { cx: number; cy: number; zoom: number; r: number };
/** t = 0: full-frame molecular world. t = 1: the same world, smaller, framed in the lens. */
export const lensCam = (t: number): LensCam => {
  const e = EASE.inOut(clamp01(t));
  const z = Math.exp(Math.log(LENS.zoom) * e);
  return {
    cx: WORLD_C[0] + (LENS.cx - WORLD_C[0]) * e,
    cy: WORLD_C[1] + (LENS.cy - WORLD_C[1]) * e,
    zoom: z,
    // the window closes in a little ahead of the zoom, so it reads as "pulling back to look through a lens"
    r: LENS.r + (1320 - LENS.r) * (1 - EASE.inOut(clamp01(t * 1.15))),
  };
};
export const worldTransform = (c: LensCam) => `translate(${c.cx} ${c.cy}) scale(${c.zoom}) translate(${-WORLD_C[0]} ${-WORLD_C[1]})`;
export const worldToScreen = (c: LensCam, p: readonly [number, number]): [number, number] => [
  c.cx + (p[0] - WORLD_C[0]) * c.zoom,
  c.cy + (p[1] - WORLD_C[1]) * c.zoom,
];

/** The lens: a circular window onto the molecules (clip + glass rim + inner shade). */
export const Lens: React.FC<{
  readonly cam: LensCam;
  readonly frame: number; // 0..1 how much of the rim/glass is shown
  readonly blur?: number;
  readonly opacity?: number;
  readonly children: React.ReactNode;
}> = ({ cam, frame, blur = 0, opacity = 1, children }) => {
  const id = useSvgId("lens");
  const { cx, cy, r } = cam;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id={`${id}-fill`} cx={0.42} cy={0.36} r={0.7}>
          <stop offset="0" stopColor={C.ink700} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.ink800} stopOpacity={0.15} />
        </radialGradient>
        <radialGradient id={`${id}-vig`} cx={0.5} cy={0.5} r={0.5}>
          <stop offset="0.72" stopColor={C.ink950} stopOpacity={0} />
          <stop offset="1" stopColor={C.ink950} stopOpacity={0.55} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.55} />
          <stop offset="0.5" stopColor={C.paper} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={22} />
        </filter>
        {blur > 0.05 ? (
          <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        ) : null}
      </defs>
      {frame > 0 ? (
        <g opacity={frame}>
          <circle cx={cx} cy={cy + 16} r={r} fill={C.ink950} opacity={0.55} filter={`url(#${id}-sh)`} />
          <circle cx={cx} cy={cy} r={r} fill={C.ink900} opacity={0.9} />
          <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-fill)`} />
        </g>
      ) : null}
      <g clipPath={`url(#${id}-clip)`} filter={blur > 0.05 ? `url(#${id}-blur)` : undefined}>
        {children}
      </g>
      {frame > 0 ? (
        <g opacity={frame}>
          <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-vig)`} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.ink500} strokeWidth={3} />
          <circle cx={cx} cy={cy} r={r - 7} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={5} />
          <circle cx={cx} cy={cy} r={r + 9} fill="none" stroke={C.ink600} strokeWidth={2} opacity={0.6} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------------ the molecules
export type PopulationProps = {
  readonly abs: number;
  /** 0..1 how denatured the enzymes are (S10). */
  readonly denature?: number;
  readonly lod?: "high" | "low";
  /** Highlight the hero enzyme's active site (0..1). */
  readonly heroSite?: number;
};

/** Every enzyme, starch fragment and maltose in the arc, positioned by the arc model (world space). */
export const Population: React.FC<PopulationProps> = ({ abs, denature = 0, lod = "high", heroSite = 0 }) => {
  const ej = ENZ.map((_, i) => jig(`E${i}`, abs, 0.9));
  const ep = ENZ.map((_, i) => enzymePose(i, abs));
  const subs = SUB.map((_, i) => {
    const st = substrateState(i, abs);
    const own = jig(`S${i}`, abs, 1.2);
    const ej2 = ej[st.lockE];
    const j = {
      dx: own.dx + (ej2.dx - own.dx) * st.lock,
      dy: own.dy + (ej2.dy - own.dy) * st.lock,
      rot: own.rot + (ej2.rot - own.rot) * st.lock,
    };
    const cx = st.rings.reduce((a, r) => a + r.x, 0) / st.rings.length;
    const cy = st.rings.reduce((a, r) => a + r.y, 0) / st.rings.length;
    const pivot = st.lock > 0.5 ? [ep[st.lockE].x, ep[st.lockE].y] : [cx, cy];
    const rings: Ring[] = st.rings.map((r) => ({
      x: r.x,
      y: r.y,
      rot: r.rot,
      scale: MOL_S,
      tone: st.sweet > 0.5 ? "sugar" : "starch",
      glow: st.sweet,
    }));
    const links: Link[] = rings.slice(1).map((_, k) =>
      k === st.breakLink ? { a: k, b: k + 1, highlight: st.strain } : { a: k, b: k + 1 },
    );
    return { rings, links, j, pivot, key: i };
  });
  const prods = DOCKS.map((ev) => {
    const p = productState(ev, abs);
    if (!p) return null;
    const j = jig(p.seed, abs, 1.3);
    const rings: Ring[] = p.rings.map((r) => ({ x: r.x, y: r.y, rot: r.rot, scale: MOL_S, tone: "sugar", glow: p.glow }));
    return { rings, j, key: ev.at };
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  const fl = flashes(abs);
  return (
    <g>
      {WATER.map((w, i) => {
        const p = waterPose(i, abs);
        const j = jig(`W${i}`, abs, 2.2);
        return <WaterMolecule key={`w${i}`} x={p.x + j.dx} y={p.y + j.dy} s={w.s * 1.25} rot={p.rot + j.rot * 8} opacity={0.11} />;
      })}
      {prods.map((p) => (
        <g key={`p${p.key}`} transform={`translate(${p.j.dx} ${p.j.dy})`}>
          <SugarChain rings={p.rings} links={[{ a: 0, b: 1 }]} />
        </g>
      ))}
      {subs.map((s) => (
        <g key={`s${s.key}`} transform={`translate(${s.j.dx} ${s.j.dy}) rotate(${s.j.rot} ${s.pivot[0]} ${s.pivot[1]})`}>
          <SugarChain rings={s.rings} links={s.links} />
        </g>
      ))}
      {ENZ.map((_, i) => {
        const p = ep[i];
        const j = ej[i];
        const k = 1 + enzymeSettle(i, abs);
        return (
          <g key={`e${i}`} transform={`translate(${j.dx} ${j.dy}) rotate(${j.rot} ${p.x} ${p.y})`}>
            <g transform={`translate(${p.x} ${p.y}) scale(${k}) translate(${-p.x} ${-p.y})`}>
              <Enzyme x={p.x} y={p.y} scale={MOL_S} rotate={p.rot} still lod={lod} denature={denature} seed={11 + i} showSite={i === 0 ? heroSite : 0} />
            </g>
          </g>
        );
      })}
      {fl.map((x, i) => {
        const e = EASE.out(x.p);
        const col = x.kind === "bump" ? C.paper : x.kind === "dock" ? C.tealLight : C.amberLight;
        const r0 = x.kind === "snip" ? 14 : 10;
        const r1 = (x.kind === "bump" ? 30 + 44 * x.energy : x.kind === "dock" ? 46 : 70) * (MOL_S / 0.55);
        return (
          <g key={`f${i}`} opacity={(1 - x.p) * (x.kind === "bump" ? 0.5 + 0.4 * x.energy : 0.95)}>
            <circle cx={x.x} cy={x.y} r={r0 + (r1 - r0) * e} fill="none" stroke={col} strokeWidth={(x.kind === "bump" ? 3 + 3 * x.energy : 5) * (1 - x.p * 0.6)} />
            {x.kind === "snip"
              ? Array.from({ length: 7 }, (_, q) => {
                  const a = (q / 7) * Math.PI * 2 + 0.4;
                  const ra = 16 + 30 * e;
                  const rb = 26 + 50 * e;
                  return (
                    <line key={q} x1={x.x + Math.cos(a) * ra} y1={x.y + Math.sin(a) * ra} x2={x.x + Math.cos(a) * rb} y2={x.y + Math.sin(a) * rb} stroke={C.amberLight} strokeWidth={4} strokeLinecap="round" />
                  );
                })
              : null}
          </g>
        );
      })}
    </g>
  );
};

/** Frames of recent successful reactions (for the graph's dot to pulse with them). */
export const recentSnips = (abs: number, window = 24) =>
  DOCKS.map((d) => d.at + d.hold).filter((s) => abs >= s && abs < s + window);
export const recentBumps = (abs: number, window = 14) => BOUNCES.map((b) => b.at).filter((s) => abs >= s && abs < s + window);

// ------------------------------------------------------------------ the rate–temperature graph
export type TempGraphProps = {
  /** 0..1: y-axis draws, then x-axis. */
  readonly axes: number;
  /** x-axis drawn up to this temperature (°C). */
  readonly axisTo: number;
  readonly ticks: readonly { readonly v: number; readonly o: number; readonly hi?: number }[];
  /** Teal curve from 0 °C up to `riseTo` (≤ 37). */
  readonly riseTo: number;
  readonly riseFrom?: number;
  readonly riseO?: number;
  /** The true curve beyond the optimum, drawn up to `fallTo`. */
  readonly fallTo?: number;
  readonly fallO?: number;
  /** Marker dot. y defaults to the curve. */
  readonly dot?: { readonly x: number; readonly y?: number; readonly o: number; readonly pulses?: readonly number[]; readonly hot?: number };
  /** Temperature pointer under the x-axis (follows the thermometer). */
  readonly pointer?: { readonly x: number; readonly o: number };
  /** 0..1 dashed guide down from the peak. */
  readonly guide?: number;
  /** Dashed reading line from the axis up (S09: "what's the rate here?"). */
  readonly probe?: { readonly x: number; readonly o: number };
  /** The two predictions past the peak. */
  readonly guesses?: { readonly up: number; readonly down: number; readonly o: number };
  /** S10: cooled back down, the dot slides along the floor. */
  readonly floor?: { readonly from: number; readonly to: number; readonly o: number };
  readonly labels?: number;
  readonly opacity?: number;
  /** Current frame (for pulses). */
  readonly f: number;
};

const curvePts = (from: number, to: number, n = 80): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const v = from + ((to - from) * i) / n;
    return [gx(v), gy(rate(v))] as Pt;
  });

export const TempGraph: React.FC<TempGraphProps> = ({
  axes,
  axisTo,
  ticks,
  riseTo,
  riseFrom = 0,
  riseO = 1,
  fallTo = 37,
  fallO = 1,
  dot,
  pointer,
  guide = 0,
  probe,
  guesses,
  floor,
  labels = 1,
  opacity = 1,
  f,
}) => {
  const id = useSvgId("tg");
  if (opacity <= 0) return null;
  const x0 = G.x;
  const yB = G.y + G.h;
  const yAx = clamp01(axes / 0.42);
  const xAx = clamp01((axes - 0.36) / 0.64);
  const xEnd = gx(axisTo) + 26;
  const riseD = riseTo > riseFrom + 0.05 ? smoothOpenPath(curvePts(riseFrom, Math.min(37, riseTo)), 0.5) : null;
  const fallD = fallTo > 37.05 ? smoothOpenPath(curvePts(37, Math.min(G.d1, fallTo)), 0.5) : null;
  const peak: Pt = [gx(37), gy(1)];
  const guessUpEnd: Pt = [gx(68), gy(1.13)];
  const guessDownEnd: Pt = [gx(68), gy(0.12)];
  const qGlyph = (x: number, y: number, o: number, col: string = C.paper) =>
    o > 0 ? (
      <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={56} fill={col} opacity={o}>
        ?
      </text>
    ) : null;
  const lineTo = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient id={`${id}-fall`} gradientUnits="userSpaceOnUse" x1={gx(38)} y1={0} x2={gx(50)} y2={0}>
          <stop offset="0" stopColor={C.teal} />
          <stop offset="1" stopColor={C.coral} />
        </linearGradient>
        <clipPath id={`${id}-plot`}>
          <rect x={G.x - 30} y={G.y - 60} width={G.w + 120} height={G.h + 64} />
        </clipPath>
      </defs>

      {/* axes */}
      <line x1={x0} y1={yB} x2={x0} y2={yB - (G.h + 10) * yAx} stroke={C.ink300} strokeWidth={4} strokeLinecap="round" />
      {xAx > 0 ? <line x1={x0} y1={yB} x2={x0 + (xEnd - x0) * xAx} y2={yB} stroke={C.ink300} strokeWidth={4} strokeLinecap="round" /> : null}
      {xAx > 0.98 ? (
        <path d={`M${xEnd - 14},${yB - 10} L${xEnd + 2},${yB} L${xEnd - 14},${yB + 10}`} fill="none" stroke={C.ink300} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {yAx > 0.98 ? (
        <path d={`M${x0 - 10},${G.y - 4} L${x0},${G.y - 20} L${x0 + 10},${G.y - 4}`} fill="none" stroke={C.ink300} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      <g opacity={labels * clamp01((axes - 0.7) / 0.3)}>
        <text x={x0 - 30} y={G.y + G.h / 2} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={40} fill={C.ink300} transform={`rotate(-90 ${x0 - 30} ${G.y + G.h / 2})`}>
          rate of reaction
        </text>
        <text x={x0 + G.w / 2} y={yB + 98} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={40} fill={C.ink300}>
          temperature (°C)
        </text>
      </g>
      {ticks.map((t) =>
        t.o > 0 ? (
          <g key={t.v} opacity={t.o}>
            <line x1={gx(t.v)} x2={gx(t.v)} y1={yB} y2={yB + 14} stroke={C.ink300} strokeWidth={3} strokeLinecap="round" />
            <text
              x={gx(t.v)}
              y={yB + 52 - (1 - t.o) * 8}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={t.hi ? 700 : 500}
              fontSize={36}
              fill={t.hi ? interpolateHex(C.ink300, C.amberLight, t.hi) : C.ink300}
            >
              {t.v}
            </text>
          </g>
        ) : null,
      )}

      <g clipPath={`url(#${id}-plot)`}>
        {/* optimum guide */}
        {guide > 0 ? (
          <line x1={peak[0]} y1={peak[1] + 18} x2={peak[0]} y2={peak[1] + 18 + (yB - peak[1] - 18) * EASE.out(guide)} stroke={C.paper} strokeWidth={3} strokeDasharray="8 10" opacity={0.75} />
        ) : null}

        {/* reading line: "what's the rate up here?" */}
        {probe && probe.o > 0 ? (
          <g opacity={probe.o}>
            <line x1={gx(probe.x)} y1={yB - 8} x2={gx(probe.x)} y2={G.y + 30} stroke={heatColor(probe.x)} strokeWidth={3} strokeDasharray="6 10" strokeLinecap="round" />
          </g>
        ) : null}

        {/* predictions */}
        {guesses && guesses.o > 0 ? (
          <g opacity={guesses.o}>
            {guesses.up > 0 ? (
              <>
                <line x1={peak[0]} y1={peak[1]} x2={lineTo(peak, guessUpEnd, EASE.out(guesses.up))[0]} y2={lineTo(peak, guessUpEnd, EASE.out(guesses.up))[1]} stroke={C.paper} strokeWidth={5} strokeDasharray="3 15" strokeLinecap="round" opacity={0.85} />
                {qGlyph(guessUpEnd[0] + 32, guessUpEnd[1] + 18, clamp01((guesses.up - 0.7) / 0.3))}
              </>
            ) : null}
            {guesses.down > 0 ? (
              <>
                <line x1={peak[0]} y1={peak[1]} x2={lineTo(peak, guessDownEnd, EASE.out(guesses.down))[0]} y2={lineTo(peak, guessDownEnd, EASE.out(guesses.down))[1]} stroke={C.paper} strokeWidth={5} strokeDasharray="3 15" strokeLinecap="round" opacity={0.85} />
                {qGlyph(guessDownEnd[0] + 32, guessDownEnd[1] + 18, clamp01((guesses.down - 0.7) / 0.3))}
              </>
            ) : null}
          </g>
        ) : null}

        {/* the curve */}
        {riseD ? (
          <g opacity={riseO}>
            <path d={riseD} fill="none" stroke={C.teal} strokeWidth={15} opacity={0.32} filter={`url(#${id}-glow)`} />
            <path d={riseD} fill="none" stroke={C.teal} strokeWidth={7} strokeLinecap="round" />
          </g>
        ) : null}
        {fallD ? (
          <g opacity={fallO}>
            <path d={fallD} fill="none" stroke={`url(#${id}-fall)`} strokeWidth={15} opacity={0.32} filter={`url(#${id}-glow)`} />
            <path d={fallD} fill="none" stroke={`url(#${id}-fall)`} strokeWidth={7} strokeLinecap="round" />
          </g>
        ) : null}

        {/* cooled back down: the rate stays on the floor */}
        {floor && floor.o > 0 ? (
          <line x1={gx(floor.from)} y1={gy(0) - 2} x2={gx(floor.to)} y2={gy(0) - 2} stroke={C.coral} strokeWidth={5} strokeDasharray="3 13" strokeLinecap="round" opacity={floor.o * 0.9} />
        ) : null}
      </g>

      {/* temperature pointer on the axis */}
      {pointer && pointer.o > 0 ? (
        <g opacity={pointer.o} transform={`translate(${gx(pointer.x)} ${yB + 4})`}>
          <path d="M0,0 L-11,17 Q0,21 11,17 Z" fill={heatColor(pointer.x)} stroke={heatColor(pointer.x)} strokeWidth={3} strokeLinejoin="round" />
        </g>
      ) : null}

      {/* marker dot */}
      {dot && dot.o > 0
        ? (() => {
            const mx = gx(dot.x);
            const my = dot.y !== undefined ? gy(dot.y) : gy(rate(dot.x));
            const col = interpolateHex(C.teal, C.coral, dot.hot ?? 0);
            return (
              <g opacity={dot.o}>
                {(dot.pulses ?? []).map((s) => {
                  const p = clamp01((f - s) / 24);
                  return <circle key={s} cx={mx} cy={my} r={14 + 34 * EASE.out(p)} fill="none" stroke={C.amberLight} strokeWidth={4 * (1 - p)} opacity={1 - p} />;
                })}
                <circle cx={mx} cy={my} r={27} fill={col} opacity={0.25} />
                <circle cx={mx} cy={my} r={13} fill={C.paper} stroke={col} strokeWidth={5} />
              </g>
            );
          })()
        : null}
    </g>
  );
};

/** Blend two token colours (hex). */
export const interpolateHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const m = (s: number) => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * clamp01(t)));
  return `#${((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1)}`;
};

// ------------------------------------------------------------------ "≈" (Lexend's web subset has no ≈ glyph, so we draw it)
export const ApproxText: React.FC<{
  readonly x: number;
  readonly y: number; // baseline
  readonly before?: string;
  readonly after: string;
  readonly size: number;
  readonly color: string;
  readonly weight?: 400 | 500 | 600 | 700;
  readonly anchor?: "start" | "middle" | "end";
  readonly opacity?: number;
}> = ({ x, y, before = "", after, size, color, weight = 600, anchor = "start", opacity = 1 }) => {
  const wb = before ? textWidth(before + " ", size, weight) : 0;
  const wg = size * 0.62;
  const wa = textWidth(" " + after, size, weight);
  const total = wb + wg + wa;
  const x0 = anchor === "start" ? x : anchor === "middle" ? x - total / 2 : x - total;
  const gx0 = x0 + wb + size * 0.04;
  const sw = size * 0.075;
  const tilde = (yy: number) => {
    const a = wg * 0.9;
    const h = size * 0.07;
    return `M${gx0},${yy + h * 0.4} C${gx0 + a * 0.22},${yy - h * 1.6} ${gx0 + a * 0.42},${yy - h * 0.4} ${gx0 + a * 0.5},${yy} S${gx0 + a * 0.78},${yy + h * 1.6} ${gx0 + a},${yy - h * 0.4}`;
  };
  const midY = y - size * 0.3;
  return (
    <g opacity={opacity}>
      {before ? (
        <text x={x0} y={y} fontFamily={FONT} fontWeight={weight} fontSize={size} fill={color} letterSpacing={-0.5}>
          {before}
        </text>
      ) : null}
      <path d={`${tilde(midY - size * 0.11)} ${tilde(midY + size * 0.11)}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <text x={x0 + wb + wg} y={y} fontFamily={FONT} fontWeight={weight} fontSize={size} fill={color} letterSpacing={-0.5} xmlSpace="preserve">
        {" " + after}
      </text>
    </g>
  );
};

/** Gentle 0→1 helper over a frame range with clamping (EASE.out by default). */
export const span = (f: number, a: number, b: number, ease: (t: number) => number = EASE.out) =>
  interpolate(f, [a, Math.max(a + 1, b)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

export { tempAt };
