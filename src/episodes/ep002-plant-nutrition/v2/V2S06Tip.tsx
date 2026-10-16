/**
 * EP002 v2 · S06 — "What does the light actually do?" + the exam tip "transfers, never makes".
 * World: the purple study desk. Chloro (graduation cap) hosts between a taped EXAM TIP sticky note and a
 * glowing lens into the palisade cells, lit by a smiling sun.
 *
 *  0 → {careful}   the lens shows palisade cells; light from the sun is absorbed by chloroplasts
 *                  ("chloroplast", "light energy"); on "transfers energy" one chloroplast passes the
 *                  energy along a swoosh into a glucose buddy ("energy in glucose"). Labels clear by {careful}.
 *  {careful}       the EXAM TIP note slaps onto the desk; Chloro turns to it, thinking, then points.
 *  {notMake}       "Never write that chlorophyll makes energy": a pen writes "Chlorophyll …" and
 *                  "makes energy" as they are said; a red marker strikes it out and crosses it.
 *                  "Energy can't be made": Chloro is shocked and shouts it in a burst bubble.
 *  {transfers}     "Chlorophyll transfers it": a spotlight in the lens; a beam of light (light energy) feeds
 *                  one chloroplast, which sends a glowing spark along a swoosh arrow into a new glucose
 *                  that lights up ("energy in glucose").
 *  "So use the syllabus word" the pen writes "transfers energy"; on "transfers" a green marker loops it
 *                  and ticks it; Chloro celebrates; sparkles; the glucose glows again.
 */
import React, { useMemo } from "react";
import { C, EASE, W2 } from "../../../brand/tokens";
import { FONT, HAND } from "../../../brand/fonts";
import { WorldStage, Chloro, StickyNote, Sparkle } from "../../../components/fun";
import type { ChloroMood, ChloroPose } from "../../../components/fun";
import { GlowLens, PalisadeCells, palisade } from "../../../components/fun/CellLens";
import { BurstBubble, ImpactLines, MarkerLoop, PaperSlip, Pen, SunBuddy, TopicTag, loopEase, loopPoint } from "../../../components/fun/StudyProps";
import { Scribble, caveatWidth, scribbleTip } from "../../../components/fun/Handwriting";
import { GlucoseBuddy } from "../../../components/fun/GlucoseBuddy";
import { useNarrationTalk } from "../../../components/fun/narrationTalk";
import { Photon } from "../../../components/Light";
import { HandArrow, HandCross, HandTick, mix, penEase } from "../../../components/kit";
import { Pt, rng } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s06Timing } from "../scenes/S06Chlorophyll.timing";

// ------------------------------------------------------------------ layout (1920×1080)
const LENS = { x: 1500, y: 500, r: 290 } as const;
const SUN: Pt = [1735, 160];
const NOTE = { x: 116, y: 190, w: 600, h: 690, rot: -3 } as const;
const CH = { x: 966, y: 914, size: 362 } as const;
const PAL = palisade(LENS.r);

// chloroplasts that do the visible transfers (local lens coordinates) and where their glucose forms
const P1 = PAL.nearest([-102, -104]); // left cell (before the excerpt, on "transfers energy")
const P2 = PAL.nearest([38, -104]); // middle cell: THE transfer, on "Chlorophyll transfers it"
const P3 = PAL.nearest([178, -38]); // right cell (it keeps happening)
const SPECIAL = new Set([P1, P2, P3]);

// note-local writing (Caveat, measured widths)
const L0 = { text: "Chlorophyll …", x: 60, y: 224, size: 74 };
const L1 = { text: "makes energy", x: 106, y: 334, size: 94 };
const L2 = { text: "transfers", x: 112, y: 488, size: 126 };
const L3 = { text: "energy", x: 112, y: 612, size: 114 };
const l2W = caveatWidth(L2.text, L2.size);
const l3W = caveatWidth(L3.text, L3.size);
const LOOP = { cx: L2.x + l2W / 2, cy: L2.y - L2.size * 0.3, rx: l2W / 2 + 34, ry: 76 };
const CROSS = { cx: 62, cy: 306, size: 50 };
const TICK = { cx: L3.x + l3W + 70, cy: L3.y - 40, size: 82 };

