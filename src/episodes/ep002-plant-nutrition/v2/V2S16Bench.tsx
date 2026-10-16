/**
 * EP002 v2 · S16 — the hydrogencarbonate-indicator practical and the episode's one "pause and predict".
 * World: the lab bench (pastel tiled wall, wooden bench) — all text is dark ink on the light wall.
 * Same narration and cues as v1 S16 (s16Timing); the logic of v1 (demo tube → key → three sealed tubes →
 * A light / B foil / C no pondweed → question → countdown over the silence) restyled as a cartoon bench.
 *
 *  {indicator}…{purple}  one big demo tube of indicator on a wooden block. CO2 buddies dissolved in it;
 *                        the key card on the bench front builds as each colour is named: red = air,
 *                        more CO2 drops in → yellow, CO2 leaves → purple (yellow ← red → purple).
 *  {tubes} {bungs}       the demo tube lifts away; a rack of three red tubes; bungs pop in on "sealed";
 *                        CO2 buddies from the air drop onto the bungs and bounce off ("no CO₂ in or out").
 *  {tubeA}               tube A's bung pops out, a sprig of pondweed drops in (splash), bung back in;
 *                        the lamp clicks on (warm beam, photons, "light energy"); tag "light".
 *  {tubeB}               the same for tube B; crinkly foil wraps it on "wrapped"; tag "dark".
 *  {tubeC}               tube C stays empty; tag "no pondweed".
 *  {question}            "?" buddies pop up over the tubes and glance at each other; Chloro puts on his
 *                        glasses and thinks; the question is handwritten on a taped slip; the key wiggles.
 *  {pauseNow}            Chloro's thought cloud holds "Pause & predict" and a countdown ring that runs
 *                        exactly over the silence to the end of the scene; everyone looks at the viewer,
 *                        then Chloro looks from tube to tube.
 */
import React from "react";
import { C, EASE, W2 } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { CO2Buddy, Chloro, CountdownRing, Sparkle, WorldStage } from "../../../components/fun";
import type { ChloroMood, ChloroPose } from "../../../components/fun";
import {
  BenchRack,
  BenchTube,
  Bung,
  DeskLamp,
  IndicatorKeyCard,
  InkTopicTag,
  LampBeam,
  PeekQuestion,
  Sprig,
  ThoughtCloud,
  TubeFoil,
  indicatorColour,
  lampMouth,
  LightDot,
  ReagentBottle,
  WallClock,
} from "../../../components/fun/BenchLab";
import { ImpactLines, PaperSlip } from "../../../components/fun/StudyProps";
import { Scribble, caveatWidth } from "../../../components/fun/Handwriting";
import { useNarrationTalk } from "../../../components/fun/narrationTalk";
import { ChemText, chemWidth } from "../../../components/Equation";
import { HandArrow, textWidth } from "../../../components/kit";
import { Pt, rng } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s16Bounces, s16Timing } from "../scenes/S16Predict.timing";

const INK = W2.inkText;
const lin = (t: number) => t;

// ------------------------------------------------------------------ layout (1920×1080)
const BENCH_Y = 700;
/** where things stand on the bench top */
const FLOOR = 722;
const TUBE = { w: 96, h: 300, level: 0.82 } as const;
const TUBE_TOP = FLOOR - 26 - TUBE.h; // mouths of the rack tubes
const XS = [740, 960, 1180] as const; // tubes A (light), B (foil), C (no pondweed)
const RACK = { cx: 960, w: 664, barY: 482 } as const;
const SURF = TUBE_TOP + TUBE.h * (1 - TUBE.level);
const WEED = { base: FLOOR - 40, len: 196 } as const;
const LAMP = { base: [184, FLOOR] as Pt, elbow: [200, 436] as Pt, head: [356, 462] as Pt, aim: [XS[0], 575] as Pt };
/** the handwritten "light energy" note under the beam, and the wall clock */
const NOTE = { x: 262, y: 654, size: 60 } as const;
const CLOCK = { x: 1462, y: 190, r: 60 } as const;
const BOTTLE = { x: 1408 } as const;
const MOUTH = lampMouth(LAMP.head, LAMP.aim);
const CHLORO = { x: 1640, y: 728, size: 300 } as const;
/** Chloro's pointing shoulder on screen (he faces left: flipped) */
const SHOULDER: Pt = [CHLORO.x - 70 * (CHLORO.size / 240), CHLORO.y - 98 * (CHLORO.size / 240)];
const pointAt = (t: Pt) => (Math.atan2(t[1] - SHOULDER[1], SHOULDER[0] - t[0]) * 180) / Math.PI;
const CLOUD = { x: 1480, y: 244, w: 460, h: 280 } as const;
const KEYCARD = { x: 104, y: 806, w: 640, h: 160 } as const;
const QSLIP = { x: 392, y: 282, w: 560, h: 196 } as const;
const TAG_Y = 752;
const TAG_SIZE = 58;

