/**
 * S05 · Active site, lock & key, specificity.
 * The quality bar for the episode: every beat is locked to the spoken word that motivates it.
 */
import React from "react";
import { C, EASE, H, W } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Enzyme } from "../../../components/Enzyme";
import { Link, Ring, SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label, Keyword } from "../../../components/Label";
import { Cross, PaperSheet } from "../../../components/Icons";
import { HandTick, StrikeThrough, textBox } from "../../../components/kit";
import { DOCK, ENZYME_REST, POCKET_INDICES } from "../../../components/molecule-geometry";
import { roundedPolygon } from "../../../lib/geometry";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { track, pulse } from "../../../lib/track";
import { blendJit, jit, jitTransform, moveRings, toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { DepthMolecules } from "../../../components/kit";
import { s05Timing } from "./S05ActiveSite.timing";

const E = { x: 1200, y: 560, s: 1.6 } as const;
const PIVOT = [E.x, E.y] as const;

/** The pocket's inner walls, closed with a straight entry channel: the lock's keyhole. */
const KEYHOLE_PTS = [
  [-190, 30] as const,
  ...POCKET_INDICES.slice(1, -1).map((i) => ENZYME_REST[i]),
  [-190, -30] as const,
];
const POCKET_SHAPE = roundedPolygon(KEYHOLE_PTS, KEYHOLE_PTS.map((_, i) => (i === 0 || i === KEYHOLE_PTS.length - 1 ? 2 : 6)));

export const S05ActiveSite: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s05Timing(sc);
  const amp = thermalAmplitude(37) * 0.8;
  const out = EASE.out;

  // ---- camera: only moves to shift focus (pocket → bond → products → lock & key → misfit)
  const cam = camAt(f, [
    { f: -12, x: 1090, y: 545, z: 1.0 },
    { f: k.site + 8, x: 1090, y: 545, z: 1.0 },
    { f: k.site + 64, x: 1020, y: 540, z: 1.15 },
    { f: k.held - 2, x: 1010, y: 545, z: 1.15 },
    { f: k.held + 46, x: 965, y: 560, z: 1.32 },
    { f: k.snap + 10, x: 965, y: 560, z: 1.32 },
    { f: k.release + 44, x: 930, y: 520, z: 1.02 },
    { f: k.lock - 4, x: 930, y: 520, z: 1.02 },
    { f: k.lock + 46, x: 1580, y: 545, z: 0.8 },
    { f: k.cell - 6, x: 1580, y: 545, z: 0.8 },
    { f: k.cell + 54, x: 1050, y: 545, z: 1.0 },
    { f: k.diff + 4, x: 1050, y: 545, z: 1.0 },
    { f: k.diff + 44, x: 930, y: 555, z: 1.2 },
  ]);

  // ---- enzyme: jiggles at body temperature; tiny settle when something docks, flinch at the snap
  const ej = jit("E05", f, amp);
  const bump =
    1 + 0.016 * pulse(f, k.dock - 2, 12) + 0.012 * pulse(f, k.fit2 - 2, 12) - 0.01 * pulse(f, k.snap, 8) - 0.006 * pulse(f, k.snap2, 8);
  const siteVis = Math.max(
    window01(f, sc.word("active", 1, -2), k.held + 6, 12),
    window01(f, k.lock + 6, k.specific + 30, 12),
    window01(f, k.diff, k.end + 30, 10),
  );

  // ---- chain 1: arrives, docks on "fits", bond strains on "held", snaps on "Snap"
  const dock1 = prog(f, k.dock - 16, 16) * (1 - prog(f, k.snap, 12));
  const c1 = dockedChain(9, E.x, E.y, E.s, { wave: 1.6 * Math.sin(f * 0.07) * (1 - prog(f, k.dock - 16, 16) * 0.7) });
  const ax = track(f, [[k.sub - 44, -1150], [k.sub + 56, -330, out], [k.dock - 16, -290], [k.dock, 0, out], [k.snap, 0], [k.snap + 10, -64, EASE.snap], [k.next + 30, -420], [k.lock + 10, -1100, EASE.in]]);
  const ay = track(f, [[k.sub - 44, 230], [k.sub + 56, 40, out], [k.dock - 16, 18], [k.dock, 0, out], [k.snap, 0], [k.snap + 10, 24, EASE.snap], [k.next + 30, 280], [k.lock + 10, 560, EASE.in]]);
  const arot = track(f, [[k.sub - 44, -12], [k.sub + 56, -3, out], [k.dock, 0, out], [k.snap + 10, 4], [k.lock, 10]]);
  const mx = track(f, [[k.release - 8, 0], [k.release + 18, -200], [k.next + 40, -300, out], [k.lock + 50, -900, EASE.in]]);
  const my = track(f, [[k.release - 8, 0], [k.release + 4, 0], [k.release + 42, -240, out], [k.lock + 50, -1100, EASE.in]]);
  const mrot = track(f, [[k.release, 0], [k.release + 42, -16, out], [k.lock + 40, -30]]);
  const freed = f >= k.snap + 3;
  const maltoseGlow = prog(f, k.snap + 3, 18);
  const strain = window01(f, k.held + 12, k.snap + 3, 10) * (0.75 + 0.25 * Math.sin(f * 0.55));
  const shiver = strain * 1.6;
  const chainA = moveRings(c1.rings.slice(0, 7), ax, ay, arot);
  const malt = moveRings(c1.rings.slice(7), freed ? mx : ax, freed ? my : ay, freed ? mrot : arot, freed ? undefined : [chainA[3].x, chainA[3].y]).map(
    (r, i): Ring => ({
      ...r,
      x: r.x + (strain ? Math.sin(f * 1.7 + i) * shiver : 0),
      tone: freed ? "sugar" : "starch",
      glow: maltoseGlow,
    }),
  );
  const rings1 = [...chainA, ...malt];
  const links1: Link[] = c1.links.map((l, i) =>
    i === 6 ? { ...l, highlight: strain, broken: prog(f, k.snap, 6, EASE.snap), opacity: 1 - prog(f, k.snap + 10, 8) } : l,
  );
  const cj1 = blendJit(jit("C1", f, amp * 1.2), ej, dock1);

  // ---- chain 2: "free for the next one", docks in parallel with the key, then is snipped again
  const dock2 = prog(f, k.fit2 - 16, 16) * (1 - prog(f, k.snap2, 12));
  const c2 = dockedChain(8, E.x, E.y, E.s, { wave: 1.4 * Math.sin(f * 0.06 + 1) * (1 - prog(f, k.fit2 - 16, 16) * 0.7) });
  const bx = track(f, [[k.next - 6, -1250], [k.next + 74, -300, out], [k.fit2 - 16, -280], [k.fit2, 0, out], [k.snap2, 0], [k.snap2 + 10, -60, EASE.snap], [k.cell + 20, -1000, EASE.in]]);
  const by = track(f, [[k.next - 6, 330], [k.next + 74, 30, out], [k.fit2 - 16, 14], [k.fit2, 0, out], [k.snap2, 0], [k.snap2 + 10, 22, EASE.snap], [k.cell + 20, 520, EASE.in]]);
  const freed2 = f >= k.snap2 + 3;
  const m2x = track(f, [[k.snap2 + 10, 0], [k.snap2 + 34, -200], [k.cell + 40, -900, EASE.in]]);
  const m2y = track(f, [[k.snap2 + 10, 0], [k.snap2 + 50, -260, out], [k.cell + 40, -1100, EASE.in]]);
  const chainB = moveRings(c2.rings.slice(0, 6), bx, by);
  const malt2 = moveRings(c2.rings.slice(6), freed2 ? m2x : bx, freed2 ? m2y : by, freed2 ? -14 * prog(f, k.snap2 + 10, 30) : 0).map(
    (r): Ring => ({ ...r, tone: freed2 ? "sugar" : "starch", glow: prog(f, k.snap2 + 3, 18) }),
  );
  const links2: Link[] = c2.links.map((l, i) =>
    i === 5 ? { ...l, broken: prog(f, k.snap2, 6, EASE.snap), opacity: 1 - prog(f, k.snap2 + 10, 8) } : l,
  );
  const cj2 = blendJit(jit("C2", f, amp * 1.2), ej, dock2);
  const showC2 = f > k.next - 8 && f < k.cell + 34;

  // ---- cellulose: also glucose, but the links zig-zag — tries the pocket and bounces off
  const cx = track(f, [[k.cell - 10, -1250], [k.cell + 84, -360, out], [k.bounce - 16, -320], [k.bounce, -92, EASE.in], [k.bounce + 18, -440, out]]);
  const cy = track(f, [[k.cell - 10, 260], [k.cell + 84, -12, out], [k.bounce, 6], [k.bounce + 18, 80, out]]);
  const crot = track(f, [[k.bounce, 0], [k.bounce + 18, -9, out]]);
  const cc = dockedChain(8, E.x, E.y, E.s, { cellulose: true, wave: 1.2 * Math.sin(f * 0.065 + 2) });
  const cellRings = moveRings(cc.rings, cx, cy, crot);
  const zig = window01(f, sc.word("joined", 1, -4), k.end + 20, 10);
  const cellLinks: Link[] = cc.links.map((l, i) => (i >= 4 ? { ...l, highlight: zig * (0.7 + 0.3 * Math.sin(f * 0.3 + i)) } : l));
  const cj3 = jit("C3", f, amp * 1.2);
  const showCell = f > k.cell - 12;

  // ---- lock & key: drawn from the SAME pocket outline and the SAME two glucose rings
  const lkVis = window01(f, k.lock + 8, k.cell + 6, 14);
  const keyX = track(f, [[k.lock + 8, -190], [k.fit2 - 16, -170], [k.fit2, 0, out]]);
  const L = { x: 2330, y: 560, s: 1.4 };

  // ---- snap spark (in enzyme space)
  const spark = (start: number) => {
    const p = prog(f, start, 12, out);
    if (f < start || p >= 1) return null;
    const cxp = E.x + E.s * DOCK.cut[0];
    return (
      <g opacity={1 - p}>
        <circle cx={cxp} cy={E.y} r={14 + 60 * p} fill="none" stroke={C.amberLight} strokeWidth={4 * (1 - p) + 1} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.3;
          return (
            <line
              key={i}
              x1={cxp + Math.cos(a) * (20 + 40 * p)}
              y1={E.y + Math.sin(a) * (20 + 40 * p)}
              x2={cxp + Math.cos(a) * (34 + 70 * p)}
              y2={E.y + Math.sin(a) * (34 + 70 * p)}
              stroke={C.amberLight}
              strokeWidth={5}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    );
  };

  // ---- labels (screen space, so type stays a consistent size while the camera moves)
  const S = (p: readonly [number, number]) => toScreen(cam, p);
  const lipTop = S([E.x + E.s * -120 + ej.dx, E.y + E.s * -40 + ej.dy]);
  const subAnchor = S([chainA[4].x + cj1.dx, chainA[4].y + 34 + cj1.dy]);
  const maltAnchor = S([malt[0].x + 40 + cj1.dx, malt[0].y - 40 + cj1.dy]);
  const cellTail = S([cellRings[3].x + cj3.dx, cellRings[3].y - 40 + cj3.dy]);
  const zigAnchor = S([(cellRings[5].x + cellRings[6].x) / 2 + cj3.dx, cellRings[5].y + 30 + cj3.dy]);

  return (
    <Stage bg={{ particles: 46, lightX: 0.55 }}>
      <defs>
        <filter id="s05glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <g transform={camTransform(cam)}>
        {/* lock & key (off to the right of the world; the camera pans to it) */}
        {lkVis > 0 ? (
          <g opacity={lkVis} transform={`translate(${L.x} ${L.y}) scale(${L.s})`}>
            <path d="M -60,-150 V -230 A 110 110 0 0 1 160,-230 V -150" fill="none" stroke={C.ink400} strokeWidth={26} strokeLinecap="round" />
            <rect x={-230} y={-160} width={460} height={330} rx={46} fill={C.ink700} />
            <rect x={-230} y={-160} width={460} height={330} rx={46} fill="none" stroke={C.ink400} strokeWidth={5} />
            <rect x={-224} y={-154} width={448} height={60} rx={30} fill={C.paper} opacity={0.05} />
            <g transform="translate(150 0)">
              <path d={POCKET_SHAPE} fill={C.ink950} />
              <path d={POCKET_SHAPE} fill="none" stroke={C.paper} strokeWidth={3} strokeDasharray="9 8" opacity={0.7} />
              <g transform={`translate(${keyX} 0)`}>
                <line x1={DOCK.cut[0] - 210} y1={0} x2={DOCK.cut[0] + 6} y2={0} stroke={C.creamDeep} strokeWidth={16} strokeLinecap="round" />
                <circle cx={DOCK.cut[0] - 262} cy={0} r={52} fill="none" stroke={C.creamDeep} strokeWidth={20} />
                <circle cx={DOCK.cut[0] - 262} cy={0} r={52} fill="none" stroke={C.cream} strokeWidth={6} opacity={0.6} />
                <SugarChain
                  rings={[
                    { x: DOCK.outer[0], y: 0 },
                    { x: DOCK.inner[0], y: 0 },
                  ]}
                  links={[{ a: 0, b: 1 }]}
                />
              </g>
            </g>
          </g>
        ) : null}

        {showCell ? (
          <g transform={jitTransform(cj3, PIVOT)}>
            <SugarChain rings={cellRings} links={cellLinks} />
          </g>
        ) : null}
        {showC2 ? (
          <g transform={jitTransform(cj2, PIVOT)}>
            <SugarChain rings={[...chainB, ...malt2]} links={links2} />
          </g>
        ) : null}
        <g transform={jitTransform(cj1, PIVOT)}>
          <SugarChain rings={rings1} links={links1} />
        </g>

        <g transform={jitTransform(ej, PIVOT)}>
          <g transform={`translate(${E.x} ${E.y}) scale(${bump}) translate(${-E.x} ${-E.y})`}>
            <Enzyme x={E.x} y={E.y} scale={E.s} still showSite={siteVis} seed={7} />
          </g>
          {strain > 0.01 ? (
            <g opacity={strain}>
              <circle cx={E.x + E.s * DOCK.cut[0]} cy={E.y} r={34 + 6 * Math.sin(f * 0.55)} fill={C.amber} opacity={0.28} filter="url(#s05glow)" />
              <circle cx={E.x + E.s * DOCK.cut[0]} cy={E.y} r={22 + 4 * Math.sin(f * 0.55)} fill="none" stroke={C.amberLight} strokeWidth={3} />
            </g>
          ) : null}
          {spark(k.snap)}
          {spark(k.snap2)}
        </g>
      </g>

      <DepthMolecules count={4} seed={51} kind="mixed" opacity={0.3} />
      {/* ---- screen-space annotations */}
      <Label anchor={lipTop} at={[lipTop[0] - 30, lipTop[1] - 190]} text="active site" align="end" progress={prog(f, sc.word("active", 1, -2), 22)} opacity={1 - prog(f, k.complex + 30, 12)} />
      <Label anchor={subAnchor} at={[subAnchor[0] + 60, subAnchor[1] + 170]} text="substrate" sub="starch" align="start" progress={prog(f, sc.word("substrate", 1, -2), 22)} opacity={1 - prog(f, k.held, 12)} />
      <Keyword x={W / 2} y={H - 120} text="enzyme–substrate complex" size={58} progress={prog(f, sc.word("complex", 1, -4), 14) * (1 - prog(f, k.held + 30, 12))} />
      <Label anchor={maltAnchor} at={[maltAnchor[0] - 40, maltAnchor[1] - 120]} text="products" sub="maltose" align="end" color={C.amberLight} progress={prog(f, sc.word("products", 1, -2), 22)} opacity={1 - prog(f, k.lock - 10, 12)} />
      {(() => {
        // "complementary — not the same shape": the exam term, and the classic wrong answer struck out
        const vis = 1 - prog(f, k.specific - 4, 10);
        const y = H - 110;
        const a = textBox("complementary", W / 2 - 300, y, 64, 700, "middle");
        const bx = textBox("same shape", W / 2 + 330, y, 56, 600, "middle");
        const sameAt = sc.word("same", 1, -2);
        return (
          <g opacity={vis}>
            <Keyword x={a.cx} y={y} text="complementary" size={64} color={C.tealLight} progress={prog(f, sc.word("complementary", 1, -4), 14)} />
            <HandTick cx={a.x1 + 56} cy={y - 26} size={70} progress={prog(f, sc.word("complementary", 1, 10), 14, (v) => v)} width={8} seed={12} />
            <Keyword x={bx.cx} y={y} text="same shape" size={56} weight={600} color={C.ink300} progress={prog(f, sameAt - 2, 12)} />
            <StrikeThrough x1={bx.x0 - 8} x2={bx.x1 + 8} y={bx.strikeY} progress={prog(f, sameAt + 8, 12, (v) => v)} width={7} seed={13} />
          </g>
        );
      })()}
      {/* "The enzyme is the lock; the substrate is the key." */}
      {(() => {
        const lockAt = sc.word("lock", 1, -2);
        const keyAt = sc.word("key", 1, -2);
        const vis = 1 - prog(f, k.specific + 10, 10);
        const enzTop = S([E.x + 120 + ej.dx, E.y - E.s * 180 + ej.dy]);
        const keyAnchor = S([chainB[3].x + cj2.dx, chainB[3].y + 36 + cj2.dy]);
        return (
          <g opacity={vis}>
            <Label anchor={enzTop} at={[enzTop[0] + 40, enzTop[1] - 90]} text="lock" color={C.tealLight} progress={prog(f, lockAt, 18)} />
            <Label anchor={keyAnchor} at={[keyAnchor[0] + 40, keyAnchor[1] + 120]} text="key" align="start" color={C.amberLight} progress={prog(f, keyAt, 18)} />
          </g>
        );
      })()}
      <Keyword x={W / 2} y={H - 110} text="specific" size={72} color={C.tealLight} progress={prog(f, sc.word("specific", 1, -2), 14) * (1 - prog(f, k.cell + 10, 12))} />
      {showCell ? (
        <g opacity={prog(f, sc.word("cellulose", 1, -4), 14) * (1 - prog(f, k.diff + 10, 12))}>
          <PaperSheet x={cellTail[0] - 80} y={cellTail[1] - 150} size={100} color={C.paperDim} />
        </g>
      ) : null}
      {showCell ? (
        <Label anchor={cellTail} at={[cellTail[0] + 20, cellTail[1] - 150]} text="cellulose" sub="in paper" progress={prog(f, sc.word("cellulose", 1, -2), 22)} opacity={1 - prog(f, k.diff + 10, 12)} />
      ) : null}
      {showCell ? (
        <Label anchor={zigAnchor} at={[zigAnchor[0] - 40, zigAnchor[1] + 150]} text="different links" align="end" color={C.paper} progress={prog(f, sc.word("joined", 1, -4), 22)} />
      ) : null}
      {f >= k.bounce ? (
        <g opacity={prog(f, k.bounce, 8)}>
          {(() => {
            const p = S([E.x + E.s * -200, E.y - 120]);
            return <Cross x={p[0]} y={p[1]} size={84 + 14 * prog(f, k.bounce, 8, out)} color={C.coral} stroke={11} />;
          })()}
        </g>
      ) : null}
    </Stage>
  );
};
