/**
 * S12 · Needs — using the starch test to show what photosynthesis needs (section 6).
 *
 * 1. Three things a plant might need (chlorophyll, light, carbon dioxide), each with a "?".
 * 2. Controls: a test row and a control row with identical conditions ("=" between them), except one
 *    factor (light crossed out in the test: "≠"); the results differ ("≠") and an arrow shows the
 *    factor caused the result.
 * 3. Three columns, built one after another, each: setup → after the test (on a white tile) → "✓ needed":
 *    1 chlorophyll: a variegated leaf; only the green parts turn blue-black, the white parts stay
 *      orange-brown.
 *    2 light: black paper over part of a leaf, light on the rest; only the uncovered part turns
 *      blue-black ("uncovered part = the control").
 *    3 carbon dioxide: a sealed flask with soda lime (CO2 molecules vanish into it) beside an identical
 *      control flask; only the control leaf turns blue-black.
 *    Earlier columns step back while the next is built, then all three conclusions light up together.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { SectionTag } from "../../../components/SectionTag";
import { SunIcon } from "../../../components/Light";
import { Thermometer } from "../../../components/Thermometer";
import { leafGeometry } from "../../../components/bio";
import { ConicalFlask, SodaLime, Tile } from "../../../components/lab/Lab";
import { CarbonDioxide, HandArrow, HandCross, HandTick, mix, textWidth } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s12Timing } from "./S12Needs.timing";
import { CapLabel, PhotonRain, StainLeaf, StepChip, stepChipWidth } from "./parts/S11-lab";
import { EqualSign } from "./parts/S12-needs";

const lin = (v: number) => v;

// ------------------------------------------------------------------ layout
// part 1: what might a plant need?
const ASK = { y: 530, x: [620, 960, 1300] as const };
const ASK_LEAF = leafGeometry({ cx: ASK.x[0], cy: ASK.y + 10, len: 210, wid: 110, ang: -24, stalk: 0.22 });

// part 2: test vs control
const CARD_Y = 270;
const ROW_Y = [470, 710] as const;
const ROW_TITLE_X = 330;
const ICON_X = [500, 700, 900] as const;
const RES = { x: 1340, w: 300, h: 170 };
const ROW_LEAF = (y: number) => leafGeometry({ cx: RES.x, cy: y, len: 200, wid: 100, ang: -12, stalk: 0.2, veinPairs: 4 });
const MID_Y = (ROW_Y[0] + ROW_Y[1]) / 2;

// part 3: three columns
const COL_X = [390, 960, 1530] as const;
const HEAD_Y = 214;
const STAGE_Y = 520;
const TILE = { w: 460, h: 290 };
const FOOT_Y = 904;
const ABOVE_Y = 350;
const BELOW_Y = 760;
const COL_LEAF = (x: number) => leafGeometry({ cx: x, cy: STAGE_Y, len: 370, wid: 196, ang: -12, stalk: 0.2 });
const LEAF1 = COL_LEAF(COL_X[0]);
const LEAF2 = COL_LEAF(COL_X[1]);
const BAND = { u0: 0.4, u1: 0.63 };
// column 3: two flasks above a tile
const FLASK = { x: [1400, 1660] as const, y: 560, w: 230, h: 240 };
const FLASK_LEAF = (x: number) => leafGeometry({ cx: x, cy: 455, len: 120, wid: 62, ang: 92, stalk: 0.9, stalkBend: 0.08, veinPairs: 3 });
const TILE3 = { x: COL_X[2], y: 752, w: 500, h: 124 };
const TILE3_LEAF = (x: number) => leafGeometry({ cx: x, cy: TILE3.y, len: 168, wid: 82, ang: -8, stalk: 0.18, veinPairs: 4 });
const CO2_IN: readonly Pt[] = [
  [-62, -40],
  [58, -10],
  [-48, 60],
  [52, 72],
];

const HEADS = [
  { text: "chlorophyll", color: C.leaf },
  { text: "light", color: C.sun },
  { text: "CO2", color: C.ice },
] as const;

export const S12Needs: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s12Timing(sc);

  // ================================================================ part 1: three things a plant might need
  const askIn = (i: number) => prog(f, k.what - 4 + i * 8, 18);
  const askQ = prog(f, k.needs - 2, 16);
  const askOut = 1 - prog(f, k.control - 6, 16);

  // ================================================================ part 2: test vs control
  const p2Out = 1 - prog(f, k.chlorophyllTest - 4, 16);
  const rowIn = (r: number) => prog(f, k.aControl - 6 + r * 8, 20);
  const card1 = prog(f, k.identical - 4, 18) * (1 - prog(f, k.shows - 6, 10));
  const card2 = prog(f, k.shows - 2, 16);
  const same = pulse(f, k.identical, 26);
  const eqIn = prog(f, k.identical - 2, 14);
  const sunOff = prog(f, k.except, 18);
  const crossP = prog(f, k.oneFactor - 4, 18, lin);
  const neqSun = prog(f, k.oneFactor, 14);
  const resP = prog(f, k.result - 4, 22, EASE.inOut);
  const neqRes = prog(f, k.result + 6, 14);
  const causeP = prog(f, k.caused - 4, 26, lin);

  // ================================================================ part 3: the three columns
  const head = (i: number, at: number) => prog(f, at - 4, 18);
  const dimCol = (from: number) => prog(f, from - 6, 16) * (1 - prog(f, k.needed3 + 12, 22));
  const colOp = [1 - 0.62 * dimCol(k.cover), 1 - 0.62 * dimCol(k.flask), 1];
  const foot = [prog(f, k.needed1 - 4, 18), prog(f, k.needed2 - 4, 18), prog(f, k.needed3 - 4, 18)];

  // ---- column 1: variegated leaf
  const c1In = prog(f, k.take - 4, 22);
  const t1 = Math.max(k.test1, k.hours1 + 10); // "then test a leaf"
  const tile1 = prog(f, t1 - 6, 16);
  const pale1 = prog(f, t1, 18, EASE.inOut);
  const iod1 = prog(f, t1 + 16, 16, EASE.inOut);
  const res1 = prog(f, k.blueBlack1 - 8, 22, EASE.inOut);

  // ---- column 2: black paper
  const c2In = prog(f, k.coverW - 4, 22);
  const paper = prog(f, k.black - 4, 22) * (1 - prog(f, k.test2 - 6, 16));
  const t2 = k.test2;
  const tile2 = prog(f, t2 - 4, 16);
  const pale2 = prog(f, t2 + 4, 16, EASE.inOut);
  const iod2 = prog(f, t2 + 18, 14, EASE.inOut);
  const res2 = prog(f, k.blueBlack2 - 8, 22, EASE.inOut);

  // ---- column 3: soda lime
  const flaskA = prog(f, k.seal - 4, 22);
  const lime = prog(f, k.sodaLime - 4, 18);
  const flaskB = prog(f, k.theControl - 6, 22);
  const tile3 = prog(f, k.only3 - 10, 16);
  const iod3 = prog(f, k.only3 - 2, 16);
  const res3 = prog(f, k.blueBlack3 - 8, 22, EASE.inOut);
  const flaskLeafDim = 1 - 0.45 * prog(f, k.only3 - 6, 16);
  const labels3Out = 1 - prog(f, k.needed3 - 12, 14);

  // the CO2 molecules in each flask: in A they are absorbed by the soda lime
  const co2 = (fi: number) =>
    CO2_IN.map(([dx, dy], i) => {
      const x0 = FLASK.x[fi] + dx;
      const y0 = 455 + dy;
      const appear = prog(f, (fi === 0 ? k.seal : k.theControl) + i * 4, 16);
      if (fi === 1) return { x: x0, y: y0, op: appear, s: 1, i };
      const q = prog(f, k.absorbsW - 2 + i * 7, 30, EASE.inOut);
      const tx = FLASK.x[0] + (i - 1.5) * 18;
      const ty = FLASK.y - 18;
      const gone = Math.max(0, (q - 0.75) / 0.25);
      return { x: x0 + (tx - x0) * q, y: y0 + (ty - y0) * q, op: appear * (1 - gone), s: 1 - 0.5 * gone, i };
    });

  const chip = (i: number, at: number, opacity: number) => {
    const w = stepChipWidth(HEADS[i].text, 1);
    return <StepChip x={COL_X[i] - w / 2} y={HEAD_Y} n={i + 1} text={HEADS[i].text} color={HEADS[i].color} expand={1} active={1} progress={head(i, at)} opacity={opacity} />;
  };
  const footer = (i: number) => {
    const p = foot[i];
    if (p <= 0) return null;
    const tw = textWidth("needed", 48, 600);
    const x0 = COL_X[i] - (64 + 16 + tw) / 2;
    return (
      <g opacity={colOp[i]}>
        <HandTick cx={x0 + 32} cy={FOOT_Y - 18} size={64} progress={prog(f, (i === 0 ? k.needed1 : i === 1 ? k.needed2 : k.needed3) - 6, 16, lin)} color={C.leafLight} width={9} seed={60 + i} />
        <text x={x0 + 80} y={FOOT_Y + (1 - EASE.out(p)) * 10} fontFamily={FONT} fontWeight={600} fontSize={48} fill={C.paper} opacity={p} letterSpacing={-0.5}>
          needed
        </text>
      </g>
    );
  };

  return (
    <Stage bg={{ tone: "ink", lightX: 0.5, lightY: 0.42 }}>
      {/* ============ part 1: what might photosynthesis need? ============ */}
      {askOut > 0 && f < k.control + 20 ? (
        <g opacity={askOut} transform={`translate(0 ${(1 - askOut) * -20})`}>
          <StainLeaf geo={ASK_LEAF} tone="green" progress={askIn(0)} />
          <SunIcon x={ASK.x[1]} y={ASK.y} r={58} progress={askIn(1)} glow={0.6} />
          <CarbonDioxide x={ASK.x[2]} y={ASK.y} scale={0.9} progress={askIn(2)} seed={21} />
          {ASK.x.map((x, i) => (
            <text key={i} x={x + 120} y={ASK.y - 40 + (1 - askQ) * 12} fontFamily={FONT} fontWeight={700} fontSize={72} fill={C.paper} opacity={askQ * Math.min(1, askIn(i) * 2)}>
              ?
            </text>
          ))}
        </g>
      ) : null}

      {/* ============ part 2: test and control ============ */}
      {p2Out > 0 && f >= k.control - 10 ? (
        <g opacity={p2Out}>
          {/* the definition (then: what a control shows) */}
          {card1 > 0 ? (
            <text x={960} y={CARD_Y + (1 - EASE.out(card1)) * 12} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={56} fill={C.paper} opacity={card1} letterSpacing={-0.5}>
              <tspan>identical </tspan>
              <tspan opacity={prog(f, k.except - 4, 14)}>except </tspan>
              <tspan fill={C.coral} opacity={prog(f, k.oneFactor - 6, 14)}>
                one factor
              </tspan>
            </text>
          ) : null}
          {card2 > 0 ? (
            <text x={960} y={CARD_Y + (1 - EASE.out(card2)) * 12} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={56} fill={C.paper} opacity={card2} letterSpacing={-0.5}>
              <tspan fill={C.coral}>factor </tspan>
              <tspan>caused the result</tspan>
            </text>
          ) : null}

          {ROW_Y.map((y, r) => {
            const p = rowIn(r);
            if (p <= 0) return null;
            const isTest = r === 0;
            const lift = (1 - EASE.out(p)) * 16;
            const glow = 1 + 0.08 * same;
            const resultTone = isTest ? "orange" : "blueBlack";
            return (
              <g key={r} opacity={Math.min(1, p * 1.4)} transform={`translate(0 ${lift})`}>
                <text x={ROW_TITLE_X} y={y + 18} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={52} fill={C.paper} letterSpacing={-0.5}>
                  {isTest ? "test" : "control"}
                </text>
                <g opacity={isTest ? 1 - 0.65 * sunOff : 1} transform={`translate(${ICON_X[0]} ${y}) scale(${glow}) translate(${-ICON_X[0]} ${-y})`}>
                  <SunIcon x={ICON_X[0]} y={y} r={36} glow={0.5} />
                </g>
                <CarbonDioxide x={ICON_X[1]} y={y} scale={0.56 * glow} seed={30 + r} />
                <Thermometer x={ICON_X[2]} y={y - 78} height={80} temperature={24} min={0} max={40} ticks={[]} showValue={false} />
                {/* → after a few hours, test a leaf */}
                <path d={`M${1010},${y} L${1150},${y} M${1132},${y - 14} L${1150},${y} L${1132},${y + 14}`} fill="none" stroke={C.ink300} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                <Tile x={RES.x} y={y} w={RES.w} h={RES.h} />
                <StainLeaf geo={ROW_LEAF(y)} tone="decolourised" shadow={0.3} layers={[{ tone: resultTone, p: resP }]} />
                {isTest ? <HandCross cx={ICON_X[0]} cy={y} size={104} progress={crossP} seed={13} /> : null}
              </g>
            );
          })}
          {/* identical conditions… except one */}
          {ICON_X.map((x, i) => (
            <EqualSign key={i} x={x} y={MID_Y} progress={eqIn} neq={i === 0 ? neqSun : 0} />
          ))}
          <EqualSign x={RES.x} y={MID_Y} progress={eqIn} neq={neqRes} />
          {causeP > 0 ? <HandArrow from={[ICON_X[0] + 30, ROW_Y[0] - 62]} to={[RES.x - 40, ROW_Y[0] - RES.h / 2 - 14]} bend={-0.12} progress={causeP} color={C.coral} width={7} seed={17} /> : null}
        </g>
      ) : null}

      {/* ============ part 3: three experiments ============ */}
      {/* ---- column 1: chlorophyll ---- */}
      {f >= k.chlorophyllTest - 6 ? (
        <g opacity={colOp[0]}>
          {chip(0, k.chlorophyllW, 1)}
          <Tile x={COL_X[0]} y={STAGE_Y} w={TILE.w} h={TILE.h} progress={tile1} />
          <StainLeaf
            geo={LEAF1}
            tone="green"
            margin={{ tone: "white", depth: 0.42 }}
            progress={c1In}
            sunlit={0.6 * prog(f, k.light1, 20) * (1 - prog(f, t1 - 4, 14))}
            layers={[
              { tone: "decolourised", p: pale1 },
              { tone: "orange", p: iod1 },
              { tone: "blueBlack", margin: { tone: "orange", depth: 0.42 }, p: res1 },
            ]}
          />
          <PhotonRain f={f} start={k.light1 - 6} stop={t1 - 10} every={7} travel={16} dist={240} targets={[LEAF1.P(-90, -20), LEAF1.P(40, 30), LEAF1.P(120, -40), LEAF1.P(-20, 60), LEAF1.P(-150, 40)]} />
          <CapLabel anchor={LEAF1.P(-60, -40)} x={COL_X[0]} y={ABOVE_Y} text="variegated leaf" progress={prog(f, k.variegated - 4, 22)} opacity={1 - prog(f, t1 - 6, 12)} />
          <CapLabel anchor={LEAF1.P(30, 82)} x={COL_X[0]} y={BELOW_Y} text="white: no chlorophyll" progress={prog(f, k.white, 22)} opacity={1 - prog(f, t1 - 6, 12)} />
          <CapLabel anchor={LEAF1.P(-30, -10)} x={COL_X[0]} y={ABOVE_Y} text="blue-black" progress={prog(f, k.blueBlack1 + 2, 22)} opacity={1 - prog(f, k.needed1 - 10, 12)} />
          <CapLabel
            anchor={LEAF1.P(90, 80)}
            x={COL_X[0]}
            y={BELOW_Y}
            text="orange-brown"
            textColor={mix(C.iodine, C.amberLight, 0.45)}
            progress={prog(f, k.orangeBrown - 2, 22)}
            opacity={1 - prog(f, k.needed1 - 10, 12)}
          />
        </g>
      ) : null}
      {footer(0)}

      {/* ---- column 2: light ---- */}
      {f >= k.cover - 6 ? (
        <g opacity={colOp[1]}>
          {chip(1, k.cover, 1)}
          <Tile x={COL_X[1]} y={STAGE_Y} w={TILE.w} h={TILE.h} progress={tile2} />
          <StainLeaf
            geo={LEAF2}
            tone="green"
            progress={c2In}
            cover={{ u0: BAND.u0, u1: BAND.u1, p: paper }}
            sunlit={0.6 * prog(f, k.light3, 20) * (1 - prog(f, t2 - 4, 14))}
            layers={[
              { tone: "decolourised", p: pale2 },
              { tone: "orange", p: iod2 },
              { tone: "blueBlack", band: { u0: BAND.u0, u1: BAND.u1, tone: "orange" }, p: res2 },
            ]}
          />
          <PhotonRain
            f={f}
            start={k.light3 - 6}
            stop={t2 - 10}
            every={7}
            travel={16}
            dist={240}
            targets={[LEAF2.P(-120, -10), LEAF2.P(30, -50), LEAF2.P(130, 10), LEAF2.P(-60, 50), LEAF2.P(40, 40), LEAF2.P(-160, 30)]}
          />
          <CapLabel anchor={LEAF2.P(30, -60)} x={COL_X[1]} y={ABOVE_Y} text="black paper" progress={prog(f, k.black, 22)} opacity={1 - prog(f, t2 - 6, 12)} />
          <CapLabel
            anchor={LEAF2.P(-110, 30)}
            x={COL_X[1]}
            y={BELOW_Y}
            text="uncovered part"
            sub="= the control"
            subProgress={prog(f, k.isControl - 4, 16)}
            progress={prog(f, k.uncoveredW - 4, 22)}
            opacity={1 - prog(f, k.needed2 - 8, 12)}
          />
        </g>
      ) : null}
      {footer(1)}

      {/* ---- column 3: carbon dioxide ---- */}
      {f >= k.flask - 6 ? (
        <g opacity={colOp[2]}>
          {chip(2, k.flask, 1)}
          {[0, 1].map((fi) => {
            const p = fi === 0 ? flaskA : flaskB;
            if (p <= 0) return null;
            return (
              <g key={fi} transform={`translate(0 ${(1 - EASE.out(p)) * 18})`}>
                <ConicalFlask x={FLASK.x[fi]} y={FLASK.y} w={FLASK.w} h={FLASK.h} progress={p}>
                  <g opacity={flaskLeafDim}>
                    <StainLeaf geo={FLASK_LEAF(FLASK.x[fi])} tone="green" shadow={0.25} sunlit={0.6 * prog(f, k.hours3 - 10, 20) * (1 - prog(f, k.only3, 14))} />
                  </g>
                  {fi === 0 ? <SodaLime x={FLASK.x[0]} y={FLASK.y - 4} w={124} progress={lime} /> : null}
                  {co2(fi).map((m) =>
                    m.op > 0 ? <CarbonDioxide key={m.i} x={m.x} y={m.y} scale={0.4 * m.s} progress={1} opacity={m.op} seed={70 + fi * 10 + m.i} /> : null,
                  )}
                </ConicalFlask>
              </g>
            );
          })}
          <PhotonRain f={f} start={k.hours3 - 14} stop={k.only3 - 4} every={7} travel={16} dist={240} targets={[[FLASK.x[0] - 10, 440], [FLASK.x[1] + 10, 470], [FLASK.x[0] + 14, 480], [FLASK.x[1] - 14, 430]]} />
          <CapLabel
            anchor={[FLASK.x[0], FLASK.y - 14]}
            x={FLASK.x[0]}
            y={606}
            text="soda lime"
            sub="absorbs CO2"
            subChem
            subProgress={prog(f, k.absorbsW - 2, 16)}
            progress={prog(f, k.sodaLime, 22)}
            opacity={labels3Out}
          />
          <CapLabel anchor={[FLASK.x[1], FLASK.y - 30]} x={FLASK.x[1]} y={606} text="control" progress={prog(f, k.theControl, 22)} opacity={labels3Out} />
          <Tile x={TILE3.x} y={TILE3.y} w={TILE3.w} h={TILE3.h} progress={tile3} />
          {[0, 1].map((fi) => (
            <StainLeaf
              key={fi}
              geo={TILE3_LEAF(FLASK.x[fi] + (fi === 0 ? 10 : -10))}
              tone="decolourised"
              progress={tile3}
              shadow={0.3}
              layers={[{ tone: "orange", p: iod3 }, ...(fi === 1 ? [{ tone: "blueBlack" as const, p: res3 }] : [])]}
            />
          ))}
        </g>
      ) : null}
      {footer(2)}

      <SectionTag n={6} title="What photosynthesis needs" t={f} />
    </Stage>
  );
};
