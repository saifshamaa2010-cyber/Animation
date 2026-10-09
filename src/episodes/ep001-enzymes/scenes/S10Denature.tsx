/**
 * S10 · Denaturation. Opens on the pause overlay (hard cut from S09).
 *  1. Reveal: a pen draws the true curve past the peak — it crashes to ~0. The right guess gets a ✓, the
 *     wrong one fades, and the sample's dot lands on the floor at 70 °C. Cooled back to 37 °C, the dot
 *     slides along the floor: an arrow back up to the peak is crossed out. It doesn't recover.
 *  2. Why: one enzyme, close up, tagged "before heating" (so it can't be mistaken for a recovery).
 *     Weak bonds hold its folds together → heat makes it shake violently → the bonds break, slowly at first,
 *     then faster → the chain unravels → the active site loses its shape → a starch chain bumps the
 *     collapsed lip and bounces off. "denatured".
 *  3. Same kind of change as egg white setting in a hot pan; cooling fixes neither.
 *  4. Cold is different: a FRESH sample in the lens at 37 °C is cooled to 10 °C. The molecules slow down,
 *     the dot slides down the left side of the curve (low, but not on the floor), collisions get rarer — but
 *     one still lands in an intact active site. Warm it up and the dot climbs straight back to the peak.
 * The thermometer on the left stays the spine of the whole sequence.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, EASE, H } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Thermometer } from "../../../components/Thermometer";
import { PausePredict } from "../../../components/PausePredict";
import { Enzyme } from "../../../components/Enzyme";
import { SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label, Keyword } from "../../../components/Label";
import { HandArrow, HandCross, HandTick } from "../../../components/kit/hand";
import { FocusPull } from "../../../components/kit/Depth";
import { useSvgId } from "../../../components/ids";
import { ENZYME_DENATURED, ENZYME_RADII, ENZYME_REST, foldedChain, unfoldedChain } from "../../../components/molecule-geometry";
import { Pt, lerp, lerpPts, rng, roundedPolygon, smoothClosedPath, smoothOpenPath } from "../../../lib/geometry";
import { jitter, thermalAmplitude } from "../../../lib/motion";
import { track } from "../../../lib/track";
import { moveRings } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s10Timing } from "./S10Denature.timing";
import { enzymePose, jig } from "./S08-S10-arc";
import {
  AmbientTemp,
  LENS,
  Lens,
  Population,
  THERMO,
  TempGraph,
  gx,
  gy,
  lensCam,
  lensFocus,
  recentSnips,
  span,
  tempAt,
  worldToScreen,
  worldTransform,
} from "./S08-S10-shared";
import { OptimumNote } from "./S08Temperature";
import { S09_QUESTION } from "./S09Predict";

// ------------------------------------------------------------------ the hero enzyme (close-up)
const HERO_SEED = 7; // the same enzyme (same folded chain) as the S04/S05 hero
const FOLDED = foldedChain(HERO_SEED * 97 + 11);
const STRETCHED = unfoldedChain(FOLDED.length);
/**
 * Weak bonds: pairs of points on neighbouring folds of the chain (close in space, far apart along
 * the chain), spread evenly over the globule. (Local version: the shared weakBonds() helper's
 * distance window misses this chain's strand spacing.)
 */
const WB: [number, number][] = (() => {
  const n = FOLDED.length;
  const cands: { i: number; j: number; m: Pt }[] = [];
  for (let i = 0; i < n; i += 2) {
    let best: { j: number; d: number } | null = null;
    for (let j = 0; j < n; j++) {
      const sep = Math.min(Math.abs(i - j), n - Math.abs(i - j));
      if (sep < 18) continue;
      const d = Math.hypot(FOLDED[i][0] - FOLDED[j][0], FOLDED[i][1] - FOLDED[j][1]);
      if (d > 10 && d < 38 && (!best || d < best.d)) best = { j, d };
    }
    if (best) cands.push({ i, j: best.j, m: [(FOLDED[i][0] + FOLDED[best.j][0]) / 2, (FOLDED[i][1] + FOLDED[best.j][1]) / 2] });
  }
  const out: { i: number; j: number; m: Pt }[] = [];
  for (const c of cands) if (out.every((o) => Math.hypot(o.m[0] - c.m[0], o.m[1] - c.m[1]) > 34)) out.push(c);
  return out.map((c) => [c.i, c.j] as [number, number]);
})();
/** The bond the "weak bonds" label points at: one near the upper right of the globule. */
const LABEL_BOND = WB.reduce((best, [a, b], i) => {
  const score = (FOLDED[a][0] + FOLDED[b][0]) * 0.5 - (FOLDED[a][1] + FOLDED[b][1]) * 0.8;
  const [ba, bb] = WB[best];
  const bs = (FOLDED[ba][0] + FOLDED[bb][0]) * 0.5 - (FOLDED[ba][1] + FOLDED[bb][1]) * 0.8;
  return score > bs ? i : best;
}, 0);
/** Bonds break in a shuffled order (deterministic). */
const BOND_ORDER: number[] = (() => {
  const r = rng(2024);
  const idx = WB.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const rank: number[] = [];
  idx.forEach((b, k) => (rank[b] = k));
  return rank;
})();
/** The Enzyme component's own (tiny) jiggle when given temperature 0 — replicated so overlays line up. */
const BASE_AMP = thermalAmplitude(0);
const heroJitter = (frame: number) => jitter(HERO_SEED, frame, BASE_AMP, 0.025 + BASE_AMP * 0.002);

