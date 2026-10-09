/**
 * S01 · Hook. A plain cracker, bitten and chewed while a stopwatch time-lapses a minute. The crumbs
 * warm to amber as it turns sweet (amber = sweet for the whole episode). No sugar was added — so
 * what's doing it? A lens gives a first glimpse of the molecule at work; then the stakes:
 * without it, millions of years.
 */
import React from "react";
import { C, EASE, H, W } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Cracker, Crumb } from "../../../components/Cracker";
import { SweetnessMeter } from "../../../components/SweetnessMeter";
import { Enzyme } from "../../../components/Enzyme";
import { SugarChain, Ring } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Bubble, Counter, HandCircle, HandCross, Hourglass, Stopwatch } from "../../../components/kit";
import { DOCK } from "../../../components/molecule-geometry";
import { rng } from "../../../lib/geometry";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, window01 } from "../../../lib/motion";
import { track } from "../../../lib/track";
import { moveRings, toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { CRUMBS, P } from "./crumbs";
import { s01Timing } from "./S01Hook.timing";

/** Crumbs knocked off by each bite (fall with a little gravity). */
const BITE_CRUMBS = (() => {
  const r = rng(77);
  const spots = [
    [P.x + 290, P.y - 370],
    [P.x + 100, P.y - 400],
    [P.x + 320, P.y - 150],
  ];
  return spots.flatMap(([sx, sy], b) =>
    Array.from({ length: 5 }, (_, i) => ({ b, x: sx + (r() - 0.5) * 90, y: sy + (r() - 0.5) * 50, vx: (r() - 0.2) * 5, r: 7 + r() * 8, seed: b * 10 + i })),
  );
})();

export const S01Hook: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s01Timing(sc);
  const out = EASE.out;

  // camera: still, then a slow push into the glowing crumbs while the question is asked
  const cam = camAt(f, [
    { f: 0, x: W / 2, y: H / 2, z: 1 },
    { f: k.question + 30, x: W / 2, y: H / 2, z: 1 },
    { f: k.answer + 6, x: P.x + 40, y: P.y, z: 1.45, ease: EASE.inOut },
    { f: k.millions - 4, x: P.x + 40, y: P.y, z: 1.45 },
    { f: k.millions + 30, x: P.x + 260, y: P.y - 20, z: 1.2 },
  ]);
  const S = (p: readonly [number, number]) => toScreen(cam, p);

  // cracker arrives, gets three bites, then is chewed into crumbs
  const crackerY = track(f, [[k.drop, -420], [k.drop + 30, P.y - 90, out]]);
  const crackerRot = track(f, [[k.drop, -22], [k.drop + 34, -8, out]]);
  const bites = k.bites.reduce((a, b) => a + prog(f, b, 6, out), 0);
  const crumbleP = prog(f, k.crumble, 16);
  const crackerVis = 1 - crumbleP;

  // the mouthful slowly turns over (mixing with saliva)
  const swirl = track(f, [[k.timer, 0], [k.question + 40, 0.9, EASE.inOut]]);
  const glow = (d: number) => prog(f, k.sweet - 6 + d, 26);
  const crumbsVis = prog(f, k.crumble, 6) * (1 - prog(f, k.millions + 24, 14));

  // stopwatch: one minute in a couple of seconds (time-lapse)
  const swIn = prog(f, k.timer - 4, 16);
  const swOut = 1 - prog(f, k.question + 20, 14);
  const seconds = track(f, [[k.timer + 4, 0], [k.sweet + 20, 60, EASE.inOut]]);
  const sweetV = track(f, [[k.sweet - 4, 0], [k.sweet + 40, 0.85, out]]);

  // lens: first glimpse of the molecule at work
  const lensR = track(f, [[k.answer - 4, 0], [k.answer + 18, 250, out], [k.millions, 250], [k.millions + 26, 205, out]]);
  const lensC = S([P.x + 10, P.y + 10]);
  const lensX = track(f, [[k.millions, lensC[0]], [k.millions + 26, 620, out]]);
  const lensY = track(f, [[k.millions, lensC[1]], [k.millions + 26, 520, out]]);
  const lensVis = lensR > 1 ? 1 - prog(f, k.end - 10, 10) : 0;
  const lc = { x: 0, y: 0, s: 0.62 };
  const lensChain = dockedChain(5, lc.x, lc.y, lc.s, { offset: [track(f, [[k.answer, -160], [k.answer + 30, 0, out], [k.lensSnap, 0], [k.lensSnap + 10, -40, EASE.snap]]), 0] });
  const freed = f >= k.lensSnap + 2;
  const lensRings: Ring[] = freed
    ? [
        ...lensChain.rings.slice(0, 3),
        ...moveRings(lensChain.rings.slice(3), track(f, [[k.lensSnap + 4, 0], [k.lensSnap + 40, -60]]), track(f, [[k.lensSnap + 4, 0], [k.lensSnap + 50, -120, out]]), -12 * prog(f, k.lensSnap, 40)).map(
          (r) => ({ ...r, tone: "sugar" as const, glow: prog(f, k.lensSnap, 14) }),
        ),
      ]
    : lensChain.rings;
  const lensLinks = lensChain.links.map((l, i) => (i === 2 ? { ...l, broken: prog(f, k.lensSnap, 6, EASE.snap), opacity: 1 - prog(f, k.lensSnap + 10, 6) } : l));

  // the stakes
  const stakes = prog(f, k.millions + 4, 18);
  const years = track(f, [[k.millions + 6, 0], [k.millions + 70, 1_000_000, EASE.in]]);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.42, lightY: 0.5 }}>
      <defs>
        <radialGradient id="s01pool" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.amberLight} stopOpacity={0.09} />
          <stop offset="1" stopColor={C.amberLight} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={camTransform(cam)}>
        <ellipse cx={P.x} cy={P.y + 120} rx={720} ry={220} fill="url(#s01pool)" />
        {crackerVis > 0 ? (
          <g opacity={crackerVis} transform={`translate(${P.x} ${crackerY}) scale(${1 - crumbleP * 0.25}) translate(${-P.x} ${-crackerY})`}>
            <Cracker x={P.x} y={crackerY} size={560} rotate={crackerRot} bites={bites} />
          </g>
        ) : null}
        {BITE_CRUMBS.map((c, i) => {
          const t0 = k.bites[c.b];
          if (f < t0 || f > t0 + 40) return null;
          const dt = f - t0;
          return <Crumb key={i} x={c.x + c.vx * dt} y={c.y + 0.42 * dt * dt} r={c.r} rot={dt * 9 + i * 20} seed={c.seed} opacity={1 - prog(f, t0 + 26, 12)} />;
        })}
        {crumbsVis > 0
          ? CRUMBS.map((c, i) => {
              const p = prog(f, k.crumble + c.delay, 18, out);
              const bx = c.from[0] + (c.to[0] - c.from[0]) * p;
              const by = c.from[1] + (c.to[1] - c.from[1]) * p;
              const a = swirl * (0.6 + (i % 5) * 0.12);
              const dx = bx - P.x;
              const dy = (by - P.y) * 2.2;
              const x = P.x + dx * Math.cos(a) - dy * Math.sin(a);
              const y = P.y + (dx * Math.sin(a) + dy * Math.cos(a)) / 2.2;
              return <Crumb key={i} x={x} y={y} r={c.r} rot={c.rot + swirl * 80} seed={c.seed} glow={glow(c.glowDelay)} opacity={crumbsVis} />;
            })
          : null}
        {/* saliva bubbles joining the mouthful */}
        {f > k.timer && f < k.millions + 30
          ? [0, 1, 2, 3, 4].map((i) => (
              <Bubble
                key={i}
                x={P.x - 120 + i * 62}
                y={P.y + 20 - (i % 2) * 40 - prog(f, k.timer + i * 6, 90) * 30}
                r={9 + (i % 3) * 5}
                progress={prog(f, k.timer + i * 6, 14)}
                seed={i + 5}
                opacity={0.8 * (1 - prog(f, k.millions + 10, 14))}
              />
            ))
          : null}
      </g>

      {/* screen-space props */}
      <HandCircle cx={S([P.x, P.y - 90])[0]} cy={S([P.x, P.y - 90])[1]} rx={390} ry={380} progress={prog(f, k.circle, 20, (t) => t)} color={C.paper} width={7} seed={3} opacity={1 - prog(f, k.chew + 10, 10)} />
      <Stopwatch x={1460} y={460} size={370} seconds={seconds} readout progress={swIn} opacity={swOut} />
      <SweetnessMeter x={1250} y={820} value={sweetV} opacity={window01(f, k.sweet - 6, k.question + 34, 12)} />
      <g opacity={window01(f, k.question - 2, k.answer - 4, 10)}>
        <g transform="translate(1460 420)">
          <path d="M0,-92 L84,-46 L0,0 L-84,-46 Z" fill={C.paper} />
          <path d="M-84,-46 L0,0 L0,96 L-84,50 Z" fill={C.paperDim} />
          <path d="M84,-46 L0,0 L0,96 L84,50 Z" fill="#B7B0A4" />
          <path d="M0,-92 L84,-46 L0,0 L-84,-46 Z" fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={3} />
          {[[-40, -40], [20, -52], [-12, -22], [36, -30]].map(([gx, gy], i) => (
            <rect key={i} x={gx} y={gy} width={7} height={7} rx={1.5} fill={C.paperDim} opacity={0.8} transform={`rotate(30 ${gx} ${gy})`} />
          ))}
        </g>
        <HandCross cx={1460} cy={430} size={260} progress={prog(f, k.sugar, 14, (t) => t)} width={11} seed={8} />
      </g>

      {/* the lens */}
      {lensVis > 0 ? (
        <g opacity={lensVis}>
          <defs>
            <clipPath id="s01lens">
              <circle cx={lensX} cy={lensY} r={lensR} />
            </clipPath>
            <radialGradient id="s01lensbg" cx="0.45" cy="0.4" r="0.7">
              <stop offset="0" stopColor={C.ink700} />
              <stop offset="1" stopColor={C.ink950} />
            </radialGradient>
          </defs>
          <circle cx={lensX} cy={lensY + 10} r={lensR + 14} fill={C.ink950} opacity={0.35} />
          <g clipPath="url(#s01lens)">
            <circle cx={lensX} cy={lensY} r={lensR} fill="url(#s01lensbg)" />
            <g transform={`translate(${lensX + 40} ${lensY + 10})`}>
              <SugarChain rings={lensRings} links={lensLinks} />
              <Enzyme x={lc.x} y={lc.y} scale={lc.s} temperature={37} seed={7} />
              {f >= k.lensSnap && f < k.lensSnap + 12 ? (
                <circle cx={lc.x + lc.s * DOCK.cut[0]} cy={lc.y} r={8 + 30 * prog(f, k.lensSnap, 12, out)} fill="none" stroke={C.amberLight} strokeWidth={3} opacity={1 - prog(f, k.lensSnap, 12)} />
              ) : null}
            </g>
          </g>
          <circle cx={lensX} cy={lensY} r={lensR} fill="none" stroke={C.paperDim} strokeWidth={10} />
          <circle cx={lensX} cy={lensY} r={lensR - 7} fill="none" stroke={C.paper} strokeOpacity={0.25} strokeWidth={3} />
          <path
            d={`M ${lensX - lensR * 0.72} ${lensY - lensR * 0.35} A ${lensR * 0.8} ${lensR * 0.8} 0 0 1 ${lensX - lensR * 0.2} ${lensY - lensR * 0.78}`}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.35}
            strokeWidth={8}
            strokeLinecap="round"
          />
        </g>
      ) : null}

      {/* the stakes: on its own, millions of years */}
      {stakes > 0 ? (
        <g opacity={stakes * (1 - prog(f, k.end - 8, 8))}>
          <Hourglass x={1330} y={440} size={300} sand={prog(f, k.millions, 140) * 0.35} progress={stakes} />
          <Counter x={1330} y={760} value={years} size={78} suffix=" years" speed={years > 0 && years < 1_000_000 ? 1 : 0} />
        </g>
      ) : null}
    </Stage>
  );
};