const PHOTON_TRAVEL = 18;

const lensPt = (p: Pt): Pt => [LENS.x + p[0], LENS.y + p[1]];
const chl = (i: number): Pt => [PAL.chloroplasts[i].x, PAL.chloroplasts[i].y];
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
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
  if (p < 0.46) return along([P(-0.92, -0.96), P(0.96, 0.92)], penEase(p / 0.46));
  if (p < 0.56) return along([P(0.96, 0.92), P(0.9, -1.0)], (p - 0.46) / 0.1);
  return along([P(0.9, -1.0), P(-0.98, 0.9)], penEase((p - 0.56) / 0.44));
};
const tickTip = (p: number): Pt => {
  const h = TICK.size / 2;
  const pts: Pt[] = (
    [
      [-0.86, 0.02],
      [-0.56, 0.32],
      [-0.3, 0.62],
      [-0.16, 0.66],
      [0.1, 0.24],
      [0.5, -0.38],
      [0.92, -0.84],
    ] as const
  ).map(([x, y]) => [TICK.cx + x * h, TICK.cy + y * h] as Pt);
  return along(pts, penEase(p));
};

/** One "chloroplast → glucose" energy transfer (lens-local; frames scene-relative). */
type Transfer = { spark: number; travel: number; ci: number; g: Pt; ctrl: Pt; r: number; main: boolean };