/** Same chain maths as components/Enzyme.tsx, so bonds drawn on top sit exactly on the chain. */
const chainNow = (frame: number, denature: number, unfold: number): Pt[] =>
  FOLDED.map((p, i) => {
    const stagger = Math.min(1, Math.max(0, unfold * 1.6 - (i / FOLDED.length) * 0.6));
    const n = noise2D(`loop${HERO_SEED}`, i * 0.045, frame * 0.03);
    const push = denature * Math.max(0, n) * 0.55;
    const lx = p[0] + (p[0] - 20) * push;
    const ly = p[1] + p[1] * push;
    return [lerp(lx, STRETCHED[i][0], stagger), lerp(ly, STRETCHED[i][1], stagger)] as Pt;
  });

type HeroProps = {
  readonly x: number;
  readonly y: number;
  readonly s: number;
  readonly denature: number;
  readonly unfold: number;
  readonly site: number;
  readonly siteColor?: string;
  /** Visibility of the folded chain highlight and of the weak bonds. */
  readonly chainHi: number;
  readonly bonds: number;
  /** Per-bond reveal (0..1) and break progress (0 intact .. 1 gone). */
  readonly bondIn: (k: number) => number;
  readonly bondBreak: (k: number) => number;
  readonly flicker: number;
  readonly rimPulse: number;
  readonly opacity?: number;
};

