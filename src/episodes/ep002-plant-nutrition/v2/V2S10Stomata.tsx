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
 *  - gases: the camera pushes in to the stoma (change of scale) and the neon sign strikes OPEN. Carbon
 *    dioxide characters diffuse up from the outside air, through the pore, into the air spaces and are taken
 *    in by the cells (wobbly paths); oxygen made in the cells diffuses down and out. Dashed arrows +
 *    "carbon dioxide in" / "oxygen out".
 *  - guard: a little closer. On "opened" the guard cells swell proudly; on "closed" the light fades (the sun
 *    sets in the sky window), they go limp, the pore shuts and the sign flips to CLOSED. More carbon dioxide
 *    arrives, bonks the shut door and queues, sleepy. "guard cells" with a leader to each cell.
 *  - guardOpen "In the light": light sweeps down, photons land on the guard cells' chloroplasts, shades back
 *    on; the guard cells swell and bow apart (the pore opens), the sign strikes OPEN and the queue diffuses in
 *    one by one, excited ("You're in!").
 *  - recap: the camera pulls back out and the visible layers are named again as the narrator lists them.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE, W2 } from "../../../brand/tokens";
import { HAND } from "../../../brand/fonts";
import { CO2Buddy, Chloro, ChloroMood, ChloroPose, NeonSign, O2Buddy, Sparkle, SpeechBubble, WorldStage } from "../../../components/fun";
import { Stoma, stomaOuterHalf, stomaPoreHalf } from "../../../components/fun/Stoma";
import { CellBlob, CellPaint, PillCell } from "../../../components/fun/CartoonCells";
import { DayNightDial } from "../../../components/fun/DayNightDial";
import { DashArrow, PillLabel, Route, makeRoute, routeAt } from "../../../components/fun/PillLabel";
import { useNarrationTalk } from "../../../components/fun/narrationTalk";
import { Photon, SunBeams } from "../../../components/Light";
import { HandCircle, mix } from "../../../components/kit";
import { ImpactLines } from "../../../components/fun/StudyProps";
import { Pt, rng } from "../../../lib/geometry";
import { pulse, track } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s10Timing } from "../scenes/S10Layers.timing";

// ------------------------------------------------------------------ layout (world = 1920×1080 at zoom 1)
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
// screen-space furniture
const SIGN: Pt = [960, 168];
const DIAL: Pt = [1712, 196];
const CHLORO: Pt = [1690, 962];
// camera: where the pore sits on screen, and how close (gases, then a little closer for the guard cells)
const Z1 = 1.55;
const S1: Pt = [960, 560];
const Z2 = 1.7;
const S2: Pt = [960, 545];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lin = (f: number, a: number, len: number) => clamp01((f - a) / Math.max(1, len));

/** Camera that keeps the pore as its anchor: zoom in log space, the pore glides between screen points. */
type CamKey = { readonly f: number; readonly z: number; readonly S: Pt };
const anchorCam = (f: number, keys: readonly CamKey[]) => {
  let z = keys[0].z;
  let S: Pt = keys[0].S;
  if (f >= keys[keys.length - 1].f) {
    z = keys[keys.length - 1].z;
    S = keys[keys.length - 1].S;
  } else {
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (f >= a.f && f < b.f) {
        const t = EASE.inOut(clamp01((f - a.f) / Math.max(1, b.f - a.f)));
        z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t);
        S = [a.S[0] + (b.S[0] - a.S[0]) * t, a.S[1] + (b.S[1] - a.S[1]) * t];
        break;
      }
    }
  }
  const cx = PORE[0] - (S[0] - 960) / z;
  const cy = PORE[1] - (S[1] - 540) / z;
  return {
    z,
    T: `translate(960 540) scale(${z}) translate(${-cx} ${-cy})`,
    toScreen: (p: Pt): Pt => [(p[0] - cx) * z + 960, (p[1] - cy) * z + 540],
  };
};

