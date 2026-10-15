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
 *    things they belong to (lamp = independent, syringe = dependent; plant, CO2 and thermometer = kept
 *    the same). LED: much less heat (the thermometer stays put).
 * 6. New distance → a stopwatch runs while the bubble rate settles; three repeats merge into a mean.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
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
  BEAKER,
  BeakerThermometer,
  COL_X,
  DeliveryTube,
  FUNNEL,
  FUNNEL_PATH,
  Funnel,
  LAMP_Y,
  REPEAT_MEAN_LEN,
  RULER,
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

      {/* ============ ruler on the bench + lamp ============ */}
      {rulerP > 0 ? (
        <g opacity={Math.min(1, rulerP * 2)}>
          <Ruler x={RULER.x} y={RULER.y} length={RULER.length} step={RULER.step} progress={rulerP} />
          {/* where the lamp is on the ruler */}
          <line x1={lx + 46} x2={lx + 46} y1={LAMP_Y + 52} y2={RULER.y - 4} stroke={C.sun} strokeOpacity={0.55 * Math.min(1, rulerP * 1.5)} strokeWidth={3} strokeDasharray="6 10" />
          <path d={`M${lx + 34},${RULER.y - 16} L${lx + 58},${RULER.y - 16} L${lx + 46},${RULER.y - 2} Z`} fill={C.sun} opacity={Math.min(1, rulerP * 1.5)} />
        </g>
      ) : null}

      {/* contact shadow under the beaker */}
      {beakerP > 0 ? <ellipse cx={BEAKER.x} cy={BEAKER.y + 4} rx={170} ry={14} fill={C.ink950} opacity={0.45 * beakerP} filter={`url(#${gid}-soft)`} /> : null}

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
            return <CarbonDioxide key={i} x={x + nx} y={y + ny} scale={0.3} rotate={CO2_ROT[i]} progress={p} seed={130 + i} />;
          })}
          {weedP > 0 ? (
            <g transform={`translate(0 ${weedDy})`}>
              <Pondweed x={WEED.x} y={WEED.y} len={WEED.len} progress={weedP} />
            </g>
          ) : null}
          <BeakerThermometer dy={(1 - EASE.out(thermoP)) * -150} progress={thermoP} glow={heatGlow} />
          {/* bubbles from the cut end (the ones already in the delivery tube are drawn over it, below) */}
          {bubs.filter((x) => !x.tube).map(renderBubble)}
          <Funnel dy={funnelDy} progress={funnelP > 0 ? prog(f, k.collect - 12, 10) : 0} />
        </Beaker>
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
      {/* kept the same */}
      {prog(f, k.kept - 4, 14) > 0 && constOut > 0 ? (
        <text x={COL_X - 2} y={612} fontFamily={FONT} fontWeight={700} fontSize={48} fill={C.paper} opacity={prog(f, k.kept - 4, 14) * constOut}>
          kept constant
        </text>
      ) : null}
      {/* items stacked to match where their objects are (no crossing leader lines) */}
      <Label anchor={[THERMO.x + 14, THERMO.bulbY + 8]} at={[COL_X - 6, 692]} text="same temperature" color={C.paper} progress={prog(f, k.sameTemp + 4, 22)} opacity={constOut} />
      <Label anchor={co2Item} at={[COL_X - 6, 764]} text="same carbon dioxide" color={C.ice} progress={prog(f, k.sameCo2 - 2, 22)} opacity={constOut} />
      <Label anchor={[WEED.x + 32, WEED.y - 26]} at={[COL_X - 6, 836]} text="same plant" color={C.leafLight} progress={prog(f, k.samePlant - 2, 22)} opacity={constOut} />
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
      {barsP[0] > 0 ? (
        <g>
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

      <SectionTag n={7} title="Rate of photosynthesis" t={f} />
    </Stage>
  );
};
