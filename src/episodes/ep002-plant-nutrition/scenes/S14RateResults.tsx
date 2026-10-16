/**
 * S14 · Rate results — the three graphs, and why temperature is different.
 *
 * 1. Light intensity: the curve draws as it is described (rises, then levels off).
 * 2. Carbon dioxide: the light curve's shape is laid over the new axes ("the same shape"), then the
 *    real curve draws along it.
 * 3. Temperature: rises to an optimum, then falls quickly.
 * 4. Why: the light and CO2 graphs step aside for the EP001 teal enzyme and its substrates. On
 *    "This next part is for the Extended paper" the EXTENDED badge can join the section tag (which brightens
 *    while it arrives) until the exam technique — off by default, see MARK_EXTENDED. A
 *    thermometer and the marker on the temperature graph show the temperature. Below the optimum the
 *    molecules move faster (wander speed and trails ∝ temperature) and dock more often (each docking =
 *    an effective collision; the substrate turns into amber product). Above it the weak bonds snap,
 *    the enzyme denatures, the active site changes shape and a substrate bounces off.
 * 5. Exam technique: describe (what happens + numbers from the axes + their units, each part of the chip
 *    appearing as it is said) vs explain (why).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, EASE } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { Graph } from "../../../components/Graph";
import { Enzyme } from "../../../components/Enzyme";
import { Thermometer } from "../../../components/Thermometer";
import { HandArrow, HandCircle, HandCross, HandUnderline } from "../../../components/kit";
import { FONT } from "../../../brand/fonts";
import { Pt } from "../../../lib/geometry";
import { jitter, prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { track } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { GRAPHS } from "./layout";
import { MARK_EXTENDED, s14Timing } from "./S14RateResults.timing";
import {
  BOUND,
  CommandChip,
  DOCK_IN,
  ENZ,
  HOMES,
  LEAVE,
  MOUTH,
  RESPAWN,
  SUB_DOCK,
  Substrate,
  TEMP_OPT,
  co2Curve,
  commandChipWidth,
  enzymeSchedule,
  lightCurve,
  tempCurve,
  temperatureAt,
  wanderAt,
} from "./parts/S14-results";

const [G1, G2, G3] = GRAPHS.small;
const sxOf = (g: { x: number; width: number }, d0: number, d1: number) => (v: number) => g.x + ((v - d0) / (d1 - d0)) * g.width;
const syOf = (g: { y: number; height: number }) => (v: number) => g.y + g.height - v * g.height * 0.92;
const sx1 = sxOf(G1, 0, 10);
const sx2 = sxOf(G2, 0, 10);
const sy = syOf(G1);

/** what "describe" asks for (S15 opens on the same chip) */
export const S14_DESCRIBE = "what happens + numbers + units";
/** describe / explain chips (S15 opens on them and clears them) */
export const S14_CHIPS = (() => {
  const w1 = commandChipWidth("describe", S14_DESCRIBE);
  const w2 = commandChipWidth("explain", "why");
  const gap = 60;
  const left = 960 - (w1 + gap + w2) / 2;
  return { y: 838, x1: left + w1 / 2, x2: left + w1 + gap + w2 / 2, w1, w2 };
})();

