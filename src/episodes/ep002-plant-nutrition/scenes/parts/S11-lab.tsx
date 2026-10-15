/**
 * S11 helpers (also used by S12): step chips + tracker, tripod and gauze, boiling bubbles, steam,
 * a leaf that changes colour where a stain spreads (iodine), starch grains, a leader label whose
 * text sits centred below/above its anchor, the boiled-cells lens content and a "no naked flame" icon.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { Leaf, LeafGeo, LeafProps, LeafTone } from "../../../../components/bio";
import { ChemText, chemWidth } from "../../../../components/Equation";
import { LitShape, mix, textWidth } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { useSvgId } from "../../../../components/ids";
import { Photon } from "../../../../components/Light";
import { Pt, rng } from "../../../../lib/geometry";

// ------------------------------------------------------------------ step chips

export const STEP_H = 64;
const DISC = 64;
const CHIP_SIZE = 44;
export const stepLabelWidth = (text: string) => chemWidth(text, CHIP_SIZE, 600);

/**
 * A numbered step chip: a paper number disc (like the SectionTag's) and, when `expand` > 0,
 * a lit ink pill with the step's name (chemical formulas get real subscripts).
 * `state`: 0 = still to come (outline only), 1 = now, 2 = done (quiet).
 */
export const StepChip: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly n: number;
  readonly text: string;
  readonly color: string;
  readonly expand: number;
  readonly active: number;
  readonly done?: number;
  readonly progress?: number;
  readonly opacity?: number;
}> = ({ x, y, n, text, color, expand, active, done = 0, progress = 1, opacity = 1 }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const e = EASE.inOut(Math.max(0, Math.min(1, expand)));
  const tw = stepLabelWidth(text);
  const w = DISC + e * (tw + 40);
  const p = EASE.out(Math.min(1, progress));
  const discFill = mix(C.ink700, C.paper, Math.max(active, 0.35 * done));
  const numCol = mix(C.ink300, C.ink900, Math.max(active, done));
  return (
    <g opacity={Math.min(1, progress * 1.5) * opacity} transform={`translate(${(1 - p) * 18} 0)`}>
      {e > 0.01 ? (
        <g>
          <LitShape d={roundRectPath(x, y, w, STEP_H, 18)} top={C.ink700} bottom={C.ink800} rimOpacity={0.45} shadow={0.45} shadowDy={8} shadowBlur={10} />
          <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={STEP_H - 3} rx={16.5} fill="none" stroke={color} strokeOpacity={0.85 * e} strokeWidth={3} />
        </g>
      ) : null}
      <rect x={x} y={y} width={DISC} height={STEP_H} rx={18} fill={discFill} stroke={mix(C.ink500, color, active)} strokeWidth={active > 0.5 ? 0 : 3} />
      <text x={x + DISC / 2} y={y + 46} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={CHIP_SIZE} fill={numCol}>
        {n}
      </text>
      {e > 0.01 ? (
        <g opacity={Math.max(0, (e - 0.45) / 0.55)}>
          <ChemText text={text} x={x + DISC + 20} y={y + 47} size={CHIP_SIZE} color={mix(color, C.paper, 0.35)} weight={600} />
        </g>
      ) : null}
    </g>
  );
};

/** Width of a StepChip for a given expansion (for laying out a row). */
export const stepChipWidth = (text: string, expand: number) => DISC + EASE.inOut(Math.max(0, Math.min(1, expand))) * (stepLabelWidth(text) + 40);

export type TrackerStep = { readonly text: string; readonly color: string; readonly active: number; readonly done: number };

