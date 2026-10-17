/**
 * EP002 v2 · S03 — the definition of photosynthesis, on a notebook page. First scene of Part 1
 * ("What is photosynthesis?"): the part card opens it, then a calm cream notebook page.
 *
 *  0              part card: PLANT NUTRITION · PART 1 OF 9 / What is photosynthesis?
 *  {eat}          two doodles drawn and coloured in on the page as they are said:
 *                 "you: eat food" (a sandwich on a plate) / "plants: make food" (a potted plant).
 *  {make}         the sun pops up; light (arrows + light packets) lands on the big leaf, which lights
 *                 up; on "food" a glucose pops out of the leaf. "= photosynthesis" written under it.
 *  {define}       the doodles clear; a box is drawn by hand ("the definition the mark scheme wants");
 *                 "LEARN THIS" tab on "Learn it", and "word for word!" in red pen.
 *  {defLine}      a pen writes the definition in the box exactly as it is read, word by word:
 *                 "Photosynthesis is the process by which plants synthesise /
 *                  carbohydrates from raw materials using energy from light."
 *  {synthesise}   "Let's break that down": highlighter swipes, one key term at a time, each with a
 *                 small doodle note (earlier notes step back while the next is explained):
 *                   synthesise (green)        → "= make" + a little hammer
 *  {carbs}          carbohydrates (amber)     → a glucose ("glucose", "a simple sugar")
 *  {raw}            raw materials (blue)      → brace → CO2 buddy + water drop ("carbon dioxide + water")
 *  {light}          energy from light (yellow)→ the sun; on "to do it" synthesise glows; on "light"
 *                                               light arrows and packets rise from the sun to the words.
 *  end            every note back to full: the whole annotated definition.
 */
import React from "react";
import { C, EASE, W2 } from "../../../brand/tokens";
import { CO2Buddy, GlucoseBuddy, PartIntro, Sparkle, SunBuddy, WorldStage } from "../../../components/fun";
import { InkTopicTag } from "../../../components/fun/BenchLab";
import { Pen } from "../../../components/fun/StudyProps";
import { Scribble, caveatWidth } from "../../../components/fun/Handwriting";
import { HammerDoodle, HandBox, HighlightSwipe, InkTab, PottedPlantDoodle, SandwichDoodle, WaterDropBuddy, inkTabWidth, plantSunLeaf, swipeX } from "../../../components/fun/NotebookDoodles";
import { isWriting, scribbleProgress, wordSpan, writeAsSpoken, writtenPx, type WrittenLine } from "../../../components/fun/SpokenWriting";
import { Photon } from "../../../components/Light";
import { HandArrow, HandBracket, HandUnderline } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { v2s03Timing } from "./V2S03Definition.timing";

// ------------------------------------------------------------------ layout (1920×1080; notebook rules every 62 px from y 120)
const SIZE = 74; // the definition's handwriting
const X0 = 240; // its left edge (inside the box)
const BASE = [430, 554] as const; // baselines: sitting on the page's rules
const BOX = { x: 196, y: 300, w: 1568, h: 314 } as const;
const TAB_X = 222;
const NOTE_Y = 250; // "= make", above the box

// eat vs make
const SAND = { x: 560, y: 548, s: 1.08 } as const;
const PLANT = { x: 1330, y: 600, s: 1.05 } as const;
const CAP_Y = 802;
const CAP_SIZE = 72;
const SUN1: Pt = [1690, 222];
const LEAF = plantSunLeaf(PLANT.x, PLANT.y, PLANT.s);
const GLC1: Pt = [1398, 268];
const RAYS1: readonly (readonly [Pt, Pt])[] = [
  [
    [1600, 238],
    [1452, 326],
  ],
  [
    [1624, 270],
    [1508, 330],
  ],
];

// annotations under the box
const ANN_Y = 714; // doodle centres
const LABEL_Y = 802; // first label baseline (a rule)
const SUB_Y = 864; // second label baseline (a rule)

const linear = (v: number) => v;

/** Handwritten words that appear as they are spoken; centred on cx. */
type Piece = { readonly text: string; readonly color: string; readonly t0: number; readonly t1: number };
const SpokenPieces: React.FC<{ readonly cx: number; readonly y: number; readonly size: number; readonly pieces: readonly Piece[]; readonly f: number; readonly opacity?: number }> = ({
  cx,
  y,
  size,
  pieces,
  f,
  opacity = 1,
}) => {
  const total = caveatWidth(pieces.map((p) => p.text).join(" "), size);
  let x = cx - total / 2;
  return (
    <g opacity={opacity}>
      {pieces.map((p, i) => {
        const at = x;
        x += caveatWidth(`${p.text} `, size);
        return <Scribble key={i} x={at} y={y} text={p.text} size={size} color={p.color} progress={prog(f, p.t0, Math.max(4, p.t1 - p.t0), linear)} />;
      })}
    </g>
  );
};

