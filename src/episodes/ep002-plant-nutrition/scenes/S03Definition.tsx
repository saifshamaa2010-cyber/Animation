/**
 * S03 · Definition — "Photosynthesis is the process by which plants synthesise carbohydrates
 * from raw materials using energy from light."
 *
 * 1. You eat food (plate) / plants make food (a glucose ring forms in a sunlit leaf).
 * 2. The term arrives (underlined: the mark scheme's word). On "word for word" it moves up and the
 *    definition's four empty slots appear: the parts you have to learn, exactly.
 * 3. The definition builds as a flow chart, chip by chip, on the spoken words:
 *      raw materials ─┐
 *                     ├─► synthesise ─► carbohydrates
 *    energy from light┘
 * 4. Each part is then explained in turn (the others step back): synthesise = make,
 *    carbohydrate → glucose, raw materials → carbon dioxide + water, energy ← light.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { Glucose } from "../../../components/SugarChain";
import { Photon, SunBeams, SunIcon } from "../../../components/Light";
import { Leaf, Plant, Pot } from "../../../components/bio";
import { CarbonDioxide, HandUnderline, Water, mix, textWidth } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s03Timing } from "./S03Definition.timing";
import { CHIP, Chip, Connector, PlateMeal, chipWidth, elbow, plantLeaf } from "./parts/S03-props";

// ------------------------------------------------------------------ layout
const PLATE = { x: 600, y: 640, r: 150 } as const;
const PLANT = { x: 1320, y: 660, height: 430, leaves: 6, leafScale: 1.25 } as const;
const CAPTION_Y = 905;
const SUN_SRC: Pt = [2150, -260];
const MAKE_LEAF = 3; // a sunlit leaf on the right: where we watch glucose being made

// flow chart
const SYN = { x: 1030, y: 580 } as const;
const CARB = { x: 1590, y: 580 } as const;
const RAW = { x: 400, y: 450 } as const;
const LIGHT = { x: 400, y: 712 } as const;
const T = {
  syn: "synthesise",
  carb: "carbohydrates",
  raw: "raw materials",
  light: "energy from light",
} as const;
const GLC = { x: 1590, y: 748, s: 1.5 } as const;
const MOL_Y = 296;
const CO2_X = 262;
const H2O_X = 560;
const NAME_Y = 376;
const SUN = { x: 400, y: 872, r: 38 } as const;

/** A soft beam from the sun that crosses the line y = `y` between x0 and x1, ending at y = `yEnd`. */
const beamThrough = (x0: number, x1: number, y: number, yEnd: number): [Pt, Pt] => {
  const k = (yEnd - SUN_SRC[1]) / (y - SUN_SRC[1]);
  return [
    [SUN_SRC[0] + (x0 - SUN_SRC[0]) * k, yEnd],
    [SUN_SRC[0] + (x1 - SUN_SRC[0]) * k, yEnd],
  ];
};

const DIM = 0.36;

