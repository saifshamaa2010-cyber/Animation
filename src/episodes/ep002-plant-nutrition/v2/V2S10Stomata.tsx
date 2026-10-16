/**
 * EP002 v2 · S10 — inside the lower part of the leaf ("leaf" world, night-purple), cartoon close-up.
 *
 * Big glossy spongy mesophyll cells with air spaces between them, a vascular bundle, the lower epidermis
 * across the frame and ONE stoma in the middle: two kidney-shaped guard cells ("the bouncers", in
 * sunglasses) with a neon OPEN / CLOSED sign over the door. Below the epidermis is the outside air.
 *
 * Beats (all on narration cues):
 *  - spongy / air / diffuse: the cells and air spaces are named; carbon dioxide diffuses through the air
 *    spaces to the cells; the cell surfaces light up (large surface area).
 *  - bundle / xylem / phloem: the vascular bundle is named, then its xylem and phloem.
 *  - lower / stomata: the lower epidermis, then the pore is ringed and named "stoma".
 *  - gases: CO2 characters diffuse up from the outside air, through the pore, into the air spaces (wobbly
 *    paths); then O2 characters diffuse down and out. Dashed arrows + "carbon dioxide in" / "oxygen out".
 *  - guard: the light dims (sun sets in the sky window); at "opened" the guard cells swell proudly, at
 *    "closed" they go limp and the pore shuts; the sign flips to CLOSED; late CO2 bumps the door and waits,
 *    sleepy. "guard cells" with a leader to each cell.
 *  - guardOpen "In the light": the sun rises again, light sweeps down, photons land on the guard cells'
 *    chloroplasts, shades back on; the guard cells swell and bow apart (the pore opens), the sign strikes
 *    OPEN and the waiting CO2 diffuse in one by one, excited ("You're in!").
 *  - recap: the visible layers are named again as the narrator lists them.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE, W2 } from "../../../brand/tokens";
import { HAND } from "../../../brand/fonts";
import { CO2Buddy, Chloro, ChloroMood, ChloroPose, NeonSign, O2Buddy, Sparkle, SpeechBubble, WorldStage } from "../../../components/fun";
import { Stoma, stomaOuterHalf } from "../../../components/fun/Stoma";
import { CellBlob, CellPaint, PillCell } from "../../../components/fun/CartoonCells";
import { DayNightDial } from "../../../components/fun/DayNightDial";
import { DashArrow, PillLabel, Route, makeRoute, routeAt } from "../../../components/fun/PillLabel";
import { useNarrationTalk } from "../../../components/fun/narrationTalk";
import { Photon, SunBeams } from "../../../components/Light";
import { HandCircle, mix } from "../../../components/kit";
import { Pt, rng } from "../../../lib/geometry";
import { pulse, track } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s10Timing } from "../scenes/S10Layers.timing";

// ------------------------------------------------------------------ layout (1920×1080)
const PORE: Pt = [960, 605];
const GLEN = 300; // guard cell length
const GIRTH = 92;
const PORE_W = 74;
const EPI_TOP = 562;
const EPI_H = 86;
const AIR_TOP = EPI_TOP + EPI_H; // outside air below this
const POCKET: Pt = [960, 400]; // sub-stomatal air space
const BUNDLE: Pt = [290, 336];
const BUNDLE_R = 116;
const SIGN: Pt = [960, 204];
const DIAL: Pt = [1712, 206];
const CHLORO: Pt = [1688, 962];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lin = (f: number, a: number, len: number) => clamp01((f - a) / Math.max(1, len));

// ------------------------------------------------------------------ the tissue (deterministic)
type Cell = { cx: number; cy: number; rx: number; ry: number; rot: number; seed: number };

const SPONGY: Cell[] = (() => {
  const r = rng(1010);
  const raw: Cell[] = [];
  const rows = [170, 292, 412, 506];
  rows.forEach((y0, ri) => {
    for (let ci = -1; ci < 14; ci++) {
      const cx = ci * 158 + (ri % 2 ? 79 : 0) + (r() - 0.5) * 36;
      const cy = y0 + (r() - 0.5) * 22;
      const rad = 52 + r() * 11;
      const asp = 1.06 + r() * 0.2;
      const rx = rad * asp;
      const ry = (rad / asp) * (ri === 3 ? 0.8 : 1.04);
      const rot = (r() - 0.5) * 28;
      const pocket = ((cx - POCKET[0]) / (186 + rx)) ** 2 + ((cy - POCKET[1]) / (160 + ry)) ** 2 < 1;
      const bundle = Math.hypot(cx - BUNDLE[0], cy - BUNDLE[1]) < BUNDLE_R + rad * 0.85;
      if (pocket || bundle) continue;
      raw.push({ cx, cy, rx, ry, rot, seed: 100 + ri * 40 + ci });
    }
  });
  // keep air spaces between neighbours: shrink any pair that crowds
  const rad = (c: Cell, ang: number) => (c.rx * c.ry) / Math.sqrt((c.ry * Math.cos(ang)) ** 2 + (c.rx * Math.sin(ang)) ** 2);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < raw.length; i++) {
      for (let j = i + 1; j < raw.length; j++) {
        const a = raw[i];
        const b = raw[j];
        const d = Math.hypot(b.cx - a.cx, b.cy - a.cy);
        const ang = Math.atan2(b.cy - a.cy, b.cx - a.cx);
        const need = rad(a, ang) + rad(b, ang) + 20;
        if (d < need) {
          const k = Math.max(0.6, (d - 20) / (need - 20));
          raw[i] = { ...a, rx: a.rx * k, ry: a.ry * k };
          raw[j] = { ...b, rx: b.rx * k, ry: b.ry * k };
        }
      }
    }
  }
  return raw;
})();

const nearestCell = (p: Pt) => SPONGY.reduce((best, c) => (Math.hypot(c.cx - p[0], c.cy - p[1]) < Math.hypot(best.cx - p[0], best.cy - p[1]) ? c : best), SPONGY[0]);
/** a point just inside a cell's wall, on the side facing `from` (where a gas is taken in) */
const cellDoor = (c: Cell, from: Pt, depth = 0.45): Pt => {
  const a = Math.atan2(from[1] - c.cy, from[0] - c.cx);
  return [c.cx + Math.cos(a) * c.rx * depth, c.cy + Math.sin(a) * c.ry * depth];
};

