/**
 * S13 · Rate method — how to measure the rate of photosynthesis with pondweed.
 *
 * 1. "rate" = how fast (a stopwatch runs).
 * 2. Pondweed goes into a beaker of water; a spatula of sodium hydrogencarbonate dissolves and
 *    carbon dioxide appears in the water.
 * 3. A lamp switches on: photons reach the pondweed and bubbles (mostly oxygen) rise from the cut end.
 *    The bubble rate is computed from the lamp's distance (intensity ∝ 1/d²), so it really speeds
 *    up and slows down as the lamp moves.
 * 4. Count the bubbles (the counter ticks on each bubble that reaches the surface), or collect the gas:
 *    a funnel goes over the pondweed and the gas syringe's plunger moves out (bubbles vary in size).
 * 5. The lamp moves along a ruler: closer → more light → faster bubbles. Variables are labelled on the
 *    things they belong to (lamp = independent: "you change"; syringe = dependent: "you measure"; plant,
 *    CO2, thermometer and "no other lights" = keep constant — the room light dims). The beaker then stands
 *    in a glass water bath (water rises round it): "water bath: steady temperature". LED: much less heat.
 * 6. New distance → a stopwatch runs while the bubble rate settles; three repeats merge into a mean.
 * 7. The other two factors (the CO2 and the thermometer are picked out), "change one thing at a time";
 *    three small set-ups, lamps at the same distance: more dissolved CO2 from left to right (more NaHCO3),
 *    then the CO2 evens out and the three water baths go to 15, 25 and 35 °C (example settings).
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { ExamTip } from "../../../components/ExamTip";
import { ChemText } from "../../../components/Equation";
import { Photon } from "../../../components/Light";
import { Pondweed } from "../../../components/bio";
import { Beaker, GasSyringe, Lamp, Ruler } from "../../../components/lab/Lab";
import { Bubble, CarbonDioxide, Counter, Stopwatch } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s13Timing } from "./S13RateMethod.timing";
import {
  BATH,
  BATH_WATER_Y,
  BEAKER,
  BeakerThermometer,
  COL_X,
  DeliveryTube,
  FUNNEL,
  FUNNEL_PATH,
  Funnel,
  GlassBath,
  LAMP_Y,
  LabelLine,
  MiniRig,
  REPEAT_MEAN_LEN,
  RIG,
  RIG_CO2,
  RIG_T0,
  RIG_TEMPS,
  RULER,
  rigTransform,
  rigX,
  RepeatBars,
  SURFACE_Y,
  SYRINGE,
  Spatula,
  THERMO,
  TIP,
  WATER,
  WEED,
  bubbleAt,
  intensity,
  lampOn,
  lampX,
  schedule,
} from "./parts/S13-rate";

/** dissolved carbon dioxide (from the sodium hydrogencarbonate) */
const CO2S: readonly Pt[] = [
  [902, 604],
  [1072, 640],
  [896, 792],
  [1086, 772],
];
const CO2_ROT = [-20, 15, 50, 0];
/** the "more NaHCO3" arrow across the three small set-ups (screen coordinates) */
const MORE = { x0: rigX(0, RIG.xs[0] + RIG.beakerDx) - 40, x1: rigX(2, RIG.xs[2] + RIG.beakerDx) + 40, y: 446, textY: 412 } as const;

