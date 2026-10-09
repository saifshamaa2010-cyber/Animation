import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { Background } from "../../components/Background";
import { Cracker } from "../../components/Cracker";
import { Enzyme } from "../../components/Enzyme";
import { Ring, SugarChain } from "../../components/SugarChain";
import { dockedChain } from "../../components/dock";
import { DOCK } from "../../components/molecule-geometry";
import { moveRings } from "../../lib/world";

/**
 * Thumbnail (1280×720). Three things, readable on a phone: the everyday object, the hidden
 * molecular action under a lens (the same lens as the hook), and a four-word question.
 */
export const Thumbnail: React.FC = () => {
  const L = { x: 470, y: 400, r: 250 };
  const s = 0.62;
  const ex = L.x + 70;
  const ey = L.y + 20;
  const chain = dockedChain(5, ex, ey, s);
  const freed: Ring[] = moveRings(chain.rings.slice(3), -150, -120, -16).map((r) => ({ ...r, tone: "sugar" as const, glow: 1 }));
  const rings = [...chain.rings.slice(0, 3).map((r) => moveRings([r], -30, 30)[0]), ...freed];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", width: 1920, height: 1080, transform: "scale(0.6667)", transformOrigin: "0 0" }}>
        <Background tone="warm" lightX={0.3} lightY={0.5} />
      </div>
      <svg viewBox="0 0 1280 720" width={1280} height={720} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="th-lens">
            <circle cx={L.x} cy={L.y} r={L.r} />
          </clipPath>
          <radialGradient id="th-lens-bg" cx="0.45" cy="0.4" r="0.7">
            <stop offset="0" stopColor={C.ink700} />
            <stop offset="1" stopColor={C.ink950} />
          </radialGradient>
          <filter id="th-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
        </defs>
        <Cracker x={300} y={330} size={430} rotate={-10} bites={1.6} glow={0.5} />
        <circle cx={L.x} cy={L.y + 12} r={L.r + 16} fill={C.ink950} opacity={0.45} />
        <g clipPath="url(#th-lens)">
          <circle cx={L.x} cy={L.y} r={L.r} fill="url(#th-lens-bg)" />
          <circle cx={L.x - 110} cy={L.y - 100} r={110} fill={C.amber} opacity={0.5} filter="url(#th-glow)" />
          <SugarChain rings={rings} links={[{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 3, b: 4 }]} />
          <Enzyme x={ex} y={ey} scale={s} still seed={7} />
          {Array.from({ length: 7 }, (_, i) => {
            const a = (i / 7) * Math.PI * 2 + 0.4;
            const cx = ex + s * DOCK.cut[0] - 18;
            const cy = ey + 12;
            return <line key={i} x1={cx + Math.cos(a) * 18} y1={cy + Math.sin(a) * 18} x2={cx + Math.cos(a) * 34} y2={cy + Math.sin(a) * 34} stroke={C.amberLight} strokeWidth={4} strokeLinecap="round" />;
          })}
        </g>
        <circle cx={L.x} cy={L.y} r={L.r} fill="none" stroke={C.paperDim} strokeWidth={14} />
        <path d={`M ${L.x + L.r * 0.25} ${L.y - L.r * 0.8} A ${L.r * 0.82} ${L.r * 0.82} 0 0 1 ${L.x + L.r * 0.72} ${L.y - L.r * 0.38}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={10} strokeLinecap="round" />
        <text x={1240} y={250} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={92} fill={C.paper} letterSpacing={-3}>
          WHY
        </text>
        <text x={1240} y={350} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={92} fill={C.paper} letterSpacing={-3}>
          CRACKERS
        </text>
        <text x={1240} y={450} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={92} fill={C.paper} letterSpacing={-3}>
          TURN
        </text>
        <text x={1240} y={590} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={150} fill={C.amber} letterSpacing={-5}>
          SWEET
        </text>
      </svg>
    </AbsoluteFill>
  );
};
