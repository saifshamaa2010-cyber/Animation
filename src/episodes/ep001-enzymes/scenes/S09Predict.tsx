/**
 * S09 · Pause and predict. Same shot as the end of S08 (hard cut, so it plays as one take).
 * The heat goes up: the temperature axis extends, the thermometer lands on 50, 60, 70 exactly as
 * each number is spoken, the molecules in the lens shake harder — but the graph past 37 °C stays
 * blank. Two dashed guesses (keeps rising? falls?) and then the pause: the overlay is fully up for
 * the whole 4-second silence while its ring counts down.
 */
import React from "react";
import { EASE } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Thermometer } from "../../../components/Thermometer";
import { PausePredict } from "../../../components/PausePredict";
import { useScene } from "../../../lib/timeline";
import { s09Timing } from "./S09Predict.timing";
import { AmbientTemp, Lens, Population, THERMO, TempGraph, lensCam, recentSnips, span, tempAt, worldTransform } from "./S08-S10-shared";
import { OptimumNote } from "./S08Temperature";

export const S09_QUESTION = "Hotter: faster or slower?";

/** The pause overlay (S10 opens on it, so it's shared). */
export const s09Overlay = (f: number, k: ReturnType<typeof s09Timing>) => ({
  visible: span(f, k.overlayA, k.overlayA + 14, EASE.out),
  countdown: Math.max(0, Math.min(1, (f - k.pauseA) / (k.end - k.pauseA))),
});

export const S09Predict: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s09Timing(sc);
  const abs = sc.scene.startFrame + f;
  const T = tempAt(abs);
  const cam = lensCam(1);

  const tick = (cue: number) => span(f, cue - 4, cue + 8);
  const axisTo = 45 + 25 * span(f, k.axisA, k.axisB, EASE.inOut);
  const probeO = span(f, k.creepA + 6, k.creepA + 18) * (1 - span(f, k.guessUpA - 4, k.guessUpA + 10));
  const ov = s09Overlay(f, k);

  return (
    <Stage bg={{ lightX: 0.5, temperature: T }}>
      <AmbientTemp T={T} />
      <Lens cam={cam} frame={1}>
        <g transform={worldTransform(cam)}>
          <Population abs={abs} />
        </g>
      </Lens>

      <Thermometer x={THERMO.x} y={THERMO.y} height={THERMO.h} temperature={T} />

      <TempGraph
        f={abs}
        axes={1}
        axisTo={axisTo}
        ticks={[
          { v: 0, o: 1 },
          { v: 20, o: 1 },
          { v: 37, o: 1, hi: 1 - span(f, k.predict, k.predict + 16) },
          { v: 50, o: tick(k.t50), hi: span(f, k.t50 - 4, k.t50 + 4) * (1 - span(f, k.t60 - 6, k.t60 + 6)) },
          { v: 60, o: tick(k.t60), hi: span(f, k.t60 - 4, k.t60 + 4) * (1 - span(f, k.t70 - 6, k.t70 + 6)) },
          { v: 70, o: tick(k.t70), hi: span(f, k.t70 - 4, k.t70 + 4) * (1 - span(f, k.question, k.question + 14)) },
        ]}
        riseTo={37}
        dot={{ x: 37, o: 1, pulses: recentSnips(abs) }}
        pointer={{ x: T, o: 1 }}
        guide={1}
        probe={{ x: T, o: probeO }}
        guesses={{ up: Math.max(0, Math.min(1, (f - k.guessUpA) / 20)), down: Math.max(0, Math.min(1, (f - k.guessDownA) / 20)), o: 1 }}
      />

      <OptimumNote main={1} approx={1} body={1 - span(f, k.predict, k.predict + 14)} circle={1} circleO={1 - span(f, k.predict + 2, k.predict + 16)} />

      <PausePredict visible={ov.visible} countdown={ov.countdown} question={S09_QUESTION} />
    </Stage>
  );
};