// epidermis: fixed cells away from the stoma, two neighbours that stretch as the guard cells swell
const EPI_GAP = 8;
const EPI_LEFT_END = 700;
const EPI_RIGHT_START = 1220;
const EPI_CELLS: [number, number][] = (() => {
  const r = rng(77);
  const out: [number, number][] = [];
  let x = EPI_LEFT_END;
  while (x > -60) {
    const w = 150 + r() * 46;
    out.push([x - w, w - EPI_GAP]);
    x -= w;
  }
  x = EPI_RIGHT_START;
  while (x < 1980) {
    const w = 150 + r() * 46;
    out.push([x + EPI_GAP, w - EPI_GAP]);
    x += w;
  }
  return out;
})();

// ------------------------------------------------------------------ gas characters
type Phase = "day" | "night" | "dawn";
type Buddy = {
  readonly kind: "co2" | "o2";
  readonly seed: number;
  /** wanders around here at first */
  readonly home: Pt;
  /** drifts in from here (off-screen) at `enterAt` */
  readonly from?: Pt;
  readonly enterAt?: number;
  /** at night it drifts to the door and waits */
  readonly wait?: { readonly at: Pt; readonly from: number; readonly bump?: boolean };
  /** then it sets off along its route */
  readonly go?: number;
  readonly travel?: number;
  readonly route?: Route;
  /** fade out at the end of the route (taken in by a cell / drifted away) */
  readonly fade?: "absorb" | "away";
  readonly target?: Cell;
};

const LANE_IN = 952; // carbon dioxide through the pore (left of centre)
const LANE_OUT = 970; // oxygen (right of centre)

const inRoute = (start: Pt, pocket: Pt, cell: Cell): Route =>
  makeRoute([start, [LANE_IN + (start[0] - LANE_IN) * 0.35, 812], [LANE_IN, 728], [LANE_IN, 605], [LANE_IN, 488], pocket, cellDoor(cell, pocket)]);
const outRoute = (start: Pt, end: Pt): Route =>
  makeRoute([start, [LANE_OUT, 470], [LANE_OUT, 605], [LANE_OUT, 735], [1040, 800], [1180, 806], end]);

/** cells around the air space that take the carbon dioxide in */
const LEFT_CELLS = SPONGY.filter((c) => c.cx < 930 && c.cx > 600 && c.cy > 200).sort((a, b) => Math.hypot(a.cx - 960, a.cy - 400) - Math.hypot(b.cx - 960, b.cy - 400));
const RIGHT_CELLS = SPONGY.filter((c) => c.cx > 990 && c.cx < 1320 && c.cy > 200).sort((a, b) => Math.hypot(a.cx - 960, a.cy - 400) - Math.hypot(b.cx - 960, b.cy - 400));
const pickCell = (side: "l" | "r", i: number) => {
  const list = side === "l" ? LEFT_CELLS : RIGHT_CELLS;
  return list[Math.min(i, list.length - 1)] ?? SPONGY[0];
};

type Beats = ReturnType<typeof beatsOf>;
const beatsOf = (k: ReturnType<typeof s10Timing>) => {
  const dusk = k.guard + 2;
  const close = Math.max(k.closed, dusk + 20);
  const flex = Math.min(k.opened, close - 22);
  const dawn = k.guardOpen + 6;
  const reopen = Math.max(k.reopen, dawn + 20);
  return {
    co2Label: k.diffusesIn,
    o2Go: k.oxygen - 6,
    o2Label: k.oxygen + 2,
    dusk,
    flex,
    close,
    label: k.guardWord,
    dawn,
    photons: k.inLight - 4,
    reopen,
    in2: k.co2Again,
    end: k.recap,
  };
};