export const S13RateMethod: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s13Timing(sc);
  const gid = useSvgId("s13");

  // ---------------------------------------------------------------- 1. rate = how fast
  const introOut = 1 - prog(f, k.pondweed - 10, 14, EASE.in);
  const swP = prog(f, k.howFast - 4, 18);
  const howP = prog(f, k.howFast + 2, 18);
  const rateP = prog(f, k.rateWord - 2, 16);

  // ---------------------------------------------------------------- 2. the beaker, pondweed, NaHCO3
  const beakerP = prog(f, k.pondweed - 4, 18);
  const weedP = prog(f, k.pondweedWord - 8, 30);
  const weedDy = (1 - EASE.out(weedP)) * -230;
  const setupLabelsOut = 1 - prog(f, k.bubbles - 12, 12);

  // ---------------------------------------------------------------- 3. lamp + light + bubbles
  const funnelReady = k.collect + 20;
  const S = schedule(k, funnelReady);
  const lampP = prog(f, k.bubbles - 6, 18);
  const lx = lampX(f, k) - (1 - EASE.out(lampP)) * 70;
  const on = lampOn(f, k);
  const I = intensity(lampX(f, k));
  const glow = on * Math.min(0.55, 0.16 * I);

  // ---------------------------------------------------------------- 4. counting vs collecting
  const riseLen = TIP[1] - SURFACE_Y;
  const countP = prog(f, k.count - 4, 16) * (1 - prog(f, k.collect - 8, 14, EASE.in));
  let counted = 0;
  for (const b of S.bubbles) {
    if (b.funnel) continue;
    const arr = b.e + riseLen / b.speed;
    if (arr >= k.count && f >= arr) counted += Math.min(1, 0.75 + (f - arr) / 16);
  }
  const funnelP = prog(f, k.collect - 12, 30, EASE.inOut);
  const funnelDy = (1 - funnelP) * -300;
  const tubeP = prog(f, k.collect + 16, 24, (v) => v);
  const syrP = prog(f, k.collect + 26, 16);
  // plunger: total volume of the gas that has arrived (bubble volume ∝ r³)
  const effLen = FUNNEL_PATH.slice(1).reduce((acc, q, i) => acc + Math.hypot(q[0] - FUNNEL_PATH[i][0], q[1] - FUNNEL_PATH[i][1]) / (i >= 1 ? 1.8 : 1), 0);
  let vol = 0;
  let volAll = 0;
  for (const b of S.bubbles) {
    if (!b.funnel) continue;
    const v = b.r ** 3;
    volAll += v;
    const arr = b.e + effLen / b.speed;
    vol += v * Math.max(0, Math.min(1, (f - arr) / 8));
  }
  const plunger = volAll > 0 ? (0.8 * vol) / volAll : 0;
  const bubs = S.bubbles.flatMap((b) => {
    const age = f - b.e;
    if (age < 0 || age > 400) return [];
    const a = bubbleAt(b, age, FUNNEL_PATH);
    if (a.done >= 1) return [];
    return [{ b, a, age, tube: b.funnel && a.pos[1] < FUNNEL.tubeY + 46 }];
  });
  const renderBubble = ({ b, a, age }: (typeof bubs)[number]) => (
    <Bubble key={b.seed} x={a.pos[0]} y={a.pos[1]} r={b.r * (1 - 0.6 * a.inTube)} progress={Math.min(1, age / 6)} pop={!b.funnel && a.done > 0 ? a.done : 0} seed={b.seed} wobble={0.6} />
  );
  const sizesP = prog(f, k.sizes - 2, 18);
  const measureOut = 1 - prog(f, k.lamp - 8, 14);

  // ---------------------------------------------------------------- 5. lamp distance, variables
  const rulerP = prog(f, k.lamp - 2, 34);
  const closerOut = 1 - prog(f, k.variables - 8, 12);
  const varsOut = 1 - prog(f, k.constant - 6, 14);
  const constOut = 1 - prog(f, k.acclimatise - 8, 14);
  const thermoP = prog(f, k.sameTemp - 12, 24);
  const heatGlow = pulse(f, k.lessHeat + 4, 44);
  // "no other lights on": the room light goes down, only the lamp lights the plant (stays down)
  const roomDim = 0.46 * prog(f, k.noLights - 2, 30, EASE.inOut);
  // water bath: the other constants step back, the thermometer is picked out, the bath goes round the beaker
  const focusTemp = 1 - prog(f, k.waterBath - 4, 16);
  const thermoCue = pulse(f, k.waterBath + 2, 50);
  const bathP = prog(f, k.stand - 6, 22);
  const bathFill = prog(f, k.stand + 8, 40, EASE.inOut);
  const sameTempOut = 1 - prog(f, k.bathWord - 24, 12);
  const co2Item = (() => {
    const i = 3;
    const [x, y] = CO2S[i];
    return [x + noise2D(`s13c${i}x`, f * 0.012, 0) * 14, y + noise2D(`s13c${i}y`, f * 0.012, 4) * 14] as Pt;
  })();

  // ---------------------------------------------------------------- 6. wait, repeat → mean
  const waitP = prog(f, k.wait - 6, 18) * (1 - prog(f, k.repeat - 8, 14, EASE.in));
  const waitSecs = 180 * prog(f, k.wait + 6, Math.max(40, k.adjust - k.wait + 10), EASE.inOut);
  const barsP = [0, 1, 2].map((i) => prog(f, k.repeatWord - 2 + i * 8, 18));
  const merge = prog(f, k.mean - 6, 24, EASE.inOut);
  const meanP = prog(f, k.mean + 12, 16);
  const repeatOut = 1 - prog(f, k.twoFactors - 30, 14); // the mean stays a moment, then makes room

  // ---------------------------------------------------------------- 7. the other two factors, one at a time
  const factorsP = prog(f, k.twoFactors - 12, 22);
  const factorsOut = 1 - prog(f, k.oneThing - 8, 12);
  const factorGlow = pulse(f, k.twoFactors - 10, 60);
  const tipP = prog(f, k.oneThing - 4, 22);
  const tipOut = 1 - prog(f, k.concentrations - 16, 14);
  const mainOut = 1 - prog(f, k.co2Method - 12, 16, EASE.inOut); // gone before the small set-ups arrive
  const rigP = [0, 1, 2].map((i) => prog(f, k.co2Method + 6 + i * 8, 24));
  // carbon dioxide: low / medium / high (molecules arrive one by one), then all evened out (same concentration)
  const even = prog(f, k.tempMethod + 2, 30, EASE.inOut);
  const rigCo2 = [0, 1, 2].map((i) => {
    const base = RIG_CO2[i] * prog(f, k.concentrations - 6 + i * 10, 34, (v) => v);
    return base + (RIG_CO2[1] - base) * even;
  });
  const lmhP = [0, 1, 2].map((i) => prog(f, k.concentrations + 2 + i * 10, 18));
  const lmhOut = 1 - prog(f, k.tempMethod - 4, 14);
  const moreP = prog(f, k.sodium2 - 6, 24);
  const moreOut = 1 - prog(f, k.tempMethod - 2, 12);
  const sameP = prog(f, k.tempMethod + 10, 18);
  // temperature: the three baths are set to different temperatures (example settings)
  const tempMove = prog(f, k.temps - 4, 40, EASE.inOut);
  const rigTemp = [0, 1, 2].map((i) => RIG_T0 + (RIG_TEMPS[i] - RIG_T0) * tempMove);
  const showTemp = prog(f, k.setBath - 2, 18);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.42, lightY: 0.42 }}>
      <defs>
        <filter id={`${gid}-blur`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={26} />
        </filter>
        <filter id={`${gid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>

      {/* no other lights on: the room light goes down */}
      {roomDim > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={C.ink950} opacity={roomDim} /> : null}

      {/* ============ 1. rate = how fast ============ */}
      {introOut > 0 ? (
        <g opacity={introOut}>
          <Stopwatch x={700} y={520} size={250} seconds={Math.max(0, (f - k.howFast) / 30)} progress={swP} />
          {rateP > 0 ? (
            <text x={880} y={500 + (1 - rateP) * 14} fontFamily={FONT} fontWeight={700} fontSize={110} fill={C.paper} opacity={rateP} letterSpacing={-1.5}>
              rate
            </text>
          ) : null}
          {howP > 0 ? (
            <text x={884} y={586 + (1 - howP) * 12} fontFamily={FONT} fontWeight={500} fontSize={52} fill={C.amberLight} opacity={howP}>
              how fast it happens
            </text>
          ) : null}
        </g>
      ) : null}

      {/* ============ the light-intensity apparatus (gives way to the three small set-ups) ============ */}
      {mainOut > 0 ? (
        <g opacity={mainOut}>
          {/* ============ ruler on the bench + lamp ============ */}
          {rulerP > 0 ? (
            <g opacity={Math.min(1, rulerP * 2)}>
              <Ruler x={RULER.x} y={RULER.y} length={RULER.length} step={RULER.step} progress={rulerP} />
              {/* where the lamp is on the ruler */}
              <line x1={lx + 46} x2={lx + 46} y1={LAMP_Y + 52} y2={RULER.y - 4} stroke={C.sun} strokeOpacity={0.55 * Math.min(1, rulerP * 1.5)} strokeWidth={3} strokeDasharray="6 10" />
              <path d={`M${lx + 34},${RULER.y - 16} L${lx + 58},${RULER.y - 16} L${lx + 46},${RULER.y - 2} Z`} fill={C.sun} opacity={Math.min(1, rulerP * 1.5)} />
            </g>
          ) : null}

          {/* contact shadow under the beaker (and the water bath) */}
          {beakerP > 0 ? <ellipse cx={BEAKER.x} cy={BEAKER.y + 4} rx={170 + 50 * bathP} ry={14} fill={C.ink950} opacity={0.45 * beakerP} filter={`url(#${gid}-soft)`} /> : null}

          {/* the water bath behind the beaker (the lamp's light shines into it) */}
          <g transform={`translate(0 ${(1 - EASE.out(bathP)) * 24})`}>
            <GlassBath x={BATH.x} y={BATH.y} w={BATH.w} h={BATH.h} level={BATH.level} fill={bathFill} layer="back" progress={bathP} />
          </g>

          {/* the lamp's light */}
          {lampP > 0 ? <Lamp x={lx} y={LAMP_Y} on={on * Math.min(1, 0.55 + 0.25 * I)} angle={0} beam={BEAKER.x - lx + 40} progress={lampP} /> : null}

          {/* ============ the beaker ============ */}
          <g transform={`translate(0 ${(1 - EASE.out(beakerP)) * 24})`}>
            <Beaker x={BEAKER.x} y={BEAKER.y} w={BEAKER.w} h={BEAKER.h} liquid={BEAKER.liquid} liquidColor={WATER} progress={beakerP}>
              {/* light reaching the plant */}
              {glow > 0.01 ? <ellipse cx={WEED.x} cy={WEED.y - 92} rx={62} ry={100} fill={C.leafLight} opacity={glow} filter={`url(#${gid}-blur)`} /> : null}
              {/* dissolved carbon dioxide */}
              {CO2S.map(([x, y], i) => {
                const p = prog(f, k.co2Word - 4 + i * 6, 16);
                if (p <= 0) return null;
                const nx = noise2D(`s13c${i}x`, f * 0.012, 0) * 14;
                const ny = noise2D(`s13c${i}y`, f * 0.012, 4) * 14;
                return (
                  <g key={i}>
                    {/* "the other two factors": carbon dioxide is one of them */}
                    {factorGlow > 0.01 ? <circle cx={x + nx} cy={y + ny} r={34 + 8 * factorGlow} fill="none" stroke={C.ice} strokeOpacity={0.75 * factorGlow} strokeWidth={4} /> : null}
                    <CarbonDioxide x={x + nx} y={y + ny} scale={0.3} rotate={CO2_ROT[i]} progress={p} seed={130 + i} />
                  </g>
                );
              })}
              {weedP > 0 ? (
                <g transform={`translate(0 ${weedDy})`}>
                  <Pondweed x={WEED.x} y={WEED.y} len={WEED.len} progress={weedP} />
                </g>
              ) : null}
              <BeakerThermometer dy={(1 - EASE.out(thermoP)) * -150} progress={thermoP} glow={Math.max(heatGlow, thermoCue, factorGlow)} />
              {/* bubbles from the cut end (the ones already in the delivery tube are drawn over it, below) */}
              {bubs.filter((x) => !x.tube).map(renderBubble)}
              <Funnel dy={funnelDy} progress={funnelP > 0 ? prog(f, k.collect - 12, 10) : 0} />
            </Beaker>
          </g>

          {/* the water bath's glass and waterline in front: the beaker stands IN the water */}
          <g transform={`translate(0 ${(1 - EASE.out(bathP)) * 24})`}>
            <GlassBath x={BATH.x} y={BATH.y} w={BATH.w} h={BATH.h} level={BATH.level} fill={bathFill} layer="front" progress={bathP} />
          </g>

          {/* photons from the lamp to the pondweed (speed of light is constant: travel time ∝ distance) */}
          {S.photons.map((ph, i) => {
            if (f < ph.e || f > ph.e + 60) return null;
            const from: Pt = [lampX(ph.e, k) + 50, LAMP_Y + ph.dy];
            const travel = Math.hypot(ph.to[0] - from[0], ph.to[1] - from[1]) / 26;
            return <Photon key={i} from={from} to={ph.to} p={(f - ph.e) / travel} size={0.5} />;
          })}

          {/* gas syringe */}
          <DeliveryTube p={tubeP} />
          {bubs.filter((x) => x.tube).map(renderBubble)}
          <GasSyringe x={SYRINGE.x} y={SYRINGE.y} length={SYRINGE.length} plunger={plunger} progress={syrP} />

          {/* the spatula of sodium hydrogencarbonate */}
          <Spatula f={f} start={k.sodium} leave={k.supplies + 12} />
        </g>
      ) : null}

      {/* ============ labels: setup ============ */}
      <Label
        anchor={[WEED.x - 30, WEED.y - 96]}
        at={[760, 744]}
        align="end"
        text="pondweed"
        sub="a water plant"
        subProgress={prog(f, k.waterPlant - 2, 14)}
        color={C.leafLight}
        progress={prog(f, k.pondweedWord + 10, 22)}
        opacity={setupLabelsOut}
      />
      <Label
        anchor={[968, SURFACE_Y + 24]}
        at={[772, 478]}
        align="end"
        text="sodium hydrogencarbonate"
        sub="supplies carbon dioxide"
        subProgress={prog(f, k.supplies - 2, 14)}
        color={C.paper}
        progress={prog(f, k.sodium - 2, 22)}
        opacity={setupLabelsOut}
      />
      <Label anchor={[TIP[0] + 4, TIP[1] - 66]} at={[1212, 476]} text="mostly oxygen" color={C.coral} progress={prog(f, k.mostly - 2, 22)} opacity={1 - prog(f, k.count - 8, 12)} />

      {/* ============ counting ============ */}
      {countP > 0 ? (
        <g opacity={countP}>
          <Counter x={COL_X + 220} y={540} value={counted} size={96} color={C.paper} progress={countP} />
          <text x={COL_X + 220} y={692} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paper} opacity={prog(f, k.perMinute - 6, 14)}>
            bubbles per minute
          </text>
        </g>
      ) : null}
      {sizesP > 0 && measureOut > 0 ? (
        <g opacity={measureOut}>
          {[
            [COL_X + 100, 12],
            [COL_X + 196, 20],
            [COL_X + 320, 30],
          ].map(([x, r], i) => (
            <Bubble key={i} x={x} y={576} r={r} progress={prog(f, k.sizes - 2 + i * 5, 16)} seed={300 + i} />
          ))}
          <text x={COL_X + 210} y={666} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paper} opacity={prog(f, k.sizes + 8, 14)}>
            sizes vary
          </text>
        </g>
      ) : null}
      <Label anchor={[SYRINGE.x + 60, SYRINGE.y - 34]} at={[SYRINGE.x + 60, 262]} text="measure volume" sub="more accurate" color={C.paper} progress={prog(f, k.volume - 4, 22)} opacity={measureOut} />

      {/* ============ lamp distance and the variables ============ */}
      <Label
        anchor={[lx, LAMP_Y - 50]}
        at={[lx - 40, 414]}
        align="end"
        text="closer lamp"
        sub="higher light intensity"
        subProgress={prog(f, k.higher - 2, 14)}
        color={C.sun}
        progress={prog(f, k.closer2 + 6, 22)}
        opacity={closerOut}
      />
      <Label
        anchor={[lx, LAMP_Y - 50]}
        at={[lx - 40, 414]}
        align="end"
        text="light intensity"
        sub="independent variable"
        subProgress={prog(f, k.independent - 2, 14)}
        color={C.sun}
        progress={prog(f, k.lightIV - 2, 22)}
        opacity={varsOut}
      />
      <LabelLine at={[lx - 40, 414]} align="end" text="you change" p={prog(f, k.youChange - 8, 16)} opacity={varsOut} />
      <Label
        anchor={[SYRINGE.x + 100, SYRINGE.y + 34]}
        at={[SYRINGE.x + 60, 556]}
        text="rate"
        sub="dependent variable"
        subProgress={prog(f, k.dependent - 2, 14)}
        color={C.coral}
        progress={prog(f, k.rate2 - 2, 22)}
        opacity={varsOut}
      />
      <LabelLine at={[SYRINGE.x + 60, 556]} align="start" text="you measure" p={prog(f, k.youMeasure - 8, 16)} opacity={varsOut} />
      {/* keep constant */}
      {prog(f, k.kept - 4, 14) > 0 && constOut > 0 ? (
        <text x={COL_X - 2} y={540} fontFamily={FONT} fontWeight={700} fontSize={48} fill={C.paper} opacity={prog(f, k.kept - 4, 14) * constOut}>
          keep constant
        </text>
      ) : null}
      {/* items stacked to match where their objects are (no crossing leader lines) */}
      <Label anchor={[THERMO.x + 14, THERMO.bulbY + 8]} at={[COL_X - 6, 620]} text="same temperature" color={C.paper} progress={prog(f, k.sameTemp + 4, 22)} opacity={constOut * sameTempOut} />
      <Label anchor={co2Item} at={[COL_X - 6, 692]} text="same carbon dioxide" color={C.ice} progress={prog(f, k.sameCo2 - 2, 22)} opacity={constOut * focusTemp} />
      <Label anchor={[WEED.x + 32, WEED.y - 26]} at={[COL_X - 6, 764]} text="same plant" color={C.leafLight} progress={prog(f, k.samePlant - 2, 22)} opacity={constOut * focusTemp} />
      <Label anchor={[COL_X - 6, 836]} at={[COL_X - 6, 836]} text="no other lights" color={C.sun} progress={prog(f, k.noLights - 2, 22)} opacity={constOut * focusTemp} />
      {/* the water bath keeps the temperature steady (takes the place of "same temperature") */}
      <Label
        anchor={[BATH.x + BATH.w / 2 - 25, BATH_WATER_Y + 34]}
        at={[COL_X - 6, 620]}
        text="water bath"
        sub="steady temperature"
        color={C.ice}
        progress={prog(f, k.bathWord - 14, 22)}
        opacity={constOut}
      />
      <Label
        anchor={[lx, LAMP_Y - 50]}
        at={[lx - 40, 414]}
        align="end"
        text="LED lamp"
        sub="much less heat"
        subProgress={prog(f, k.lessHeat - 2, 14)}
        color={C.sun}
        progress={prog(f, k.led - 2, 22)}
        opacity={constOut}
      />

      {/* ============ method: wait, repeat → mean ============ */}
      {waitP > 0 ? (
        <g opacity={waitP}>
          <Stopwatch x={COL_X + 220} y={650} size={210} seconds={waitSecs} progress={waitP} />
          <text x={COL_X + 220} y={836} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paper}>
            wait a few minutes
          </text>
        </g>
      ) : null}
      {barsP[0] > 0 && repeatOut > 0 ? (
        <g opacity={repeatOut}>
          <text x={COL_X - 2} y={588} fontFamily={FONT} fontWeight={700} fontSize={48} fill={C.paper} opacity={Math.min(1, barsP[0] * 2)}>
            repeat
          </text>
          <RepeatBars x={COL_X + 40} y={700} p={barsP} merge={merge} opacity={1} />
          {meanP > 0 ? (
            <text x={COL_X + 40 + REPEAT_MEAN_LEN + 24} y={716} fontFamily={FONT} fontWeight={700} fontSize={48} fill={C.paper} opacity={meanP}>
              mean
            </text>
          ) : null}
        </g>
      ) : null}

      {/* ============ 7. the other two factors, one at a time ============ */}
      {factorsOut > 0 && mainOut > 0 ? (
        <g opacity={factorsOut * mainOut}>
          <Label anchor={[THERMO.x + 14, THERMO.bulbY + 8]} at={[COL_X - 6, 620]} text="temperature" color={C.paper} progress={factorsP} />
          <Label anchor={co2Item} at={[COL_X - 6, 692]} text="carbon dioxide" color={C.ice} progress={prog(f, k.twoFactors - 6, 22)} />
        </g>
      ) : null}
      <ExamTip x={1100} y={262} text="change one thing at a time" progress={tipP} opacity={tipOut} />

      {/* three small set-ups: the lamps all at the same distance */}
      {rigP.map((p, i) => (
        <g key={i} transform={rigTransform(i)}>
          <MiniRig cx={RIG.xs[i]} f={f} p={p} co2={rigCo2[i]} temp={rigTemp[i]} showTemp={showTemp} seed={i} softId={`${gid}-soft`} />
        </g>
      ))}
      {/* more NaHCO3 from left to right … then the same in all three */}
      {moreP > 0 && moreOut > 0 ? (
        <g opacity={moreOut}>
          <line x1={MORE.x0} x2={MORE.x0 + (MORE.x1 - MORE.x0) * EASE.out(moreP)} y1={MORE.y} y2={MORE.y} stroke={C.ice} strokeWidth={5} strokeLinecap="round" />
          <path
            d={`M${MORE.x0 + (MORE.x1 - MORE.x0) * EASE.out(moreP) - 22},${MORE.y - 14} L${MORE.x0 + (MORE.x1 - MORE.x0) * EASE.out(moreP) + 2},${MORE.y} L${MORE.x0 + (MORE.x1 - MORE.x0) * EASE.out(moreP) - 22},${MORE.y + 14}`}
            fill="none"
            stroke={C.ice}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={Math.min(1, moreP * 2)}
          />
          <ChemText text="more NaHCO3" x={(MORE.x0 + MORE.x1) / 2} y={MORE.textY} size={50} weight={600} color={C.ice} anchor="middle" opacity={prog(f, k.sodium2 + 2, 16)} />
        </g>
      ) : null}
      {sameP > 0 ? <ChemText text="same NaHCO3" x={(MORE.x0 + MORE.x1) / 2} y={MORE.textY} size={50} weight={600} color={C.ice} anchor="middle" opacity={sameP} /> : null}
      {lmhOut > 0
        ? (["low", "medium", "high"] as const).map((w, i) =>
            lmhP[i] > 0 ? (
              <text key={w} x={rigX(i, RIG.xs[i] + RIG.beakerDx)} y={RIG.screenBench + 74 - (1 - lmhP[i]) * 10} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paper} opacity={lmhP[i] * lmhOut}>
                {w}
              </text>
            ) : null,
          )
        : null}

      <SectionTag n={7} title="Rate of photosynthesis" t={f} />
    </Stage>
  );
};
