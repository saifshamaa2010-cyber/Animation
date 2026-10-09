import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C } from "../brand/tokens";
import { Pt, lerp, lerpPts, roundedPolygon, smoothOpenPath } from "../lib/geometry";
import { jitter, thermalAmplitude } from "../lib/motion";
import { useSvgId } from "./ids";
import {
  ENZYME_DENATURED,
  ENZYME_OPEN,
  ENZYME_RADII,
  ENZYME_REST,
  POCKET_INDICES,
  foldedChain,
  unfoldedChain,
  weakBonds,
} from "./molecule-geometry";

export const ENZYME_PALETTES = {
  teal: { light: C.tealLight, main: C.teal, deep: C.tealDeep, dark: C.tealDark },
  violet: { light: C.violetLight, main: C.violet, deep: C.violetDeep, dark: "#3C2E99" },
} as const;

export type EnzymeProps = {
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly rotate?: number;
  readonly palette?: keyof typeof ENZYME_PALETTES;
  /** 0 = resting pocket, 1 = pocket opened wide (before induced fit closes it). */
  readonly open?: number;
  /** 0 = healthy, 1 = fully denatured shape. */
  readonly denature?: number;
  /** 0 = folded globule, 1 = chain stretched out (fill fades away). */
  readonly unfold?: number;
  /** 0..1 glow + dashed outline around the active site. */
  readonly showSite?: number;
  readonly siteColor?: string;
  /** 0..1 visibility of the weak bonds holding the fold together. */
  readonly bonds?: number;
  /** 0..1 fraction of weak bonds that have snapped. */
  readonly bondsBroken?: number;
  /** Temperature drives thermal jiggle. Set `still` to freeze. */
  readonly temperature?: number;
  readonly still?: boolean;
  readonly seed?: number;
  readonly opacity?: number;
};

export const Enzyme: React.FC<EnzymeProps> = ({
  x,
  y,
  scale = 1,
  rotate = 0,
  palette = "teal",
  open = 0,
  denature = 0,
  unfold = 0,
  showSite = 0,
  siteColor = C.paper,
  bonds = 0,
  bondsBroken = 0,
  temperature = 25,
  still = false,
  seed = 7,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const pal = ENZYME_PALETTES[palette];
  const id = useSvgId("enz");

  const outline = useMemo(() => {
    let pts: Pt[] = ENZYME_REST;
    if (open > 0) pts = lerpPts(pts, ENZYME_OPEN, open);
    if (denature > 0) pts = lerpPts(pts, ENZYME_DENATURED, denature);
    return pts;
  }, [open, denature]);
  const d = roundedPolygon(outline, ENZYME_RADII);

  const folded = useMemo(() => foldedChain(seed * 97 + 11), [seed]);
  const stretched = useMemo(() => unfoldedChain(folded.length), [folded.length]);
  const wb = useMemo(() => weakBonds(folded), [folded]);

  // Thermal motion, stronger when hot. Denatured chains also writhe.
  const amp = still ? 0 : thermalAmplitude(temperature);
  const j = jitter(seed, frame, amp, 0.025 + amp * 0.002);

  // Chain points: folded → stretched, staggered from one end, plus loosening when denatured.
  const chain: Pt[] = folded.map((p, i) => {
    const stagger = Math.min(1, Math.max(0, unfold * 1.6 - (i / folded.length) * 0.6));
    // Denaturing: loops bulge outward and writhe (the fold is coming apart).
    const n = noise2D(`loop${seed}`, i * 0.045, still ? 0 : frame * 0.03);
    const push = denature * Math.max(0, n) * 0.55;
    const cx = 20;
    const cy = 0;
    const lx = p[0] + (p[0] - cx) * push;
    const ly = p[1] + (p[1] - cy) * push;
    return [lerp(lx, stretched[i][0], stagger), lerp(ly, stretched[i][1], stagger)];
  });
  const chainPath = smoothOpenPath(chain, 0.9);
  const fillOpacity = (1 - Math.min(1, unfold * 1.4)) * (1 - denature * 0.45);

  const pocketPath = smoothOpenPath(
    POCKET_INDICES.map((i) => outline[i]),
    0.2,
  );

  return (
    <g
      transform={`translate(${x + j.dx} ${y + j.dy}) rotate(${rotate + j.rot}) scale(${scale})`}
      opacity={opacity}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={pal.main} />
          <stop offset="0.65" stopColor={pal.deep} />
          <stop offset="1" stopColor={pal.dark} />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={pal.light} stopOpacity={0.95} />
          <stop offset="0.45" stopColor={pal.light} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={d} />
        </clipPath>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* Soft drop shadow gives depth without a hard "long shadow" look. */}
      <path
        d={d}
        transform="translate(0 14)"
        fill={C.ink950}
        opacity={0.35 * fillOpacity}
        filter={`url(#${id}-shadow)`}
      />

      <g opacity={fillOpacity}>
        <path d={d} fill={`url(#${id}-fill)`} />
        {/* The folded chain, faintly visible inside: an enzyme IS a folded chain. */}
        <g clipPath={`url(#${id}-clip)`}>
          <path
            d={chainPath}
            fill="none"
            stroke={pal.dark}
            strokeOpacity={0.2}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={chainPath}
            fill="none"
            stroke={pal.light}
            strokeOpacity={0.14}
            strokeWidth={3}
            strokeLinecap="round"
            transform="translate(-1.5 -2)"
          />
          {/* Rim light: an inner stroke that fades from the top-left edge. */}
          <path d={d} fill="none" stroke={`url(#${id}-rim)`} strokeWidth={14} />
        </g>
      </g>

      {/* Weak bonds holding the fold (hydrogen bonds etc.) — dotted links. */}
      {bonds > 0
        ? wb.map(([a, b], k) => {
            const broken = k / wb.length < bondsBroken;
            const pa = chain[a];
            const pb = chain[b];
            return (
              <line
                key={k}
                x1={pa[0]}
                y1={pa[1]}
                x2={pb[0]}
                y2={pb[1]}
                stroke={broken ? C.coral : C.amberLight}
                strokeWidth={3}
                strokeDasharray="2 6"
                strokeLinecap="round"
                opacity={bonds * (broken ? 0.0 : 0.95)}
              />
            );
          })
        : null}

      {/* While denaturing, the loosened chain spills over the outline. */}
      {denature > 0.02 && unfold <= 0.02 ? (
        <g opacity={Math.min(1, denature * 1.5)}>
          <path d={chainPath} fill="none" stroke={pal.deep} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <path d={chainPath} fill="none" stroke={pal.main} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}

      {/* The chain itself, once it starts to unravel. */}
      {unfold > 0.02 ? (
        <g opacity={Math.min(1, unfold * 3)}>
          <path
            d={chainPath}
            fill="none"
            stroke={pal.main}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {chain
            .filter((_, i) => i % 6 === 0)
            .map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={6.5} fill={pal.light} stroke={pal.deep} strokeWidth={2} />
            ))}
        </g>
      ) : null}

      {/* Active site highlight. */}
      {showSite > 0 ? (
        <g opacity={showSite}>
          <path
            d={pocketPath}
            fill="none"
            stroke={siteColor}
            strokeWidth={10}
            opacity={0.35}
            filter={`url(#${id}-glow)`}
          />
          <path
            d={pocketPath}
            fill="none"
            stroke={siteColor}
            strokeWidth={4}
            strokeDasharray="10 9"
            strokeLinecap="round"
          />
        </g>
      ) : null}
    </g>
  );
};
