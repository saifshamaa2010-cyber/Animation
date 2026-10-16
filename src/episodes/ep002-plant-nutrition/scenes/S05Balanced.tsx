/**
 * S05 · Balanced — the balanced symbol equation, then an atom tally that proves it.
 *
 * Opens on S04's word equation (same place). On "symbol equation" a guide drops from each word to
 * where its formula will sit; each formula lands as it is read, in the word equation's colours.
 * Then the equation lifts and a tally builds below it: one row per element, the left-hand total
 * under the reactants, the right-hand total under the products, "=" under the arrow. As each number
 * is said, the atoms it counts are marked in the equation (molecules without that element step back)
 * and the number takes the colour of the molecule it came from.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { SectionTag } from "../../../components/SectionTag";
import { Equation, type EqArrow, type EqTerm } from "../../../components/Equation";
import { HandTick, textWidth } from "../../../components/kit";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s05Timing } from "./S05Balanced.timing";
import { HideArrowDot, WORD_EQ_TOP, termBoxes, wordEqTerms } from "./parts/S04-equation";
import { AtomBall, Marker, chemChars, spans } from "./parts/S05-chem";

const TITLE = "What is photosynthesis?";
const SYM = { x: 960, size: 88, gap: 32, arrow: 230, y0: 520, y1: 396 } as const;
const ROW_Y = [588, 704, 820] as const;
const HEAD_X = 176;
const TALLY_SIZE = 64;
const FORMULAS = ["6CO2", "+", "6H2O", "→", "C6H12O6", "+", "6O2"] as const;
const COLOURS = [C.ice, C.ink300, C.ice, C.paper, C.amber, C.ink300, C.coral] as const;

type Tok = { readonly t: string; readonly color: string; readonly at: number; readonly weight?: 600 | 700 };

export const S05Balanced: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s05Timing(sc);

  // ---------------------------------------------------------------- the word equation (from S04)
  const wordDim = prog(f, k.balanced - 6, 16) * 0.75;
  const wordOut = 1 - prog(f, k.check - 2, 18);
  const wordTerms = wordEqTerms({
    p: { co2: 1, plus1: 1, water: 1, arrow: 1, glucose: 1, plus2: 1, oxygen: 1 },
    light: 1 - wordDim * 0.65,
    chlorophyll: 1 - wordDim * 0.65,
    dim: { co2: wordDim, plus1: wordDim, water: wordDim, glucose: wordDim, plus2: wordDim, oxygen: wordDim },
    arrowLength: WORD_EQ_TOP.arrow,
  });
  const wordBox = termBoxes(wordTerms, WORD_EQ_TOP.x, WORD_EQ_TOP.size, WORD_EQ_TOP.gap);

  // ---------------------------------------------------------------- the symbol equation
  const lift = prog(f, k.check - 2, 30, EASE.inOut);
  const symY = SYM.y0 + (SYM.y1 - SYM.y0) * lift;
  const arrive = [k.tCO2, k.plus1, k.tH2O, k.gives, k.tGlc, k.plus2, k.tO2].map((at) => prog(f, at - 4, 16));
  // molecules with none of the element being counted step back
  const rowC = window01(f, k.carbon - 4, k.hydrogen - 2, 10);
  const rowH = window01(f, k.hydrogen - 4, k.oxygen - 2, 10);
  const dimOf = (i: number) => 0.8 * Math.max(i === 2 || i === 6 ? rowC : 0, i === 0 || i === 6 ? rowH : 0);
  const symTerms: (EqTerm | EqArrow)[] = FORMULAS.map((t, i) =>
    t === "→" ? { arrow: true, p: prog(f, k.gives - 2, 18, (v) => v), length: SYM.arrow } : { text: t, color: COLOURS[i], p: arrive[i], dim: dimOf(i) },
  );
  const symBox = termBoxes(symTerms, SYM.x, SYM.size, SYM.gap);
  const chars = (i: number) => chemChars(FORMULAS[i], symBox[i].left, SYM.size);

  // guides: each word drops a line to where its formula will land
  const guides = [0, 2, 4, 6].map((i) => ({
    i,
    from: [wordBox[i].cx, WORD_EQ_TOP.y + 18] as const,
    to: [symBox[i].cx, SYM.y0 - SYM.size * 0.86] as const,
    p: prog(f, k.symbol - 4 + i * 2, 16, (v) => v),
    out: prog(f, [k.tCO2, 0, k.tH2O, 0, k.tGlc, 0, k.tO2][i] + 6, 12),
  }));

  // ---------------------------------------------------------------- markers (which atoms are being counted)
  const endMark = k.balances - 2;
  const marks: { term: number; idx: number[]; color: string; p: number }[] = [
    { term: 0, idx: [0, 1], color: C.ice, p: window01(f, k.cL - 4, k.hydrogen - 2, 10) },
    { term: 4, idx: [0, 1], color: C.amber, p: window01(f, k.cR - 4, k.hydrogen - 2, 10) },
    { term: 2, idx: [0, 1, 2], color: C.ice, p: window01(f, k.hL - 4, k.oxygen - 2, 10) },
    { term: 4, idx: [2, 3, 4], color: C.amber, p: window01(f, k.hR - 4, k.oxygen - 2, 10) },
    { term: 0, idx: [0, 2, 3], color: C.ice, p: window01(f, k.oL1 - 4, endMark, 12) },
    { term: 2, idx: [0, 3], color: C.ice, p: window01(f, k.oL2 - 4, endMark, 12) },
    { term: 4, idx: [5, 6], color: C.amber, p: window01(f, k.oR1 - 4, endMark, 12) },
    { term: 6, idx: [0, 1, 2], color: C.coral, p: window01(f, k.oR2 - 4, endMark, 12) },
  ];

  // ---------------------------------------------------------------- the tally
  const leftCx = (symBox[0].left + symBox[2].right) / 2;
  const rightCx = (symBox[4].left + symBox[6].right) / 2;
  const eqX = symBox[3].cx;
  const rows: { kind: "C" | "H" | "O"; at: number; left: Tok[]; right: Tok[]; eqAt: number }[] = [
    { kind: "C", at: k.carbon, left: [{ t: "6", color: C.ice, at: k.cL }], right: [{ t: "6", color: C.amber, at: k.cR }], eqAt: k.cEq },
    { kind: "H", at: k.hydrogen, left: [{ t: "12", color: C.ice, at: k.hL }], right: [{ t: "12", color: C.amber, at: k.hR }], eqAt: k.hR },
    {
      kind: "O",
      at: k.oxygen,
      left: [
        { t: "12", color: C.ice, at: k.oL1 },
        { t: "+", color: C.ink300, at: k.oL2, weight: 600 },
        { t: "6", color: C.ice, at: k.oL2 },
        { t: "=", color: C.ink300, at: k.oLsum, weight: 600 },
        { t: "18", color: C.paper, at: k.oLsum },
      ],
      right: [
        { t: "6", color: C.amber, at: k.oR1 },
        { t: "+", color: C.ink300, at: k.oR2, weight: 600 },
        { t: "12", color: C.coral, at: k.oR2 },
        { t: "=", color: C.ink300, at: k.oRsum, weight: 600 },
        { t: "18", color: C.paper, at: k.oRsum },
      ],
      eqAt: k.oEq,
    },
  ];
  const tallyIn = prog(f, k.check + 6, 20);
  const tickP = prog(f, k.balances, 22, (v) => v);

  const tokens = (toks: Tok[], cx: number, y: number) => {
    const gap = TALLY_SIZE * 0.3;
    const ws = toks.map((t) => textWidth(t.t, TALLY_SIZE, t.weight ?? 700));
    const total = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1);
    let x = cx - total / 2;
    return toks.map((t, i) => {
      const left = x;
      x += ws[i] + gap;
      const p = prog(f, t.at - 3, 12);
      if (p <= 0) return null;
      return (
        <text
          key={i}
          x={left}
          y={y + (1 - EASE.out(p)) * 12}
          fontFamily={FONT}
          fontWeight={t.weight ?? 700}
          fontSize={TALLY_SIZE}
          fill={t.color}
          opacity={Math.min(1, p * 1.4)}
        >
          {t.t}
        </text>
      );
    });
  };

  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.38 }}>
      {/* the word equation carried over from S04 */}
      <Equation x={WORD_EQ_TOP.x} y={WORD_EQ_TOP.y} size={WORD_EQ_TOP.size} gap={WORD_EQ_TOP.gap} terms={wordTerms} opacity={wordOut} />
      {guides.map((g) =>
        g.p > 0 && g.out < 1 && wordOut > 0 ? (
          <line
            key={g.i}
            x1={g.from[0]}
            y1={g.from[1]}
            x2={g.from[0] + (g.to[0] - g.from[0]) * EASE.inOut(g.p)}
            y2={g.from[1] + (g.to[1] - g.from[1]) * EASE.inOut(g.p)}
            stroke={COLOURS[g.i]}
            strokeOpacity={0.55}
            strokeWidth={3}
            strokeDasharray="4 12"
            strokeLinecap="round"
            opacity={(1 - g.out) * wordOut}
          />
        ) : null,
      )}

      {/* where each formula will land (dashed), filled as it is read */}
      {guides.map((g) => {
        const sp = prog(f, k.symbol + 6 + g.i * 2, 12) * (1 - arrive[g.i]);
        if (sp <= 0) return null;
        const b = symBox[g.i];
        return (
          <rect
            key={`slot${g.i}`}
            x={b.left - 14}
            y={SYM.y0 - SYM.size * 0.86}
            width={b.w + 28}
            height={SYM.size * 1.26}
            rx={20}
            fill={COLOURS[g.i]}
            fillOpacity={0.04}
            stroke={COLOURS[g.i]}
            strokeOpacity={0.45}
            strokeWidth={3}
            strokeDasharray="12 12"
            opacity={sp}
          />
        );
      })}
      {/* markers behind the atoms being counted */}
      {marks.map((m, i) =>
        m.p > 0 ? spans(chars(m.term), m.idx).map(([x0, x1], j) => <Marker key={`${i}-${j}`} x0={x0} x1={x1} y={symY} size={SYM.size} color={m.color} p={m.p} />) : null,
      )}
      <HideArrowDot hide={f < k.gives - 2} x={symBox[3].left} y={symY - SYM.size * 0.32}>
        <Equation x={SYM.x} y={symY} size={SYM.size} gap={SYM.gap} terms={symTerms} />
      </HideArrowDot>

      {/* the atom tally */}
      {tallyIn > 0 ? (
        <g opacity={tallyIn}>
          {rows.map((r, ri) => {
            const y = ROW_Y[ri];
            const headP = prog(f, r.at - 4, 16);
            const eqP = prog(f, r.eqAt - 3, 12);
            const cascade = pulse(f, k.balances - 6 + ri * 6, 22);
            return (
              <g key={r.kind}>
                <AtomBall kind={r.kind} x={HEAD_X} y={y - 22} p={headP} glow={window01(f, r.at - 4, (rows[ri + 1]?.at ?? k.balances) - 2, 10) * 0.8} />
                {tokens(r.left, leftCx, y)}
                {eqP > 0 ? (
                  <text
                    x={eqX}
                    y={y + (1 - EASE.out(eqP)) * 12}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={TALLY_SIZE * (1 + 0.18 * cascade)}
                    fill={cascade > 0.05 ? C.leafLight : C.paper}
                    opacity={Math.min(1, eqP * 1.4)}
                  >
                    =
                  </text>
                ) : null}
                {tokens(r.right, rightCx, y)}
              </g>
            );
          })}
          <HandTick cx={1712} cy={ROW_Y[1] - 26} size={128} progress={tickP} color={C.leafLight} width={11} seed={52} />
        </g>
      ) : null}

      <SectionTag n={1} title={TITLE} t={200} />
    </Stage>
  );
};
