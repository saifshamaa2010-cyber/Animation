/**
 * S13 · Resolve the hook. Back to the same chewed mouthful; dive in (same zoom language as S03);
 * amylase fits, snips, again and again; the conditions in your mouth are just right (37 °C ✓, pH 7 ✓);
 * the hook's stakes resolved: "millions of years" vs "while you chew"; pull back out to crumbs
 * glowing amber; the title returns on "And that's how enzymes actually work."
 */
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, EASE, H, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Background } from "../../../components/Background";
import { Crumb } from "../../../components/Cracker";
import { Enzyme } from "../../../components/Enzyme";
import { Link, Ring, SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { SweetnessMeter } from "../../../components/SweetnessMeter";
import { Thermometer } from "../../../components/Thermometer";
import { DOCK, SPACING } from "../../../components/molecule-geometry";
import { FocusPull, HandTick, Hourglass, PHScale, Stopwatch } from "../../../components/kit";
import { rng } from "../../../lib/geometry";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { blendJit, jit, jitTransform, moveRings } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s13Timing } from "./S13Resolve.timing";
import { TitleCard } from "./TitleCard";
import { CRUMBS, P } from "./crumbs";

const Z_MAX = 40;
const E = { x: 1180, y: 560, s: 1.25 } as const;
const PIVOT = [E.x, E.y] as const;

/** Other amylase molecules at work around the hero, each on its own rhythm. */
const CROWD = (() => {
  const r = rng(913);
  const spots: [number, number][] = [
    [260, 210], [700, 110], [1660, 170], [1800, 760], [330, 920], [980, 980], [1560, 980], [150, 820],
  ];
  return spots.map(([x, y], i) => ({ x, y, rot: (r() - 0.5) * 120, s: 0.42 + r() * 0.1, variant: 0, period: 58 + Math.floor(r() * 30), phase: Math.floor(r() * 60), i }));
})();

