/**
 * S04 · Equation — the word equation, the conditions on the arrow, and where the raw materials
 * come from (and where the oxygen goes).
 *
 * 1. The equation builds term by term as it is read, each molecule above its word.
 * 2. "light" over / "chlorophyll" under the arrow; bracket: conditions, not reactants.
 * 3. The equation moves to the top (it becomes the key); a plant in the soil takes the stage:
 *    CO2 diffuses into a leaf from the air; water enters the roots and rises up the stem in the
 *    xylem to the same leaf; O2 leaves it — one curls back in (respiration), the rest drift out.
 *    The term being explained is underlined in the equation; the others step back.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { Equation } from "../../../components/Equation";
import { Glucose } from "../../../components/SugarChain";
import { Photon, SunIcon } from "../../../components/Light";
import { Plant, Roots, SoilBlock } from "../../../components/bio";
import { CarbonDioxide, HandBracket, Oxygen, Water, mix } from "../../../components/kit";
import { Pt, smoothOpenPath } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s04Timing } from "./S04Equation.timing";
import { plantLeaf, plantStem } from "./parts/S03-props";
import {
  ChloroplastIcon,
  HideArrowDot,
  TERM_KEYS,
  TermKey,
  WORD_EQ_MID,
  WORD_EQ_TOP,
  alongPolyline,
  lerpLayout,
  rootGeometry,
  sampleSmooth,
  termBoxes,
  wordEqTerms,
} from "./parts/S04-equation";

// ------------------------------------------------------------------ layout (second half)
const SOIL = { x: 380, y: 748, w: 1160, h: 206 } as const;
const PLANT = { x: 960, y: 748, height: 380, leaves: 6, leafScale: 1.3 } as const;
const ROOTS = { x: 960, y: 752, depth: 90, spread: 330, seed: 5 } as const;
const LEAF_I = 2; // the leaf we follow: CO2 and water go in, oxygen comes out
const WATER_ROOTS = [2, 3, 4, 5]; // side roots the water molecules enter

export const S04Equation: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s04Timing(sc);
  const gid = useSvgId("s04");

  // ---------------------------------------------------------------- the equation (centre → top)
  const mv = prog(f, k.inputs - 4, 36, EASE.inOut);
  const L = lerpLayout(WORD_EQ_MID, WORD_EQ_TOP, mv);
  const arrive = (at: number) => prog(f, at - 4, 16);
  const p: Record<TermKey, number> = {
    co2: arrive(k.co2),
    plus1: arrive(k.plus1),
    water: arrive(k.water),
    arrow: prog(f, k.arrow - 2, 18, (v) => v),
    glucose: arrive(k.glucose),
    plus2: arrive(k.plus2),
    oxygen: arrive(k.oxygen),
  };
  // part 1: while the conditions are explained, the reactants and products step back
  const condFocus = window01(f, k.conditions - 4, k.inputs + 6, 14);
  // part 2: the term being explained is underlined; the rest step back
  const endCalm = k.end - 40;
  const emph: Partial<Record<TermKey, number>> = {
    co2: Math.max(window01(f, k.raw - 4, k.co2From - 2, 10), window01(f, k.co2From - 4, k.waterFrom - 6, 10)),
    water: Math.max(window01(f, k.raw - 4, k.co2From - 2, 10), window01(f, k.waterFrom - 4, k.oxygenOut - 6, 10)),
    oxygen: window01(f, k.oxygenOut - 4, endCalm, 14),
    arrow: pulse(f, k.onArrow - 4, 26),
  };
  const part2 = prog(f, k.raw - 6, 12) * (1 - prog(f, endCalm - 14, 14));
  const dim: Partial<Record<TermKey, number>> = {};
  TERM_KEYS.forEach((key) => {
    const e = key === "plus1" || key === "plus2" ? 0 : emph[key] ?? 0;
    dim[key] = Math.max(condFocus * 0.85, part2 * (1 - e) * 0.9);
  });
  const lightP = prog(f, k.light - 4, 14) * (1 - 0.6 * part2);
  const chlP = prog(f, k.chlorophyll - 4, 14) * (1 - 0.6 * part2);
  const terms = wordEqTerms({ p, light: lightP, chlorophyll: chlP, emphasis: emph, dim, arrowLength: L.arrow });
  const box = termBoxes(terms, L.x, L.size, L.gap);
  const arrowBox = box[3];

  // ---------------------------------------------------------------- part 1: molecules above their words
  const molOut = 1 - prog(f, k.inputs - 6, 14);
  const molOp = molOut * (1 - 0.4 * condFocus);
  const molY = L.y - 150;
  // ---------------------------------------------------------------- conditions
  const condOut = 1 - prog(f, k.inputs - 6, 14);
  const sunP = prog(f, k.light - 4, 18);
  const chlIconP = prog(f, k.chlorophyll - 4, 18);
  const sunGlow = 0.45 + 0.5 * pulse(f, k.substance - 2, 34);
  const chlGlow = pulse(f, k.usedUp - 2, 40);
  const bracketP = prog(f, k.condWord - 6, 18, (v) => v);
  const condTextP = prog(f, k.condWord - 2, 14);
  const notTextP = prog(f, k.notWord - 2, 14);
  const brY = L.y + 165;
  // "Light isn't a substance": light arrives as energy, not as a molecule
  const lightPhotons = [0, 1, 2].map((i) => ({ start: k.substance + 2 + i * 9, dx: (i - 1) * 46 }));

  // ---------------------------------------------------------------- part 2: the plant
  const soilP = prog(f, k.inputs + 6, 22);
  const plantP = prog(f, k.inputs + 12, 30);
  const rootsP = prog(f, k.inputs + 18, 44, (v) => v);
  const leaf = plantLeaf(PLANT.x, PLANT.y, PLANT.height, PLANT.leaves, PLANT.leafScale, LEAF_I);
  const leafAt = (u: number, v: number): Pt => leaf.P(u * leaf.len, v * leaf.wid);

  // CO2 diffuses in from the air (net movement into the leaf, with a random wander on the way)
  const CO2S = [
    { from: [180, 430] as Pt, to: leafAt(-0.12, -0.12), d: 0 },
    { from: [250, 640] as Pt, to: leafAt(0.18, 0.1), d: 10 },
    { from: [330, 360] as Pt, to: leafAt(0.02, -0.05), d: 20 },
    { from: [140, 560] as Pt, to: leafAt(0.3, -0.02), d: 30 },
  ];
  const co2Dur = Math.min(96, Math.max(50, k.waterFrom - k.co2From - 22));

  // water: soil → root tip (absorbed) → along the root → up the stem (xylem) → into the leaf
  const roots = rootGeometry(ROOTS.x, ROOTS.y, ROOTS.depth, ROOTS.spread, ROOTS.seed);
  const stemPts = plantStem(PLANT.x, PLANT.y, PLANT.height);
  const stemSmooth = sampleSmooth(stemPts, 20);
  const nodeY = leaf.petiole[leaf.petiole.length - 1][1];
  const stemToNode = stemSmooth.filter((q) => q[1] >= nodeY);
  const intoLeaf: Pt[] = [...[...leaf.petiole].reverse(), leafAt(-0.1, 0), leafAt(0.08, 0.02)];
  const waters = WATER_ROOTS.map((ri, i) => {
    const r = roots[ri];
    const tip = r.pts[r.pts.length - 1];
    const start: Pt = [tip[0] + r.side * 58, tip[1] + 22 - (i % 2) * 16];
    const route: Pt[] = [...[...r.pts].reverse(), [ROOTS.x, ROOTS.y], ...stemToNode, ...intoLeaf];
    return { start, tip, route, i };
  });
  const toTip = Math.min(48, Math.max(20, k.roots - k.absorbed + 6));
  const climb = Math.max(60, k.toLeaf - k.travels + 10);
  const xylemP = prog(f, k.travels + 10, Math.max(30, climb - 30), (v) => v);
  const xylemVis = 1 - prog(f, k.oxygenOut + 40, 30);

  // oxygen: out of the leaf; one curls back in (respiration); the rest drift out into the air
  const O2S = [
    { at: leafAt(0.05, -0.18), out: [-70, -30] as Pt, d: 0 },
    { at: leafAt(-0.2, -0.1), out: [-60, -60] as Pt, d: 10 },
    { at: leafAt(0.28, -0.1), out: [-40, -80] as Pt, d: 20 },
  ];
  const backTo = leafAt(-0.25, 0.08);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.36 }}>
      <defs>
        <filter id={`${gid}-blur`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>

      {/* ============ part 2 stage: soil, roots, plant ============ */}
      {soilP > 0 ? (
        <g opacity={Math.min(1, soilP * 1.3)}>
          <SoilBlock x={SOIL.x} y={SOIL.y} w={SOIL.w} h={SOIL.h} seed={4} />
          <Roots x={ROOTS.x} y={ROOTS.y} depth={ROOTS.depth} spread={ROOTS.spread} progress={rootsP} seed={ROOTS.seed} />
        </g>
      ) : null}
      {plantP > 0 ? (
        <g opacity={Math.min(1, plantP * 1.4)} transform={`translate(0 ${(1 - EASE.out(plantP)) * 26})`}>
          <Plant x={PLANT.x} y={PLANT.y} height={PLANT.height} leaves={PLANT.leaves} leafScale={PLANT.leafScale} />
          {/* xylem: water rises up the stem */}
          {xylemP > 0 && xylemVis > 0 ? (
            <g opacity={xylemVis}>
              <path d={smoothOpenPath(stemPts)} fill="none" stroke={C.ice} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - xylemP} opacity={0.45} filter={`url(#${gid}-blur)`} />
              <path d={smoothOpenPath(stemPts)} fill="none" stroke={mix(C.ice, C.paper, 0.2)} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - xylemP} />
            </g>
          ) : null}
        </g>
      ) : null}

      {/* CO2 from the air into the leaf */}
      {f >= k.co2From - 4 && f < k.waterFrom + 40
        ? CO2S.map((m, i) => {
            const start = k.co2From - 4 + m.d;
            const q = prog(f, start, co2Dur, EASE.inOut);
            if (f < start) return null;
            const env = Math.sin(Math.PI * q);
            const x = m.from[0] + (m.to[0] - m.from[0]) * q + noise2D(`c4x${i}`, f * 0.025, 0) * 34 * env;
            const y = m.from[1] + (m.to[1] - m.from[1]) * q + noise2D(`c4y${i}`, f * 0.025, 3) * 34 * env;
            const enter = Math.max(0, (q - 0.8) / 0.2);
            return (
              <CarbonDioxide
                key={i}
                x={x}
                y={y}
                scale={0.5 * (1 - 0.55 * enter)}
                rotate={-30 + i * 25 + noise2D(`c4r${i}`, f * 0.02, 1) * 20}
                progress={prog(f, start, 12)}
                opacity={1 - enter}
                seed={40 + i}
              />
            );
          })
        : null}

      {/* water: into the roots, then up the xylem as small blue drops */}
      {f >= k.waterFrom - 4 && f < k.oxygenOut + 30
        ? waters.map((w) => {
            const appear = prog(f, k.waterFrom - 4 + w.i * 5, 14);
            const toT = prog(f, k.absorbed - 2 + w.i * 4, toTip, EASE.inOut);
            const climbStart = k.travels - 6 + w.i * 9;
            const c = prog(f, climbStart, climb, EASE.inOut);
            const asDot = prog(f, k.absorbed - 2 + w.i * 4 + toTip - 8, 10);
            const pos: Pt = c > 0 ? alongPolyline(w.route, c) : [w.start[0] + (w.tip[0] - w.start[0]) * toT, w.start[1] + (w.tip[1] - w.start[1]) * toT];
            const fadeEnd = 1 - prog(f, climbStart + climb - 6, 10);
            return (
              <g key={w.i}>
                {asDot < 1 ? <Water x={pos[0]} y={pos[1]} scale={0.36 * (1 - 0.5 * asDot)} progress={appear} opacity={1 - asDot} temperature={20} seed={50 + w.i} /> : null}
                {asDot > 0 && fadeEnd > 0 ? (
                  <g opacity={asDot * fadeEnd}>
                    <circle cx={pos[0]} cy={pos[1]} r={15} fill={C.ice} opacity={0.45} filter={`url(#${gid}-blur)`} />
                    <circle cx={pos[0]} cy={pos[1]} r={8} fill={mix(C.ice, C.paper, 0.35)} />
                  </g>
                ) : null}
              </g>
            );
          })
        : null}

      {/* oxygen out of the leaf */}
      {f >= k.oxygenOut - 4
        ? O2S.map((o, i) => {
            const start = k.oxygenOut - 4 + o.d;
            const appear = prog(f, start, 16);
            if (appear <= 0) return null;
            const outP = prog(f, start, Math.max(30, k.some - start), EASE.out);
            let pos: Pt = [o.at[0] + o.out[0] * outP, o.at[1] + o.out[1] * outP];
            let opacity = 1;
            let scale = 0.46;
            if (i === 0) {
              // respiration: curls round and goes back into the leaf
              const b = prog(f, k.some + 4, Math.max(30, k.respiration - k.some + 8), EASE.inOut);
              const from = pos;
              const ctrl: Pt = [from[0] - 120, from[1] + 110];
              const v = 1 - b;
              pos = [v * v * from[0] + 2 * v * b * ctrl[0] + b * b * backTo[0], v * v * from[1] + 2 * v * b * ctrl[1] + b * b * backTo[1]];
              const inP = Math.max(0, (b - 0.75) / 0.25);
              scale = 0.46 * (1 - 0.5 * inP);
              opacity = 1 - inP;
            } else {
              const r = prog(f, k.release + (i - 1) * 8, 100, EASE.inOut);
              const to: Pt = i === 1 ? [220, 470] : [330, 380];
              const base = pos;
              pos = [base[0] + (to[0] - base[0]) * r + noise2D(`o4x${i}`, f * 0.025, 0) * 20 * r, base[1] + (to[1] - base[1]) * r + noise2D(`o4y${i}`, f * 0.025, 2) * 20 * r];
              opacity = 1 - prog(f, k.release + (i - 1) * 8 + 70, 30);
            }
            return <Oxygen key={i} x={pos[0]} y={pos[1]} scale={scale} rotate={-20 + i * 30} progress={appear} opacity={opacity} seed={60 + i} />;
          })
        : null}

      {/* ============ the equation ============ */}
      {/* "Now the word equation": four empty places, filled as each word is read */}
      {([0, 2, 4, 6] as const).map((i, n) => {
        const key = TERM_KEYS[i];
        const sp = prog(f, k.eqWord - 6 + n * 4, 14) * (1 - p[key]);
        if (sp <= 0) return null;
        const b = box[i];
        return (
          <rect
            key={`slot${i}`}
            x={b.left - 14}
            y={L.y - L.size * 0.86}
            width={b.w + 28}
            height={L.size * 1.22}
            rx={18}
            fill={[C.ice, C.ice, C.ice, C.ice, C.amber, C.amber, C.coral][i]}
            fillOpacity={0.04}
            stroke={[C.ice, C.ice, C.ice, C.ice, C.amber, C.amber, C.coral][i]}
            strokeOpacity={0.45}
            strokeWidth={3}
            strokeDasharray="12 12"
            opacity={sp}
          />
        );
      })}
      <HideArrowDot hide={p.arrow <= 0} x={arrowBox.left} y={L.y - L.size * 0.32}>
        <Equation x={L.x} y={L.y} size={L.size} gap={L.gap} terms={terms} />
      </HideArrowDot>

      {/* part 1: the molecules above their words */}
      {molOp > 0 ? (
        <g opacity={molOp}>
          <CarbonDioxide x={box[0].cx} y={molY} scale={0.78} progress={arrive(k.co2)} seed={11} />
          <Water x={box[2].cx} y={molY + 8} scale={0.92} progress={arrive(k.water)} seed={12} />
          {p.glucose > 0 ? <Glucose x={box[4].cx} y={molY} tone="sugar" glow={0.3} scale={1.4 * (0.6 + 0.4 * EASE.out(p.glucose))} opacity={Math.min(1, p.glucose * 1.5)} /> : null}
          <Oxygen x={box[6].cx} y={molY} scale={0.86} progress={arrive(k.oxygen)} seed={13} />
        </g>
      ) : null}

      {/* part 1: conditions on the arrow */}
      {condOut > 0 ? (
        <g opacity={condOut}>
          <SunIcon x={arrowBox.cx} y={molY} r={32} progress={sunP} glow={sunGlow} />
          {lightPhotons.map((ph, i) => (
            <Photon key={i} from={[arrowBox.cx + ph.dx * 0.4, molY + 40]} to={[arrowBox.cx + ph.dx, L.y - L.size * 0.32 - 8]} p={(f - ph.start) / 16} size={0.6} />
          ))}
          <ChloroplastIcon x={arrowBox.cx} y={L.y + 112} progress={chlIconP} glow={chlGlow} />
          <HandBracket from={[arrowBox.left - 8, brY]} to={[arrowBox.right + 8, brY]} side={-1} depth={32} progress={bracketP} color={C.paper} seed={41} />
          {condTextP > 0 ? (
            <text x={arrowBox.cx} y={brY + 88 + (1 - EASE.out(condTextP)) * 12} textAnchor="middle" fontFamily={FONT} fontSize={52} letterSpacing={-0.5}>
              <tspan fontWeight={700} fill={C.paper} opacity={condTextP}>
                conditions,
              </tspan>
              <tspan fontWeight={600} fill={C.ink300} opacity={notTextP}>
                {" "}
                not reactants
              </tspan>
            </text>
          ) : null}
        </g>
      ) : null}

      {/* part 2 labels */}
      {(() => {
        const r = roots[3];
        const a = alongPolyline(r.pts, 0.55);
        return (
          <Label anchor={a} at={[a[0] + 190, a[1] + 54]} text="roots" color={C.cream} progress={prog(f, k.roots - 2, 20)} opacity={1 - prog(f, k.oxygenOut - 10, 14)} />
        );
      })()}
      {(() => {
        const a = alongPolyline(stemSmooth, 0.14);
        return <Label anchor={a} at={[a[0] + 230, a[1] - 6]} text="xylem" color={C.ice} progress={prog(f, k.xylem - 2, 20)} opacity={(1 - prog(f, k.oxygenOut + 20, 14)) * Math.min(1, plantP * 2)} />;
      })()}
      <Label anchor={backTo} at={[backTo[0] - 236, backTo[1] + 26]} text="respiration" align="end" color={C.coral} progress={prog(f, k.respiration - 2, 20)} opacity={1 - prog(f, k.release + 60, 16)} />

      <SectionTag n={1} title="What is photosynthesis?" t={200} />
    </Stage>
  );
};
