/**
 * S11 · Starch test — how to show a leaf has been photosynthesising (section 5).
 *
 * 1. A sunlit leaf; its glucose is packed away as amber starch grains; the iodine bottle: "starch test".
 * 2. Destarching: a potted plant goes into a dark box ("dark · 1–2 days"); light is shut out and the
 *    starch grains in its leaves are used up. The box lifts: any starch found later was made during
 *    the experiment.
 * 3. Four stations along the bench (the camera moves along them = shift of focus), with a step tracker:
 *    1 boiling water on a lit Bunsen (a lens shows the cells killed and their membranes broken, so iodine
 *      can get in); 2 flame off, a boiling tube of ethanol stands in the hot water, flammable warning,
 *      the leaf loses its chlorophyll and the ethanol turns green; 3 warm water softens the brittle leaf;
 *    4 the leaf spread on a white tile, iodine dropped on: blue-black = starch present, beside an
 *      orange-brown leaf = no starch.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { Lens } from "../../../components/Lens";
import { SunIcon } from "../../../components/Light";
import { Glucose } from "../../../components/SugarChain";
import { Plant, Pot, leafGeometry } from "../../../components/bio";
import { Beaker, Bottle, Bunsen, Dropper, Tile, Tube } from "../../../components/lab/Lab";
import { HandArrow, HandCross, LitShape, Stopwatch, mix } from "../../../components/kit";
import { roundRectPath } from "../../../components/kit/shared";
import { camTransform } from "../../../lib/camera";
import { toScreen } from "../../../lib/world";
import { Pt } from "../../../lib/geometry";
import { prog } from "../../../lib/motion";
import { Key, track } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s11Timing } from "./S11StarchTest.timing";
import { Chip, plantLeaf } from "./parts/S03-props";
import { BoilBubbles, BoiledCells, CapLabel, LeafCracks, LiquidVeil, NakedFlame, PhotonRain, StainLeaf, StarchGrain, Steam, StepTracker, Tripod } from "./parts/S11-lab";

const lin = (v: number) => v;

// ------------------------------------------------------------------ layout (world = screen until the camera moves)
const BENCH_Y = 900;
const SP = 1500;
/** Station centres along the bench (world x): A = steps 1–2, B = step 3, C = step 4. */
const STA = [960, 960 + SP, 960 + 2 * SP] as const;

// part 1: a sunlit leaf, its starch, the iodine bottle
const L1 = leafGeometry({ cx: 700, cy: 500, len: 600, wid: 290, ang: -14, stalk: 0.22 });
const GRAINS1: readonly [number, number, number][] = [
  [-0.27, -0.1, 20],
  [-0.1, 0.16, -15],
  [0.04, -0.17, 30],
  [0.2, 0.12, 0],
  [0.31, -0.06, 45],
  [-0.36, 0.1, 10],
  [-0.02, 0.03, -30],
];
const RINGS1 = [0, 2, 3]; // the grains that a glucose ring turns into
const IOD = { x: 1340, y: 830 };
const SUN_DIR: Pt = [0.5, 0.866]; // light travels down and to the right

// part 2: destarching
const POT = { x: 760, y: 700, w: 250, h: 200 };
const PLANT = { x: 760, y: 706, height: 330, leaves: 5, leafScale: 1.25 };
const PLANT_LEAVES = Array.from({ length: PLANT.leaves }, (_, i) => plantLeaf(PLANT.x, PLANT.y, PLANT.height, PLANT.leaves, PLANT.leafScale, i));
const PLANT_GRAINS: readonly [number, number][] = [
  [-0.12, 0.1],
  [0.16, -0.08],
];
const BOX = { x0: 540, x1: 980, top: 322, bottom: BENCH_Y + 2 };
const SUN2: Pt = [250, 300];

// station A (steps 1 and 2)
const BUN = { x: 760, s: 0.85 };
const BURNER_TOP = BENCH_Y - 210 * BUN.s;
const GAUZE_Y = 600;
const BKA = { x: 760, y: GAUZE_Y, w: 280, h: 260, level: 0.65 };
const BKA_SURF = BKA.y - BKA.h * BKA.level;
const TUBE = { x: 805, w: 58, h: 240, level: 0.7, mouth0: 108, mouth1: 352 };
const IN_TUBE = 150; // leaf centre below the tube's mouth
const LENS = { cx: 1330, cy: 470, r: 220 };
const ETH = { x: 1220, y: BENCH_Y, w: 214, h: 250 };
const ETHANOL = mix(C.glass, C.paper, 0.3);
const ETHANOL_GREEN = mix(C.leaf, C.glass, 0.25);

