/**
 * S12 · pH.
 * The pH scale draws on with our amylase already sitting above pH 7; the pin underneath shows what
 * "acidic" and "alkaline" mean, and on "can denature enzymes too" its active site is outlined. "Too far
 * either way": it rides to acid, then alkali — the active site warps at the acid end and STAYS warped
 * (denaturing isn't undone, S10/S11) as it crosses neutral, then warps further at the alkaline end. Close up
 * (the scale fades so nothing is clipped): the weak bonds holding the site in shape are disrupted. Then the
 * scale becomes the graph's x-axis: amylase peaks near pH 7 (mouth), pepsin near pH 2 (stomach).
 * "Different enzymes, tuned to different places": both names step forward, then from "tuned" a light runs
 * down each peak's guide line and its place name brightens — held on screen before the cut.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
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
  // the pin alone first: what the scale means ("acidic" → 2, "alkaline" → 12, back to neutral)
  const pin = track(f, [
    [k.acidic - 4, 7],
    [k.acidic + 14, 2, EASE.inOut],
    [k.alkaline - 2, 2],
    [k.alkaline + 20, 12, EASE.inOut],
    [k.something, 12],
    [k.something + 22, 7, EASE.inOut],
  ]);
  // then the enzyme rides it: "Too far (acid) either way (alkali)" — passing neutral on the way
  const ride = track(f, [
    [k.far - 2, 7],
    [k.far + 12, 2.6, EASE.inOut],
    [k.either + 4, 2.6],
    [k.either + 26, 11.6, EASE.inOut],
  ]);
  const riding = f >= k.far - 2;
  const pH = riding ? ride : pin;
  const LAST_PH = 11.6;
  const ex = phX(riding ? ride : 7);
  // Damage only ever accumulates (denaturing isn't undone): the acid end warps the site and it stays
  // warped as the enzyme crosses neutral; the alkaline end warps it further; then the bonds go.
  const acidDmg = riding ? smooth(1.2, 3.8, Math.max(0, 7 - Math.min(ride, f >= k.either + 4 ? 2.6 : ride))) : 0;
  const alkDmg = riding ? smooth(1.2, 3.8, Math.max(0, ride - 7)) : 0;
  const denature = Math.min(1, 0.3 * acidDmg + 0.18 * alkDmg + 0.55 * prog(f, k.disrupted, 26, EASE.inOut));
  const bondsVis = window01(f, k.bonds - 4, k.zoomBack, 12);
  const bondsBroken = 0.12 * prog(f, k.bonds + 20, 30) + 0.88 * prog(f, k.disrupted, 26);
  const ej = jit("E12", f, thermalAmplitude(37) * 0.8);
  // the enzyme is there from the start (sitting above pH 7) so the definition has its subject on screen
  const enzIn = prog(f, k.ph + 10, 20);
  const enzVis = enzIn * (1 - prog(f, k.phOptimum, 18));
  const enzDrop = (1 - EASE.out(enzIn)) * -40;
  const siteVis = window01(f, k.denature + 10, k.phOptimum + 10, 14);
  // the scale fades out before the close-up would push it off the bottom edge, and back in after
  const scaleVis = 1 - window01(f, k.zoomIn + 2, k.zoomBack + 2, 8);

  const cam = camAt(f, [
    { f: -12, x: 960, y: 540, z: 1 },
    { f: k.zoomIn, x: 960, y: 540, z: 1 },
    { f: k.zoomIn + 30, x: phX(LAST_PH) - 60, y: EY - 10, z: 1.6 },
    { f: k.zoomOut, x: phX(LAST_PH) - 60, y: EY - 10, z: 1.6 },
    { f: k.zoomBack, x: 960, y: 540, z: 1 },
  ]);
  const S = (p: readonly [number, number]) => toScreen(cam, p);
  // the surroundings take on the colour of the pH only once the enzyme itself is taken there
  const wash = riding ? Math.min(1, Math.abs(pH - 7) / 6) * enzVis : 0;

  // ---------------- part 2: optimum pH graph
  const axesP = prog(f, k.phOptimum + 6, 30, (t) => t);
  const amyTo = 3 + 8 * prog(f, k.optimum - 34, 60, EASE.inOut);
  const pepTo = 5 * prog(f, k.pepsin, 44, EASE.inOut);
  // "Different enzymes": both curves brighten once and hold (no looping pulse)
  const tuned = prog(f, k.different, 16, EASE.out);
  const curveW = 7 + 2.5 * tuned;
  // "Different enzymes": each name steps forward a little and stays (no filled highlight pills)
  const names = prog(f, k.different, 16, EASE.out);
  // "…tuned to different places": from "tuned" a light runs down each peak's guide line to its place,
  // and each place name brightens as the light reaches it — lit by ≈ 0.4 s before the cut
  const runDown = prog(f, k.tunedW, 20, EASE.inOut);
  const placeGlow = prog(f, k.tunedW + 14, 12);
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
        <g opacity={scaleVis}>

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
          markerProgress={prog(f, k.ph + 20, 14) * (1 - prog(f, k.phOptimum - 4, 14))}
          numbers="all"
        />
        {/* graph phase: the alkaline end steps back, so violet reads as "pepsin", not "alkaline" */}
        {f > k.phOptimum ? (
          <>
            <defs>
              <linearGradient id={`${gid}-alk`} gradientUnits="userSpaceOnUse" x1={phX(8)} y1="0" x2={phX(14) + BAR.h / 2} y2="0">
                <stop offset="0" stopColor={C.ink900} stopOpacity={0} />
                <stop offset="1" stopColor={C.ink900} stopOpacity={0.62} />
              </linearGradient>
            </defs>
            <rect x={phX(8)} y={BAR.y - BAR.h / 2} width={phX(14) - phX(8) + BAR.h / 2} height={BAR.h} rx={BAR.h / 2} fill={`url(#${gid}-alk)`} opacity={prog(f, k.phOptimum, 24)} />
          </>
        ) : null}
        <text x={BAR.x + BAR.w + 48} y={BAR.y + 15} fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.paperDim} opacity={prog(f, k.ph + 20, 16)}>
          pH
        </text>
        <text x={phX(2.4)} y={ZONE_Y} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.coral} opacity={prog(f, k.acidic, 14) * (1 - prog(f, k.phOptimum, 14))}>
          acidic
        </text>
        <text x={phX(11.6)} y={ZONE_Y} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.violetLight} opacity={prog(f, k.alkaline, 14) * (1 - prog(f, k.phOptimum, 14))}>
          alkaline
        </text>
        </g>

        {/* ---- the enzyme */}
        {enzVis > 0 ? (
          <g opacity={enzVis} transform={`translate(0 ${enzDrop}) ${jitTransform(ej, [ex, EY])}`}>
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
          <text x={G.x - 56} y={G.y + G.h / 2} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.ink300} transform={`rotate(-90 ${G.x - 56} ${G.y + G.h / 2})`} opacity={prog(f, k.phOptimum + 24, 14)}>
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
      {runDown > 0
        ? (
            [
              [phX(7), C.tealLight],
              [phX(2), C.coral],
            ] as const
          ).map(([x, col], i) => {
            const y0 = gy(1) + 20;
            const y1 = BAR.y - 16;
            const yy = y0 + (y1 - y0) * runDown;
            return (
              <g key={i}>
                <line x1={x} y1={y0} x2={x} y2={yy} stroke={col} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
                <circle cx={x} cy={yy} r={9} fill={col} />
              </g>
            );
          })
        : null}
      {dot(phX(7), gy(1), C.teal, prog(f, k.optimum + 18, 12), prog(f, k.optimum + 18, 22) < 1 ? prog(f, k.optimum + 18, 22) : 0)}
      {dot(phX(2), gy(PEP(2)), C.violet, pepDot, f >= k.best && f < k.best + 22 ? prog(f, k.best, 22) : 0)}

      {/* labels: the optimum, the enzymes, and where they work */}
      <Keyword x={phX(7)} y={gy(1) - 44} text="optimum" size={48} weight={600} color={C.paper} progress={prog(f, k.optimum, 14) * (1 - prog(f, k.amylase - 6, 10))} />
      {(
        [
          [phX(7) + 34, "amylase", C.tealLight, k.amylase],
          [phX(2) + 34, "pepsin", C.violetLight, k.pepsin],
        ] as const
      ).map(([x, txt, col, at]) => {
        const cy = gy(1) - 62;
        const s = 1 + 0.1 * names;
        return (
          <g key={txt} transform={`translate(${x} ${cy}) scale(${s}) translate(${-x} ${-cy})`}>
            <Keyword x={x} y={gy(1) - 44} text={txt} size={52} weight={600} color={col} progress={prog(f, at, 14)} />
          </g>
        );
      })}
      {/* each curve keeps its molecule beside its name */}
      {(
        [
          [phX(7) + 34 - textWidth("amylase", 52, 600) / 2 - 46, "teal", 0, prog(f, k.amylase, 14)],
          [phX(2) + 34 - textWidth("pepsin", 52, 600) / 2 - 46, "violet", 9, prog(f, k.pepsin, 14)],
        ] as const
      ).map(([x, pal, variant, p], i) =>
        p > 0 ? (
          <g key={i} opacity={p}>
            <Enzyme x={x} y={gy(1) - 62} scale={0.15} palette={pal} variant={variant} lod="low" seed={60 + i} temperature={37} />
          </g>
        ) : null,
      )}
      {/* the places: "stomach" steps forward on "…digests protein there"; both brighten as the light arrives */}
      {(
        [
          [phX(7), "mouth", C.tealLight, k.mouth, 0],
          [phX(2), "stomach", C.coral, k.stomach, pulse(f, k.there, 30)],
        ] as const
      ).map(([x, txt, col, at, there]) => {
        const cy = ZONE_Y - 16;
        const s = 1 + 0.12 * Math.max(placeGlow, there);
        return (
          <g key={txt} transform={`translate(${x} ${cy}) scale(${s}) translate(${-x} ${-cy})`}>
            <Keyword x={x} y={ZONE_Y} text={txt} size={46} weight={placeGlow > 0.5 ? 700 : 600} color={col} progress={prog(f, at, 14)} />
          </g>
        );
      })}

      {/* part 1 label (follows the camera): on "bonds", gone once they are disrupted */}
      <Label
        anchor={S([ex - 40 + ej.dx, EY - 110 + ej.dy + enzDrop])}
        at={[S([ex - 40, EY - 110])[0] - 120, S([ex - 40, EY - 110])[1] - 150]}
        text="weak bonds"
        align="end"
        color={C.amberLight}
        progress={prog(f, k.bonds + 2, 22)}
        opacity={1 - prog(f, k.disrupted + 12, 12)}
      />
    </Stage>
  );
};