const buddiesFor = (k: ReturnType<typeof s10Timing>, b: Beats): Buddy[] => {
  const g = k.gases;
  // before the range: carbon dioxide already inside diffuses through the air spaces to the cells
  const inside: Buddy[] = [
    { kind: "co2", seed: 41, home: [905, 330], go: k.carbon, travel: 96, fade: "absorb", target: pickCell("l", 0) },
    { kind: "co2", seed: 42, home: [1030, 300], go: k.carbon + 18, travel: 96, fade: "absorb", target: pickCell("r", 0) },
    { kind: "co2", seed: 43, home: [965, 262], go: k.carbon + 36, travel: 104, fade: "absorb", target: pickCell("r", 1) },
  ].map((x) => ({ ...x, route: makeRoute([x.home, [x.home[0] + (x.target.cx - x.home[0]) * 0.5, x.home[1] - 16], cellDoor(x.target, x.home)]) }) as Buddy);

  // daytime: carbon dioxide from the outside air diffuses in through the open stoma
  const dayIn: { seed: number; home: Pt; go: number; travel: number; pocket: Pt; cell: Cell }[] = [
    { seed: 1, home: [842, 790], go: g + 4, travel: 92, pocket: [892, 402], cell: pickCell("l", 0) },
    { seed: 2, home: [690, 828], go: g + 30, travel: 104, pocket: [1020, 380], cell: pickCell("r", 0) },
    { seed: 3, home: [500, 756], go: g + 56, travel: 118, pocket: [872, 330], cell: pickCell("l", 1) },
    { seed: 4, home: [880, 872], go: g + 82, travel: 96, pocket: [1046, 432], cell: pickCell("r", 1) },
  ];
  const day: Buddy[] = dayIn.map((d) => ({ kind: "co2", seed: d.seed, home: d.home, go: d.go, travel: d.travel, route: inRoute(d.home, d.pocket, d.cell), fade: "absorb", target: d.cell }));

  // the ones that arrive at the door as it shuts, wait (sleepy), and go in when the light returns
  const step = Math.max(16, Math.min(22, (b.end - 30 - (b.reopen + 22)) / 3));
  const w0 = b.reopen + 22;
  const waiters: { seed: number; home: Pt; at: Pt; from: number; bump?: boolean; go: number; pocket: Pt; cell: Cell; enter?: [Pt, number] }[] = [
    { seed: 5, home: [318, 812], at: [956, 806], from: b.dusk + 6, bump: true, go: w0, pocket: [900, 380], cell: pickCell("l", 2) },
    { seed: 6, home: [170, 716], at: [872, 830], from: b.dusk + 18, go: w0 + step, pocket: [1030, 400], cell: pickCell("r", 2) },
    { seed: 7, home: [590, 716], at: [1046, 818], from: b.dusk + 10, go: w0 + step * 2, pocket: [930, 330], cell: pickCell("l", 3) },
    { seed: 8, home: [420, 790], at: [790, 812], from: b.dusk + 26, go: w0 + step * 3, pocket: [1000, 350], cell: pickCell("r", 3), enter: [[-90, 760], g + 70] },
  ];
  const night: Buddy[] = waiters.map((w) => ({
    kind: "co2",
    seed: w.seed,
    home: w.home,
    from: w.enter?.[0],
    enterAt: w.enter?.[1],
    wait: { at: w.at, from: w.from, bump: w.bump },
    go: w.go,
    travel: 66,
    route: inRoute(w.at, w.pocket, w.cell),
    fade: "absorb",
    target: w.cell,
  }));

  // oxygen made in the cells diffuses out through the stoma
  const o2: Buddy[] = [
    { seed: 21, home: [882, 318] as Pt, go: b.o2Go, end: [1330, 772] as Pt },
    { seed: 22, home: [1050, 300] as Pt, go: b.o2Go + 16, end: [1460, 720] as Pt },
    { seed: 23, home: [985, 250] as Pt, go: b.o2Go + 32, end: [1250, 690] as Pt },
  ].map((o) => ({ kind: "o2", seed: o.seed, home: o.home, go: o.go, travel: 84, route: outRoute(o.home, o.end), fade: "away" }) as Buddy);

  return [...inside, ...day, ...night, ...o2];
};