/** Eased path through keyed points: [[frame, point], …] (ease-in-out between keys). */
type PK = readonly [number, Pt];
const trackPt = (f: number, keys: readonly PK[]): Pt => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b] = keys[i + 1];
    if (f <= f1) {
      const t = EASE.inOut(clamp01((f - f0) / Math.max(1, f1 - f0)));
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
  }
  return keys[keys.length - 1][1];
};

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
/** a point just inside a cell's wall, on the side facing `from` (where a gas is taken in / given out) */
const cellDoor = (c: Cell, from: Pt, depth = 0.45): Pt => {
  const a = Math.atan2(from[1] - c.cy, from[0] - c.cx);
  return [c.cx + Math.cos(a) * c.rx * depth, c.cy + Math.sin(a) * c.ry * depth];
};
// the cells around the air space under the stoma (in view when the camera is in close)
const CELL_LU = nearestCell([639, 401]);
const CELL_RU = nearestCell([1278, 412]);
const CELL_LL = nearestCell([711, 509]);
const CELL_RL = nearestCell([1169, 512]);

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
type Buddy = {
  readonly kind: "co2" | "o2";
  readonly seed: number;
  /** where it is before it sets off: keyed points it drifts between (it wanders around them) */
  readonly keys: readonly PK[];
  /** pops in at this frame (oxygen made in a cell) */
  readonly appear?: number;
  /** queued outside the shut stoma from this frame (until `go`) */
  readonly queued?: number;
  /** stands up in the queue (upright, like someone waiting in line) at this frame */
  readonly standAt?: number;
  /** bonks the shut pore at this frame */
  readonly bonk?: number;
  /** then it sets off along its route */
  readonly go?: number;
  readonly travel?: number;
  readonly route?: Route;
  /** fade out at the end of the route (taken in by a cell / drifted away) */
  readonly fade?: "absorb" | "away";
  readonly target?: Cell;
  readonly source?: Cell;
};

const LANE_IN = 950; // carbon dioxide through the pore (left of centre)
const LANE_OUT = 972; // oxygen (right of centre)

const inRoute = (start: Pt, pocket: Pt, cell: Cell): Route =>
  makeRoute([start, [start[0] + (LANE_IN - start[0]) * 0.6, 792], [LANE_IN, 742], [LANE_IN, 605], [LANE_IN, 492], pocket, cellDoor(cell, pocket)]);
const outRoute = (start: Pt, end: Pt): Route =>
  makeRoute([start, [LANE_OUT + (start[0] - LANE_OUT) * 0.3, 452], [LANE_OUT, 505], [LANE_OUT, 605], [LANE_OUT, 735], [1046, 792], end]);

// queue spots outside the shut stoma (to the left of the door, clear of the labels)
/** the first one arrives as the pore shuts, and bonks it */
const BONK = (b: { close: number }) => b.close + 16;
const QUEUE: Pt[] = [
  [862, 744],
  [782, 750],
  [702, 743],
  [622, 749],
];
const DOOR: Pt = [957, 790]; // just below the pore

