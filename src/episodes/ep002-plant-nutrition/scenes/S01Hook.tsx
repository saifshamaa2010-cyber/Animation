/**
 * S01 · Hook — van Helmont's willow.
 * A sapling in a pot of dried soil on a scale; both are weighed (ledger ticks); five years of nothing but
 * water (the tree grows, the camera pulls back to fit it); +74 kg vs −57 g; "Where did the mass come from?";
 * not the soil — carbon dioxide drifts in out of thin air and into the leaves.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { Pot } from "../../../components/bio";
import { Scale } from "../../../components/lab/Lab";
import { Counter, HandUnderline, mix, textWidth } from "../../../components/kit";
import { camAt, camTransform } from "../../../lib/camera";
import { Pt } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { WILLOW } from "./layout";
import { s01Timing } from "./S01Hook.timing";
import { END_CAM, START_CAM, WILLOW_BASE, WillowTree, crownTargets, willowGeometry } from "./parts/S01-Willow";
import { Ledger } from "./parts/S01-Ledger";
import { Drops, WateringCan, roseOf } from "./parts/S01-WateringCan";
import { Co2Molecules, co2Flights, co2Glint } from "./parts/S01-Co2Stream";

const lin = (v: number) => v;
const SLOT_X = WILLOW.ledgerX;
const SLOT_Y = 214;
const CAN = { x: 446, y: 528, tilt: 46 } as const;
const FULL = willowGeometry(1);
const TARGETS = crownTargets(FULL, 14, 1, 5);

/** The scale's display: three dashes that switch on one by one, then light up whenever something is weighed. */
const ScaleDisplay: React.FC<{ readonly f: number; readonly blink: number; readonly wakeAt: number }> = ({ f, blink, wakeAt }) => {
  const x = WILLOW.potX;
  const y = WILLOW.scaleY;
  return (
    <g>
      {blink > 0 ? <rect x={x - 150} y={y + 50} width={300} height={66} rx={10} fill={C.amber} opacity={0.2 * blink} /> : null}
      {[-1, 0, 1].map((i) => {
        const at = wakeAt + (i + 1) * 6;
        if (f < at) return null;
        const flash = pulse(f, at, 12);
        return <rect key={i} x={x + i * 56 - 18} y={y + 80} width={36} height={8} rx={4} fill={mix(C.ink600, C.amberLight, Math.max(blink, flash * 0.7))} />;
      })}
    </g>
  );
};

