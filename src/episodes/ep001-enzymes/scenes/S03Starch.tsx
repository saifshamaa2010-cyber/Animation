/**
 * S03 · Starch. A continuous "powers of ten" zoom from the cracker's surface down to its molecules
 * (scale bar 1 mm → 1 µm → 1 nm) — the only big camera move in the episode, and it explains scale.
 * Starch = a very long chain of glucose. A free glucose glows sweet; locked into the chain, it doesn't.
 * The links are tough: water jostles one for "millions of years" and it holds.
 */
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, EASE, H, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Background } from "../../../components/Background";
import { Cracker } from "../../../components/Cracker";
import { Label } from "../../../components/Label";
import { Link, Ring, SugarChain } from "../../../components/SugarChain";
import { SweetnessMeter } from "../../../components/SweetnessMeter";
import { SPACING } from "../../../components/molecule-geometry";
import { Counter, DepthMolecules, Hourglass, ScaleBar, Water } from "../../../components/kit";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, window01 } from "../../../lib/motion";
import { track } from "../../../lib/track";
import { toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s03Timing } from "./S03Starch.timing";

const Z_MAX = 220;
const MAIN_END = 1350; // world x of the main chain's free right end
const MAIN_Y = 540;
const N_MAIN = 64;
const LINK_I = 3; // the link we zoom in on (between ring 3 and 4 from the right end)

const mainRing = (i: number): Ring => ({
  x: MAIN_END - i * SPACING,
  y: MAIN_Y + Math.sin(i * 0.38) * 24,
  rot: Math.cos(i * 0.38) * 6,
});

/** A tangle of other starch chains around the main one (they resolve out of the zoom). */
const OTHERS = [
  { y: 250, a: -7, ph: 1.2, x0: -2600, n: 80 },
  { y: 820, a: 6, ph: 2.5, x0: -2400, n: 80 },
  { y: 40, a: 4, ph: 0.4, x0: -2000, n: 70 },
  { y: 1040, a: -5, ph: 3.1, x0: -2200, n: 74 },
  { y: -230, a: 9, ph: 4.0, x0: -1800, n: 66 },
  { y: 1320, a: -8, ph: 0.9, x0: -2500, n: 80 },
].map((c) => {
  const ca = Math.cos((c.a * Math.PI) / 180);
  const sa = Math.sin((c.a * Math.PI) / 180);
  const rings: Ring[] = Array.from({ length: c.n }, (_, i) => {
    const along = c.x0 + i * SPACING;
    const off = Math.sin(i * 0.4 + c.ph) * 26;
    return { x: 960 + along * ca - off * sa, y: c.y + along * sa + off * ca, rot: c.a };
  });
  const links: Link[] = rings.slice(1).map((_, i) => ({ a: i, b: i + 1 }));
  return { rings, links };
});

/**
 * Far-field starch: many long strands drawn as cheap lines. From far away a tangle of starch reads
 * as fibres; as we zoom in, the central strands sharpen into the detailed glucose rings above.
 */
const STRANDS = (() => {
  const out: string[] = [];
  const all = [...OTHERS.map((o) => o.rings), Array.from({ length: N_MAIN }, (_, i) => mainRing(i))];
  for (const rings of all) {
    const pts = rings.map((r) => `${r.x.toFixed(0)},${r.y.toFixed(0)}`);
    out.push(`M${pts.join(" L")}`);
  }
  for (let j = -20; j <= 22; j++) {
    const y0 = 540 + j * 230 + ((j * 97) % 80);
    const a = ((j * 37) % 13) - 6;
    const pts: string[] = [];
    for (let i = 0; i <= 175; i++) {
      const x = -14000 + i * 160;
      const y = y0 + x * Math.tan((a * Math.PI) / 180) + Math.sin(i * 0.5 + j) * 40;
      pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
    }
    out.push(`M${pts.join(" L")}`);
  }
  return out;
})();

