/**
 * EP002 v2 · S06 — "What does the light actually do?" + the exam tip "transfers, never makes".
 * World: the purple study desk. Chloro (graduation cap) hosts between a taped EXAM TIP sticky note and a
 * glowing lens into the palisade cells, lit by a smiling sun.
 *
 *  0 → {careful}   the lens shows palisade cells; light from the sun is absorbed by chloroplasts
 *                  ("chloroplast", "light energy"); on "transfers energy" one chloroplast passes the
 *                  energy along a swoosh into a glucose ring ("energy in glucose"). Labels clear by {careful}.
 *  {careful}       the EXAM TIP note slaps onto the desk; Chloro turns to it, thinking, then points.
 *  {notMake}       a pen writes "makes energy" as it is said; a red marker strikes it out and crosses it;
 *                  on "Energy can't be made" Chloro is shocked and shouts it in a burst bubble.
 *  {transfers}     "Chlorophyll transfers it": light reaches a chloroplast, it lights up, and the energy
 *                  rides a swoosh arrow into a new glucose ring that glows ("light energy" →
 *                  "energy in glucose").
 *  "So use the syllabus word" the pen writes "transfers energy"; on "transfers" a green marker circles it
 *                  and ticks it; Chloro celebrates, sparkles.
 */
import React, { useContext, useMemo } from "react";
import { C, EASE, W2 } from "../../../brand/tokens";
import { FONT, HAND } from "../../../brand/fonts";
import { WorldStage, Chloro, StickyNote, HandText, Sparkle, handWidth } from "../../../components/fun";
import type { ChloroMood, ChloroPose } from "../../../components/fun";
import { GlowLens, PalisadeCells, palisade } from "../../../components/fun/CellLens";
import { BurstBubble, ImpactLines, MarkerLoop, PaperSlip, Pen, SunBuddy, TopicTag, loopEase, loopPoint, writingTip } from "../../../components/fun/StudyProps";
import { Photon, SunBeams } from "../../../components/Light";
import { Glucose } from "../../../components/SugarChain";
import { HandArrow, HandCross, HandTick, mix, penEase } from "../../../components/kit";
import { Pt, rng } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { SYNC_LEAD, SceneContext, useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s06Timing } from "../scenes/S06Chlorophyll.timing";

// ------------------------------------------------------------------ layout (1920×1080)
const LENS = { x: 1500, y: 500, r: 290 } as const;
const SUN: Pt = [1735, 160];
const NOTE = { x: 120, y: 200, w: 580, h: 630, rot: -3 } as const;
const CH = { x: 955, y: 915, size: 330 } as const;
const PAL = palisade(LENS.r);

// chloroplasts that do the visible transfers (local lens coordinates) and where their glucose forms
const P1 = PAL.nearest([-102, -104]); // left cell (before the excerpt)
const P2 = PAL.nearest([38, -104]); // middle cell: THE transfer
const P3 = PAL.nearest([178, -38]); // right cell (it keeps happening)
const G1: Pt = [-140, 44];
const G2: Pt = [-2, 62];
const G3: Pt = [140, 92];
const SPECIAL = new Set([P1, P2, P3]);

// note-local layout
const W1 = { text: "makes energy", x: 120, y: 262, size: 88 };
const W2a = { text: "transfers", x: 120, y: 440, size: 124 };
const W2b = { text: "energy", x: 120, y: 560, size: 112 };
const w1W = handWidth(W1.text, W1.size);
const w2aW = handWidth(W2a.text, W2a.size);
const w2bW = handWidth(W2b.text, W2b.size);
const LOOP = { cx: W2a.x + w2aW / 2, cy: W2a.y - W2a.size * 0.3, rx: w2aW / 2 + 36, ry: 74 };
const CROSS = { cx: 70, cy: 236, size: 54 };
const TICK = { cx: 66, cy: 414, size: 70 };

const PHOTON_TRAVEL = 18;
const SPARK_TRAVEL = 24;

