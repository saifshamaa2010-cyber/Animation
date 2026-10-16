/**
 * S15 · Limiting factors — explaining the graph shapes.
 *
 * 1. Opens on S14's three graphs (its exam chips clear); the curves pulse on "shapes";
 *    "limiting factor" is defined with two pills: in short supply → limits the rate.
 * 2. The light graph returns big. Rising part shaded (sun): a marker climbs it — light intensity is
 *    limiting. Flat part shaded: the marker moves right but not up — light is no longer limiting;
 *    candidates appear (carbon dioxide, temperature).
 * 3. Repeat at a higher CO2 concentration (extra CO2 molecules across the whole graph). {same} At low light
 *    intensity the new curve traces EXACTLY over the old one (ice dashes on the sun line; the rising band
 *    brightens: "light intensity / still limiting"). {higher} Where the old curve bends over, the new one peels
 *    away, keeps rising for longer (dashed guide at its own knee, arrow from the old knee) and levels off
 *    higher (arrow) → carbon dioxide was the limiting factor on the flat part.
 * 4. Exam: name the factor (circled), then the reason (ExamTip: "increasing it increases the rate").
 * 5. Conditions: three slots fill with dawn/dull (light intensity), cold winter (temperature),
 *    bright warm summer (carbon dioxide); each card then gives its reason in a short line ("not much light",
 *    "less kinetic energy", "very little CO2 in air"). The card the narration has left dims.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { SectionTag } from "../../../components/SectionTag";
import { Graph } from "../../../components/Graph";
import { ExamTip } from "../../../components/ExamTip";
import { Thermometer } from "../../../components/Thermometer";
import { CarbonDioxide, HandArrow, HandCircle, HandUnderline, textWidth } from "../../../components/kit";
import { prog, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { GRAPHS } from "./layout";
import { s15Timing } from "./S15Limiting.timing";
import { S14_CHIPS, S14_DESCRIBE } from "./S14RateResults";
import { CO2_SPLIT, CommandChip, HIGH_KNEE, HIGH_PLATEAU, LIGHT_PLATEAU, LIGHT_SLOPE, TEMP_OPT, co2Curve, lightCurve, lightCurveHighCo2, tempCurve } from "./parts/S14-results";
import type { Curve } from "../../../components/Graph";
import { CARD, CardSlot, ConditionCard, DawnPicture, Pill, SummerPicture, WinterPicture, pillWidth } from "./parts/S15-limiting";

const [G1, G2, G3] = GRAPHS.small;
const B = GRAPHS.big;
const KNEE = LIGHT_PLATEAU / LIGHT_SLOPE; // where light stops being the limiting factor
const bx = (v: number) => B.x + (v / 10) * B.width;
const by = (v: number) => B.y + B.height - v * B.height * 0.92;
const s1x = (v: number) => G1.x + (v / 10) * G1.width;
const s1y = (v: number) => G1.y + G1.height - v * G1.height * 0.92;
/** caption row at the top of the big graph's shaded bands */
const CAP_Y = 296;
const PLATEAU_MID = (bx(KNEE) + bx(10)) / 2;
/** captions for the flat part sit in its empty lower half, under both curves */
const FLAT_CAP_Y = 590;

