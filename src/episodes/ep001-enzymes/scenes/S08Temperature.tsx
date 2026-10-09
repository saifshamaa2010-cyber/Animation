/**
 * S08 · Temperature. The thermometer drives everything you see: how fast the molecules jiggle and
 * wander (kinetic energy), how often (and how hard) enzymes and substrates bump into each other, and
 * how many bumps succeed (the substrate lands in the active site → enzyme–substrate complex → maltose).
 * Then the camera pulls back so the crowd sits in a lens, and the rate graph is plotted from it — the
 * dot rides the curve in step with the thermometer and pulses with every reaction.
 */
import React from "react";
import { C, EASE, H } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Thermometer } from "../../../components/Thermometer";
import { Keyword, Label } from "../../../components/Label";
import { Scrim } from "../../../components/Scrim";
import { HandCircle } from "../../../components/kit/hand";
import { useScene } from "../../../lib/timeline";
import { s08Timing } from "./S08Temperature.timing";
import { DOCKS, enzymePose, mouthPoint } from "./S08-S10-arc";
import {
  AmbientTemp,
  ApproxText,
  Lens,
  Population,
  THERMO,
  TempGraph,
  gx,
  gy,
  lensCam,
  recentSnips,
  span,
  tempAt,
  worldToScreen,
  worldTransform,
} from "./S08-S10-shared";

/** The optimum annotation (also drawn by S09/S10 so the cuts between them are seamless). */
export const OptimumNote: React.FC<{ readonly main: number; readonly approx: number; readonly body: number; readonly circle: number; readonly circleO?: number }> = ({
  main,
  approx,
  body,
  circle,
  circleO = 1,
}) => {
  const px = gx(37);
  const py = gy(1);
  const y1 = 232;
  return (
    <g>
      {circle > 0 ? <HandCircle cx={px} cy={py} rx={50} ry={44} progress={circle} color={C.paper} width={6} seed={37} opacity={circleO} startAngle={-60} /> : null}
      {main > 0 ? (
        <g opacity={main} transform={`translate(0 ${(1 - main) * 10})`}>
          <text x={px - 14} y={y1} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={52} fill={C.paper} letterSpacing={-1}>
            optimum
          </text>
        </g>
      ) : null}
      {approx > 0 ? <ApproxText x={px + 6} y={y1} after="37 °C" size={52} weight={700} color={C.amberLight} opacity={approx} /> : null}
      {body > 0 ? (
        <text x={px} y={y1 + 50} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={36} fill={C.ink300} opacity={body}>
          body temperature
        </text>
      ) : null}
    </g>
  );
};

export const S08Temperature: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s08Timing(sc);
  const abs = sc.scene.startFrame + f;
  const T = tempAt(abs);

  // ---- lens: the full-frame crowd pulls back into a circular window on "a faster rate of reaction"
  const irisT = Math.max(0, Math.min(1, (f - k.irisA) / (k.irisB - k.irisA)));
  const cam = lensCam(irisT);
  const rim = span(f, k.irisA + 10, k.irisB + 4);

  // ---- thermometer arrives on "temperature" and reads 10 °C (cold)
  const thIn = span(f, k.thermoIn, k.thermoIn + 22);
  const thFill = span(f, k.thermoIn + 8, k.thermoIn + 34, EASE.inOut);

  // ---- graph
  const axes = span(f, k.axesA, k.axesB, EASE.inOut);
  const trace = span(f, k.traceA, k.traceB, EASE.inOut);
  const riseTo = T * trace;
  const dotO = span(f, k.traceB - 8, k.traceB + 4);
  const tickO = span(f, k.axesB - 8, k.axesB + 6);
  const hi37 = span(f, k.deg - 2, k.deg + 10);

  // ---- the hero collision (full view): label anchored at the active-site mouth of enzyme 0
  const hero = DOCKS[0];
  const heroMouth = mouthPoint(enzymePose(hero.e, Math.min(abs, hero.at + hero.hold)));
  const heroScreen = worldToScreen(cam, heroMouth);
  const lblIn = span(f, k.successful - 2, k.successful + 20, EASE.out);
  const lblOut = 1 - span(f, k.complexWord - 8, k.complexWord + 4, EASE.in);

  // ---- exam-term captions (bottom, over a soft scrim)
  const capKE = span(f, k.kinetic - 2, k.kinetic + 12) * (1 - span(f, k.collide - 14, k.collide - 2));
  const capES = span(f, k.complexWord - 2, k.complexWord + 12) * (1 - span(f, k.irisA - 6, k.irisA + 6));
  const scrim = Math.max(capKE, capES);

  return (
    <Stage bg={{ lightX: 0.5, temperature: T }}>
      <AmbientTemp T={T} />

      <Lens cam={cam} frame={rim}>
        <g transform={worldTransform(cam)}>
          <Population abs={abs} />
        </g>
      </Lens>

      <g opacity={thIn} transform={`translate(0 ${(1 - thIn) * 40})`}>
        <Thermometer x={THERMO.x} y={THERMO.y} height={THERMO.h} temperature={T * thFill} />
      </g>

      <TempGraph
        f={abs}
        axes={axes}
        axisTo={45}
        ticks={[
          { v: 0, o: tickO },
          { v: 20, o: tickO },
          { v: 37, o: tickO, hi: hi37 },
        ]}
        riseTo={riseTo}
        dot={{ x: T, o: dotO, pulses: recentSnips(abs) }}
        pointer={{ x: T, o: dotO }}
        guide={span(f, k.deg - 4, k.deg + 18)}
      />

      <OptimumNote
        circle={Math.max(0, Math.min(1, (f - k.peak + 2) / 22))}
        main={span(f, k.optWord - 2, k.optWord + 12)}
        approx={span(f, k.deg - 2, k.deg + 12)}
        body={span(f, k.body - 2, k.body + 14)}
      />

      <Label
        anchor={heroScreen}
        at={[heroScreen[0] - 80, heroScreen[1] - 118]}
        text="successful collision"
        align="end"
        color={C.amberLight}
        progress={lblIn}
        opacity={lblOut}
      />

      <Scrim opacity={scrim * 0.9} height={260} />
      <Keyword x={1110} y={H - 112} text="more kinetic energy" size={60} progress={capKE} />
      <Keyword x={1110} y={H - 112} text="enzyme–substrate complex" size={60} progress={capES} />
    </Stage>
  );
};