export const S01Hook: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s01Timing(sc);

  // ---- five years of growth (a time-lapse), and the camera pulling back to keep the whole tree in view
  const g = 0.09 + 0.91 * EASE.inOut(prog(f, k.growStart, k.growEnd - k.growStart, lin));
  const geo = g >= 0.999 ? FULL : willowGeometry(g);
  const cam = camAt(f, [
    { f: -10, ...START_CAM },
    { f: k.growStart + 6, ...START_CAM },
    { f: k.growEnd + 16, ...END_CAM },
  ]);
  const S = (p: Pt) => toScreen(cam, p);

  // ---- the set: scale and pot are there from the first frame; the sapling is planted on "planted"
  // the pot of dried soil is set down on the scale, and the scale's display switches on
  const scaleIn = prog(f, 0, 14);
  const potIn = prog(f, 4, 24);
  const planted = prog(f, k.plant - 2, 24);
  const blink = Math.max(
    ...[k.tickTree, k.tickSoil, k.gained, k.lost].map((a) => Math.max(pulse(f, a, 10), pulse(f, a + 12, 10))),
  );

  // ---- watering: the can tips, drops fall rhythmically into the soil, then it leaves
  const canIn = prog(f, k.water - 6, 18);
  const canOut = prog(f, k.growEnd - 20, 18, EASE.in);
  const tilt = track(f, [[k.water + 6, 0], [k.water + 22, CAN.tilt, EASE.out], [k.growEnd - 26, CAN.tilt], [k.growEnd - 12, 0]]);
  const canX = CAN.x - 60 * (1 - EASE.out(canIn)) - 50 * canOut;
  const rose = roseOf(CAN.x, CAN.y, CAN.tilt);
  const pourStart = k.water + 22;
  const pourStop = k.growEnd - 26;
  const wet = 0.5 * prog(f, pourStart + 18, 60) * (1 - prog(f, k.growEnd + 30, 90));

  // ---- carbon dioxide out of thin air
  const flights = co2Flights({
    start: k.air - 4,
    stop: k.end + 30,
    every: 13,
    travel: 80,
    targets: TARGETS,
    spawn: (_, r) => [1150 + r() * 230, -150 - r() * 70],
    seed: 7,
  });
  const glint = co2Glint(flights, f);

  // ---- screen-space anchors
  const saplingTip = S([WILLOW_BASE[0] + 22, WILLOW_BASE[1] - 104 + (1 - planted) * -46]);
  const soilSpot = S([WILLOW_BASE[0] + 78, WILLOW_BASE[1] - 2]);
  const labelsOff = 1 - prog(f, k.weigh - 4, 12);
  const nameVis = prog(f, k.name - 2, 18) * (1 - prog(f, k.water - 8, 14));
  const yearVis = prog(f, k.five - 4, 16) * (1 - prog(f, k.question - 6, 14));
  const years = 1 + 4 * prog(f, k.five + 8, k.growEnd - k.five - 14, lin);
  const qOut = 1 - prog(f, k.promise + 4, 16);
  const q1 = prog(f, k.where - 2, 16) * qOut;
  const q2 = prog(f, k.mass - 4, 16) * qOut;
  const Q = { size: 64, y1: 716, y2: 794 };
  const yearW = textWidth("year", 60, 600) + 22;
  const airAnchor = S([1096, 30]);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.3, lightY: 0.28 }}>
      <g transform={camTransform(cam)}>
        <g opacity={scaleIn}>
          <Scale x={WILLOW.potX} y={WILLOW.scaleY} w={WILLOW.scaleW} reading="" />
          <ScaleDisplay f={f} blink={blink} wakeAt={22} />
        </g>
        <g opacity={Math.min(1, potIn * 2)} transform={`translate(0 ${(1 - EASE.out(potIn)) * -40})`}>
          <Pot x={WILLOW.potX} y={WILLOW.potY} w={WILLOW.potW} h={WILLOW.potH} />
        </g>
        {wet > 0 ? <ellipse cx={rose[0] + 18} cy={WILLOW.potY + 6} rx={44} ry={8} fill={mix(C.soil, C.ink950, 0.55)} opacity={wet} /> : null}
        {planted > 0 ? (
          <g transform={`translate(0 ${(1 - EASE.out(planted)) * -46})`} opacity={Math.min(1, planted * 1.6)}>
            <WillowTree geo={geo} glint={glint} />
          </g>
        ) : null}
        <Drops f={f} start={pourStart} stop={pourStop} every={6} from={() => rose} soilY={WILLOW.potY + 4} />
        <WateringCan x={canX} y={CAN.y - 30 * canOut} tilt={tilt} opacity={canIn * (1 - canOut)} />
        <Co2Molecules f={f} flights={flights} scale={0.5} />
      </g>

      {/* ---- who, what: the scientist; then the two things he weighed */}
      {nameVis > 0 ? (
        <g opacity={nameVis} transform={`translate(0 ${(1 - nameVis) * 12})`}>
          <text x={SLOT_X} y={SLOT_Y} fontFamily={FONT} fontWeight={700} fontSize={60} fill={C.paper} letterSpacing={-1}>
            Jan van Helmont
          </text>
          <text x={SLOT_X} y={SLOT_Y + 56} fontFamily={FONT} fontWeight={400} fontSize={40} fill={C.ink300}>
            scientist
          </text>
        </g>
      ) : null}
      <Label anchor={saplingTip} at={[saplingTip[0] + 190, saplingTip[1] - 70]} text="willow" sub="small tree" progress={prog(f, k.willowWord - 2, 22)} opacity={labelsOff} color={C.leafLight} />
      <Label anchor={soilSpot} at={[soilSpot[0] + 150, soilSpot[1] + 92]} text="dried soil" progress={prog(f, k.soilWord - 2, 22)} opacity={labelsOff} />

      <Ledger
        card={prog(f, k.weigh - 6, 20)}
        rows={[prog(f, k.weigh + 2, 16), prog(f, k.row2 - 4, 16)]}
        ticks={[prog(f, k.tickTree, 14, lin), prog(f, k.tickSoil, 14, lin)]}
        values={[74 * prog(f, k.gained, k.rollA - k.gained), 57 * prog(f, k.lost, k.rollB - k.lost)]}
        valueOn={[prog(f, k.gained - 4, 10), prog(f, k.lost - 4, 10)]}
        hi={[window01(f, k.gained - 6, k.rollA + 34, 10), window01(f, k.soilAsk - 4, k.rollB + 34, 10)]}
        strike={prog(f, k.strike, 14, lin)}
      />

      {/* ---- five years pass */}
      {yearVis > 0 ? (
        <g opacity={yearVis} transform={`translate(0 ${(1 - yearVis) * 12})`}>
          <text x={SLOT_X} y={SLOT_Y} fontFamily={FONT} fontWeight={600} fontSize={60} fill={C.paper} letterSpacing={-0.5}>
            year
          </text>
          <Counter x={SLOT_X + yearW} y={SLOT_Y - 60 * 0.355} value={years} size={60} align="start" color={C.paper} />
          {[0, 1, 2, 3, 4].map((i) => {
            const on = Math.max(0, Math.min(1, (years - i - 0.75) / 0.25));
            return (
              <g key={i}>
                <circle cx={SLOT_X + 12 + i * 36} cy={SLOT_Y + 44} r={10} fill="none" stroke={C.ink400} strokeWidth={2.5} />
                <circle cx={SLOT_X + 12 + i * 36} cy={SLOT_Y + 44} r={10 * on} fill={C.paper} />
              </g>
            );
          })}
        </g>
      ) : null}

      {/* ---- the question */}
      {q1 > 0 ? (
        <text x={SLOT_X} y={Q.y1 + (1 - q1) * 14} fontFamily={FONT} fontWeight={700} fontSize={Q.size} fill={C.paper} opacity={q1} letterSpacing={-1}>
          Where did the
        </text>
      ) : null}
      {q2 > 0 ? (
        <g opacity={q2}>
          <text x={SLOT_X} y={Q.y2 + (1 - q2) * 14} fontFamily={FONT} fontWeight={700} fontSize={Q.size} fill={C.paper} letterSpacing={-1}>
            mass come from?
          </text>
          <HandUnderline x1={SLOT_X - 2} x2={SLOT_X + textWidth("mass", Q.size, 700, -1) + 4} y={Q.y2 + 18} progress={prog(f, k.mass + 6, 16, lin)} color={C.paper} width={6} seed={14} />
        </g>
      ) : null}

      {/* ---- out of thin air */}
      <Label anchor={airAnchor} at={[SLOT_X, SLOT_Y - 14]} text="thin air" color={C.ice} size={56} progress={prog(f, k.thin - 2, 22)} opacity={1 - prog(f, k.promise + 96, 18)} />
    </Stage>
  );
};
