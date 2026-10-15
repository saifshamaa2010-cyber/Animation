/**
 * S08 · Mineral ions — why a plant needs more than glucose, and what nitrate and magnesium are for.
 *
 * 1. Glucose holds only C, H and O. Proteins (a folded chain) unfold into their amino acids, and
 *    amino acids contain N — the element glucose doesn't have.
 * 2. Nitrate ions are absorbed from the soil by the roots, travel up to a leaf, and (in a lens: inside
 *    a cell) are used to make amino acids. Without enough nitrate: a stunted plant, older leaves yellow.
 * 3. Magnesium ions are absorbed the same way and are used to make chlorophyll (the chloroplast turns
 *    green). Without enough: leaves yellow between the veins → less chlorophyll → less light absorbed
 *    (photons bounce off) → less photosynthesis.
 * 4. The exam chain: 1 ion → 2 makes → 3 without it, with both examples beneath.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { Lens } from "../../../components/Lens";
import { SectionTag } from "../../../components/SectionTag";
import { Photon } from "../../../components/Light";
import { Glucose } from "../../../components/SugarChain";
import { Leaf, Plant, Pot, Roots, SoilBlock, leafGeometry } from "../../../components/bio";
import { HandBracket, HandCircle, mix, textWidth } from "../../../components/kit";
import { useSvgId } from "../../../components/ids";
import { Pt, rng } from "../../../lib/geometry";
import { jitter, prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s08Timing } from "./S08Minerals.timing";
import { plantLeaf, plantStem } from "./parts/S03-props";
import { alongPolyline, rootGeometry, sampleSmooth } from "./parts/S04-equation";
import { AtomBall } from "./parts/S05-chem";
import { ChipSlot, FoldChain, GreeningChloroplast, IonBall, IonDot, NBall, StepChip, StraightArrow, chainBeads } from "./parts/S08-minerals";

// ------------------------------------------------------------------ layout
/** part 1: glucose (left) vs protein / amino acids (right) */
const P1 = { leftX: 560, rightX: 1300, y: 400, capY: 548, atomY: 650, atomGap: 96, topY: 300 } as const;
/** part 2–3: the healthy plant in its soil */
const SOIL1 = { x: 140, y: 720, w: 600, h: 220 } as const;
const PLANT1 = { x: 440, y: 720, height: 360, leaves: 6, leafScale: 1.15 } as const;
const ROOTS1 = { x: 440, y: 724, depth: 100, spread: 240, seed: 5 } as const;
/** the nitrate-deficient plant beside it */
const SOIL2 = { x: 800, y: 720, w: 440, h: 220 } as const;
const PLANT2 = { x: 1020, y: 720, height: 190, leaves: 4, leafScale: 1.3 } as const;
const ROOTS2 = { x: 1020, y: 724, depth: 70, spread: 150, seed: 8 } as const;
/** the lens: "inside a leaf cell" */
const LENS = { cx: 1390, cy: 380, r: 220 } as const;
const LENS_LEAF = 3; // the leaf (right side, middle) the ions travel to
/** part 3: the big magnesium-deficient leaf */
const BIG_LEAF = leafGeometry({ cx: 1300, cy: 560, len: 820, wid: 420, ang: -14, stalk: 0.14, veinPairs: 6 });
/** part 4: the exam chain */
const EX = { cols: [400, 960, 1520], headY: 270, row1: 500, row2: 760 } as const;

// nitrate ions in the soil: the first two are absorbed, the other two stay in the soil
// (nitrate r ≈ 64, magnesium r ≈ 74: kept inside the soil block and clear of each other)
const NITRATES: readonly { at: Pt; root: number }[] = [
  { at: [212, 858], root: 2 },
  { at: [480, 790], root: 5 },
  { at: [640, 838], root: -1 },
];
const MAGS: readonly { at: Pt; root: number }[] = [
  { at: [220, 800], root: 2 },
  { at: [658, 806], root: 3 },
  { at: [440, 864], root: -1 },
];

