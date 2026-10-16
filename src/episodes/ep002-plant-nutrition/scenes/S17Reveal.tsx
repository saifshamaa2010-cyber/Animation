/**
 * S17 · Reveal — what the three tubes do, why, and the respiration myth. Same rack as S16 (seamless cut).
 *
 * 1. "A few hours later". Tube A (light): CO2 dots go INTO the pondweed, purple spreads out from it;
 *    the rate bars: photosynthesis longer than respiration. A few dots still come out (respiration).
 * 2. Tube B (dark): the foil is lifted — yellow, full of CO2; photosynthesis bar drops to zero, the
 *    respiration bar carries on, more dots come OUT of the pondweed.
 * 3. Tube C (no pondweed) stays red — the control; both bars empty. Then A and B's pondweed glows: it
 *    caused the changes.
 * 4. Dim light: a fresh tube A goes in, the lamp dims (fewer photons); the bars become equal ("rates
 *    equal"). "No net…": the respiration bar slides up onto the photosynthesis bar and cancels ALL of it
 *    ("no net change"); one dot goes in on "uptake", one comes out on "release" — it stays red.
 * 5. The experiment steps back; MythCard: "Plants respire only at night" → "all the time" (the
 *    respiration bar never stops while photosynthesis switches on and off with day and night).
 * 6. Bright light: photosynthesis long again; on "net uptake" the part beyond respiration is outlined
 *    "net". "Net means overall": the respiration bar slides up and cancels its share — what is left is the
 *    net ("net = overall"); the bars glow on "takes in" / "gives out". "Net is the word examiners look
 *    for": ExamTip "net uptake of carbon dioxide", "net" underlined.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { SectionTag } from "../../../components/SectionTag";
import { MythCard } from "../../../components/MythCard";
import { ExamTip } from "../../../components/ExamTip";
import { HandUnderline, textWidth } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { Key, pulse, track } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s17Timing } from "./S17Reveal.timing";
import {
  COND_C_X,
  COND_Y,
  ColourKey,
  DotPlan,
  IND_TEXT,
  IndicatorTube,
  KEY_CX,
  LampWithLight,
  RACK_SEEDS,
  RackBase,
  SLOTS,
  TOP_Y,
  TubeText,
  WEED_CY,
  dotAt,
  indColour,
  tubeHomes,
  weedPoint,
} from "./parts/S16-tubes";
import { HoursLater, MythLine, RateBars } from "./parts/S17-rates";

const [XA, XB, XC] = SLOTS.map((s) => s[0]);
const WEED_C = (x: number): Pt => [x, WEED_CY];

/** Extra homes that keep clear of the dots already there. */
const moreHomes = (x: number, existing: readonly Pt[], n: number, seed: number): Pt[] => {
  const out: Pt[] = [];
  for (const p of tubeHomes(x, 60, seed, { weed: true, minD: 14 })) {
    if (out.length >= n) break;
    if ([...existing, ...out].every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) >= 14)) out.push(p);
  }
  return out;
};

const HOMES_A = tubeHomes(XA, 9, RACK_SEEDS[0], { weed: true });
const HOMES_B = tubeHomes(XB, 9, RACK_SEEDS[1], { weed: true });
const HOMES_C = tubeHomes(XC, 9, RACK_SEEDS[2]);
const EXTRA_A = moreHomes(XA, HOMES_A, 2, 61);
const EXTRA_B = moreHomes(XB, HOMES_B, 12, 62);
const HOMES_A2 = tubeHomes(XA, 9, 41, { weed: true });

/** Keyframes forced into order, so a fast narrator can never make a track run backwards. */
const mono = (keys: readonly Key[]): Key[] => {
  let last = -Infinity;
  return keys.map(([fr, v, e]) => {
    const g = Math.max(fr, last + 1);
    last = g;
    return [g, v, e] as Key;
  });
};

