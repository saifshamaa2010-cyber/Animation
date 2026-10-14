import React from "react";
import { useCurrentFrame } from "remotion";
import { C, EASE } from "../../brand/tokens";
import { Pt, roundedPolygon, smoothOpenPath, hexPoints } from "../../lib/geometry";
import { LitShape, circlePath, mix } from "../kit/shared";
import { ChemText, chemWidth } from "../Equation";
import { Glucose } from "../SugarChain";
import { useSvgId } from "../ids";

/** Small organisms and biological molecules, reusable across topics. */

// ------------------------------------------------------------------ pondweed (Elodea-like)
/** Where the cut end of a pondweed sprig is (bubbles of oxygen come out here). */
export const pondweedTip = (x: number, y: number, len: number): Pt => [x + len * 0.04, y - len];

/** A sprig of pondweed standing in water, cut end at the top (as in the rate practical). */
export const Pondweed: React.FC<{ readonly x: number; readonly y: number; readonly len?: number; readonly progress?: number; readonly scale?: number }> = ({
  x,
  y,
  len = 300,
  progress = 1,
  scale = 1,
}) => {
  if (progress <= 0) return null;
  const stem: Pt[] = [[x, y], [x + len * 0.05, y - len * 0.35], [x - len * 0.03, y - len * 0.7], pondweedTip(x, y, len)];
  const whorls = Math.floor(len / 30);
  const at = (t: number): Pt => {
    const k = Math.min(stem.length - 2, Math.floor(t * (stem.length - 1)));
    const u = t * (stem.length - 1) - k;
    return [stem[k][0] + (stem[k + 1][0] - stem[k][0]) * u, stem[k][1] + (stem[k + 1][1] - stem[k][1]) * u];
  };
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <path d={smoothOpenPath(stem)} fill="none" stroke={C.stem} strokeWidth={7 * scale} strokeLinecap="round" />
      {Array.from({ length: whorls }, (_, i) => {
        const t = 0.06 + (i / whorls) * 0.9;
        const [wx, wy] = at(t);
        const L = (26 + (i % 2) * 6) * scale * (1 - t * 0.25);
        return (
          <g key={i}>
            {[-1, 0, 1].map((k) => {
              const a = (k * 55 + (i % 2) * 28 - 90 + 180) * (Math.PI / 180);
              const ex = wx + Math.cos(a) * L * (k === 0 ? 0.5 : 1);
              const ey = wy + Math.abs(Math.sin(a)) * L * 0.35 + 4;
              return <ellipse key={k} cx={(wx + ex) / 2} cy={(wy + ey) / 2} rx={L * 0.5} ry={L * 0.16} fill={k === 0 ? C.leafDeep : C.leaf} transform={`rotate(${(Math.atan2(ey - wy, ex - wx) * 180) / Math.PI} ${(wx + ex) / 2} ${(wy + ey) / 2})`} />;
            })}
          </g>
        );
      })}
      {/* the cut end */}
      <ellipse cx={pondweedTip(x, y, len)[0]} cy={pondweedTip(x, y, len)[1]} rx={5 * scale} ry={3 * scale} fill={C.leafLight} />
    </g>
  );
};

// ------------------------------------------------------------------ flower with nectar
export const Flower: React.FC<{ readonly x: number; readonly y: number; readonly size?: number; readonly color?: string; readonly nectar?: number; readonly progress?: number }> = ({
  x,
  y,
  size = 120,
  color = C.violet,
  nectar = 0,
  progress = 1,
}) => {
  const id = useSvgId("flower");
  if (progress <= 0) return null;
  const s = 0.6 + 0.4 * EASE.out(Math.min(1, progress));
  const petal = (a: number) => {
    const r = size * 0.5;
    const px = Math.cos(a) * r * 0.6;
    const py = Math.sin(a) * r * 0.6;
    return `M0,0 Q${px - Math.sin(a) * r * 0.5},${py + Math.cos(a) * r * 0.5} ${Math.cos(a) * r},${Math.sin(a) * r} Q${px + Math.sin(a) * r * 0.5},${py - Math.cos(a) * r * 0.5} 0,0Z`;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, progress * 1.5)}>
      <defs>
        <filter id={`${id}-g`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={size * 0.08} />
        </filter>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <LitShape key={i} d={petal(-Math.PI / 2 + (i / 5) * Math.PI * 2)} top={mix(color, C.paper, 0.35)} bottom={color} rimOpacity={0.5} shadow={i === 0 ? 0.4 : 0} />
      ))}
      <circle r={size * 0.16} fill={C.amberDeep} />
      <circle r={size * 0.12} fill={C.amber} />
      {nectar > 0 ? (
        <g opacity={nectar}>
          <circle r={size * 0.16} fill={C.amberLight} opacity={0.6} filter={`url(#${id}-g)`} />
          <circle cx={size * 0.03} cy={-size * 0.02} r={size * 0.06} fill={C.amberLight} />
        </g>
      ) : null}
    </g>
  );
};