/** The swoosh path from a chloroplast to its glucose, stopping short of the hexagon. */
const swooshOf = (t: Transfer) => {
  const from = chl(t.ci);
  let endT = 1;
  for (let s = 1; s > 0; s -= 0.01) {
    const q = quad(from, t.ctrl, t.g, s);
    if (Math.hypot(q[0] - t.g[0], q[1] - t.g[1]) > t.r * 1.18 + 10) {
      endT = s;
      break;
    }
  }
  const n = 30;
  const pts = Array.from({ length: n + 1 }, (_, j) => quad(from, t.ctrl, t.g, (j / n) * endT));
  const cum = pts.map(() => 0);
  for (let j = 1; j <= n; j++) cum[j] = cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
  /** fraction of the drawn swoosh (by length) behind a spark at curve parameter u */
  const drawn = (u: number) => {
    if (u <= 0) return 0;
    if (u >= endT) return 1;
    const x = (u / endT) * n;
    const j = Math.floor(x);
    return (cum[j] + (cum[Math.min(n, j + 1)] - cum[j]) * (x - j)) / cum[n];
  };
  return { from, endT, pts, drawn, d: pts.map((q, j) => `${j ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("") };
};

export const V2S06Tip: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s06Timing(sc);
  const gid = useSvgId("v2s06");
  const talk = useNarrationTalk(6);

  // ---------------------------------------------------------------- key moments (all on the narration)
  const wS0 = sc.word("write", 1) + 2; // "Never write that chlorophyll …"
  const wE0 = k.makes - 4;
  const wS1 = k.makes - 2; // "makes energy"
  const wE1 = Math.max(wS1 + 18, sc.wordEnd("energy", 4) - 4);
  const strikeAt = wE1 + 4;
  const crossAt = strikeAt + 14;
  const e5 = sc.word("energy", 5); // "Energy can't be made"
  const T = k.transfers; // "Chlorophyll transfers it."
  const so = sc.word("so", 2); // "So use the syllabus word:"
  const S = k.syllabusWord; // "transfers."
  const wS2 = so + 4;
  const wE2 = Math.max(wS2 + 34, S - 10);
  const wM2 = wS2 + (wE2 - wS2) * 0.58;

  const transfers: Transfer[] = [
    { spark: k.transfersWord + 6, travel: 24, ci: P1, g: [-150, 50], ctrl: [-40, -30], r: 34, main: false },
    { spark: k.transfersIt - 4, travel: 28, ci: P2, g: [-8, 80], ctrl: [150, 0], r: 48, main: true },
    { spark: so + 16, travel: 24, ci: P3, g: [146, 104], ctrl: [250, 70], r: 34, main: false },
  ];
  const tMain = transfers[1];
  const mainArrive = tMain.spark + tMain.travel;

  // ambient light: photons from the sun to chloroplasts (a steady stream onto THE chloroplast from {transfers})
  const photons = useMemo(() => {
    const r = rng(91);
    const pool = PAL.visible.filter((i) => !SPECIAL.has(i) && PAL.chloroplasts[i].y < 150);
    const out: { s: number; ci: number; size: number }[] = [];
    for (let s = k.light - PHOTON_TRAVEL + 4; s < k.end; ) {
      const land = s + PHOTON_TRAVEL;
      const quiet = land > k.careful - 10 && land < T - 10;
      const busy = land >= T - 10;
      out.push({ s, ci: pool[Math.floor(r() * pool.length)], size: busy ? 0.7 : 0.8 });
      s += quiet ? 34 : busy ? 22 + Math.floor(r() * 6) : 13 + Math.floor(r() * 6);
    }
    // the demonstration photons: one before the excerpt, a stream onto THE chloroplast, one for the last
    out.push({ s: transfers[0].spark - 10 - PHOTON_TRAVEL, ci: P1, size: 1.1 });
    for (let s = T + 4 - PHOTON_TRAVEL; s < k.end; s += 11) out.push({ s, ci: P2, size: 1.25 });
    out.push({ s: transfers[2].spark - 10 - PHOTON_TRAVEL, ci: P3, size: 1.1 });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k.light, k.end, k.careful, T, so]);

  const glowOf = (ci: number) => {
    let g = 0;
    for (const ph of photons) {
      if (ph.ci !== ci) continue;
      g = Math.max(g, pulse(f, ph.s + PHOTON_TRAVEL - 2, ph.size > 1 ? 30 : 26) * (ph.size > 1 ? 1 : 0.75));
    }
    for (const t of transfers) if (t.ci === ci) g = Math.max(g, pulse(f, t.spark - 8, 22));
    return Math.min(1, g);
  };

  // ---------------------------------------------------------------- world
  const sunIn = prog(f, -4, 18);
  const lensOpen = prog(f, 2, 22);
  const cellsIn = prog(f, 8, 40, (v) => v);
  const dim = prog(f, k.careful + 4, 14) * (1 - prog(f, T - 10, 12));
  const spot = prog(f, T - 4, 12) * (1 - prog(f, so + 6, 18));
  const beam = prog(f, T, 12);
  const sunShine = Math.max(pulse(f, transfers[0].spark - 34, 26), 0.35 * beam + 0.25 * beam * Math.abs(Math.sin(f / 7)));

  // ---------------------------------------------------------------- Chloro
  type St = { mood: ChloroMood; pose: ChloroPose; flip: boolean; angle: number; look: readonly [number, number]; lean: number; at: number };
  const states: St[] = [
    { at: -100, mood: "explain", pose: "present", flip: false, angle: -20, look: [1, -0.3], lean: 2 },
    { at: k.glucose + 20, mood: "happy", pose: "present", flip: false, angle: -20, look: [1, -0.3], lean: 2 },
    { at: k.careful + 4, mood: "thinking", pose: "chin", flip: false, angle: -20, look: [-1, -0.3], lean: -3 },
    { at: Math.min(k.careful + 40, sc.word("wording", 1)), mood: "explain", pose: "point", flip: true, angle: -18, look: [-1, -0.1], lean: -5 },
    { at: e5, mood: "shocked", pose: "rest", flip: false, angle: -20, look: [-0.5, -0.2], lean: 0 },
    { at: T, mood: "explain", pose: "point", flip: false, angle: -26, look: [1, -0.5], lean: 4 },
    { at: mainArrive, mood: "happy", pose: "point", flip: false, angle: -26, look: [1, -0.2], lean: 4 },
    { at: so, mood: "explain", pose: "point", flip: true, angle: -8, look: [-1, 0.1], lean: -4 },
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
  // a little hop of joy when the word is circled
  const hop = f >= S ? Math.abs(Math.sin(((f - S) / 15) * Math.PI)) * 22 * Math.max(0, 1 - (f - S) / 60) : 0;

  // ---------------------------------------------------------------- the note
  const noteP = prog(f, k.careful + 1, 11, (v) => v);
  const slap = prog(f, k.careful + 10, 16, (v) => v);
  const write0 = prog(f, wS0, wE0 - wS0, (v) => v);
  const write1 = prog(f, wS1, wE1 - wS1, (v) => v);
  const strike = prog(f, strikeAt, 12, EASE.inOut);
  const cross = prog(f, crossAt, 13, (v) => v);
  const write2 = prog(f, wS2, wM2 - wS2, (v) => v);
  const write3 = prog(f, wM2 + 3, wE2 - wM2 - 3, (v) => v);
  const loop = prog(f, S - 2, 16, (v) => v);
  const tick = prog(f, S + 16, 12, (v) => v);
  const wordGlow = prog(f, S, 10) * (0.55 + 0.45 * Math.cos((f - S) / 9));
  const wrongFade = 1 - 0.35 * prog(f, wS2, 16);
  const blankIn = prog(f, crossAt + 16, 14, (v) => v);
  const blankOut = prog(f, wS2 - 8, 10, EASE.in);
  const qPop = prog(f, crossAt + 22, 14, (v) => v);

  // pens (note-local): ink pen writes, red marker corrects, green marker approves
  const pen1In = prog(f, wS0 - 12, 10) * (1 - prog(f, wE1 + 1, 6, EASE.in));
  const pen1Tip = f < wS1 - 1 ? scribbleTip(L0.x, L0.y, L0.text, L0.size, write0, f) : scribbleTip(L1.x, L1.y, L1.text, L1.size, write1, f);
  const redIn = prog(f, strikeAt - 7, 7) * (1 - prog(f, crossAt + 15, 10, EASE.in));
  const l1W = caveatWidth(L1.text, L1.size);
  const strikeTip: Pt = [L1.x - 12 + (l1W + 24) * strike, L1.y - L1.size * 0.3 - 6 * strike];
  const redTip: Pt = cross > 0 ? crossTip(cross) : strikeTip;
  const pen2In = prog(f, wS2 - 10, 10) * (1 - prog(f, wE2 + 2, 10, EASE.in));
  const pen2Tip = write3 > 0 ? scribbleTip(L3.x, L3.y, L3.text, L3.size, write3, f) : scribbleTip(L2.x, L2.y, L2.text, L2.size, write2, f);
  const greenIn = prog(f, S - 11, 9) * (1 - prog(f, S + 32, 10, EASE.in));
  const greenTip: Pt = tick > 0 ? tickTip(tick) : loopPoint(LOOP.cx, LOOP.cy, LOOP.rx, LOOP.ry, loopEase(loop));

  // ---------------------------------------------------------------- bubble + labels
  const burst = prog(f, e5 + 2, 12, (v) => v) * (1 - prog(f, T + 2, 8, EASE.in));
  const chlLabel = window01(f, k.chloroWord - 2, k.absorb + 4, 12);
  const lightPre = window01(f, k.absorbs, k.glucose + 22, 12);
  const lightNow = prog(f, T + 2, 14);
  const lightLabel = Math.max(lightPre, lightNow);
  const glucPre = window01(f, k.chemicals - 2, k.glucose + 22, 12);
  const glucNow = prog(f, mainArrive, 14);
  const glucLabel = Math.max(glucPre, glucNow);
  const glucTarget = f < k.careful ? transfers[0] : tMain;

  // sparkles when "transfers" is circled
  const SPARKS: { p: Pt; r: number; d: number }[] = [
    { p: [NOTE.x + LOOP.cx + LOOP.rx + 4, NOTE.y + LOOP.cy - 84], r: 28, d: 0 },
    { p: [NOTE.x + LOOP.cx - LOOP.rx + 10, NOTE.y + LOOP.cy - 96], r: 18, d: 4 },
    { p: [NOTE.x + LOOP.cx + LOOP.rx + 40, NOTE.y + LOOP.cy + 30], r: 16, d: 7 },
    { p: [CH.x - 170, CH.y - 360], r: 22, d: 3 },
    { p: [CH.x + 170, CH.y - 330], r: 28, d: 6 },
    { p: [CH.x + 120, CH.y - 440], r: 15, d: 9 },
  ];

  // the beam of light onto THE chloroplast (screen coordinates)
  const p2s = lensPt(chl(P2));
  const bdx = p2s[0] - SUN[0];
  const bdy = p2s[1] - SUN[1];
  const bL = Math.hypot(bdx, bdy);
  const bn: Pt = [-bdy / bL, bdx / bL];
  const beamPts = [
    [SUN[0] + bn[0] * 40, SUN[1] + bn[1] * 40],
    [p2s[0] + bn[0] * 22, p2s[1] + bn[1] * 22],
    [p2s[0] - bn[0] * 22, p2s[1] - bn[1] * 22],
    [SUN[0] - bn[0] * 40, SUN[1] - bn[1] * 40],
  ]
    .map((q) => q.map((v) => v.toFixed(1)).join(","))
    .join(" ");
  const beamMid: Pt = [SUN[0] + bdx * 0.42, SUN[1] + bdy * 0.42];

  return (
    <WorldStage world="desk">
      <defs>
        <filter id={`${gid}-soft`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
        <filter id={`${gid}-beam`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
        <radialGradient id={`${gid}-spot`} gradientUnits="userSpaceOnUse" cx={40} cy={-6} r={260}>
          <stop offset="0" stopColor={W2.deskBottom} stopOpacity={0} />
          <stop offset="0.62" stopColor={W2.deskBottom} stopOpacity={0} />
          <stop offset="1" stopColor={W2.deskBottom} stopOpacity={0.62} />
        </radialGradient>
      </defs>
      <TopicTag n={1} title="What is photosynthesis?" progress={prog(f, -6, 16)} />

      {/* before the exam tip: the question this scene answers, taped to the desk */}
      <PaperSlip x={420} y={470} w={640} h={132} rotate={-4} progress={window01(f, k.what + 4, k.stored + 30, 12)} tape="top">
        <text y={26} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={80} fill={W2.inkText}>
          What does light do?
        </text>
      </PaperSlip>

      {/* ============ the lens: palisade cells ============ */}
      <GlowLens x={LENS.x} y={LENS.y} r={LENS.r} open={lensOpen} dim={dim}>
        <PalisadeCells r={LENS.r} appear={cellsIn} glowOf={glowOf}>
          {spot > 0 ? <rect x={-LENS.r} y={-LENS.r} width={LENS.r * 2} height={LENS.r * 2} fill={`url(#${gid}-spot)`} opacity={spot} /> : null}
          {transfers.map((t, i) => {
            const sw = swooshOf(t);
            const arrive = t.spark + t.travel;
            const sp = (f - t.spark) / t.travel;
            const e = EASE.inOut(Math.max(0, Math.min(1, sp)));
            // the swoosh is drawn by the spark itself; the pre-excerpt one clears before the exam tip
            const draw = sp > 0 ? sw.drawn(e) : 0;
            const arrowOut = i === 0 ? 1 - prog(f, k.glucose + 10, 12) : 1;
            const gIn = prog(f, arrive - 4, 16, (v) => v);
            const lit = gIn > 0 ? Math.min(1, (t.main ? 0.45 : 0.3) + 0.7 * pulse(f, arrive - 4, 36) + (f >= S - 2 ? 0.55 * pulse(f, S - 2 + i * 5, 44) : 0)) : 0;
            const sparkPt = sp > 0 && sp < 1 ? quad(sw.from, t.ctrl, t.g, e) : null;
            const sparkCol = mix(C.sun, C.amberLight, Math.max(0, Math.min(1, sp)));
            const W = t.main ? 1 : 0.75;
            const tip = sw.pts[sw.pts.length - 1];
            const pre = sw.pts[sw.pts.length - 3];
            const ang = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
            const hl = 22 * W;
            const head = (s: number): Pt => [tip[0] + Math.cos(ang + s * 2.45) * hl, tip[1] + Math.sin(ang + s * 2.45) * hl];
            const headD = `M${head(1)[0].toFixed(1)},${head(1)[1].toFixed(1)} L${tip[0].toFixed(1)},${tip[1].toFixed(1)} L${head(-1)[0].toFixed(1)},${head(-1)[1].toFixed(1)}`;
            const headIn = prog(f, arrive - 6, 6);
            return (
              <g key={i}>
                {draw > 0 && arrowOut > 0 ? (
                  <g opacity={arrowOut * (t.main ? 1 : 0.85)}>
                    <path d={sw.d} fill="none" stroke={C.sun} strokeOpacity={0.55} strokeWidth={26 * W} strokeLinecap="round" filter={`url(#${gid}-soft)`} pathLength={1} strokeDasharray={`${draw} 2`} />
                    <path d={sw.d} fill="none" stroke={C.amberDeep} strokeWidth={14 * W} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 2`} />
                    <path d={sw.d} fill="none" stroke={C.amberLight} strokeWidth={9 * W} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 2`} />
                    <path d={sw.d} fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={3 * W} strokeLinecap="round" pathLength={1} strokeDasharray={`${draw} 2`} />
                    {headIn > 0 ? (
                      <g opacity={headIn}>
                        <path d={headD} fill="none" stroke={C.amberDeep} strokeWidth={14 * W} strokeLinecap="round" strokeLinejoin="round" />
                        <path d={headD} fill="none" stroke={C.amberLight} strokeWidth={8 * W} strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    ) : null}
                  </g>
                ) : null}
                {gIn > 0 ? (
                  <g>
                    <circle cx={t.g[0]} cy={t.g[1]} r={t.r + 50 * prog(f, arrive - 2, 20)} fill="none" stroke={C.amberLight} strokeWidth={5} opacity={0.9 * (1 - prog(f, arrive - 2, 20))} />
                    <GlucoseBuddy x={t.g[0]} y={t.g[1]} r={t.r} progress={gIn} lit={lit} look={t.main ? [0.6, -0.8] : [0, 0]} seed={i + 2} />
                  </g>
                ) : null}
                {sparkPt ? (
                  <g>
                    {[0.1, 0.07, 0.04].map((dt, j) => {
                      const q = quad(sw.from, t.ctrl, t.g, Math.max(0, e - dt));
                      return <circle key={j} cx={q[0]} cy={q[1]} r={(6 + j * 3) * W} fill={C.amberLight} opacity={0.35 + j * 0.15} />;
                    })}
                    <circle cx={sparkPt[0]} cy={sparkPt[1]} r={32 * W} fill={sparkCol} opacity={0.6} filter={`url(#${gid}-soft)`} />
                    <circle cx={sparkPt[0]} cy={sparkPt[1]} r={14 * W} fill={mix(sparkCol, "#FFFFFF", 0.6)} />
                    <Sparkle x={sparkPt[0]} y={sparkPt[1]} r={26 * W} seed={i} color="#FFFFFF" />
                  </g>
                ) : null}
              </g>
            );
          })}
        </PalisadeCells>
      </GlowLens>

      {/* the beam of light onto THE chloroplast, from {transfers} */}
      {beam > 0 ? (
        <g opacity={beam * (0.85 + 0.15 * Math.sin(f / 6))}>
          <polygon points={beamPts} fill={C.sun} opacity={0.5} filter={`url(#${gid}-beam)`} />
          <line x1={SUN[0]} y1={SUN[1]} x2={p2s[0]} y2={p2s[1]} stroke={C.amberLight} strokeOpacity={0.75} strokeWidth={7} strokeLinecap="round" filter={`url(#${gid}-soft)`} />
          <line x1={SUN[0]} y1={SUN[1]} x2={p2s[0]} y2={p2s[1]} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={3} strokeLinecap="round" />
        </g>
      ) : null}
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
      <PaperSlip x={1272} y={150} w={300} h={84} rotate={-3} progress={lightLabel} tape="left" color={mix(C.amberLight, "#FFFFFF", 0.35)}>
        <text y={20} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={60} fill={W2.inkText}>
          light energy
        </text>
      </PaperSlip>
      {lightLabel > 0 ? (
        f < k.careful ? (
          <HandArrow from={[1432, 158]} to={[1588, 236]} progress={prog(f, k.absorbs + 6, 14, (v) => v) * lightPre} color={C.paper} width={5} bend={-0.25} opacity={lightPre} seed={7} />
        ) : (
          <HandArrow from={[1434, 168]} to={beamMid} progress={prog(f, T + 8, 14, (v) => v)} color={C.paper} width={5} bend={-0.3} gapEnd={18} opacity={lightNow} seed={7} />
        )
      ) : null}
      <PaperSlip x={1318} y={842} w={390} h={86} rotate={-3} progress={glucLabel} tape="left" color={mix(C.amberLight, "#FFFFFF", 0.35)}>
        <text y={20} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={60} fill={W2.inkText}>
          energy in glucose
        </text>
      </PaperSlip>
      {glucLabel > 0 ? (
        <HandArrow
          from={[1450, 800]}
          to={lensPt(glucTarget.g)}
          progress={f < k.careful ? prog(f, k.chemicals + 4, 14, (v) => v) : prog(f, mainArrive + 4, 14, (v) => v)}
          color={C.paper}
          width={5}
          bend={f < k.careful ? -0.2 : 0.22}
          gapEnd={glucTarget.r + 16}
          opacity={glucLabel}
          seed={9}
        />
      ) : null}

      {/* ============ EXAM TIP note ============ */}
      <StickyNote x={NOTE.x} y={NOTE.y} w={NOTE.w} h={NOTE.h} rotate={NOTE.rot} progress={noteP}>
        {/* printed header */}
        <g transform="translate(50 56)">
          <path d="M22,2 L44,42 L0,42 Z" fill={C.coral} stroke={W2.inkText} strokeWidth={3.5} strokeLinejoin="round" />
          <rect x={20} y={14} width={5} height={15} rx={2.5} fill={W2.inkText} />
          <circle cx={22.5} cy={35} r={3} fill={W2.inkText} />
        </g>
        <text x={112} y={98} fontFamily={FONT} fontWeight={700} fontSize={56} letterSpacing={3} fill={W2.inkText}>
          EXAM TIP
        </text>
        <line x1={44} y1={134} x2={NOTE.w - 44} y2={134} stroke={W2.inkText} strokeOpacity={0.2} strokeWidth={3} strokeLinecap="round" />
        {/* the sentence stem, then the wrong wording, struck out */}
        <Scribble x={L0.x} y={L0.y} text={L0.text} size={L0.size} color={C.ink600} progress={write0} />
        <g opacity={wrongFade}>
          <Scribble x={L1.x} y={L1.y} text={L1.text} size={L1.size} progress={write1} strike={strike} />
          <HandCross cx={CROSS.cx} cy={CROSS.cy} size={CROSS.size} progress={cross} color={C.coralDeep} width={8} seed={3} />
        </g>
        {/* the blank for the right word (an exam answer line), with a "?" waiting */}
        {blankIn > 0 && blankOut < 1 ? (
          <g opacity={1 - blankOut}>
            {[
              [L2.x, L2.y + 18, l2W - 130],
              [L3.x, L3.y + 18, l3W],
            ].map(([x, y, w], i) => (
              <line key={i} x1={x} y1={y} x2={x + w * Math.min(1, blankIn * 1.3 - i * 0.3)} y2={y} stroke={C.leafDeep} strokeOpacity={0.55} strokeWidth={5} strokeDasharray="16 14" strokeLinecap="round" />
            ))}
            {qPop > 0 ? (
              <g transform={`translate(${L2.x + l2W - 66} ${L3.y - 66}) rotate(${6 * Math.sin(f / 11)}) scale(${(0.4 + 0.6 * EASE.out(qPop)) * (1 + 0.15 * (1 - qPop)) * (1 - 0.6 * blankOut)})`}>
                <text x={0} y={52} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={190} fill={C.leafDeep} opacity={0.85}>
                  ?
                </text>
              </g>
            ) : null}
          </g>
        ) : null}
        {/* the syllabus word */}
        {wordGlow > 0 ? <ellipse cx={LOOP.cx} cy={LOOP.cy} rx={LOOP.rx} ry={LOOP.ry} fill="#FFFFFF" opacity={0.4 * wordGlow} filter={`url(#${gid}-soft)`} /> : null}
        <Scribble x={L2.x} y={L2.y} text={L2.text} size={L2.size} progress={write2} />
        <Scribble x={L3.x} y={L3.y} text={L3.text} size={L3.size} progress={write3} />
        <MarkerLoop cx={LOOP.cx} cy={LOOP.cy} rx={LOOP.rx} ry={LOOP.ry} progress={loop} color={C.leafDeep} width={9} />
        <HandTick cx={TICK.cx} cy={TICK.cy} size={TICK.size} progress={tick} color={C.leafDeep} width={11} seed={5} />
        {/* the pens that do the writing */}
        <Pen x={pen1Tip[0]} y={pen1Tip[1]} kind="pen" color={C.ink600} progress={pen1In} angle={-38} scale={0.86} />
        <Pen x={redTip[0]} y={redTip[1]} kind="marker" color={C.coralDeep} progress={redIn} angle={-18} scale={0.86} />
        <Pen x={pen2Tip[0]} y={pen2Tip[1]} kind="pen" color={C.ink600} progress={pen2In} angle={-38} scale={0.86} />
        <Pen x={greenTip[0]} y={greenTip[1]} kind="marker" color={C.leafDeep} progress={greenIn} angle={-26} scale={0.86} />
      </StickyNote>
      <ImpactLines x={NOTE.x + 8} y={NOTE.y + 40} progress={slap} angles={[-170, -140, -110]} r0={20} r1={80} />
      <ImpactLines x={NOTE.x + NOTE.w - 4} y={NOTE.y + 14} progress={slap} angles={[-80, -50, -20]} r0={20} r1={80} />

      {/* ============ Chloro ============ */}
      <g transform={`translate(0 ${-hop}) rotate(${lean} ${CH.x} ${CH.y})`}>
        <Chloro
          x={CH.x}
          y={CH.y}
          size={CH.size}
          mood={st.mood}
          pose={st.pose}
          pointAngle={st.angle}
          flip={st.flip}
          look={st.look}
          talk={st.mood === "celebrate" || st.mood === "shocked" ? 0 : talk}
          bounce={bounce}
          enter={prog(f, -4, 16, (v) => v)}
          cap
          seed={6}
        />
      </g>

      {/* "Energy can't be made!" */}
      <BurstBubble x={984} y={352} rx={196} ry={114} tail={[946, 540]} progress={burst} seed={8}>
        <text y={-8} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={50} fill={W2.inkText}>
          Energy <tspan fill={C.coralDeep}>can’t</tspan>
        </text>
        <text y={50} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={50} fill={W2.inkText}>
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