/** Where a buddy is, how it's turned, and how visible, at frame f. */
const buddyState = (bd: Buddy, f: number, b: Beats) => {
  const wander = (amp: number, salt = 0): Pt => [noise2D(`wx${bd.seed}${salt}`, f / 70, 0) * amp, noise2D(`wy${bd.seed}${salt}`, f / 70, 3) * amp * 0.7];
  let base: Pt = bd.home;
  let opacity = 1;
  let scale = 0.82;
  if (bd.from && bd.enterAt !== undefined) {
    const e = EASE.out(lin(f, bd.enterAt, 70));
    if (f < bd.enterAt) opacity = 0;
    base = [bd.from[0] + (bd.home[0] - bd.from[0]) * e, bd.from[1] + (bd.home[1] - bd.from[1]) * e];
  }
  let bumped = 0;
  if (bd.wait && f >= bd.wait.from) {
    const e = EASE.inOut(lin(f, bd.wait.from, 52));
    const at = bd.wait.at;
    base = [base[0] + (at[0] - base[0]) * e, base[1] + (at[1] - base[1]) * e];
    if (bd.wait.bump) {
      // nose up against the closed door, then bounce back
      const t0 = Math.max(bd.wait.from + 52, b.close + 22);
      bumped = pulse(f, t0, 16);
      base = [base[0], base[1] - bumped * 30];
    }
  }
  let u = 0;
  if (bd.go !== undefined && bd.route && f >= bd.go) {
    u = EASE.inOut(lin(f, bd.go, bd.travel ?? 90));
    base = routeAt(bd.route, u).p;
    if (bd.fade === "absorb") {
      const k = clamp01((u - 0.86) / 0.14);
      opacity *= 1 - k;
      scale *= 1 - 0.55 * k;
    } else if (bd.fade === "away") {
      opacity *= 1 - clamp01((u - 0.72) / 0.28);
    }
  }
  // wobble everywhere except while squeezing through the pore (diffusion is random, the pore is narrow)
  const nearPore = Math.abs(base[0] - PORE[0]) < 160 ? clamp01((Math.abs(base[1] - PORE[1]) - 110) / 110) : 1;
  const w = wander(16 * nearPore, 1);
  const p: Pt = [base[0] + w[0], base[1] + w[1]];
  const upright = Math.abs(p[0] - PORE[0]) < 120 ? 1 - clamp01((Math.abs(p[1] - PORE[1]) - 140) / 80) : 0;
  const tumble = noise2D(`rot${bd.seed}`, f / 90, 0) * 28;
  const rotate = tumble * (1 - upright) + 90 * upright;
  const moving = bd.go !== undefined && f >= bd.go && u < 1;
  return { p, rotate, opacity, scale, moving, bumped };
};

// ------------------------------------------------------------------ small drawn parts
const Palisade: React.FC<{ paint: string }> = ({ paint }) => (
  <g>
    {Array.from({ length: 18 }, (_, i) => {
      const x = -34 + i * 112;
      const bottom = 92 + ((i * 37) % 3) * 6;
      return (
        <g key={i}>
          <rect x={x + 3} y={-80} width={96} height={bottom + 80 + 6} rx={44} fill="#000" opacity={0.2} />
          <rect x={x} y={-86} width={96} height={bottom + 86} rx={44} fill={paint} />
          {[0, 1, 2].map((j) => (
            <ellipse key={j} cx={x + (j % 2 ? 72 : 24)} cy={bottom - 24 - j * 26} rx={11} ry={7} fill={W2.cellDeep} stroke={W2.cellLine} strokeOpacity={0.5} strokeWidth={1.5} />
          ))}
          <rect x={x} y={-86} width={96} height={bottom + 86} rx={44} fill="none" stroke={W2.cellLine} strokeWidth={4} />
        </g>
      );
    })}
  </g>
);

const VascularBundle: React.FC<{ xylemGlow: number; phloemGlow: number }> = ({ xylemGlow, phloemGlow }) => {
  const [bx, by] = BUNDLE;
  const sheath = 15;
  return (
    <g>
      <circle cx={bx + 4} cy={by + 8} r={BUNDLE_R + 6} fill="#000" opacity={0.24} />
      <circle cx={bx} cy={by} r={BUNDLE_R} fill={mix(W2.cellDeep, W2.leafNight, 0.45)} stroke={W2.cellLine} strokeWidth={4} />
      {/* bundle sheath */}
      {Array.from({ length: sheath }, (_, i) => {
        const a = (i / sheath) * Math.PI * 2;
        return <circle key={i} cx={bx + Math.cos(a) * (BUNDLE_R - 14)} cy={by + Math.sin(a) * (BUNDLE_R - 14)} r={19} fill={mix(W2.cellFill, C.paper, 0.35)} stroke={W2.cellLine} strokeWidth={2.5} />;
      })}
      {/* xylem: wide, thick-walled, water inside (top) */}
      {xylemGlow > 0 ? <ellipse cx={bx} cy={by - 34} rx={72} ry={44} fill={C.ice} opacity={0.35 * xylemGlow} /> : null}
      {[
        [-44, -36, 22],
        [0, -50, 26],
        [44, -36, 22],
        [-20, -6, 15],
        [22, -6, 15],
      ].map(([dx, dy, r], i) => (
        <g key={i}>
          <circle cx={bx + dx} cy={by + dy} r={r} fill={mix(C.iceDeep, W2.leafNight, 0.35)} stroke={mix(C.ice, C.paper, 0.45)} strokeWidth={7} />
          <ellipse cx={bx + dx - r * 0.3} cy={by + dy - r * 0.3} rx={r * 0.32} ry={r * 0.18} fill="#FFFFFF" opacity={0.4} />
        </g>
      ))}
      {/* phloem: smaller cells carrying sucrose (bottom) */}
      {phloemGlow > 0 ? <ellipse cx={bx} cy={by + 46} rx={66} ry={34} fill={C.amber} opacity={0.35 * phloemGlow} /> : null}
      {[
        [-36, 40],
        [-12, 48],
        [12, 48],
        [36, 40],
        [-24, 70],
        [0, 74],
        [24, 70],
      ].map(([dx, dy], i) => (
        <circle key={i} cx={bx + dx} cy={by + dy} r={11.5} fill={mix(C.amber, W2.cellDeep, 0.45)} stroke={mix(C.amberDeep, W2.cellLine, 0.4)} strokeWidth={2.5} />
      ))}
    </g>
  );
};