export const S03Starch: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s03Timing(sc);
  const out = EASE.out;

  // ---- the zoom: one continuous exponential scale change
  const zt = interpolate(f, [k.zoom, k.zoomEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  const Z = Math.exp(Math.log(Z_MAX) * zt);
  const macroVis = 1 - interpolate(Z, [14, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const microVis = interpolate(Z, [9, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // detail ramps: strands (cheap lines) first, then real rings
  const detail = interpolate(Z, [70, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const strandsVis = microVis * (1 - interpolate(Z, [120, 210], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const fibreVis = interpolate(Z, [5, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const focus = { x: 1010, y: 560 }; // the point on the cracker we dive into

  // ---- micro camera after landing
  const microCam = camAt(f, [
    { f: k.zoomEnd, x: 980, y: MAIN_Y, z: 1 },
    { f: k.count - 4, x: 980, y: MAIN_Y, z: 1 },
    { f: k.count + 60, x: 700, y: MAIN_Y, z: 0.5 },
    { f: k.notSweet - 10, x: 700, y: MAIN_Y, z: 0.5 },
    { f: k.notSweet + 40, x: 1180, y: MAIN_Y - 40, z: 1.05 },
    { f: k.links - 4, x: 1180, y: MAIN_Y - 40, z: 1.05 },
    { f: k.links + 40, x: MAIN_END - (LINK_I + 0.5) * SPACING, y: MAIN_Y - 50, z: 2.1 },
  ]);
  const zoomingCam = { x: 960 + (980 - 960) * zt, y: 540, z: (Z / Z_MAX) * 1 };
  const cam = f < k.zoomEnd ? zoomingCam : microCam;
  const S = (p: readonly [number, number]) => toScreen(cam, p);

  // ---- free glucose: sweet on its own, not sweet once locked into the chain
  const freeIn = prog(f, k.sugar - 10, 24);
  const joinT = prog(f, k.locked + 2, 14, EASE.inOut);
  const joinedRing = mainRing(-1);
  const freeX = track(f, [[k.sugar - 10, MAIN_END + 420], [k.sugar + 14, MAIN_END + 260, out], [k.locked + 2, MAIN_END + 230], [k.locked + 16, joinedRing.x, EASE.inOut]]);
  const freeY = track(f, [[k.sugar - 10, MAIN_Y - 330], [k.sugar + 14, MAIN_Y - 220, out], [k.locked + 2, MAIN_Y - 200], [k.locked + 16, joinedRing.y, EASE.inOut]]);
  const freeGlow = freeIn * (1 - prog(f, k.locked + 12, 18));
  const sweetV = track(f, [[k.sugar - 4, 0], [k.sugar + 18, 0.42, out], [k.locked + 12, 0.42], [k.locked + 30, 0, EASE.inOut]]);

  // ---- the main chain (+ the joined ring)
  const rings: Ring[] = Array.from({ length: N_MAIN }, (_, i) => mainRing(i));
  const pulseX = track(f, [[k.linked, MAIN_END + 200], [k.linked + 40, MAIN_END - 30 * SPACING]]);
  const linkHi = window01(f, k.links, k.end + 10, 10) * (0.7 + 0.3 * Math.sin(f * 0.35));
  const links: Link[] = rings.slice(1).map((_, i) => {
    const mx = (rings[i].x + rings[i + 1].x) / 2;
    const travel = f >= k.linked && f < k.linked + 52 ? Math.max(0, 1 - Math.abs(mx - pulseX) / 200) : 0;
    return { a: i, b: i + 1, highlight: Math.max(travel, i === LINK_I ? linkHi : 0) };
  });
  const allRings: Ring[] = freeIn > 0 ? [...rings, { x: freeX, y: freeY, rot: 0, tone: freeGlow > 0.05 ? "sugar" : "starch", glow: freeGlow }] : rings;
  const allLinks: Link[] = joinT > 0 ? [...links, { a: 0, b: N_MAIN, opacity: joinT }] : links;
  const othersBlur = interpolate(f, [k.zoomEnd, k.zoomEnd + 40], [0, 7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- water jostling the link: it holds
  const lx = MAIN_END - (LINK_I + 0.5) * SPACING;
  const ly = MAIN_Y + 10;
  const waters = [0, 1, 2, 3, 4].map((i) => {
    const period = 46 + i * 7;
    const local = f - k.aeons - i * 9;
    if (local < 0) return null;
    const u = (local % period) / period;
    const ang = (i / 5) * Math.PI * 2 + 0.6;
    const dist = 70 + 150 * Math.abs(Math.cos(u * Math.PI)); // in → touch → out
    return { x: lx + Math.cos(ang) * dist, y: ly + Math.sin(ang) * dist * 0.8, touch: dist < 80 ? 1 - (dist - 70) / 10 : 0, i, rot: u * 120 };
  });
  const years = track(f, [[k.aeons + 4, 0], [k.end - 6, 1_000_000, EASE.in]]);
  const stakes = prog(f, k.aeons + 4, 16);

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: 1 - microVis * 0.999 }}>
        <Background tone="warm" lightX={0.5} lightY={0.5} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: microVis }}>
        <Background particles={30} lightX={0.55} />
      </AbsoluteFill>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* macro: the cracker, zoomed into */}
        {macroVis > 0 ? (
          <g opacity={macroVis} transform={`translate(${W / 2} ${H / 2}) scale(${Z}) translate(${-focus.x} ${-focus.y})`}>
            <Cracker x={960} y={540} size={760} rotate={-6} />
            {fibreVis > 0 ? (
              <g opacity={fibreVis * 0.55} transform={`translate(${focus.x} ${focus.y}) scale(${1 / Z_MAX}) translate(${-960} ${-540})`}>
                {STRANDS.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#FFF1D2" strokeWidth={26} strokeLinejoin="round" />
                ))}
              </g>
            ) : null}
          </g>
        ) : null}

        {/* micro: starch molecules */}
        {microVis > 0 ? (
          <g opacity={microVis} transform={camTransform(cam)}>
            {strandsVis > 0 ? (
              <g opacity={strandsVis}>
                {STRANDS.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke={C.cream} strokeWidth={26} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
                ))}
              </g>
            ) : null}
            <g opacity={detail}>
            <g style={{ filter: othersBlur > 0.1 ? `blur(${othersBlur}px)` : undefined }} opacity={1 - prog(f, k.zoomEnd, 40) * 0.55}>
              {OTHERS.map((o, i) => (
                <SugarChain key={i} rings={o.rings} links={o.links} />
              ))}
            </g>
            <SugarChain rings={allRings} links={allLinks} />
            </g>
            {f >= k.aeons
              ? waters.map((w) =>
                  w ? (
                    <g key={w.i}>
                      <Water x={w.x} y={w.y} scale={0.9} rotate={w.rot} still />
                      {w.touch > 0 ? <circle cx={(w.x + lx) / 2} cy={(w.y + ly) / 2} r={14 + 10 * w.touch} fill="none" stroke={C.paper} strokeOpacity={0.5 * w.touch} strokeWidth={2} /> : null}
                    </g>
                  ) : null,
                )
              : null}
          </g>
        ) : null}
        {microVis > 0.5 ? <DepthMolecules count={4} seed={33} kind="glucose" opacity={0.3 * microVis} /> : null}

        {/* screen-space annotations */}
        <Label anchor={[1120, 470]} at={[1360, 300]} text="starch" progress={prog(f, k.starchLabel, 20)} opacity={1 - prog(f, k.zoom + 4, 8)} />
        <ScaleBar x={240} y={H - 150} length={200} labels={["1 mm", "1 µm", "1 nm"]} step={2 * zt} progress={window01(f, k.zoom - 6, k.count + 30, 10)} />
        {f > k.zoomEnd ? (
          <g opacity={window01(f, k.count - 2, k.notSweet - 8, 12)}>
            <Counter x={W / 2} y={H - 150} value={track(f, [[k.count, 0], [k.count + 70, 1000, EASE.inOut]])} size={80} suffix="+ glucose" speed={0.4} />
          </g>
        ) : null}
        {f > k.zoomEnd ? (
          <Label
            anchor={S([mainRing(6).x, mainRing(6).y - 34])}
            at={[S([mainRing(6).x, mainRing(6).y - 34])[0] - 40, 200]}
            text="glucose"
            align="end"
            progress={prog(f, sc.word("glucose", 1, -2), 20)}
            opacity={1 - prog(f, k.notSweet - 6, 10)}
          />
        ) : null}
        <SweetnessMeter x={W - 560} y={150} value={sweetV} opacity={window01(f, k.sugar - 6, k.links, 12)} />
        {freeIn > 0 ? (
          <>
            <Label
              anchor={S([freeX + 30, freeY - 30])}
              at={[S([freeX + 30, freeY - 30])[0] - 40, S([freeX + 30, freeY - 30])[1] - 110]}
              align="end"
              text="on its own: sweet"
              color={C.amberLight}
              progress={prog(f, k.sugar, 18)}
              opacity={1 - prog(f, k.locked + 4, 8)}
            />
            <Label
              anchor={S([joinedRing.x - 40, joinedRing.y + 34])}
              at={[S([joinedRing.x - 40, joinedRing.y + 34])[0] - 30, S([joinedRing.x - 40, joinedRing.y + 34])[1] + 150]}
              text="in a chain: not sweet"
              align="end"
              progress={prog(f, k.locked + 16, 18)}
              opacity={1 - prog(f, k.links - 6, 10)}
            />
          </>
        ) : null}
        {stakes > 0 ? (
          <g opacity={stakes}>
            <Hourglass x={W - 330} y={250} size={210} sand={prog(f, k.aeons, 150) * 0.3} progress={stakes} />
            <Counter x={W - 330} y={450} value={years} size={60} suffix=" years" speed={years > 0 && years < 1_000_000 ? 1 : 0} />
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