const HeroEnzyme: React.FC<HeroProps> = ({ x, y, s, denature, unfold, site, siteColor = C.paper, chainHi, bonds, bondIn, bondBreak, flicker, rimPulse, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const id = useSvgId("hero");
  const j = heroJitter(frame);
  const chain = chainNow(frame, denature, unfold);
  const outline = roundedPolygon(lerpPts(ENZYME_REST, ENZYME_DENATURED, denature), ENZYME_RADII);
  return (
    <g opacity={opacity}>
      <Enzyme x={x} y={y} scale={s} temperature={0} denature={denature} unfold={unfold} showSite={site} siteColor={siteColor} seed={HERO_SEED} />
      <g transform={`translate(${x + j.dx} ${y + j.dy}) rotate(${j.rot}) scale(${s})`}>
        <defs>
          <filter id={`${id}-g`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <filter id={`${id}-rim`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
        </defs>
        {rimPulse > 0 ? (
          <g opacity={rimPulse}>
            <path d={outline} fill="none" stroke={C.tealLight} strokeWidth={9} opacity={0.5} filter={`url(#${id}-rim)`} />
            <path d={outline} fill="none" stroke={C.tealLight} strokeWidth={2.5} opacity={0.9} />
          </g>
        ) : null}
        {chainHi > 0 ? (
          <path d={smoothOpenPath(chain, 0.9)} fill="none" stroke={C.tealLight} strokeOpacity={0.42 * chainHi} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {bonds > 0
          ? WB.map(([a, b], k) => {
              const vin = bondIn(k);
              const br = bondBreak(k);
              if (vin <= 0 || br >= 1) return null;
              const pa = chain[a];
              const pb = chain[b];
              const mx = (pa[0] + pb[0]) / 2;
              const my = (pa[1] + pb[1]) / 2;
              const fl = 1 - flicker * (0.5 + 0.5 * noise2D(`bf${k}`, frame * 0.6, 0));
              if (br > 0) {
                // snapped: each half whips back to its own strand (a little overshoot), with a coral flash
                const r = EASE.snap(br);
                const ea: Pt = [pa[0] + (mx - pa[0]) * (1 - r) * 0.9, pa[1] + (my - pa[1]) * (1 - r) * 0.9];
                const eb: Pt = [pb[0] + (mx - pb[0]) * (1 - r) * 0.9, pb[1] + (my - pb[1]) * (1 - r) * 0.9];
                const fr = 3 + 25 * EASE.out(br);
                return (
                  <g key={k} opacity={(1 - br) * bonds}>
                    <circle cx={mx} cy={my} r={fr} fill={C.coral} opacity={0.18 * (1 - br)} />
                    <circle cx={mx} cy={my} r={fr} fill="none" stroke={C.coral} strokeWidth={2.6 * (1 - br) + 0.6} />
                    <line x1={pa[0]} y1={pa[1]} x2={ea[0]} y2={ea[1]} stroke={C.paper} strokeWidth={2.6} strokeLinecap="round" />
                    <line x1={pb[0]} y1={pb[1]} x2={eb[0]} y2={eb[1]} stroke={C.paper} strokeWidth={2.6} strokeLinecap="round" />
                  </g>
                );
              }
              return (
                <g key={k} opacity={vin * bonds * fl}>
                  <line x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={C.paper} strokeWidth={6} opacity={0.35} filter={`url(#${id}-g)`} />
                  <line x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={C.paper} strokeWidth={2.8} strokeDasharray="1 4.2" strokeLinecap="round" />
                </g>
              );
            })
          : null}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ the frying pan (top-down)
const EGG_PTS: Pt[] = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  const r = 132 * (1 + 0.1 * Math.sin(i * 2.3 + 0.7) + 0.07 * Math.cos(i * 3.9 + 1.1));
  return [Math.cos(a) * r * 1.1, Math.sin(a) * r * 0.95] as Pt;
});
const EGG_D = smoothClosedPath(EGG_PTS, 0.55);

const FryingPan: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly cooked: number;
  readonly heat: number;
  readonly frost: number;
  readonly f: number;
  readonly opacity?: number;
}> = ({ x, y, cooked, heat, frost, f, opacity = 1 }) => {
  const id = useSvgId("pan");
  const R = 214;
  const r = 190;
  const hAng = (128 * Math.PI) / 180;
  const hx = Math.cos(hAng);
  const hy = Math.sin(hAng);
  const yolk: Pt = [14, -6];
  return (
    <g opacity={opacity} transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${id}-heat`} cx={0.5} cy={0.5} r={0.5}>
          <stop offset="0" stopColor={C.coral} stopOpacity={0.7} />
          <stop offset="1" stopColor={C.coralDeep} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={C.ink500} />
          <stop offset="1" stopColor={C.ink700} />
        </linearGradient>
        <radialGradient id={`${id}-base`} cx={0.42} cy={0.38} r={0.75}>
          <stop offset="0" stopColor={C.ink700} />
          <stop offset="1" stopColor={C.ink900} />
        </radialGradient>
        <linearGradient id={`${id}-hl`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.5} />
          <stop offset="0.45" stopColor={C.paper} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-cook`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.98} />
          <stop offset="1" stopColor={C.paperDim} />
        </linearGradient>
        <radialGradient id={`${id}-mg`} gradientUnits="userSpaceOnUse" cx={yolk[0]} cy={yolk[1]} r={200}>
          <stop offset={Math.max(0, 1 - cooked * 1.25)} stopColor="#000" />
          <stop offset={Math.min(1, Math.max(0.001, 1 - cooked * 1.25 + 0.22))} stopColor="#FFF" />
        </radialGradient>
        <mask id={`${id}-m`}>
          <rect x={-300} y={-300} width={600} height={600} fill={`url(#${id}-mg)`} />
        </mask>
        <filter id={`${id}-b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={26} />
        </filter>
        <filter id={`${id}-s`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <clipPath id={`${id}-in`}>
          <circle r={r} />
        </clipPath>
        <filter id={`${id}-haze`} x="-100%" y="-50%" width="300%" height="200%">
          <feGaussianBlur stdDeviation={3.5} />
        </filter>
      </defs>
      {/* heat underneath */}
      {heat > 0 ? <circle r={R + 70} fill={`url(#${id}-heat)`} opacity={heat} /> : null}
      {/* contact shadow */}
      <circle cy={16} r={R} fill={C.ink950} opacity={0.5} filter={`url(#${id}-b)`} />
      {/* handle */}
      <g>
        <line x1={hx * (R - 10)} y1={hy * (R - 10)} x2={hx * (R + 250)} y2={hy * (R + 250)} stroke={C.ink700} strokeWidth={42} strokeLinecap="round" />
        <line x1={hx * (R - 10)} y1={hy * (R - 10)} x2={hx * (R + 250)} y2={hy * (R + 250)} stroke={C.ink600} strokeWidth={34} strokeLinecap="round" />
        <line x1={hx * (R + 20) + 6} y1={hy * (R + 20) - 8} x2={hx * (R + 236) + 6} y2={hy * (R + 236) - 8} stroke={C.ink400} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
      </g>
      {/* pan body */}
      <circle r={R} fill={`url(#${id}-rim)`} />
      <circle r={r} fill={`url(#${id}-base)`} />
      <circle r={r} fill="none" stroke={C.ink950} strokeWidth={6} opacity={0.4} />
      <circle r={R - 4} fill="none" stroke={`url(#${id}-hl)`} strokeWidth={8} />
      {frost > 0 ? <circle r={R - 3} fill="none" stroke={C.ice} strokeWidth={5} opacity={0.7 * frost} /> : null}
      <g clipPath={`url(#${id}-in)`}>
        {/* raw egg white: clear, glossy */}
        <path d={EGG_D} fill={C.paper} opacity={0.1} />
        <path d={EGG_D} fill="none" stroke={C.paper} strokeWidth={2.5} opacity={0.35} />
        <path d="M-96,-62 C-70,-92 -20,-104 22,-98" fill="none" stroke={C.paper} strokeWidth={5} strokeLinecap="round" opacity={0.28 * (1 - cooked)} />
        {/* cooked white: opaque, setting from the outside in */}
        <g mask={`url(#${id}-m)`}>
          <path d={EGG_D} fill={C.ink950} opacity={0.35} transform="translate(0 7)" filter={`url(#${id}-s)`} />
          <path d={EGG_D} fill={`url(#${id}-cook)`} />
          <path d={EGG_D} fill="none" stroke={C.creamDeep} strokeWidth={4} opacity={0.35} />
        </g>
        {/* yolk */}
        <circle cx={yolk[0]} cy={yolk[1] + 6} r={50} fill={C.ink950} opacity={0.25} filter={`url(#${id}-s)`} />
        <circle cx={yolk[0]} cy={yolk[1]} r={48} fill={C.amber} />
        <circle cx={yolk[0]} cy={yolk[1]} r={48} fill="none" stroke={C.amberDeep} strokeWidth={3} opacity={0.6} />
        <ellipse cx={yolk[0] - 15} cy={yolk[1] - 17} rx={15} ry={10} fill={C.amberLight} opacity={0.85} />
      </g>
      {/* heat shimmer rising off the pan */}
      {heat > 0.02
        ? [-90, 10, 105].map((dx, i) => {
            const t = ((f * 0.022 + i * 0.37) % 1 + 1) % 1;
            const y0 = -R - 10 - t * 90;
            const pts: Pt[] = [0, 1, 2, 3].map((q) => [dx + Math.sin(f * 0.08 + q * 1.4 + i) * 9, y0 - q * 22] as Pt);
            return <path key={i} d={smoothOpenPath(pts, 0.6)} fill="none" stroke={C.coral} strokeWidth={7} strokeLinecap="round" opacity={heat * 0.3 * Math.sin(t * Math.PI)} filter={`url(#${id}-haze)`} />;
          })
        : null}
    </g>
  );
};

// ------------------------------------------------------------------ scene
const HERO = { x: 1060, y: 548, s: 1.55 } as const;
/** The enzyme moves aside (right) to make room for the starch chain that no longer fits. */
const HERO_NOFIT_X = 1196;
const HERO_EGG = { x: 1500, y: 520, s: 0.95 } as const;
const PAN = { x: 800, y: 560 } as const;
/** How far short of docked the no-fit chain stops (enzyme units): its leading ring just touches the collapsed lip. */
const NOFIT_SHORT = 160;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** Arrive with some speed (it's a collision), not a gentle landing. */
const hitEase = (t: number) => t * (1.6 - 0.6 * t);

export const S10Denature: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s10Timing(sc);
  const frame = useCurrentFrame();
  const abs = sc.scene.startFrame + f;
  const T = tempAt(abs);
  const out = EASE.out;

  // ---------------- 1. reveal on the graph (same shot as S09)
  const ovLift = 1 - span(f, k.lift, k.lift + 12, EASE.in);
  const fallTo = track(f, [
    [k.penA, 37],
    [k.penMid, 45, EASE.inOut],
    [k.penB, 70, EASE.inOut],
  ]);
  const penO = span(f, k.penA - 2, k.penA + 4) * (1 - span(f, k.penB, k.penB + 8));
  const dotO = span(f, k.penB - 2, k.penB + 6);
  const ghostO = 1 - span(f, k.penB, k.penB + 12);
  const upO = 1 - span(f, k.verdict, k.verdict + 12, EASE.in);
  const tickP = clamp01((f - (k.penB - 4)) / 14);
  const downO = 1 - span(f, k.coolB - 4, k.coolB + 10, EASE.in);
  const floorO = span(f, k.coolA, k.coolA + 8);
  const dotX = f < k.coolA ? 70 : T;
  const arrowP = clamp01((f - k.arrowA) / 14);
  const crossP = clamp01((f - k.crossA) / 12);
  // focus shifts from the crowd (lens + graph) to one enzyme: a rack focus, not a push through the lens
  const p1Out = span(f, k.closeA, k.closeA + 14, EASE.in);
  const cam = lensCam(1);
  const lensDen = span(f, k.penA + 6, k.penB + 6, EASE.inOut);

  // ---------------- 2. close-up: one enzyme, before heating
  const heroIn = span(f, k.heroInA, k.heroInB, EASE.out);
  const heroFocus = 9 * (1 - heroIn);
  const heroGrow = 0.92 + 0.08 * heroIn;
  const unfold = track(f, [
    [k.unravelA - 4, 0],
    [k.unravelB, 0.17, EASE.out],
  ]);
  const denature = track(f, [
    [k.unravelA, 0],
    [k.unravelB, 0.3, EASE.inOut],
    [k.siteA + 4, 0.34],
    [k.siteB, 1, EASE.inOut],
  ]);
  const bondsVis = span(f, k.bondsA - 6, k.bondsA + 6) * (1 - span(f, k.unravelB, k.unravelB + 20));
  const chainHi = span(f, Math.max(k.shape, k.heroInA + 6), Math.max(k.shape, k.heroInA + 6) + 18) * (1 - span(f, k.unravelA + 8, k.unravelA + 26));
  const rimPulse = Math.sin(Math.PI * clamp01((f - Math.max(k.shape, k.heroInA + 4)) / 32)) * 0.9 * heroIn;
  const bondIn = (bk: number) => span(f, k.bondsA + (bk % 10) * 2.2, k.bondsA + (bk % 10) * 2.2 + 8);
  // bonds break slowly at first, then faster and faster
  const popAt = (bk: number) => k.popA + Math.sqrt(BOND_ORDER[bk] / Math.max(1, WB.length - 1)) * (k.popB - k.popA);
  const bondBreak = (bk: number) => clamp01((f - popAt(bk)) / 10);
  const flicker = span(f, k.violentA, k.violentA + 20) * 0.85;
  const site = span(f, k.siteA, k.siteA + 12) * (1 - span(f, k.denWord + 20, k.denWord + 34));
  const siteCol = interpolate3(C.paper, C.coral, span(f, k.siteA + 14, k.siteB));

  // where the hero is: centred; aside for the starch chain; right for the egg; gone for the cold beat
  const slide = span(f, k.slideA, k.slideB, EASE.inOut);
  const toEgg = span(f, k.eggA, k.eggA + 36, EASE.inOut);
  const leave = span(f, k.coldA, k.coldA + 16, EASE.in);
  const hx = lerp(lerp(HERO.x, HERO_NOFIT_X, slide), HERO_EGG.x, toEgg) + 40 * leave;
  const hy = lerp(HERO.y, HERO_EGG.y, toEgg);
  const hs = lerp(HERO.s, HERO_EGG.s, toEgg);
  // thermal jiggle (follows the thermometer) + a violent shake while it's far too hot
  const hj = jig("HERO", abs, 0.8);
  const vibAmp = 11 * span(f, k.violentA, k.violentA + 22) * (1 - 0.6 * span(f, k.popB, k.popB + 40)) * (1 - span(f, k.chillA, k.chillB));
  const vx = noise2D("vibx", f * 0.21, 0) * vibAmp;
  const vy = noise2D("viby", f * 0.21, 3) * vibAmp;
  const vr = noise2D("vibr", f * 0.21, 6) * vibAmp * 0.2;
  const hjx = (hj.dx + vx) * (hs / HERO.s);
  const hjy = (hj.dy + vy) * (hs / HERO.s);
  const hjr = hj.rot * 0.35 + vr;
  const heroJ = heroJitter(frame);
  /** Enzyme-local point → screen, through exactly the transforms the hero is drawn with (labels stay on target). */
  const heroPt = (p: Pt): Pt => {
    const a = (heroJ.rot * Math.PI) / 180;
    const lx = p[0] * hs;
    const ly = p[1] * hs;
    const q0x = hx + heroJ.dx + lx * Math.cos(a) - ly * Math.sin(a);
    const q0y = hy + heroJ.dy + lx * Math.sin(a) + ly * Math.cos(a);
    const dx = (q0x - hx) * heroGrow;
    const dy = (q0y - hy) * heroGrow;
    const b = (hjr * Math.PI) / 180;
    return [hx + dx * Math.cos(b) - dy * Math.sin(b) + hjx, hy + dx * Math.sin(b) + dy * Math.cos(b) + hjy];
  };

  // the starch chain that no longer fits: drifts in, its leading ring hits the collapsed lip, bounces off
  const contactX = -NOFIT_SHORT * hs;
  const sx = track(f, [
    [k.subIn, contactX - 330],
    [k.bounce, contactX, hitEase],
    [k.bounce + 34, contactX - 250, out],
  ]);
  const sy = track(f, [
    [k.subIn, 70],
    [k.bounce, 0, EASE.inOut],
    [k.bounce + 34, 46, out],
  ]);
  const srot = track(f, [
    [k.bounce, 0],
    [k.bounce + 34, -9, out],
  ]);
  const sj = jig("NOFIT", abs, 0.9);
  // it meets the enzyme where the enzyme actually is (which is shaking)
  const stick = Math.max(0, 1 - Math.abs(f - k.bounce) / 12);
  const noFitChain = dockedChain(4, hx, hy, hs, { wave: 1.2 * Math.sin(f * 0.09) });
  const noFitRings = moveRings(noFitChain.rings, sx + sj.dx * (1 - stick) + hjx * stick, sy + sj.dy * (1 - stick) + hjy * stick, srot);
  const noFitO = span(f, k.subIn, k.subIn + 14) * (1 - span(f, k.bounce + 18, k.bounce + 44));
  const contactPt = heroPt([-176, 2]);
  const bumpP = clamp01((f - k.bounce) / 16);
  const xP = clamp01((f - k.bounce - 2) / 14);

  // ---------------- 3. egg
  const panIn = span(f, k.eggA + 16, k.eggA + 48, EASE.out); // after the enzyme has moved aside
  const panOut = span(f, k.coldA, k.coldA + 16, EASE.in);
  const panX = PAN.x - 260 * (1 - panIn) - 50 * panOut;
  const cooked = span(f, k.setA, k.setB, EASE.inOut);
  const heat = span(f, k.eggA + 22, k.eggA + 52) * (1 - span(f, k.chillA, k.chillB));

  // ---------------- 4. cold is different: a FRESH sample, cooled. Slower, never broken.
  const back = span(f, k.backA, k.backB, EASE.out);
  const backFocus = 8 * (1 - back);
  const showBack = f > k.backA - 1;
  // "isn't denatured": lean in on enzyme 0 — its active site is intact and a substrate still fits
  const lean = span(f, k.notDen - 6, k.notDen + 18, EASE.inOut) * (1 - span(f, k.rewarmA - 4, k.rewarmA + 22, EASE.inOut));
  const e0At = enzymePose(0, sc.scene.startFrame + k.notDen);
  const camB = lensFocus(cam, [e0At.x - 110, e0At.y + 10], lean, 1.7);
  const e0 = enzymePose(0, abs);
  const e0j = jig("E0", abs, 0.9);
  const e0s = worldToScreen(camB, [e0.x + e0j.dx + 20, e0.y + e0j.dy - 112]);
  const notDenP = span(f, k.notDen, k.notDen + 20);
  const notDenO = 1 - span(f, k.rewarmA + 8, k.rewarmA + 20);
  const siteBack = span(f, k.notDen - 4, k.notDen + 10) * notDenO;

  // ---------------- labels (screen space)
  const beforeAnchor = heroPt([-70, -168]);
  const bondAnchor = (() => {
    const ch = chainNow(frame, 0, 0);
    const [a, b] = WB[LABEL_BOND];
    return heroPt([(ch[a][0] + ch[b][0]) / 2, (ch[a][1] + ch[b][1]) / 2]);
  })();
  const lipTop = heroPt([-150, -36]);
  const heroTop = heroPt([40, -190]);
  const eggEdge: Pt = [panX - 120, PAN.y - 70];

  return (
    <Stage bg={{ lightX: 0.5, temperature: T }}>
      <AmbientTemp T={T} />

      {/* 1 · the reveal: lens + graph (same layout as S08/S09) */}
      {p1Out < 1 ? (
        <FocusPull blur={10 * p1Out} opacity={1 - p1Out} dim={0.3}>
          <Lens cam={cam} frame={1}>
            <g transform={worldTransform(cam)}>
              <Population abs={abs} denature={lensDen} lod={lensDen > 0 ? "high" : "low"} />
            </g>
          </Lens>
          <TempGraph
            f={abs}
            axes={1}
            axisTo={70}
            ticks={[
              { v: 0, o: 1 },
              { v: 20, o: 1 },
              { v: 37, o: 1, hi: span(f, k.coolB - 6, k.coolB + 6) },
              { v: 50, o: 1 },
              { v: 60, o: 1 },
              { v: 70, o: 1 },
            ]}
            riseTo={37}
            fallTo={fallTo}
            dot={{ x: dotX, y: 0, o: dotO, hot: 1 }}
            ghost={{ x: 37, o: ghostO }}
            pen={{ x: fallTo, o: penO }}
            pointer={{ x: T, o: 1 }}
            guide={1}
            guesses={{ up: 1, down: 1, o: 1, upO, downO, tick: tickP }}
            floor={{ from: 70, to: dotX, o: floorO }}
          />
          <OptimumNote main={1} approx={1} body={0} circle={0} />
          {/* "doesn't recover": the rate can't climb back up to the peak */}
          {arrowP > 0 ? (
            <g>
              <HandArrow from={[gx(37) - 4, gy(0) - 34]} to={[gx(37) - 4, gy(1) + 50]} bend={-0.12} progress={arrowP} color={C.paper} width={5} seed={11} opacity={0.9} />
              <HandCross cx={gx(37) - 26} cy={(gy(0) + gy(1)) / 2 + 14} size={64} progress={crossP} seed={5} />
            </g>
          ) : null}
        </FocusPull>
      ) : null}

      {/* 2 · close-up: one enzyme, before heating */}
      {heroIn > 0 && leave < 1 ? (
        <FocusPull blur={heroFocus + 9 * leave} opacity={1 - leave} dim={0.2}>
          {noFitO > 0 ? (
            <g opacity={noFitO}>
              <SugarChain rings={noFitRings} links={noFitChain.links} />
            </g>
          ) : null}
          <g transform={`translate(${hjx} ${hjy}) rotate(${hjr} ${hx} ${hy}) translate(${hx} ${hy}) scale(${heroGrow}) translate(${-hx} ${-hy})`} opacity={heroIn}>
            <HeroEnzyme
              x={hx}
              y={hy}
              s={hs}
              denature={denature}
              unfold={unfold}
              site={site}
              siteColor={siteCol}
              chainHi={chainHi}
              bonds={bondsVis}
              bondIn={bondIn}
              bondBreak={bondBreak}
              flicker={flicker}
              rimPulse={rimPulse}
            />
          </g>
          {/* the bump at the collapsed lip */}
          {bumpP > 0 && bumpP < 1 ? (
            <circle cx={contactPt[0]} cy={contactPt[1]} r={14 + 52 * EASE.out(bumpP)} fill="none" stroke={C.paper} strokeWidth={5 * (1 - bumpP)} opacity={0.8 * (1 - bumpP)} />
          ) : null}
        </FocusPull>
      ) : null}

      {/* 3 · egg */}
      {panIn > 0 && panOut < 1 ? (
        <FocusPull blur={9 * panOut} dim={0.2}>
          <FryingPan x={panX} y={PAN.y} cooked={cooked} heat={heat} frost={0} f={f} opacity={panIn * (1 - panOut)} />
        </FocusPull>
      ) : null}

      {/* 4 · cold: a fresh sample, cooled — slow but intact; warm it up and the dot climbs back to the peak */}
      {showBack ? (
        <FocusPull blur={backFocus} opacity={back} dim={0.2}>
          <Lens cam={camB} frame={1}>
            <g transform={worldTransform(camB)}>
              <Population abs={abs} heroSite={siteBack} lod="low" />
            </g>
          </Lens>
          <TempGraph
            f={abs}
            axes={1}
            axisTo={70}
            ticks={[
              { v: 0, o: 1 },
              { v: 20, o: 1 },
              { v: 37, o: 1, hi: span(f, k.rewarmB - 8, k.rewarmB + 4) },
              { v: 50, o: 1 },
              { v: 60, o: 1 },
              { v: 70, o: 1 },
            ]}
            riseTo={37}
            fallTo={70}
            dot={{ x: T, o: 1, pulses: recentSnips(abs) }}
            pointer={{ x: T, o: 1 }}
            guide={1}
          />
        </FocusPull>
      ) : null}

      {/* thermometer: the spine of the whole sequence */}
      <Thermometer x={THERMO.x} y={THERMO.y} height={THERMO.h} temperature={T} />

      {/* ---------------- annotations */}
      <Label
        anchor={beforeAnchor}
        at={[beforeAnchor[0] - 110, beforeAnchor[1] - 104]}
        text="before heating"
        align="end"
        color={C.paper}
        progress={span(f, k.heroInA + 8, k.heroInA + 28)}
        opacity={1 - span(f, k.heatA - 2, k.heatA + 10)}
      />
      <Label
        anchor={bondAnchor}
        at={[bondAnchor[0] + 150, bondAnchor[1] - 150]}
        text="weak bonds"
        color={C.paper}
        progress={span(f, k.bondsA + 2, k.bondsA + 24)}
        opacity={1 - span(f, k.violentA + 10, k.violentA + 24)}
      />
      <Label
        anchor={lipTop}
        at={[lipTop[0] - 70, lipTop[1] - 190]}
        text="active site"
        align="end"
        color={interpolate3(C.paper, C.coral, span(f, k.siteA + 14, k.siteB))}
        progress={span(f, k.active - 2, k.active + 20)}
        opacity={1 - span(f, k.bounce - 16, k.bounce - 4)}
      />
      {xP > 0 && f < k.eggA ? (
        <HandCross cx={contactPt[0] - 8} cy={contactPt[1] + 4} size={70} progress={xP} seed={9} opacity={1 - span(f, k.denWord - 6, k.denWord + 8)} />
      ) : null}
      <Label
        anchor={heroTop}
        at={[heroTop[0] - 150, heroTop[1] - 110]}
        text="denatured"
        align="end"
        color={C.coral}
        size={56}
        progress={span(f, k.denWord - 2, k.denWord + 20)}
        opacity={1 - span(f, k.coldA - 4, k.coldA + 6)}
      />
      {panIn > 0 ? (
        <Label
          anchor={eggEdge}
          at={[eggEdge[0] - 40, 250]}
          text="egg white"
          sub="a protein"
          size={60}
          align="end"
          progress={span(f, k.white - 4, k.white + 18)}
          opacity={(1 - span(f, k.chillA - 6, k.chillA + 8)) * (1 - panOut)}
        />
      ) : null}
      <Keyword x={(PAN.x + HERO_EGG.x) / 2 + 40} y={H - 116} text="cooling won't fix it" size={56} progress={span(f, k.fix - 6, k.fix + 8) * (1 - span(f, k.coldA - 4, k.coldA + 6))} />
      {showBack ? (
        <>
          <text
            x={LENS.cx}
            y={LENS.cy - LENS.r - 34}
            textAnchor="middle"
            fontFamily={FONT}
            fontWeight={600}
            fontSize={44}
            fill={C.tealLight}
            opacity={span(f, k.backA + 8, k.backA + 24) * (1 - span(f, k.lessKE - 12, k.lessKE))}
          >
            a fresh sample
          </text>
          <Keyword x={960} y={H - 112} text="less kinetic energy" size={60} progress={span(f, k.lessKE - 2, k.lessKE + 12) * (1 - span(f, k.isnt - 14, k.isnt - 2))} />
          <Label anchor={e0s} at={[e0s[0] + 90, 206]} text="not denatured" color={C.tealLight} progress={notDenP} opacity={notDenO} />
          <HandTick cx={gx(37) + 62} cy={gy(1) - 34} size={64} progress={clamp01((f - k.tick) / 14)} />
        </>
      ) : null}

      {/* the pause overlay lifts (continuity with S09's last frame) */}
      {ovLift > 0 ? <PausePredict visible={ovLift} countdown={1} question={S09_QUESTION} /> : null}
    </Stage>
  );
};

/** Blend two token colours. */
const interpolate3 = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = Math.max(0, Math.min(1, t));
  const m = (sh: number) => Math.round(((pa >> sh) & 255) + ((((pb >> sh) & 255) - ((pa >> sh) & 255)) * c));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
};