const Breeze: React.FC<{ f: number }> = ({ f }) => (
  <g opacity={0.14}>
    {[
      [120, 720, 0],
      [1180, 940, 1],
      [520, 960, 2],
      [1460, 860, 3],
    ].map(([x0, y, i]) => {
      const x = x0 + ((f * 0.5 + i * 140) % 260) - 130;
      return <path key={i} d={`M${x},${y} q40,-14 80,0 t80,0 q22,-2 26,-18 q-2,-16 -18,-12`} fill="none" stroke={C.paper} strokeWidth={4} strokeLinecap="round" />;
    })}
  </g>
);

// ------------------------------------------------------------------ the scene
export const V2S10Stomata: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s10Timing(sc);
  const b = beatsOf(k);
  const id = useSvgId("s10v2");
  const talk = useNarrationTalk(3);
  const buddies = React.useMemo(() => buddiesFor(k, b), [k.gases, b.reopen, b.dusk, b.end]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- light and the stoma's state
  const night = track(f, [
    [b.dusk, 0],
    [b.dusk + 30, 1, EASE.inOut],
    [b.dawn, 1],
    [b.dawn + 26, 0, EASE.inOut],
  ]);
  const open = track(f, [
    [b.flex - 2, 1],
    [b.flex + 8, 1.15, EASE.out],
    [b.flex + 20, 1],
    [b.close, 1],
    [b.close + 24, 0, EASE.inOut],
    [b.reopen, 0],
    [b.reopen + 16, 1.12, EASE.out],
    [b.reopen + 30, 1, EASE.inOut],
  ]);
  const gLight = track(f, [
    [b.dusk, 0.55],
    [b.dusk + 30, 0],
    [b.photons + 14, 0],
    [b.photons + 30, 1, EASE.out],
    [b.reopen + 50, 0.6],
  ]);
  const shades = track(f, [
    [b.dusk + 4, 1],
    [b.dusk + 20, 0, EASE.inOut],
    [b.photons + 22, 0],
    [b.photons + 28, 1, EASE.in],
  ]);
  const proud = f >= b.flex - 2 && f < b.flex + 22;
  const asleep = f >= b.close + 14 && f < b.dawn + 8;
  const thrilled = f >= b.reopen && f < b.end;
  const sEyes = asleep ? "sleepy" : proud ? "happy" : "open";
  const sMouth = asleep ? "flat" : proud || thrilled ? "grin" : "smile";

  // ---- the neon sign flips over (like a shop door sign) and strikes
  const flip1 = lin(f, b.close, 12);
  const flip2 = lin(f, b.reopen, 12);
  const closedSide = (flip1 >= 0.5 && f < b.reopen) || (f >= b.reopen && flip2 < 0.5);
  const flipU = f >= b.reopen ? flip2 : flip1;
  const signSX = Math.max(0.02, Math.abs(Math.cos(flipU * Math.PI)));
  const signOn = closedSide
    ? lin(f, b.close + 14, 14)
    : f >= b.reopen
      ? lin(f, b.reopen + 12, 14)
      : f >= b.close
        ? 0
        : 1;
  const signSwing = Math.sin(lin(f, b.close, 40) * Math.PI * 3) * (1 - lin(f, b.close, 40)) * 6 + Math.sin(lin(f, b.reopen, 40) * Math.PI * 3) * (1 - lin(f, b.reopen, 40)) * 6;

  // ---- beams: fade at dusk, sweep down from the top at dawn
  const beamReveal = f < b.dawn - 2 ? 1 : EASE.out(lin(f, b.dawn - 2, 26));
  const beamsOn = 1 - night;

  // ---- pre-range highlights
  const airTint = pulse(f, k.airWord - 4, 70);
  const surface = pulse(f, k.large - 4, 90);
  const xylemGlow = pulse(f, k.xylemWord - 4, 80);
  const phloemGlow = pulse(f, k.phloemWord - 4, 80);
  const epiGlow = pulse(f, k.lowerWord - 4, 70);

  // a cell "gulps" when it takes carbon dioxide in
  const gulpOf = (c: Cell) =>
    buddies.reduce((acc, bd) => {
      if (bd.target !== c || bd.go === undefined) return acc;
      const arrive = bd.go + (bd.travel ?? 90) * 0.93;
      return Math.max(acc, pulse(f, arrive, 14));
    }, 0);

  // ---- Chloro the host
  let mood: ChloroMood = "explain";
  let pose: ChloroPose = "rest";
  let look: [number, number] = [0.4, -0.3];
  if (f >= k.spongyWord && f < k.air) pose = "point";
  if (f >= k.lowerWord && f < k.gases - 12) pose = "point";
  if (f >= k.gases - 12 && f < b.dusk) {
    pose = "point";
    look = [0.6, -0.2];
  }
  if (f >= b.dusk && f < b.dawn) {
    mood = "worried";
    pose = "hold";
    look = [-0.2, -1];
  }
  if (f >= b.dawn && f < b.in2) {
    mood = "celebrate";
    pose = "cheer";
  }
  if (f >= b.in2 && f < b.end) {
    mood = "happy";
    pose = "point";
    look = [0.7, 0];
  }
  const chloroTalk = mood === "explain" || mood === "happy" ? talk : 0;
  const chloroBounce = lin(f, b.dawn + 2, 16) * (f < b.dawn + 18 ? 1 : 0) + lin(f, b.dusk + 30, 14) * (f < b.dusk + 44 ? 1 : 0);

  // ---- labels
  const lab = (start: number, end: number, len = 18) => ({ progress: lin(f, start, len), out: lin(f, end, 12) });
  const spongyCell = nearestCell([690, 300]);
  const airA = nearestCell([1300, 290]);
  const airB = nearestCell([1458, 300]);
  const airC = nearestCell([1380, 412]);
  const recapFor = (start: number, next: number) => lab(start, Math.max(start + 34, next));

  // dashed arrows
  const co2Arrow: Pt[] = [[800, 866], [900, 822], [936, 740], [938, 600], [930, 470], [900, 420]];
  const o2Arrow: Pt[] = [[1012, 420], [984, 470], [984, 600], [988, 740], [1050, 830], [1150, 866]];

  // photons from the light above, onto the guard cells' chloroplasts
  const photonTargets: Pt[] = [
    [896, 640],
    [1024, 640],
    [902, 696],
    [1018, 696],
    [912, 520],
    [1008, 520],
  ];

  const epiOpenHalf = stomaOuterHalf(open, GIRTH, PORE_W, 0.29) - 8;
  const nightTint = 0.5 * night;

  return (
    <WorldStage world="leaf">
      <CellPaint id={`${id}-sp`} light={mix(W2.cellFill, W2.chloroLight, 0.55)} mid={W2.cellFill} deep={W2.cellDeep} />
      <CellPaint id={`${id}-pal`} light={W2.chloroLight} mid={mix(W2.cellFill, W2.chloroMid, 0.5)} deep={W2.cellDeep} />
      <CellPaint id={`${id}-epi`} light={mix(W2.cellFill, C.paper, 0.78)} mid={mix(W2.cellFill, C.paper, 0.55)} deep={mix(W2.cellFill, C.paper, 0.2)} />
      <defs>
        <linearGradient id={`${id}-air`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(W2.leafNight, C.ice, 0.3)} />
          <stop offset="1" stopColor={mix(W2.leafNightDeep, C.ice, 0.1)} />
        </linearGradient>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.sun} stopOpacity={0.26} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-pocket`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.sun} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-beamclip`}>
          <rect x={0} y={-200} width={1920} height={1400 * beamReveal} />
        </clipPath>
      </defs>

      {/* daylight from above, and the air spaces */}
      <rect x={0} y={0} width={1920} height={AIR_TOP} fill={`url(#${id}-sky)`} opacity={1 - night} />
      {airTint > 0 ? <rect x={0} y={90} width={1920} height={EPI_TOP - 90} fill={C.ice} opacity={0.16 * airTint} /> : null}
      <ellipse cx={POCKET[0]} cy={POCKET[1] + 30} rx={260} ry={220} fill={`url(#${id}-pocket)`} opacity={1 - night} />

      <Palisade paint={`url(#${id}-pal)`} />
      <VascularBundle xylemGlow={xylemGlow} phloemGlow={phloemGlow} />
      {SPONGY.map((c) => (
        <CellBlob
          key={c.seed}
          cx={c.cx}
          cy={c.cy}
          rx={c.rx}
          ry={c.ry}
          rot={c.rot}
          seed={c.seed}
          paint={`url(#${id}-sp)`}
          plastids={6}
          glow={surface}
          glowColor={C.amberLight}
          scale={1 + 0.05 * gulpOf(c)}
        />
      ))}

      {/* outside air */}
      <rect x={0} y={AIR_TOP - 12} width={1920} height={1080 - AIR_TOP + 12} fill={`url(#${id}-air)`} />
      <Breeze f={f} />

      {/* the pore (behind everything that passes through it) */}
      <Stoma x={PORE[0]} y={PORE[1]} length={GLEN} girth={GIRTH} poreWidth={PORE_W} open={open} light={gLight} dim={night} layer="back" poreColors={[W2.leafNight, mix(W2.leafNight, C.ice, 0.3)]} />

      {/* the gases */}
      {buddies.map((bd, i) => {
        const s = buddyState(bd, f, b);
        if (s.opacity <= 0.01) return null;
        const phase: Phase = f < b.dusk ? "day" : f < b.dawn ? "night" : "dawn";
        if (bd.kind === "o2") {
          return <O2Buddy key={i} x={s.p[0]} y={s.p[1]} scale={s.scale} rotate={s.rotate} mood={s.moving ? "excited" : "happy"} opacity={s.opacity} jiggle={2} seed={bd.seed} look={s.moving ? 1 : 0} />;
        }
        const bm =
          phase === "night" && bd.wait
            ? s.bumped > 0.05 || (f < b.close + 60 && f >= bd.wait.from)
              ? "worried"
              : "sleepy"
            : phase === "night"
              ? "sleepy"
              : phase === "dawn" && bd.wait
                ? "excited"
                : s.moving
                  ? "excited"
                  : "happy";
        return <CO2Buddy key={i} x={s.p[0]} y={s.p[1]} scale={s.scale} rotate={s.rotate} mood={bm} opacity={s.opacity} jiggle={2} seed={bd.seed} look={s.moving ? 0 : -0.4} />;
      })}

      {/* lower epidermis (clear cells, no chloroplasts) */}
      <g>
        {EPI_CELLS.map(([x, w], i) => (
          <PillCell key={i} x={x} y={EPI_TOP} w={w} h={EPI_H} paint={`url(#${id}-epi)`} />
        ))}
        <PillCell x={EPI_LEFT_END + EPI_GAP / 2} y={EPI_TOP} w={PORE[0] - epiOpenHalf - EPI_LEFT_END - EPI_GAP / 2} h={EPI_H} paint={`url(#${id}-epi)`} />
        <PillCell x={PORE[0] + epiOpenHalf} y={EPI_TOP} w={EPI_RIGHT_START - (PORE[0] + epiOpenHalf)} h={EPI_H} paint={`url(#${id}-epi)`} />
        {epiGlow > 0 ? <rect x={-10} y={EPI_TOP - 6} width={1940} height={EPI_H + 12} rx={20} fill="none" stroke={C.amberLight} strokeWidth={8} opacity={0.8 * epiGlow} /> : null}
      </g>

      {/* the guard cells: bouncers in shades */}
      <Stoma
        x={PORE[0]}
        y={PORE[1]}
        length={GLEN}
        girth={GIRTH}
        poreWidth={PORE_W}
        open={open}
        light={gLight}
        dim={night}
        layer="front"
        face
        shades={shades}
        eyes={sEyes}
        mouth={sMouth}
        look={thrilled ? [0, 0.6] : asleep ? [0, 0] : [0, 0.3]}
        seed={4}
      />

      {/* light */}
      <g clipPath={`url(#${id}-beamclip)`}>
        <SunBeams
          source={[1500, -420]}
          beams={[
            [
              [260, 1000],
              [520, 1000],
            ],
            [
              [760, 1000],
              [930, 1000],
            ],
            [
              [1010, 1000],
              [1160, 1000],
            ],
            [
              [1420, 1000],
              [1580, 1000],
            ],
          ]}
          on={0.55 * beamsOn}
          fadeTo={[1100, 1000]}
        />
      </g>
      {photonTargets.map((t, i) => (
        <Photon key={i} from={[t[0] + 330, -60]} to={t} p={(f - b.photons - i * 4) / 24} size={0.9} />
      ))}

      <Chloro
        x={CHLORO[0]}
        y={CHLORO[1]}
        size={236}
        mood={mood}
        pose={pose}
        pointAngle={-14}
        flip
        look={look}
        talk={chloroTalk}
        bounce={chloroBounce}
        seed={5}
      />

      {/* night */}
      {nightTint > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={mix(W2.leafNightDeep, "#000000", 0.25)} opacity={nightTint} /> : null}

      {/* sky window: is it light or dark? */}
      <DayNightDial x={DIAL[0]} y={DIAL[1]} r={78} night={night} />

      {/* the neon sign hanging over the door */}
      <g transform={`rotate(${signSwing} ${SIGN[0]} 0)`}>
        <path d={`M${SIGN[0] - 100},90 L${SIGN[0] - 100 * signSX},132 M${SIGN[0] + 100},90 L${SIGN[0] + 100 * signSX},132`} stroke={mix(C.ink300, C.paper, 0.3)} strokeWidth={4} strokeDasharray="7 5" />
        <g transform={`translate(${SIGN[0]} 0) scale(${signSX} 1) translate(${-SIGN[0]} 0)`}>
          <NeonSign x={SIGN[0]} y={SIGN[1]} text={closedSide ? "CLOSED" : "OPEN"} on={signOn} size={74} color={closedSide ? C.coral : W2.neon} />
        </g>
      </g>

      {/* ---------------- labels: before the preview range */}
      <PillLabel x={560} y={232} text="spongy mesophyll" {...lab(k.spongyWord, k.air + 30)} anchors={[[spongyCell.cx, spongyCell.cy]]} />
      <PillLabel
        x={1380}
        y={250}
        text="air spaces"
        {...lab(k.airWord, k.carbon + 40)}
        color={C.ice}
        anchors={[
          [(airA.cx + airB.cx) / 2, (airA.cy + airB.cy) / 2 + 6],
          [(airA.cx + airC.cx) / 2, (airA.cy + airC.cy) / 2],
        ]}
      />
      <PillLabel x={600} y={330} text="vascular bundle" {...lab(k.vascular, k.plant + 30)} anchors={[[BUNDLE[0] + 80, BUNDLE[1] - 10]]} />
      <PillLabel x={560} y={180} text="xylem" {...lab(k.xylemWord, k.plant + 30)} color={C.ice} anchors={[[BUNDLE[0] + 30, BUNDLE[1] - 40]]} />
      <PillLabel x={600} y={480} text="phloem" {...lab(k.phloemWord, k.plant + 30)} color={C.amber} anchors={[[BUNDLE[0] + 24, BUNDLE[1] + 58]]} />
      <PillLabel x={1330} y={724} text="lower epidermis" {...lab(k.lowerWord, k.onePore + 8)} anchors={[[1300, EPI_TOP + EPI_H / 2]]} />
      <HandCircle cx={PORE[0]} cy={PORE[1]} rx={150} ry={186} progress={lin(f, k.stomataWord - 4, 22)} opacity={1 - lin(f, k.gases + 4, 14)} color={C.amberLight} width={7} seed={3} />
      <PillLabel x={1250} y={808} text="stoma" {...lab(k.onePore, k.gases + 4)} anchors={[[PORE[0] + 2, PORE[1] + 96]]} />
      {f >= k.lower && f < k.gases + 20 ? (
        <text x={150} y={948} fontFamily={HAND} fontWeight={700} fontSize={62} fill={mix(C.ice, C.paper, 0.4)} opacity={lin(f, k.lowerWord, 14) * (1 - lin(f, k.gases + 2, 14))}>
          outside air
        </text>
      ) : null}

      {/* ---------------- the preview range */}
      <DashArrow pts={co2Arrow} progress={lin(f, b.co2Label - 4, 26)} out={lin(f, b.dusk, 12)} color={C.ice} flow={f} />
      <DashArrow pts={o2Arrow} progress={lin(f, b.o2Label - 4, 26)} out={lin(f, b.dusk, 12)} color={C.coral} flow={f} />
      <PillLabel x={590} y={912} text="carbon dioxide in" {...lab(b.co2Label, b.dusk)} color={C.ice} />
      <PillLabel x={1300} y={912} text="oxygen out" {...lab(b.o2Label, b.dusk)} color={C.coral} />

      <PillLabel
        x={PORE[0]}
        y={330}
        text="guard cells"
        {...lab(b.label, b.reopen + 4)}
        color={W2.chloroLight}
        anchors={[
          [PORE[0] - 26, 498],
          [PORE[0] + 26, 498],
        ]}
      />

      {/* in the light: they open, carbon dioxide can diffuse in */}
      <DashArrow pts={co2Arrow} progress={lin(f, b.in2 - 6, 26)} out={lin(f, b.end, 12)} color={C.ice} flow={f} />
      <PillLabel x={590} y={912} text="carbon dioxide in" {...lab(b.in2, b.end)} color={C.ice} />
      <SpeechBubble x={1086} y={352} text="You're in!" size={48} tail={[1046, 540]} progress={lin(f, b.reopen + 26, 14) * (1 - lin(f, b.end - 16, 12))} />
      {[
        [860, 520, 1],
        [1072, 470, 2],
        [1090, 700, 3],
        [836, 690, 4],
      ].map(([x, y, s]) => (
        <Sparkle key={s} x={x} y={y} r={18} seed={s} opacity={pulse(f, b.reopen + 6 + s * 3, 40)} />
      ))}

      {/* ---------------- recap (after the preview range): name what's in view as it's listed */}
      <PillLabel x={520} y={196} text="palisade mesophyll" {...recapFor(k.rPalisade, k.rSpongy)} anchors={[[420, 70]]} />
      <PillLabel x={560} y={232} text="spongy mesophyll" {...recapFor(k.rSpongy, k.rBundle)} anchors={[[spongyCell.cx, spongyCell.cy]]} />
      <PillLabel x={600} y={330} text="vascular bundle" {...recapFor(k.rBundle, k.rLower)} anchors={[[BUNDLE[0] + 80, BUNDLE[1] - 10]]} />
      <PillLabel x={1330} y={724} text="lower epidermis" {...lab(k.rLower, k.end + 999)} anchors={[[1300, EPI_TOP + EPI_H / 2]]} />
      <PillLabel x={1250} y={880} text="stoma" {...lab(k.rStomata, k.end + 999)} anchors={[[PORE[0] + 2, PORE[1] + 96]]} />
      <PillLabel
        x={PORE[0]}
        y={330}
        text="guard cells"
        {...lab(k.rGuard, k.end + 999)}
        color={W2.chloroLight}
        anchors={[
          [PORE[0] - 60, 498],
          [PORE[0] + 60, 498],
        ]}
      />
    </WorldStage>
  );
};
