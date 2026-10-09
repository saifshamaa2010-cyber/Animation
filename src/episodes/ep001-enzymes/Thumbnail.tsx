import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { Background } from "../../components/Background";
import { Cracker } from "../../components/Cracker";
import { Enzyme } from "../../components/Enzyme";
import { SugarChain } from "../../components/SugarChain";
import { dockedChain } from "../../components/dock";

/**
 * Thumbnail concept (1280×720). Three elements only: the everyday object,
 * the hidden molecular action, and a 3-word question. Readable at phone size.
 */
export const Thumbnail: React.FC = () => {
  const ex = 470;
  const ey = 470;
  const s = 0.95;
  const ch = dockedChain(5, ex, ey, s, { tone: "sugar" });
  const glowing = ch.rings.map((r) => ({ ...r, glow: 1 }));
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", width: 1920, height: 1080, transform: "scale(0.6667)", transformOrigin: "0 0" }}>
        <Background tone="warm" lightX={0.3} lightY={0.5} />
      </div>
      <svg viewBox="0 0 1280 720" width={1280} height={720} style={{ position: "absolute", inset: 0 }}>
        <Cracker x={300} y={300} size={420} rotate={-10} bites={1.6} glow={0.8} />
        <SugarChain rings={glowing} links={ch.links} />
        <Enzyme x={ex} y={ey} scale={s} still />
        <text x={1225} y={250} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={104} fill={C.paper} letterSpacing={-3}>
          WHY IT
        </text>
        <text x={1225} y={360} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={104} fill={C.paper} letterSpacing={-3}>
          TURNS
        </text>
        <text x={1225} y={500} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={150} fill={C.amber} letterSpacing={-4}>
          SWEET
        </text>
      </svg>
    </AbsoluteFill>
  );
};