export const S03Definition: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s03Timing(sc);
  const gid = useSvgId("s03");

  // ---------------------------------------------------------------- 1 · eat vs make
  const plateIn = prog(f, k.plate - 6, 18);
  const plantIn = prog(f, k.plantIn - 4, 20);
  const exit = prog(f, k.define - 2, 22, EASE.in);
  const beams = prog(f, k.make - 2, 30) * (1 - exit);
  const leaf = plantLeaf(PLANT.x, PLANT.y + 6, PLANT.height, PLANT.leaves, PLANT.leafScale, MAKE_LEAF);
  const leafC = leaf.P(leaf.len * 0.08, 0);
  // photons land on the leaf from the sun (top right); each one is a packet of light energy
  const photonTargets = [-0.22, 0.12, -0.05, 0.25, -0.3, 0.05, 0.18, -0.12].map((u, i) => leaf.P(u * leaf.len, (i % 2 ? 1 : -1) * leaf.wid * 0.12));
  const photonEvery = 9;
  const photonStart = k.make + 4;
  const photonEnd = k.define - 4;
  const nPhot = Math.max(0, Math.floor((photonEnd - photonStart) / photonEvery));
  const leafGlow = Math.min(1, prog(f, photonStart + 18, 30) * 0.8 + 0.2 * Math.sin(f * 0.25) * prog(f, photonStart + 18, 30)) * (1 - exit);
  const glcP = prog(f, k.food - 10, 22);
  const glcPos: Pt = leafC;
  const youLabel = prog(f, k.plate, 16);
  const plantLabel = prog(f, k.makeWord - 2, 16);

  // ---------------------------------------------------------------- 2 · the term
  const headIn = prog(f, k.defWord - 4, 18);
  const headMove = prog(f, k.wordForWord - 4, Math.min(28, Math.max(12, k.defLine - k.wordForWord)), EASE.inOut);
  const headOut = prog(f, k.synthesise, 16);
  const headY = 500 + (250 - 500) * headMove;
  const headSize = 104 + (72 - 104) * headMove;
  const headW = textWidth("Photosynthesis", headSize, 700, -1.5);
  const ulP = prog(f, k.markScheme - 2, 24, (v) => v);
  const ulVis = 1 - prog(f, k.chipSyn - 6, 12);
  const wfwIn = prog(f, k.wordForWord + 2, 14) * (1 - prog(f, k.chipSyn - 8, 12));
  // the definition's four parts, waiting to be learnt (reading order: inputs, process, product)
  const slotIn = (i: number) => prog(f, k.wordForWord + 4 + i * 5, 14);

  // ---------------------------------------------------------------- 3 · the definition as a flow chart
  const synIn = prog(f, k.chipSyn - 4, 14);
  const carbIn = prog(f, k.chipCarb - 4, 14);
  const rawIn = prog(f, k.chipRaw - 4, 14);
  const lightIn = prog(f, k.chipLight - 4, 14);
  const synW = chipWidth(T.syn);
  const carbW = chipWidth(T.carb);
  const rawW = chipWidth(T.raw);
  const lightW = chipWidth(T.light);
  const synL: Pt = [SYN.x - synW / 2 - 8, SYN.y];
  const arrowSC: [Pt, Pt] = [[SYN.x + synW / 2 + 12, SYN.y], [CARB.x - carbW / 2 - 12, CARB.y]];
  const rawA: Pt = [RAW.x + rawW / 2 + 10, RAW.y];
  const lightA: Pt = [LIGHT.x + lightW / 2 + 10, LIGHT.y];
  const rawB: Pt = [synL[0], SYN.y - 16];
  const lightB: Pt = [synL[0], SYN.y + 16];

  // ---------------------------------------------------------------- 4 · each part explained (focus)
  const all = 1 - prog(f, k.synWord - 6, 12);
  const end = k.end + 20;
  const focusSyn = Math.max(all, window01(f, k.synWord - 6, k.carbs - 2, 10), window01(f, k.doIt - 4, end, 12));
  const focusCarb = Math.max(all, window01(f, k.carbs - 6, k.raw - 2, 10));
  const focusRaw = Math.max(all, window01(f, k.raw - 6, k.light - 2, 10));
  const focusLight = Math.max(all, window01(f, k.light - 6, end, 10));
  const op = (focus: number) => DIM + (1 - DIM) * focus;
  const flip = prog(f, k.means, Math.min(16, Math.max(8, k.carbs - k.means - 4)), EASE.inOut);
  const synPulse = pulse(f, k.synWord - 2, 18);
  // glucose: the first carbohydrate a plant makes
  const glcIn = prog(f, k.glucose - 6, 20);
  const makesFlow = prog(f, k.makes - 4, 22, EASE.inOut);
  // raw materials
  const co2In = prog(f, k.co2 - 4, 18);
  const h2oIn = prog(f, k.water - 4, 18);
  // light: the sun's photons feed the chip; energy flows along the connector into "synthesise"
  const sunIn = prog(f, k.sun - 4, 18);
  const sunPhot = Array.from({ length: 14 }, (_, i) => {
    const start = k.sun + 4 + i * 9;
    const dx = [-34, 10, 34, -12, 24, -26, 0][i % 7];
    return { from: [SUN.x + dx * 0.6, SUN.y - 26] as Pt, to: [LIGHT.x + dx * 2.6, LIGHT.y + CHIP.h / 2 - 6] as Pt, p: (f - start) / 14 };
  });
  const lightGlow = prog(f, k.sun + 14, 20) * (0.75 + 0.25 * Math.sin(f * 0.3));
  const flowCurve = elbow(lightA, lightB);
  const pulses = Array.from({ length: 5 }, (_, i) => (f - (k.doIt - 6 + i * 20)) / 26);
  const synGlow = prog(f, k.doIt + 16, 20) * (0.7 + 0.3 * Math.sin(f * 0.3));

  const tagT = f;

  return (
    <Stage bg={{ tone: "warm", lightX: 0.62, lightY: 0.2 }}>
      <defs>
        <filter id={`${gid}-blur`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>

      {/* ============ 1 · you eat food / plants make food ============ */}
      {exit < 1 ? (
        <g opacity={1 - exit}>
          <SunBeams
            source={SUN_SRC}
            on={beams}
            fadeTo={[900, 1060]}
            beams={[beamThrough(1215, 1330, 420, 700), beamThrough(1370, 1470, 420, 700), beamThrough(1520, 1580, 420, 640)]}
          />
          <g transform={`translate(${-60 * exit} 0)`}>
            <PlateMeal x={PLATE.x} y={PLATE.y} r={PLATE.r} progress={plateIn} />
            <CaptionPair x={PLATE.x} y={CAPTION_Y} lead="you:" rest="eat food" p={youLabel} />
          </g>
          <g transform={`translate(${60 * exit} ${(1 - EASE.out(plantIn)) * 24})`} opacity={Math.min(1, plantIn * 1.4)}>
            {plantIn > 0 ? (
              <>
                <Plant x={PLANT.x} y={PLANT.y + 6} height={PLANT.height} leaves={PLANT.leaves} leafScale={PLANT.leafScale} />
                <Pot x={PLANT.x} y={PLANT.y} w={240} h={190} />
              </>
            ) : null}
            {/* light landing on the leaf: it lights up where the energy arrives */}
            {leafGlow > 0.01 ? <Leaf geo={leaf} sunlit={1} shadow={0} showStalk={false} opacity={leafGlow} /> : null}
            {leafGlow > 0.01 ? <ellipse cx={leafC[0]} cy={leafC[1]} rx={leaf.len * 0.42} ry={leaf.wid * 0.5} fill={C.sun} opacity={0.4 * leafGlow} filter={`url(#${gid}-blur)`} transform={`rotate(${leaf.ang} ${leafC[0]} ${leafC[1]})`} /> : null}
            {Array.from({ length: nPhot }, (_, i) => {
              const to = photonTargets[i % photonTargets.length];
              const dx = to[0] - SUN_SRC[0];
              const dy = to[1] - SUN_SRC[1];
              const L = Math.hypot(dx, dy);
              const from: Pt = [to[0] - (dx / L) * 520, to[1] - (dy / L) * 520];
              return <Photon key={i} from={from} to={to} p={(f - photonStart - i * photonEvery) / 22} />;
            })}
            {glcP > 0 ? <Glucose x={glcPos[0]} y={glcPos[1]} tone="sugar" glow={0.45 + 0.4 * (1 - prog(f, k.food + 12, 40))} scale={0.45 + 0.5 * EASE.out(glcP)} opacity={Math.min(1, glcP * 1.5)} /> : null}
            <CaptionPair x={PLANT.x} y={CAPTION_Y} lead="plants:" rest="make food" p={plantLabel} />
          </g>
        </g>
      ) : null}

      {/* ============ 2 · the term ============ */}
      {headIn > 0 && headOut < 1 ? (
        <g opacity={(1 - headOut) * Math.min(1, headIn * 1.4)}>
          <text
            x={960}
            y={headY + (1 - EASE.out(headIn)) * 18}
            textAnchor="middle"
            fontFamily={FONT}
            fontWeight={700}
            fontSize={headSize}
            fill={C.paper}
            letterSpacing={-1.5}
          >
            Photosynthesis
          </text>
          <HandUnderline x1={960 - headW / 2 - 6} x2={960 + headW / 2 + 10} y={headY + headSize * 0.24} progress={ulP} color={C.amber} width={8} seed={31} opacity={ulVis} />
          {wfwIn > 0 ? (
            <g opacity={wfwIn} transform={`translate(0 ${(1 - EASE.out(wfwIn)) * 14})`}>
              <text x={960} y={880} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={52} fill={C.amberLight} letterSpacing={-0.5}>
                learn it word for word
              </text>
            </g>
          ) : null}
        </g>
      ) : null}

      {/* ============ 3 + 4 · the definition, then each part explained ============ */}
      {/* empty slots (dashed) — filled by the chips as the words are spoken */}
      {[
        { c: RAW, w: rawW, p: slotIn(0) * (1 - rawIn) },
        { c: LIGHT, w: lightW, p: slotIn(1) * (1 - lightIn) },
        { c: SYN, w: synW, p: slotIn(2) * (1 - synIn) },
        { c: CARB, w: carbW, p: slotIn(3) * (1 - carbIn) },
      ].map((s, i) =>
        s.p > 0 ? (
          <rect key={i} x={s.c.x - s.w / 2} y={s.c.y - CHIP.h / 2} width={s.w} height={CHIP.h} rx={26} fill={C.paper} fillOpacity={0.04} stroke={C.paper} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="12 12" opacity={s.p} />
        ) : null,
      )}
      {[
        [rawA, rawB, slotIn(0) * (1 - prog(f, k.chipRaw - 8, 10))],
        [lightA, lightB, slotIn(1) * (1 - prog(f, k.chipLight - 8, 10))],
        [arrowSC[0], arrowSC[1], slotIn(3) * (1 - prog(f, k.chipCarb - 8, 10))],
      ].map(([a, b, p], i) =>
        (p as number) > 0 ? <path key={i} d={elbow(a as Pt, b as Pt).d} fill="none" stroke={C.paper} strokeOpacity={0.3} strokeWidth={3} strokeDasharray="6 12" strokeLinecap="round" opacity={p as number} /> : null,
      )}
      {/* connectors (behind the chips) */}
      <Connector a={rawA} b={rawB} p={prog(f, k.chipRaw - 8, 20, (v) => v)} color={C.ice} opacity={op(Math.max(focusRaw, focusSyn * 0.4))} />
      <Connector a={lightA} b={lightB} p={prog(f, k.chipLight - 8, 20, (v) => v)} color={C.sun} opacity={op(Math.max(focusLight, focusSyn * 0.4))} />
      <Connector a={arrowSC[0]} b={arrowSC[1]} p={prog(f, k.chipCarb - 8, 18, (v) => v)} color={C.paper} opacity={op(Math.max(focusCarb, focusSyn * 0.4))} />
      {/* "the carbohydrate a plant makes": a glow runs along the arrow into the product */}
      {makesFlow > 0 && makesFlow < 1 ? (
        <circle
          cx={arrowSC[0][0] + (arrowSC[1][0] - arrowSC[0][0]) * makesFlow}
          cy={SYN.y}
          r={16}
          fill={C.amberLight}
          opacity={0.9 * Math.sin(makesFlow * Math.PI)}
          filter={`url(#${gid}-blur)`}
        />
      ) : null}
      {/* energy from light flowing into "synthesise" */}
      {pulses.map((u, i) =>
        u > 0 && u < 1 ? (
          <g key={i} opacity={Math.sin(u * Math.PI)}>
            <circle cx={flowCurve.at(EASE.inOut(u))[0]} cy={flowCurve.at(EASE.inOut(u))[1]} r={20} fill={C.sun} opacity={0.6} filter={`url(#${gid}-blur)`} />
            <circle cx={flowCurve.at(EASE.inOut(u))[0]} cy={flowCurve.at(EASE.inOut(u))[1]} r={7} fill={mix(C.sun, C.paper, 0.6)} />
          </g>
        ) : null,
      )}

      <Chip
        cx={SYN.x}
        cy={SYN.y}
        text={T.syn}
        color={C.paper}
        progress={synIn}
        opacity={op(focusSyn)}
        flip={flip}
        back={["synthesise", "= make"]}
        backColor={C.paper}
        glow={Math.max(synPulse * 0.6, synGlow)}
        glowColor={synGlow > synPulse * 0.6 ? C.sun : C.paper}
      />
      <Chip cx={CARB.x} cy={CARB.y} text={T.carb} color={C.amber} textColor={C.amberLight} progress={carbIn} opacity={op(focusCarb)} glow={pulse(f, k.makes + 12, 24) * 0.8} />
      <Chip cx={RAW.x} cy={RAW.y} text={T.raw} color={C.ice} progress={rawIn} opacity={op(focusRaw)} />
      <Chip cx={LIGHT.x} cy={LIGHT.y} text={T.light} color={C.sun} progress={lightIn} opacity={op(focusLight)} glow={lightGlow * 0.7} />

      {/* carbohydrates → glucose, a simple sugar */}
      <g opacity={op(focusCarb)}>
        {glcIn > 0 ? <Glucose x={GLC.x} y={GLC.y} tone="sugar" glow={0.25 + 0.6 * (1 - prog(f, k.glucose + 10, 30))} scale={GLC.s * (0.6 + 0.4 * EASE.out(glcIn))} opacity={Math.min(1, glcIn * 1.5)} /> : null}
        <Label anchor={[GLC.x - 52, GLC.y + 8]} at={[GLC.x - 150, GLC.y + 52]} text="glucose" align="end" color={C.amberLight} progress={prog(f, k.glucose, 20)} />
        <SubText x={GLC.x - 150 - 14} y={GLC.y + 52 + 15 + 48} text="a simple sugar" p={prog(f, k.simple - 2, 14)} />
      </g>

      {/* raw materials → carbon dioxide and water */}
      <g opacity={op(focusRaw)}>
        <CarbonDioxide x={CO2_X} y={MOL_Y} scale={0.74} progress={co2In} temperature={25} seed={31} />
        <NameText x={CO2_X} y={NAME_Y} text="carbon dioxide" p={co2In} />
        {h2oIn > 0 ? (
          <text x={(CO2_X + H2O_X) / 2 + 52} y={NAME_Y} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.ink300} opacity={Math.min(1, h2oIn * 1.3)}>
            +
          </text>
        ) : null}
        <Water x={H2O_X} y={MOL_Y + 6} scale={0.86} progress={h2oIn} temperature={25} seed={32} />
        <NameText x={H2O_X} y={NAME_Y} text="water" p={h2oIn} />
      </g>

      {/* energy from light ← the sun */}
      <g opacity={op(focusLight)}>
        <SunIcon x={SUN.x} y={SUN.y} r={SUN.r} progress={sunIn} glow={0.5 + 0.3 * pulse(f, k.lightWord, 30)} />
        {sunIn > 0.5 ? sunPhot.map((ph, i) => <Photon key={i} from={ph.from} to={ph.to} p={ph.p} size={0.55} />) : null}
      </g>

      <SectionTag n={1} title="What is photosynthesis?" t={tagT} />
    </Stage>
  );
};