export const S13Resolve: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s13Timing(sc);
  const out = EASE.out;
  const amp = thermalAmplitude(37) * 0.8;

  // ---- zoom in (chew) and back out (tongue): same "powers of ten" language as S03
  const zin = interpolate(f, [k.chew, k.zoomEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  const zout = interpolate(f, [k.zoomOut, k.zoomOut + 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  const zt = zin * (1 - zout);
  const Z = Math.exp(Math.log(Z_MAX) * zt);
  const microVis = interpolate(Z, [7, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const macroVis = 1 - interpolate(Z, [5, 13], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const microZ = Z / Z_MAX;
  const titleT = f - k.title;
  const titleVis = prog(f, k.title - 4, 14);

  // ---- hero: docks on "fit", snips on "snips", then again and again
  const snaps = [k.snap, ...k.snaps2];
  const docks = [k.dock, ...k.snaps2.map((s) => s - 12)];
  const done = snaps.filter((s) => f >= s + 3).length;
  const n = 12 - 2 * done;
  let off = track(f, [[k.zoomEnd - 20, -280], [k.dock - 14, -240], [k.dock, 0, out]]);
  if (done > 0) {
    const s = snaps[done - 1];
    const nd = docks[done];
    off = track(f, [[s, -2 * SPACING * E.s], [s + 10, -2 * SPACING * E.s - 50, EASE.snap], ...(nd !== undefined ? ([[nd - 12, -2 * SPACING * E.s - 50], [nd, 0, out]] as const) : [])]);
  }
  const dockAmt = Math.max(...docks.map((d, i) => window01(f, d - 12, snaps[i] + 8, 6)));
  const ej = jit("E13", f, amp);
  const cj = blendJit(jit("C13", f, amp * 1.2), ej, dockAmt);
  const chain = dockedChain(n, E.x, E.y, E.s, { wave: 1.4 * Math.sin(f * 0.06) * (1 - dockAmt * 0.7) });
  const chainRings = moveRings(chain.rings, off, 0, 0);
  const bump = 1 + snaps.reduce((a, s, i) => a + 0.014 * pulse(f, docks[i] - 2, 12) - 0.008 * pulse(f, s, 8), 0);
  const pairs = snaps.slice(0, done).map((s, j) => {
    const sx = E.x + E.s * (DOCK.outer[0] + DOCK.inner[0]) / 2;
    const tx = [760, 560, 900][j % 3];
    const ty = [300, 220, 170][j % 3];
    const px = track(f, [[s + 6, sx], [s + 24, sx - 200], [s + 80, tx, out]]);
    const py = track(f, [[s + 12, E.y], [s + 80, ty, out]]) + Math.sin((f - s) * 0.05 + j) * 8;
    const ring = (dx: number): Ring => ({ x: px + dx, y: py, tone: "sugar", glow: prog(f, s + 3, 16), scale: E.s });
    return moveRings([ring(-SPACING * E.s * 0.5), ring(SPACING * E.s * 0.5)], 0, 0, -14 + j * 10);
  });

  // ---- conditions: 37 °C ✓ and pH 7 ✓
  const condVis = window01(f, k.conditions - 4, k.aeons - 4, 12);
  // ---- payoff: millions of years vs while you chew
  const payVis = window01(f, k.aeons, k.zoomOut + 6, 14);
  const overlay = Math.max(condVis, payVis);
  const blur = overlay * 12;

  // ---- macro mouthful: cream at first, glowing amber after we zoom back out
  const amberAfter = prog(f, k.zoomOut + 30, 30);
  const sweetV = track(f, [[k.zoomOut + 30, 0.2], [k.tongue + 60, 1, out]]);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: 1 - microVis * 0.999 }}>
        <Background tone="warm" lightX={0.42} lightY={0.5} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: microVis }}>
        <Background particles={36} lightX={0.55} />
      </AbsoluteFill>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* macro: the mouthful */}
        {macroVis > 0 ? (
          <g opacity={macroVis * (1 - titleVis)} transform={`translate(${W / 2} ${H / 2}) scale(${Z}) translate(${-P.x - 60} ${-P.y - 20})`}>
            {CRUMBS.map((c, i) => (
              <Crumb key={i} x={c.to[0] + 60} y={c.to[1]} r={c.r} rot={c.rot} seed={c.seed} glow={amberAfter * prog(f, k.zoomOut + 30 + c.glowDelay, 20)} />
            ))}
          </g>
        ) : null}

        {/* micro: amylase at work */}
        {microVis > 0 ? (
          <g opacity={microVis} transform={`translate(${W / 2} ${H / 2}) scale(${microZ}) translate(${-960} ${-540})`}>
            <FocusPull blur={blur} dim={0.62 * (blur / 9)}>
              {CROWD.map((c) => {
                const u = (((f + c.phase) % c.period) + c.period) % c.period / c.period;
                const approach = track(u, [[0, -200], [0.3, 0, out], [0.55, 0], [0.62, -60, EASE.snap], [1, -200]]);
                const prod = u > 0.55 ? (u - 0.55) / 0.45 : -1;
                const sub = dockedChain(4, 0, 0, 1, { offset: [approach, 0] });
                return (
                  <g key={c.i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot}) scale(${c.s})`}>
                    <SugarChain rings={sub.rings} links={sub.links} />
                    {prod >= 0 ? (
                      <g opacity={1 - prod} transform={`translate(${-80 - prod * 200} ${-prod * 180})`}>
                        <SugarChain rings={[{ x: -40, y: 0, tone: "sugar", glow: 0.9 }, { x: 40, y: 0, tone: "sugar", glow: 0.9 }]} links={[{ a: 0, b: 1 }]} />
                      </g>
                    ) : null}
                    <Enzyme x={0} y={0} lod="low" seed={c.i + 2} temperature={37} />
                  </g>
                );
              })}
              {pairs.map((p, j) => (
                <SugarChain key={j} rings={p} links={[{ a: 0, b: 1 }]} />
              ))}
              <g transform={jitTransform(cj, PIVOT)}>
                <SugarChain rings={chainRings} links={chain.links.map((l): Link => l)} />
              </g>
              <g transform={jitTransform(ej, PIVOT)}>
                <g transform={`translate(${E.x} ${E.y}) scale(${bump}) translate(${-E.x} ${-E.y})`}>
                  <Enzyme x={E.x} y={E.y} scale={E.s} still seed={7} showSite={window01(f, k.fit - 4, k.cut + 10, 8)} />
                </g>
                {snaps.map((s) =>
                  f >= s && f < s + 12 ? (
                    <circle key={s} cx={E.x + E.s * DOCK.cut[0]} cy={E.y} r={14 + 56 * prog(f, s, 12, out)} fill="none" stroke={C.amberLight} strokeWidth={4} opacity={1 - prog(f, s, 12)} />
                  ) : null,
                )}
              </g>
            </FocusPull>
          </g>
        ) : null}

        {overlay > 0 ? <rect x={0} y={0} width={W} height={H} fill={C.ink950} opacity={0.6 * overlay} /> : null}

        {/* conditions are just right */}
        {condVis > 0 ? (
          <g opacity={condVis}>
            <Thermometer x={470} y={290} height={440} temperature={37} min={0} max={80} ticks={[0, 37, 80]} />
            <HandTick cx={640} cy={250} size={120} progress={prog(f, k.deg + 4, 16, (t) => t)} width={11} seed={4} />
            <PHScale x={860} y={600} width={880} progress={prog(f, k.neutral - 10, 26, (t) => t)} marker={7} markerLabel="pH 7" markerColor={C.tealLight} />
            <HandTick cx={1300} cy={440} size={120} progress={prog(f, k.neutral + 6, 16, (t) => t)} width={11} seed={6} />
          </g>
        ) : null}

        {/* the hook's stakes, resolved */}
        {payVis > 0 ? (
          <g opacity={payVis}>
            <Hourglass x={600} y={470} size={300} sand={0.12} progress={prog(f, k.aeons, 16)} />
            <text x={600} y={760} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={56} fill={C.ink300}>
              a million years
            </text>
            <line x1={W / 2} y1={330} x2={W / 2} y2={780} stroke={C.ink500} strokeWidth={3} strokeLinecap="round" opacity={prog(f, k.aeons + 6, 14)} />
            <Stopwatch x={1320} y={470} size={300} seconds={track(f, [[k.chewWord - 10, 0], [k.chewWord + 30, 60, EASE.inOut]])} progress={prog(f, k.chewWord - 14, 16)} />
            <text x={1320} y={760} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={56} fill={C.amber} opacity={prog(f, k.chewWord - 6, 14)}>
              while you chew
            </text>
          </g>
        ) : null}

        <SweetnessMeter x={W - 560} y={150} value={sweetV} opacity={window01(f, k.zoomOut + 30, k.title, 12)} />
        {titleVis > 0 ? <TitleCard t={titleT} snapAt={44} opacity={titleVis} /> : null}
      </svg>
    </AbsoluteFill>
  );
};