/** A bee (pollinator). Wings beat with the frame. */
export const Bee: React.FC<{ readonly x: number; readonly y: number; readonly size?: number; readonly rot?: number; readonly progress?: number }> = ({ x, y, size = 60, rot = 0, progress = 1 }) => {
  const frame = useCurrentFrame();
  if (progress <= 0) return null;
  const flap = Math.sin(frame * 1.9) * 0.5 + 0.5;
  const body = `M${-size * 0.55},0 C${-size * 0.55},${-size * 0.32} ${size * 0.45},${-size * 0.36} ${size * 0.55},0 C${size * 0.45},${size * 0.36} ${-size * 0.55},${size * 0.32} ${-size * 0.55},0Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={Math.min(1, progress * 2)}>
      <ellipse cx={-size * 0.05} cy={-size * 0.32} rx={size * 0.32} ry={size * (0.12 + 0.12 * flap)} fill={C.paper} opacity={0.45} transform={`rotate(-20 ${-size * 0.05} ${-size * 0.32})`} />
      <LitShape d={body} top={C.amberLight} bottom={C.amberDeep} rimOpacity={0.5} shadow={0.35} shadowDy={6} shadowBlur={6} />
      {[-0.18, 0.06, 0.3].map((k) => (
        <path key={k} d={`M${size * k},${-size * 0.3} Q${size * (k + 0.06)},0 ${size * k},${size * 0.3}`} fill="none" stroke={C.ink900} strokeWidth={size * 0.1} strokeLinecap="round" />
      ))}
      <circle cx={size * 0.55} cy={-size * 0.02} r={size * 0.17} fill={C.ink800} />
      <ellipse cx={size * 0.1} cy={-size * 0.36} rx={size * 0.28} ry={size * (0.1 + 0.1 * flap)} fill={C.paper} opacity={0.6} transform={`rotate(-35 ${size * 0.1} ${-size * 0.36})`} />
    </g>
  );
};

// ------------------------------------------------------------------ ions
/** A mineral ion, e.g. "NO3^-" (nitrate) or "Mg^2+" (magnesium). */
export const Ion: React.FC<{ readonly x: number; readonly y: number; readonly text: string; readonly color?: string; readonly r?: number; readonly progress?: number; readonly opacity?: number }> = ({
  x,
  y,
  text,
  color = C.ice,
  r = 60,
  progress = 1,
  opacity = 1,
}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const s = 0.6 + 0.4 * EASE.out(Math.min(1, progress));
  // label text never goes below the channel's 40 px minimum: the circle grows to fit instead
  const size = 40;
  r = Math.max(r, chemWidth(text, size, 700) * 0.62);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, progress * 1.6) * opacity}>
      <LitShape d={circlePath(0, 0, r)} top={mix(color, C.paper, 0.3)} bottom={mix(color, C.ink800, 0.35)} rimOpacity={0.6} shadow={0.4} shadowDy={6} shadowBlur={7} />
      <ChemText text={text} x={0} y={size * 0.36} size={size} color={C.ink900} anchor="middle" weight={700} />
    </g>
  );
};

// ------------------------------------------------------------------ sugars and proteins
const PENT = roundedPolygon(Array.from({ length: 5 }, (_, i) => [Math.cos(-Math.PI / 2 + (i / 5) * Math.PI * 2) * 34, Math.sin(-Math.PI / 2 + (i / 5) * Math.PI * 2) * 34] as Pt), 6);

/** Sucrose = glucose + fructose (the sugar a plant transports in its phloem). */
export const Sucrose: React.FC<{ readonly x: number; readonly y: number; readonly scale?: number; readonly glow?: number; readonly opacity?: number; readonly rot?: number }> = ({
  x,
  y,
  scale = 1,
  glow = 0,
  opacity = 1,
  rot = 0,
}) => {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      <line x1={-30} y1={0} x2={34} y2={0} stroke={C.amberDeep} strokeWidth={7} strokeLinecap="round" />
      <Glucose x={-44} y={0} tone="sugar" glow={glow} />
      <g transform="translate(52 0)">
        <LitShape d={PENT} top={C.amberLight} bottom={C.amber} rimOpacity={0.6} shadow={0.35} shadowDy={5} shadowBlur={6} />
      </g>
    </g>
  );
};

const AA_COLOURS = [C.coral, C.violet, C.teal, C.amber, C.ice, C.paper];

/** A chain of amino acids (beads). `n` beads; `progress` adds them one by one. */
export const AminoChain: React.FC<{ readonly x: number; readonly y: number; readonly n?: number; readonly progress?: number; readonly r?: number; readonly wave?: number }> = ({
  x,
  y,
  n = 8,
  progress = 1,
  r = 20,
  wave = 0.4,
}) => {
  const shown = Math.min(n, Math.floor(progress * n + 0.0001));
  const pts: Pt[] = Array.from({ length: n }, (_, i) => [x + i * r * 2.1, y + Math.sin(i * 1.1) * r * wave * 2]);
  return (
    <g>
      {shown > 1 ? <path d={smoothOpenPath(pts.slice(0, shown))} fill="none" stroke={C.ink300} strokeWidth={6} strokeLinecap="round" /> : null}
      {pts.slice(0, shown).map(([px, py], i) => (
        <LitShape key={i} d={circlePath(px, py, r)} top={mix(AA_COLOURS[i % AA_COLOURS.length], C.paper, 0.3)} bottom={AA_COLOURS[i % AA_COLOURS.length]} rimOpacity={0.6} shadow={0.3} shadowDy={4} shadowBlur={5} />
      ))}
    </g>
  );
};

/** Hexagon outline path for a "glucose" icon at any size (for tiny icons where GlucoseRing is too detailed). */
export const hexIconPath = (cx: number, cy: number, r: number) => {
  const pts = hexPoints(r).map(([px, py]) => [cx + px, cy + py] as Pt);
  return roundedPolygon(pts, r * 0.18);
};
