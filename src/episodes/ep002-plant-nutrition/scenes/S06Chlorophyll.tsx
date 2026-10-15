/**
 * S06 · Chlorophyll — what the light actually does (the approved preview, extended).
 *
 * 1. The leaf in sunlight; light lands on it in straight lines.
 * 2. The lens opens: palisade cells, then their chloroplasts ("chloroplast"), then the chlorophyll in
 *    them turns a brighter green ("chlorophyll · green pigment").
 * 3. "Chlorophyll absorbs light": photons stream into the lens; each chloroplast glows where light lands.
 * 4. "Transfers energy": the lens zooms in on one chloroplast (a change of scale). Carbon dioxide and
 *    water arrive, energy flows out of the glowing chloroplast (sun yellow turning amber) and a
 *    glucose ring forms and glows: "energy in chemicals · stored in glucose".
 * 5. Exam tip: "transfers energy", with "makes energy" struck through; one more photon is absorbed and
 *    passed on to the glucose as "transfers" is underlined.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { ExamTip } from "../../../components/ExamTip";
import { Lens } from "../../../components/Lens";
import { Photon, SunBeams } from "../../../components/Light";
import { Glucose } from "../../../components/SugarChain";
import { Leaf, leafGeometry } from "../../../components/bio";
import { CarbonDioxide, HandUnderline, Water, mix, textWidth } from "../../../components/kit";
import { Pt, hexPoints, rng, roundedPolygon } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s06Timing } from "./S06Chlorophyll.timing";
import { LEAF_LENS } from "./layout";
import { CHLOROPLASTS, ChloroDefs, Chloroplast, FOCUS, IN_LENS, LeafInterior, RING_AT, SYNTH } from "./parts/S06-cells";

// ------------------------------------------------------------------ layout
const LEAF = LEAF_LENS.leaf;
const LENS = LEAF_LENS.lens;
const SUN: Pt = [LEAF_LENS.sunSource[0], LEAF_LENS.sunSource[1]];
const ZOOM_AT: Pt = [LEAF_LENS.zoomAt[0], LEAF_LENS.zoomAt[1]];
const GEO = leafGeometry({ cx: LEAF.cx, cy: LEAF.cy, len: LEAF.len, wid: LEAF.wid, ang: LEAF.ang, stalk: 0.24 });
const BEAMS: [Pt, Pt][] = [
  [[260, 760], [480, 820]],
  [[640, 520], [880, 600]],
  [[1180, 300], [1460, 360]],
  [[1500, 520], [1720, 640]],
];
/** Direction the light travels (from the sun, top-left, towards the leaf). */
const DIR: Pt = (() => {
  const dx = ZOOM_AT[0] - SUN[0];
  const dy = ZOOM_AT[1] - SUN[1];
  const d = Math.hypot(dx, dy);
  return [dx / d, dy / d];
})();
const MACRO_TRAVEL = 24;
const LENS_TRAVEL = 22;
const SPARK_TRAVEL = 22;
const ZOOM = 1.8;
const RING_SCALE = 0.95;
const HEX_D = roundedPolygon(hexPoints(30), 6);
/** Exam tip card (centre), in the space the leaf leaves. */
const TIP: Pt = [600, 540];
const TIP_TEXT = "transfers energy";
const TIP_NOT = "makes energy";
/** A chloroplast low in the lens for the "chlorophyll" label. */
const CHL_LABEL_I = 18;

const back = (p: Pt, len: number): Pt => [p[0] - DIR[0] * len, p[1] - DIR[1] * len];
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};