// station B (step 3)
const BKB = { x: STA[1], y: BENCH_Y, w: 380, h: 340, level: 0.72 };
const BKB_SURF = BKB.y - BKB.h * BKB.level;

// station C (step 4)
const TILE = { x: STA[2], y: 590, w: 960, h: 440 };
const SPREAD = { len: 400, wid: 200, ang: -12 };
const SLIDE = 240;
/** Where the three iodine drops land (leaf-local fractions of len / wid). */
const DROP_UV: readonly Pt[] = [
  [-0.12, -0.12],
  [0.18, 0.1],
  [-0.3, 0.12],
];
const DROPPER_TIP_Y = 360;

export const S11StarchTest: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s11Timing(sc);

  // ================================================================ timings of the leaf's journey
  const a0 = k.leafIn - 4; // appears over the boiling water
  const a1 = k.boiling - 2; // dips in
  const a2 = a1 + 22;
  const b0 = Math.max(a2 + 10, k.then - 2); // lifted out
  const b1 = b0 + 20;
  const b2 = Math.max(b1 + 4, k.tube); // into the tube of ethanol
  const b3 = b2 + 24;
  const st0 = Math.max(b3 + 4, k.stand - 2); // the tube is stood in the hot water
  const st1 = st0 + 36;
  const c0 = Math.max(st1 + 20, k.easySee + 8, k.rinse - 22); // out of the tube
  const c1 = c0 + 16;
  const m1 = Math.max(c1 + 20, k.rinse + 30); // carried to station B (camera pans with it)
  const d0 = Math.max(m1 + 2, k.dip - 2); // dipped in warm water
  const d1 = d0 + 22;
  const e0 = Math.max(d1 + 20, k.softens + 16, k.tile - 18); // out of the warm water
  const e1 = Math.max(e0 + 12, k.tile - 2);
  const e3 = Math.max(e1 + 24, k.tile + 34); // spread on the tile (camera arrives)
  const g0 = Math.max(e3 + 10, k.orange - 2); // slides over to make room for the no-starch leaf
  const g1 = g0 + 26;

  const tubeMouth = track(f, [
    [st0, TUBE.mouth0],
    [st1, TUBE.mouth1, EASE.inOut],
  ]);

  const Lx = track(f, [
    [b0, BKA.x],
    [b1, 580, EASE.inOut],
    [b2, 580],
    [b3, TUBE.x, EASE.inOut],
    [c1, TUBE.x],
    [m1, BKB.x, EASE.inOut],
    [e1, BKB.x],
    [e3, TILE.x, EASE.inOut],
    [g0, TILE.x],
    [g1, TILE.x - SLIDE, EASE.inOut],
  ] as Key[]);
  const Ly = track(f, [
    [a1, 240],
    [a2, 512, EASE.inOut],
    [b0, 512],
    [b1, 300, EASE.inOut],
    [b2, 300],
    [b3, TUBE.mouth0 + IN_TUBE, EASE.inOut],
    [st0, TUBE.mouth0 + IN_TUBE],
    [st1, TUBE.mouth1 + IN_TUBE, EASE.inOut],
    [c0, TUBE.mouth1 + IN_TUBE],
    [c1, 220, EASE.inOut],
    [m1, 420, EASE.inOut],
    [d0, 420],
    [d1, 760, EASE.inOut],
    [e0, 760],
    [e1, 440, EASE.inOut],
    [e3, TILE.y, EASE.inOut],
  ] as Key[]);
  const Llen = track(f, [
    [b2, 160],
    [b3, 130, EASE.inOut],
    [c1, 130],
    [m1, 240, EASE.inOut],
    [e1, 240],
    [e3, SPREAD.len, EASE.inOut],
  ] as Key[]);
  const Lwid = track(f, [
    [b2, 84],
    [b3, 42, EASE.inOut],
    [c1, 42],
    [m1, 124, EASE.inOut],
    [e1, 124],
    [e3, SPREAD.wid, EASE.inOut],
  ] as Key[]);
  const Lang = track(f, [
    [b2, 96],
    [b3, 90, EASE.inOut],
    [c1, 90],
    [m1, 102, EASE.inOut],
    [e1, 102],
    [e3, SPREAD.ang, EASE.inOut],
  ] as Key[]);
  // brittle after the ethanol (curled a little, cracked); the warm water softens it flat again
  const curl = prog(f, k.brittle - 2, 16) * (1 - prog(f, k.softens, 30, EASE.inOut));
  const leafGeo = leafGeometry({ cx: Lx, cy: Ly, len: Llen, wid: Lwid * (1 - 0.28 * curl), ang: Lang, stalk: 0.2, veinPairs: 5 });
  const leafIn = prog(f, a0, 16);
  const dropPts = DROP_UV.map(([u, v]) => leafGeo.P(u * leafGeo.len, v * leafGeo.wid));

  // ================================================================ camera: moves along the bench
  const camX = track(f, [
    [k.rinse - 8, STA[0]],
    [m1, STA[1], EASE.inOut],
    [k.tile - 8, STA[1]],
    [e3, STA[2], EASE.inOut],
  ]);
  const cam = { x: camX, y: 540, z: 1 };
  const S = (p: Pt) => toScreen(cam, p);

  // ================================================================ part 1: a leaf that has been photosynthesising
  const p1Out = 1 - prog(f, k.destarch - 8, 14);
  const leaf1In = prog(f, -6, 24);
  const ringIn = prog(f, k.glucose - 4, 14);
  const ringOut = prog(f, k.asStarch - 4, 14);
  const grains1 = GRAINS1.map(([u, v, rot], i) => {
    const at = L1.P(u * L1.len, v * L1.wid);
    const isRing = RINGS1.includes(i);
    const p = isRing ? prog(f, k.asStarch - 2, 18) : prog(f, k.asStarch + 4 + i * 2, 16);
    return { at, rot, p, i };
  });
  const bottleIn = prog(f, k.test - 4, 20);

  // ================================================================ part 2: destarching in the dark
  const p2In = prog(f, k.destarch - 2, 22);
  const p2Out = 1 - prog(f, k.boil - 16, 16);
  const boxDown = EASE.out(prog(f, k.dark - 8, 26));
  const boxLift = EASE.inOut(prog(f, k.why - 2, 30));
  const boxDy = (1 - boxDown) * -760 - boxLift * 760;
  const boxOp = Math.min(1, prog(f, k.dark - 10, 8) * 1.5) * (1 - prog(f, k.why + 8, 20));
  const roofY = BOX.top + boxDy;
  const sun2 = prog(f, k.destarch + 2, 20) * (1 - prog(f, k.noLight - 2, 22));
  const darkChip = prog(f, k.dark + 6, 20) * (1 - prog(f, k.why - 4, 14));
  const usedLabel = prog(f, k.storedStarch - 2, 20) * (1 - prog(f, k.why - 4, 12));
  const card1 = prog(f, k.anyStarch - 4, 18);
  const card2 = prog(f, k.made - 4, 18);

  // ================================================================ station A: steps 1 and 2
  const stA = prog(f, k.boil - 6, 22);
  const flame = prog(f, k.boil + 4, 18) * (1 - prog(f, k.off - 2, 12));
  const boilRate = prog(f, k.boil + 10, 40) * (1 - prog(f, k.off, 70));
  const heatA = prog(f, k.boil + 20, 40);
  const watch = prog(f, k.about - 6, 14) * (1 - prog(f, k.boilWhy + 16, 14));
  const seconds = 60 * prog(f, k.about, Math.max(24, k.minute - k.about + 22), lin);
  const lensOpen = prog(f, k.kills - 10, 20) * (1 - prog(f, k.ethanol - 16, 14));
  const dead = prog(f, k.kills, 24);
  const broken = prog(f, k.breaks, Math.max(20, k.membranes - k.breaks + 16));
  const iodIn = prog(f, k.iodineIn - 2, 40, lin);
  const tubeIn = prog(f, k.tube - 8, 16);
  const ethGreen = prog(f, k.removes - 4, Math.max(30, k.chlorophyll - k.removes + 40), EASE.inOut);
  const bottleE = prog(f, k.flammable - 8, 20);
  const warnOut = 1 - prog(f, k.decolour - 6, 14);

  // ================================================================ leaf colours
  const dull = prog(f, k.boiling + 14, 36, EASE.inOut);
  const pale = prog(f, k.removes - 4, Math.max(30, k.chlorophyll - k.removes + 40), EASE.inOut);
  const dropLand = k.drops.map((d) => d + 20);
  const blue = prog(f, k.turns - 6, 46, lin);
  const cracks = curl;

  // dropper over the tile
  const dropperOn = prog(f, k.add - 12, 14) * (1 - prog(f, k.drops[2] + 26, 14));
  const activeDrop = k.drops.findIndex((d, i) => f >= d - 2 && (i === 2 || f < k.drops[i + 1] - 2));
  const dropperX = track(
    f,
    k.drops.map((d, i) => [d - 8, dropPts[i][0], EASE.inOut] as Key),
  );
  const dropT = activeDrop >= 0 ? Math.min(1, Math.max(0, (f - k.drops[activeDrop]) / 20)) : 0;
  const dropFall = activeDrop >= 0 ? dropPts[activeDrop][1] - DROPPER_TIP_Y - 10 : 120;

  // leaf B (no starch) joins on the tile
  const leafB = leafGeometry({ cx: TILE.x + SLIDE, cy: TILE.y, len: SPREAD.len, wid: SPREAD.wid, ang: SPREAD.ang, stalk: 0.2, veinPairs: 5 });
  const leafBIn = prog(f, k.orange + 6, 20);
  const slide = prog(f, g0, g1 - g0, EASE.inOut);

  // ================================================================ step tracker
  const stepAt = [k.boil, k.ethanol, k.rinse, k.tile, k.end + 100];
  const steps = [
    { text: "boiling water", color: C.coral },
    { text: "hot ethanol", color: C.leafLight },
    { text: "warm water", color: C.ice },
    { text: "iodine", color: mix(C.iodine, C.amber, 0.4) },
  ].map((s, i) => ({
    ...s,
    active: prog(f, stepAt[i] - 6, 16) * (1 - prog(f, stepAt[i + 1] - 6, 16)),
    done: prog(f, stepAt[i + 1] - 6, 16),
  }));
  const trackerIn = prog(f, k.boil - 8, 20);

  const leaf1Targets = [L1.P(-0.2 * L1.len, -0.05 * L1.wid), L1.P(0.12 * L1.len, 0.1 * L1.wid), L1.P(0.28 * L1.len, -0.08 * L1.wid), L1.P(-0.02 * L1.len, -0.15 * L1.wid)];
  const plantTargets = PLANT_LEAVES.map((g) => g.P(0.05 * g.len, 0));

  return (
    <Stage bg={{ tone: "ink", lightX: 0.42, lightY: 0.4 }}>
      {/* =============================== the world (moves with the camera) */}
      <g transform={camTransform(cam)}>
        {/* the bench */}
        {f >= k.destarch - 6 ? (
          <g opacity={prog(f, k.destarch - 4, 20)}>
            <LitShape d={roundRectPath(-400, BENCH_Y, 6400, 40, 8)} top={C.ink600} bottom={C.ink800} rimOpacity={0.35} shadow={0.3} />
          </g>
        ) : null}

        {/* ---------- part 2: the plant in the dark ---------- */}
        {p2In > 0 && p2Out > 0 ? (
          <g opacity={p2In * p2Out}>
            <Pot x={POT.x} y={POT.y} w={POT.w} h={POT.h} />
            <Plant x={PLANT.x} y={PLANT.y} height={PLANT.height} leaves={PLANT.leaves} leafScale={PLANT.leafScale} />
            {PLANT_LEAVES.map((g, li) =>
              PLANT_GRAINS.map(([u, v], j) => {
                const at = g.P(u * g.len, v * g.wid);
                const n = li * 2 + j;
                const used = prog(f, k.usesUp - 4 + n * 5, 18, EASE.in);
                return <StarchGrain key={`${li}-${j}`} x={at[0]} y={at[1]} r={10} rot={li * 30 + j * 50} p={1 - used} />;
              }),
            )}
            {/* light falls on the plant until the box shuts it out */}
            {sun2 > 0 ? <SunIcon x={SUN2[0]} y={SUN2[1]} r={46} progress={sun2} glow={0.6} /> : null}
            <PhotonRain f={f} start={k.destarch + 10} stop={k.noLight - 4} every={9} travel={24} targets={plantTargets} source={SUN2} clampY={f >= k.dark - 4 ? roofY : undefined} />
            {/* the dark box: comes down over the plant, later lifts away */}
            {boxOp > 0 ? (
              <g opacity={boxOp} transform={`translate(0 ${boxDy})`}>
                <rect x={BOX.x0} y={BOX.top} width={BOX.x1 - BOX.x0} height={BOX.bottom - BOX.top} fill={C.ink950} opacity={0.7} />
                <LitShape d={roundRectPath(BOX.x0 - 20, BOX.top, 20, BOX.bottom - BOX.top, 6)} top={C.ink600} bottom={C.ink800} rimOpacity={0.3} shadow={0.3} />
                <LitShape d={roundRectPath(BOX.x1, BOX.top, 20, BOX.bottom - BOX.top, 6)} top={C.ink600} bottom={C.ink800} rimOpacity={0.3} shadow={0.3} />
                <LitShape d={roundRectPath(BOX.x0 - 34, BOX.top - 26, BOX.x1 - BOX.x0 + 68, 30, 8)} top={C.ink500} bottom={C.ink700} rimOpacity={0.55} shadow={0.4} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ---------- station A: tripod, Bunsen, beaker of water ---------- */}
        {stA > 0 ? (
          <g>
            <Tripod x={BKA.x} yTop={GAUZE_Y} floor={BENCH_Y} w={300} progress={stA} />
            <Bunsen x={BUN.x} y={BENCH_Y} scale={BUN.s} flame={flame} progress={stA} />
            <Beaker x={BKA.x} y={BKA.y} w={BKA.w} h={BKA.h} liquid={BKA.level} liquidColor={C.ice} progress={prog(f, k.boil, 20)}>
              <BoilBubbles x0={BKA.x - BKA.w / 2} x1={BKA.x + BKA.w / 2} bottom={BKA.y} surface={BKA_SURF} rate={boilRate} seed={4} />
              <Tube x={TUBE.x} y={tubeMouth} w={TUBE.w} h={TUBE.h} liquid={TUBE.level} liquidColor={mix(ETHANOL, ETHANOL_GREEN, ethGreen)} progress={tubeIn} />
            </Beaker>
            <Steam x={BKA.x} y={BKA.y - BKA.h} w={BKA.w * 0.7} heat={heatA * stA} />
            <Bottle x={ETH.x} y={ETH.y} w={ETH.w} h={ETH.h} label="ethanol" liquidColor={ETHANOL} flammable progress={bottleE} />
          </g>
        ) : null}

        {/* ---------- station B: warm water ---------- */}
        {f >= k.rinse - 40 ? (
          <g>
            <Beaker x={BKB.x} y={BKB.y} w={BKB.w} h={BKB.h} liquid={BKB.level} liquidColor={C.ice} />
            <Steam x={BKB.x} y={BKB.y - BKB.h} w={BKB.w * 0.6} heat={0.45} n={2} />
          </g>
        ) : null}

        {/* ---------- station C: white tile ---------- */}
        {f >= k.tile - 40 ? <Tile x={TILE.x} y={TILE.y} w={TILE.w} h={TILE.h} /> : null}

        {/* ---------- the leaf on its journey ---------- */}
        {leafIn > 0 ? (
          <g>
            <StainLeaf
              geo={leafGeo}
              tone="green"
              progress={leafIn}
              shadow={0.35}
              layers={[
                { tone: "dullGreen", p: dull },
                { tone: "decolourised", p: pale },
                ...dropLand.map((t, i) => ({ tone: "orange" as const, p: prog(f, t, 70, lin), origins: [dropPts[i]], reach: SPREAD.len * 0.5 })),
                { tone: "blueBlack", p: blue, origins: dropPts, reach: SPREAD.len * 0.85 },
              ]}
            />
            <LeafCracks geo={leafGeo} p={cracks} />
          </g>
        ) : null}
        {leafBIn > 0 ? <StainLeaf geo={leafB} tone="orange" progress={leafBIn} shadow={0.35} /> : null}

        {/* liquids in front of whatever stands in them */}
        {stA > 0 ? (
          <g>
            <LiquidVeil x0={TUBE.x - TUBE.w / 2 + 3} x1={TUBE.x + TUBE.w / 2 - 3} surface={tubeMouth + TUBE.h * (1 - TUBE.level)} bottom={tubeMouth + TUBE.h - 6} color={mix(ETHANOL, ETHANOL_GREEN, ethGreen)} opacity={0.3 * tubeIn} round={26} />
            <LiquidVeil x0={BKA.x - BKA.w / 2 + 4} x1={BKA.x + BKA.w / 2 - 4} surface={BKA_SURF} bottom={BKA.y - 3} opacity={0.22 * stA} />
          </g>
        ) : null}
        {f >= k.rinse - 40 ? <LiquidVeil x0={BKB.x - BKB.w / 2 + 4} x1={BKB.x + BKB.w / 2 - 4} surface={BKB_SURF} bottom={BKB.y - 3} opacity={0.22} /> : null}

        {/* iodine dropper */}
        {dropperOn > 0 ? <Dropper x={dropperX} y={DROPPER_TIP_Y} drop={dropT} fall={dropFall} progress={dropperOn} /> : null}
      </g>

      {/* =============================== part 1 (screen) */}
      {p1Out > 0 ? (
        <g opacity={p1Out}>
          <StainLeaf geo={L1} tone="green" progress={leaf1In} sunlit={0.7 * leaf1In} />
          <PhotonRain f={f} start={4} stop={k.test + 20} every={8} travel={22} targets={leaf1Targets} dir={SUN_DIR} />
          {RINGS1.map((gi, n) => {
            const [u, v] = GRAINS1[gi];
            const at = L1.P(u * L1.len, v * L1.wid);
            const p = prog(f, k.glucose - 4 + n * 4, 14) * (1 - ringOut);
            return p > 0 ? <Glucose key={gi} x={at[0]} y={at[1] - 4} tone="sugar" glow={0.4} scale={0.62 * (0.7 + 0.3 * EASE.out(Math.min(1, ringIn)))} opacity={p} /> : null;
          })}
          {grains1.map((g) => (
            <StarchGrain key={g.i} x={g.at[0]} y={g.at[1]} r={14} rot={g.rot} p={g.p} />
          ))}
          <CapLabel anchor={grains1[1].at} x={700} y={880} text="stored as starch" color={C.amber} progress={prog(f, k.asStarch + 4, 22)} />
          <Bottle x={IOD.x} y={IOD.y} w={200} h={250} label="iodine" liquidColor={C.iodine} progress={bottleIn} />
          <Label anchor={[IOD.x + 50, IOD.y - 196]} at={[IOD.x + 110, 470]} text="starch test" progress={prog(f, k.forStarch - 2, 22)} />
        </g>
      ) : null}

      {/* =============================== part 2 labels (screen; the camera hasn't moved yet) */}
      {p2In > 0 && p2Out > 0 ? (
        <g opacity={p2Out}>
          <Chip cx={(BOX.x0 + BOX.x1) / 2} cy={BOX.top - 78} text="dark · 1–2 days" color={C.ink300} textColor={C.paper} progress={darkChip} />
          {(() => {
            const g = PLANT_LEAVES[3];
            const at = g.P(PLANT_GRAINS[1][0] * g.len, PLANT_GRAINS[1][1] * g.wid);
            return <Label anchor={at} at={[1040, 470]} text="starch used up" color={C.amber} progress={usedLabel} />;
          })()}
          <Chip cx={1400} cy={430} text="starch found later" color={C.amber} progress={card1} />
          {card2 > 0 ? <HandArrow from={[1400, 482]} to={[1400, 548]} bend={0} progress={prog(f, k.made - 6, 16, lin)} color={C.paper} width={6} seed={11} /> : null}
          <Chip cx={1400} cy={610} text="made during experiment" color={C.paper} progress={card2} />
        </g>
      ) : null}

      {/* =============================== station A overlays (screen) */}
      {watch > 0 ? <Stopwatch x={440} y={430} size={190} seconds={seconds} readout progress={watch} /> : null}
      {lensOpen > 0 ? (
        <g>
          <Lens cx={LENS.cx} cy={LENS.cy} r={LENS.r} from={S([BKA.x, 512])} fromR={46} open={lensOpen} cone={lensOpen} tint={C.leafDark}>
            <BoiledCells cx={LENS.cx} cy={LENS.cy} dead={dead} broken={broken} iodine={iodIn} />
          </Lens>
          <Label
            anchor={[LENS.cx, 762]}
            at={[LENS.cx, 762]}
            align="middle"
            text="kills cells"
            sub="membranes broken"
            subProgress={prog(f, k.membranes - 2, 16)}
            progress={prog(f, k.kills - 2, 20)}
            opacity={1 - prog(f, k.ethanol - 16, 14)}
          />
        </g>
      ) : null}
      <Label
        anchor={S([BUN.x, BURNER_TOP - 6])}
        at={S([BUN.x - 200, 650])}
        align="end"
        text="flame off"
        color={C.coral}
        progress={prog(f, k.off - 2, 18)}
        opacity={1 - prog(f, k.flammable - 8, 12)}
      />
      <Label
        anchor={S([ETH.x + ETH.w / 2 - 4, ETH.y - ETH.h + 76])}
        at={S([1390, 560])}
        text="flammable"
        sub="no naked flame"
        subProgress={prog(f, k.naked - 4, 16)}
        color={C.coral}
        progress={prog(f, k.flammableW - 4, 20)}
        opacity={warnOut}
      />
      {warnOut > 0 && f >= k.naked - 8 ? (
        <g opacity={warnOut}>
          <NakedFlame x={S([1570, 0])[0]} y={820} size={96} progress={prog(f, k.naked - 6, 14)} />
          <HandCross cx={S([1570, 0])[0]} cy={772} size={124} width={11} color={C.coral} progress={prog(f, k.naked + 2, 18, lin)} seed={7} />
        </g>
      ) : null}
      <Label
        anchor={S([TUBE.x + 6, tubeMouth + IN_TUBE - 20])}
        at={S([1010, 300])}
        text="removes chlorophyll"
        color={C.leafLight}
        progress={prog(f, k.removes - 2, 22)}
        opacity={1 - prog(f, c0 - 12, 12)}
      />

      {/* =============================== station B overlay */}
      <Label
        anchor={S(leafGeo.P(0.1 * leafGeo.len, -0.3 * leafGeo.wid))}
        at={S([BKB.x + 230, 560])}
        text="brittle"
        sub="water softens it"
        subProgress={prog(f, k.softens - 4, 16)}
        progress={prog(f, k.brittle - 2, 20)}
        opacity={1 - prog(f, e0 - 4, 12)}
      />

      {/* =============================== station C overlays */}
      <CapLabel
        anchor={S([TILE.x - TILE.w / 2 + 90, TILE.y - TILE.h / 2 + 60])}
        x={S([TILE.x - 220, 0])[0]}
        y={300}
        text="white tile: easy to see"
        progress={prog(f, k.white - 2, 22)}
        opacity={1 - prog(f, k.add - 16, 10)}
      />
      <CapLabel
        anchor={S(leafGeo.P(0.12 * leafGeo.len, -0.16 * leafGeo.wid))}
        x={S([TILE.x - (SLIDE + 40) * slide, 0])[0]}
        y={300}
        text="blue-black: starch present"
        progress={prog(f, k.present - 8, 22)}
      />
      <CapLabel
        anchor={S(leafB.P(0.12 * leafB.len, -0.16 * leafB.wid))}
        x={S([TILE.x + SLIDE + 100, 0])[0]}
        y={300}
        text="orange-brown: no starch"
        textColor={mix(C.iodine, C.amberLight, 0.45)}
        progress={prog(f, k.stays + 4, 22)}
      />

      <StepTracker right={1820} y={100} steps={steps} progress={trackerIn} />
      <SectionTag n={5} title="Testing a leaf for starch" t={f} />
    </Stage>
  );
};
