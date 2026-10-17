/**
 * EP002 v2 · S01 — Hook: van Helmont's willow, told as an old journal page whose sepia ink drawings
 * come alive (world: journal), until "thin air", when the page warms into full colour.
 *
 *  0 → {weigh}      a quill writes "1600s" ("almost four hundred years ago") and "Jan van Helmont"; a clay
 *                   pot is sketched in ink (cut away, so the soil shows); on "planted" a small willow is
 *                   inked into it; "willow", "pot", "dried soil" are each washed in with colour as they are said.
 *  {weigh}          an old balance is sketched on the right: the willow on one pan, one small brass weight
 *                   balances it ("He weighed the tree" → ledger: tree ✓); then a heap of soil, three big
 *                   weights ("He weighed the soil" → soil ✓). Pointer upright = balanced. No numbers:
 *                   the readings are the ticks; the sizes of the weights show the soil was far heavier.
 *  {water}          a watering can pours; "years" + a five-bar tally ticks off five years while the tree
 *                   grows; "nothing but water" is written.
 *  {grown}          ledger: tree "+74 kg" (on "seventy-four kilograms"); {soil} the soil in the pot glows,
 *                   "-57 g" (on "fifty-seven grams").
 *  {question}       a big ink "?"; "+74 kg" is ringed on "mass".
 *  {notSoil}        the soil row is struck out in red ink.
 *  {air}            "wood": the trunk and branches warm amber (label). "thin air": the page blooms into
 *                   full colour (a painted sky), carbon dioxide characters drift out of the air into the
 *                   leaves (each leaf glints as it takes one in); "thin air" is labelled.
 *  {promise}        the ledger clears; the quill writes "How?" — a calm, inviting end on the coloured tree.
 *  The pictures are simplified (the willow was weighed apart from the soil; a cut-away pot).
 */
import React, { useMemo } from "react";
import { C, EASE, W, W2 } from "../../../brand/tokens";
import { CO2Buddy, Scribble, WorldStage, caveatWidth, scribbleTip } from "../../../components/fun";
import { InkLine, InkQuestion, JOURNAL_INK, Quill, Tally, Watercolour, quillAt, washColour } from "../../../components/fun/Journal";
import type { QuillJob } from "../../../components/fun/Journal";
import { BrassWeight, InkDrops, InkPot, InkWateringCan, InkWillow, OldBalance, SoilHeap, canRose } from "../../../components/fun/JournalSketches";
import type { BalanceLayout } from "../../../components/fun/JournalSketches";
import { HandArrow, HandCircle, HandTick, HandUnderline, StrikeThrough, mix } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { crownTargets, willowGeometry } from "../scenes/parts/S01-Willow";
import { co2Flights, co2Glint } from "../scenes/parts/S01-Co2Stream";
import { v2s01Timing } from "./V2S01Hook.timing";

const lin = (v: number) => v;

// ------------------------------------------------------------------ layout (1920×1080)
/** The drawing: (BX, BY) = centre of the soil surface; drawn at scale S (local units). */
const BX = 570;
const BY = 726;
const S = 0.92;
const toS = (p: Pt): Pt => [BX + p[0] * S, BY + p[1] * S];
const TREE_BASE: Pt = [0, 6];
const FULL = willowGeometry(1, TREE_BASE);
const TARGETS = crownTargets(FULL, 14, 1, 5);
const SAPLING = willowGeometry(0.09, [0, 0]);

const HEAD = { x: 150, dateY: 190, nameY: 292, dateSize: 64, nameSize: 96 } as const;
const BAL: BalanceLayout = { cx: 1430, baseY: 548, pivotY: 262, arm: 232, hang: 148, panW: 176 };
const LED = { x: 1090, y1: 712, y2: 840, size: 84, tickX: 1300, valX: 1400, x2: 1790 } as const;
const NOTE = { x: 1090, yearsY: 344, waterY: 470, size: 76 } as const;
const Q = { x: 1180, y: 332, size: 280 } as const;
const CAN = { x: 826, y: 606, tilt: 44, scale: 1.1 } as const;

