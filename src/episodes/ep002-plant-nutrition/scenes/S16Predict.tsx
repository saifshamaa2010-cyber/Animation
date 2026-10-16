/**
 * S16 · Predict — hydrogencarbonate indicator, three sealed tubes, and the one "pause and predict".
 *
 * 1. One demo tube of indicator fills; CO2 shows as small dots in the liquid. The colour key builds as
 *    each colour is named: red at air level → more CO2 dissolves in (dots stream in) → yellow → CO2
 *    leaves (dots stream out) → purple. Key: yellow ← red → purple, "more CO₂ / air / less CO₂".
 * 2. The key moves aside; the rack of three red tubes arrives. Bungs in on "sealed", ringed on "bungs",
 *    label "bung: no CO₂ in or out"; CO2 from the air drifts down onto the bungs and bounces off.
 *    A: a sprig of pondweed (under the indicator) and the lamp (photons reach it); B: pondweed and foil;
 *    C: no pondweed.
 * 3. "What colour after a few hours?" — a question mark over each tube; then the PausePredict overlay,
 *    whose countdown fills exactly the silence after "…make your prediction."
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { PausePredict } from "../../../components/PausePredict";
import { Pt, rng } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s16Bounces, s16Timing } from "./S16Predict.timing";
import {
  ChemLeader,
  Co2Dot,
  ColourKey,
  COND_C_X,
  COND_Y,
  DEMO,
  DotDraw,
  DotPlan,
  IndicatorTube,
  KEY_CX,
  LampWithLight,
  RACK_SEEDS,
  RackBase,
  SLOTS,
  TOP_Y,
  TUBE_TOP,
  TubeText,
  dotAt,
  indColour,
  tubeHomes,
} from "./parts/S16-tubes";

// ------------------------------------------------------------------ the demo tube's CO2
const DEMO_BOTTOM = DEMO.y + DEMO.h;
const DEMO_SURF = DEMO_BOTTOM - DEMO.h * DEMO.level;
const DEMO_HOMES = tubeHomes(DEMO.x, 17, 21, { w: DEMO.w, top: DEMO_SURF + 18, bottom: DEMO_BOTTOM - 16, minD: 24 });
/** the three that are left when CO2 leaves (purple) */
const DEMO_KEEP = [0, 4, 7];
const AIR_HOMES: Pt[] = [
  [902, 198],
  [1010, 172],
  [958, 140],
  [1062, 222],
];

// ------------------------------------------------------------------ CO2 in the air, bouncing off the bungs
/** Where each dot starts (above the rack), touches the top of a bung, and bounces back to. */
const BOUNCE: readonly { readonly from: Pt; readonly hit: Pt; readonly to: Pt }[] = [
  { from: [1000, 150], hit: [948, TUBE_TOP - 38 - 9], to: [1012, 178] },
  { from: [1132, 138], hit: [1172, TUBE_TOP - 38 - 9], to: [1236, 168] },
  { from: [1470, 156], hit: [1426, TUBE_TOP - 38 - 9], to: [1360, 182] },
];
/** the bung label: leader from tube A's bung up and left, text to the left of it */
const BUNG_ANCHOR: Pt = [906, TUBE_TOP - 16];
const BUNG_AT: Pt = [846, 214];