type Beats = ReturnType<typeof beatsOf>;
const beatsOf = (k: ReturnType<typeof s10Timing>) => {
  const dusk = k.closed - 6; // the light fades as the narrator says "closed"
  const close = dusk + 8;
  const flex = k.opened - 2;
  const dawn = k.guardOpen + 6;
  const reopen = Math.max(k.reopen, dawn + 20);
  return {
    co2Label: k.diffusesIn,
    o2Go: k.oxygen - 6,
    o2Label: k.oxygen + 2,
    gasOut: k.guard + 4,
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
  const insideSpec: { seed: number; home: Pt; go: number; travel: number; target: Cell }[] = [
    { seed: 41, home: [905, 330], go: k.carbon, travel: 96, target: CELL_LU },
    { seed: 42, home: [1030, 300], go: k.carbon + 18, travel: 96, target: CELL_RU },
    { seed: 43, home: [965, 262], go: k.carbon + 36, travel: 104, target: nearestCell([1200, 288]) },
  ];
  const inside: Buddy[] = insideSpec.map((x) => ({
    kind: "co2",
    seed: x.seed,
    keys: [[0, x.home]],
    go: x.go,
    travel: x.travel,
    fade: "absorb",
    target: x.target,
    route: makeRoute([x.home, [x.home[0] + (x.target.cx - x.home[0]) * 0.5, x.home[1] - 16], cellDoor(x.target, x.home)]),
  }));

  // daytime: carbon dioxide from the outside air diffuses in through the open stoma, to the cells
  const dayIn: { seed: number; home: Pt; go: number; travel: number; pocket: Pt; cell: Cell }[] = [
    { seed: 1, home: [792, 721], go: g + 4, travel: 92, pocket: [900, 430], cell: CELL_LL },
    { seed: 2, home: [838, 795], go: g + 30, travel: 96, pocket: [1024, 424], cell: CELL_RL },
    { seed: 3, home: [650, 708], go: g + 56, travel: 110, pocket: [880, 404], cell: CELL_LU },
    { seed: 4, home: [534, 753], go: g + 82, travel: 116, pocket: [1040, 448], cell: CELL_RU },
  ];
  const day: Buddy[] = dayIn.map((d) => ({ kind: "co2", seed: d.seed, keys: [[0, d.home]], go: d.go, travel: d.travel, route: inRoute(d.home, d.pocket, d.cell), fade: "absorb", target: d.cell }));

  // more carbon dioxide drifts up as the stoma shuts: it waits outside, then goes in when the light returns
  const step = 18;
  const w0 = b.reopen + 18;
  const arrive = k.guard - 4;
  const waiters: { seed: number; home: Pt; spot: Pt; from: number; go: number; pocket: Pt; cell: Cell; bump?: boolean }[] = [
    { seed: 5, home: [330, 780], spot: QUEUE[0], from: arrive, go: w0, pocket: [902, 428], cell: CELL_LL, bump: true },
    { seed: 6, home: [180, 720], spot: QUEUE[1], from: arrive + 10, go: w0 + step, pocket: [1026, 420], cell: CELL_RL },
    { seed: 7, home: [250, 830], spot: QUEUE[2], from: arrive + 20, go: w0 + step * 2, pocket: [884, 404], cell: CELL_LU },
    { seed: 8, home: [90, 760], spot: QUEUE[3], from: arrive + 30, go: w0 + step * 3, pocket: [1040, 446], cell: CELL_RU },
  ];
  const night: Buddy[] = waiters.map((w) => {
    const keys: PK[] = w.bump
      ? [
          [w.from, w.home],
          [b.close + 2, DOOR],
          [b.close + 28, DOOR],
          [b.close + 46, w.spot],
        ]
      : [
          [w.from, w.home],
          [w.from + 66, w.spot],
        ];
    return {
      kind: "co2",
      seed: w.seed,
      keys,
      queued: b.close + 20,
      standAt: w.bump ? b.close + 46 : w.from + 66,
      bonk: w.bump ? BONK(b) : undefined,
      go: w.go,
      travel: 66,
      route: inRoute(w.spot, w.pocket, w.cell),
      fade: "absorb",
      target: w.cell,
    };
  });

  // oxygen made in the cells diffuses out through the stoma
  const o2Spec: { seed: number; cell: Cell; toward: Pt; end: Pt }[] = [
    { seed: 21, cell: CELL_LL, toward: [920, 440], end: [1232, 782] },
    { seed: 22, cell: CELL_RL, toward: [1000, 440], end: [1330, 716] },
    { seed: 23, cell: CELL_RU, toward: [1000, 420], end: [1150, 742] },
  ];
  const o2: Buddy[] = o2Spec.map((o, i) => {
    const start = cellDoor(o.cell, o.toward, 0.62);
    const go = b.o2Go + i * 16;
    return { kind: "o2", seed: o.seed, keys: [[0, start]], appear: go - 22, go, travel: 86, route: outRoute(start, o.end), fade: "away", source: o.cell };
  });

  return [...inside, ...day, ...night, ...o2];
};

/** Where a buddy is, how it's turned, and how visible, at frame f. */
const buddyState = (bd: Buddy, f: number) => {
  let base: Pt = trackPt(f, bd.keys);
  let opacity = 1;
  let scale = 0.82;
  let pop = 1;
  if (bd.appear !== undefined) {
    if (f < bd.appear) return null;
    pop = lin(f, bd.appear, 14);
  }
  const queued = bd.queued !== undefined && f >= bd.queued && (bd.go === undefined || f < bd.go);
  let bumped = 0;
  if (bd.bonk !== undefined) {
    bumped = pulse(f, bd.bonk, 12);
    base = [base[0], base[1] - bumped * 34];
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
      opacity *= 1 - clamp01((u - 0.78) / 0.22);
    }
  }
  // random wobble (diffusion), except while squeezing through the narrow pore; small while queued
  const nearPore = Math.abs(base[0] - PORE[0]) < 160 ? clamp01((Math.abs(base[1] - PORE[1]) - 110) / 110) : 1;
  const amp = (queued ? 5 : 16) * nearPore * (bd.appear !== undefined && u === 0 ? 0.3 : 1);
  const w: Pt = [noise2D(`wx${bd.seed}`, f / 70, 0) * amp, noise2D(`wy${bd.seed}`, f / 70, 3) * amp * 0.7];
  const p: Pt = [base[0] + w[0], base[1] + w[1]];
  const upright = Math.abs(p[0] - PORE[0]) < 120 ? 1 - clamp01((Math.abs(p[1] - PORE[1]) - 140) / 80) : 0;
  const tumble = noise2D(`rot${bd.seed}`, f / 90, 0) * (queued ? 10 : 28);
  const free = tumble * (1 - upright) + 90 * upright;
  // in the queue it stands upright, like someone waiting in line (until it sets off)
  const stand = bd.standAt === undefined ? 0 : EASE.out(lin(f, bd.standAt - 12, 16)) * (bd.go === undefined ? 1 : 1 - lin(f, bd.go, 14));
  const rotate = free + (90 + tumble * 0.25 - free) * stand;
  const moving = bd.go !== undefined && f >= bd.go && u < 1;
  return { p, rotate, opacity, scale, pop, moving, bumped, queued };
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
      [1300, 690, 4],
    ].map(([x0, y, i]) => {
      const x = x0 + ((f * 0.5 + i * 140) % 260) - 130;
      return <path key={i} d={`M${x},${y} q40,-14 80,0 t80,0 q22,-2 26,-18 q-2,-16 -18,-12`} fill="none" stroke={C.paper} strokeWidth={4} strokeLinecap="round" />;
    })}
  </g>
);

