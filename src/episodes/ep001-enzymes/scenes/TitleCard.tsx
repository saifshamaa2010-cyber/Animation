/**
 * Title card (S02, and again at the end of S13). The enzyme snips a maltose off its chain as the
 * title lands — the episode's whole story in one gesture.
 */
import React from "react";
import { C, EASE, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Enzyme } from "../../../components/Enzyme";
import { Ring, SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { DOCK } from "../../../components/molecule-geometry";
import { HandUnderline, textWidth } from "../../../components/kit";
import { prog } from "../../../lib/motion";
import { track } from "../../../lib/track";
import { moveRings } from "../../../lib/world";

const WORDS = ["How", "Enzymes", "Actually", "Work"];
const SIZE = 116;

/** `t` = frames since the title started. `snapAt` = when the motif snips. */
export const TitleCard: React.FC<{ readonly t: number; readonly snapAt?: number; readonly y?: number; readonly opacity?: number }> = ({
  t,
  snapAt = 46,
  y = 800,
  opacity = 1,
}) => {
  const space = textWidth(" ", SIZE, 700);
  const widths = WORDS.map((w) => textWidth(w, SIZE, 700, -3));
  const total = widths.reduce((a, b) => a + b, 0) + space * (WORDS.length - 1);
  let x = W / 2 - total / 2;
  const xs = widths.map((w) => {
    const x0 = x;
    x += w + space;
    return x0;
  });
  const E = { x: 1090, y: 470, s: 0.95 };
  const chain = dockedChain(6, E.x, E.y, E.s, { offset: [track(t, [[0, -120], [26, 0, EASE.out]]), 0] });
  const freed = t >= snapAt + 2;
  const rings: Ring[] = freed
    ? [
        ...moveRings(chain.rings.slice(0, 4), track(t, [[snapAt, 0], [snapAt + 10, -50, EASE.snap]]), track(t, [[snapAt, 0], [snapAt + 12, 74, EASE.snap]]), 0),
        ...moveRings(chain.rings.slice(4), track(t, [[snapAt + 4, 0], [snapAt + 20, -170, EASE.inOut], [snapAt + 50, -230, EASE.out]]), track(t, [[snapAt + 14, 0], [snapAt + 50, -150, EASE.out]]), -14 * prog(t, snapAt + 14, 36)).map(
          (r) => ({ ...r, tone: "sugar" as const, glow: prog(t, snapAt, 16) }),
        ),
      ]
    : chain.rings;
  const links = chain.links.map((l, i) => (i === 3 ? { ...l, broken: prog(t, snapAt, 6, EASE.snap), opacity: 1 - prog(t, snapAt + 10, 6) } : l));
  const motif = prog(t, 0, 18);
  return (
    <g opacity={opacity}>
      <g opacity={motif} transform={`translate(0 ${(1 - motif) * 20})`}>
        <SugarChain rings={rings} links={links} />
        <Enzyme x={E.x} y={E.y} scale={E.s} temperature={37} seed={7} />
        {t >= snapAt && t < snapAt + 12 ? (
          <circle cx={E.x + E.s * DOCK.cut[0]} cy={E.y} r={12 + 50 * prog(t, snapAt, 12, EASE.out)} fill="none" stroke={C.amberLight} strokeWidth={4} opacity={1 - prog(t, snapAt, 12)} />
        ) : null}
      </g>
      <defs>
        <clipPath id="title-mask">
          <rect x={0} y={y - SIZE} width={W} height={SIZE * 1.3} />
        </clipPath>
      </defs>
      <g clipPath="url(#title-mask)">
        {WORDS.map((w, i) => {
          const p = prog(t, 8 + i * 5, 16, EASE.out);
          return (
            <text key={w} x={xs[i]} y={y + (1 - p) * SIZE * 0.9} fontFamily={FONT} fontWeight={700} fontSize={SIZE} fill={C.paper} letterSpacing={-3}>
              {w}
            </text>
          );
        })}
      </g>
      <HandUnderline x1={xs[2] - 6} x2={xs[2] + widths[2] + 6} y={y + 30} progress={prog(t, 30, 16, (v) => v)} color={C.amber} width={8} seed={21} />
    </g>
  );
};