/** "you: eat food" — a quiet lead word and the idea in paper white. */
const CaptionPair: React.FC<{ readonly x: number; readonly y: number; readonly lead: string; readonly rest: string; readonly p: number }> = ({ x, y, lead, rest, p }) => {
  if (p <= 0) return null;
  return (
    <text x={x} y={y + (1 - EASE.out(p)) * 14} textAnchor="middle" fontFamily={FONT} fontSize={56} letterSpacing={-0.5} opacity={Math.min(1, p * 1.4)}>
      <tspan fontWeight={600} fill={C.ink300}>
        {lead}
      </tspan>
      <tspan fontWeight={700} fill={C.paper}>
        {" "}
        {rest}
      </tspan>
    </text>
  );
};

/** Molecule name under its glyph (ice blue = the raw materials). */
const NameText: React.FC<{ readonly x: number; readonly y: number; readonly text: string; readonly p: number }> = ({ x, y, text, p }) =>
  p > 0 ? (
    <text x={x} y={y + (1 - EASE.out(p)) * 10} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={42} fill={C.ice} opacity={Math.min(1, p * 1.3)} letterSpacing={-0.3}>
      {text}
    </text>
  ) : null;

/** Second line under a Label, arriving on its own word (same style as Label's sub). */
const SubText: React.FC<{ readonly x: number; readonly y: number; readonly text: string; readonly p: number }> = ({ x, y, text, p }) =>
  p > 0 ? (
    <text
      x={x + (1 - p) * 12}
      y={y}
      textAnchor="end"
      fontFamily={FONT}
      fontWeight={400}
      fontSize={40}
      fill={C.ink300}
      stroke={C.ink900}
      strokeWidth={6}
      strokeOpacity={0.6}
      paintOrder="stroke"
      opacity={p}
    >
      {text}
    </text>
  ) : null;