// the demo tube (before the rack)
const DEMO = { x: 960, y: 290, w: 150, h: 380, level: 0.8 } as const;
const DEMO_HOMES: Pt[] = [
  [928, 440],
  [992, 520],
  [928, 600],
  [992, 418],
  [928, 520],
  [992, 600],
];
/** which demo buddies leave when the CO2 level drops (purple) */
const DEMO_LEAVE = [0, 3, 4, 5];

// ------------------------------------------------------------------ small pieces

/** A taped paper tag with a handwritten word (and an optional little sun / moon doodle). */
const Tag: React.FC<{ x: number; y: number; text: string; icon?: "sun" | "moon"; p: number; write: number; rot: number }> = ({ x, y, text, icon, p, write, rot }) => {
  if (p <= 0) return null;
  const tw = caveatWidth(text, TAG_SIZE);
  const iw = icon ? 48 : 0;
  const w = tw + iw + 46;
  const h = 70;
  const x0 = -w / 2 + 23;
  return (
    <PaperSlip x={x} y={y} w={w} h={h} rotate={rot} progress={p} tape="top" color={C.paper}>
      {icon === "sun" ? (
        <g transform={`translate(${x0 + 16} -2)`} opacity={Math.min(1, write * 3)}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={Math.cos(a) * 15} y1={Math.sin(a) * 15} x2={Math.cos(a) * 21} y2={Math.sin(a) * 21} stroke={C.amberDeep} strokeWidth={3.5} strokeLinecap="round" />;
          })}
          <circle r={10} fill={C.sun} stroke={INK} strokeWidth={3} />
        </g>
      ) : null}
      {icon === "moon" ? (
        <g transform={`translate(${x0 + 16} -2)`} opacity={Math.min(1, write * 3)}>
          <path d="M3.7,-15.6 A16,16 0 1,0 13.8,8.1 A13,13 0 1,1 3.7,-15.6 Z" fill={C.violetLight} stroke={INK} strokeWidth={3} strokeLinejoin="round" transform="scale(1.15)" />
        </g>
      ) : null}
      <Scribble x={x0 + iw} y={TAG_SIZE * 0.32} text={text} size={TAG_SIZE} progress={write} color={INK} />
    </PaperSlip>
  );
};

/** Little droplets thrown up by a splash, falling back. */
const Splash: React.FC<{ x: number; y: number; t: number; colour: string; seed: number }> = ({ x, y, t, colour, seed }) => {
  if (t <= 0 || t >= 1) return null;
  const r = rng(seed);
  return (
    <g opacity={1 - t * t}>
      {Array.from({ length: 6 }, (_, i) => {
        const vx = (r() - 0.5) * 70;
        const vy = 70 + r() * 50;
        const px = x + vx * t;
        const py = y - vy * t + 150 * t * t;
        return <circle key={i} cx={px} cy={py} r={5 + r() * 4} fill={colour} stroke={INK} strokeWidth={2.5} />;
      })}
    </g>
  );
};