const lensPt = (p: Pt): Pt => [LENS.x + p[0], LENS.y + p[1]];
const chl = (i: number): Pt => [PAL.chloroplasts[i].x, PAL.chloroplasts[i].y];
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};
/** control point that bows a path from a to b to one side */
const bow = (a: Pt, b: Pt, amt: number): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [(a[0] + b[0]) / 2 + (dy / L) * amt, (a[1] + b[1]) / 2 - (dx / L) * amt];
};
/** a point along a polyline by arc length (for marker tips following HandCross / HandTick strokes) */
const along = (pts: readonly Pt[], t: number): Pt => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = Math.max(0, Math.min(1, t)) * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = segs[i] ? Math.min(1, d / segs[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};
const crossTip = (p: number): Pt => {
  const h = CROSS.size / 2;
  const P = (x: number, y: number): Pt => [CROSS.cx + x * h, CROSS.cy + y * h];
  const a0 = P(-0.92, -0.96);
  const a1 = P(0.96, 0.92);
  const b0 = P(0.9, -1.0);
  const b1 = P(-0.98, 0.9);
  if (p < 0.46) return along([a0, a1], penEase(p / 0.46));
  if (p < 0.56) return along([a1, b0], (p - 0.46) / 0.1);
  return along([b0, b1], penEase((p - 0.56) / 0.44));
};
const tickTip = (p: number): Pt => {
  const h = TICK.size / 2;
  const pts: Pt[] = [
    [-0.86, 0.02],
    [-0.56, 0.32],
    [-0.3, 0.62],
    [-0.16, 0.66],
    [0.1, 0.24],
    [0.5, -0.38],
    [0.92, -0.84],
  ].map(([x, y]) => [TICK.cx + x * h, TICK.cy + y * h]);
  return along(pts, penEase(p));
};

/** One "light → chloroplast → glucose" transfer, all frames scene-relative. */
type Transfer = { land: number; spark: number; ci: number; g: Pt; bowAmt: number };

export const V2S06Tip: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s06Timing(sc);
  const ctx = useContext(SceneContext);
  const gid = useSvgId("v2s06");

  // ---------------------------------------------------------------- spoken words → Chloro's mouth
  const spoken = useMemo(() => {
    if (!ctx) return [] as { a: number; b: number }[];
    return ctx.words
      .filter((w) => w.scene === ctx.scene.id)
      .map((w) => ({ a: Math.round(w.startSec * ctx.fps) - ctx.scene.startFrame - SYNC_LEAD, b: Math.round(w.endSec * ctx.fps) - ctx.scene.startFrame - SYNC_LEAD }));
  }, [ctx]);
  const talk = (() => {
    const w = spoken.find((x) => f >= x.a && f < x.b);
    if (!w) return 0;
    return 0.3 + 0.7 * Math.abs(Math.sin((f - w.a) * 0.55));
  })();

  // ---------------------------------------------------------------- key moments (all on the narration)
  const e5 = sc.word("energy", 5); // "Energy can't be made"
  const wEnd1 = Math.max(k.makes + 12, sc.wordEnd("energy", 4) - 4); // "makes energy" finished
  const wStart1 = k.makes - 8;
  const strikeAt = wEnd1 + 2;
  const crossAt = strikeAt + 14;
  const T = k.transfers; // "Chlorophyll transfers it."
  const so = sc.word("use", 1) - 8; // "So use the syllabus word:"
  const S = k.syllabusWord; // "transfers."
  const wStart2 = so + 2;
  const wEnd2 = Math.max(wStart2 + 24, S - 12);
  const wMid2 = wStart2 + (wEnd2 - wStart2) * 0.6;

  // transfers: before the excerpt (on "transfers energy"), THE one, and a quiet one after it
  const transfers: Transfer[] = [
    { land: k.transfersWord, spark: k.transfersWord + 6, ci: P1, g: G1, bowAmt: 50 },
    { land: T + 14, spark: k.transfersIt - 2, ci: P2, g: G2, bowAmt: 58 },
    { land: so + 10, spark: so + 18, ci: P3, g: G3, bowAmt: 46 },
  ];

  // ambient light: photons from the sun to random chloroplasts (slower while the note has the stage)
  const photons = useMemo(() => {
    const r = rng(91);
    const pool = PAL.visible.filter((i) => !SPECIAL.has(i) && PAL.chloroplasts[i].y < 150);
    const out: { s: number; ci: number; size: number }[] = [];
    for (let s = k.light - PHOTON_TRAVEL + 4; s < k.end; ) {
      const land = s + PHOTON_TRAVEL;
      // the demonstration photons get the stage to themselves
      if (!transfers.some((t) => Math.abs(land - t.land) < 12)) out.push({ s, ci: pool[Math.floor(r() * pool.length)], size: 0.8 });
      s += land > k.careful - 10 && land < T - 10 ? 30 : 13 + Math.floor(r() * 6);
    }
    transfers.forEach((t, i) => out.push({ s: t.land - PHOTON_TRAVEL, ci: t.ci, size: i === 1 ? 1.3 : 1 }));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k.light, k.end, k.careful, T]);

  const glowOf = (ci: number) => {
    let g = 0;
    for (const ph of photons) {
      if (ph.ci !== ci) continue;
      const land = ph.s + PHOTON_TRAVEL;
      g = Math.max(g, pulse(f, land - 2, ph.size > 1 ? 40 : 28) * (ph.size > 1 ? 1 : 0.8));
    }
    return Math.min(1, g);
  };

  // ---------------------------------------------------------------- world
  const sunIn = prog(f, -4, 18);
  const lensOpen = prog(f, 2, 22);
  const cellsIn = prog(f, 8, 40, (v) => v);
  const dim = prog(f, k.careful + 4, 14) * (1 - prog(f, T - 10, 12));
  const sunShine = Math.max(...transfers.map((t) => pulse(f, t.land - PHOTON_TRAVEL - 4, 26)));

  // ---------------------------------------------------------------- Chloro
  type St = { mood: ChloroMood; pose: ChloroPose; flip: boolean; angle: number; look: readonly [number, number]; lean: number; at: number };
  const states: St[] = [
    { at: -100, mood: "explain", pose: "present", flip: false, angle: -20, look: [1, -0.3], lean: 2 },
    { at: k.glucose + 20, mood: "happy", pose: "present", flip: false, angle: -20, look: [1, -0.3], lean: 2 },
    { at: k.careful + 2, mood: "thinking", pose: "chin", flip: false, angle: -20, look: [-1, -0.2], lean: -3 },
    { at: Math.min(k.careful + 34, k.notMake - 6), mood: "explain", pose: "point", flip: true, angle: -30, look: [-1, 0.1], lean: -5 },
    { at: e5, mood: "shocked", pose: "rest", flip: false, angle: -20, look: [-0.6, 0], lean: 0 },
    { at: T, mood: "explain", pose: "point", flip: false, angle: -32, look: [1, -0.5], lean: 4 },
    { at: so, mood: "explain", pose: "point", flip: true, angle: -34, look: [-1, 0], lean: -4 },
    { at: S, mood: "celebrate", pose: "cheer", flip: false, angle: -20, look: [0, 0], lean: 0 },
  ];
  let si = 0;
  states.forEach((s, i) => {
    if (f >= s.at) si = i;
  });
  const st = states[si];
  const bounce = si > 0 && st.at > 0 ? Math.min(1, Math.max(0, (f - st.at) / 14)) : 0;
  const prevLean = si > 0 ? states[si - 1].lean : st.lean;
  const lean = prevLean + (st.lean - prevLean) * prog(f, st.at, 12);

  // ---------------------------------------------------------------- the note
  const noteP = prog(f, k.careful + 1, 11, (v) => v);
  const slap = prog(f, k.careful + 10, 16, (v) => v);
  const write1 = prog(f, wStart1, wEnd1 - wStart1, (v) => v);
  const strike = prog(f, strikeAt, 12, EASE.inOut);
  const cross = prog(f, crossAt, 13, (v) => v);
  const write2a = prog(f, wStart2, wMid2 - wStart2, (v) => v);
  const write2b = prog(f, wMid2 + 2, wEnd2 - wMid2 - 2, (v) => v);
  const loop = prog(f, S - 2, 16, (v) => v);
  const tick = prog(f, S + 16, 12, (v) => v);
  const wordGlow = pulse(f, S, 40);

  // pens (note-local): ink pen writes, red marker corrects, green marker approves
  const pen1In = prog(f, wStart1 - 12, 10) * (1 - prog(f, wEnd1 + 2, 10, EASE.in));
  const pen1Tip = write1 <= 0 ? writingTip(W1.x, W1.y, w1W, W1.size, 0, f) : writingTip(W1.x, W1.y, w1W, W1.size, write1, f);
  const redIn = prog(f, strikeAt - 9, 9) * (1 - prog(f, crossAt + 15, 10, EASE.in));
  const strikeTip: Pt = [W1.x - 8 + (w1W + 16) * strike, W1.y - W1.size * 0.28 + 4];
  const redTip: Pt = cross > 0 ? crossTip(cross) : strikeTip;
  const pen2In = prog(f, wStart2 - 10, 10) * (1 - prog(f, wEnd2 + 2, 10, EASE.in));
  const pen2Tip = write2b > 0 ? writingTip(W2b.x, W2b.y, w2bW, W2b.size, write2b, f) : writingTip(W2a.x, W2a.y, w2aW, W2a.size, write2a, f);
  const greenIn = prog(f, S - 11, 9) * (1 - prog(f, S + 30, 10, EASE.in));
  const greenTip: Pt = tick > 0 ? tickTip(tick) : loopPoint(LOOP.cx, LOOP.cy, LOOP.rx, LOOP.ry, loopEase(loop));

  // ---------------------------------------------------------------- bubble + labels
  const burst = prog(f, e5 + 2, 12, (v) => v) * (1 - prog(f, T + 4, 8, EASE.in));
  const chlLabel = window01(f, k.chloroWord - 2, k.absorb + 4, 12);
  const lightPre = window01(f, k.absorbs, k.glucose + 22, 12);
  const lightNow = prog(f, T, 14);
  const lightLabel = Math.max(lightPre, lightNow);
  const g2Arrive = transfers[1].spark + SPARK_TRAVEL;
  const glucPre = window01(f, k.chemicals - 2, k.glucose + 22, 12);
  const glucNow = prog(f, g2Arrive - 2, 14);
  const glucLabel = Math.max(glucPre, glucNow);
  const glucTarget = f < k.careful ? G1 : G2;

  // sparkles when "transfers" is circled
  const SPARKS: { p: Pt; r: number; d: number }[] = [
    { p: [NOTE.x + LOOP.cx + LOOP.rx + 10, NOTE.y + LOOP.cy - 70], r: 26, d: 0 },
    { p: [NOTE.x + LOOP.cx - LOOP.rx + 4, NOTE.y + LOOP.cy - 88], r: 18, d: 4 },
    { p: [NOTE.x + LOOP.cx + LOOP.rx + 40, NOTE.y + LOOP.cy + 22], r: 16, d: 7 },
    { p: [CH.x - 150, CH.y - 330], r: 22, d: 3 },
    { p: [CH.x + 160, CH.y - 300], r: 26, d: 6 },
    { p: [CH.x + 120, CH.y - 400], r: 14, d: 9 },
  ];

  return (
    <WorldStage world="desk">
      <defs>
        <filter id={`${gid}-soft`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      <TopicTag n={1} title="What is photosynthesis?" progress={prog(f, -6, 16)} />

      {/* ============ sunlight onto the lens ============ */}
      <SunBeams source={SUN} beams={[[[1260, 330], [1640, 700]]]} on={0.55 * lensOpen} fadeTo={[1300, 800]} />

      {/* ============ the lens: palisade cells ============ */}
      <GlowLens x={LENS.x} y={LENS.y} r={LENS.r} open={lensOpen} dim={dim}>
        <PalisadeCells r={LENS.r} appear={cellsIn} glowOf={glowOf}>
          {transfers.map((t, i) => {
            const from = chl(t.ci);
            const ctrl = bow(from, t.g, t.bowAmt);
            const arrive = t.spark + SPARK_TRAVEL;
            // the pre-excerpt glucose stays (dimmer); its arrow clears before the exam tip
            const arrowOut = i === 0 ? 1 - prog(f, k.glucose + 10, 12) : 1;
            const draw = prog(f, t.land, 16, (v) => v);
            const gIn = prog(f, arrive - 3, 14);
            const glow =
              gIn > 0
                ? Math.min(1, (i === 1 ? 0.55 : 0.3) + 0.6 * pulse(f, arrive - 3, 34) + (f >= S - 2 ? 0.45 * pulse(f, S - 2 + i * 4, 40) : 0))
                : 0;
            const sp = (f - t.spark) / SPARK_TRAVEL;
            const sparkPt = sp > 0 && sp < 1 ? quad(from, ctrl, t.g, EASE.inOut(sp)) : null;
            const sparkCol = mix(C.sun, C.amber, Math.max(0, Math.min(1, sp)));
            // arrowhead: stop short of the ring
            const endT = 0.78;
            const tip = quad(from, ctrl, t.g, endT);
            const pre = quad(from, ctrl, t.g, endT - 0.08);
            const ang = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
            const head = (s: number) => [tip[0] + Math.cos(ang + s * 2.5) * 16, tip[1] + Math.sin(ang + s * 2.5) * 16];
            const pathD = (() => {
              const n = 24;
              return Array.from({ length: n + 1 }, (_, j) => quad(from, ctrl, t.g, (j / n) * endT))
                .map((q, j) => `${j ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`)
                .join("");
            })();
            return (
              <g key={i}>
                {draw > 0 && arrowOut > 0 ? (
                  <g opacity={arrowOut * (i === 2 ? 0.75 : 1)}>
                    <path d={pathD} fill="none" stroke={C.sun} strokeOpacity={0.35} strokeWidth={14} strokeLinecap="round" filter={`url(#${gid}-soft)`} pathLength={1} strokeDasharray={`${draw} 1`} />
                    <path d={pathD} fill="none" stroke={C.amberLight} strokeWidth={5} strokeLinecap="round" strokeDasharray="3 13" pathLength={undefined} opacity={draw >= 1 ? 1 : 0} />
                    {draw < 1 ? <path d={pathD} fill="none" stroke={C.amberLight} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 1`} /> : null}
                    {draw >= 1 ? (
                      <path d={`M${head(1)[0]},${head(1)[1]} L${tip[0]},${tip[1]} L${head(-1)[0]},${head(-1)[1]}`} fill="none" stroke={C.amberLight} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                    ) : null}
                  </g>
                ) : null}
                {gIn > 0 ? (
                  <g>
                    <circle cx={t.g[0]} cy={t.g[1]} r={30 + 40 * prog(f, arrive - 2, 20)} fill="none" stroke={C.amberLight} strokeWidth={4} opacity={0.9 * (1 - prog(f, arrive - 2, 20))} />
                    <Glucose x={t.g[0]} y={t.g[1]} tone="sugar" glow={glow} scale={(i === 1 ? 1.25 : 1.05) * (0.6 + 0.4 * EASE.out(gIn)) * (1 + 0.08 * pulse(f, arrive - 3, 20))} opacity={Math.min(1, gIn * 1.6)} />
                  </g>
                ) : null}
                {sparkPt ? (
                  <g>
                    <circle cx={sparkPt[0]} cy={sparkPt[1]} r={20} fill={sparkCol} opacity={0.55} filter={`url(#${gid}-soft)`} />
                    <circle cx={sparkPt[0]} cy={sparkPt[1]} r={9} fill={mix(sparkCol, "#FFFFFF", 0.55)} />
                  </g>
                ) : null}
              </g>
            );
          })}
        </PalisadeCells>
      </GlowLens>

      {/* light travelling from the sun to the chloroplasts (straight lines) */}
      {photons.map((ph, i) => {
        const to = lensPt(chl(ph.ci));
        const dx = to[0] - SUN[0];
        const dy = to[1] - SUN[1];
        const d = Math.hypot(dx, dy);
        const from: Pt = [SUN[0] + (dx / d) * 64, SUN[1] + (dy / d) * 64];
        return <Photon key={i} from={from} to={to} p={(f - ph.s) / PHOTON_TRAVEL} size={ph.size} />;
      })}
      <SunBuddy x={SUN[0]} y={SUN[1]} r={58} progress={sunIn} shine={sunShine} />

      {/* ============ labels on the lens ============ */}
      <PaperSlip x={1190} y={262} w={290} h={84} rotate={-4} progress={chlLabel} tape="left">
        <text y={20} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={60} fill={W2.inkText}>
          chloroplast
        </text>
      </PaperSlip>
      {chlLabel > 0 ? (
        <HandArrow from={[1290, 300]} to={lensPt(chl(PAL.nearest([-178, -62])))} progress={prog(f, k.chloroWord + 4, 14, (v) => v)} color={C.paper} width={5} bend={-0.25} gapEnd={26} opacity={chlLabel} seed={4} />
      ) : null}
      <PaperSlip x={1286} y={150} w={300} h={84} rotate={-3} progress={lightLabel} tape="left" color={mix(C.amberLight, "#FFFFFF", 0.35)}>
        <text y={20} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={60} fill={W2.inkText}>
          light energy
        </text>
      </PaperSlip>
      {lightLabel > 0 ? (
        <HandArrow
          from={[1446, 158]}
          to={[1588, 236]}
          progress={Math.max(prog(f, k.absorbs + 6, 14, (v) => v) * lightPre, prog(f, T + 6, 14, (v) => v))}
          color={C.paper}
          width={5}
          bend={-0.25}
          opacity={lightLabel}
          seed={7}
        />
      ) : null}
      <PaperSlip x={1380} y={782} w={380} h={86} rotate={-3} progress={glucLabel} tape="right" color={mix(C.amberLight, "#FFFFFF", 0.35)}>
        <text y={20} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={60} fill={W2.inkText}>
          energy in glucose
        </text>
      </PaperSlip>
      {glucLabel > 0 ? (
        <HandArrow
          from={[1420, 734]}
          to={lensPt(glucTarget)}
          progress={f < k.careful ? prog(f, k.chemicals + 4, 14, (v) => v) : prog(f, g2Arrive + 4, 14, (v) => v)}
          color={C.paper}
          width={5}
          bend={f < k.careful ? -0.2 : 0.2}
          gapEnd={44}
          opacity={glucLabel}
          seed={9}
        />
      ) : null}

      {/* ============ EXAM TIP note ============ */}
      <StickyNote x={NOTE.x} y={NOTE.y} w={NOTE.w} h={NOTE.h} rotate={NOTE.rot} progress={noteP}>
        {/* printed header */}
        <g transform="translate(52 58)">
          <path d="M22,2 L44,42 L0,42 Z" fill={C.coral} stroke={W2.inkText} strokeWidth={3.5} strokeLinejoin="round" />
          <rect x={20} y={14} width={5} height={15} rx={2.5} fill={W2.inkText} />
          <circle cx={22.5} cy={35} r={3} fill={W2.inkText} />
        </g>
        <text x={116} y={100} fontFamily={FONT} fontWeight={700} fontSize={54} letterSpacing={3} fill={W2.inkText}>
          EXAM TIP
        </text>
        <line x1={44} y1={136} x2={NOTE.w - 44} y2={136} stroke={W2.inkText} strokeOpacity={0.2} strokeWidth={3} strokeLinecap="round" />
        {/* the wrong wording, struck out */}
        <HandText x={W1.x} y={W1.y} text={W1.text} size={W1.size} progress={write1} strike={strike} />
        <HandCross cx={CROSS.cx} cy={CROSS.cy} size={CROSS.size} progress={cross} color={C.coralDeep} width={8} seed={3} />
        {/* the syllabus word */}
        {wordGlow > 0 ? (
          <ellipse cx={LOOP.cx} cy={LOOP.cy} rx={LOOP.rx} ry={LOOP.ry} fill="#FFFFFF" opacity={0.35 * wordGlow} filter={`url(#${gid}-soft)`} />
        ) : null}
        <HandText x={W2a.x} y={W2a.y} text={W2a.text} size={W2a.size} progress={write2a} />
        <HandText x={W2b.x} y={W2b.y} text={W2b.text} size={W2b.size} progress={write2b} />
        <MarkerLoop cx={LOOP.cx} cy={LOOP.cy} rx={LOOP.rx} ry={LOOP.ry} progress={loop} color={C.leafDeep} width={9} />
        <HandTick cx={TICK.cx} cy={TICK.cy} size={TICK.size} progress={tick} color={C.leafDeep} width={10} seed={5} />
        {/* the pens that do the writing */}
        <Pen x={pen1Tip[0]} y={pen1Tip[1]} kind="pen" color={C.ink600} progress={pen1In} />
        <Pen x={redTip[0]} y={redTip[1]} kind="marker" color={C.coralDeep} progress={redIn} angle={-50} />
        <Pen x={pen2Tip[0]} y={pen2Tip[1]} kind="pen" color={C.ink600} progress={pen2In} />
        <Pen x={greenTip[0]} y={greenTip[1]} kind="marker" color={C.leafDeep} progress={greenIn} angle={-50} />
      </StickyNote>
      <ImpactLines x={NOTE.x + 8} y={NOTE.y + 40} progress={slap} angles={[-170, -140, -110]} r0={20} r1={80} />
      <ImpactLines x={NOTE.x + NOTE.w - 4} y={NOTE.y + 14} progress={slap} angles={[-80, -50, -20]} r0={20} r1={80} />

      {/* ============ Chloro ============ */}
      <g transform={`rotate(${lean} ${CH.x} ${CH.y})`}>
        <Chloro
          x={CH.x}
          y={CH.y}
          size={CH.size}
          mood={st.mood}
          pose={st.pose}
          pointAngle={st.angle}
          flip={st.flip}
          look={st.look}
          talk={st.mood === "celebrate" ? 0 : talk}
          bounce={bounce}
          enter={prog(f, -4, 16, (v) => v)}
          cap
          seed={6}
        />
      </g>

      {/* "Energy can't be made!" */}
      <BurstBubble x={918} y={402} rx={232} ry={128} tail={[952, 588]} progress={burst} seed={8}>
        <text y={-8} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={52} fill={W2.inkText}>
          Energy <tspan fill={C.coralDeep}>can’t</tspan>
        </text>
        <text y={52} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={52} fill={W2.inkText}>
          be made!
        </text>
      </BurstBubble>

      {/* celebration */}
      {f >= S
        ? SPARKS.map((s, i) => {
            const p = prog(f, S + 2 + s.d, 12);
            return p > 0 ? (
              <g key={i} transform={`translate(${s.p[0]} ${s.p[1]}) scale(${0.4 + 0.6 * EASE.out(p)}) translate(${-s.p[0]} ${-s.p[1]})`}>
                <Sparkle x={s.p[0]} y={s.p[1]} r={s.r} seed={i + 3} color={i % 2 ? C.amberLight : "#FFFFFF"} opacity={p} />
              </g>
            ) : null;
          })
        : null}
    </WorldStage>
  );
};