export const S06Chlorophyll: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s06Timing(sc);
  const gid = useSvgId("s06");

  // ---------------------------------------------------------------- the leaf (macro)
  const leafIn = prog(f, -9, 28);
  const leafOut = 1 - prog(f, k.careful - 4, 24);
  const beamsOn = prog(f, -9, 34) * (1 - 0.45 * prog(f, k.careful - 4, 30));

  // light landing on the leaf (from "light" until the leaf makes way for the exam tip)
  const macro: { s: number; to: Pt }[] = [];
  {
    const r = rng(31);
    for (let s = k.light - MACRO_TRAVEL + 4; s + MACRO_TRAVEL < k.careful - 6; s += 11) {
      const t = 0.2 + r() * 0.66;
      const u = -LEAF.len / 2 + t * LEAF.len;
      const v = (r() - 0.5) * 1.4 * GEO.half(t);
      macro.push({ s, to: GEO.P(u, v) });
    }
  }

  // ---------------------------------------------------------------- the lens
  const cone = prog(f, k.chloroplasts - 2, 18) * leafOut;
  const lensOpen = prog(f, k.chloroplasts + 4, 24);
  const interior = prog(f, k.cells - 8, 22);
  const chlAppear = (i: number) => prog(f, k.chloroWord - 6 + (i % 9) * 2, 14);
  // "chlorophyll, a green pigment": the chloroplasts turn a brighter green, left to right
  const greenOf = (x: number) => prog(f, k.chlWord - 4 + (x - 1150) * 0.06, 14) * (1 - prog(f, k.absorbs - 2, 24));

  // zoom into one chloroplast while the energy transfer is explained (cell → chloroplast scale)
  const zp = prog(f, k.transfersWord - 4, 44, EASE.inOut);
  const z = 1 + (ZOOM - 1) * zp;
  const F: Pt = [LENS.cx + (FOCUS[0] - LENS.cx) * zp, LENS.cy + (FOCUS[1] - LENS.cy) * zp];
  const toScreen = (w: Pt): Pt => [LENS.cx + (w[0] - F[0]) * z, LENS.cy + (w[1] - F[1]) * z];
  const camT = `translate(${LENS.cx} ${LENS.cy}) scale(${z}) translate(${-F[0]} ${-F[1]})`;

  // photons into the lens: from "absorbs", then a calm stream to the end
  const lensPh: { s: number; ci: number; size: number }[] = [];
  {
    const r = rng(57);
    const near = CHLOROPLASTS.map((c, i) => ({ c, i }))
      .filter(({ c, i }) => i !== SYNTH && Math.hypot(c.x - FOCUS[0], c.y - FOCUS[1]) < 125)
      .map(({ i }) => i);
    const wide = IN_LENS.filter((i) => i !== SYNTH);
    let i = 0;
    for (let s = k.absorbs - LENS_TRAVEL + 6; s + LENS_TRAVEL < k.end + 10; i++) {
      const land = s + LENS_TRAVEL;
      const toSynth = land >= k.transfer - 6 && land <= k.stored + 10 && i % 2 === 0;
      const pool = land > k.transfersWord + 20 ? near : wide;
      const ci = toSynth ? SYNTH : pool[Math.floor(r() * pool.length)];
      // the demonstration photon ("Chlorophyll transfers it") gets the stage to itself
      if (Math.abs(land - k.transfers) > 14) lensPh.push({ s, ci, size: 1 });
      s += land < k.stored + 10 ? 9 : 17;
    }
    lensPh.push({ s: k.transfers - LENS_TRAVEL, ci: SYNTH, size: 1.4 });
  }
  const glowOf = (ci: number) => {
    let g = 0;
    for (const ph of lensPh) {
      if (ph.ci !== ci) continue;
      const land = ph.s + LENS_TRAVEL;
      if (f < land - 2) continue;
      g = Math.max(g, 0.18, pulse(f, land - 2, 30) * (ph.size > 1 ? 1 : 0.85));
    }
    if (ci === SYNTH) g = Math.max(g, window01(f, k.transfer - 4, k.stored + 30, 16) * 0.8);
    return Math.min(1, g);
  };

  // energy flows out of the chloroplast into the glucose being made
  const SYN = CHLOROPLASTS[SYNTH];
  const sparkFrom: Pt = [SYN.x - 6, SYN.y + 8];
  const sparkCtrl: Pt = [SYN.x + 18, RING_AT[1] - 6];
  const sparks: number[] = [];
  for (let s = k.transfersWord + 18; s < k.stored + 16; s += 6) sparks.push(s);
  const demoSpark = k.transfers + 4;
  for (let j = 0; j < 4; j++) sparks.push(demoSpark + j * 6);

  // carbon dioxide and water arrive: the raw materials of the glucose
  const raw = [
    { kind: "co2", off: [-170, 110] as Pt, d: 0 },
    { kind: "h2o", off: [-90, 175] as Pt, d: 10 },
    { kind: "co2", off: [90, 170] as Pt, d: 18 },
  ];
  const rawStart = k.transfersWord + 14;
  const rawEnd = Math.max(rawStart + 30, k.chemicals - 12);

  // the glucose ring: outline, then filled and glowing
  const outline = prog(f, k.chemicals - 28, 22, (v) => v);
  const ringP = prog(f, k.chemicals - 10, 20);
  const ringGlow =
    ringP *
    Math.min(
      1,
      0.55 + 0.35 * window01(f, k.chemicals - 10, k.stored + 30, 20) + 0.25 * pulse(f, k.carbohydrates - 4, 30) + 0.45 * pulse(f, demoSpark + SPARK_TRAVEL - 2, 34),
    );
  const ringS = RING_SCALE * (0.7 + 0.3 * EASE.out(ringP)) * (1 + 0.06 * pulse(f, k.carbohydrates - 4, 30) + 0.05 * pulse(f, demoSpark + SPARK_TRAVEL - 2, 30));

  // ---------------------------------------------------------------- labels
  const chlLabelOut = 1 - prog(f, k.transfersWord - 10, 12);
  const chlAnchor = CHLOROPLASTS[CHL_LABEL_I];
  const chlAt: Pt = [1090, 790];
  const subGreen = prog(f, k.green - 2, 14) * (1 - prog(f, k.absorbs - 4, 10));
  const subAbsorb = prog(f, k.absorbs + 2, 14);
  // the label points at the ring's lower edge (its dot must not cover the ring)
  const ringScreen = toScreen([RING_AT[0], RING_AT[1] + 22]);
  const energyAt: Pt = [1300, 850];
  const energyOut = 1 - prog(f, k.careful - 6, 14);

  // ---------------------------------------------------------------- exam tip
  const tipP = prog(f, k.careful + 2, 24);
  const strike = prog(f, k.makes - 2, 18, (v) => v);
  const tipGeo = (() => {
    const p = EASE.out(Math.min(1, tipP));
    // mirrors ExamTip's own layout (components/ExamTip.tsx)
    const w = Math.max(textWidth(TIP_TEXT, 50, 700), textWidth(TIP_NOT, 42, 500), textWidth("EXAM TIP", 40, 700) + 60) + 90;
    const h = 226;
    return { l: TIP[0] - w / 2, t: TIP[1] - h / 2 + (1 - p) * 40, op: Math.min(1, tipP * 2) };
  })();
  const transfersW = textWidth("transfers", 50, 700, -0.5);
  const underline = prog(f, k.transfersIt - 2, 20, (v) => v);
  const wordPulse = pulse(f, k.syllabusWord - 4, 40);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.1, lightY: 0.04 }}>
      <ChloroDefs gid={gid} />
      <defs>
        <filter id={`${gid}-soft`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>

      <SunBeams source={SUN} beams={BEAMS} on={beamsOn} fadeTo={[1400, 900]} />

      {/* ============ the leaf ============ */}
      {leafOut > 0 ? (
        <g opacity={leafOut}>
          <Leaf geo={GEO} progress={leafIn} sunlit={1} />
          {macro.map((m, i) => {
            const land = m.s + MACRO_TRAVEL;
            const flash = pulse(f, land - 2, 18);
            return (
              <g key={i}>
                <Photon from={back(m.to, 420)} to={m.to} p={(f - m.s) / MACRO_TRAVEL} />
                {flash > 0 ? <circle cx={m.to[0]} cy={m.to[1]} r={20} fill={C.sun} opacity={0.4 * flash} filter={`url(#${gid}-soft)`} /> : null}
              </g>
            );
          })}
        </g>
      ) : null}

      {/* ============ the lens: inside the leaf ============ */}
      <Lens cx={LENS.cx} cy={LENS.cy} r={LENS.r} from={ZOOM_AT} fromR={34 / z} cone={cone} open={lensOpen}>
        <g transform={camT}>
          <LeafInterior p={interior} />
          {CHLOROPLASTS.map((c, i) => (
            <Chloroplast key={i} c={c} glow={glowOf(i)} appear={chlAppear(i)} green={greenOf(c.x)} gid={gid} />
          ))}
          {/* light: straight lines from the top left, absorbed where it lands */}
          {lensPh.map((ph, i) => {
            const c = CHLOROPLASTS[ph.ci];
            const to: Pt = [c.x, c.y];
            return <Photon key={i} from={back(to, 330)} to={to} p={(f - ph.s) / LENS_TRAVEL} size={(ph.size * 1.05) / z} />;
          })}
          {/* raw materials */}
          {f >= rawStart && f < rawEnd + 4
            ? raw.map((m, i) => {
                const s = rawStart + m.d;
                const q = prog(f, s, rawEnd - s, EASE.inOut);
                const into = Math.max(0, (q - 0.75) / 0.25);
                const x = RING_AT[0] + m.off[0] * (1 - q);
                const y = RING_AT[1] + m.off[1] * (1 - q);
                const common = { x, y, scale: 0.4 * (1 - 0.6 * into), progress: prog(f, s, 12), opacity: 1 - into, seed: 70 + i, rotate: -20 + i * 40 };
                return m.kind === "co2" ? <CarbonDioxide key={i} {...common} /> : <Water key={i} {...common} />;
              })
            : null}
          {/* the glucose ring forming */}
          {outline > 0 && ringP < 1 ? (
            <path
              d={HEX_D}
              transform={`translate(${RING_AT[0]} ${RING_AT[1]}) scale(${RING_SCALE})`}
              fill="none"
              stroke={C.amber}
              strokeWidth={3.5}
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - outline}
              opacity={1 - ringP}
            />
          ) : null}
          {ringP > 0 ? <Glucose x={RING_AT[0]} y={RING_AT[1]} tone="sugar" glow={ringGlow} scale={ringS} opacity={Math.min(1, ringP * 1.5)} /> : null}
          {/* energy: out of the chloroplast, into the glucose (light energy → energy in chemicals) */}
          {sparks.map((s, i) => {
            const p = (f - s) / SPARK_TRAVEL;
            if (p <= 0 || p >= 1) return null;
            const e = EASE.inOut(p);
            const [x, y] = quad(sparkFrom, sparkCtrl, RING_AT, e);
            const col = mix(C.sun, C.amber, e);
            const fade = Math.min(1, p * 5) * Math.min(1, (1 - p) * 6);
            return (
              <g key={i} opacity={fade}>
                <circle cx={x} cy={y} r={11} fill={col} opacity={0.45} filter={`url(#${gid}-soft)`} />
                <circle cx={x} cy={y} r={5.2} fill={mix(col, C.paper, 0.4)} />
              </g>
            );
          })}
        </g>
      </Lens>

      {/* ============ labels (outside the zoom, constant size) ============ */}
      <Label
        anchor={toScreen([CHLOROPLASTS[2].x, CHLOROPLASTS[2].y])}
        at={[1060, 236]}
        text="chloroplast"
        align="end"
        color={C.leafLight}
        progress={prog(f, k.chloroWord - 2, 24)}
        opacity={chlLabelOut}
      />
      <Label anchor={toScreen([chlAnchor.x, chlAnchor.y])} at={chlAt} text="chlorophyll" align="end" color={C.leaf} progress={prog(f, k.chlWord - 2, 24)} opacity={chlLabelOut} />
      {chlLabelOut > 0 ? (
        <g opacity={chlLabelOut}>
          <SubLine x={chlAt[0] - 14} y={chlAt[1] + 61} text="green pigment" color={C.ink300} p={subGreen} anchor="end" />
          <SubLine x={chlAt[0] - 14} y={chlAt[1] + 61} text="absorbs light" color={C.sun} p={subAbsorb} anchor="end" />
        </g>
      ) : null}
      <Label anchor={ringScreen} at={energyAt} text="energy in chemicals" color={C.amberLight} progress={prog(f, k.chemicals - 2, 24)} opacity={energyOut} />
      {energyOut > 0 ? <SubLine x={energyAt[0] + 14} y={energyAt[1] + 61} text="stored in glucose" color={C.ink300} p={prog(f, k.storedWord - 2, 16)} opacity={energyOut} /> : null}

      {/* ============ exam tip ============ */}
      <ExamTip x={TIP[0]} y={TIP[1]} text={TIP_TEXT} not={TIP_NOT} progress={tipP} strike={strike} />
      {tipP > 0 ? (
        <g opacity={tipGeo.op}>
          {wordPulse > 0 ? (
            <text x={tipGeo.l + 44} y={tipGeo.t + 122} fontFamily={FONT} fontWeight={700} fontSize={50} fill={C.amberLight} letterSpacing={-0.5} opacity={wordPulse}>
              transfers
            </text>
          ) : null}
          <HandUnderline x1={tipGeo.l + 40} x2={tipGeo.l + 48 + transfersW} y={tipGeo.t + 138} progress={underline} color={C.amber} width={6} seed={6} />
        </g>
      ) : null}

      <SectionTag n={1} title="What is photosynthesis?" t={200} />
    </Stage>
  );
};

/** A second line under a Label, matching the Label's sub-text style, that can arrive on its own cue. */
const SubLine: React.FC<{ x: number; y: number; text: string; color: string; p: number; anchor?: "start" | "end"; opacity?: number }> = ({
  x,
  y,
  text,
  color,
  p,
  anchor = "start",
  opacity = 1,
}) => {
  if (p <= 0 || opacity <= 0) return null;
  return (
    <text
      x={x + (1 - EASE.out(p)) * (anchor === "end" ? 12 : -12)}
      y={y}
      textAnchor={anchor}
      fontFamily={FONT}
      fontWeight={400}
      fontSize={40}
      fill={color}
      stroke={C.ink900}
      strokeWidth={6}
      strokeOpacity={0.6}
      paintOrder="stroke"
      opacity={p * opacity}
    >
      {text}
    </text>
  );
};
