/**
 * S20 · End card (7 s). The title stays; three chips — light, chlorophyll, glucose — linked by arrows,
 * and energy flows along them (light absorbed by chlorophyll, transferred into glucose). The lower
 * half is left clear for YouTube's end-screen tiles. Fades to ink.
 */
import React from "react";
import { C, EASE, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Photon } from "../../../components/Light";
import { hexIconPath } from "../../../components/bio/Organisms";
import { mix, textWidth } from "../../../components/kit";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s20Timing } from "./S20End.timing";
import { TitleWords } from "./parts/S02-TitleCard";

const ROW_Y = 392;
const CHIP_H = 76;
const ARROW = 74;
const GAP = 22;
const CHIPS = [
  { text: "light", color: C.sun },
  { text: "chlorophyll", color: C.leaf },
  { text: "glucose", color: C.amber },
] as const;

const Icon: React.FC<{ readonly i: number; readonly x: number; readonly y: number; readonly glow: number }> = ({ i, x, y, glow }) => {
  if (i === 0)
    return (
      <g>
        {Array.from({ length: 8 }, (_, k) => {
          const a = (k / 8) * Math.PI * 2;
          return <line key={k} x1={x + Math.cos(a) * 15} y1={y + Math.sin(a) * 15} x2={x + Math.cos(a) * 21} y2={y + Math.sin(a) * 21} stroke={C.sun} strokeWidth={3.5} strokeLinecap="round" />;
        })}
        <circle cx={x} cy={y} r={11} fill={mix(C.sun, C.paper, 0.3 * glow)} />
      </g>
    );
  if (i === 1)
    return (
      <g transform={`translate(${x} ${y}) rotate(-20)`}>
        <ellipse rx={20} ry={12} fill={mix(C.chloro, C.leafLight, 0.2 + 0.6 * glow)} />
        {[-8, 0, 8].map((d) => (
          <line key={d} x1={d} y1={-5} x2={d} y2={5} stroke={C.leafDark} strokeWidth={3} strokeLinecap="round" />
        ))}
      </g>
    );
  return <path d={hexIconPath(x, y, 16)} fill={mix(C.amber, C.amberLight, 0.3 + 0.6 * glow)} stroke={C.amberLight} strokeWidth={2} />;
};

export const S20End: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s20Timing(sc);
  const fade = 1 - prog(f, k.fade, 28, EASE.in);

  const widths = CHIPS.map((c) => textWidth(c.text, 44, 600) + 56 + 40);
  const total = widths.reduce((a, b) => a + b, 0) + 2 * (ARROW + GAP * 2);
  const xs: number[] = [];
  let x = W / 2 - total / 2;
  widths.forEach((w) => {
    xs.push(x);
    x += w + ARROW + GAP * 2;
  });

  // energy flow, cycle by cycle: photon into chlorophyll, then energy into glucose
  let glowChl = 0;
  let glowGlc = 0;
  let glowSun = 0;
  const travellers: React.ReactNode[] = [];
  for (let c = 0; c < k.cycles; c++) {
    const t0 = k.flow + c * k.period;
    glowSun = Math.max(glowSun, pulse(f, t0 - 6, 16));
    glowChl = Math.max(glowChl, pulse(f, t0 + 16, 26));
    glowGlc = Math.max(glowGlc, pulse(f, t0 + 42, 26));
    const a1: [number, number] = [xs[0] + widths[0] + GAP - 4, ROW_Y];
    const b1: [number, number] = [xs[1] - GAP + 4, ROW_Y];
    travellers.push(<Photon key={`p${c}`} from={a1} to={b1} p={(f - t0) / 18} size={0.8} />);
    const u = prog(f, t0 + 24, 20, EASE.inOut);
    if (u > 0 && u < 1) {
      const ax = xs[1] + widths[1] + GAP - 4;
      const bx = xs[2] - GAP + 4;
      const px = ax + (bx - ax) * u;
      const col = mix(C.sun, C.amber, u);
      travellers.push(
        <g key={`e${c}`}>
          <circle cx={px} cy={ROW_Y} r={18} fill={col} opacity={0.3} />
          <circle cx={px} cy={ROW_Y} r={8} fill={mix(col, C.paper, 0.4)} />
        </g>,
      );
    }
  }
  const glows = [glowSun, glowChl, glowGlc];

  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.26 }}>
      <g opacity={fade}>
        <TitleWords t={200} y={262} />
        {CHIPS.map((c, i) => {
          const p = prog(f, k.chips + i * 7, 16);
          if (p <= 0) return null;
          const g = glows[i];
          const x0 = xs[i];
          return (
            <g key={c.text} opacity={Math.min(1, p * 1.4)} transform={`translate(0 ${(1 - EASE.out(p)) * 16})`}>
              {g > 0 ? <rect x={x0 - 8} y={ROW_Y - CHIP_H / 2 - 8} width={widths[i] + 16} height={CHIP_H + 16} rx={(CHIP_H + 16) / 2} fill={c.color} opacity={0.16 * g} /> : null}
              <rect x={x0} y={ROW_Y - CHIP_H / 2} width={widths[i]} height={CHIP_H} rx={CHIP_H / 2} fill={mix(C.ink800, c.color, 0.08 + 0.12 * g)} stroke={c.color} strokeWidth={3} />
              <Icon i={i} x={x0 + 46} y={ROW_Y} glow={g} />
              <text x={x0 + 78} y={ROW_Y + 15} fontFamily={FONT} fontWeight={600} fontSize={44} fill={mix(c.color, C.paper, 0.25)} letterSpacing={-0.5}>
                {c.text}
              </text>
            </g>
          );
        })}
        {[0, 1].map((i) => {
          const p = prog(f, k.chips + 10 + i * 7, 14);
          const ax = xs[i] + widths[i] + GAP;
          const bx = ax + ARROW;
          return (
            <g key={`a${i}`} opacity={p}>
              <line x1={ax} y1={ROW_Y} x2={ax + (bx - ax) * p} y2={ROW_Y} stroke={C.ink300} strokeWidth={4} strokeLinecap="round" />
              <path d={`M${bx - 14},${ROW_Y - 12} L${bx},${ROW_Y} L${bx - 14},${ROW_Y + 12}`} fill="none" stroke={C.ink300} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={p >= 0.95 ? 1 : 0} />
            </g>
          );
        })}
        {travellers}
      </g>
    </Stage>
  );
};