/** guard-cell chloroplast positions (world), for the photons to land on */
const guardPlastids = (open: number): Pt[] => {
  const L = GLEN / 2;
  const spots: [number, number][] = [
    [-0.66, 0.56],
    [0.2, 0.52],
    [0.72, 0.5],
  ];
  const out: Pt[] = [];
  for (const side of [-1, 1]) {
    for (const [t, s] of spots) {
      const xi = stomaPoreHalf(open, PORE_W, t);
      const xo = stomaOuterHalf(open, GIRTH, PORE_W, t);
      out.push([PORE[0] + side * (xi + (xo - xi) * s), PORE[1] + t * L]);
    }
  }
  return out;
};

// ------------------------------------------------------------------ the scene
export const V2S10Stomata: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s10Timing(sc);
  const b = beatsOf(k);
  const id = useSvgId("s10v2");
  const talk = useNarrationTalk(3);
  const buddies = React.useMemo(() => buddiesFor(k, b), [k.gases, k.guard, b.reopen, b.close, b.o2Go]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- camera: in to one stoma (change of scale), a little closer for the guard cells, back out for the recap
  const cam = anchorCam(f, [
    { f: k.zoomIn[0], z: 1, S: PORE },
    { f: k.zoomIn[1], z: Z1, S: S1 },
    { f: k.zoomGuard[0], z: Z1, S: S1 },
    { f: k.zoomGuard[1], z: Z2, S: S2 },
    { f: k.zoomOut[0], z: Z2, S: S2 },
    { f: Math.max(k.zoomOut[1], k.zoomOut[0] + 40), z: 1, S: PORE },
  ]);
  const toS = cam.toScreen;
  const focus = lin(f, k.zoomIn[0], 30) * (1 - lin(f, k.zoomOut[0], 30));

  // ---- light and the stoma's state
  const night = track(f, [
    [b.dusk, 0],
    [b.dusk + 30, 1, EASE.inOut],
    [b.dawn, 1],
    [b.dawn + 26, 0, EASE.inOut],
  ]);
  const open = track(f, [
    [b.flex - 2, 1],
    [b.flex + 8, 1.18, EASE.out],
    [b.flex + 20, 1],
    [b.close, 1],
    [b.close + 24, 0, EASE.inOut],
    [b.reopen, 0],
    [b.reopen + 16, 1.14, EASE.out],
    [b.reopen + 30, 1, EASE.inOut],
  ]);
  const gLight = track(f, [
    [b.dusk, 0.45],
    [b.dusk + 30, 0],
    [b.photons + 20, 0],
    [b.photons + 34, 1, EASE.out],
    [b.reopen + 50, 0.55],
  ]);
  const shades = track(f, [
    [b.dusk + 4, 1],
    [b.dusk + 20, 0, EASE.inOut],
    [b.photons + 24, 0],
    [b.photons + 32, 1, EASE.in],
  ]);
  const proud = f >= b.flex - 2 && f < b.flex + 22;
  const asleep = f >= b.close + 14 && f < b.photons + 22;
  const thrilled = f >= b.reopen && f < b.end;
  const sEyes = asleep ? "sleepy" : proud ? "happy" : "open";
  const sMouth = asleep ? "flat" : proud || thrilled ? "grin" : "smile";

  // ---- the neon sign: strikes as we arrive, flips over at closing time (like a shop door sign) and back
  const signIn = lin(f, k.gases + 4, 12);
  const flip1 = lin(f, b.close, 12);
  const flip2 = lin(f, b.reopen, 12);
  const closedSide = (flip1 >= 0.5 && f < b.reopen) || (f >= b.reopen && flip2 < 0.5);
  const flipU = f >= b.reopen ? flip2 : flip1;
  const signSX = Math.max(0.02, Math.abs(Math.cos(flipU * Math.PI)));
  const signOn = closedSide ? lin(f, b.close + 12, 14) : f >= b.reopen ? lin(f, b.reopen + 12, 14) : f >= b.close ? 0 : lin(f, k.gases + 10, 16);
  const swingAt = (t0: number) => Math.sin(lin(f, t0, 40) * Math.PI * 3) * (1 - lin(f, t0, 40)) * 6;
  const signSwing = swingAt(b.close) + swingAt(b.reopen) + swingAt(k.gases + 4) * 0.6;
  const signOut = lin(f, k.zoomOut[0], 14);

  // ---- light: soft beams by day; at dawn they sweep down from the top
  const beamReveal = f < b.dawn - 2 ? 1 : EASE.out(lin(f, b.dawn - 2, 28));
  const beamOn = (1 - night) * (0.55 + 0.45 * track(f, [
    [b.dawn, 0],
    [b.dawn + 22, 1, EASE.out],
    [b.reopen + 30, 1],
    [b.reopen + 70, 0],
  ]));
  // the morning light floods down from above
  const sunrise = track(f, [
    [b.dawn - 2, 0],
    [b.dawn + 24, 1, EASE.out],
    [b.reopen + 24, 0.8],
    [b.end, 0.25],
  ]);

  // ---- pre-range highlights
  const airTint = pulse(f, k.airWord - 4, 70);
  const surface = pulse(f, k.large - 4, 90);
  const xylemGlow = pulse(f, k.xylemWord - 4, 80);
  const phloemGlow = pulse(f, k.phloemWord - 4, 80);
  const epiGlow = pulse(f, k.lowerWord - 4, 70);

  // a cell "gulps" when it takes carbon dioxide in, and puffs when it gives oxygen out
  const gulpOf = (c: Cell) =>
    buddies.reduce((acc, bd) => {
      if (bd.target === c && bd.go !== undefined) return Math.max(acc, pulse(f, bd.go + (bd.travel ?? 90) * 0.93, 14));
      if (bd.source === c && bd.appear !== undefined) return Math.max(acc, 0.7 * pulse(f, bd.appear - 2, 14));
      return acc;
    }, 0);

  // ---- Chloro the host
  let mood: ChloroMood = "explain";
  let pose: ChloroPose = "rest";
  let look: [number, number] = [-0.4, -0.3];
  if (f >= k.spongyWord && f < k.air) pose = "point";
  if (f >= k.lowerWord && f < k.gases - 12) pose = "point";
  if (f >= k.gases - 12 && f < b.flex) {
    pose = "point";
    look = [-0.7, -0.2];
  }
  if (f >= b.flex && f < b.dusk) {
    mood = "happy";
    pose = "present";
    look = [-0.7, -0.3];
  }
  if (f >= b.dusk && f < b.dawn) {
    mood = "worried";
    pose = "hold";
    look = [0.2, -1];
  }
  if (f >= b.dawn && f < b.reopen) {
    mood = "shocked";
    pose = "point";
    look = [-0.3, -1];
  }
  if (f >= b.reopen && f < b.in2) {
    mood = "celebrate";
    pose = "cheer";
  }
  if (f >= b.in2 && f < b.end) {
    mood = "happy";
    pose = "point";
    look = [-0.7, 0];
  }
  const chloroTalk = mood === "explain" || mood === "happy" ? talk : 0;
  const chloroBounce = lin(f, b.reopen + 2, 16) * (f < b.reopen + 18 ? 1 : 0) + lin(f, b.dusk + 30, 14) * (f < b.dusk + 44 ? 1 : 0);

  // ---- labels
  const lab = (start: number, end: number, len = 18) => ({ progress: lin(f, start, len), out: lin(f, end, 12) });
  const spongyCell = nearestCell([690, 300]);
  const airA = nearestCell([1300, 290]);
  const airB = nearestCell([1458, 300]);
  const airC = nearestCell([1380, 412]);
  const recapFor = (start: number, next: number) => lab(start, Math.max(start + 34, next));

  // dashed arrows (world): carbon dioxide up and in, oxygen down and out — through the pore
  const co2Arrow: Pt[] = [[790, 806], [902, 784], [942, 730], [946, 605], [942, 492], [902, 436]];
  const o2Arrow: Pt[] = [[1018, 436], [978, 492], [976, 605], [980, 728], [1040, 790], [1164, 806]];

  // photons: from the light above (screen), onto the guard cells' chloroplasts
  const plastids = guardPlastids(Math.min(1, open));

  const epiOpenHalf = stomaOuterHalf(open, GIRTH, PORE_W, 0.29) - 8;
  const nightTint = 0.5 * night;
  const stomaFace = toS([PORE[0] + 82, PORE[1] - 45]);

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
        <radialGradient id={`${id}-focus`} gradientUnits="userSpaceOnUse" cx={PORE[0]} cy={PORE[1] - 70} r={720}>
          <stop offset="0" stopColor={W2.leafNightDeep} stopOpacity={0} />
          <stop offset="0.42" stopColor={W2.leafNightDeep} stopOpacity={0} />
          <stop offset="1" stopColor={W2.leafNightDeep} stopOpacity={0.62} />
        </radialGradient>
        <radialGradient id={`${id}-sunrise`} gradientUnits="userSpaceOnUse" cx={1100} cy={-180} r={1050}>
          <stop offset="0" stopColor={C.sun} stopOpacity={0.55} />
          <stop offset="0.5" stopColor={C.sun} stopOpacity={0.16} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-beamclip`}>
          <rect x={0} y={-200} width={1920} height={1400 * beamReveal} />
        </clipPath>
      </defs>

      {/* ================= world, part 1: tissue, air, gases ================= */}
      <g transform={cam.T}>
        {/* daylight from above, and the air spaces */}
        <rect x={-400} y={-200} width={2720} height={AIR_TOP + 200} fill={`url(#${id}-sky)`} opacity={1 - night} />
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
            scale={1 + 0.06 * gulpOf(c)}
          />
        ))}
        {/* close in: the tissue around the stoma steps back so the stoma reads first */}
        {focus > 0 ? <rect x={-400} y={-200} width={2720} height={AIR_TOP + 200} fill={`url(#${id}-focus)`} opacity={focus} /> : null}

        {/* outside air */}
        <rect x={-400} y={AIR_TOP - 12} width={2720} height={1400 - AIR_TOP} fill={`url(#${id}-air)`} />
        <Breeze f={f} />

        {/* the pore (behind everything that passes through it) */}
        <Stoma x={PORE[0]} y={PORE[1]} length={GLEN} girth={GIRTH} poreWidth={PORE_W} open={open} light={gLight} dim={night} layer="back" poreColors={[W2.leafNight, mix(W2.leafNight, C.ice, 0.3)]} />

        {/* the gas routes: drawn behind the guard cells, so they visibly pass through the pore */}
        <DashArrow pts={co2Arrow} progress={lin(f, b.co2Label - 4, 26)} out={lin(f, b.gasOut, 12)} color={C.ice} flow={f} />
        <DashArrow pts={o2Arrow} progress={lin(f, b.o2Label - 4, 26)} out={lin(f, b.gasOut, 12)} color={C.coral} flow={f} />
        <DashArrow pts={co2Arrow} progress={lin(f, b.in2 - 6, 26)} out={lin(f, b.end - 4, 12)} color={C.ice} flow={f} />

        {/* the gases */}
        {buddies.map((bd, i) => {
          const s = buddyState(bd, f);
          if (!s || s.opacity <= 0.01) return null;
          if (bd.kind === "o2") {
            return <O2Buddy key={i} x={s.p[0]} y={s.p[1]} scale={s.scale} rotate={s.rotate} mood={s.moving ? "excited" : "happy"} opacity={s.opacity} progress={s.pop} jiggle={2} seed={bd.seed} look={s.moving ? 1 : 0} />;
          }
          const dark = night > 0.5;
          const shut = bd.queued !== undefined && f >= b.close + 6 && f < b.close + 36;
          const bm = s.moving
            ? "excited"
            : s.bumped > 0.05 || shut || (bd.bonk !== undefined && f >= bd.bonk && f < bd.bonk + 40)
              ? "worried"
              : s.queued && dark
                ? "sleepy"
                : s.queued && f >= b.dawn
                  ? "excited"
                  : "happy";
          return <CO2Buddy key={i} x={s.p[0]} y={s.p[1]} scale={s.scale} rotate={s.rotate} mood={bm} opacity={s.opacity} jiggle={2} seed={bd.seed} look={s.moving ? 0 : 0.6} />;
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
      </g>

      {/* night falls over the tissue (the guard cells dim themselves, so they stay readable) */}
      {nightTint > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={mix(W2.leafNightDeep, "#000000", 0.25)} opacity={nightTint} /> : null}

      {/* ================= world, part 2: the guard cells ("bouncers" in shades) ================= */}
      <g transform={cam.T}>
        <Stoma
          x={PORE[0]}
          y={PORE[1]}
          length={GLEN}
          girth={GIRTH}
          poreWidth={PORE_W}
          open={open}
          light={gLight}
          dim={night * 0.75}
          layer="front"
          face
          shades={shades}
          eyes={sEyes}
          mouth={sMouth}
          look={thrilled ? [-0.4, 0.7] : asleep ? [0, 0] : [-0.3, 0.4]}
          seed={4}
        />
        <HandCircle cx={PORE[0]} cy={PORE[1]} rx={150} ry={186} progress={lin(f, k.stomataWord - 4, 22)} opacity={1 - lin(f, k.gases + 2, 14)} color={C.amberLight} width={7} seed={3} />
      </g>

      {/* ================= screen space ================= */}
      {/* light from above: soft beams by day, a sweep down at dawn */}
      <g clipPath={`url(#${id}-beamclip)`}>
        {sunrise > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id}-sunrise)`} opacity={sunrise} style={{ mixBlendMode: "screen" }} /> : null}
        <SunBeams
          source={[1240, -520]}
          beams={[
            [
              [560, 1000],
              [760, 1000],
            ],
            [
              [820, 1000],
              [1000, 1000],
            ],
            [
              [1060, 1000],
              [1220, 1000],
            ],
            [
              [1320, 1000],
              [1480, 1000],
            ],
          ]}
          on={beamOn}
          fadeTo={[960, 1000]}
        />
      </g>
      {plastids.map((t, i) => {
        const to = toS(t);
        const from: Pt = [to[0] + 260 + (i % 3) * 30, -60];
        return <Photon key={i} from={from} to={to} p={(f - b.photons - i * 4) / 24} size={1.1} />;
      })}
      {plastids.map((t, i) => {
        const at = toS(t);
        return <Sparkle key={`p${i}`} x={at[0]} y={at[1]} r={22} seed={i + 7} color={C.sun} opacity={pulse(f, b.photons + i * 4 + 22, 22)} />;
      })}

      <Chloro x={CHLORO[0]} y={CHLORO[1]} size={236} mood={mood} pose={pose} pointAngle={f >= b.dawn && f < b.reopen ? -60 : -14} flip look={look} talk={chloroTalk} bounce={chloroBounce} seed={5} />

      {/* sky window: is it light or dark? */}
      <DayNightDial x={DIAL[0]} y={DIAL[1]} r={78} night={night} progress={lin(f, k.gases + 16, 16) * (1 - signOut)} />

      {/* the neon sign hanging over the door */}
      {signIn > 0 && signOut < 1 ? (
        <g opacity={1 - signOut} transform={`rotate(${signSwing} ${SIGN[0]} 0) translate(0 ${-(1 - EASE.out(signIn)) * 240})`}>
          <path d={`M${SIGN[0] - 100},-10 L${SIGN[0] - 100 * signSX},${SIGN[1] - 66} M${SIGN[0] + 100},-10 L${SIGN[0] + 100 * signSX},${SIGN[1] - 66}`} stroke={mix(C.ink300, C.paper, 0.3)} strokeWidth={4} strokeDasharray="7 5" />
          <g transform={`translate(${SIGN[0]} 0) scale(${signSX} 1) translate(${-SIGN[0]} 0)`}>
            <NeonSign x={SIGN[0]} y={SIGN[1]} text={closedSide ? "CLOSED" : "OPEN"} on={signOn} size={70} color={closedSide ? C.coral : W2.neon} />
          </g>
        </g>
      ) : null}

      {/* ---------------- labels: before the preview range (camera at rest) */}
      <PillLabel x={560} y={232} text="spongy mesophyll" {...lab(k.spongyWord, k.air + 30)} anchors={[toS([spongyCell.cx, spongyCell.cy])]} />
      <PillLabel
        x={1380}
        y={250}
        text="air spaces"
        {...lab(k.airWord, k.carbon + 40)}
        color={C.ice}
        anchors={[toS([(airA.cx + airB.cx) / 2, (airA.cy + airB.cy) / 2 + 6]), toS([(airA.cx + airC.cx) / 2, (airA.cy + airC.cy) / 2])]}
      />
      <PillLabel x={600} y={330} text="vascular bundle" {...lab(k.vascular, k.plant + 30)} anchors={[toS([BUNDLE[0] + 80, BUNDLE[1] - 10])]} />
      <PillLabel x={560} y={180} text="xylem" {...lab(k.xylemWord, k.plant + 30)} color={C.ice} anchors={[toS([BUNDLE[0] + 30, BUNDLE[1] - 40])]} />
      <PillLabel x={600} y={480} text="phloem" {...lab(k.phloemWord, k.plant + 30)} color={C.amber} anchors={[toS([BUNDLE[0] + 24, BUNDLE[1] + 58])]} />
      <PillLabel x={1330} y={724} text="lower epidermis" {...lab(k.lowerWord, k.onePore + 8)} anchors={[toS([1300, EPI_TOP + EPI_H / 2])]} />
      <PillLabel x={1250} y={808} text="stoma" {...lab(k.onePore, k.diffusesIn - 6)} anchors={[toS([PORE[0] + 2, PORE[1] + 108])]} />
      {f >= k.lower && f < k.gases + 20 ? (
        <text x={150} y={948} fontFamily={HAND} fontWeight={700} fontSize={62} fill={mix(C.ice, C.paper, 0.4)} opacity={lin(f, k.lowerWord, 14) * (1 - lin(f, k.gases - 6, 10))}>
          outside air
        </text>
      ) : null}

      {/* ---------------- the preview range */}
      <PillLabel x={540} y={926} text="carbon dioxide in" {...lab(b.co2Label, b.gasOut)} color={C.ice} />
      <PillLabel x={1330} y={926} text="oxygen out" {...lab(b.o2Label, b.gasOut)} color={C.coral} />

      <PillLabel
        x={960}
        y={924}
        text="guard cells"
        {...lab(b.label, b.reopen + 4)}
        color={W2.chloroLight}
        anchors={[toS([PORE[0] - 46, PORE[1] + 82]), toS([PORE[0] + 46, PORE[1] + 82])]}
      />
      {/* bonk! the door is shut */}
      <ImpactLines x={toS([PORE[0], PORE[1] + GLEN / 2 + 4])[0]} y={toS([PORE[0], PORE[1] + GLEN / 2 + 4])[1]} progress={lin(f, BONK(b) + 5, 16)} r0={44} r1={110} angles={[200, 168, 12, -20]} color={C.amberLight} width={8} />
      {/* the queue dozes */}
      {asleep && f >= b.close + 40 ? (
        <text
          x={toS(QUEUE[2])[0] + 30}
          y={toS(QUEUE[2])[1] - 70 - ((f - b.close) % 50) * 0.6}
          fontFamily={HAND}
          fontWeight={700}
          fontSize={64}
          fill={C.amberLight}
          opacity={Math.sin((((f - b.close) % 50) / 50) * Math.PI) * (1 - lin(f, b.dawn, 10))}
        >
          z z
        </text>
      ) : null}

      {/* in the light: they open, carbon dioxide can diffuse in */}
      <PillLabel x={540} y={926} text="carbon dioxide in" {...lab(b.in2, b.end - 4)} color={C.ice} />
      <SpeechBubble x={1210} y={300} text="You're in!" size={50} tail={[stomaFace[0] + 30, stomaFace[1] - 30]} progress={lin(f, b.reopen + 24, 14) * (1 - lin(f, b.end - 16, 12))} />
      {[
        [-170, -140, 1],
        [170, -190, 2],
        [190, 120, 3],
        [-190, 90, 4],
      ].map(([dx, dy, s]) => (
        <Sparkle key={s} x={960 + dx} y={545 + dy} r={22} seed={s} opacity={pulse(f, b.reopen + 6 + s * 3, 40)} />
      ))}

      {/* ---------------- recap (after the preview range): name what's in view as it's listed */}
      <PillLabel x={520} y={196} text="palisade mesophyll" {...recapFor(k.rPalisade, k.rSpongy)} anchors={[toS([420, 70])]} />
      <PillLabel x={560} y={232} text="spongy mesophyll" {...recapFor(k.rSpongy, k.rBundle)} anchors={[toS([spongyCell.cx, spongyCell.cy])]} />
      <PillLabel x={600} y={330} text="vascular bundle" {...recapFor(k.rBundle, k.rLower)} anchors={[toS([BUNDLE[0] + 80, BUNDLE[1] - 10])]} />
      <PillLabel x={1330} y={724} text="lower epidermis" {...lab(k.rLower, k.end + 999)} anchors={[toS([1300, EPI_TOP + EPI_H / 2])]} />
      <PillLabel x={1250} y={880} text="stoma" {...lab(k.rStomata, k.end + 999)} anchors={[toS([PORE[0] + 2, PORE[1] + 108])]} />
      <PillLabel
        x={PORE[0]}
        y={330}
        text="guard cells"
        {...lab(k.rGuard, k.end + 999)}
        color={W2.chloroLight}
        anchors={[toS([PORE[0] - 60, PORE[1] - 100]), toS([PORE[0] + 60, PORE[1] - 100])]}
      />
    </WorldStage>
  );
};