export const S14RateResults: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s14Timing(sc);
  const frame = useCurrentFrame();

  // ---------------------------------------------------------------- the three graphs
  const ax1 = prog(f, k.lightGraph + 2, 24, (v) => v);
  const reveal1 = track(f, [
    [k.lightRise - 8, 0],
    [Math.max(k.lightRise + 20, k.lightRise2 + 14), 4.4, EASE.inOut],
    [k.levelsWord - 6, 4.4],
    [k.levelsWord - 6 + Math.max(16, Math.min(40, k.co2Graph - k.levelsWord)), 10, EASE.inOut],
  ]);
  const ax2 = prog(f, k.co2Graph, 24, (v) => v);
  const ghost = window01(f, k.same - 4, k.co2Off + 30, 12);
  const reveal2 = track(f, [
    [k.co2Rise - 6, 0],
    [Math.max(k.co2Rise + 30, k.co2Off + 8), 10, EASE.inOut],
  ]);
  const co2Arrow = prog(f, k.co2Word - 4, 26, (v) => v) * (1 - prog(f, k.tempGraph - 6, 12));
  const ax3 = prog(f, k.tempGraph, 24, (v) => v);
  const reveal3 = track(f, [
    [k.tempRise - 6, 0],
    [Math.max(k.tempRise + 20, k.optimum + 4), TEMP_OPT, EASE.inOut],
    [k.falls - 4, TEMP_OPT],
    [k.falls - 4 + Math.max(16, Math.min(34, k.enzymes - k.falls)), 45, EASE.in],
  ]);
  // light + CO2 graphs: step back for temperature, make room for the enzymes, return for the exam tip
  const dim12 = 1 - 0.6 * prog(f, k.different - 4, 16);
  const back12 = prog(f, k.describe + 2, 18);
  const away12 = prog(f, k.enzymes - 8, 16) * (1 - back12);
  const op12 = dim12 * (1 - away12) + back12 * 0.6;
  const levelsLabel = prog(f, k.levelsWord + 2, 22) * (1 - prog(f, k.co2Graph + 30, 14));

  // ---------------------------------------------------------------- the enzyme panel
  const panelIn = prog(f, k.enzymes - 2, 20);
  const panelOut = 1 - prog(f, k.describe - 14, 16, EASE.in);
  const panel = panelIn * panelOut;
  const T = temperatureAt(f, k);
  const S = enzymeSchedule(k);
  const denature = prog(f, k.denaturedWord - 2, 34, EASE.inOut);
  const bonds = window01(f, k.optimum3 + 6, k.active + 20, 12);
  const bondsBroken = prog(f, k.denaturedWord - 4, 14, EASE.snap);
  const site = prog(f, k.active - 4, 18);
  const amp = thermalAmplitude(T);
  const j = jitter(7, frame, amp, 0.025 + amp * 0.002);
  const rad = (j.rot * Math.PI) / 180;
  const docked: Pt = [ENZ.x + j.dx + Math.cos(rad) * SUB_DOCK[0], ENZ.y + j.dy + Math.sin(rad) * SUB_DOCK[0]];
  const trails = prog(f, k.raising, 30) * (1 - prog(f, k.optimum3 + 20, 20));

  type SubState = {
    pos: Pt;
    rot: number;
    product: number;
    opacity: number;
    flash: number;
    free: boolean;
  };
  const subState = (i: number, at: number): SubState => {
    const w = wanderAt(i, at, k, S.phase);
    const ev = [...S.docks].reverse().find((d) => d.sub === i && d.at <= at);
    if (!ev) return { ...w, product: 0, opacity: 1, flash: 0, free: true };
    const t = at - ev.at;
    const a1 = 18;
    const a2 = a1 + DOCK_IN;
    const a3 = a2 + BOUND;
    const a4 = a3 + LEAVE;
    const a5 = a4 + RESPAWN;
    if (t < a1) {
      const u = EASE.inOut(t / a1);
      return {
        pos: [w.pos[0] + (MOUTH[0] - w.pos[0]) * u, w.pos[1] + (MOUTH[1] - w.pos[1]) * u],
        rot: w.rot * (1 - u),
        product: 0,
        opacity: 1,
        flash: 0,
        free: false,
      };
    }
    if (t < a2) {
      const u = EASE.out((t - a1) / DOCK_IN);
      return {
        pos: [MOUTH[0] + (docked[0] - MOUTH[0]) * u, MOUTH[1] + (docked[1] - MOUTH[1]) * u],
        rot: j.rot * u,
        product: 0,
        opacity: 1,
        flash: 0,
        free: false,
      };
    }
    if (t < a3) {
      const u = (t - a2) / BOUND;
      return {
        pos: docked,
        rot: j.rot,
        product: EASE.inOut(u),
        opacity: 1,
        flash: Math.min(1, u * 1.6),
        free: false,
      };
    }
    if (t < a4) {
      const u = (t - a3) / LEAVE;
      const out: Pt = [MOUTH[0] - 40, MOUTH[1] + (i % 2 ? 40 : -40)]; // the product slides back out of the active site and is released
      const e = EASE.out(u);
      return {
        pos: [docked[0] + (out[0] - docked[0]) * e, docked[1] + (out[1] - docked[1]) * e],
        rot: j.rot + e * (i % 2 ? 30 : -30),
        product: 1,
        opacity: 1 - EASE.in(u),
        flash: 0,
        free: false,
      };
    }
    if (t < a5)
      return {
        ...w,
        product: 0,
        opacity: (t - a4) / RESPAWN,
        flash: 0,
        free: true,
      };
    return { ...w, product: 0, opacity: 1, flash: 0, free: true };
  };
  // after denaturing: one substrate tries to bind and bounces off
  const MIS = 1;
  const misApproach = prog(f, k.longer - 16, 18, EASE.inOut);
  const misBounce = prog(f, k.fit - 2, 20, EASE.out);
  const misPos = (base: SubState): SubState => {
    if (misApproach <= 0) return base;
    const contact: Pt = [MOUTH[0] + 22, MOUTH[1] - 8];
    const back: Pt = [MOUTH[0] - 130, MOUTH[1] - 70];
    const u = misApproach;
    const p1: Pt = [base.pos[0] + (contact[0] - base.pos[0]) * u, base.pos[1] + (contact[1] - base.pos[1]) * u];
    const b = misBounce;
    return {
      ...base,
      pos: [p1[0] + (back[0] - p1[0]) * b, p1[1] + (back[1] - p1[1]) * b],
      rot: base.rot * (1 - u) + b * -28,
      free: false,
    };
  };
  // the substrate the "kinetic energy" label points at: one that is free throughout the label
  const kinSub = 3;

  // ---------------------------------------------------------------- exam technique
  const chip1 = prog(f, k.describeWord - 4, 18);
  const chip1Parts = [prog(f, k.happens - 14, 16), prog(f, k.numbers - 4, 16), prog(f, k.units - 4, 16)];
  const chip2 = prog(f, k.explainWord - 4, 18);
  const ticksP = prog(f, k.numbers - 6, 16);
  const circleP = prog(f, k.numbers + 6, 22, (v) => v);
  const marker1Describe = track(f, [
    [k.happens - 16, 0],
    [k.happens + 40, 10, EASE.inOut],
  ]);
  const whyLine = prog(f, k.why - 2, 18, (v) => v);

  // ---------------------------------------------------------------- Extended part: {extendedTemp} → {describe}
  const extendedBadge = MARK_EXTENDED ? prog(f, k.extendedTemp, 18) * (1 - prog(f, k.describe - 4, 16)) : 0;
  const tagBright = MARK_EXTENDED ? prog(f, k.extendedTemp - 4, 14) * (1 - prog(f, Math.max(k.extendedTemp + 60, k.below + 30), 30, EASE.inOut)) : 0;

  const subs = HOMES.map((_, i) => {
    let s = subState(i, f);
    if (i === MIS) s = misPos(s);
    return { i, s };
  });

  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.4 }}>
      {/* ============ graph 1: light intensity ============ */}
      {ax1 > 0 ? (
        <Graph
          {...G1}
          xDomain={[0, 10]}
          xLabel="light intensity"
          yLabel="rate"
          axes={ax1}
          opacity={op12}
          curves={[
            {
              f: lightCurve,
              color: C.sun,
              revealTo: f >= k.describe - 10 ? 10 : reveal1,
            },
          ]}
          marker={{
            x: f >= k.describe - 10 ? marker1Describe : reveal1,
            opacity: Math.max(window01(f, k.lightRise - 8, k.co2Graph + 10, 10), window01(f, k.happens - 16, k.end + 30, 10)),
          }}
        />
      ) : null}
      <Label anchor={[sx1(8.6), sy(lightCurve(8.6)) - 4]} at={[sx1(5.6), 344]} align="end" text="levels off" color={C.sun} progress={levelsLabel} />
      {/* describe: numbers from the axes */}
      {ticksP > 0 ? (
        <g opacity={ticksP * op12}>
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <g key={v}>
              <line x1={sx1(v)} x2={sx1(v)} y1={G1.y + G1.height} y2={G1.y + G1.height + 14} stroke={C.paper} strokeWidth={3} />
              <text x={sx1(v)} y={G1.y + G1.height + 52} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.paper}>
                {v}
              </text>
            </g>
          ))}
          <line x1={sx1(4)} x2={sx1(4)} y1={sy(lightCurve(4)) + 14} y2={G1.y + G1.height - 4} stroke={C.paper} strokeWidth={3} strokeDasharray="7 10" opacity={circleP} />
          <HandCircle cx={sx1(4)} cy={G1.y + G1.height + 36} rx={32} ry={26} progress={circleP} color={C.amber} width={5} seed={14} />
        </g>
      ) : null}

      {/* ============ graph 2: carbon dioxide ============ */}
      {ax2 > 0 ? (
        <Graph
          {...G2}
          xDomain={[0, 10]}
          xLabel="carbon dioxide concentration"
          yLabel="rate"
          axes={ax2}
          opacity={op12}
          curves={[
            {
              f: lightCurve,
              color: C.sun,
              revealTo: 10,
              dashed: true,
              opacity: ghost * 0.9,
              width: 6,
            },
            { f: co2Curve, color: C.ice, revealTo: reveal2 },
          ]}
          marker={{
            x: reveal2,
            curve: 1,
            opacity: window01(f, k.co2Rise - 6, k.tempGraph + 10, 10),
          }}
        />
      ) : null}
      {co2Arrow > 0 ? <HandArrow from={[sx2(0.6), G2.y + G2.height + 30]} to={[sx2(9.6), G2.y + G2.height + 30]} progress={co2Arrow} color={C.ice} width={5} bend={0} seed={21} /> : null}

      {/* ============ graph 3: temperature ============ */}
      {ax3 > 0 ? (
        <Graph
          {...G3}
          xDomain={[0, 45]}
          xLabel="temperature"
          yLabel="rate"
          axes={ax3}
          curves={[
            {
              f: tempCurve,
              color: C.coral,
              revealTo: f >= k.describe ? 45 : reveal3,
            },
          ]}
          guides={[
            {
              x: TEMP_OPT,
              label: "optimum",
              color: C.paper,
              opacity: prog(f, k.optimum - 4, 16),
            },
          ]}
          marker={{
            x: f < k.enzymes ? reveal3 : T,
            opacity: Math.max(window01(f, k.tempRise - 6, k.enzymes - 10, 10), window01(f, k.enzymes + 10, k.describe, 12)),
          }}
        />
      ) : null}

      {/* ============ why: enzymes ============ */}
      {panel > 0 ? (
        <g opacity={panel}>
          <Thermometer x={1170} y={330} height={330} temperature={T} min={0} max={50} ticks={[]} showValue={false} />
          {/* trails: faster molecules (more kinetic energy) */}
          {trails > 0
            ? subs.map(({ i, s }) =>
                s.free && s.opacity > 0.9
                  ? [4, 8].map((lag, n) => {
                      const g = wanderAt(i, f - lag, k, S.phase);
                      return <Substrate key={`${i}-${lag}`} x={g.pos[0]} y={g.pos[1]} rot={g.rot} opacity={trails * (n === 0 ? 0.2 : 0.09)} />;
                    })
                  : null,
              )
            : null}
          <Enzyme x={ENZ.x} y={ENZ.y} scale={ENZ.s} temperature={T} seed={7} denature={denature} bonds={bonds} bondsBroken={bondsBroken} showSite={site} siteColor={C.coral} />
          {subs.map(({ i, s }) => (
            <Substrate key={i} x={s.pos[0]} y={s.pos[1]} rot={s.rot} product={s.product} opacity={s.opacity * prog(f, k.enzymes + 4 + i * 4, 16)} flash={s.flash} />
          ))}
          {misBounce > 0 ? <HandCross cx={MOUTH[0] + 96} cy={MOUTH[1] - 6} size={56} progress={prog(f, k.fit, 16, (v) => v)} color={C.coral} width={7} seed={33} /> : null}
        </g>
      ) : null}
      <Label anchor={[ENZ.x + 70, ENZ.y - 132]} at={[ENZ.x + 150, 300]} text="enzyme" color={C.teal} progress={prog(f, k.enzymesWord - 4, 22)} opacity={panel * (1 - prog(f, k.raising - 6, 14))} />
      {(() => {
        const s = subs[2].s;
        return <Label anchor={[s.pos[0], s.pos[1] + 28]} at={[600, 902]} text="substrate" color={C.ice} progress={prog(f, k.catalysed + 6, 22)} opacity={panel * (1 - prog(f, k.raising - 6, 14))} />;
      })()}
      {(() => {
        const s = subs[kinSub].s;
        return (
          <Label
            anchor={[s.pos[0], s.pos[1] - 30]}
            at={[680, 192]}
            text="more kinetic energy"
            color={C.amberLight}
            progress={prog(f, k.kinetic - 4, 22)}
            opacity={panel * (1 - prog(f, k.above - 6, 14))}
          />
        );
      })()}
      <Label
        anchor={[MOUTH[0] + 60, MOUTH[1] + 40]}
        at={[MOUTH[0] + 30, 902]}
        text="more effective collisions"
        color={C.paper}
        progress={prog(f, k.effective - 4, 22)}
        opacity={panel * (1 - prog(f, k.above - 6, 14))}
      />
      <Label anchor={[ENZ.x + 80, ENZ.y - 120]} at={[ENZ.x + 150, 300]} text="denatured" color={C.coral} progress={prog(f, k.denaturedWord + 2, 22)} opacity={panel} />
      <Label anchor={[MOUTH[0] + 110, MOUTH[1] + 40]} at={[MOUTH[0] + 30, 902]} text="active site changed shape" color={C.coral} progress={prog(f, k.shape - 6, 22)} opacity={panel} />

      {/* ============ exam technique ============ */}
      <CommandChip x={S14_CHIPS.x1} y={S14_CHIPS.y} word="describe" meaning={S14_DESCRIBE} progress={chip1} partsP={chip1Parts} />
      <CommandChip x={S14_CHIPS.x2} y={S14_CHIPS.y} word="explain" meaning="why" progress={chip2} meaningP={prog(f, k.why - 10, 14)} />
      {whyLine > 0 ? <HandUnderline x1={S14_CHIPS.x2 + S14_CHIPS.w2 / 2 - 140} x2={S14_CHIPS.x2 + S14_CHIPS.w2 / 2 - 38} y={S14_CHIPS.y + 26} progress={whyLine} color={C.amber} seed={8} /> : null}

      {/* the tag brightens while the EXTENDED badge arrives, then settles back like a new section */}
      <SectionTag n={7} title="Rate of photosynthesis" t={120 - 30 * tagBright} extended={extendedBadge} />
    </Stage>
  );
};
