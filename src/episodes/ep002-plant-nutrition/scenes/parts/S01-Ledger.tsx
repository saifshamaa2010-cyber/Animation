/**
 * Van Helmont's two-row ledger (S01 hook, S18 resolve): what he weighed, and how much it changed.
 * Screen space (outside the camera), so its type stays a constant size.
 */
import React from "react";
import { C } from "../../../../brand/tokens";
import { FONT } from "../../../../brand/fonts";
import { Counter, HandCircle, HandTick, LitShape, StrikeThrough, mix, textWidth } from "../../../../components/kit";
import { roundRectPath } from "../../../../components/kit/shared";
import { WILLOW } from "../layout";

export const LEDGER = { x: WILLOW.ledgerX, y: WILLOW.ledgerY, w: WILLOW.ledgerW, rowH: 112, pad: 16 } as const;
export const LEDGER_H = LEDGER.pad * 2 + LEDGER.rowH * 2;
const NAME = 52;
const VAL = 60;
const UNIT = 40;

/** Baseline of row i's text. */
export const ledgerBaseline = (i: number) => LEDGER.y + LEDGER.pad + LEDGER.rowH * i + LEDGER.rowH * 0.64;
/** Right edge of the value column (where the unit ends). */
const VAL_RIGHT = LEDGER.x + LEDGER.w - 40;
const unitW = (u: string) => VAL * 0.22 + textWidth(u, UNIT, 500);
/** Box around row i's value (for a hand-drawn circle or a leader line). */
export const ledgerValueBox = (i: number) => {
  const sign = i === 0 ? "+74" : "−57";
  const unit = i === 0 ? "kg" : "g";
  const w = textWidth(sign, VAL, 600) + VAL * 0.18 + unitW(unit);
  const b = ledgerBaseline(i);
  return { x0: VAL_RIGHT - w - 4, x1: VAL_RIGHT + 2, top: b - VAL * 0.74, bottom: b + VAL * 0.12, cx: VAL_RIGHT - w / 2, cy: b - VAL * 0.32 };
};

export type LedgerProps = {
  /** card entrance 0..1 */
  readonly card: number;
  /** row entrances */
  readonly rows: readonly [number, number];
  /** tick draw-on (linear) */
  readonly ticks: readonly [number, number];
  /** counter values (kg gained, g lost) */
  readonly values: readonly [number, number];
  readonly valueOn: readonly [number, number];
  /** soft highlight behind a row */
  readonly hi?: readonly [number, number];
  /** soil row struck through (linear) */
  readonly strike?: number;
  /** fades the strike back (S18: the soil's loss is explained, not denied) */
  readonly strikeOpacity?: number;
  /** hand circle round the willow's gain (linear) */
  readonly circle?: number;
  readonly circleOpacity?: number;
  readonly opacity?: number;
};

export const Ledger: React.FC<LedgerProps> = ({ card, rows, ticks, values, valueOn, hi = [0, 0], strike = 0, strikeOpacity = 1, circle = 0, circleOpacity = 1, opacity = 1 }) => {
  if (card <= 0 || opacity <= 0) return null;
  const { x, y, w, rowH, pad } = LEDGER;
  const names = ["willow", "soil"];
  const valCol = [C.leafLight, C.paperDim];
  const units = ["kg", "g"];
  const signs = ["+", "−"];
  const slide = (1 - card) * 36;
  const sb = ledgerBaseline(1);
  return (
    <g opacity={opacity * Math.min(1, card * 1.4)} transform={`translate(${slide} 0)`}>
      <LitShape d={roundRectPath(x, y, w, LEDGER_H, 28)} top={C.ink700} bottom={mix(C.ink800, C.ink900, 0.4)} rimOpacity={0.32} shadow={0.55} shadowDy={14} shadowBlur={18} />
      <line x1={x + 30} y1={y + pad + rowH} x2={x + w - 30} y2={y + pad + rowH} stroke={C.ink600} strokeWidth={2} opacity={Math.min(rows[0], rows[1])} />
      {[0, 1].map((i) => {
        const p = rows[i];
        if (p <= 0) return null;
        const b = ledgerBaseline(i);
        const rowTop = y + pad + rowH * i;
        return (
          <g key={i}>
            {hi[i] > 0 ? (
              <g opacity={hi[i]}>
                <rect x={x + 16} y={rowTop + 8} width={w - 32} height={rowH - 16} rx={20} fill={C.paper} opacity={0.08} />
                <rect x={x + 26} y={rowTop + 26} width={5} height={rowH - 52} rx={2.5} fill={valCol[i]} />
              </g>
            ) : null}
            <text x={x + 44} y={b} fontFamily={FONT} fontWeight={600} fontSize={NAME} fill={C.paper} opacity={p} letterSpacing={-0.5} transform={`translate(${(1 - p) * -10} 0)`}>
              {names[i]}
            </text>
            <HandTick cx={x + 282} cy={b - NAME * 0.34} size={58} progress={ticks[i]} color={C.paper} width={8} seed={31 + i} />
            {valueOn[i] > 0 ? (
              <Counter
                x={VAL_RIGHT - unitW(units[i])}
                y={b - VAL * 0.355}
                value={values[i]}
                size={VAL}
                align="end"
                color={valCol[i]}
                prefix={signs[i]}
                suffix={units[i]}
                suffixColor={C.ink300}
                progress={valueOn[i]}
              />
            ) : null}
          </g>
        );
      })}
      {strike > 0 ? <StrikeThrough x1={x + 40} x2={x + w - 40} y={sb - NAME * 0.3} progress={strike} width={8} seed={41} opacity={strikeOpacity} /> : null}
      {circle > 0 ? (
        (() => {
          const v = ledgerValueBox(0);
          return <HandCircle cx={(v.x0 + v.x1) / 2} cy={(v.top + v.bottom) / 2} rx={(v.x1 - v.x0) / 2 + 26} ry={(v.bottom - v.top) / 2 + 20} progress={circle} color={C.paper} width={6} seed={52} opacity={circleOpacity} />;
        })()
      ) : null}
    </g>
  );
};