const WATER_W = caveatWidth("nothing but water", NOTE.size);
const KG_W = caveatWidth("+74 kg", LED.size);
const HOW = { x: 1260, y: 690, size: 150, text: "How?" } as const;
const HOW_W = caveatWidth(HOW.text, HOW.size);

/** a balance beam that settles like a real one: each load change swings it, then it damps out */
const swing = (f: number, events: readonly (readonly [number, number])[]) => {
  let v = 0;
  for (const [at, delta] of events) {
    const t = f - at;
    if (t <= 0) continue;
    v += delta * (1 - Math.exp(-t / 6) * Math.cos(t * 0.3));
  }
  return v;
};

export const V2S01Hook: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = v2s01Timing(sc);
  const skyId = useSvgId("v2s01sky");

  // ---------------------------------------------------------------- the willow: planted, then five years of growth
  const g = 0.09 + 0.91 * EASE.inOut(prog(f, k.growStart, k.growEnd - k.growStart, lin));
  const geo = g >= 0.999 ? FULL : willowGeometry(g, TREE_BASE);
  const treeInk = prog(f, k.plant - 4, 34, lin);
  const treeWash = prog(f, k.willowWord - 2, 26);

  // ---------------------------------------------------------------- colour: tinted as mentioned, then full colour at "thin air"
  const full = prog(f, k.thin - 4, 44);
  const bloom = EASE.out(prog(f, k.thin - 6, 54, lin));
  const potInk = prog(f, 14, 76, lin);
  const potWash = prog(f, k.pot - 2, 22);
  const soilWash = prog(f, k.soilWord - 2, 22);
  const soilGlow = pulse(f, k.soilAsk - 4, 56);
  // "Most of the wood…": the trunk and branches warm up as they're named, then settle to a steady glow (S18 pays it off)
  const woodGlow = 0.85 * prog(f, k.wood - 2, 18) * (1 - 0.3 * prog(f, k.wood + 36, 50));

  // ---------------------------------------------------------------- carbon dioxide out of thin air (local coords, inside the drawing)
  const flights = useMemo(
    () =>
      co2Flights({
        start: k.thin - 130,
        stop: k.end + 40,
        every: 17,
        travel: 124,
        targets: TARGETS,
        spawn: (_, r) => [(1990 + r() * 120 - BX) / S, (230 + r() * 250 - BY) / S],
        seed: 7,
      }),
    [k.thin, k.end],
  );
  const co2Vis = prog(f, k.thin - 8, 28);
  const glintRaw = co2Glint(flights, f);
  const glint = (key: number) => co2Vis * glintRaw(key);

  // ---------------------------------------------------------------- the balance
  const balInk = prog(f, k.weigh - 6, 30, lin);
  const balWash = prog(f, k.weigh + 14, 22);
  const balOut = 1 - prog(f, k.water + 2, 18);
  const sapOn = prog(f, k.sapOn, 12);
  const sapOff = prog(f, k.soilOn - 10, 10);
  const w1 = prog(f, k.treeWeight, 10);
  const heap = prog(f, k.soilOn, 12);
  const bigW = [0, 5, 10].map((d) => prog(f, k.soilWeights + d, 10));
  const tilt = swing(f, [
    [k.sapOn + 4, 9],
    [k.treeWeight + 6, -9],
    [k.soilOn + 4, 16],
    [k.soilWeights + 6, -16 / 3],
    [k.soilWeights + 11, -16 / 3],
    [k.soilWeights + 16, -16 / 3],
  ]);

  // ---------------------------------------------------------------- watering
  const canIn = prog(f, k.water - 6, 18);
  const canOut = prog(f, k.waterEnd + 2, 18, EASE.in);
  const canTilt = CAN.tilt * EASE.inOut(prog(f, k.water + 8, 16, lin)) * (1 - EASE.inOut(prog(f, k.waterEnd - 4, 12, lin)));
  const pourStart = k.water + 24;
  const pourStop = k.waterEnd - 8;
  const rose = canRose(CAN.x, CAN.y, CAN.tilt, CAN.scale, true);

  // ---------------------------------------------------------------- the journal's writing
  const dateP = prog(f, k.four, k.ago - k.four, lin);
  const nameP = prog(f, k.jan, k.helmontEnd - k.jan, lin);
  const headOut = 1 - prog(f, k.water - 6, 16);
  const labelsOff = 1 - prog(f, k.weigh - 4, 14);
  const treeWordP = prog(f, k.treeWeight - 2, 16, lin);
  const soilWordP = prog(f, k.soilWeights - 2, 16, lin);
  const ledRules = prog(f, k.weigh - 2, 24, lin);
  const ledOut = 1 - prog(f, k.promise + 6, 20);
  const yearsP = prog(f, k.five - 2, 18, lin);
  const tally = 5 * prog(f, k.five + 18, Math.max(40, k.growEnd - k.five - 18), lin);
  const waterP = prog(f, k.nothing, k.waterEnd - k.nothing, lin);
  const noteOut = 1 - prog(f, k.grown + 8, 16);
  const kgP = prog(f, k.seventy, k.kgEnd - k.seventy - 4, lin);
  const gP = prog(f, k.fifty, k.gEnd - k.fifty - 4, lin);
  const howP = prog(f, k.how - 2, 22, lin);

  const jobs: QuillJob[] = [
    { start: k.four, end: k.ago, tip: (fr) => scribbleTip(HEAD.x, HEAD.dateY, "1600s", HEAD.dateSize, prog(fr, k.four, k.ago - k.four, lin), fr) },
    { start: k.jan, end: k.helmontEnd, tip: (fr) => scribbleTip(HEAD.x, HEAD.nameY, "Jan van Helmont", HEAD.nameSize, prog(fr, k.jan, k.helmontEnd - k.jan, lin), fr) },
    { start: k.treeWeight - 2, end: k.treeWeight + 14, tip: (fr) => scribbleTip(LED.x, LED.y1, "tree", LED.size, prog(fr, k.treeWeight - 2, 16, lin), fr) },
    { start: k.soilWeights - 2, end: k.soilWeights + 14, tip: (fr) => scribbleTip(LED.x, LED.y2, "soil", LED.size, prog(fr, k.soilWeights - 2, 16, lin), fr) },
    { start: k.five - 2, end: k.five + 16, tip: (fr) => scribbleTip(NOTE.x, NOTE.yearsY, "years", NOTE.size, prog(fr, k.five - 2, 18, lin), fr) },
    { start: k.nothing, end: k.waterEnd, tip: (fr) => scribbleTip(NOTE.x, NOTE.waterY, "nothing but water", NOTE.size, prog(fr, k.nothing, k.waterEnd - k.nothing, lin), fr) },
    { start: k.seventy, end: k.kgEnd - 4, tip: (fr) => scribbleTip(LED.valX, LED.y1, "+74 kg", LED.size, prog(fr, k.seventy, k.kgEnd - k.seventy - 4, lin), fr) },
    { start: k.fifty, end: k.gEnd - 4, tip: (fr) => scribbleTip(LED.valX, LED.y2, "-57 g", LED.size, prog(fr, k.fifty, k.gEnd - k.fifty - 4, lin), fr) },
    { start: k.how - 2, end: k.how + 20, tip: (fr) => scribbleTip(HOW.x, HOW.y, HOW.text, HOW.size, prog(fr, k.how - 2, 22, lin), fr) },
  ];
  // the quill glides on to the next word when it comes within 4 s, instead of leaving and coming back
  const quill = quillAt(jobs, f, 120, 24);

  // ---------------------------------------------------------------- the question, "not the soil", the answer
  const qP = prog(f, k.where - 2, 40, lin);
  const qOut = 1 - prog(f, k.air, 16);
  const ring = prog(f, k.mass - 2, 22, lin);
  const strikeP = prog(f, k.strike, 16, lin);
  const woodP = prog(f, k.wood - 2, 18, lin);
  const woodOut = 1 - prog(f, k.promise + 6, 18);
  const thinP = prog(f, k.thin - 2, 22, lin);

  // screen anchors on the drawing
  const sapTip = toS([12, -112 + (1 - EASE.out(treeInk)) * 0]);
  const soilSpot = toS([70, 60]);
  const trunkSpot = toS([-26, -96]);

  const ink = JOURNAL_INK;
  const red = C.coralDeep;

  return (
    <WorldStage world="journal">
      {/* ---------------- the page warms into full colour: a painted sky blooms out from the tree */}
      {bloom > 0 ? (
        <g>
          <defs>
            <clipPath id={`${skyId}-c`}>
              <circle cx={BX} cy={BY - 330} r={60 + 1900 * bloom} />
            </clipPath>
            <linearGradient id={`${skyId}-g`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mix(W2.skyDay, C.ice, 0.25)} />
              <stop offset="0.75" stopColor={W2.skyDayLow} />
              <stop offset="1" stopColor={mix(W2.skyDayLow, W2.skyGold, 0.25)} />
            </linearGradient>
          </defs>
          <Watercolour seed={41} strength={46} opacity={0.88}>
            <g clipPath={`url(#${skyId}-c)`}>
              <rect x={70} y={70} width={W - 140} height={850} rx={40} fill={`url(#${skyId}-g)`} />
              <rect x={70} y={BY + 196} width={W - 140} height={64} rx={20} fill={mix(W2.grass, W2.parchment, 0.25)} />
            </g>
          </Watercolour>
          {/* warm light from the upper left */}
          <radialGradient id={`${skyId}-sun`} cx={260} cy={150} r={620} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={C.amberLight} stopOpacity={0.5} />
            <stop offset="1" stopColor={C.amberLight} stopOpacity={0} />
          </radialGradient>
          <rect x={70} y={70} width={W - 140} height={850} fill={`url(#${skyId}-sun)`} opacity={full} />
        </g>
      ) : null}

      {/* ---------------- the watering can sits behind the willow's hanging branches (reaching in under the canopy) */}
      <InkWateringCan
        x={CAN.x + 70 * (1 - EASE.out(canIn)) + 320 * canOut}
        y={CAN.y - 40 * canOut}
        tilt={canTilt}
        scale={CAN.scale}
        flip
        wash={canIn}
        opacity={canIn * (1 - prog(f, k.waterEnd + 10, 10))}
      />

      {/* ---------------- the drawing */}
      <g transform={`translate(${BX} ${BY}) scale(${S})`}>
        <InkLine pts={[[-330, 212], [-60, 214], [180, 211], [330, 213]]} progress={prog(f, 50, 30, lin)} width={4} seed={3} opacity={0.8} />
        <InkPot x={0} y={0} ink={potInk} potWash={potWash} soilWash={soilWash} full={full} soilGlow={soilGlow} />
        {treeInk > 0 ? <InkWillow geo={geo} ink={treeInk} wash={treeWash} full={full} glow={woodGlow} glint={glint} line={3.2} /> : null}
        {co2Vis > 0
          ? flights.map((fl, i) => {
              const u = (f - fl.t0) / fl.travel;
              if (u <= 0 || u >= 1) return null;
              const p = 1 - Math.pow(1 - u, 1.6);
              const q = 1 - p;
              const x = q * q * fl.from[0] + 2 * q * p * fl.ctrl[0] + p * p * fl.to[0];
              const y = q * q * fl.from[1] + 2 * q * p * fl.ctrl[1] + p * p * fl.to[1];
              const absorb = Math.max(0, (u - 0.82) / 0.18);
              return (
                <CO2Buddy
                  key={i}
                  x={x}
                  y={y}
                  scale={0.62 * (1 - 0.6 * absorb)}
                  rotate={fl.rot * 0.5}
                  look={-1}
                  opacity={co2Vis * Math.min(1, u * 6) * (1 - absorb)}
                  jiggle={2.5}
                  seed={fl.seed}
                />
              );
            })
          : null}
      </g>

      {/* ---------------- watering: drops from the can soak into the soil */}
      <InkDrops f={f} start={pourStart} stop={pourStop} every={7} from={() => rose} soilY={BY + 2} full={full} />

      {/* ---------------- the header: when, and who */}
      {headOut > 0 ? (
        <g opacity={headOut}>
          <Scribble x={HEAD.x} y={HEAD.dateY} text="1600s" size={HEAD.dateSize} color={ink} progress={dateP} />
          <Scribble x={HEAD.x} y={HEAD.nameY} text="Jan van Helmont" size={HEAD.nameSize} color={ink} progress={nameP} />
          <HandUnderline x1={HEAD.x - 4} x2={HEAD.x + caveatWidth("Jan van Helmont", HEAD.nameSize)} y={HEAD.nameY + 26} progress={prog(f, k.helmontEnd, 16, lin)} color={ink} width={5} seed={4} />
        </g>
      ) : null}

      {/* ---------------- what's what (fade once the weighing starts) */}
      {labelsOff > 0 ? (
        <g opacity={labelsOff}>
          <Scribble x={sapTip[0] + 130} y={sapTip[1] - 44} text="willow" size={64} color={ink} progress={prog(f, k.willowWord - 2, 16, lin)} />
          <HandArrow from={[sapTip[0] + 118, sapTip[1] - 62]} to={[sapTip[0] + 30, sapTip[1] - 16]} bend={0.25} progress={prog(f, k.willowWord + 10, 14, lin)} color={ink} width={4} head={18} seed={8} rough={0.3} />
          <Scribble x={soilSpot[0] + 150} y={soilSpot[1] + 92} text="dried soil" size={64} color={ink} progress={prog(f, k.soilWord - 2, 18, lin)} />
          <HandArrow from={[soilSpot[0] + 140, soilSpot[1] + 70]} to={[soilSpot[0] + 20, soilSpot[1] + 14]} bend={-0.2} progress={prog(f, k.soilWord + 12, 14, lin)} color={ink} width={4} head={18} seed={9} rough={0.3} />
        </g>
      ) : null}

      {/* ---------------- the balance: willow, then soil */}
      <OldBalance
        b={BAL}
        tilt={tilt}
        ink={balInk}
        wash={balWash}
        full={full}
        opacity={balOut}
        left={
          <g>
            {sapOn > 0 && sapOff < 1 ? (
              <g opacity={sapOn * (1 - sapOff)} transform={`translate(0 ${-(1 - EASE.out(sapOn)) * 60}) scale(0.8)`}>
                <InkWillow geo={SAPLING} ink={1} wash={1} full={full} line={3} seed={9} />
              </g>
            ) : null}
            <SoilHeap x={0} y={0} w={140} h={58} full={full} opacity={heap} />
          </g>
        }
        right={
          <g>
            {w1 > 0 && sapOff < 1 ? (
              <g opacity={1 - sapOff}>
                <BrassWeight x={0} y={0} w={32} h={24} drop={w1} full={full} />
              </g>
            ) : null}
            {bigW.map((p, i) => (
              <BrassWeight key={i} x={(i - 1) * 54} y={0} w={48} h={42} drop={p} full={full} />
            ))}
          </g>
        }
      />

      {/* ---------------- five years of nothing but water */}
      {noteOut > 0 && yearsP > 0 ? (
        <g opacity={noteOut}>
          <Scribble x={NOTE.x} y={NOTE.yearsY} text="years" size={NOTE.size} color={ink} progress={yearsP} />
          <Tally x={NOTE.x + caveatWidth("years", NOTE.size) + 46} y={NOTE.yearsY + 8} h={76} count={tally} />
          <Scribble x={NOTE.x} y={NOTE.waterY} text="nothing but water" size={NOTE.size} color={ink} progress={waterP} />
          <HandUnderline x1={NOTE.x + caveatWidth("nothing but ", NOTE.size) - 4} x2={NOTE.x + WATER_W + 4} y={NOTE.waterY + 20} progress={prog(f, k.waterEnd, 14, lin)} color={washColour(C.iceDeep, 1)} width={6} seed={12} />
        </g>
      ) : null}

      {/* ---------------- the ledger */}
      {ledOut > 0 && ledRules > 0 ? (
        <g opacity={ledOut}>
          {[LED.y1 - 104, LED.y1 + 40, LED.y2 + 40].map((y, i) => (
            <InkLine key={i} pts={[[LED.x - 30, y + 2], [(LED.x + LED.x2) / 2, y - 2], [LED.x2, y + 1]]} progress={ledRules} width={3} seed={20 + i} opacity={0.55} />
          ))}
          <Scribble x={LED.x} y={LED.y1} text="tree" size={LED.size} color={ink} progress={treeWordP} />
          <HandTick cx={LED.tickX} cy={LED.y1 - 28} size={62} progress={prog(f, k.treeWeight + 16, 12, lin)} color={ink} width={8} seed={31} rough={0.3} />
          <Scribble x={LED.x} y={LED.y2} text="soil" size={LED.size} color={ink} progress={soilWordP} />
          <HandTick cx={LED.tickX} cy={LED.y2 - 28} size={62} progress={prog(f, k.soilWeights + 16, 12, lin)} color={ink} width={8} seed={32} rough={0.3} />
          <Scribble x={LED.valX} y={LED.y1} text="+74 kg" size={LED.size} color={mix(ink, C.leafDeep, 0.55)} progress={kgP} />
          <Scribble x={LED.valX} y={LED.y2} text="-57 g" size={LED.size} color={ink} progress={gP} />
          <HandCircle cx={LED.valX + KG_W / 2} cy={LED.y1 - 26} rx={KG_W / 2 + 34} ry={56} progress={ring} color={red} width={6} seed={52} rough={0.3} />
          <StrikeThrough x1={LED.x - 8} x2={LED.valX + caveatWidth("-57 g", LED.size) + 8} y={LED.y2 - 26} progress={strikeP} color={red} width={9} seed={41} rough={0.3} />
        </g>
      ) : null}

      {/* ---------------- the question */}
      <InkQuestion x={Q.x} y={Q.y} size={Q.size} progress={qP} opacity={qOut} />

      {/* ---------------- the answer: the wood, out of thin air */}
      {woodOut > 0 && woodP > 0 ? (
        <g opacity={woodOut}>
          <Scribble x={trunkSpot[0] - 270} y={trunkSpot[1] + 62} text="wood" size={72} color={ink} progress={woodP} />
          <HandArrow from={[trunkSpot[0] - 124, trunkSpot[1] + 40]} to={[trunkSpot[0] - 6, trunkSpot[1] - 2]} bend={0.2} progress={prog(f, k.wood + 12, 14, lin)} color={ink} width={4} head={18} seed={14} rough={0.3} />
        </g>
      ) : null}
      {thinP > 0 ? (
        <g>
          <Scribble x={1250} y={196} text="thin air" size={84} color={ink} progress={thinP} />
          <HandArrow from={[1232, 176]} to={[968, 296]} bend={0.22} progress={prog(f, k.thin + 16, 16, lin)} color={ink} width={4.5} head={22} seed={15} rough={0.3} />
        </g>
      ) : null}

      {/* ---------------- the promise: you'll know exactly how */}
      {howP > 0 ? (
        <g>
          <Scribble x={HOW.x} y={HOW.y} text={HOW.text} size={HOW.size} color={ink} progress={howP} />
          <HandUnderline x1={HOW.x - 6} x2={HOW.x + HOW_W + 6} y={HOW.y + 34} progress={prog(f, k.how + 22, 18, lin)} color={ink} width={7} seed={18} double />
        </g>
      ) : null}

      <Quill x={quill.tip[0]} y={quill.tip[1]} progress={quill.on} scale={0.82} />
    </WorldStage>
  );
};
