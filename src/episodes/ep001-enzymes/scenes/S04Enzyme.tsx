/**
 * S04 · Meet amylase. It snips starch into maltose (sweet), again and again (catalyst, unchanged);
 * zoom out: enzymes run nearly every reaction in your body — and without them, everything stalls;
 * zoom in: an enzyme is a folded chain of amino acids, and its shape is everything.
 * Ends framed exactly like S05 begins, so the cut between them is invisible.
 */
import React from "react";
import { C, EASE, H, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Enzyme } from "../../../components/Enzyme";
import { Link, Ring, SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label, Keyword } from "../../../components/Label";
import { SweetnessMeter } from "../../../components/SweetnessMeter";
import { Hourglass } from "../../../components/Icons";
import { Scrim } from "../../../components/Scrim";
import { DOCK, ENZYME_RADII, ENZYME_REST, SPACING } from "../../../components/molecule-geometry";
import { rng, roundedPolygon } from "../../../lib/geometry";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { blendJit, jit, jitTransform, moveRings, toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s04Timing } from "./S04Enzyme.timing";

const E = { y: 560, s: 1.35, xDock: 1240 } as const;
const N0 = 16;
const SP = SPACING * E.s;
const ENZ_PATH = roundedPolygon(ENZYME_REST, ENZYME_RADII);

/** Other enzymes in the zoomed-out view: different shapes, two colours, each doing its own reaction. */
const FIELD = (() => {
  const r = rng(404);
  const out: { x: number; y: number; s: number; rot: number; pal: "teal" | "violet"; variant: number; phase: number; period: number }[] = [];
  for (let gy = -2; gy <= 2; gy++) {
    for (let gx = -3; gx <= 3; gx++) {
      const jx = (r() - 0.5) * 260;
      const jy = (r() - 0.5) * 220;
      if (gy === 0 && gx <= 0) continue; // the hero and its long starch chain live here
      out.push({
        x: E.xDock + gx * 900 + jx,
        y: E.y + gy * 780 + jy,
        s: 0.95 + r() * 0.35,
        rot: (r() - 0.5) * 320,
        pal: r() < 0.25 ? "violet" : "teal",
        variant: out.length + 1,
        phase: Math.floor(r() * 90),
        period: 72 + Math.floor(r() * 36),
      });
    }
  }
  return out;
})();

const MALTOSE_TARGETS: readonly (readonly [number, number])[] = [
  [860, 330],
  [640, 250],
  [1010, 210],
  [700, 400],
];