export const S16Predict: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s16Timing(sc);

  // ---------------------------------------------------------------- part 1: the demo tube + key
  const demoIn = prog(f, k.indicator, 18);
  const demoOut = 1 - prog(f, k.tubes - 4, 16);
  const fill = prog(f, k.hydro - 4, Math.min(40, Math.max(16, k.co2 - k.hydro)), EASE.inOut);
  const toYellow = prog(f, k.more + 6, Math.max(24, k.yellowWord + 6 - k.more - 6), EASE.inOut);
  const toPurple = prog(f, k.less + 6, Math.max(24, k.purpleWord + 6 - k.less - 6), EASE.inOut);
  const s = -toYellow + 2 * toPurple;

  const r = rng(77);
  const demoPlans: DotPlan[] = DEMO_HOMES.map((home, i) => {
    const isMore = i >= 9;
    const j = i - 9;
    const leaveIdx = DEMO_HOMES.map((_, n) => n).filter((n) => !DEMO_KEEP.includes(n)).indexOf(i);
    const from: Pt = [DEMO.x + (r() - 0.5) * 100, DEMO.y - 50 - r() * 70];
    const to: Pt = [DEMO.x + (r() - 0.5) * 140, DEMO.y - 70 - r() * 60];
    return {
      home,
      seed: 100 + i,
      appearAt: isMore ? undefined : k.co2 + i * 3,
      enterAt: isMore ? k.more + 2 + j * 6 : undefined,
      from: isMore ? from : undefined,
      exitAt: leaveIdx >= 0 ? k.less + 2 + leaveIdx * 4 : undefined,
      to: leaveIdx >= 0 ? to : undefined,
      travel: isMore ? 30 : 36,
    };
  });
  const demoDots = demoPlans.map((p) => dotAt(f, p));
  const airDots = AIR_HOMES.map((home, i) => dotAt(f, { home, seed: 140 + i, appearAt: k.air - 2 + i * 4, jig: 7 }));
  // the CO2 label follows the right-most dot
  const labelDot = demoDots[DEMO_HOMES.reduce((best, h, i) => (i < 9 && h[0] > DEMO_HOMES[best][0] ? i : best), 0)];

  const keyMove = prog(f, k.tubes - 2, 30, EASE.inOut);
  const keyCx = KEY_CX.centre + (KEY_CX.aside - KEY_CX.centre) * keyMove;
  const keyShow: [number, number, number] = [prog(f, k.yellowWord - 2, 18), prog(f, k.redWord - 2, 18), prog(f, k.purpleWord - 2, 18)];
  const keyArrows: [number, number] = [prog(f, k.yellowWord + 2, 16), prog(f, k.purpleWord + 2, 16)];
  const keyHi: [number, number, number] = [
    window01(f, k.yellowWord - 2, k.less + 10, 10),
    window01(f, k.redWord - 2, k.more + 8, 10),
    window01(f, k.purpleWord - 2, k.tubes + 4, 10),
  ];

  // ---------------------------------------------------------------- part 2: the rack
  const rackIn = prog(f, k.tubes + 4, 20);
  const tubeIn = [0, 1, 2].map((i) => prog(f, k.three - 6 + i * 6, 18));
  const bung = [0, 1, 2].map((i) => prog(f, k.sealed - 4 + i * 5, 14));
  const rackDots = SLOTS.map((slot, i) => tubeHomes(slot[0], 9, RACK_SEEDS[i], { weed: i < 2 }).map((home, n) => dotAt(f, { home, seed: 200 + i * 20 + n })));
  // the bungs: ringed while they are explained, with a label; CO2 from the air cannot get past them
  const bungHi = window01(f, k.bungsW - 4, k.tubeA + 8, 10);
  const bungLabelIn = prog(f, k.bungsW + 2, 22);
  const bungLabelOut = 1 - prog(f, k.tubeA + 4, 14, EASE.in);
  const hits = s16Bounces(k);
  const airGone = 1 - prog(f, k.tubeA + 2, 16, EASE.in);
  const bounceDots: (DotDraw | null)[] = BOUNCE.map((b, i) => {
    const t0 = k.noCo2 - 2 + i * 6;
    const hit = Math.max(t0 + 12, hits[i]);
    if (f < t0 || airGone <= 0) return null;
    const jx = noise2D(`bung-air${i}x`, f * 0.035, 0) * 3;
    const jy = noise2D(`bung-air${i}y`, f * 0.035, 7) * 3;
    // falls onto the bung (speeding up), then bounces back up (slowing down)
    const down = prog(f, t0, hit - t0, EASE.in);
    const up = prog(f, hit, 26, EASE.out);
    const x = f < hit ? b.from[0] + (b.hit[0] - b.from[0]) * down : b.hit[0] + (b.to[0] - b.hit[0]) * up;
    const y = f < hit ? b.from[1] + (b.hit[1] - b.from[1]) * down : b.hit[1] + (b.to[1] - b.hit[1]) * up;
    // no jiggle at the moment of contact, so the dot never sinks into the bung
    const calm = f < hit ? 1 - down : up;
    return { x: x + jx * calm, y: y + jy * calm, op: prog(f, t0, 10) * airGone, s: 1 };
  });
  /** a small ring where each dot meets the bung */
  const contact = hits.map((h) => (f >= h ? 1 - prog(f, h, 14, (v) => v) : 0));
  const weedA = prog(f, k.weedA - 4, 18);
  const lampIn = prog(f, k.tubeA, 18);
  const lampOn = prog(f, k.bright - 2, 10);
  const weedB = prog(f, k.weedB - 4, 18);
  // the pondweed glows softly as it is named, so the eye finds it inside the tube
  const weedGlow = [pulse(f, k.weedA - 2, 40), pulse(f, k.weedB - 2, 40)];
  const foil = prog(f, k.wrapped - 2, Math.min(24, Math.max(12, k.dark - k.wrapped)));
  const condP = [prog(f, k.light - 2, 16), prog(f, k.dark - 2, 16), prog(f, k.noWeed - 2, 16)];

  // ---------------------------------------------------------------- part 3: the question + pause
  const overlay = prog(f, k.pauseNow, 14);
  const qMarks = [0, 1, 2].map((i) => prog(f, k.colour - 2 + i * 5, 14));
  const q1 = prog(f, k.question, 16); // stays up during the pause: it is the question being predicted
  const q2 = prog(f, k.after - 2, 16);
  const countdown = prog(f, k.silence, Math.max(1, k.end - k.silence), (v) => v);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.55, lightY: 0.36 }}>
      {/* ============ part 1: the demo tube ============ */}
      {demoOut > 0 ? (
        <g opacity={demoOut}>
          {airDots.map((d, i) => (
            <g key={i} opacity={0.85}>
              {d ? <circle cx={d.x} cy={d.y} r={12} fill={C.ice} opacity={0.3 * d.op} /> : null}
              {d ? <circle cx={d.x} cy={d.y} r={7} fill={C.ice} opacity={0.9 * d.op} stroke={C.ink900} strokeOpacity={0.6} strokeWidth={2} /> : null}
            </g>
          ))}
          <IndicatorTube
            x={DEMO.x}
            y={DEMO.y}
            w={DEMO.w}
            h={DEMO.h}
            level={DEMO.level * fill}
            colour={indColour(s)}
            dots={demoDots}
            dotR={7}
            progress={demoIn}
          />
          <Label anchor={[DEMO.x - DEMO.w / 2 + 2, 470]} at={[850, 330]} align="end" text="hydrogencarbonate indicator" progress={prog(f, k.hydro - 2, 22)} />
          {labelDot ? <ChemLeader anchor={[labelDot.x, labelDot.y]} at={[1110, 452]} text="CO2" color={C.ice} progress={prog(f, k.co2 + 4, 22)} /> : null}
        </g>
      ) : null}

      {/* ============ part 2: the rack ============ */}
      <RackBase progress={rackIn} />
      <LampWithLight f={f} progress={lampIn} on={lampOn} start={k.bright + 2} every={() => 10} />
      {SLOTS.map((slot, i) => (
        <IndicatorTube
          key={i}
          x={slot[0]}
          colour={indColour(0)}
          dots={rackDots[i]}
          weed={i === 0 ? weedA : i === 1 ? weedB : 0}
          weedGlow={i < 2 ? weedGlow[i] : 0}
          sunlit={i === 0 ? 0.8 * lampOn : 0}
          bung={bung[i]}
          bungHi={bungHi}
          foil={i === 1 ? foil : 0}
          progress={tubeIn[i]}
        />
      ))}
      {/* CO2 from the air can't get past the bungs */}
      {BOUNCE.map((b, i) =>
        contact[i] > 0 && airGone > 0 ? (
          <circle key={i} cx={b.hit[0]} cy={b.hit[1] + 6} r={10 + 16 * (1 - contact[i])} fill="none" stroke={C.ice} strokeWidth={3} opacity={0.7 * contact[i] * airGone} />
        ) : null,
      )}
      {bounceDots.map((d, i) => (
        <Co2Dot key={i} d={d} r={7} />
      ))}
      <ChemLeader anchor={BUNG_ANCHOR} at={BUNG_AT} align="end" text="bung: no CO2 in or out" progress={bungLabelIn} opacity={bungLabelOut} />
      <TubeText x={SLOTS[0][0]} y={COND_Y} text="light" p={condP[0]} color={C.sun} />
      <TubeText x={SLOTS[1][0]} y={COND_Y} text="dark" p={condP[1]} />
      <TubeText x={COND_C_X} y={COND_Y} text="no pondweed" p={condP[2]} />
      {SLOTS.map((slot, i) => (
        <TubeText key={i} x={slot[0]} y={TOP_Y} text="?" p={qMarks[i]} size={64} weight={700} />
      ))}

      {/* the colour key: built in the centre, then moved aside for the experiment */}
      <ColourKey cx={keyCx} show={keyShow} arrows={keyArrows} hi={keyHi} />

      {/* the question (top-left, clear of the lamp) */}
      {q1 > 0 ? (
        <g>
          <text x={120} y={262 + (1 - EASE.out(Math.min(1, q1))) * 12} fontFamily={FONT} fontWeight={700} fontSize={52} fill={C.paper} opacity={q1} letterSpacing={-0.5}>
            What colour
          </text>
          <text x={120} y={330 + (1 - EASE.out(Math.min(1, q2))) * 12} fontFamily={FONT} fontWeight={700} fontSize={52} fill={C.paper} opacity={q2} letterSpacing={-0.5}>
            after a few hours?
          </text>
        </g>
      ) : null}

      <SectionTag n={9} title="Gas exchange" t={f} />

      {/* ============ part 3: pause & predict ============ */}
      {/* compact badge: the tubes and the colour key stay visible while the viewer predicts */}
      <PausePredict visible={overlay} countdown={countdown} question="" badge={{ x: 1010, y: 850 }} />
    </Stage>
  );
};