export const S15Limiting: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s15Timing(sc);

  // ---------------------------------------------------------------- 1. the three graphs → definition
  const clearS14 = 1 - prog(f, 0, 14, EASE.in);
  const smallOut = 1 - prog(f, k.defn - 8, 16, EASE.in);
  const curvePulse = (i: number) => pulse(f, k.shapes - 4 + i * 8, 26);
  const lfP = prog(f, k.limitingFactors - 4, 18) * (1 - prog(f, k.defn - 6, 12, EASE.in));
  const defP = prog(f, k.defn - 2, 18) * (1 - prog(f, k.graph - 8, 14, EASE.in));
  const shortP = prog(f, k.short - 4, 18);
  const limitsP = prog(f, k.limits - 4, 18);
  const pillGap = 110;
  const pw1 = pillWidth("in short supply");
  const pw2 = pillWidth("limits the rate");
  const pLeft = 960 - (pw1 + pillGap + pw2) / 2;

  // ---------------------------------------------------------------- 2. the big light graph
  const graphIn = prog(f, k.graph - 2, 26, (v) => v);
  const graphOut = 1 - prog(f, k.reason - 6, 16, EASE.in);
  const curve1 = prog(f, k.graph + 6, 30, EASE.inOut);
  const risingBand = prog(f, k.risingWord - 6, 22, EASE.inOut);
  const flatBand = prog(f, k.flat - 6, 22, EASE.inOut);
  const co2Band = prog(f, k.co2Was - 4, 20);
  const marker = track(f, [
    [k.risingIncreases - 10, 0.25],
    [Math.max(k.risingIncreases + 40, k.lightLimiting - 10), KNEE - 0.35, EASE.inOut],
    [k.noDifference - 40, KNEE - 0.35],
    [k.noDifference + 20, 9.4, EASE.inOut],
  ]);
  const markerOp = window01(f, k.risingIncreases - 12, k.other + 10, 10);
  const lightCapP = prog(f, k.lightLimiting - 4, 18) * (1 - prog(f, k.raise - 8, 14));
  const noLongerP = prog(f, k.longer - 4, 18) * (1 - prog(f, k.other - 6, 12));
  const elseP = prog(f, k.other - 2, 18) * (1 - prog(f, k.raise - 8, 14));
  const co2ChipP = prog(f, k.co2Other - 4, 18);
  const tempChipP = prog(f, k.tempOther - 4, 18) * (1 - prog(f, k.raise - 8, 14));
  const co2ChipOut = 1 - prog(f, k.raise - 8, 14);
  // the second experiment, at a higher carbon dioxide concentration
  // {same}: at low light intensity the new curve traces exactly over the old one (light is still limiting)
  const shared = track(f, [
    [k.low - 4, 0],
    [Math.max(k.low + 40, k.sameWord + 8), CO2_SPLIT, EASE.inOut],
  ]);
  // {higher}: where the old curve bends over, the new one peels away, keeps rising for longer, then levels off higher
  const peel = track(f, [
    [k.newCurve - 6, CO2_SPLIT],
    [Math.max(k.newCurve + 30, k.forLonger + 12), HIGH_KNEE + 0.15, EASE.inOut],
    [Math.max(k.forLonger + 42, k.levelsHigher + 20), 10, EASE.inOut],
  ]);
  // the dot rides the head of the new curve, stopping short of the "higher carbon dioxide" label
  const iceMarker = Math.min(9.4, f < k.newCurve - 6 ? shared : peel);
  const iceMarkerOp = window01(f, k.low - 4, k.proves + 10, 10);
  const sameBand = window01(f, k.low - 6, k.newCurve + 10, 16); // the light-limited part lights up again
  const stillP = prog(f, k.still - 4, 18) * (1 - prog(f, k.newCurve + 6, 14));
  const longerP = prog(f, k.forLonger - 8, 18) * (1 - prog(f, k.co2Was - 4, 14)); // its own knee, further right
  const longerArrow = prog(f, k.forLonger - 2, 22, (v) => v);
  const endLabels = prog(f, k.levelsHigher - 2, 18);
  const lowLabel = prog(f, k.higherCo2 - 4, 18);
  // "at a higher carbon dioxide concentration": more CO2 molecules, at every light intensity
  const moreCo2 = (i: number) => prog(f, k.higherCo2 + 8 + i * 6, 22) * (1 - prog(f, k.co2Was - 16, 14));
  const upArrow = prog(f, k.levelsHigher, 22, (v) => v);
  const provesP = prog(f, k.co2Was - 4, 20);
  const nameCircle = prog(f, k.name - 2, 24, (v) => v);

  // ---------------------------------------------------------------- 4. exam: name it, then the reason
  const tipOut = 1 - prog(f, k.conditions - 8, 14, EASE.in);
  const tipP = prog(f, k.reason + 2, 22) * tipOut;
  const named = prog(f, k.reason - 8, 28, EASE.inOut); // the circled factor rises above the tip
  const TIP_Y = 580;
  const tipText = "increasing it increases the rate";
  const tipL = 960 - (Math.max(textWidth(tipText, 50, 700), textWidth("EXAM TIP", 40, 700) + 60) + 90) / 2;
  const tipT = TIP_Y - 166 / 2;
  const underline = prog(f, k.rateUp - 2, 20, (v) => v) * tipOut;

  // ---------------------------------------------------------------- 5. conditions
  const slots = prog(f, k.conditions - 2, 20);
  const card1 = prog(f, k.dawn - 2, 20);
  const card2 = prog(f, k.winter - 2, 20);
  const card3 = prog(f, k.summer - 2, 20);
  // the card the narration has moved on from steps back
  const focus1 = 1 - 0.45 * prog(f, k.winter - 2, 20);
  const focus2 = 1 - 0.45 * prog(f, k.summer - 2, 20);

  const capText = (text: string, x: number, p: number, color: string, y = CAP_Y) =>
    p > 0 ? (
      <text
        x={x}
        y={y + (1 - EASE.out(p)) * 12}
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight={600}
        fontSize={44}
        fill={color}
        opacity={p}
        stroke={C.ink900}
        strokeWidth={8}
        strokeOpacity={0.6}
        paintOrder="stroke"
        letterSpacing={-0.5}
      >
        {text}
      </text>
    ) : null;
  const co2CapW = textWidth("carbon dioxide", 44, 600);

  // big graph: the original curve, then the higher-CO2 one in two parts: dashed over the shared light-limited
  // part (the same points), solid where it peels away. (Zero-length parts are left out: a round cap would dot.)
  const bigCurves: Curve[] = [{ f: lightCurve, color: C.sun, revealTo: 10 * curve1 }];
  if (shared > 0.02) bigCurves.push({ f: lightCurveHighCo2, color: C.ice, revealTo: shared, dashed: true });
  if (peel > CO2_SPLIT + 0.02) bigCurves.push({ f: lightCurveHighCo2, color: C.ice, revealFrom: CO2_SPLIT, revealTo: peel });

  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.4 }}>
      {/* ============ 1. S14's graphs, then the definition ============ */}
      {smallOut > 0 ? (
        <g opacity={smallOut}>
          <Graph
            {...G1}
            xDomain={[0, 10]}
            xLabel="light intensity"
            yLabel="rate"
            curves={[{ f: lightCurve, color: C.sun, revealTo: 10, width: 7 + 5 * curvePulse(0) }]}
            marker={{ x: 10, opacity: clearS14 }}
          />
          <Graph {...G2} xDomain={[0, 10]} xLabel="carbon dioxide concentration" yLabel="rate" curves={[{ f: co2Curve, color: C.ice, revealTo: 10, width: 7 + 5 * curvePulse(1) }]} />
          <Graph
            {...G3}
            xDomain={[0, 45]}
            xLabel="temperature"
            yLabel="rate"
            curves={[{ f: tempCurve, color: C.coral, revealTo: 45, width: 7 + 5 * curvePulse(2) }]}
            guides={[{ x: TEMP_OPT, label: "optimum", color: C.paper, opacity: 1 }]}
          />
          {/* S14's "describe" numbers and exam chips clear */}
          {clearS14 > 0 ? (
            <g opacity={clearS14}>
              {[0, 2, 4, 6, 8, 10].map((v) => (
                <g key={v}>
                  <line x1={s1x(v)} x2={s1x(v)} y1={G1.y + G1.height} y2={G1.y + G1.height + 14} stroke={C.paper} strokeWidth={3} />
                  <text x={s1x(v)} y={G1.y + G1.height + 52} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.paper}>
                    {v}
                  </text>
                </g>
              ))}
              <line x1={s1x(4)} x2={s1x(4)} y1={s1y(lightCurve(4)) + 14} y2={G1.y + G1.height - 4} stroke={C.paper} strokeWidth={3} strokeDasharray="7 10" />
              <HandCircle cx={s1x(4)} cy={G1.y + G1.height + 36} rx={32} ry={26} progress={1} color={C.amber} width={5} seed={14} />
              <CommandChip x={S14_CHIPS.x1} y={S14_CHIPS.y} word="describe" meaning={S14_DESCRIBE} progress={1} />
              <CommandChip x={S14_CHIPS.x2} y={S14_CHIPS.y} word="explain" meaning="why" progress={1} />
            </g>
          ) : null}
        </g>
      ) : null}
      {lfP > 0 ? (
        <text x={960} y={872 + (1 - EASE.out(lfP)) * 14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={72} fill={C.paper} opacity={lfP} letterSpacing={-1}>
          limiting factors
        </text>
      ) : null}
      {defP > 0 ? (
        <g opacity={defP}>
          <text x={960} y={440 + (1 - EASE.out(defP)) * 16} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={96} fill={C.paper} letterSpacing={-1.5}>
            limiting factor
          </text>
          <Pill x={pLeft + pw1 / 2} y={600} text="in short supply" color={C.amber} progress={shortP} />
          {limitsP > 0 ? (
            <path
              d={`M${pLeft + pw1 + 24},600 L${pLeft + pw1 + pillGap - 24},600 M${pLeft + pw1 + pillGap - 40},584 L${pLeft + pw1 + pillGap - 24},600 L${pLeft + pw1 + pillGap - 40},616`}
              fill="none"
              stroke={C.ink300}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={limitsP}
            />
          ) : null}
          <Pill x={pLeft + pw1 + pillGap + pw2 / 2} y={600} text="limits the rate" color={C.coral} progress={limitsP} />
        </g>
      ) : null}

      {/* ============ 2–3. the big light graph ============ */}
      {graphIn > 0 && graphOut > 0 ? (
        <g opacity={graphOut}>
          {/* shaded parts of the curve */}
          {risingBand > 0 ? <rect x={bx(0)} y={B.y} width={(bx(KNEE) - bx(0)) * risingBand} height={B.height} fill={C.sun} opacity={0.08 + 0.08 * sameBand} /> : null}
          {flatBand > 0 ? <rect x={bx(KNEE)} y={B.y} width={(bx(10) - bx(KNEE)) * flatBand} height={B.height} fill={co2Band > 0 ? C.ice : C.paper} opacity={0.05 + 0.05 * co2Band} /> : null}
          {flatBand > 0 ? <line x1={bx(KNEE)} x2={bx(KNEE)} y1={B.y} y2={B.y + B.height} stroke={C.paper} strokeOpacity={0.35 * flatBand} strokeWidth={3} strokeDasharray="8 10" /> : null}
          <Graph
            {...B}
            xDomain={[0, 10]}
            xLabel="light intensity"
            yLabel="rate of photosynthesis"
            axes={graphIn}
            curves={bigCurves}
            marker={f < k.low - 4 ? { x: marker, curve: 0, opacity: markerOp } : { x: iceMarker, curve: bigCurves.length - 1, opacity: iceMarkerOp }}
          />
          {/* "keeps rising for longer": the new curve's own knee, further along the light-intensity axis */}
          {longerP > 0 ? (
            <g opacity={longerP}>
              <line x1={bx(HIGH_KNEE)} x2={bx(HIGH_KNEE)} y1={B.y} y2={B.y + B.height} stroke={C.ice} strokeOpacity={0.5} strokeWidth={3} strokeDasharray="8 10" />
              <HandArrow from={[bx(KNEE) + 12, by(LIGHT_PLATEAU) + 54]} to={[bx(HIGH_KNEE) - 12, by(LIGHT_PLATEAU) + 54]} progress={longerArrow} color={C.ice} width={5} bend={0} seed={9} />
            </g>
          ) : null}
          {upArrow > 0 ? <HandArrow from={[bx(8.2), by(LIGHT_PLATEAU) - 18]} to={[bx(8.2), by(HIGH_PLATEAU) + 26]} progress={upArrow} color={C.ice} width={5} bend={0} seed={5} /> : null}
          {/* curve labels at the right-hand end */}
          {lowLabel > 0 ? (
            <text x={bx(10) + 26} y={by(LIGHT_PLATEAU) + 15} fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.sun} opacity={lowLabel}>
              lower carbon dioxide
            </text>
          ) : null}
          {endLabels > 0 ? (
            <text x={bx(10) + 26} y={by(HIGH_PLATEAU) + 15} fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.ice} opacity={endLabels}>
              higher carbon dioxide
            </text>
          ) : null}
          {/* band captions: light intensity is (still) the limiting factor on the rising part */}
          {lightCapP > 0 ? (
            <g opacity={lightCapP}>
              {capText("light intensity", (bx(0) + bx(KNEE)) / 2, 1, C.sun)}
              {capText("is limiting", (bx(0) + bx(KNEE)) / 2, 1, C.sun, CAP_Y + 52)}
            </g>
          ) : null}
          {stillP > 0 ? (
            <g opacity={stillP}>
              {capText("light intensity", (bx(0) + bx(KNEE)) / 2, 1, C.sun)}
              {capText("still limiting", (bx(0) + bx(KNEE)) / 2, 1, C.sun, CAP_Y + 52)}
            </g>
          ) : null}
          {capText("light no longer limiting", PLATEAU_MID, noLongerP, C.paper, FLAT_CAP_Y)}
          {capText("something else limits", PLATEAU_MID, elseP, C.paper, FLAT_CAP_Y)}
          {named <= 0 ? capText("carbon dioxide", PLATEAU_MID, provesP, C.ice, FLAT_CAP_Y) : null}
          {capText("was limiting", PLATEAU_MID, provesP, C.ice, FLAT_CAP_Y + 54)}
          {nameCircle > 0 && named <= 0 ? <HandCircle cx={PLATEAU_MID} cy={FLAT_CAP_Y - 15} rx={co2CapW / 2 + 26} ry={40} progress={nameCircle} color={C.amber} width={5} seed={6} /> : null}
          {/* candidates for the flat part */}
          {/* more carbon dioxide at every light intensity, under both curves */}
          {[
            [bx(1.6), 750, -20],
            [bx(3.0), 720, 25],
            [bx(4.6), 690, 60],
            [bx(6.2), 760, -10],
            [bx(7.6), 680, 10],
            [bx(9.0), 750, 40],
          ].map(([x, y, rot], i) =>
            moreCo2(i) > 0 ? (
              <CarbonDioxide
                key={`more${i}`}
                x={x + noise2D(`s15m${i}x`, f * 0.015, 0) * 16}
                y={y - (1 - EASE.out(moreCo2(i))) * 40 + noise2D(`s15m${i}y`, f * 0.015, 3) * 12}
                scale={0.42}
                rotate={rot}
                progress={moreCo2(i)}
                opacity={Math.min(1, moreCo2(i) * 1.5)}
                seed={160 + i}
              />
            ) : null,
          )}
          {co2ChipP > 0 && co2ChipOut > 0 ? (
            <g opacity={co2ChipP * co2ChipOut}>
              <CarbonDioxide x={PLATEAU_MID - 170} y={672} scale={0.5} progress={co2ChipP} seed={41} />
              <text x={PLATEAU_MID - 110} y={688} fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.ice}>
                carbon dioxide
              </text>
            </g>
          ) : null}
          {tempChipP > 0 ? (
            <g opacity={tempChipP}>
              <g transform={`translate(${PLATEAU_MID - 170} 724) scale(0.42) translate(${-(PLATEAU_MID - 170)} -724)`}>
                <Thermometer x={PLATEAU_MID - 170} y={724} height={70} temperature={30} min={0} max={50} ticks={[]} showValue={false} />
              </g>
              <text x={PLATEAU_MID - 110} y={766} fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.coral}>
                temperature
              </text>
            </g>
          ) : null}
        </g>
      ) : null}

      {/* ============ 4. exam: the named factor + the reason ============ */}
      {named > 0 && tipOut > 0 ? (
        <g opacity={tipOut} transform={`translate(${PLATEAU_MID + (960 - PLATEAU_MID) * named} ${FLAT_CAP_Y + (400 - FLAT_CAP_Y) * named}) scale(${1 + 0.3 * named})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.ice} letterSpacing={-0.5}>
            carbon dioxide
          </text>
          <HandCircle cx={0} cy={-15} rx={co2CapW / 2 + 26} ry={40} progress={1} color={C.amber} width={5} seed={6} />
        </g>
      ) : null}
      <ExamTip x={960} y={TIP_Y} text={tipText} progress={tipP} />
      {underline > 0 ? (
        <HandUnderline x1={tipL + 44 + textWidth("increasing it ", 50, 700)} x2={tipL + 44 + textWidth(tipText, 50, 700)} y={tipT + 138} progress={underline} color={C.amber} seed={12} />
      ) : null}

      {/* ============ 5. conditions ============ */}
      {CARD.xs.map((cx, i) => (
        <CardSlot key={i} cx={cx} progress={slots} opacity={1 - [card1, card2, card3][i]} />
      ))}
      <ConditionCard
        cx={CARD.xs[0]}
        title="dawn or dull day"
        factor="light intensity"
        factorColor={C.sun}
        progress={card1}
        factorP={prog(f, k.dawnFactor - 4, 18)}
        reason="not much light"
        reasonP={prog(f, k.dawnWhy, 18)}
        focus={focus1}
      >
        <DawnPicture cx={CARD.xs[0]} f={f} start={k.dawn} dull={k.dull} />
      </ConditionCard>
      <ConditionCard
        cx={CARD.xs[1]}
        title="cold winter day"
        factor="temperature"
        factorColor={C.coral}
        progress={card2}
        factorP={prog(f, k.winterFactor - 4, 18)}
        reason="less kinetic energy"
        reasonP={prog(f, k.less - 4, 18)}
        focus={focus2}
      >
        <WinterPicture cx={CARD.xs[1]} f={f} start={k.winter} />
      </ConditionCard>
      <ConditionCard
        cx={CARD.xs[2]}
        title="bright, warm summer"
        factor="carbon dioxide"
        factorColor={C.ice}
        progress={card3}
        factorP={prog(f, k.summerFactor - 4, 18)}
        reason="very little CO2 in air"
        reasonP={prog(f, k.summerWhy, 18)}
      >
        <SummerPicture cx={CARD.xs[2]} f={f} start={k.summer} co2={k.summerFactor} bright={k.plenty} tiny={k.tiny} />
      </ConditionCard>

      <SectionTag n={8} title="Limiting factors" t={f} />
    </Stage>
  );
};