export const V2S16Bench: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s16Timing(sc);
  const talk = useNarrationTalk(4);

  // ================================================================ part 1: the demo tube and the key
  const demoIn = prog(f, k.indicator + 2, 18, lin);
  const demoOut = prog(f, k.tubes - 6, 14, EASE.in);
  const fill = prog(f, k.hydro - 4, 34, EASE.inOut);
  const toYellow = prog(f, k.more + 10, Math.max(20, k.yellowWord + 4 - k.more - 10), EASE.inOut);
  const toPurple = prog(f, k.less + 10, Math.max(20, k.purpleWord + 4 - k.less - 10), EASE.inOut);
  const demoColour = indicatorColour(-toYellow + 2 * toPurple);

  const demoBuddies = DEMO_HOMES.map((home, i) => {
    const isMore = i >= 3;
    const t0 = isMore ? k.more + 4 + (i - 3) * 8 : k.co2 + i * 5;
    if (f < t0) return null;
    let x = home[0];
    let y = home[1];
    let op = 1;
    let p = prog(f, t0, 14, lin);
    if (isMore) {
      const q = prog(f, t0, 26, EASE.inOut);
      x = home[0] + (i % 2 ? 50 : -50) * (1 - q);
      y = 150 + (home[1] - 150) * q;
      p = 1;
    }
    const li = DEMO_LEAVE.indexOf(i);
    if (li >= 0) {
      const t1 = k.less + 4 + li * 6;
      const q = prog(f, t1, 30, EASE.inOut);
      if (q >= 1) return null;
      x += (i % 2 ? 70 : -70) * q;
      y += (150 - y) * q;
      op = 1 - Math.max(0, (q - 0.6) / 0.4);
    }
    return { x, y, op, p, seed: 20 + i, mood: (li >= 0 && f >= k.less + 4 + li * 6 ? "excited" : "happy") as "excited" | "happy" };
  });
  const slipHydro = prog(f, k.hydro - 2, 18, lin) * (1 - prog(f, k.tubes - 8, 12, EASE.in));
  const slipCo2 = prog(f, k.co2 + 8, 16, lin) * (1 - prog(f, k.tubes - 8, 12, EASE.in));

  const keyCard = prog(f, k.red - 6, 18, lin);
  const keyShow: [number, number, number] = [prog(f, k.yellowWord - 2, 18, lin), prog(f, k.redWord - 2, 18, lin), prog(f, k.purpleWord - 2, 18, lin)];
  const keyArrows: [number, number] = [prog(f, k.yellowWord + 4, 16, lin), prog(f, k.purpleWord + 4, 16, lin)];
  const keyHi: [number, number, number] = [window01(f, k.yellowWord - 2, k.purple, 8), window01(f, k.redWord - 2, k.yellow, 8), window01(f, k.purpleWord - 2, k.tubes, 8)];
  const keyWiggle = prog(f, k.colour + 8, 26, lin);

  // ================================================================ part 2: the rack, bungs, CO2 from the air
  const rackIn = prog(f, k.tubes + 2, 18, lin);
  const tubeIn = [0, 1, 2].map((i) => prog(f, k.three - 6 + i * 6, 16, lin));
  const bungIn = [0, 1, 2].map((i) => prog(f, k.sealed - 4 + i * 5, 14, lin));
  const bungSq = [0, 1, 2].map((i) => pulse(f, k.sealed - 4 + i * 5 + 8, 10));
  const slipBung = prog(f, k.noCo2 - 4, 16, lin) * (1 - prog(f, k.inOut + 6, 10, EASE.in));
  const hits = s16Bounces(k);
  const BOUNCE_DX = [-80, 50, 90];
  const bouncers = XS.map((tx, i) => {
    const hit = hits[i];
    const t0 = hit - 24;
    if (f < t0 || f > hit + 34) return null;
    const from: Pt = [tx + BOUNCE_DX[i], 120];
    const at: Pt = [tx + BOUNCE_DX[i] * 0.15, TUBE_TOP - 36 - 22];
    const to: Pt = [tx + BOUNCE_DX[i] * 2.4, 150];
    const down = prog(f, t0, hit - t0, EASE.in);
    const up = prog(f, hit, 30, EASE.out);
    const p = f < hit ? down : up;
    const a = f < hit ? from : at;
    const b = f < hit ? at : to;
    return {
      x: a[0] + (b[0] - a[0]) * p,
      y: a[1] + (b[1] - a[1]) * p,
      op: prog(f, t0, 8, lin) * (1 - prog(f, hit + 20, 12, lin)),
      rot: f < hit ? 0 : 40 * up * (BOUNCE_DX[i] > 0 ? 1 : -1),
      mood: (f < hit ? "happy" : "worried") as "happy" | "worried",
    };
  });
  const bungHit = hits.map((h) => pulse(f, h, 10));

  // ================================================================ part 3: A, B, C
  /** bung out → sprig drops in (splash) → bung back in, around the word "pondweed" */
  const drop = (t0: number) => ({
    lift: prog(f, t0 - 12, 8, EASE.out) * (1 - prog(f, t0 + 12, 7, EASE.in)),
    fall: prog(f, t0 - 6, 12, EASE.in),
    splash: f >= t0 + 6 ? prog(f, t0 + 6, 20, lin) : 0,
    squash: pulse(f, t0 + 19, 10),
  });
  const dA = drop(k.weedA - 2);
  const dB = drop(k.weedB - 2);
  const drops = [dA, dB, null];
  const lampOnT = k.bright - 2;
  const lampOn = f < lampOnT ? 0 : f < lampOnT + 6 ? (f % 2 ? 0.45 : 1) * prog(f, lampOnT, 6, lin) : 1;
  const lampShake = pulse(f, lampOnT, 12);
  const lightEnergy = prog(f, k.light + 6, 18, lin);
  const foil = prog(f, k.wrapped - 2, Math.min(28, Math.max(14, k.dark - k.wrapped)), lin);
  const foilGlint = pulse(f, k.wrapped + 30, 18);
  const tagP = [prog(f, k.light - 2, 14, lin), prog(f, k.dark - 2, 14, lin), prog(f, k.noWeed, 14, lin)];
  const tagW = [prog(f, k.light + 4, 16, lin), prog(f, k.dark + 4, 14, lin), prog(f, k.noWeed + 6, 22, lin)];
  const cWiggle = pulse(f, k.noWeed + 2, 22);

  // photons along the beam (light reaching the pondweed in tube A)
  const photons: React.ReactNode[] = [];
  if (lampOn > 0.5) {
    for (let i = 0; i < 90; i++) {
      const t0 = lampOnT + 4 + i * 8;
      const p = (f - t0) / 22;
      if (p <= 0 || p >= 1) continue;
      const r = rng(300 + i);
      const from: Pt = [MOUTH[0] + 4, MOUTH[1] + (r() - 0.5) * 46];
      const to: Pt = [XS[0] + (r() - 0.5) * 26, SURF + 50 + r() * 160];
      photons.push(<LightDot key={i} from={from} to={to} p={p} r={8.5} />);
    }
  }

  // ================================================================ part 4: the question and the pause
  const qBud = [0, 1, 2].map((i) => prog(f, k.colour - 4 + i * 6, 18, lin));
  const toViewer = prog(f, k.pauseNow - 2, 10, EASE.inOut);
  const glance = Math.max(-1, Math.min(1, Math.sin((f - k.colour) / 20) * 2.2));
  const qLook = [1, glance, -1].map((v) => v * (1 - toViewer));
  const qSlip = prog(f, k.question - 4, 16, lin);
  const qLine1 = prog(f, k.colour - 6, 26, lin);
  const qLine2 = prog(f, k.after - 4, 34, lin);
  const cloud = prog(f, k.pauseNow - 2, 24, lin);
  const ring = prog(f, k.pauseNow + 10, 16, lin);
  const countdown = prog(f, k.silence, Math.max(1, k.end - k.silence), lin);
  const seconds = (k.end - k.silence) / sc.fps;

  // ================================================================ Chloro
  const pose: ChloroPose = f < k.hydro ? "wave" : f < k.question ? "point" : "chin";
  const mood: ChloroMood = f < k.hydro ? "happy" : f < k.question ? "explain" : "thinking";
  const angle = track(f, [
    [k.hydro, pointAt([DEMO.x, 430])],
    [k.tubes, pointAt([DEMO.x, 430])],
    [k.tubes + 10, pointAt([XS[1], 400])],
    [k.tubeA, pointAt([XS[1], 400])],
    [k.tubeA + 10, pointAt([XS[0], 430])],
    [k.tubeB, pointAt([XS[0], 430])],
    [k.tubeB + 10, pointAt([XS[1], 430])],
    [k.tubeC, pointAt([XS[1], 430])],
    [k.tubeC + 10, pointAt([XS[2], 430])],
  ]);
  // where he looks (flipped: +x = screen left)
  const gazeA = 1;
  const gazeB = 0.72;
  const gazeC = 0.42;
  const s0 = k.silence;
  const lookX = track(f, [
    [k.hydro, 0],
    [k.hydro + 8, 0.85],
    [k.question, 0.85],
    [k.question + 8, 1],
    [k.pauseNow, 1],
    [k.pauseNow + 8, 0],
    [s0, 0],
    [s0 + 6, gazeA],
    [s0 + 34, gazeA],
    [s0 + 40, gazeB],
    [s0 + 68, gazeB],
    [s0 + 74, gazeC],
    [s0 + 104, gazeC],
    [s0 + 110, gazeB],
    [s0 + 130, gazeB],
    [s0 + 136, gazeA],
  ]);
  const lookY = track(f, [
    [k.hydro, 0],
    [k.hydro + 8, -0.2],
    [k.question, -0.2],
    [k.question + 8, -0.85],
    [k.pauseNow, -0.85],
    [k.pauseNow + 8, 0.1],
    [s0, 0.1],
    [s0 + 6, 0.15],
  ]);
  const chloroBounce = Math.max(prog(f, k.question, 16, lin) * (f < k.question + 16 ? 1 : 0), prog(f, k.pauseNow, 14, lin) * (f < k.pauseNow + 14 ? 1 : 0), prog(f, k.hydro, 14, lin) * (f < k.hydro + 14 ? 1 : 0));
  const glasses = f >= k.question + 4;
  const glassPop = pulse(f, k.question + 4, 16);

  // ================================================================ draw
  const tubeColour = C.indRed;
  return (
    <WorldStage world="bench" benchY={BENCH_Y}>
      <InkTopicTag n={9} title="Gas exchange" progress={prog(f, 0, 14, lin)} />
      <WallClock x={CLOCK.x} y={CLOCK.y} r={CLOCK.r} hours={9.1} wobble={prog(f, k.after + 4, 30, lin)} progress={prog(f, 6, 18, lin)} />

      {/* ---- the lamp's light (behind the glassware) */}
      <LampBeam head={LAMP.head} aim={LAMP.aim} on={lampOn} length={440} spread={175} />

      {/* ---- part 1: the demo tube on a wooden block */}
      {demoIn > 0 && demoOut < 1 ? (
        <g opacity={1 - demoOut} transform={`translate(0 ${-220 * demoOut})`}>
          <BenchTube
            x={DEMO.x}
            y={DEMO.y}
            w={DEMO.w}
            h={DEMO.h}
            level={DEMO.level * fill}
            colour={demoColour}
            slosh={pulse(f, k.more + 22, 30) * 0.6}
            progress={demoIn}
          >
            {demoBuddies.map((b, i) => (b ? <CO2Buddy key={i} x={b.x} y={b.y} scale={0.42} progress={b.p} opacity={b.op} mood={b.mood} seed={b.seed} jiggle={2.5} /> : null))}
          </BenchTube>
        </g>
      ) : null}
      {demoIn > 0 ? (
        <g opacity={(1 - demoOut) * Math.min(1, demoIn * 2)}>
          <rect x={DEMO.x - 104} y={FLOOR - 50} width={208} height={50} rx={12} fill={W2.wood} stroke={INK} strokeWidth={4} />
          <rect x={DEMO.x - 96} y={FLOOR - 44} width={192} height={7} rx={3.5} fill="#FFFFFF" opacity={0.35} />
          <ellipse cx={DEMO.x} cy={FLOOR - 50} rx={DEMO.w / 2 + 6} ry={7} fill={INK} opacity={0.5} />
        </g>
      ) : null}

      {/* ---- part 2: the rack and its three tubes */}
      <BenchRack cx={RACK.cx} floor={FLOOR} w={RACK.w} barY={RACK.barY} xs={XS} tubeW={TUBE.w} progress={rackIn} />
      {XS.map((tx, i) => {
        const d = drops[i];
        const inP = tubeIn[i];
        if (inP <= 0) return null;
        const dy = -180 * (1 - EASE.out(inP));
        const wig = i === 2 ? Math.sin(cWiggle * Math.PI * 3) * 3 * cWiggle : 0;
        const fall = d ? d.fall : 0;
        const weedP = d && f >= (i === 0 ? k.weedA : k.weedB) - 8 ? 1 : 0;
        const lit = i === 0 ? lampOn : 0;
        return (
          <g key={i} transform={`translate(0 ${dy}) rotate(${wig} ${tx} ${FLOOR - 26})`}>
            <BenchTube
              x={tx}
              y={TUBE_TOP}
              w={TUBE.w}
              h={TUBE.h}
              level={TUBE.level}
              colour={tubeColour}
              slosh={d && d.splash > 0 ? 1 - d.splash : 0}
              lit={lit * 0.85}
              progress={inP}
              inside={
                weedP > 0 ? (
                  <g>
                    <g transform={`translate(0 ${-340 * (1 - fall)})`}>
                      <Sprig x={tx} y={WEED.base} len={WEED.len} sway={Math.sin((f + i * 40) / 34) * 2.2} lit={lit} />
                    </g>
                    {/* under the indicator: a little of its colour over the sprig */}
                    <rect x={tx - 60} y={SURF} width={120} height={TUBE.h} fill={tubeColour} opacity={0.14} />
                  </g>
                ) : null
              }
            >
              {d ? <Splash x={tx} y={SURF} t={d.splash} colour={tubeColour} seed={60 + i} /> : null}
            </BenchTube>
            {i === 1 ? <TubeFoil x={tx} y={TUBE_TOP} w={TUBE.w} h={TUBE.h} progress={foil} glint={foilGlint} /> : null}
            <g transform={d ? `translate(${(i === 0 ? -38 : 38) * d.lift} 0)` : undefined}>
              <Bung
                x={tx}
                y={TUBE_TOP}
                w={TUBE.w}
                lift={d ? 96 * d.lift : 0}
                tilt={d ? (i === 0 ? -22 : 22) * d.lift : 0}
                squash={Math.max(bungSq[i], bungHit[i], d ? d.squash : 0)}
                progress={bungIn[i]}
              />
            </g>
          </g>
        );
      })}

      {/* CO2 from the air can't get past the bungs */}
      {bouncers.map((b, i) =>
        b && b.op > 0 ? <CO2Buddy key={i} x={b.x} y={b.y} scale={0.5} rotate={b.rot} mood={b.mood} opacity={b.op} seed={40 + i} jiggle={1.5} /> : null,
      )}
      {hits.map((h, i) => (
        <ImpactLines key={i} x={XS[i] + BOUNCE_DX[i] * 0.15} y={TUBE_TOP - 46} progress={prog(f, h, 12, lin)} r0={24} r1={58} angles={[-160, -125, -55, -20]} color={INK} width={5} />
      ))}

      {/* the bottle of indicator the tubes were filled from */}
      <ReagentBottle x={BOTTLE.x} floor={FLOOR} colour={C.indRed} progress={prog(f, 8, 18, lin)} />

      {/* ---- the lamp */}
      <DeskLamp base={LAMP.base} elbow={LAMP.elbow} head={LAMP.head} aim={LAMP.aim} on={lampOn} shake={lampShake} progress={prog(f, 4, 18, lin)} />
      <ImpactLines x={LAMP.head[0] - 6} y={LAMP.head[1] - 10} progress={prog(f, lampOnT, 14, lin)} r0={58} r1={96} angles={[-150, -112, -74, 200]} color={INK} width={5} />
      <g opacity={Math.min(1, lampOn)}>{photons}</g>
      {lightEnergy > 0 ? (
        <g>
          <Scribble x={NOTE.x} y={NOTE.y} text="light energy" size={NOTE.size} progress={lightEnergy} color={INK} />
          <HandArrow
            from={[NOTE.x + caveatWidth("light energy", NOTE.size) + 14, NOTE.y - 26]}
            to={[XS[0] - TUBE.w / 2 - 6, 590]}
            bend={0.32}
            progress={prog(f, k.light + 22, 16, lin)}
            width={5}
            head={18}
            color={INK}
            seed={9}
          />
        </g>
      ) : null}

      {/* ---- condition tags */}
      <Tag x={XS[0]} y={TAG_Y} text="light" icon="sun" p={tagP[0]} write={tagW[0]} rot={-3} />
      <Tag x={XS[1] - 10} y={TAG_Y + 4} text="dark" icon="moon" p={tagP[1]} write={tagW[1]} rot={2.5} />
      <Tag x={XS[2] + 34} y={TAG_Y} text="no pondweed" p={tagP[2]} write={tagW[2]} rot={-2} />

      {/* ---- the colour key, propped on the bench front */}
      <IndicatorKeyCard x={KEYCARD.x} y={KEYCARD.y} w={KEYCARD.w} h={KEYCARD.h} rotate={1.2} progress={keyCard} show={keyShow} arrows={keyArrows} hi={keyHi} wiggle={keyWiggle} />

      {/* ---- pre-range labels */}
      {slipHydro > 0 ? (
        <g>
          <PaperSlip x={600} y={306} w={textWidth("hydrogencarbonate", 40, 600) + 56} h={124} rotate={-2.5} progress={slipHydro} tape="left">
            <text x={0} y={-10} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={INK}>
              hydrogencarbonate
            </text>
            <text x={0} y={38} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={INK}>
              indicator
            </text>
          </PaperSlip>
          <HandArrow from={[800, 352]} to={[878, 420]} bend={-0.2} progress={prog(f, k.hydro + 8, 14, lin)} width={5} head={16} color={INK} seed={5} opacity={slipHydro} />
        </g>
      ) : null}
      {slipCo2 > 0 ? (
        <g>
          <PaperSlip x={1150} y={452} w={chemWidth("CO2", 44, 700) + 50} h={76} rotate={3} progress={slipCo2} tape="top">
            <ChemText text="CO2" x={0} y={16} size={44} weight={700} color={INK} anchor="middle" />
          </PaperSlip>
          <HandArrow from={[1104, 478]} to={[1030, 512]} bend={0.2} progress={prog(f, k.co2 + 14, 12, lin)} width={5} head={14} color={INK} seed={6} opacity={slipCo2} />
        </g>
      ) : null}
      {slipBung > 0 ? (
        <PaperSlip x={XS[1]} y={198} w={chemWidth("no CO2 in or out", 42, 700) + 60} h={78} rotate={-1.5} progress={slipBung} tape="top">
          <ChemText text="no CO2 in or out" x={0} y={15} size={42} weight={700} color={INK} anchor="middle" />
        </PaperSlip>
      ) : null}

      {/* ---- the question */}
      {XS.map((tx, i) => (
        <PeekQuestion key={i} x={tx} y={256} size={100} progress={qBud[i]} look={qLook[i]} seed={i * 3 + 1} color={C.amber} />
      ))}
      <PaperSlip x={QSLIP.x} y={QSLIP.y} w={QSLIP.w} h={QSLIP.h} rotate={-2.5} progress={qSlip} tape="top" color={C.paper}>
        <Scribble x={-QSLIP.w / 2 + 34} y={-20} text="What colour" size={76} progress={qLine1} color={INK} />
        <Scribble x={-QSLIP.w / 2 + 34} y={64} text="after a few hours?" size={76} progress={qLine2} color={INK} />
      </PaperSlip>

      {/* ---- Chloro */}
      <Chloro
        x={CHLORO.x}
        y={CHLORO.y}
        size={CHLORO.size}
        mood={mood}
        pose={pose}
        pointAngle={angle}
        flip
        look={[lookX, lookY]}
        talk={mood === "explain" || mood === "happy" ? talk : 0}
        enter={prog(f, 2, 16, lin)}
        bounce={chloroBounce}
        glasses={glasses}
        seed={7}
      />
      {glassPop > 0 ? (
        <g opacity={glassPop}>
          <Sparkle x={CHLORO.x - 96} y={CHLORO.y - 214} r={22} seed={3} color={C.amber} />
          <Sparkle x={CHLORO.x + 92} y={CHLORO.y - 190} r={16} seed={5} color={C.amber} />
        </g>
      ) : null}

      {/* ---- pause & predict: Chloro's thought cloud with the countdown */}
      <ThoughtCloud x={CLOUD.x} y={CLOUD.y} w={CLOUD.w} h={CLOUD.h} from={[CHLORO.x - 62, CHLORO.y - 270]} progress={cloud}>
        <CountdownRing x={0} y={-36} r={60} countdown={countdown} seconds={seconds} progress={ring} dark />
        <text x={0} y={80} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={INK} opacity={Math.min(1, ring * 2)}>
          Pause &amp; predict
        </text>
      </ThoughtCloud>
    </WorldStage>
  );
};
