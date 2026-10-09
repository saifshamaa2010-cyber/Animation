/**
 * S12 · pH.
 * Our amylase rides a pH scale. Slide it towards acid, then alkali: the active site warps (and recovers
 * as it passes neutral). Close up: the weak bonds holding the pocket in shape are disrupted. Push it
 * far enough and it's denatured. Then the scale becomes the x-axis of a graph: amylase peaks near pH 7
 * (mouth), pepsin near pH 2 (stomach) — different enzymes, tuned to different places.
 */
import React from "react";
import { C, EASE, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Enzyme } from "../../../components/Enzyme";
import { Graph, bell } from "../../../components/Graph";
import { Label, Keyword } from "../../../components/Label";
import { PHScale, phColour, textWidth } from "../../../components/kit";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { jit, jitTransform, toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s12Timing } from "./S12Ph.timing";
import { FoldBonds } from "./S06-S12-shared";

const BAR = { x: 260, y: 800, w: 1400, h: 26 } as const;
const phX = (p: number) => BAR.x + (p / 14) * BAR.w;
const EY = 440;
const ES = 1.0;
/** Graph plot area: its baseline sits right on top of the pH bar, so the bar IS the x-axis. */
const G = { x: BAR.x, y: 280, w: BAR.w, h: 500 } as const;
const gy = (v: number) => G.y + G.h - v * G.h * 0.92;
const ZONE_Y = BAR.y + BAR.h / 2 + 36 + 29 + 60;
const AMY = bell(7, 1.6);
const PEP = bell(2, 1.1);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const S12Ph: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s12Timing(sc);
  const gid = useSvgId("s12");

  // ---------------- part 1: the enzyme rides the pH scale
  const pH = track(f, [
    [k.disrupt - 2, 7],
    [k.acidic + 16, 3.2, EASE.inOut],
    [k.alkaline - 4, 3.2],
    [k.alkaline + 30, 10.8, EASE.inOut],
    [k.far, 10.8],
    [k.far + 40, 13.1, EASE.inOut],
  ]);
  const ex = phX(pH);
  const reversible = 0.34 * smooth(1.2, 3.6, Math.abs(pH - 7)) + 0.12 * prog(f, k.disrupted, 16) * smooth(1.2, 3.6, Math.abs(pH - 7));
  const denature = Math.min(1, reversible + 0.62 * prog(f, k.denatured - 16, 30, EASE.inOut));
  const bondsVis = window01(f, k.bonds - 4, k.phOptimum - 4, 12);
  const bondsBroken = 0.22 * prog(f, k.bonds + 6, 10) + 0.22 * prog(f, k.disrupted, 14) + 0.56 * prog(f, k.denatured - 12, 28);
  const ej = jit("E12", f, thermalAmplitude(37) * 0.8);
  const enzVis = prog(f, k.ph - 6, 22) * (1 - prog(f, k.phOptimum, 18));
  const siteVis = window01(f, k.disrupt - 8, k.phOptimum + 10, 14);

  const cam = camAt(f, [
    { f: -12, x: 960, y: 540, z: 1 },
    { f: k.bonds - 14, x: 960, y: 540, z: 1 },
    { f: k.bonds + 20, x: phX(10.8) - 60, y: EY - 10, z: 1.6 },
    { f: k.far - 6, x: phX(10.8) - 60, y: EY - 10, z: 1.6 },
    { f: k.far + 34, x: 960, y: 540, z: 1 },
  ]);
  const S = (p: readonly [number, number]) => toScreen(cam, p);
  const wash = Math.min(1, Math.abs(pH - 7) / 6) * enzVis;

  // ---------------- part 2: optimum pH graph
  const axesP = prog(f, k.phOptimum + 6, 30, (t) => t);
  const amyTo = 3 + 8 * prog(f, k.optimum - 34, 60, EASE.inOut);
  const pepTo = 5 * prog(f, k.pepsin, 44, EASE.inOut);
  const glowPulse = 0.5 + 0.5 * Math.sin((f - k.tuned) * 0.18);
  const tuned = prog(f, k.tuned, 20);
  const curveW = 7 + 3 * tuned * glowPulse;
  const labelsOut = 1 - prog(f, k.tuned - 4, 14);
  const guide7 = prog(f, k.seven, 18);
  const guide2 = prog(f, k.two, 18);
  const pepDot = prog(f, k.pepsin + 30, 12);
  const acidGlow = Math.max(pulse(f, k.strongly, 30) * 0.9, 0.35 * prog(f, k.strongly + 15, 15)) * (1 - prog(f, k.tuned, 30) * 0.5);
  const neutralGlow = Math.max(pulse(f, k.neutral, 30) * 0.9, 0.3 * prog(f, k.neutral + 15, 15)) * (1 - prog(f, k.tuned, 30) * 0.5);

  const dot = (x: number, y: number, color: string, p: number, ring = 0) =>
    p > 0 ? (
      <g opacity={p}>
        {ring > 0 ? <circle cx={x} cy={y} r={20 + 36 * ring} fill="none" stroke={color} strokeWidth={3} opacity={1 - ring} /> : null}
        <circle cx={x} cy={y} r={24} fill={color} opacity={0.25} />
        <circle cx={x} cy={y} r={12} fill={C.paper} stroke={color} strokeWidth={5} />
      </g>
    ) : null;

  const denLabelAnchor = S([ex - 120 * ES + ej.dx, EY - 60 + ej.dy]);

  return (
    <Stage bg={{ particles: 34, lightX: 0.5 }}>
      <defs>
        <radialGradient id={`${gid}-wash`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={phColour(pH)} stopOpacity={0.28} />
          <stop offset="1" stopColor={phColour(pH)} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${gid}-glowA`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.coral} stopOpacity={0.7} />
          <stop offset="1" stopColor={C.coral} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${gid}-glowN`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.paper} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.paper} stopOpacity={0} />
        </radialGradient>
      </defs>

      <g transform={camTransform(cam)}>
        {/* the surroundings take on the colour of the pH */}
        {wash > 0.01 ? <ellipse cx={ex} cy={EY + 60} rx={620} ry={460} fill={`url(#${gid}-wash)`} opacity={wash} /> : null}

        {/* ---- the scale (later: the graph's x-axis) */}
        {acidGlow > 0 ? <ellipse cx={phX(1.6)} cy={BAR.y} rx={260} ry={70} fill={`url(#${gid}-glowA)`} opacity={acidGlow} /> : null}
        {neutralGlow > 0 ? <ellipse cx={phX(7)} cy={BAR.y} rx={220} ry={64} fill={`url(#${gid}-glowN)`} opacity={neutralGlow} /> : null}
        <PHScale
          x={BAR.x}
          y={BAR.y}
          width={BAR.w}
          height={BAR.h}
          progress={prog(f, k.ph, 40, (t) => t)}
          marker={pH}
          markerLabel={`pH ${Math.round(pH)}`}
          markerColor={C.paper}
          markerProgress={prog(f, k.ph + 26, 16) * (1 - prog(f, k.phOptimum - 4, 14)) * (1 - window01(f, k.bonds - 10, k.far + 16, 10))}
          numbers="all"
        />
        <text x={BAR.x + BAR.w + 48} y={BAR.y + 15} fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paperDim} opacity={prog(f, k.ph + 20, 16)}>
          pH
        </text>
        <text x={phX(2.4)} y={ZONE_Y} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.coral} opacity={prog(f, k.acidic, 14) * (1 - prog(f, k.phOptimum, 14))}>
          acidic
        </text>
        <text x={phX(11.6)} y={ZONE_Y} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.violetLight} opacity={prog(f, k.alkaline, 14) * (1 - prog(f, k.phOptimum, 14))}>
          alkaline
        </text>

        {/* ---- the enzyme */}
        {enzVis > 0 ? (
          <g opacity={enzVis} transform={jitTransform(ej, [ex, EY])}>
            <Enzyme
              x={ex}
              y={EY}
              scale={ES}
              still
              denature={denature}
              showSite={siteVis}
              siteColor={denature > 0.55 ? C.coral : C.paper}
              seed={7}
            />
            <FoldBonds x={ex} y={EY} scale={ES} seed={7} denature={denature} visible={bondsVis} broken={bondsBroken} />
          </g>
        ) : null}
      </g>

      {/* ---------------- graph (screen space; camera is at rest by now) */}
      {axesP > 0 ? (
        <g>
          <path d={`M${G.x - 14},${G.y + G.h} V${G.y - 20}`} fill="none" stroke={C.ink300} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={`${axesP} 1`} />
          <text x={G.x - 56} y={G.y + G.h / 2} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.ink300} transform={`rotate(-90 ${G.x - 56} ${G.y + G.h / 2})`} opacity={prog(f, k.phOptimum + 24, 14) * labelsOut}>
            rate
          </text>
        </g>
      ) : null}
      <Graph
        x={G.x}
        y={G.y}
        width={G.w}
        height={G.h}
        xDomain={[0, 14]}
        axes={0}
        curves={[
          { f: AMY, color: C.teal, revealFrom: 3, revealTo: amyTo, fill: true, width: curveW, opacity: prog(f, k.optimum - 34, 6) },
          { f: PEP, color: C.violet, revealFrom: 0, revealTo: pepTo, fill: true, width: curveW, opacity: prog(f, k.pepsin, 6) },
        ]}
      />
      {/* guides: each peak lines up with where that enzyme works */}
      {guide7 > 0 ? (
        <line x1={phX(7)} y1={gy(1) + 20} x2={phX(7)} y2={gy(1) + 20 + (BAR.y - 16 - gy(1) - 20) * guide7} stroke={C.tealLight} strokeWidth={3} strokeDasharray="8 10" opacity={0.8} />
      ) : null}
      {guide2 > 0 ? (
        <line x1={phX(2)} y1={BAR.y - 16} x2={phX(2)} y2={BAR.y - 16 - (BAR.y - 16 - gy(1) - 20) * guide2} stroke={C.coral} strokeWidth={3} strokeDasharray="8 10" opacity={0.8} />
      ) : null}
      {dot(phX(7), gy(1), C.teal, prog(f, k.optimum + 18, 12), prog(f, k.optimum + 18, 22) < 1 ? prog(f, k.optimum + 18, 22) : 0)}
      {dot(phX(2), gy(PEP(2)), C.violet, pepDot, f >= k.best && f < k.best + 22 ? prog(f, k.best, 22) : 0)}

      {/* labels: the optimum, the enzymes, and where they work */}
      <Keyword x={phX(7)} y={gy(1) - 44} text="optimum" size={48} weight={600} color={C.paper} progress={prog(f, k.optimum, 14) * (1 - prog(f, k.amylase - 6, 10))} />
      <Keyword x={phX(7) + 34} y={gy(1) - 44} text="amylase" size={52} weight={600} color={C.tealLight} progress={prog(f, k.amylase, 14) * labelsOut} />
      <Keyword x={phX(2) + 34} y={gy(1) - 44} text="pepsin" size={52} weight={600} color={C.violetLight} progress={prog(f, k.pepsin, 14) * labelsOut} />
      {/* each curve keeps its molecule beside its name */}
      {(
        [
          [phX(7) + 34 - textWidth("amylase", 52, 600) / 2 - 46, "teal", 0, prog(f, k.amylase, 14)],
          [phX(2) + 34 - textWidth("pepsin", 52, 600) / 2 - 46, "violet", 9, prog(f, k.pepsin, 14)],
        ] as const
      ).map(([x, pal, variant, p], i) =>
        p > 0 ? (
          <g key={i} opacity={p * labelsOut}>
            <Enzyme x={x} y={gy(1) - 62} scale={0.15} palette={pal} variant={variant} lod="low" seed={60 + i} temperature={37} />
          </g>
        ) : null,
      )}
      <Keyword x={phX(7)} y={ZONE_Y} text="mouth" size={46} weight={600} color={C.tealLight} progress={prog(f, k.mouth, 14)} />
      <Keyword x={phX(2)} y={ZONE_Y} text="stomach" size={46} weight={600} color={C.coral} progress={prog(f, k.stomach, 14)} />
      <Keyword x={W / 2} y={160} text="different enzymes, different places" size={64} progress={prog(f, k.tuned, 18)} />

      {/* part 1 labels (follow the camera) */}
      <Label anchor={denLabelAnchor} at={[denLabelAnchor[0] - 140, denLabelAnchor[1] - 170]} text="denatured" align="end" color={C.coral} size={52} progress={prog(f, k.denatured, 22)} opacity={1 - prog(f, k.phOptimum, 14)} />
      <Label
        anchor={S([ex - 40 + ej.dx, EY - 110 + ej.dy])}
        at={[S([ex - 40, EY - 110])[0] - 120, S([ex - 40, EY - 110])[1] - 150]}
        text="weak bonds"
        align="end"
        color={C.amberLight}
        progress={prog(f, k.bonds + 8, 22)}
        opacity={1 - prog(f, k.far - 8, 12)}
      />
    </Stage>
  );
};
