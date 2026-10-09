/**
 * S10 · Denaturation. Opens on the pause overlay (hard cut from S09).
 *  1. Reveal: the true curve crashes to ~0 by 60 °C while the enzymes in the lens lose their shape.
 *     Cooled back to 37 °C, the dot slides along the floor: the rate doesn't recover.
 *  2. Why: one enzyme, close up. Weak bonds hold its folds together → heat makes it shake violently
 *     → the bonds pop one by one → the chain unravels → the active site loses its shape → a starch
 *     chain can't fit and bounces off. "denatured".
 *  3. Same kind of change as egg white setting in a hot pan; cooling undoes neither.
 *  4. Cold is different: a fresh sample back in the lens at 5 °C — molecules barely move, few collisions,
 *     shapes intact; on the graph the dot sits low on the LEFT of the curve. Warm it up and the dot climbs
 *     straight back to the peak (rhymes with the "can't climb back ✕" after overheating).
 * The thermometer on the left stays the spine of the whole sequence.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, EASE, H } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Thermometer } from "../../../components/Thermometer";
import { PausePredict } from "../../../components/PausePredict";
import { Enzyme } from "../../../components/Enzyme";
import { SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label, Keyword } from "../../../components/Label";
import { Snowflake } from "../../../components/Icons";
import { HandArrow, HandCross, HandTick } from "../../../components/kit/hand";
import { FocusPull } from "../../../components/kit/Depth";
import { useSvgId } from "../../../components/ids";
import { DOCK, ENZYME_DENATURED, ENZYME_RADII, ENZYME_REST, foldedChain, unfoldedChain } from "../../../components/molecule-geometry";
import { Pt, lerp, lerpPts, rng, roundedPolygon, smoothClosedPath, smoothOpenPath } from "../../../lib/geometry";
import { jitter, thermalAmplitude } from "../../../lib/motion";
import { track } from "../../../lib/track";
import { moveRings } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s10Timing } from "./S10Denature.timing";
import { enzymePose, jig } from "./S08-S10-arc";
import { AmbientTemp, LENS, Lens, Population, THERMO, TempGraph, gx, gy, lensCam, rate, recentSnips, span, tempAt, worldToScreen, worldTransform } from "./S08-S10-shared";
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
/** Bonds pop in a shuffled order (deterministic). */
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
  const j = jitter(HERO_SEED, frame, BASE_AMP, 0.025 + BASE_AMP * 0.002);
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
                // snapped: the two halves spring back to their own strands, with a tiny coral flash
                const r = EASE.snap(br);
                const ea: Pt = [pa[0] + (mx - pa[0]) * (1 - r) * 0.9, pa[1] + (my - pa[1]) * (1 - r) * 0.9];
                const eb: Pt = [pb[0] + (mx - pb[0]) * (1 - r) * 0.9, pb[1] + (my - pb[1]) * (1 - r) * 0.9];
                return (
                  <g key={k} opacity={(1 - br) * bonds}>
                    <circle cx={mx} cy={my} r={3 + 13 * r} fill="none" stroke={C.coral} strokeWidth={2.2 * (1 - r) + 0.4} opacity={0.9} />
                    <line x1={pa[0]} y1={pa[1]} x2={ea[0]} y2={ea[1]} stroke={C.amberLight} strokeWidth={2.6} strokeLinecap="round" />
                    <line x1={pb[0]} y1={pb[1]} x2={eb[0]} y2={eb[1]} stroke={C.amberLight} strokeWidth={2.6} strokeLinecap="round" />
                  </g>
                );
              }
              return (
                <g key={k} opacity={vin * bonds * fl}>
                  <line x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={C.amber} strokeWidth={6} opacity={0.55} filter={`url(#${id}-g)`} />
                  <line x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={C.amberLight} strokeWidth={2.8} strokeDasharray="1 4.2" strokeLinecap="round" />
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
const HERO = { x: 1196, y: 548, s: 1.55 } as const;
const HERO_EGG = { x: 1500, y: 520, s: 0.95 } as const;
const PAN = { x: 800, y: 560 } as const;

export const S10Denature: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s10Timing(sc);
  const abs = sc.scene.startFrame + f;
  const T = tempAt(abs);
  const out = EASE.out;

  // ---------------- 1. reveal on the graph (same shot as S09)
  const ovLift = 1 - span(f, k.lift, k.lift + 12, EASE.in);
  const plunge = span(f, k.plungeA, k.plungeB, EASE.inOut);
  const fallTo = 37 + 33 * plunge;
  const cool = span(f, k.coolA, k.coolB, EASE.inOut);
  const dotX = f < k.coolA ? fallTo : T;
  const dotY = f < k.coolA ? rate(fallTo) : 0;
  // push into the lens (scale change: crowd → one molecule); the graph clears out of the way
  const push = span(f, k.closeA, k.closeB, EASE.in);
  const graphO = 1 - span(f, k.closeA, k.closeA + 14, EASE.in);
  const lensZ = 1 + 3.4 * push;
  const lensCx = LENS.cx + (HERO.x - LENS.cx) * push;
  const lensCy = LENS.cy + (HERO.y - LENS.cy) * push;
  const lensRim = 1 - span(f, k.closeA + 8, k.closeB, EASE.in);
  const popO = 1 - span(f, k.closeA + 4, k.closeA + 22, EASE.in);
  const blurOut = 8 * span(f, k.closeA + 2, k.closeA + 20, EASE.in);
  const lensR = LENS.r * lensZ;
  const cam = lensCam(1);
  const lensDen = span(f, k.plungeA + 6, k.plungeB + 6, EASE.inOut);
  const showGraphPhase = f < k.closeB + 2;

  // ---------------- 2. close-up: one enzyme
  const heroIn = span(f, k.closeA + 8, k.closeA + 26, EASE.out);
  const heroFocus = 9 * (1 - span(f, k.closeA + 8, k.closeB + 6, EASE.out));
  const heroGrow = 0.78 + 0.22 * span(f, k.closeA + 4, k.closeB + 10, EASE.out);
  const heroClipped = f < k.closeB;
  const unfold = track(f, [[k.unravelA - 4, 0], [k.unravelB, 0.17, EASE.out]]);
  const denature = track(f, [[k.unravelA, 0], [k.unravelB, 0.3, EASE.inOut], [k.siteA + 4, 0.34], [k.siteB, 1, EASE.inOut]]);
  const bondsVis = span(f, k.bondsA - 6, k.bondsA + 6) * (1 - span(f, k.unravelB, k.unravelB + 20));
  const chainHi = span(f, k.shape - 2, k.shape + 16) * (1 - span(f, k.unravelA + 8, k.unravelA + 26));
  const rimPulse = Math.sin(Math.PI * Math.max(0, Math.min(1, (f - k.shape + 2) / 30))) * 0.9;
  const bondIn = (bk: number) => span(f, k.bondsA + (bk % 10) * 2.2, k.bondsA + (bk % 10) * 2.2 + 8);
  const popAt = (bk: number) => k.popA + (BOND_ORDER[bk] / Math.max(1, WB.length - 1)) * (k.popB - k.popA);
  const bondBreak = (bk: number) => Math.max(0, Math.min(1, (f - popAt(bk)) / 10));
  const flicker = span(f, k.violentA, k.violentA + 20) * 0.85;
  const site = span(f, k.siteA, k.siteA + 12) * (1 - span(f, k.denWord + 20, k.denWord + 34));
  const siteCol = interpolate3(C.paper, C.coral, span(f, k.siteA + 14, k.siteB));

  // where the hero is (moves aside for the egg, leaves for the cold beat)
  const toEgg = span(f, k.eggA, k.eggA + 36, EASE.inOut);
  const leave = span(f, k.coldA, k.coldA + 16, EASE.in);
  const hx = lerp(HERO.x, HERO_EGG.x, toEgg) + 40 * leave;
  const hy = lerp(HERO.y, HERO_EGG.y, toEgg);
  const hs = lerp(HERO.s, HERO_EGG.s, toEgg);
  // thermal jiggle (follows the thermometer) + violent vibration while it's too hot
  const hj = jig("HERO", abs, 1.0);
  const vibAmp = 8 * span(f, k.violentA, k.violentA + 22) * (1 - 0.6 * span(f, k.popB, k.popB + 40)) * (1 - span(f, k.chillA, k.chillB));
  const vx = noise2D("vibx", f * 0.42, 0) * vibAmp;
  const vy = noise2D("viby", f * 0.42, 3) * vibAmp;
  const vr = noise2D("vibr", f * 0.42, 6) * vibAmp * 0.18;
  const hjx = (hj.dx + vx) * (hs / HERO.s);
  const hjy = (hj.dy + vy) * (hs / HERO.s);
  const hjr = hj.rot * 0.35 + vr;

  // the starch chain that no longer fits
  const sx = track(f, [[k.subIn, -400], [k.bounce - 12, -150, out], [k.bounce, -58, EASE.in], [k.bounce + 22, -300, out], [k.eggA + 24, -380, EASE.in]]);
  const sy = track(f, [[k.subIn, 70], [k.bounce - 12, 8, out], [k.bounce, 0], [k.bounce + 22, 50, out]]);
  const srot = track(f, [[k.bounce, 0], [k.bounce + 22, -8, out]]);
  const sj = jig("NOFIT", abs, 1.2);
  const noFitChain = dockedChain(4, HERO.x, HERO.y, HERO.s, { wave: 1.2 * Math.sin(f * 0.09) });
  const noFitRings = moveRings(noFitChain.rings, sx + sj.dx, sy + sj.dy, srot);
  const showNoFit = f > k.subIn - 2 && f < k.eggA + 24;
  const crossP = Math.max(0, Math.min(1, (f - k.bounce) / 14));
  const mouth: Pt = [HERO.x + HERO.s * DOCK.cut[0] - 20, HERO.y - 118];

  // ---------------- 3. egg
  const panIn = span(f, k.eggA + 4, k.eggA + 40, EASE.out);
  const panOut = span(f, k.coldA, k.coldA + 16, EASE.in);
  const panX = PAN.x - 260 * (1 - panIn) - 50 * panOut;
  const cooked = span(f, k.setA, k.setB, EASE.inOut);
  const heat = span(f, k.eggA + 10, k.eggA + 40) * (1 - span(f, k.chillA, k.chillB));
  const frost = span(f, k.chillA + 10, k.chillB + 10);
  const snow = span(f, k.chillA + 4, k.chillA + 22) * (1 - span(f, k.coldA, k.coldA + 12));

  // ---------------- 4. cold is different: a fresh sample back in the lens. Cold only slides the dot down the
  // LEFT side of the curve (fewer, gentler collisions; shapes intact). Warm it up and it climbs straight back.
  const back = span(f, k.backA, k.backB, EASE.out);
  const backFocus = 8 * (1 - back);
  const showBack = f > k.backA - 1;
  const e0 = enzymePose(0, abs);
  const e0j = jig("E0", abs, 0.9);
  const e0s = worldToScreen(cam, [e0.x + e0j.dx, e0.y + e0j.dy - 120]);
  const notDenP = span(f, k.notDen, k.notDen + 20);
  const notDenO = 1 - span(f, k.rewarmA + 8, k.rewarmA + 20);
  const siteBack = span(f, k.notDen - 4, k.notDen + 10) * notDenO;

  // ---------------- labels (screen space)
  const heroTop: Pt = [hx + hjx + 40 * (hs / HERO.s), hy + hjy - 190 * (hs / HERO.s)];
  const bondAnchor = (() => {
    const ch = chainNow(f, 0, 0);
    const [a, b] = WB[LABEL_BOND];
    return [HERO.x + ((ch[a][0] + ch[b][0]) / 2) * HERO.s + hjx, HERO.y + ((ch[a][1] + ch[b][1]) / 2) * HERO.s + hjy] as Pt;
  })();
  const lipTop: Pt = [HERO.x + HERO.s * -150 + hjx, HERO.y + HERO.s * -36 + hjy];
  const eggEdge: Pt = [panX - 120, PAN.y - 70];

  return (
    <Stage bg={{ lightX: 0.5, temperature: T }}>
      <AmbientTemp T={T} />

      {/* 1 · the reveal: lens + graph (same layout as S08/S09) */}
      {showGraphPhase ? (
        <g transform={`translate(${lensCx} ${lensCy}) scale(${lensZ}) translate(${-LENS.cx} ${-LENS.cy})`}>
          <Lens cam={cam} frame={lensRim}>
            <FocusPull blur={blurOut / lensZ} opacity={popO} dim={0.3}>
              <g transform={worldTransform(cam)}>
                <Population abs={abs} denature={lensDen} />
              </g>
            </FocusPull>
          </Lens>
        </g>
      ) : null}
      {showGraphPhase && graphO > 0 ? (
        <g opacity={graphO} transform={`translate(${60 * push} 0)`}>
          <TempGraph
            f={abs}
            axes={1}
            axisTo={70}
            ticks={[
              { v: 0, o: 1 },
              { v: 20, o: 1 },
              { v: 37, o: 1, hi: span(f, k.coolA, k.coolB) },
              { v: 50, o: 1 },
              { v: 60, o: 1 },
              { v: 70, o: 1 },
            ]}
            riseTo={37}
            fallTo={fallTo}
            dot={{ x: dotX, y: dotY, o: 1, hot: Math.min(1, plunge * 1.4) }}
            pointer={{ x: T, o: 1 }}
            guide={1}
            guesses={{ up: 1, down: 1, o: 1 - span(f, k.plungeA, k.plungeA + 26) }}
            floor={{ from: 70, to: dotX, o: cool }}
          />
          <OptimumNote main={1} approx={1} body={0} circle={0} />
          {/* "doesn't recover": the rate can't climb back up to the peak */}
          {f > k.noRecA ? (
            <g>
              <HandArrow
                from={[gx(37) - 58, gy(0) - 34]}
                to={[gx(37) - 40, gy(1) + 60]}
                bend={-0.12}
                progress={Math.max(0, Math.min(1, (f - k.noRecA) / 14))}
                color={C.paper}
                width={5}
                seed={11}
                opacity={0.85}
              />
              <HandCross cx={gx(37) - 66} cy={(gy(0) + gy(1)) / 2 + 30} size={62} progress={Math.max(0, Math.min(1, (f - k.noRecA - 10) / 12))} seed={5} />
            </g>
          ) : null}
        </g>
      ) : null}

      {/* 2 · close-up (revealed through the lens as we push in) */}
      <defs>
        <clipPath id="s10-heroclip">
          <circle cx={lensCx} cy={lensCy} r={lensR} />
        </clipPath>
      </defs>
      {heroIn > 0 && leave < 1 ? (
        <g clipPath={heroClipped ? "url(#s10-heroclip)" : undefined}>
        <FocusPull blur={heroFocus + 9 * leave} dim={0.2}>
          {showNoFit ? (
            <g opacity={span(f, k.subIn, k.subIn + 14) * (1 - span(f, k.eggA, k.eggA + 18))}>
              <SugarChain rings={noFitRings} links={noFitChain.links} />
            </g>
          ) : null}
          <g transform={`translate(${hjx} ${hjy}) rotate(${hjr} ${hx} ${hy}) translate(${hx} ${hy}) scale(${heroGrow}) translate(${-hx} ${-hy})`} opacity={heroIn * (1 - leave)}>
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
        </FocusPull>
        </g>
      ) : null}

      {/* 3 · egg */}
      {panIn > 0 && panOut < 1 ? (
        <FocusPull blur={9 * panOut} dim={0.2}>
          <FryingPan x={panX} y={PAN.y} cooked={cooked} heat={heat} frost={frost} f={f} opacity={panIn * (1 - panOut)} />
        </FocusPull>
      ) : null}
      {snow > 0 ? (
        <g opacity={snow} transform={`translate(${1160} ${540}) scale(${0.85 + 0.15 * snow}) translate(${-1160} ${-540})`}>
          <Snowflake x={1160} y={540} size={112} color={C.ice} stroke={6} />
        </g>
      ) : null}

      {/* 4 · cold: a fresh sample, slow but intact; warm it up and the dot climbs back to the peak */}
      {showBack ? (
        <FocusPull blur={backFocus} opacity={back} dim={0.2}>
          <Lens cam={cam} frame={1}>
            <g transform={worldTransform(cam)}>
              <Population abs={abs} heroSite={siteBack} />
            </g>
          </Lens>
          <TempGraph
            f={abs}
            axes={1}
            axisTo={70}
            ticks={[
              { v: 0, o: 1 },
              { v: 20, o: 1 },
              { v: 37, o: 1, hi: span(f, k.rewarmB - 6, k.rewarmB + 6) },
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
          <OptimumNote main={1} approx={1} body={0} circle={0} />
        </FocusPull>
      ) : null}

      {/* thermometer: the spine of the whole sequence */}
      <Thermometer x={THERMO.x} y={THERMO.y} height={THERMO.h} temperature={T} />

      {/* ---------------- annotations */}
      <Label
        anchor={bondAnchor}
        at={[bondAnchor[0] + 150, bondAnchor[1] - 150]}
        text="weak bonds"
        color={C.amberLight}
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
        opacity={1 - span(f, k.denWord - 10, k.denWord + 2)}
      />
      {crossP > 0 && f < k.eggA + 10 ? (
        <HandCross cx={mouth[0]} cy={mouth[1]} size={74} progress={crossP} seed={9} opacity={1 - span(f, k.denWord - 6, k.denWord + 8)} />
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
          align="end"
          progress={span(f, k.white - 4, k.white + 18)}
          opacity={(1 - span(f, k.chillA - 6, k.chillA + 8)) * (1 - panOut)}
        />
      ) : null}
      <Keyword x={(PAN.x + HERO_EGG.x) / 2 + 40} y={H - 116} text="cooling doesn't undo it" size={56} progress={span(f, k.undo - 10, k.undo + 6) * (1 - span(f, k.coldA - 4, k.coldA + 6))} />
      {showBack ? (
        <>
          <Label anchor={e0s} at={[e0s[0] + 60, 214]} text="not denatured" color={C.tealLight} progress={notDenP} opacity={notDenO} />
          <HandTick cx={gx(37) + 62} cy={gy(1) - 34} size={64} progress={Math.max(0, Math.min(1, (f - k.tick) / 14))} />
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