/** x of piece `i`'s centre in a SpokenPieces line (to put a doodle above a word). */
const pieceCentre = (cx: number, size: number, pieces: readonly string[], i: number) => {
  const total = caveatWidth(pieces.join(" "), size);
  const before = caveatWidth(pieces.slice(0, i).map((p) => `${p} `).join(""), size);
  return cx - total / 2 + before + caveatWidth(pieces[i], size) / 2;
};

export const V2S03Definition: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = v2s03Timing(sc);
  const gid = useSvgId("v2s03");

  // ---------------------------------------------------------------- 1 · you eat / plants make
  const exit = prog(f, k.define - 2, 18, EASE.in);
  const sandP = prog(f, k.you - 2, 46, linear);
  const plantP = prog(f, k.plantIn - 4, 48, linear);
  const sunIn = prog(f, k.make - 6, 16, linear);
  const rayP = (i: number) => prog(f, k.makeWord + 2 + i * 5, 14, linear);
  const lit = prog(f, k.makeWord + 14, 14) * (0.85 + 0.15 * Math.sin(f / 6));
  const glcPop = prog(f, k.food - 6, 14, linear);
  const glcRise = prog(f, k.food - 2, 26, EASE.inOut);
  const glcPos: Pt = [LEAF.mid[0] + (GLC1[0] - LEAF.mid[0]) * glcRise, LEAF.mid[1] + (GLC1[1] - LEAF.mid[1]) * glcRise];
  const photoNote = prog(f, k.photo, Math.max(10, k.photoEnd - k.photo - 2), linear);

  // ---------------------------------------------------------------- 2 · the box to learn
  const boxP = prog(f, k.defWord - 2, 32, linear);
  const tint = prog(f, k.defWord + 18, 24);
  const tabP = prog(f, k.learn - 2, 12, linear);
  const wfwX = TAB_X + inkTabWidth("LEARN THIS") + 30;
  const wfwP = prog(f, k.wordForWord, Math.max(12, k.wfwEnd - k.wordForWord - 2), linear);

  // ---------------------------------------------------------------- 3 · the definition, written as it is read
  const W = (key: string, nth: number, text = key) => ({ text, t0: sc.word(key, nth), t1: sc.wordEnd(key, nth) - 1 });
  const lines: WrittenLine[] = writeAsSpoken(
    [
      [W("Photosynthesis", 2), W("is", 1), W("the", 3), W("process", 1), W("by", 2), W("which", 1), W("plants", 3), W("synthesise", 1)],
      [W("carbohydrates", 1), W("from", 1), W("raw", 1), W("materials", 1), W("using", 1), W("energy", 1), W("from", 2), W("light", 1, "light.")],
    ],
    SIZE,
    { minFrames: 6, lineBreak: 8 },
  );
  const [L1, L2] = lines;
  const lineTip = (line: WrittenLine, base: number): Pt => [X0 + writtenPx(line, f), base - SIZE * 0.3 + (isWriting(line, f) ? Math.sin(f * 1.9) * SIZE * 0.1 : 0)];
  let penTip: Pt;
  if (f < L1.t1) penTip = lineTip(L1, BASE[0]);
  else if (f < L2.t0) {
    const a = lineTip(L1, BASE[0]);
    const b = lineTip(L2, BASE[1]);
    const u = EASE.inOut((f - L1.t1) / Math.max(1, L2.t0 - L1.t1));
    penTip = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * 40];
  } else penTip = lineTip(L2, BASE[1]);
  const penP = prog(f, L1.t0 - 16, 12) * (1 - prog(f, L2.t1 + 4, 10, EASE.in));

  // ---------------------------------------------------------------- 4 · break it down
  const span = (line: WrittenLine, a: number, b?: number) => {
    const s = wordSpan(line, a, b);
    return { x0: X0 + s.x0, x1: X0 + s.x1, cx: X0 + (s.x0 + s.x1) / 2 };
  };
  const SYN = span(L1, 7);
  const CARB = span(L2, 0);
  const RAW = span(L2, 2, 3);
  const LIGHT = span(L2, 5, 7);
  const bandY = (base: number) => base - SIZE * 0.27;
  const swipes = [
    { s: SYN, base: BASE[0], color: C.leaf, op: 0.5, s0: k.synWord, s1: Math.max(k.synWord + 14, k.synEnd - 4) },
    { s: CARB, base: BASE[1], color: C.amber, op: 0.72, s0: k.carbWord, s1: Math.max(k.carbWord + 14, k.carbEnd - 4) },
    { s: RAW, base: BASE[1], color: C.ice, op: 0.5, s0: k.raw2, s1: Math.max(k.raw2 + 16, k.materials2End - 4) },
    { s: LIGHT, base: BASE[1], color: C.sun, op: 0.6, s0: k.sun, s1: k.sun + 22 },
  ];
  // focus: the note being explained is at full strength, earlier ones step back; all return at the end
  const starts = [k.synWord, k.carbs, k.raw, k.light];
  const allBack = prog(f, k.light2End + 8, 16);
  const focus = (i: number) => (i < 3 ? 1 - 0.45 * prog(f, starts[i + 1] - 4, 12) * (1 - allBack) : 1);

  // A0 · synthesise = make
  const NOTE_X = SYN.cx - 112;
  const a0Arrow = prog(f, k.synEnd - 8, 14, linear);
  const a0Note = prog(f, k.means + 2, Math.max(12, k.make2End - k.means - 2), linear);
  const a0Hammer = prog(f, k.make2End - 2, 18, linear);
  const synGlow = Math.max(pulse(f, k.synWord + 6, 26) * 0.6, pulse(f, k.doIt - 4, 34));

  // A1 · carbohydrates → glucose, a simple sugar
  const a1Arrow = prog(f, k.carbEnd - 6, 14, linear);
  const a1Glc = prog(f, k.glucose - 6, 14, linear);
  const a1Lit = Math.min(1, 0.3 + 0.7 * pulse(f, k.glucose - 4, 40));

  // A2 · raw materials → carbon dioxide + water
  const RAW_LABEL = ["carbon dioxide", "+", "water"];
  const RAW_SIZE = 62;
  const co2X = pieceCentre(RAW.cx, RAW_SIZE, RAW_LABEL, 0);
  const waterX = pieceCentre(RAW.cx, RAW_SIZE, RAW_LABEL, 2);
  const a2Brace = prog(f, k.materials2End - 8, 16, linear);
  const a2Co2 = prog(f, k.co2 - 4, 14, linear);
  const a2Water = prog(f, k.water - 4, 14, linear);

  // A3 · energy from light ← the sun
  const SUN2: Pt = [LIGHT.cx, ANN_Y + 54];
  const a3Sun = prog(f, k.sun + 4, 16, linear);
  const rays3 = [-126, -90, -54].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const t1 = (SUN2[1] - (BASE[1] + 34)) / -Math.sin(a);
    return { from: [SUN2[0] + Math.cos(a) * 96, SUN2[1] + Math.sin(a) * 96] as Pt, to: [SUN2[0] + Math.cos(a) * t1, SUN2[1] + Math.sin(a) * t1] as Pt };
  });
  const a3Rays = (i: number) => prog(f, k.lightWord - 8 + i * 3, 12, linear);
  const sunShine = Math.max(pulse(f, k.lightWord - 4, 30), 0.25 * prog(f, k.lightWord, 10));

  return (
    <WorldStage world="notebook">
      <defs>
        <filter id={`${gid}-soft`} x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>
      <InkTopicTag n={1} title="What is photosynthesis?" progress={prog(f, 56, 16)} />

      {/* ============ 1 · you eat food / plants make food ============ */}
      {exit < 1 ? (
        <g opacity={1 - exit} transform={`translate(0 ${-36 * EASE.out(exit)})`}>
          <SandwichDoodle x={SAND.x} y={SAND.y} scale={SAND.s} progress={sandP} />
          <SpokenPieces
            cx={SAND.x}
            y={CAP_Y}
            size={CAP_SIZE}
            f={f}
            pieces={[
              { text: "you:", color: W2.inkText, t0: k.you, t1: k.you + 12 },
              { text: "eat", color: C.coralDeep, t0: k.plate + 2, t1: k.plate + 14 },
              { text: "food", color: W2.inkText, t0: k.youFood, t1: Math.max(k.youFood + 12, k.youFoodEnd) },
            ]}
          />

          {/* the plant, the sun and the light it makes food with */}
          {RAYS1.map(([a, b], i) => (
            <HandArrow key={i} from={a} to={b} progress={rayP(i)} color={C.amberDeep} width={6} bend={0.08} gapEnd={4} seed={20 + i} />
          ))}
          <PottedPlantDoodle x={PLANT.x} y={PLANT.y} scale={PLANT.s} progress={plantP} lit={lit} />
          {Array.from({ length: 9 }, (_, i) => {
            const [a, b] = RAYS1[i % 2];
            return <Photon key={i} from={a} to={b} p={(f - (k.makeWord + 16 + i * 11)) / 16} size={0.7} color={C.amber} />;
          })}
          <SunBuddy x={SUN1[0]} y={SUN1[1]} r={54} progress={sunIn} shine={0.3 * lit} seed={3} />
          {glcPop > 0 ? (
            <g>
              <circle cx={glcPos[0]} cy={glcPos[1]} r={38 + 46 * prog(f, k.food - 2, 18)} fill="none" stroke={C.amberDeep} strokeWidth={4} opacity={0.8 * (1 - prog(f, k.food - 2, 18))} />
              <GlucoseBuddy x={glcPos[0]} y={glcPos[1]} r={38} progress={glcPop} lit={0.4 + 0.6 * pulse(f, k.food - 4, 40)} look={[-0.4, 0.4]} seed={5} />
              <Sparkle x={glcPos[0] + 46} y={glcPos[1] - 36} r={16 * prog(f, k.food + 4, 10)} seed={2} color={C.amber} />
              <Sparkle x={glcPos[0] - 50} y={glcPos[1] - 10} r={11 * prog(f, k.food + 8, 10)} seed={5} color={C.amber} />
            </g>
          ) : null}
          <SpokenPieces
            cx={PLANT.x}
            y={CAP_Y}
            size={CAP_SIZE}
            f={f}
            pieces={[
              { text: "plants:", color: W2.inkText, t0: k.plantIn, t1: k.plantIn + 14 },
              { text: "make", color: C.leafDeep, t0: k.makeWord, t1: Math.max(k.makeWord + 10, k.makeEnd) },
              { text: "food", color: W2.inkText, t0: k.food, t1: Math.max(k.food + 10, k.foodEnd) },
            ]}
          />
          <Scribble x={PLANT.x - caveatWidth("= photosynthesis", 64) / 2} y={880} text="= photosynthesis" size={64} color={C.leafDeep} progress={photoNote} />
          <HandUnderline
            x1={PLANT.x - caveatWidth("= photosynthesis", 64) / 2 + caveatWidth("= ", 64)}
            x2={PLANT.x + caveatWidth("= photosynthesis", 64) / 2}
            y={900}
            progress={prog(f, k.photoEnd, 12, linear)}
            color={C.leafDeep}
            width={5}
            seed={8}
          />
        </g>
      ) : null}

      {/* ============ 2 · the box: the definition to learn word for word ============ */}
      {tint > 0 ? <rect x={BOX.x + 4} y={BOX.y + 4} width={BOX.w - 8} height={BOX.h - 8} rx={6} fill={W2.sticky} opacity={0.13 * tint} /> : null}

      {/* ============ 4 · highlighter swipes (under the ink) ============ */}
      {swipes.map((s, i) => (
        <HighlightSwipe key={i} x1={s.s.x0} x2={s.s.x1} y={bandY(s.base)} h={SIZE * 0.8} progress={prog(f, s.s0, s.s1 - s.s0, linear)} color={s.color} opacity={s.op} seed={i + 3} />
      ))}
      {/* "the energy to do it": synthesise glows (green) */}
      {synGlow > 0.01 ? (
        <rect x={SYN.x0 - 10} y={bandY(BASE[0]) - SIZE * 0.4} width={SYN.x1 - SYN.x0 + 20} height={SIZE * 0.8} rx={20} fill={C.leaf} opacity={0.45 * synGlow} filter={`url(#${gid}-soft)`} />
      ) : null}

      {/* ============ 3 · the definition ============ */}
      <Scribble x={X0} y={BASE[0]} text={L1.text} size={SIZE} progress={scribbleProgress(L1, writtenPx(L1, f))} />
      <Scribble x={X0} y={BASE[1]} text={L2.text} size={SIZE} progress={scribbleProgress(L2, writtenPx(L2, f))} />
      <HandBox x={BOX.x} y={BOX.y} w={BOX.w} h={BOX.h} progress={boxP} width={5} seed={4} />
      <InkTab x={TAB_X} y={BOX.y} text="LEARN THIS" progress={tabP} />
      <Scribble x={wfwX} y={BOX.y - 8} text="word for word!" size={64} color={C.coralDeep} progress={wfwP} />

      {/* ============ 4 · the notes ============ */}
      {/* A0 · synthesise = make */}
      <g opacity={focus(0)}>
        <HandArrow from={[SYN.cx - 6, BASE[0] - SIZE * 0.78]} to={[NOTE_X + 60, NOTE_Y + 16]} progress={a0Arrow} color={C.leafDeep} width={5} bend={-0.18} gapStart={4} gapEnd={6} seed={31} />
        <Scribble x={NOTE_X} y={NOTE_Y} text="= make" size={66} color={C.leafDeep} progress={a0Note} />
        <HammerDoodle x={NOTE_X + caveatWidth("= make", 66) + 64} y={NOTE_Y - 26} scale={0.78} rotate={32} progress={a0Hammer} />
      </g>

      {/* A1 · carbohydrates → glucose, a simple sugar */}
      <g opacity={focus(1)}>
        <HandArrow from={[CARB.cx, BASE[1] + 26]} to={[CARB.cx, ANN_Y - 52]} progress={a1Arrow} color={C.terracottaDeep} width={5} bend={0.12} seed={32} />
        {a1Glc > 0 ? <GlucoseBuddy x={CARB.cx} y={ANN_Y} r={44} progress={a1Glc} lit={a1Lit} look={[0, -0.6]} seed={7} /> : null}
        <Scribble x={CARB.cx - caveatWidth("glucose", 66) / 2} y={LABEL_Y} text="glucose" size={66} color={C.terracottaDeep} progress={prog(f, k.glucose, Math.max(10, k.glucoseEnd - k.glucose), linear)} />
        <Scribble x={CARB.cx - caveatWidth("a simple sugar", 58) / 2} y={SUB_Y} text="a simple sugar" size={58} progress={prog(f, k.aWord, Math.max(14, k.sugarEnd - k.aWord), linear)} />
      </g>

      {/* A2 · raw materials → carbon dioxide + water */}
      <g opacity={focus(2)}>
        <HandBracket from={[co2X - 10, ANN_Y - 58]} to={[waterX + 10, ANN_Y - 58]} depth={34} side={1} progress={a2Brace} color={C.iceDeep} width={5} seed={33} />
        <CO2Buddy x={co2X} y={ANN_Y + 4} scale={1.15} progress={a2Co2} look={0.5} seed={9} />
        <WaterDropBuddy x={waterX} y={ANN_Y} scale={0.92} progress={a2Water} look={-0.5} seed={4} />
        <SpokenPieces
          cx={RAW.cx}
          y={LABEL_Y}
          size={RAW_SIZE}
          f={f}
          pieces={[
            { text: RAW_LABEL[0], color: C.iceDeep, t0: k.co2, t1: Math.max(k.co2 + 16, k.co2End) },
            { text: RAW_LABEL[1], color: C.iceDeep, t0: k.and, t1: k.and + 6 },
            { text: RAW_LABEL[2], color: C.iceDeep, t0: k.water, t1: Math.max(k.water + 10, k.waterEnd) },
          ]}
        />
      </g>

      {/* A3 · energy from light ← the sun */}
      <g opacity={focus(3)}>
        {rays3.map((r, i) => (
          <HandArrow key={i} from={r.from} to={r.to} progress={a3Rays(i)} color={C.amberDeep} width={5} bend={i === 1 ? 0 : (i - 1) * -0.06} seed={40 + i} />
        ))}
        {Array.from({ length: 6 }, (_, i) => {
          const r = rays3[(i + 1) % 3];
          return <Photon key={i} from={r.from} to={r.to} p={(f - (k.lightWord + 4 + i * 7)) / 14} size={0.45} color={C.amber} />;
        })}
        <SunBuddy x={SUN2[0]} y={SUN2[1]} r={50} progress={a3Sun} shine={sunShine} seed={6} />
      </g>

      {/* ============ pens ============ */}
      <Pen x={penTip[0]} y={penTip[1]} kind="pen" color={C.ink600} progress={penP} angle={-38} scale={0.86} />
      {swipes.map((s, i) => {
        const p = prog(f, s.s0, s.s1 - s.s0, linear);
        const inOut = prog(f, s.s0 - 12, 10) * (1 - prog(f, s.s1 + 3, 10, EASE.in));
        return inOut > 0 ? <Pen key={i} x={swipeX(s.s.x0, s.s.x1, p)} y={bandY(s.base) + 10} kind="marker" color={s.color} progress={inOut} angle={-52} scale={0.8} /> : null;
      })}

      <PartIntro part={1} title="What is photosynthesis?" look={{ bg: ["#FFF7E3", "#EFDDB8"], ink: W2.inkText, accent: "#C46A1F" }} />
    </WorldStage>
  );
};
