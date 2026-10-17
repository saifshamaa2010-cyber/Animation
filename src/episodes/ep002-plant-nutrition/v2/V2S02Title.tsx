/**
 * EP002 v2 · S02 — Title card (a 3-second silence in the narration). World: the sunlit meadow.
 * Sprouts unfurl in the sun, "Plant nutrition" rises into place with a taped subtitle, and Chloro —
 * the channel's host, a chloroplast — pops up on the hill to wave hello (his introduction).
 * Beats are fractions of the scene (no narration to time them to), so it still works if the
 * silence changes length.
 */
import React from "react";
import { C, EASE, W, W2 } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Chloro, PaperSlip, SpeechBubble, SunBuddy, WorldStage } from "../../../components/fun";
import { LeafSprout } from "../../../components/fun/Sprouts";
import { textWidth } from "../../../components/kit";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { v2s02Timing } from "./V2S02Title.timing";

const TITLE = { words: ["Plant", "nutrition"], size: 156, y: 468 } as const;
const SUB = { text: "How plants make their own food", size: 46, y: 590 } as const;
const SUB_W = textWidth(SUB.text, SUB.size, 600) + 90;
const CH = { x: 1575, y: 948, size: 272 } as const;

const titleLayout = () => {
  const space = textWidth(" ", TITLE.size, 700);
  const widths = TITLE.words.map((w) => textWidth(w, TITLE.size, 700, -3));
  const total = widths.reduce((a, b) => a + b, 0) + space;
  let x = W / 2 - total / 2;
  return widths.map((w) => {
    const x0 = x;
    x += w + space;
    return x0;
  });
};
const TITLE_X = titleLayout();

export const V2S02Title: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = v2s02Timing(sc);
  const id = useSvgId("v2s02");
  const sway = Math.sin(f / 22) * 1.6;

  const chEnter = prog(f, k.chloro, 16, (v) => v);
  const hi = prog(f, k.hello, 12, (v) => v);

  return (
    <WorldStage world="meadow">
      <defs>
        <clipPath id={`${id}-t`}>
          <rect x={0} y={TITLE.y - TITLE.size * 1.02} width={W} height={TITLE.size * 1.3} />
        </clipPath>
        <filter id={`${id}-sh`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>

      {/* the sun, and plants opening up to it */}
      <SunBuddy x={300} y={214} r={74} progress={prog(f, k.sun, 18, (v) => v)} shine={0.4 + 0.4 * pulse(f, k.words + 10, 40)} seed={3} />
      <LeafSprout x={270} y={905} h={330} lean={0.14} leaves={5} leafLen={124} progress={prog(f, k.sprouts, 34, (v) => v)} sway={sway} flip />
      <LeafSprout x={410} y={915} h={190} lean={0.22} leaves={3} leafLen={96} progress={prog(f, k.sprouts + 8, 28, (v) => v)} sway={-sway * 0.8} />
      <LeafSprout x={1790} y={915} h={150} lean={0.2} leaves={3} leafLen={84} progress={prog(f, k.sprouts + 14, 26, (v) => v)} sway={sway * 0.7} flip />

      {/* the title rises into place */}
      <g filter={`url(#${id}-sh)`} opacity={0.32} transform="translate(6 10)">
        <g clipPath={`url(#${id}-t)`}>
          {TITLE.words.map((w, i) => {
            const p = prog(f, k.words + i * 6, 20, EASE.out);
            return p > 0 ? (
              <text key={w} x={TITLE_X[i]} y={TITLE.y + (1 - p) * TITLE.size * 1.15} fontFamily={FONT} fontWeight={700} fontSize={TITLE.size} fill={W2.inkText} letterSpacing={-3}>
                {w}
              </text>
            ) : null;
          })}
        </g>
      </g>
      <g clipPath={`url(#${id}-t)`}>
        {TITLE.words.map((w, i) => {
          const p = prog(f, k.words + i * 6, 20, EASE.out);
          return p > 0 ? (
            <text key={w} x={TITLE_X[i]} y={TITLE.y + (1 - p) * TITLE.size * 1.15} fontFamily={FONT} fontWeight={700} fontSize={TITLE.size} fill={C.paper} letterSpacing={-3}>
              {w}
            </text>
          ) : null;
        })}
      </g>

      {/* the subtitle, taped on */}
      <PaperSlip x={W / 2} y={SUB.y} w={SUB_W} h={92} rotate={-1.5} progress={prog(f, k.subtitle, 14)} tape="left">
        <text y={SUB.size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={SUB.size} fill={W2.inkText}>
          {SUB.text}
        </text>
      </PaperSlip>

      {/* Chloro pops up on the hill to say hello */}
      <Chloro x={CH.x} y={CH.y} size={CH.size} mood={hi > 0 ? "celebrate" : "happy"} pose="wave" enter={chEnter} bounce={prog(f, k.hello, 12, (v) => v)} look={[-0.6, -0.2]} seed={2} />
      <SpeechBubble x={CH.x - 318} y={CH.y - 262} tail={[CH.x - 96, CH.y - 150]} progress={hi} text="Hi!" size={58} />
    </WorldStage>
  );
};
