/**
 * Style preview for EP002 (not part of the episode): the enzyme video's "Soft Lab" look,
 * with a photosynthesis twist —
 *  1. sunlight is a visible character: soft beams + light particles that carry energy INTO the leaf,
 *     and the chloroplasts light up when light reaches them (energy transferred);
 *  2. a magnifying "lens" shows inside the leaf (palisade cells packed with chloroplasts);
 *  3. the word equation builds itself, colour-coded, the moment each molecule appears;
 *  4. glucose is the SAME amber sugar ring as in the enzyme video (the series connects).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, EASE } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { Stage } from "../components/Stage";
import { Label } from "../components/Label";
import { GlucoseRing } from "../components/SugarChain";
import { CarbonDioxide, Oxygen, Water, HandUnderline, LitShape, DepthMolecules, mix, textWidth } from "../components/kit";
import { Pt, rng, smoothClosedPath, smoothOpenPath } from "../lib/geometry";
import { prog, window01 } from "../lib/motion";
import { pulse } from "../lib/track";
import { useSvgId } from "../components/ids";

// ------------------------------------------------------------------ layout
const LEAF = { cx: 600, cy: 560, len: 700, wid: 330, ang: -16 };
const LENS = { cx: 1390, cy: 500, r: 262 };
const ZOOM_AT: Pt = [770, 515]; // the spot on the leaf the lens magnifies
const SUN_SRC: Pt = [-340, -380];

const leafGeometry = () => {
  const a = (LEAF.ang * Math.PI) / 180;
  const P = (u: number, v: number): Pt => [LEAF.cx + u * Math.cos(a) - v * Math.sin(a), LEAF.cy + u * Math.sin(a) + v * Math.cos(a)];
  const half = (t: number) => (LEAF.wid / 2) * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 0.8);
  const top: Pt[] = [];
  const bot: Pt[] = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = -LEAF.len / 2 + t * LEAF.len;
    top.push(P(u, -half(t)));
    bot.push(P(u, half(t)));
  }
  const outline = [...top, ...bot.slice(1, -1).reverse()];
  const midrib = Array.from({ length: 9 }, (_, i) => P(-LEAF.len / 2 + (i / 8) * LEAF.len * 0.97, Math.sin((i / 8) * Math.PI) * -8));
  const veins: Pt[][] = [];
  for (let k = 1; k <= 6; k++) {
    const t = k / 7.3;
    const u = -LEAF.len / 2 + t * LEAF.len;
    for (const s of [-1, 1]) {
      const h = half(Math.min(0.97, t + 0.08)) * 0.8;
      veins.push([P(u, -4 * s), P(u + 48, s * h * 0.55), P(u + 96, s * h)]);
    }
  }
  const base = P(-LEAF.len / 2, 0);
  const petiole: Pt[] = [base, [base[0] - 50, base[1] + 70], [base[0] - 80, base[1] + 150], [base[0] - 96, base[1] + 220]];
  return { outline, midrib, veins, petiole, P };
};

// palisade cells inside the lens (world = screen coordinates)
const CELLS = Array.from({ length: 5 }, (_, i) => ({ x: LENS.cx - 240 + i * 100, y: 352, w: 88, h: 380 }));
type Chloro = { x: number; y: number; rot: number; cell: number };
const CHLOROPLASTS: Chloro[] = (() => {
  const r = rng(7);
  const out: Chloro[] = [];
  CELLS.forEach((c, ci) => {
    // chloroplasts line the cell edges (the middle is the vacuole)
    for (let k = 0; k < 5; k++) {
      const y = c.y + 34 + k * 68 + (r() - 0.5) * 10;
      out.push({ x: c.x + 20 + (r() - 0.5) * 4, y, rot: 80 + (r() - 0.5) * 30, cell: ci });
      out.push({ x: c.x + c.w - 20 + (r() - 0.5) * 4, y: y + 22, rot: 95 + (r() - 0.5) * 30, cell: ci });
    }
  });
  return out;
})();

// light particles: [start frame, target]
const MACRO_PHOTONS = Array.from({ length: 12 }, (_, i) => {
  const r = rng(30 + i);
  const t = 0.2 + r() * 0.7;
  const u = -LEAF.len / 2 + t * LEAF.len;
  return { start: 22 + i * 13, u, v: (r() - 0.5) * LEAF.wid * 0.5 };
});
const LENS_TARGETS = [12, 22, 31, 3, 40, 17, 26, 35, 7, 44, 20, 29];
const LENS_PHOTONS = LENS_TARGETS.map((ci, i) => ({ start: 80 + i * 12, ci }));
const SYNTH = 25; // the chloroplast where we watch glucose being made

// ------------------------------------------------------------------ pieces
const SunBeams: React.FC<{ on: number }> = ({ on }) => {
  const id = useSvgId("beam");
  const beams: [Pt, Pt][] = [
    [[260, 760], [480, 820]],
    [[640, 520], [880, 600]],
    [[1180, 300], [1460, 360]],
    [[1500, 520], [1720, 640]],
  ];
  return (
    <g opacity={on} style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={SUN_SRC[0]} y1={SUN_SRC[1]} x2={1400} y2={900}>
          <stop offset="0" stopColor={C.sun} stopOpacity={0.5} />
          <stop offset="0.55" stopColor={C.sun} stopOpacity={0.14} />
          <stop offset="1" stopColor={C.sun} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-b`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={22} />
        </filter>
      </defs>
      {beams.map(([a, b], i) => (
        <polygon key={i} points={`${SUN_SRC[0]},${SUN_SRC[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}`} fill={`url(#${id}-g)`} opacity={i % 2 ? 0.55 : 0.8} filter={`url(#${id}-b)`} />
      ))}
    </g>
  );
};

const Photon: React.FC<{ from: Pt; to: Pt; p: number }> = ({ from, to, p }) => {
  if (p <= 0 || p >= 1) return null;
  const e = p; // light travels at a constant speed, in a straight line
  const x = from[0] + (to[0] - from[0]) * e;
  const y = from[1] + (to[1] - from[1]) * e;
  const tail = 0.2;
  const tx = from[0] + (to[0] - from[0]) * Math.max(0, e - tail);
  const ty = from[1] + (to[1] - from[1]) * Math.max(0, e - tail);
  const fade = Math.min(1, p * 6) * Math.min(1, (1 - p) * 10);
  return (
    <g opacity={fade}>
      <line x1={tx} y1={ty} x2={x} y2={y} stroke={C.sun} strokeOpacity={0.55} strokeWidth={7} strokeLinecap="round" />
      <circle cx={x} cy={y} r={24} fill={C.sun} opacity={0.22} />
      <circle cx={x} cy={y} r={13} fill={C.sun} opacity={0.4} />
      <circle cx={x} cy={y} r={7.5} fill={mix(C.sun, C.paper, 0.6)} />
    </g>
  );
};

const Chloroplast: React.FC<{ c: Chloro; glow: number; appear: number; gid: string }> = ({ c, glow, appear, gid }) => {
  if (appear <= 0) return null;
  const s = 0.6 + 0.4 * EASE.out(appear);
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${c.rot}) scale(${s})`} opacity={appear}>
      {glow > 0.01 ? <ellipse rx={40} ry={30} fill={C.sun} opacity={0.75 * glow} filter={`url(#${gid}-glow)`} /> : null}
      <ellipse rx={23} ry={13} fill={`url(#${gid}-chl)`} />
      <ellipse rx={23} ry={13} fill={mix(C.leafLight, C.sun, 0.35)} opacity={0.7 * glow} />
      {[-10, 0, 10].map((dx) => (
        <line key={dx} x1={dx} y1={-6} x2={dx} y2={6} stroke={C.leafDark} strokeWidth={3.4} strokeLinecap="round" opacity={0.75} />
      ))}
      <ellipse rx={21.5} ry={11.5} fill="none" stroke={C.leafLight} strokeOpacity={0.55} strokeWidth={1.8} strokeDasharray="0 16 34 200" />
    </g>
  );
};

// ------------------------------------------------------------------ the equation
type Term = { text: string; color: string; at: number; size?: number };
const EQ_Y = 916;
const EQ_SIZE = 50;
const ARROW_LEN = 270;

const Equation: React.FC<{ f: number }> = ({ f }) => {
  const terms: (Term | "arrow")[] = [
    { text: "carbon dioxide", color: C.ice, at: 112 },
    { text: "+", color: C.ink300, at: 134 },
    { text: "water", color: C.ice, at: 134 },
    "arrow",
    { text: "glucose", color: C.amber, at: 204 },
    { text: "+", color: C.ink300, at: 222 },
    { text: "oxygen", color: C.coral, at: 222 },
  ];
  const gap = 22;
  const widths = terms.map((t) => (t === "arrow" ? ARROW_LEN : textWidth(t.text, EQ_SIZE, 600)));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (terms.length - 1);
  let x = 960 - total / 2;
  const arrowAt = 152;
  const items: React.ReactNode[] = [];
  terms.forEach((t, i) => {
    const w = widths[i];
    if (t === "arrow") {
      const p = prog(f, arrowAt, 18, EASE.inOut);
      const ax = x;
      const ay = EQ_Y - 16;
      const head = Math.max(0, p - 0.8) / 0.2;
      items.push(
        <g key="arrow">
          <line x1={ax} y1={ay} x2={ax + (w - 6) * p} y2={ay} stroke={C.paper} strokeWidth={5} strokeLinecap="round" />
          {head > 0 ? (
            <path d={`M${ax + w - 26},${ay - 16} L${ax + w - 4},${ay} L${ax + w - 26},${ay + 16}`} fill="none" stroke={C.paper} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={head} />
          ) : null}
          <text x={ax + w / 2} y={ay - 22} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={42} fill={C.sun} opacity={prog(f, arrowAt + 8, 14)}>
            light
          </text>
          <text x={ax + w / 2} y={ay + 52} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.leaf} opacity={prog(f, arrowAt + 20, 14)}>
            chlorophyll
          </text>
        </g>,
      );
    } else {
      const p = prog(f, t.at, 16);
      items.push(
        <text key={i} x={x} y={EQ_Y + (1 - p) * 14} fontFamily={FONT} fontWeight={600} fontSize={EQ_SIZE} fill={t.color} opacity={p} letterSpacing={-0.5}>
          {t.text}
        </text>,
      );
      if (t.text === "glucose") {
        items.push(<HandUnderline key="ul" x1={x - 4} x2={x + w + 4} y={EQ_Y + 16} progress={prog(f, 244, 22, (v) => v)} color={C.amber} width={6} seed={4} />);
      }
    }
    x += w + gap;
  });
  return <g>{items}</g>;
};

// ------------------------------------------------------------------ scene
export const PhotosynthesisPreview: React.FC = () => {
  const f = useCurrentFrame();
  const gid = useSvgId("ps");
  const g = leafGeometry();
  const leafD = smoothClosedPath(g.outline, 0.5);

  const beamsOn = prog(f, 0, 34);
  const leafIn = prog(f, 4, 30);
  const titleIn = prog(f, 14, 24);
  const cone = prog(f, 44, 18);
  const lensIn = prog(f, 52, 24);
  const labelP = prog(f, 98, 26);

  // chloroplast glow = light has reached it (energy transferred)
  const glowOf = (ci: number) => {
    let gl = 0;
    LENS_PHOTONS.forEach((ph) => {
      if (ph.ci === ci) gl = Math.max(gl, pulse(f, ph.start + 20, 34) + (f > ph.start + 37 ? 0.25 : 0));
    });
    if (ci === SYNTH) gl = Math.max(gl, window01(f, 170, 230, 14) * 0.9);
    return Math.min(1, gl);
  };

  const lensClip = `${gid}-clip`;
  const synth = CHLOROPLASTS[SYNTH];

  // carbon dioxide and water heading in, glucose made, oxygen leaving
  const co2Macro = [0, 1, 2].map((i) => {
    const start = 106 + i * 18;
    const p = prog(f, start, 76, EASE.inOut);
    const to = g.P(-120 + i * 140, LEAF.wid * 0.18);
    const from: Pt = [-70, 700 + i * 70];
    return { p, x: from[0] + (to[0] - from[0]) * p, y: from[1] + (to[1] - from[1]) * p - Math.sin(p * Math.PI) * 30, fade: 1 - prog(f, start + 64, 14), on: f >= start };
  });
  const co2Lens = [0, 1].map((i) => {
    const start = 128 + i * 22;
    const p = prog(f, start, 52, EASE.inOut);
    const from: Pt = [LENS.cx - 70 + i * 150, LENS.cy + LENS.r + 40];
    const to: Pt = [synth.x + 22 + i * 10, synth.y + 10];
    return { p, x: from[0] + (to[0] - from[0]) * p, y: from[1] + (to[1] - from[1]) * p, fade: 1 - prog(f, start + 46, 10), on: f >= start };
  });
  const water = [0, 1].map((i) => {
    const start = 120 + i * 26;
    const p = prog(f, start, 70, EASE.inOut);
    const path = [...g.petiole].reverse().concat([g.midrib[1], g.midrib[2]]);
    const seg = p * (path.length - 1);
    const k = Math.min(path.length - 2, Math.floor(seg));
    const t = seg - k;
    return { p, x: path[k][0] + (path[k + 1][0] - path[k][0]) * t, y: path[k][1] + (path[k + 1][1] - path[k][1]) * t, fade: 1 - prog(f, start + 58, 12), on: f >= start };
  });
  const glucoseP = prog(f, 196, 22);
  const gx = synth.x - 6 - 40 * prog(f, 212, 60);
  const gy = synth.y + 14 + 40 * prog(f, 212, 60);
  const o2Lens = [0, 1].map((i) => {
    const start = 212 + i * 20;
    const p = prog(f, start, 70, EASE.inOut);
    return { p, x: synth.x + 40 + p * (200 + i * 40), y: synth.y - 20 - p * (300 - i * 60), on: f >= start };
  });
  const o2Macro = [0, 1].map((i) => {
    const start = 218 + i * 18;
    const p = prog(f, start, 70, EASE.out);
    const from = g.P(-40 + i * 150, -LEAF.wid * 0.22);
    return { p, x: from[0] + p * 30, y: from[1] - p * 170, on: f >= start };
  });

  return (
    <AbsoluteFill>
      <Stage bg={{ tone: "warm", lightX: 0.1, lightY: 0.04 }}>
        <defs>
          <linearGradient id={`${gid}-chl`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={mix(C.chloro, C.leafLight, 0.25)} />
            <stop offset="1" stopColor={C.leafDeep} />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={8} />
          </filter>
          <radialGradient id={`${gid}-sunlit`} cx="0.2" cy="0.1" r="0.9">
            <stop offset="0" stopColor={C.sun} stopOpacity={0.28} />
            <stop offset="1" stopColor={C.sun} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${gid}-lensbg`} cx="0.35" cy="0.2" r="0.95">
            <stop offset="0" stopColor={mix(C.leafDark, C.ink700, 0.35)} />
            <stop offset="1" stopColor={C.ink900} />
          </radialGradient>
          <clipPath id={lensClip}>
            <circle cx={LENS.cx} cy={LENS.cy} r={LENS.r * (0.7 + 0.3 * EASE.out(lensIn))} />
          </clipPath>
        </defs>

        <SunBeams on={beamsOn} />

        {/* ---- the leaf (macro) ---- */}
        <g opacity={leafIn} transform={`translate(${LEAF.cx} ${LEAF.cy}) scale(${0.94 + 0.06 * EASE.out(leafIn)}) translate(${-LEAF.cx} ${-LEAF.cy})`}>
          <path d={smoothOpenPath(g.petiole)} fill="none" stroke={C.stem} strokeWidth={13} strokeLinecap="round" />
          <path d={smoothOpenPath(g.petiole)} fill="none" stroke={C.leafLight} strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" transform="translate(-3 -2)" />
          <LitShape d={leafD} top={C.leaf} bottom={C.leafDeep} rimOpacity={0.6} shadow={0.5} shadowDy={16} shadowBlur={18} />
          <path d={leafD} fill={`url(#${gid}-sunlit)`} />
          <path d={smoothOpenPath(g.midrib)} fill="none" stroke={C.leafLight} strokeOpacity={0.6} strokeWidth={5} strokeLinecap="round" />
          {g.veins.map((v, i) => (
            <path key={i} d={smoothOpenPath(v)} fill="none" stroke={C.leafLight} strokeOpacity={0.38} strokeWidth={3} strokeLinecap="round" />
          ))}
        </g>

        {/* light reaching the leaf */}
        {MACRO_PHOTONS.map((ph, i) => {
          const to = g.P(ph.u, ph.v);
          const from: Pt = [SUN_SRC[0] + 380 + (i % 3) * 60, SUN_SRC[1] + 380];
          return <Photon key={i} from={from} to={to} p={(f - ph.start) / 24} />;
        })}

        {/* water up the stalk, carbon dioxide from the air */}
        {water.map((w, i) => (w.on ? <Water key={`w${i}`} x={w.x} y={w.y} scale={0.62} progress={prog(f, 120 + i * 26, 10)} opacity={w.fade} seed={70 + i} /> : null))}
        {co2Macro.map((m, i) => (m.on ? <CarbonDioxide key={`c${i}`} x={m.x} y={m.y} scale={0.62} rotate={-20 + i * 25} progress={prog(f, 106 + i * 18, 12)} opacity={m.fade} seed={80 + i} /> : null))}
        {o2Macro.map((m, i) => (m.on ? <Oxygen key={`o${i}`} x={m.x} y={m.y} scale={0.62} progress={prog(f, 218 + i * 18, 12)} opacity={1 - prog(f, 218 + i * 18 + 40, 18)} seed={90 + i} /> : null))}

        {/* ---- the lens: inside the leaf ---- */}
        <g opacity={cone}>
          <circle cx={ZOOM_AT[0]} cy={ZOOM_AT[1]} r={34} fill="none" stroke={C.paper} strokeOpacity={0.75} strokeWidth={3.5} />
          {(() => {
            const dx = LENS.cx - ZOOM_AT[0];
            const dy = LENS.cy - ZOOM_AT[1];
            const d = Math.hypot(dx, dy);
            const base = Math.atan2(dy, dx);
            const off = Math.asin((LENS.r - 34) / d);
            return [1, -1].map((s) => {
              const a = base + s * (Math.PI / 2 + off);
              const p1: Pt = [ZOOM_AT[0] + Math.cos(a) * 34, ZOOM_AT[1] + Math.sin(a) * 34];
              const p2: Pt = [LENS.cx + Math.cos(a) * LENS.r, LENS.cy + Math.sin(a) * LENS.r];
              return <line key={s} x1={p1[0]} y1={p1[1]} x2={p1[0] + (p2[0] - p1[0]) * cone} y2={p1[1] + (p2[1] - p1[1]) * cone} stroke={C.paper} strokeOpacity={0.3} strokeWidth={2.5} />;
            });
          })()}
        </g>
        {lensIn > 0 ? (
          <g opacity={lensIn}>
            <circle cx={LENS.cx} cy={LENS.cy + 14} r={LENS.r} fill={C.ink950} opacity={0.5} filter={`url(#${gid}-glow)`} />
            <g clipPath={`url(#${lensClip})`}>
              <rect x={LENS.cx - LENS.r} y={LENS.cy - LENS.r} width={LENS.r * 2} height={LENS.r * 2} fill={`url(#${gid}-lensbg)`} />
              {/* cuticle + upper epidermis: transparent, so light passes straight through */}
              <rect x={LENS.cx - LENS.r} y={286} width={LENS.r * 2} height={8} rx={4} fill={C.paper} opacity={0.22} />
              {Array.from({ length: 7 }, (_, i) => (
                <rect key={i} x={LENS.cx - 330 + i * 96} y={298} width={90} height={44} rx={14} fill={C.paper} opacity={0.07} stroke={C.paper} strokeOpacity={0.28} strokeWidth={2.5} />
              ))}
              {/* palisade mesophyll: tall cells, packed with chloroplasts */}
              {CELLS.map((c, i) => (
                <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={30} fill={mix(C.leafDark, C.ink900, 0.35)} stroke={C.leafLight} strokeOpacity={0.4} strokeWidth={3} />
              ))}
              {CHLOROPLASTS.map((c, i) => (
                <Chloroplast key={i} c={c} glow={glowOf(i)} appear={prog(f, 62 + (i % 9) * 2, 14)} gid={gid} />
              ))}
              {LENS_PHOTONS.map((ph, i) => {
                const c = CHLOROPLASTS[ph.ci];
                return <Photon key={i} from={[c.x - 120, LENS.cy - LENS.r - 30]} to={[c.x, c.y]} p={(f - ph.start) / 22} />;
              })}
              {co2Lens.map((m, i) => (m.on ? <CarbonDioxide key={`lc${i}`} x={m.x} y={m.y} scale={0.48} rotate={60} progress={prog(f, 128 + i * 22, 10)} opacity={m.fade} seed={60 + i} /> : null))}
              {glucoseP > 0 ? <GlucoseRing x={gx} y={gy} tone="sugar" glow={glucoseP} scale={0.6 + 0.45 * EASE.out(glucoseP)} opacity={glucoseP} gid={`${gid}-glc`} /> : null}
              {o2Lens.map((m, i) => (m.on ? <Oxygen key={`lo${i}`} x={m.x} y={m.y} scale={0.48} progress={prog(f, 212 + i * 20, 10)} seed={50 + i} /> : null))}
            </g>
            <circle cx={LENS.cx} cy={LENS.cy} r={LENS.r * (0.7 + 0.3 * EASE.out(lensIn))} fill="none" stroke={C.paper} strokeOpacity={0.85} strokeWidth={5} />
            <circle cx={LENS.cx} cy={LENS.cy} r={LENS.r * (0.7 + 0.3 * EASE.out(lensIn)) + 9} fill="none" stroke={C.paper} strokeOpacity={0.18} strokeWidth={2} />
          </g>
        ) : null}

        {/* labels: one idea each */}
        <Label anchor={[CHLOROPLASTS[2].x, CHLOROPLASTS[2].y]} at={[1060, 236]} text="chloroplast" sub="contains chlorophyll" progress={labelP} align="end" opacity={1 - prog(f, 186, 14)} />
        <Label anchor={[gx, gy]} at={[1060, 236]} text="glucose" sub="a sugar" progress={prog(f, 200, 24)} align="end" color={C.amberLight} />

        <text x={130} y={196} fontFamily={FONT} fontWeight={700} fontSize={88} fill={C.paper} opacity={titleIn} letterSpacing={-1.5} transform={`translate(0 ${(1 - EASE.out(titleIn)) * 18})`}>
          Photosynthesis
        </text>
        <Equation f={f} />
        <DepthMolecules count={4} seed={23} kind="water" blur={14} opacity={0.32} />
      </Stage>
      <div style={{ position: "absolute", right: 40, top: 30, fontFamily: FONT, fontSize: 24, color: C.ink400, opacity: 0.8 }}>style preview · not final</div>
    </AbsoluteFill>
  );
};