export const S04Enzyme: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s04Timing(sc);
  const out = EASE.out;
  const amp = thermalAmplitude(37) * 0.8;

  // ---------------- camera
  const cam = camAt(f, [
    { f: -12, x: 1000, y: 540, z: 1 },
    { f: k.maltose - 6, x: 1000, y: 540, z: 1 },
    { f: k.maltose + 40, x: 850, y: 390, z: 1.26 },
    { f: k.sweet + 46, x: 850, y: 390, z: 1.26 },
    { f: k.catalyst + 12, x: 1010, y: 520, z: 1.0 },
    { f: k.every, x: 1010, y: 520, z: 1.0 },
    { f: k.every + 84, x: 1240, y: 560, z: 0.3 },
    { f: k.protein - 4, x: 1240, y: 560, z: 0.3 },
    { f: k.protein + 64, x: 1240, y: 560, z: 1.0 },
    { f: k.shape - 16, x: 1240, y: 560, z: 1.0 },
    { f: k.shape + 40, x: 1147, y: 547, z: 1.185 },
  ]);
  const S = (p: readonly [number, number]) => toScreen(cam, p);

  // ---------------- hero enzyme: glides in, docks on "snips"
  const ex = track(f, [[k.enter - 12, 2500], [k.enter + 62, 1500, out], [k.dock - 14, 1470], [k.dock, E.xDock, out]]);
  const ej = jit("E04", f, amp);
  const snaps = [k.snap, ...k.cycles];
  const docks = [k.dock, ...k.cycles.map((c) => c - 12)];
  const done = snaps.filter((s) => f >= s + 3).length;
  const bump = 1 + snaps.reduce((a, s, i) => a + 0.014 * pulse(f, docks[i] - 2, 12) - 0.008 * pulse(f, s, 8), 0);
  const heroVis = (1 - prog(f, k.without + 10, 22)) + prog(f, k.protein + 8, 24);
  const unfold = track(f, [[k.unfoldA, 0], [k.unfoldB, 1, EASE.inOut], [k.fold - 2, 1], [k.foldB, 0, EASE.inOut]]);
  const showSite = prog(f, k.shape - 4, 18);

  // ---------------- the long starch chain, fed in two rings at a time
  const n = N0 - 2 * done;
  let off = 0;
  if (done > 0) {
    const s = snaps[done - 1];
    const nextDock = docks[done];
    off = track(f, [[s, -2 * SP], [s + 10, -2 * SP - 60, EASE.snap], ...(nextDock !== undefined ? ([[nextDock - 14, -2 * SP - 60], [nextDock, 0, out]] as const) : [])]);
  }
  const dockedAmt = Math.max(...docks.map((d, i) => window01(f, d - 14, snaps[i] + 8, 8)));
  const chainBase = dockedChain(n, E.xDock, E.y, E.s, { wave: 1.4 * Math.sin(f * 0.06) * (1 - dockedAmt * 0.7) });
  const chainVis = 1 - prog(f, k.every + 70, 30);
  const chainRings = moveRings(chainBase.rings, off, 0, 0);
  const strainIdx = n - 3; // link at the mouth
  const curSnap = snaps[done] ?? -999;
  const strain = window01(f, curSnap - 12, curSnap + 2, 6);
  const chainLinks: Link[] = chainBase.links.map((l, i) => (i === strainIdx ? { ...l, highlight: strain } : l));
  // break animation for the most recent snap: draw the broken stub briefly
  const lastSnap = done > 0 ? snaps[done - 1] : -999;
  const cj = blendJit(jit("C04", f, amp * 1.2), ej, dockedAmt);

  // maltose pairs released at each snap, drifting up into a sweet "cloud"
  const pairs = snaps.slice(0, done).map((s, j) => {
    const [tx, ty] = MALTOSE_TARGETS[j % MALTOSE_TARGETS.length];
    const startX = E.xDock + E.s * (DOCK.outer[0] + DOCK.inner[0]) / 2;
    const px = track(f, [[s + 6, startX], [s + 26, startX - 210], [s + 80, tx, out]]);
    const py = track(f, [[s + 14, E.y], [s + 80, ty, out]]);
    const bob = Math.sin((f - s) * 0.05 + j) * 8;
    const rot = track(f, [[s + 6, 0], [s + 80, -18 + j * 9, out]]);
    const base: Ring[] = [
      { x: px - (SPACING * E.s) / 2, y: py + bob, tone: "sugar", glow: prog(f, s + 3, 18), scale: E.s },
      { x: px + (SPACING * E.s) / 2, y: py + bob, tone: "sugar", glow: prog(f, s + 3, 18), scale: E.s },
    ];
    return moveRings(base, 0, 0, rot);
  });
  const pairsVis = 1 - prog(f, k.every + 60, 40);

  // ---------------- ghost outline: "without being used up" — the same enzyme, before and after
  const ghostX = track(f, [[k.used - 14, 300], [k.used + 10, 0, out]]);
  const ghostVis = window01(f, k.used - 14, k.every + 10, 10);

  // ---------------- the crowd of enzymes (zoomed out)
  const fieldIn = prog(f, k.every + 6, 34);
  const fieldOut = 1 - prog(f, k.protein + 30, 30);

  // ---------------- labels
  const heroTop = S([E.xDock + 60 + (ex - E.xDock), E.y - 200]);
  const pair0 = pairs[0];
  const maltAnchor = pair0 ? S([pair0[1].x + 20, pair0[1].y - 30]) : ([0, 0] as [number, number]);
  const ghostAnchor = S([E.xDock + 200, E.y - 180]);
  const sweetV = track(f, [[k.sweet - 2, 0], [k.sweet + 26, 0.32, out], ...k.cycles.flatMap((c, i) => [[c + 2, 0.32 + i * 0.13], [c + 18, 0.45 + i * 0.13, out]] as [number, number, ((t: number) => number)?][])]);

  return (
    <Stage bg={{ particles: 44, lightX: 0.55 }}>
      <g transform={camTransform(cam)}>
        {/* the crowd: dozens of different enzymes, each running its own reaction */}
        {fieldIn > 0 && fieldOut > 0 ? (
          <g opacity={fieldIn * fieldOut * 0.92}>
            {FIELD.map((e, i) => {
              const alive = f < k.without + (i % 12) * 3;
              const u = (((f + e.phase) % e.period) + e.period) % e.period / e.period;
              const approach = alive ? track(u, [[0, -230], [0.25, 0, out], [0.55, 0], [0.62, -70, EASE.snap], [1, -200]]) : -200;
              const prod = alive && u > 0.55 ? (u - 0.55) / 0.45 : -1;
              const vis = 1 - prog(f, k.without + (i % 12) * 3, 18);
              const sub = dockedChain(3, 0, 0, 1, { offset: [approach, 0] });
              return (
                <g key={i} transform={`translate(${e.x} ${e.y}) rotate(${e.rot}) scale(${e.s})`}>
                  {e.pal === "teal" ? (
                    <SugarChain rings={sub.rings} links={sub.links} />
                  ) : (
                    <g>
                      {sub.rings.map((r, j) => (
                        <circle key={j} cx={r.x} cy={r.y} r={24} fill={C.violetLight} stroke={C.violetDeep} strokeWidth={4} />
                      ))}
                    </g>
                  )}
                  {prod >= 0 ? (
                    <g opacity={1 - prod} transform={`translate(${-60 - prod * 220} ${-prod * 160})`}>
                      {e.pal === "teal" ? (
                        <SugarChain
                          rings={[
                            { x: -40, y: 0, tone: "sugar", glow: 0.8 },
                            { x: 40, y: 0, tone: "sugar", glow: 0.8 },
                          ]}
                          links={[{ a: 0, b: 1 }]}
                        />
                      ) : (
                        <>
                          <circle cx={-14} cy={0} r={22} fill={C.violetLight} />
                          <circle cx={30} cy={0} r={22} fill={C.violetLight} />
                        </>
                      )}
                    </g>
                  ) : null}
                  <Enzyme x={0} y={0} scale={1} palette={e.pal} variant={e.variant} lod="low" seed={i + 3} temperature={37} opacity={vis} />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* maltose cloud */}
        {pairsVis > 0
          ? pairs.map((p, j) => (
              <g key={j} opacity={pairsVis}>
                <SugarChain rings={p} links={[{ a: 0, b: 1 }]} />
              </g>
            ))
          : null}

        {/* the long starch chain */}
        {chainVis > 0 ? (
          <g transform={jitTransform(cj, [E.xDock, E.y])} opacity={chainVis}>
            <SugarChain rings={chainRings} links={chainLinks} />
            {f >= lastSnap && f < lastSnap + 12 ? (
              <g opacity={1 - prog(f, lastSnap, 12)}>
                <circle cx={E.xDock + E.s * DOCK.cut[0]} cy={E.y} r={16 + 60 * prog(f, lastSnap, 12, out)} fill="none" stroke={C.amberLight} strokeWidth={4} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* hero enzyme */}
        <g transform={jitTransform(ej, [E.xDock, E.y])} opacity={Math.min(1, heroVis)}>
          <g transform={`translate(${ex} ${E.y}) scale(${bump}) translate(${-ex} ${-E.y})`}>
            <Enzyme x={ex} y={E.y} scale={E.s} still unfold={unfold} showSite={showSite} seed={7} />
          </g>
        </g>

        {/* ghost outline */}
        {ghostVis > 0 ? (
          <g opacity={ghostVis} transform={`translate(${E.xDock + ghostX + ej.dx} ${E.y + ej.dy}) scale(${E.s})`}>
            <path d={ENZ_PATH} fill="none" stroke={C.paper} strokeWidth={3.5 / E.s} strokeDasharray={`${12 / E.s} ${10 / E.s}`} />
          </g>
        ) : null}
      </g>

      {/* ---------------- screen-space text */}
      <Scrim opacity={window01(f, k.every + 10, k.protein + 10, 16)} />
      <Label anchor={heroTop} at={[heroTop[0] - 120, heroTop[1] - 120]} text="amylase" sub="made in your salivary glands" align="end" color={C.tealLight} progress={prog(f, sc.word("amylase", 1, -2), 22)} opacity={1 - prog(f, k.maltose - 10, 12)} />
      {pair0 ? (
        <Label anchor={maltAnchor} at={[maltAnchor[0] + 60, maltAnchor[1] - 110]} text="maltose" sub="two glucose units" color={C.amberLight} progress={prog(f, sc.word("maltose", 1, -2), 22)} opacity={1 - prog(f, k.catalyst, 12)} />
      ) : null}
      <Keyword x={W / 2} y={H - 110} text="carbohydrase" size={64} color={C.tealLight} progress={prog(f, sc.word("carbohydrase", 1, -2), 14) * (1 - prog(f, k.maltose + 20, 10))} />
      <SweetnessMeter x={W - 520} y={140} value={sweetV} opacity={window01(f, k.sweet - 4, k.every + 16, 12)} />
      <Keyword x={W / 2} y={H - 110} text="biological catalyst" size={68} progress={prog(f, sc.word("catalyst", 1, -2), 14) * (1 - prog(f, k.used - 4, 10))} />
      {ghostVis > 0 ? (
        <Label anchor={ghostAnchor} at={[ghostAnchor[0] + 60, ghostAnchor[1] - 120]} text="unchanged" progress={prog(f, k.used + 8, 20)} opacity={1 - prog(f, k.every + 6, 10)} />
      ) : null}
      <Keyword x={W / 2} y={H - 110} text="nearly every reaction in your body" size={60} progress={prog(f, sc.word("every", 1, -2), 14) * (1 - prog(f, k.without - 6, 10))} />
      <g opacity={prog(f, k.without + 4, 14) * (1 - prog(f, k.protein - 6, 10))}>
        <Hourglass x={W / 2 - 520} y={H - 128} size={86} color={C.coral} sand={prog(f, k.without, 90) * 0.4} />
        <text x={W / 2 + 40} y={H - 110} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={60} fill={C.paper}>
          without enzymes: far too slow
        </text>
      </g>
      <Keyword x={W / 2} y={150} text="protein" size={72} color={C.tealLight} progress={prog(f, sc.word("proteins", 1, -2), 14) * (1 - prog(f, k.shape - 10, 12))} />
      {unfold > 0.2 ? (
        <Label
          anchor={S([E.xDock - 420, E.y + 60])}
          at={[S([E.xDock - 420, E.y + 60])[0] - 30, S([E.xDock - 420, E.y + 60])[1] + 180]}
          text="amino acids"
          sub="linked in a chain"
          align="end"
          progress={prog(f, sc.word("amino", 1, -2), 22)}
          opacity={1 - prog(f, k.fold + 30, 12)}
        />
      ) : null}
    </Stage>
  );
};