export const S17Reveal: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s17Timing(sc);
  const BIG = k.end + 1000;

  // ---------------------------------------------------------------- focus: the tube being explained stays bright
  const segA = Math.max(window01(f, k.lightTube - 4, k.darkTube - 4, 12), window01(f, k.dim - 6, BIG, 12));
  const segB = window01(f, k.darkTube - 4, k.controlTube - 4, 12);
  const segC = window01(f, k.controlTube - 4, k.weedCaused - 4, 12);
  const anyFocus = Math.max(segA, segB, segC);
  const focus = (seg: number) => 1 - 0.5 * anyFocus * (1 - seg);
  // the experiment steps back for the myth
  const scrim = prog(f, k.myth - 4, 18);
  const exp = 1 - 0.8 * scrim;
  /** words round the tubes clear completely, so only the apparatus stays faintly behind the cards */
  const words = 1 - scrim;

  // ---------------------------------------------------------------- "a few hours later"
  const hoursP = prog(f, k.reveal, 14);
  const hoursSweep = prog(f, k.reveal + 2, Math.max(30, k.lightTube - k.reveal + 6), (v) => v);
  const hoursOut = 1 - prog(f, k.lightTube + 44, 16);

  // ---------------------------------------------------------------- tube A (light) → purple
  const oldAOut = prog(f, k.dim - 2, 16, EASE.in);
  const newAIn = prog(f, k.dim + 12, 20);
  const spreadA = prog(f, k.indicatorW - 6, Math.max(30, k.purpleW + 10 - k.indicatorW), EASE.inOut);
  const absorbA = [2, 12, 22, 34, 46, 60, 76].map((d) => k.lightTube + d);
  const plansA: DotPlan[] = [
    ...HOMES_A.map((home, n) => {
      const at = n < 7 ? absorbA[n] : n === 7 ? k.takes - 2 : undefined;
      return { home, seed: 200 + n, exitAt: at, to: at !== undefined ? weedPoint(XA, n) : undefined };
    }),
    // respiration still gives a little CO2 out
    ...EXTRA_A.map((home, n) => ({ home, seed: 300 + n, enterAt: n === 0 ? k.r1 + 8 : k.gives1 - 2, from: weedPoint(XA, 30 + n), travel: 34 })),
  ];
  const dotsA = plansA.map((p) => dotAt(f, p));

  // ---------------------------------------------------------------- tube A2: a fresh tube in dim light → stays red
  const dimOn = prog(f, k.dimW - 2, 14);
  const lampOn = 1 - 0.7 * dimOn;
  // as many dots go in as come out: the last pair on "…no net uptake or release"
  const a2Out = [k.rates - 4, k.rates + 40, Math.max(k.rates + 60, k.uptake - 6)];
  const a2In = [k.rates + 18, k.rates + 62, Math.max(k.rates + 82, k.release - 6)];
  const plansA2: DotPlan[] = [
    ...HOMES_A2.map((home, n) => ({
      home,
      seed: 400 + n,
      exitAt: n < 3 ? a2Out[n] : undefined,
      to: n < 3 ? weedPoint(XA, 50 + n) : undefined,
      travel: 34,
    })),
    ...HOMES_A2.slice(0, 3).map((home, n) => ({ home, seed: 420 + n, enterAt: a2In[n], from: weedPoint(XA, 60 + n), travel: 34 })),
  ];
  const dotsA2 = plansA2.map((p) => dotAt(f, p));

  // ---------------------------------------------------------------- tube B (dark) → yellow
  const foilLift = prog(f, k.darkTube - 2, 22, EASE.inOut);
  const plansB: DotPlan[] = [
    ...HOMES_B.map((home, n) => ({ home, seed: 220 + n })),
    // given out by the pondweed during the hours in the dark (already there)
    ...EXTRA_B.slice(0, 9).map((home, n) => ({ home, seed: 320 + n })),
    // …and still coming out now: respiration carries on
    ...EXTRA_B.slice(9).map((home, n) => ({ home, seed: 340 + n, enterAt: [k.r2 + 6, k.gives2 - 2, k.gives2 + 14][n], from: weedPoint(XB, 40 + n), travel: 34 })),
  ];
  const dotsB = plansB.map((p) => dotAt(f, p));

  // ---------------------------------------------------------------- tube C (no pondweed) → stays red
  const dotsC = HOMES_C.map((home, n) => dotAt(f, { home, seed: 240 + n }));
  const weedGlow = pulse(f, k.weedCaused - 4, 44);

  // ---------------------------------------------------------------- labels round the tubes
  const qA = 1 - prog(f, k.lightTube - 2, 10);
  const qB = 1 - prog(f, k.darkTube, 10);
  const qC = 1 - prog(f, k.controlTube - 2, 10);
  const resA = prog(f, k.purpleW - 2, 16) * (1 - prog(f, k.dim - 4, 10));
  const resA2 = prog(f, k.staysRed2 - 2, 16);
  const resB = prog(f, k.yellowW - 2, 16);
  const resC = prog(f, k.staysRed - 2, 16);
  const controlP = prog(f, k.control - 2, 16);
  const condA = 1 - prog(f, k.dimW - 4, 10);
  const condA2 = prog(f, k.dimW - 2, 16);

  // ---------------------------------------------------------------- the key: the colour being explained is ringed
  const keyHi: [number, number, number] = [
    window01(f, k.yellowW - 2, k.controlTube - 4, 10),
    Math.max(window01(f, k.staysRed - 2, k.weedCaused + 10, 10), window01(f, k.staysRed2 - 2, k.myth, 10)),
    window01(f, k.purpleW - 2, k.darkTube - 4, 10),
  ];

  // ---------------------------------------------------------------- the two rates
  const HI = 0.92;
  const LO = 0.32;
  const psLen = track(
    f,
    mono([
      [k.ps1 - 2, 0],
      [k.ps1 + 18, HI, EASE.out],
      [k.noPs - 2, HI],
      [k.noPs + 14, 0],
      [k.dimW - 2, 0],
      [k.dimW + 16, LO, EASE.out],
      [k.day - 2, LO],
      [k.day + 8, HI],
      [k.night - 2, HI],
      [k.night + 8, 0],
      [k.bright - 2, 0],
      [k.bright + 16, HI, EASE.out],
    ]),
  );
  const rLen = track(
    f,
    mono([
      [k.r1 - 2, 0],
      [k.r1 + 18, LO, EASE.out],
      [k.noWeed - 2, LO],
      [k.noWeed + 14, 0],
      [k.dim + 12, 0],
      [k.dim + 30, LO, EASE.out],
    ]),
  );
  const psIn = prog(f, k.ps1 - 4, 16);
  const rIn = prog(f, k.r1 - 4, 16);
  const rGlow = Math.max(
    pulse(f, k.r2 - 2, 40),
    pulse(f, k.mythRespire - 2, 36),
    window01(f, k.all - 2, k.night + 34, 12),
    pulse(f, k.gives3 - 2, 40), // "…than it gives out"
  );
  const psGlow = Math.max(pulse(f, k.faster2 - 2, 36), pulse(f, k.takes2 - 2, 40)); // "…the plant takes in more"
  const equal = window01(f, k.equal - 2, k.myth, 12);
  // dim light: respiration cancels ALL of photosynthesis → no net change
  const noNetP = window01(f, Math.max(k.noNetW + 18, k.release - 4), k.myth, 12);
  // bright light: respiration cancels only its share; the rest is the net uptake ("net means overall")
  const cancel =
    f < k.net
      ? { p: prog(f, k.noNetW - 6, 30, (v) => v), op: 1 - prog(f, k.myth - 6, 14) }
      : { p: prog(f, k.overallW + 6, 34, (v) => v), op: 1 };
  const net = prog(f, k.netW - 2, 18);
  // "net = overall" has done its job once the exam tip arrives (keeps the words on screen down)
  const overall = prog(f, k.overallW - 2, 16) * (1 - prog(f, k.netExam - 4, 14, EASE.in));
  const netPulse = pulse(f, k.wordW - 2, 36);

  // ---------------------------------------------------------------- myth + exam tip
  const cardOut = prog(f, k.net - 2, 18, EASE.in);
  const cardEnter = prog(f, k.myth - 2, 20) * (1 - cardOut);
  const strike = prog(f, k.respire - 2, 16, EASE.inOut);
  const replace = prog(f, k.all - 2, 16);
  const CARD = { x: 1180, y: 420, w: 1240 };
  const MYTH_S = 40 / 34;
  const TIP = { x: 1180, y: 420, text: "net uptake of carbon dioxide" };
  const tipP = prog(f, k.netExam - 4, 20); // on: Net is the word examiners look for.
  const tipW = Math.max(textWidth(TIP.text, 50, 700), textWidth("EXAM TIP", 40, 700) + 60) + 90;
  const tipL = TIP.x - tipW / 2;
  const tipBase = TIP.y - 166 / 2 + 122;

  return (
    <Stage bg={{ tone: "warm", lightX: 0.55, lightY: 0.36 }}>
      {/* ============ the experiment ============ */}
      <g opacity={exp}>
        <RackBase progress={1} />
        {/* the lamp never dims for focus: its brightness is part of the explanation */}
        <LampWithLight f={f} progress={1} on={lampOn} start={-60} every={(t) => (t < k.dimW ? 10 : 34)} />
        {/* tube A in the light (lifted out for the dim-light run) */}
        <IndicatorTube
          x={XA}
          colour={indColour(0)}
          spread={{ colour: indColour(1), p: spreadA, at: WEED_C(XA), reach: 300 }}
          dots={dotsA}
          weed={1}
          sunlit={0.8}
          weedGlow={weedGlow}
          bung={1}
          opacity={focus(segA) * (1 - oldAOut)}
          dy={-70 * EASE.in(oldAOut)}
        />
        <IndicatorTube x={XA} colour={indColour(0)} dots={dotsA2} weed={1} sunlit={0.8 * lampOn} bung={1} progress={newAIn} opacity={focus(segA)} dy={-60 * (1 - EASE.out(newAIn))} />
        <IndicatorTube x={XB} colour={indColour(-1)} dots={dotsB} weed={1} weedGlow={weedGlow} bung={1} foil={1} foilLift={foilLift} opacity={focus(segB)} />
        <IndicatorTube x={XC} colour={indColour(0)} dots={dotsC} bung={1} opacity={focus(segC)} />

        {/* below: the condition; above: the result */}
        <g opacity={focus(segA) * words}>
          <TubeText x={XA} y={COND_Y} text="light" p={condA} color={C.sun} />
          <TubeText x={XA} y={COND_Y} text="dim light" p={condA2} color={C.sun} />
          <TubeText x={XA} y={TOP_Y} text="?" p={qA} size={64} weight={700} />
          <TubeText x={XA} y={TOP_Y} text="purple" p={resA} color={IND_TEXT.purple} size={48} weight={700} />
          <TubeText x={XA} y={TOP_Y} text="red" p={resA2} color={IND_TEXT.red} size={48} weight={700} />
        </g>
        <g opacity={focus(segB) * words}>
          <TubeText x={XB} y={COND_Y} text="dark" p={1} />
          <TubeText x={XB} y={TOP_Y} text="?" p={qB} size={64} weight={700} />
          <TubeText x={XB} y={TOP_Y} text="yellow" p={resB} color={IND_TEXT.yellow} size={48} weight={700} />
        </g>
        <g opacity={focus(segC) * words}>
          <TubeText x={COND_C_X} y={COND_Y} text="no pondweed" p={1} />
          <TubeText x={COND_C_X} y={COND_Y + 60} text="control" p={controlP} weight={700} />
          <TubeText x={XC} y={TOP_Y} text="?" p={qC} size={64} weight={700} />
          <TubeText x={XC} y={TOP_Y} text="red" p={resC} color={IND_TEXT.red} size={48} weight={700} />
        </g>

        <ColourKey cx={KEY_CX.aside} show={[1, 1, 1]} arrows={[1, 1]} hi={keyHi} />
      </g>

      {/* ============ why: the two rates ============ */}
      <HoursLater x={130} y={262} p={hoursP} sweep={hoursSweep} opacity={hoursOut} />
      <RateBars
        ps={psLen}
        r={rLen}
        psIn={psIn}
        rIn={rIn}
        rGlow={rGlow}
        psGlow={psGlow}
        equal={equal}
        noNet={noNetP}
        cancel={cancel}
        net={net}
        netPulse={netPulse}
        overall={overall}
      />

      {/* ============ the myth ============ */}
      {/* MythCard's tag is drawn at 34 px; scaled by 40/34 so it meets the 40 px minimum (same on-screen width) */}
      <g transform={`translate(${CARD.x} ${CARD.y}) scale(${MYTH_S}) translate(${-CARD.x} ${-CARD.y})`}>
        <MythCard x={CARD.x} y={CARD.y} width={CARD.w / MYTH_S} number={1} before="" word="" enter={cardEnter} strike={0} />
      </g>
      <MythLine x={CARD.x} y={CARD.y + 22} shift={40 * MYTH_S} before="Plants respire " word="only at night" replacement="all the time" enter={cardEnter} strike={strike} replace={replace} />

      {/* ============ the exam word ============ */}
      <ExamTip x={TIP.x} y={TIP.y} text={TIP.text} progress={tipP} />
      {tipP > 0.9 ? (
        <HandUnderline x1={tipL + 42} x2={tipL + 46 + textWidth("net", 50, 700)} y={tipBase + 16} progress={prog(f, k.wordW - 2, 16)} color={C.amber} width={6} seed={17} />
      ) : null}

      <SectionTag n={9} title="Gas exchange" t={200} extended />
    </Stage>
  );
};