// photons on the magnesium-deficient leaf: [u, v] in leaf fractions. One in four lands on a (green) vein and
// is absorbed; the rest land on yellow tissue and bounce off.
const HITS: readonly { u: number; v: number; vein: boolean }[] = (() => {
  const r = rng(808);
  return Array.from({ length: 22 }, (_, i) => {
    const vein = i % 4 === 1;
    const u = -0.36 + r() * 0.76;
    const side = r() < 0.5 ? -1 : 1;
    const v = vein ? -0.01 : side * (0.1 + r() * 0.15);
    return { u, v, vein };
  });
})();

export const S08Minerals: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s08Timing(sc);
  const gid = useSvgId("s08");

  // ================================================================ part 1
  const p1Out = 1 - prog(f, k.nitrate - 4, 16, EASE.in);
  const toLeft = prog(f, k.protein, 30, EASE.inOut);
  const gx = 960 + (P1.leftX - 960) * toLeft;
  const gScale = 2.2 - 0.25 * toLeft;
  const atomX = (i: number, n: number, cx: number) => cx + (i - (n - 1) / 2) * P1.atomGap;
  // the protein: appears folded on "proteins", unfolds on "made from", its amino acids pulse on "amino acids"
  const protP = prog(f, k.proteins - 4, 18);
  const unfold = prog(f, k.madeFrom - 2, Math.max(20, Math.min(36, k.amino - k.madeFrom + 10)), (v) => v);
  const fold = 1 - unfold;
  const capProtein = prog(f, k.proteins, 16);
  const toTop = EASE.inOut(prog(f, k.madeFrom + 4, 26, (v) => v));
  const bracketP = prog(f, k.madeFrom + 14, 18, (v) => v);
  const aaCap = prog(f, k.amino - 2, 16);
  const aaRipple = (i: number) => pulse(f, k.amino + i * 4, 18);
  const chonP = (i: number) => (i < 3 ? prog(f, k.contain - 4 + i * 4, 14) : prog(f, k.nWord - 2, 16));
  const nGlow = prog(f, k.nWord, 12) * (1 - 0.5 * prog(f, k.nWord + 50, 30));
  const nCircle = prog(f, k.nWord + 6, 20, (v) => v);

  // ================================================================ part 2: nitrate
  const stageIn = prog(f, k.nitrate + 2, 24);
  const plantIn = prog(f, k.nitrate + 8, 30);
  const rootsP = prog(f, k.nitrate + 14, 40, (v) => v);
  const stageOut = 1 - prog(f, k.magLack - 2, 18, EASE.in);
  const roots1 = rootGeometry(ROOTS1.x, ROOTS1.y, ROOTS1.depth, ROOTS1.spread, ROOTS1.seed);
  const stem1 = sampleSmooth(plantStem(PLANT1.x, PLANT1.y, PLANT1.height), 20);
  const leafG = plantLeaf(PLANT1.x, PLANT1.y, PLANT1.height, PLANT1.leaves, PLANT1.leafScale, LENS_LEAF);
  const nodeY = leafG.petiole[leafG.petiole.length - 1][1];
  const leafSpot: Pt = leafG.P(leafG.len * 0.05, 0);
  const routeOf = (ri: number): Pt[] => [
    ...[...roots1[ri].pts].reverse(),
    [ROOTS1.x, ROOTS1.y],
    ...stem1.filter((q) => q[1] >= nodeY),
    ...[...leafG.petiole].reverse(),
    leafSpot,
  ];
  const tipOf = (ri: number) => roots1[ri].pts[roots1[ri].pts.length - 1];

  // nitrate ions: appear on "nitrate", drift to the roots "from the soil", go in "through their roots"
  const nIonIn = (i: number) => prog(f, k.nitrateWord - 4 + i * 4, 16);
  const nIonsOut = 1 - prog(f, k.magnesium - 2, 16);
  const nDrift = prog(f, k.soil - 4, Math.max(24, k.roots - k.soil + 8), EASE.inOut);
  const nEnter = prog(f, k.roots + 2, 12);
  const nClimbStart = k.roots + 14;
  const nClimb = Math.max(26, Math.min(44, k.nitrateUse + 22 - nClimbStart));
  const nitrateLabel = prog(f, k.nitrateWord + 6, 20) * (1 - prog(f, k.nitrateUse + 6, 14));

  // the lens (nitrate → amino acids)
  const lensN = { cone: prog(f, nClimbStart + nClimb - 8, 16), open: prog(f, nClimbStart + nClimb, 20) };
  const lensNOut = 1 - prog(f, k.nitrateLack - 2, 16, EASE.in);
  const lensIonIn = prog(f, nClimbStart + nClimb + 8, 16);
  const nArrow = prog(f, k.makeAA - 4, 16, (v) => v);
  const beads = Math.max(0, Math.min(6, (f - (k.aminoAA - 6)) / 5));
  const beadGlow = prog(f, k.aminoAA + 26, 16);
  const aaLensCap = prog(f, k.aminoAA, 16);

  // nitrate deficiency: a second plant in soil without nitrate
  const p2In = prog(f, k.nitrateLack + 2, 26);
  const p2Grow = prog(f, k.nitrateLack + 6, 34);
  const p2Out = 1 - prog(f, k.magnesium - 4, 16, EASE.in);
  const lowN = prog(f, k.enoughN - 2, 16);
  const stuntP = prog(f, k.stunted - 6, 22, (v) => v);
  const stuntLabel = prog(f, k.stunted, 20);
  const yellowP = prog(f, k.turnYellow, 22, EASE.inOut);
  const olderLabel = prog(f, k.older - 2, 22);
  const p2Shift = (1 - EASE.out(p2In)) * 90;

  // ================================================================ part 3: magnesium
  const mIonIn = (i: number) => prog(f, k.mgWord - 4 + i * 4, 16);
  const mDrift = prog(f, k.mgWord + 14, Math.max(24, k.magnesiumUse - k.mgWord - 8), EASE.inOut);
  const mEnter = prog(f, k.magnesiumUse - 2, 12);
  const mClimbStart = k.magnesiumUse + 8;
  const mClimb = Math.max(24, Math.min(40, k.makeChl - 6 - mClimbStart));
  const mgLabel = prog(f, k.mgWord + 6, 20) * (1 - prog(f, k.magnesiumUse + 10, 14));
  const lensM = { cone: prog(f, mClimbStart + mClimb - 8, 16), open: prog(f, mClimbStart + mClimb, 20) };
  const lensMOut = 1 - prog(f, k.magLack - 4, 16, EASE.in);
  const mLensIonIn = prog(f, mClimbStart + mClimb + 6, 16);
  const mArrow = prog(f, Math.max(mClimbStart + mClimb + 10, k.makeChl - 4), 14, (v) => v);
  const greenP = prog(f, k.chlorophyll - 2, 26, EASE.inOut);
  const chlCap = prog(f, k.chlorophyll, 16);

  // magnesium deficiency: the big leaf
  const bigIn = prog(f, k.magLack + 2, 26);
  const bigOut = 1 - prog(f, k.examLine - 6, 16, EASE.in);
  const interveinal = prog(f, k.yellowMg - 4, 40, EASE.inOut);
  const betweenLabel = prog(f, k.between - 2, 22) * (1 - prog(f, k.lessPs - 6, 14));
  const chain1 = prog(f, k.lessPs, 18);
  const chain2 = prog(f, k.lessLight - 4, 18);
  const chain3 = prog(f, k.lessPhoto - 12, 18);
  const chainOut = bigOut;

  // ================================================================ part 4: exam chain
  const exIn = (at: number, d = 0) => prog(f, at - 4 + d, 18);
  const col1 = k.ion - 2;
  const col2 = k.used - 4;
  const col3 = k.happens - 8;

  // ---------------------------------------------------------------- helpers
  const ionJ = (seed: string, amp = 3) => jitter(seed, f, amp, 0.03);
  const healthyTone = () => "green" as const;

  // the nitrate ions' current positions
  const nitrateIons = NITRATES.map((n, i) => {
    const j = ionJ(`n${i}`);
    if (n.root < 0) return { at: [n.at[0] + j.dx, n.at[1] + j.dy] as Pt, scale: 1, dotAt: null as Pt | null, dotOp: 0, i };
    const tip = tipOf(n.root);
    const d = EASE.inOut(nDrift);
    const pos: Pt = [n.at[0] + (tip[0] - n.at[0]) * d + j.dx * (1 - d), n.at[1] + (tip[1] - n.at[1]) * d + j.dy * (1 - d)];
    const c = prog(f, nClimbStart + i * 8, nClimb, EASE.inOut);
    const dotAt = alongPolyline(routeOf(n.root), c);
    const dotOp = nEnter * (1 - prog(f, nClimbStart + i * 8 + nClimb - 4, 10));
    return { at: pos, scale: 1 - 0.7 * nEnter, dotAt, dotOp, i };
  });
  const magIons = MAGS.map((m, i) => {
    const j = ionJ(`m${i}`);
    if (m.root < 0) return { at: [m.at[0] + j.dx, m.at[1] + j.dy] as Pt, scale: 1, dotAt: null as Pt | null, dotOp: 0, i };
    const tip = tipOf(m.root);
    const d = EASE.inOut(mDrift);
    const pos: Pt = [m.at[0] + (tip[0] - m.at[0]) * d + j.dx * (1 - d), m.at[1] + (tip[1] - m.at[1]) * d + j.dy * (1 - d)];
    const c = prog(f, mClimbStart + i * 8, mClimb, EASE.inOut);
    const dotAt = alongPolyline(routeOf(m.root), c);
    const dotOp = mEnter * (1 - prog(f, mClimbStart + i * 8 + mClimb - 4, 10));
    return { at: pos, scale: 1 - 0.7 * mEnter, dotAt, dotOp, i };
  });

  // leaves of the nitrate-deficient plant: the two oldest (lowest) turn yellow
  const p2Leaves = [0, 1].map((i) => plantLeaf(PLANT2.x, PLANT2.y, PLANT2.height, PLANT2.leaves, PLANT2.leafScale, i));
  const p2Top: Pt = [PLANT2.x + 4, PLANT2.y - PLANT2.height];
  const p1Top: Pt = [PLANT1.x + 4, PLANT1.y - PLANT1.height];

  // causal chain text (magnesium deficiency)
  const CH = { x: 440, y: [420, 560, 700] } as const;

  // exam chain header widths
  const heads = [
    { text: "ion", color: C.ice },
    { text: "makes", color: C.leafLight },
    { text: "without it", color: C.leafYellow },
  ].map((h) => ({ ...h, w: 78 + textWidth(h.text, 44, 600) + 48 }));

  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.36 }}>
      <defs>
        <filter id={`${gid}-blur`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>

      {/* ============ part 1: C, H, O vs C, H, O, N ============ */}
      {p1Out > 0 ? (
        <g opacity={p1Out}>
          {/* glucose */}
          <Glucose x={gx} y={P1.y} tone="sugar" glow={0.25 + 0.3 * pulse(f, k.glucose - 2, 30)} scale={gScale} />
          <text x={gx} y={P1.capY} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={48} fill={C.amber} opacity={prog(f, k.glucose - 2, 14)} letterSpacing={-0.5}>
            glucose
          </text>
          {(["C", "H", "O"] as const).map((a, i) => (
            <AtomBall key={a} kind={a} x={atomX(i, 3, gx)} y={P1.atomY} p={prog(f, [k.carbon, k.hydrogen, k.oxygen][i] - 4, 16)} glow={pulse(f, [k.carbon, k.hydrogen, k.oxygen][i] - 2, 26)} />
          ))}

          {/* protein → amino acids */}
          {protP > 0 ? (
            <g opacity={Math.min(1, protP * 1.5)} transform={`translate(${P1.rightX} ${P1.y}) scale(${0.85 + 0.15 * EASE.out(protP)}) translate(${-P1.rightX} ${-P1.y})`}>
              <FoldChain x={P1.rightX} y={P1.y} r={34} fold={fold} hull={fold} />
              {/* each amino acid pulses as it is named */}
              {chainBeads(P1.rightX, P1.y, 34, fold).map((b, i) => {
                const a = aaRipple(i);
                return a > 0 ? <circle key={i} cx={b[0]} cy={b[1]} r={34 + 10 * a} fill="none" stroke={C.paper} strokeOpacity={0.6 * a} strokeWidth={3} /> : null;
              })}
            </g>
          ) : null}
          {/* "protein": under the folded protein, then up over the whole chain with a bracket */}
          {capProtein > 0 ? (
            <text
              x={P1.rightX}
              y={P1.capY + (P1.topY - 14 - P1.capY) * toTop}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={600}
              fontSize={48}
              fill={C.paper}
              opacity={capProtein}
              letterSpacing={-0.5}
            >
              protein
            </text>
          ) : null}
          <HandBracket from={[P1.rightX - 250, P1.topY + 30]} to={[P1.rightX + 250, P1.topY + 30]} side={1} depth={26} progress={bracketP} color={C.paper} seed={81} />
          <text x={P1.rightX} y={P1.capY} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={48} fill={C.paper} opacity={aaCap} letterSpacing={-0.5}>
            amino acids
          </text>
          {(["C", "H", "O"] as const).map((a, i) => (
            <AtomBall key={a} kind={a} x={atomX(i, 4, P1.rightX)} y={P1.atomY} p={chonP(i)} />
          ))}
          <NBall x={atomX(3, 4, P1.rightX)} y={P1.atomY} p={chonP(3)} glow={nGlow} />
          <HandCircle cx={atomX(3, 4, P1.rightX)} cy={P1.atomY} rx={58} ry={56} progress={nCircle} color={C.ice} seed={83} />
        </g>
      ) : null}

      {/* ============ parts 2–3: the plant(s) in soil ============ */}
      {stageIn > 0 && stageOut > 0 ? (
        <g opacity={Math.min(1, stageIn * 1.3) * stageOut}>
          <SoilBlock x={SOIL1.x} y={SOIL1.y} w={SOIL1.w} h={SOIL1.h} seed={4} />
          <Roots x={ROOTS1.x} y={ROOTS1.y} depth={ROOTS1.depth} spread={ROOTS1.spread} progress={rootsP} seed={ROOTS1.seed} />
          {/* root tips flash as ions go in */}
          {[...NITRATES.map((n) => ({ root: n.root, at: k.roots + 4 })), ...MAGS.map((m) => ({ root: m.root, at: k.magnesiumUse }))].map((e, i) => {
            if (e.root < 0) return null;
            const a = pulse(f, e.at, 24);
            if (a <= 0) return null;
            const t = tipOf(e.root);
            return <circle key={i} cx={t[0]} cy={t[1]} r={18 + 16 * a} fill="none" stroke={i < NITRATES.length ? C.ice : C.leafLight} strokeOpacity={0.7 * a} strokeWidth={3} />;
          })}
          <g opacity={Math.min(1, plantIn * 1.4)} transform={`translate(0 ${(1 - EASE.out(plantIn)) * 26})`}>
            <Plant x={PLANT1.x} y={PLANT1.y} height={PLANT1.height} leaves={PLANT1.leaves} leafScale={PLANT1.leafScale} leafTone={healthyTone} />
          </g>
          {/* ions travelling up inside the plant */}
          {nitrateIons.map((n) => (n.dotAt && n.dotOp > 0 ? <IonDot key={`nd${n.i}`} at={n.dotAt} color={C.ice} opacity={n.dotOp} blurId={`${gid}-blur`} /> : null))}
          {magIons.map((m) => (m.dotAt && m.dotOp > 0 ? <IonDot key={`md${m.i}`} at={m.dotAt} color={C.leafLight} opacity={m.dotOp} blurId={`${gid}-blur`} /> : null))}
          {/* ions in the soil */}
          {nIonsOut > 0
            ? nitrateIons.map((n) => (
                <IonBall key={`n${n.i}`} x={n.at[0]} y={n.at[1]} kind="nitrate" color={C.ice} progress={nIonIn(n.i)} opacity={nIonsOut * (NITRATES[n.i].root >= 0 ? 1 - nEnter : 1)} />
              ))
            : null}
          {magIons.map((m) => (
            <IonBall key={`m${m.i}`} x={m.at[0]} y={m.at[1]} kind="magnesium" color={C.leafLight} progress={mIonIn(m.i)} opacity={MAGS[m.i].root >= 0 ? 1 - mEnter : 1} />
          ))}
        </g>
      ) : null}
      <Label anchor={[NITRATES[2].at[0] + 24, NITRATES[2].at[1] - 60]} at={[800, 640]} text="nitrate ions" color={C.ice} progress={nitrateLabel} opacity={stageOut} />
      <Label anchor={[MAGS[1].at[0] + 28, MAGS[1].at[1] - 70]} at={[800, 640]} text="magnesium ions" color={C.leafLight} progress={mgLabel} opacity={stageOut} />

      {/* the nitrate-deficient plant */}
      {p2In > 0 && p2Out > 0 ? (
        <g opacity={Math.min(1, p2In * 1.4) * p2Out} transform={`translate(${p2Shift} 0)`}>
          <SoilBlock x={SOIL2.x} y={SOIL2.y} w={SOIL2.w} h={SOIL2.h} seed={9} />
          <Roots x={ROOTS2.x} y={ROOTS2.y} depth={ROOTS2.depth} spread={ROOTS2.spread} progress={prog(f, k.nitrateLack + 10, 30, (v) => v)} seed={ROOTS2.seed} />
          <Plant x={PLANT2.x} y={PLANT2.y} height={PLANT2.height} leaves={PLANT2.leaves} leafScale={PLANT2.leafScale} progress={p2Grow} />
          {/* the two oldest leaves turn yellow */}
          {yellowP > 0 ? p2Leaves.map((g, i) => <Leaf key={i} geo={g} tone="yellow" shadow={0} opacity={yellowP} />) : null}
        </g>
      ) : null}
      {/* stunted: the healthy plant's height carried across */}
      {stuntP > 0 && p2Out > 0 ? (
        <g opacity={p2Out}>
          <line x1={p1Top[0] + 130} y1={p1Top[1]} x2={p1Top[0] + 130 + (1190 - p1Top[0] - 130) * stuntP} y2={p1Top[1]} stroke={C.ink300} strokeWidth={3} strokeDasharray="10 12" strokeLinecap="round" />
          <StraightArrow from={[1160, p1Top[1] + 12]} to={[1160, p2Top[1] - 4]} p={prog(f, k.stunted, 18)} color={C.coral} width={4} head={14} />
        </g>
      ) : null}
      {stuntLabel > 0 && p2Out > 0 ? (
        <text x={1186 - (1 - EASE.out(stuntLabel)) * 12} y={(p1Top[1] + p2Top[1]) / 2 + 15} fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.coral} opacity={stuntLabel * p2Out} letterSpacing={-0.5}>
          stunted
        </text>
      ) : null}
      <Label anchor={[SOIL2.x + SOIL2.w - 70, SOIL2.y + 70]} at={[1290, 810]} text="low nitrate" color={C.ice} progress={lowN} opacity={p2Out} />
      <Label anchor={p2Leaves[1].P(0.1 * p2Leaves[1].len, 0)} at={[1290, 640]} text="older leaves yellow" color={C.leafYellow} progress={olderLabel} opacity={p2Out} />

      {/* the lens: inside a leaf cell */}
      {lensN.cone > 0 && lensNOut > 0 ? (
        <Lens cx={LENS.cx} cy={LENS.cy} r={LENS.r} from={leafSpot} fromR={30} cone={lensN.cone} open={lensN.open} opacity={lensNOut}>
          <IonBall x={LENS.cx} y={LENS.cy - 100 + (1 - EASE.out(lensIonIn)) * -40} kind="nitrate" color={C.ice} progress={lensIonIn} />
          <StraightArrow from={[LENS.cx, LENS.cy - 18]} to={[LENS.cx, LENS.cy + 34]} p={nArrow} color={C.paper} width={5} head={16} />
          <FoldChain x={LENS.cx} y={LENS.cy + 82} r={22} fold={0} shown={beads} glow={beadGlow} />
        </Lens>
      ) : null}
      {lensNOut > 0 ? (
        <text x={LENS.cx} y={LENS.cy + LENS.r + 76} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={48} fill={C.paper} opacity={aaLensCap * lensNOut} letterSpacing={-0.5}>
          amino acids
        </text>
      ) : null}
      {lensM.cone > 0 && lensMOut > 0 ? (
        <Lens cx={LENS.cx} cy={LENS.cy} r={LENS.r} from={leafSpot} fromR={30} cone={lensM.cone} open={lensM.open} opacity={lensMOut}>
          <IonBall x={LENS.cx} y={LENS.cy - 100 + (1 - EASE.out(mLensIonIn)) * -40} kind="magnesium" color={C.leafLight} progress={mLensIonIn} />
          <StraightArrow from={[LENS.cx, LENS.cy - 14]} to={[LENS.cx, LENS.cy + 34]} p={mArrow} color={C.paper} width={5} head={16} />
          <GreeningChloroplast x={LENS.cx} y={LENS.cy + 96} scale={1.45} green={greenP} glow={pulse(f, k.chlorophyll + 4, 40)} progress={prog(f, mClimbStart + mClimb + 12, 16)} />
        </Lens>
      ) : null}
      {lensMOut > 0 ? (
        <text x={LENS.cx} y={LENS.cy + LENS.r + 76} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={48} fill={C.leaf} opacity={chlCap * lensMOut} letterSpacing={-0.5}>
          chlorophyll
        </text>
      ) : null}

      {/* ============ magnesium deficiency: yellow between the veins ============ */}
      {bigIn > 0 && bigOut > 0 ? (
        <g opacity={bigOut}>
          <Leaf geo={BIG_LEAF} progress={bigIn} interveinal={interveinal} shadow={0.5} />
          {/* light: absorbed where there's chlorophyll (veins), bouncing off the yellow parts */}
          {HITS.map((h, i) => {
            const t0 = k.lessPs + 4 + i * 6;
            const travel = 16;
            const hit = BIG_LEAF.P(h.u * BIG_LEAF.len, h.v * BIG_LEAF.wid);
            const from: Pt = [hit[0] + 330, hit[1] - 520];
            const arrive = f - t0 - travel;
            return (
              <g key={i}>
                <Photon from={from} to={hit} p={(f - t0) / travel} size={1} />
                {h.vein ? (
                  arrive >= 0 && arrive < 22 ? (
                    <g opacity={1 - arrive / 22}>
                      <circle cx={hit[0]} cy={hit[1]} r={26} fill={C.leafLight} opacity={0.35} filter={`url(#${gid}-blur)`} />
                      <circle cx={hit[0]} cy={hit[1]} r={10 + 34 * prog(arrive, 0, 22)} fill="none" stroke={C.leafLight} strokeWidth={3.5} />
                    </g>
                  ) : null
                ) : (
                  <Photon from={hit} to={[hit[0] + (i % 2 ? 250 : -270), hit[1] - 440]} p={arrive / travel} size={1} />
                )}
              </g>
            );
          })}
        </g>
      ) : null}
      <Label anchor={BIG_LEAF.P(0.12 * BIG_LEAF.len, -0.25 * BIG_LEAF.wid)} at={[1440, 236]} align="end" text="yellow between veins" color={C.leafYellow} progress={betweenLabel} opacity={bigOut} />
      {/* less chlorophyll → less light absorbed → less photosynthesis */}
      {chainOut > 0 ? (
        <g opacity={chainOut}>
          {[
            { p: chain1, text: "less chlorophyll", color: C.leaf },
            { p: chain2, text: "less light absorbed", color: C.sun },
            { p: chain3, text: "less photosynthesis", color: C.paper },
          ].map((c, i) =>
            c.p > 0 ? (
              <text key={i} x={CH.x} y={CH.y[i] + 17 + (1 - EASE.out(c.p)) * 14} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={48} fill={c.color} opacity={c.p} letterSpacing={-0.5}>
                {c.text}
              </text>
            ) : null,
          )}
          <StraightArrow from={[CH.x, CH.y[0] + 40]} to={[CH.x, CH.y[1] - 44]} p={prog(f, k.lessLight - 10, 14)} color={C.ink300} width={4} head={14} />
          <StraightArrow from={[CH.x, CH.y[1] + 40]} to={[CH.x, CH.y[2] - 44]} p={prog(f, k.lessPhoto - 18, 14)} color={C.ink300} width={4} head={14} />
        </g>
      ) : null}

      {/* ============ part 4: the exam chain ============ */}
      {f >= k.examLine - 10 ? (
        <g>
          {/* "link three things": three numbered places, linked, then filled as each is named */}
          {heads.map((h, i) => (
            <ChipSlot key={`s${h.text}`} cx={EX.cols[i]} cy={EX.headY} n={i + 1} width={h.w} color={h.color} p={prog(f, k.examLine + 2 + i * 5, 16) * (1 - prog(f, [col1, col2, col3][i] - 2, 8))} />
          ))}
          {heads.map((h, i) => (
            <StepChip key={h.text} cx={EX.cols[i]} cy={EX.headY} n={i + 1} text={h.text} width={h.w} color={h.color} p={exIn([col1, col2, col3][i])} glow={pulse(f, [col1, col2, col3][i], 30)} />
          ))}
          {[0, 1].map((i) => (
            <StraightArrow
              key={`h${i}`}
              from={[EX.cols[i] + heads[i].w / 2 + 22, EX.headY]}
              to={[EX.cols[i + 1] - heads[i + 1].w / 2 - 22, EX.headY]}
              p={prog(f, k.link - 2 + i * 6, 14)}
              color={C.ink300}
              width={4}
              head={14}
            />
          ))}
          {/* row 1: nitrate → amino acids → stunted, older leaves yellow */}
          <IonBall x={EX.cols[0]} y={EX.row1} kind="nitrate" color={C.ice} progress={exIn(col1, 6)} />
          <FoldChain x={EX.cols[1]} y={EX.row1 - 16} r={26} fold={0} shown={6 * exIn(col2, 4)} glow={0.55} />
          <text x={EX.cols[1]} y={EX.row1 + 72} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paper} opacity={exIn(col2, 10)} letterSpacing={-0.5}>
            amino acids
          </text>
          {exIn(col3, 6) > 0 ? (
            <g opacity={Math.min(1, exIn(col3, 6) * 1.4)}>
              <Pot x={EX.cols[2]} y={EX.row1 + 72} w={124} h={80} />
              <Plant x={EX.cols[2]} y={EX.row1 + 76} height={180} leaves={4} leafScale={1.4} />
              {[0, 1].map((i) => (
                <Leaf key={i} geo={plantLeaf(EX.cols[2], EX.row1 + 76, 180, 4, 1.4, i)} tone="yellow" shadow={0} />
              ))}
            </g>
          ) : null}
          {/* row 2: magnesium → chlorophyll → yellow between the veins */}
          <IonBall x={EX.cols[0]} y={EX.row2} kind="magnesium" color={C.leafLight} progress={exIn(col1, 12)} />
          <GreeningChloroplast x={EX.cols[1]} y={EX.row2 - 18} scale={1.3} green={1} progress={exIn(col2, 10)} />
          <text x={EX.cols[1]} y={EX.row2 + 72} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.leaf} opacity={exIn(col2, 16)} letterSpacing={-0.5}>
            chlorophyll
          </text>
          <Leaf geo={leafGeometry({ cx: EX.cols[2] + 16, cy: EX.row2, len: 320, wid: 170, ang: -14, stalk: 0.14, veinPairs: 5 })} interveinal={1} progress={exIn(col3, 12)} shadow={0.4} />
          {/* row arrows */}
          {(
            [
              [EX.row1, 0, 492, 750],
              [EX.row1, 1, 1170, 1400],
              [EX.row2, 0, 502, 870],
              [EX.row2, 1, 1050, 1320],
            ] as const
          ).map(([ry, i, x0, x1], n) => (
            <StraightArrow key={`r${n}`} from={[x0, ry]} to={[x1, ry]} p={prog(f, [col2, col3][i] + 2 + (ry === EX.row2 ? 6 : 0), 14)} color={mix(C.ink300, C.ink500, 0.3)} width={4} head={13} />
          ))}
        </g>
      ) : null}

      <SectionTag n={3} title="Mineral ions" t={f} />
    </Stage>
  );
};