/** A row of step chips, right-aligned at `right`; the active step opens to show its name. */
export const StepTracker: React.FC<{ readonly right: number; readonly y: number; readonly steps: readonly TrackerStep[]; readonly progress: number; readonly opacity?: number }> = ({
  right,
  y,
  steps,
  progress,
  opacity = 1,
}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const gap = 16;
  const widths = steps.map((s) => stepChipWidth(s.text, s.active));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (steps.length - 1);
  let x = right - total;
  return (
    <g opacity={opacity}>
      {steps.map((s, i) => {
        const el = <StepChip key={i} x={x} y={y} n={i + 1} text={s.text} color={s.color} expand={s.active} active={s.active} done={s.done} progress={progress * 1.4 - i * 0.12} />;
        x += widths[i] + gap;
        return el;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ heating kit

/** Tripod with a gauze on top. (x, yTop) = centre of the gauze's top surface; legs reach `floor`. */
export const Tripod: React.FC<{ readonly x: number; readonly yTop: number; readonly floor: number; readonly w?: number; readonly progress?: number }> = ({ x, yTop, floor, w = 300, progress = 1 }) => {
  if (progress <= 0) return null;
  const half = w / 2;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      {[-1, 1].map((s) => (
        <path key={s} d={`M${x + s * (half - 24)},${yTop + 10} L${x + s * (half + 6)},${floor}`} stroke={C.ink400} strokeWidth={11} strokeLinecap="round" fill="none" />
      ))}
      <LitShape d={roundRectPath(x - half, yTop + 4, w, 14, 5)} top={C.ink300} bottom={C.ink500} rimOpacity={0.45} shadow={0.35} shadowDy={6} shadowBlur={6} />
      {/* wire gauze */}
      <rect x={x - half + 14} y={yTop - 2} width={w - 28} height={7} rx={3} fill={mix(C.ink300, C.paper, 0.25)} />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1={x - half + 22 + i * ((w - 44) / 10)} y1={yTop - 2} x2={x - half + 22 + i * ((w - 44) / 10)} y2={yTop + 5} stroke={C.ink500} strokeWidth={2} />
      ))}
    </g>
  );
};

/** Bubbles rising through hot water inside [x0, x1] from `bottom` to `surface`. `rate` 0..1 = how hard it boils. */
export const BoilBubbles: React.FC<{ readonly x0: number; readonly x1: number; readonly bottom: number; readonly surface: number; readonly rate: number; readonly seed?: number }> = ({
  x0,
  x1,
  bottom,
  surface,
  rate,
  seed = 3,
}) => {
  const frame = useCurrentFrame();
  if (rate <= 0) return null;
  const r = rng(seed);
  const N = 14;
  const items = Array.from({ length: N }, (_, i) => ({ x: x0 + 14 + r() * (x1 - x0 - 28), off: r() * 40, size: 4 + r() * 6, speed: 0.8 + r() * 0.5, i }));
  return (
    <g>
      {items.map((b) => {
        if (b.i / N > rate) return null;
        const period = 40 / b.speed;
        const ph = ((frame + b.off) % period) / period;
        const y = bottom - 6 - ph * (bottom - surface - 6);
        const x = b.x + noise2D(`bb${seed}${b.i}`, frame * 0.06, 0) * 5;
        const rr = b.size * (0.6 + 0.6 * ph);
        const op = Math.min(1, ph * 6) * Math.min(1, (1 - ph) * 8);
        return <circle key={b.i} cx={x} cy={y} r={rr} fill={C.paper} fillOpacity={0.12} stroke={C.paper} strokeOpacity={0.7 * op} strokeWidth={2} opacity={op} />;
      })}
    </g>
  );
};

/** Wisps of steam rising from a hot surface centred at (x, y). `heat` 0..1. */
export const Steam: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly heat: number; readonly n?: number }> = ({ x, y, w, heat, n = 3 }) => {
  const frame = useCurrentFrame();
  if (heat <= 0) return null;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const ph = ((frame + i * 23) % 70) / 70;
        const sx = x - w / 2 + ((i + 0.5) / n) * w;
        return (
          <path
            key={i}
            d={`M${sx},${y - 10 - ph * 70} q-12,-18 0,-36 q12,-18 0,-36`}
            fill="none"
            stroke={C.paper}
            strokeOpacity={0.32 * heat * Math.sin(ph * Math.PI)}
            strokeWidth={6}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** A translucent liquid veil over things standing in a liquid (so they read as submerged). */
export const LiquidVeil: React.FC<{ readonly x0: number; readonly x1: number; readonly surface: number; readonly bottom: number; readonly color?: string; readonly opacity?: number; readonly round?: number }> = ({
  x0,
  x1,
  surface,
  bottom,
  color = C.ice,
  opacity = 0.24,
  round = 16,
}) => {
  if (opacity <= 0 || bottom <= surface) return null;
  return <path d={roundRectPath(x0, surface, x1 - x0, bottom - surface, Math.min(round, (bottom - surface) / 2))} fill={color} opacity={opacity} />;
};

// ------------------------------------------------------------------ leaves

export type StainLayer = {
  readonly tone: LeafTone;
  readonly margin?: LeafProps["margin"];
  readonly band?: LeafProps["band"];
  /** 0..1 */
  readonly p: number;
  /** Where the stain starts (screen points). Omit for a plain cross-fade. */
  readonly origins?: readonly Pt[];
  /** Radius each origin's stain reaches at p = 1. */
  readonly reach?: number;
};

/**
 * A leaf whose colour changes in layers: each layer is the same leaf in another tone, revealed
 * either by a cross-fade or by stains spreading from drop points (iodine soaking in).
 */
export const StainLeaf: React.FC<{
  readonly geo: LeafGeo;
  readonly tone: LeafTone;
  readonly margin?: LeafProps["margin"];
  readonly band?: LeafProps["band"];
  readonly cover?: LeafProps["cover"];
  readonly sunlit?: number;
  readonly layers?: readonly StainLayer[];
  readonly progress?: number;
  readonly opacity?: number;
  readonly shadow?: number;
}> = ({ geo, tone, margin, band, cover, sunlit = 0, layers = [], progress = 1, opacity = 1, shadow = 0.5 }) => {
  const id = useSvgId("stain");
  if (progress <= 0 || opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <Leaf geo={geo} tone={tone} margin={margin} band={band} cover={cover} sunlit={sunlit} progress={progress} shadow={shadow} />
      {layers.map((l, i) => {
        if (l.p <= 0) return null;
        if (!l.origins) return <Leaf key={i} geo={geo} tone={l.tone} margin={l.margin} band={l.band} progress={progress} shadow={0} opacity={Math.min(1, l.p)} />;
        const reach = l.reach ?? geo.len;
        return (
          <g key={i}>
            <defs>
              <mask id={`${id}-m${i}`} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={12000} height={12000}>
                {l.origins.map((o, j) => (
                  <circle key={j} cx={o[0]} cy={o[1]} r={Math.max(0.1, reach * (1 - (1 - Math.min(1, l.p)) ** 2))} fill="#fff" />
                ))}
              </mask>
            </defs>
            <g mask={`url(#${id}-m${i})`}>
              <Leaf geo={geo} tone={l.tone} margin={l.margin} band={l.band} progress={progress} shadow={0} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** Hairline cracks across a dried, brittle leaf (leaf-local points via geo.P). */
export const LeafCracks: React.FC<{ readonly geo: LeafGeo; readonly p: number }> = ({ geo, p }) => {
  if (p <= 0) return null;
  const L = geo.len;
  const Wd = geo.wid;
  const cracks: Pt[][] = [
    [geo.P(-0.18 * L, 0.02 * Wd), geo.P(-0.12 * L, 0.16 * Wd), geo.P(-0.16 * L, 0.3 * Wd), geo.P(-0.1 * L, 0.42 * Wd)],
    [geo.P(0.12 * L, -0.02 * Wd), geo.P(0.06 * L, -0.18 * Wd), geo.P(0.12 * L, -0.3 * Wd), geo.P(0.08 * L, -0.4 * Wd)],
    [geo.P(0.28 * L, 0.02 * Wd), geo.P(0.32 * L, 0.14 * Wd), geo.P(0.27 * L, 0.24 * Wd)],
  ];
  return (
    <g opacity={Math.min(1, p)}>
      {cracks.map((c, i) => (
        <path key={i} d={`M${c.map((q) => q.join(",")).join("L")}`} fill="none" stroke={mix(C.creamDeep, C.ink800, 0.6)} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, p * 1.2)} />
      ))}
    </g>
  );
};

/** A starch grain: a small lit amber oval (glucose packed into an insoluble store). */
export const StarchGrain: React.FC<{ readonly x: number; readonly y: number; readonly r?: number; readonly rot?: number; readonly p: number }> = ({ x, y, r = 12, rot = 0, p }) => {
  if (p <= 0) return null;
  const s = EASE.out(Math.min(1, p));
  const rx = r * s;
  const ry = r * 0.78 * s;
  const d = `M${x - rx},${y} a${rx},${ry} 0 1,1 ${rx * 2},0 a${rx},${ry} 0 1,1 ${-rx * 2},0Z`;
  return (
    <g opacity={Math.min(1, p * 1.5)} transform={`rotate(${rot} ${x} ${y})`}>
      <LitShape d={d} top={mix(C.amberLight, C.paper, 0.2)} bottom={C.amber} rimWidth={3} rimOpacity={0.8} shadow={0.3} shadowDy={2} shadowBlur={3} />
      <path d={`M${x - rx * 0.4},${y - ry * 0.05} q${rx * 0.4},${-ry * 0.35} ${rx * 0.8},0`} fill="none" stroke={C.amberDeep} strokeOpacity={0.55} strokeWidth={2} />
    </g>
  );
};

// ------------------------------------------------------------------ labels

/**
 * A leader label whose text sits centred above or below the thing it labels (for rows of results,
 * where side labels would collide). (x, y) = text baseline centre.
 */
export const CapLabel: React.FC<{
  readonly anchor: Pt;
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly progress: number;
  readonly color?: string;
  readonly textColor?: string;
  readonly size?: number;
  readonly opacity?: number;
  readonly sub?: string;
  readonly subProgress?: number;
  /** render `sub` with chemical sub/superscripts ("absorbs CO2" → CO₂) */
  readonly subChem?: boolean;
}> = ({ anchor, x, y, text, progress, color = C.paper, textColor, size = 44, opacity = 1, sub, subProgress = 1, subChem = false }) => {
  if (progress <= 0 || opacity <= 0) return null;
  const below = y > anchor[1];
  const endY = below ? y - size * 0.92 - 4 : y + (sub ? 64 : 0) + 18;
  const line = EASE.out(Math.min(1, progress / 0.55));
  const txt = Math.max(0, Math.min(1, (progress - 0.35) / 0.65));
  const lx = anchor[0] + (x - anchor[0]) * line;
  const ly = anchor[1] + (endY - anchor[1]) * line;
  return (
    <g opacity={opacity}>
      <circle cx={anchor[0]} cy={anchor[1]} r={7 * Math.min(1, progress * 5)} fill={color} />
      <circle cx={anchor[0]} cy={anchor[1]} r={14 * Math.min(1, progress * 5)} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={2} />
      <line x1={anchor[0]} y1={anchor[1]} x2={lx} y2={ly} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <g opacity={txt} transform={`translate(0 ${(1 - txt) * (below ? -10 : 10)})`}>
        <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size} fill={textColor ?? color} stroke={C.ink900} strokeWidth={8} strokeOpacity={0.6} paintOrder="stroke" letterSpacing={-0.5}>
          {text}
        </text>
        {sub && subProgress > 0 && subChem ? <ChemText text={sub} x={x} y={y + 50} size={40} weight={400} color={C.ink300} anchor="middle" opacity={subProgress} /> : null}
        {sub && subProgress > 0 && !subChem ? (
          <text x={x} y={y + 50} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={40} fill={C.ink300} opacity={subProgress} stroke={C.ink900} strokeWidth={6} strokeOpacity={0.6} paintOrder="stroke">
            {sub}
          </text>
        ) : null}
      </g>
    </g>
  );
};

/** Width of a CapLabel's main line (for layout checks). */
export const capWidth = (text: string, size = 44) => textWidth(text, size, 600);

// ------------------------------------------------------------------ icons

/** A naked flame (orange, not the Bunsen's blue) — used with a cross: "never heat ethanol with a flame". */
export const NakedFlame: React.FC<{ readonly x: number; readonly y: number; readonly size?: number; readonly progress?: number }> = ({ x, y, size = 90, progress = 1 }) => {
  const id = useSvgId("nflame");
  const frame = useCurrentFrame();
  if (progress <= 0) return null;
  const h = size;
  const fl = 1 + noise2D("nflame", frame * 0.2, 0) * 0.05;
  const outer = `M${x},${y - h * fl} C${x + h * 0.42},${y - h * 0.52} ${x + h * 0.38},${y - h * 0.08} ${x},${y} C${x - h * 0.38},${y - h * 0.08} ${x - h * 0.42},${y - h * 0.52} ${x},${y - h * fl}Z`;
  const inner = `M${x},${y - h * 0.55 * fl} C${x + h * 0.2},${y - h * 0.3} ${x + h * 0.18},${y - h * 0.06} ${x},${y - h * 0.02} C${x - h * 0.18},${y - h * 0.06} ${x - h * 0.2},${y - h * 0.3} ${x},${y - h * 0.55 * fl}Z`;
  return (
    <g opacity={Math.min(1, progress * 1.5)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(C.sun, C.paper, 0.2)} />
          <stop offset="1" stopColor={C.amber} />
        </linearGradient>
      </defs>
      <path d={outer} fill={`url(#${id}-g)`} />
      <path d={inner} fill={mix(C.sun, C.paper, 0.5)} opacity={0.9} />
    </g>
  );
};

// ------------------------------------------------------------------ boiled cells (lens content)

/**
 * Three leaf cells seen through a lens. `dead` 0..1 dulls the chloroplasts (cells killed);
 * `broken` 0..1 breaks the cell membranes into fragments (the cell walls stay); `iodine` 0..1
 * sends iodine particles in through the gaps.
 */
export const BoiledCells: React.FC<{ readonly cx: number; readonly cy: number; readonly dead: number; readonly broken: number; readonly iodine: number }> = ({ cx, cy, dead, broken, iodine }) => {
  const frame = useCurrentFrame();
  const cw = 112;
  const ch = 184;
  const gap = 12;
  const cells = [-1, 0, 1].map((i) => ({ x: cx + i * (cw + gap), y: cy, i }));
  const wall = mix(C.leafLight, C.paper, 0.3);
  const chloro = mix(C.chloro, mix(C.creamDeep, C.ink500, 0.35), dead * 0.75);
  const r = rng(21);
  return (
    <g>
      {cells.map((c) => {
        const l = c.x - cw / 2;
        const t = c.y - ch / 2;
        return (
          <g key={c.i}>
            {/* cytoplasm */}
            <path d={roundRectPath(l + 10, t + 10, cw - 20, ch - 20, 22)} fill={mix(C.leafDark, C.leaf, 0.25 * (1 - dead))} opacity={0.9} />
            {/* cell wall: stays intact */}
            <path d={roundRectPath(l, t, cw, ch, 26)} fill="none" stroke={wall} strokeWidth={7} strokeOpacity={0.9} />
            {/* cell membrane: breaks into fragments */}
            <path
              d={roundRectPath(l + 12, t + 12, cw - 24, ch - 24, 20)}
              fill="none"
              stroke={C.paper}
              strokeWidth={3.5}
              pathLength={100}
              strokeDasharray={broken > 0 ? `${10 - 5.5 * broken} ${5.5 * broken}` : undefined}
              strokeOpacity={0.85 - 0.25 * broken}
            />
            {/* chloroplasts */}
            {Array.from({ length: 5 }, (_, j) => {
              const side = j % 2 ? 1 : -1;
              const yy = t + 34 + j * ((ch - 68) / 4);
              const xx = c.x + side * (cw / 2 - 30) + (r() - 0.5) * 6;
              return <ellipse key={j} cx={xx} cy={yy} rx={14} ry={9} fill={chloro} transform={`rotate(${side * 70} ${xx} ${yy})`} />;
            })}
          </g>
        );
      })}
      {/* iodine particles drifting in through the broken membranes */}
      {iodine > 0
        ? Array.from({ length: 9 }, (_, i) => {
            const cell = cells[i % 3];
            const startY = cell.y - ch / 2 - 30 - (i % 2) * 20;
            const endY = cell.y - 40 + (i % 3) * 36;
            const q = Math.max(0, Math.min(1, iodine * 1.4 - (i % 4) * 0.12));
            const x = cell.x + ((i % 3) - 1) * 26 + noise2D(`io${i}`, frame * 0.05, 0) * 6;
            const y = startY + (endY - startY) * EASE.out(q);
            return <circle key={i} cx={x} cy={y} r={7} fill={C.iodine} opacity={Math.min(1, q * 4)} />;
          })
        : null}
    </g>
  );
};

// ------------------------------------------------------------------ light

/**
 * Photons falling on targets: one leaves every `every` frames between `start` and `stop` and travels
 * `travel` frames in a straight line, from `source` or from `dist` px back along `dir`.
 * `clampY`: anything below this line (e.g. under a box's roof) is blocked there.
 * Pass the SCENE frame `f` (not the composition frame).
 */
export const PhotonRain: React.FC<{
  readonly f: number;
  readonly start: number;
  readonly stop: number;
  readonly every: number;
  readonly travel: number;
  readonly targets: readonly Pt[];
  readonly dir?: Pt;
  readonly dist?: number;
  readonly source?: Pt;
  readonly clampY?: number;
  readonly size?: number;
}> = ({ f, start, stop, every, travel, targets, dir = [0.5, 0.866], dist = 400, source, clampY, size = 0.75 }) => {
  const n = Math.max(0, Math.ceil((stop - start) / every));
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const s0 = start + i * every;
    const p = (f - s0) / travel;
    if (p <= 0 || p >= 1) continue;
    const to = targets[i % targets.length];
    const from: Pt = source ?? [to[0] - dir[0] * dist, to[1] - dir[1] * dist];
    let end: Pt = to;
    if (clampY !== undefined && to[1] > clampY && from[1] < clampY) {
      const t = (clampY - from[1]) / (to[1] - from[1]);
      end = [from[0] + (to[0] - from[0]) * t, clampY];
    }
    out.push(<Photon key={i} from={from} to={end} p={p} size={size} />);
  }
  return <g>{out}</g>;
};
