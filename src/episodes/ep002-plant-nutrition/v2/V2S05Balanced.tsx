/**
 * EP002 v2 · S05 — the balanced symbol equation, then a see-saw counting game that proves it balances.
 * Part 1 ("What is photosynthesis?") continues, on a notebook page (no part card; the part tag stays).
 *
 *  {symbol}      a pen writes the heading "balanced symbol equation:" as it is said.
 *  {balanced}    the pen writes the equation large, each glyph as it is read ("Six C O two, plus …"):
 *                6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (real subscripts; reactants blue, glucose amber, oxygen red).
 *                Each formula's name appears under it (carbon dioxide, water, glucose, oxygen).
 *  {check}       "Let's check it balances": the names clear; a see-saw is drawn below the equation with a
 *                "reactants" tray under the left side and a "products" tray under the right side.
 *  {carbon} …    the counting game, one element at a time. When a number is said, the atoms it counts are
 *                highlighted in the equation (coefficient + symbol, e.g. 6 and O₂), that many atom beads
 *                (carbon black, hydrogen white, oxygen red; six per line) hop into that side's tray, the
 *                number is written beside the row, and the plank tips towards the fuller side.
 *                Carbon 6 | 6 · hydrogen 12 | 12 · oxygen 12+6=18 | 6+12=18. Each time the right side
 *                catches up the plank levels again and a green "=" is written between the rows.
 *  {balances}    "It balances": the highlights clear, the three "=" pulse, a BALANCED ✓ stamp lands and the
 *                fulcrum smiles.
 * The see-saw is a counting game, not a weighing: it tips by the number of atoms on each side.
 */
import React from "react";
import { spring } from "remotion";
import { C, EASE, W2 } from "../../../brand/tokens";
import { WorldStage } from "../../../components/fun";
import { AtomBadge, AtomPip, type BeadAtom } from "../../../components/fun/AtomBeads";
import { InkTopicTag } from "../../../components/fun/BenchLab";
import { HAND_SUB, HAND_SUB_DROP, HandChem, handChemGlyphs } from "../../../components/fun/HandChem";
import { Scribble, caveatWidth } from "../../../components/fun/Handwriting";
import { InkStamp } from "../../../components/fun/InkStamp";
import { quillAt, type QuillJob } from "../../../components/fun/Journal";
import { HighlightSwipe, InkShape } from "../../../components/fun/NotebookDoodles";
import { SeeSaw, seeSawToPage, type SeeSawLayout } from "../../../components/fun/SeeSaw";
import { writeAsSpoken, writtenPx, scribbleProgress, isWriting } from "../../../components/fun/SpokenWriting";
import { Pen } from "../../../components/fun/StudyProps";
import { HandArrow, HandLayer, mix, seg } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s05Timing } from "../scenes/S05Balanced.timing";

const linear = (v: number) => v;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ------------------------------------------------------------------ layout (notebook rules every 62 px from y 120)
const HEAD = { x: 200, y: 244, size: 60 } as const; // "balanced symbol equation:"
const SIZE = 124; // the equation's handwriting
const EQ_Y = 368; // its baseline (a rule)
const GAP = 34;
const ARROW_W = 172;
const NAME_Y = 474;
const NAME_SIZE = 56;

const SAW: SeeSawLayout = { cx: 960, cy: 852, half: 700, thick: 24, footY: 960, footW: 210 };
const MAX_TILT = 5; // degrees
const TRAY_W = 540;
const TRAY_H = 350;
const TRAY_TOP = -(SAW.thick ?? 24) - TRAY_H; // plank frame
const TRAY_X0 = { L: -640, R: 100 } as const; // plank frame
const HEADER_Y = 60;
const DIVIDER_Y = 84;
const BADGE_X = 56;
const PIP_X0 = 120;
const PIP_DX = 32;
const COUNT_CX = 412;
const COUNT_SIZE = 60;
const ROWS: Record<BeadAtom, readonly number[]> = { C: [116], H: [174, 204], O: [262, 292, 322] };
const rowMid = (k: BeadAtom) => (ROWS[k][0] + ROWS[k][ROWS[k].length - 1]) / 2;

// ------------------------------------------------------------------ the equation (laid out glyph by glyph)
const PARTS = ["6CO2", "+", "6H2O", "→", "C6H12O6", "+", "6O2"] as const;
const PART_COLOUR = [C.iceDeep, W2.inkText, C.iceDeep, W2.inkText, C.amberDeep, W2.inkText, C.coralDeep] as const;
const NAMES: readonly (string | null)[] = ["carbon dioxide", null, "water", null, "glucose", null, "oxygen"];
const ARROW_PART = 3;
type EqGlyph = { readonly x0: number; readonly x1: number; readonly sub: boolean; readonly part: number; readonly idx: number; readonly i: number };
const EQ = (() => {
  const glyphs: EqGlyph[] = [];
  const parts: { x0: number; x1: number; cx: number }[] = [];
  let x = 0;
  PARTS.forEach((t, part) => {
    if (part > 0) x += GAP;
    const start = x;
    if (t === "→") {
      glyphs.push({ x0: x, x1: x + ARROW_W, sub: false, part, idx: 0, i: glyphs.length });
      x += ARROW_W;
    } else {
      const g = handChemGlyphs(t, SIZE);
      g.glyphs.forEach((gl, idx) => glyphs.push({ x0: x + gl.x0, x1: x + gl.x1, sub: gl.sub, part, idx, i: glyphs.length }));
      x += g.width;
    }
    parts.push({ x0: start, x1: x, cx: (start + x) / 2 });
  });
  return { glyphs, parts, width: x };
})();
const EQ_X = 960 - EQ.width / 2;
const partGlyphs = (part: number) => EQ.glyphs.filter((g) => g.part === part);
/** where the pen tip sits while writing a glyph (normal glyphs at mid-height, subscripts lower) */
const tipY = (g: EqGlyph) => (g.sub ? EQ_Y + SIZE * HAND_SUB_DROP - SIZE * HAND_SUB * 0.32 : EQ_Y - SIZE * 0.32);

// ------------------------------------------------------------------ the counting groups
type Group = {
  readonly side: "L" | "R";
  readonly kind: BeadAtom;
  readonly term: number; // which part of the equation
  readonly hl: readonly number[]; // glyph idx (in that part) highlighted: coefficient + the atoms
  readonly src: readonly number[]; // glyphs the beads come out of
  readonly slot0: number;
  readonly n: number;
  readonly at: number;
};

type Tok = { readonly t: string; readonly color: string; readonly at: number };

export const V2S05Balanced: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s05Timing(sc);
  const W = (key: string, nth: number) => ({ t0: sc.word(key, nth), t1: sc.wordEnd(key, nth) });

  // ================================================================ 1 · heading, written as it is said
  const [head] = writeAsSpoken(
    [
      [
        { text: "balanced", ...W("balanced", 1) },
        { text: "symbol", ...W("symbol", 1) },
        { text: "equation:", ...W("equation", 1) },
      ],
    ],
    HEAD.size,
    { minFrames: 8 },
  );
  const headPx = writtenPx(head, f);

  // ================================================================ 2 · the equation, glyph by glyph as it is read
  // the spoken word that writes each glyph, part by part (one glyph per coefficient, symbol or subscript)
  const said: { t0: number; t1: number }[][] = [
    [W("six", 1), W("c", 1), W("o", 1), W("two", 1)],
    [W("plus", 1)],
    [W("six", 2), W("h", 1), W("two", 2), W("o", 2)],
    [W("gives", 1)],
    (() => {
      const tw = W("twelve", 1);
      const mid = Math.round((tw.t0 + tw.t1) / 2);
      return [W("c", 2), W("six", 3), W("h", 2), { t0: tw.t0, t1: mid }, { t0: mid, t1: tw.t1 }, W("o", 3), W("six", 4)];
    })(),
    [W("plus", 2)],
    [W("six", 5), W("o", 4), W("two", 3)],
  ];
  // schedule (indexed like EQ.glyphs): a glyph never starts before the previous one is finished, ≥ 4 frames
  const sched: [number, number][] = (() => {
    let prev = -Infinity;
    return said.flat().map(({ t0: a, t1: b }) => {
      const t0 = Math.max(a - 2, prev);
      const t1 = Math.max(t0 + 4, b - 3);
      prev = t1;
      return [t0, t1] as [number, number];
    });
  })();
  const partStart = (part: number) => sched[partGlyphs(part)[0].i][0];
  const partEnd = (part: number) => sched[partGlyphs(part).slice(-1)[0].i][1];
  /** px of the equation written by frame fr (layout units = px, scale 1) */
  const revealAt = (fr: number) => {
    let x = 0;
    for (const g of EQ.glyphs) {
      const [t0, t1] = sched[g.i];
      if (fr < t0) return x;
      if (fr < t1) return g.x0 + (g.x1 - g.x0) * ((fr - t0) / (t1 - t0));
      x = g.x1;
    }
    return EQ.width + SIZE;
  };
  const partTip = (part: number) => (fr: number): Pt => {
    const gs = partGlyphs(part);
    for (let j = 0; j < gs.length; j++) {
      const g = gs[j];
      const [t0, t1] = sched[g.i];
      if (fr < t1 || j === gs.length - 1) {
        const u = clamp01((fr - t0) / (t1 - t0));
        if (part === ARROW_PART) return [EQ_X + g.x0 + (g.x1 - g.x0) * u, EQ_Y - SIZE * 0.32];
        const prevY = j > 0 ? tipY(gs[j - 1]) : tipY(g);
        const y = prevY + (tipY(g) - prevY) * clamp01(u / 0.35);
        const bob = fr >= t0 && fr < t1 ? Math.sin(fr * 1.9) * SIZE * 0.06 : 0;
        return [EQ_X + g.x0 + (g.x1 - g.x0) * u, y + bob];
      }
    }
    return [EQ_X + EQ.width, EQ_Y];
  };
  const headTip = (fr: number): Pt => [HEAD.x + writtenPx(head, fr), HEAD.y - HEAD.size * 0.3 + (isWriting(head, fr) ? Math.sin(fr * 1.9) * HEAD.size * 0.1 : 0)];
  const jobs: QuillJob[] = [
    { start: head.t0, end: head.t1, tip: headTip },
    ...EQ.parts.map((_, i) => ({ start: partStart(i), end: partEnd(i), tip: partTip(i) })),
  ];
  const pen = quillAt(jobs, f, 30);

  // names under the formulas (they make way for the see-saw)
  const namesOut = prog(f, k.check - 4, 14, EASE.in);

  // ================================================================ 3 · the see-saw and its trays
  const sawDraw = prog(f, k.check - 2, 34, linear);
  const sawFill = prog(f, k.check + 16, 22, linear);
  const trayDraw = prog(f, k.check + 8, 30, linear);
  const trayFill = prog(f, k.check + 24, 18, linear);

  const groups: Group[] = [
    { side: "L", kind: "C", term: 0, hl: [0, 1], src: [1], slot0: 0, n: 6, at: k.cL },
    { side: "R", kind: "C", term: 4, hl: [0, 1], src: [0], slot0: 0, n: 6, at: k.cR },
    { side: "L", kind: "H", term: 2, hl: [0, 1, 2], src: [1, 2], slot0: 0, n: 12, at: k.hL },
    { side: "R", kind: "H", term: 4, hl: [2, 3, 4], src: [2, 3, 4], slot0: 0, n: 12, at: k.hR },
    { side: "L", kind: "O", term: 0, hl: [0, 2, 3], src: [2, 3], slot0: 0, n: 12, at: k.oL1 },
    { side: "L", kind: "O", term: 2, hl: [0, 3], src: [3], slot0: 12, n: 6, at: k.oL2 },
    { side: "R", kind: "O", term: 4, hl: [5, 6], src: [5, 6], slot0: 0, n: 6, at: k.oR1 },
    { side: "R", kind: "O", term: 6, hl: [0, 1, 2], src: [1, 2], slot0: 6, n: 12, at: k.oR2 },
  ];
  const FLIGHT = 15;
  const pips = groups.flatMap((g, gi) => {
    const stagger = g.n <= 6 ? 2 : 1.25;
    return Array.from({ length: g.n }, (_, i) => {
      const slot = g.slot0 + i;
      const launch = g.at - 3 + i * stagger;
      return { g, gi, i, slot, launch, land: launch + FLIGHT };
    });
  });

  // the plank tips by the number of atoms that have landed on each side (a counting game, not weighing)
  let diff = 0;
  for (const p of pips) {
    if (f < p.land) continue;
    const s = spring({ frame: f - p.land, fps: 30, config: { damping: 11, mass: 0.7, stiffness: 110 } });
    diff += (p.g.side === "L" ? 1 : -1) * s;
  }
  const tilt = MAX_TILT * Math.tanh(diff / 7);
  const level = 1 - clamp01(Math.abs(tilt) / 2);

  const slotLocal = (side: "L" | "R", kind: BeadAtom, slot: number): Pt => [
    TRAY_X0[side] + PIP_X0 + (slot % 6) * PIP_DX,
    TRAY_TOP + ROWS[kind][Math.floor(slot / 6)],
  ];
  const srcPt = (g: Group): Pt => {
    const gs = partGlyphs(g.term).filter((x) => g.src.includes(x.idx));
    return [EQ_X + (gs[0].x0 + gs[gs.length - 1].x1) / 2, EQ_Y - SIZE * 0.28];
  };


  // highlights: on while that element is being counted
  const elementEnd: Record<BeadAtom, number> = { C: k.hydrogen - 2, H: k.oxygen - 2, O: k.balances - 4 };
  const highlights = groups.flatMap((g, gi) => {
    const p = prog(f, g.at - 5, 9, linear);
    const out = prog(f, elementEnd[g.kind], 12, EASE.in);
    // contiguous runs of the highlighted glyphs
    const runs: [number, number][] = [];
    partGlyphs(g.term)
      .filter((x) => g.hl.includes(x.idx))
      .forEach((x, j, arr) => {
        if (j > 0 && x.idx === arr[j - 1].idx + 1) runs[runs.length - 1][1] = x.x1;
        else runs.push([x.x0, x.x1]);
      });
    return runs.map(([a, b], j) => ({ key: `${gi}-${j}`, x1: EQ_X + a, x2: EQ_X + b, p, o: 1 - out }));
  });

  // the numbers, written beside each row as they are said
  const counts: { side: "L" | "R"; kind: BeadAtom; toks: Tok[] }[] = [
    { side: "L", kind: "C", toks: [{ t: "6", color: C.iceDeep, at: k.cL }] },
    { side: "R", kind: "C", toks: [{ t: "6", color: C.amberDeep, at: k.cR }] },
    { side: "L", kind: "H", toks: [{ t: "12", color: C.iceDeep, at: k.hL }] },
    { side: "R", kind: "H", toks: [{ t: "12", color: C.amberDeep, at: k.hR }] },
    {
      side: "L",
      kind: "O",
      toks: [
        { t: "12", color: C.iceDeep, at: k.oL1 },
        { t: "+6", color: C.iceDeep, at: k.oL2 },
        { t: "=18", color: W2.inkText, at: k.oLsum },
      ],
    },
    {
      side: "R",
      kind: "O",
      toks: [
        { t: "6", color: C.amberDeep, at: k.oR1 },
        { t: "+12", color: C.coralDeep, at: k.oR2 },
        { t: "=18", color: W2.inkText, at: k.oRsum },
      ],
    },
  ];
  const equals: { kind: BeadAtom; at: number }[] = [
    { kind: "C", at: k.cEq },
    { kind: "H", at: k.hR + 18 },
    { kind: "O", at: k.oEq },
  ];
  const badgeAt: Record<BeadAtom, number> = { C: k.carbon, H: k.hydrogen, O: k.oxygen };

  // ================================================================ 4 · it balances
  const stampP = prog(f, k.balances + 2, 16, linear);
  const happy = Math.max(level * 0.85, prog(f, k.balances + 4, 10));

  const tray = (side: "L" | "R") => {
    const x0 = TRAY_X0[side];
    const tint = side === "L" ? mix(C.ice, W2.notePaper, 0.74) : mix(C.amber, W2.notePaper, 0.7);
    const ink = side === "L" ? C.iceDeep : C.amberDeep;
    const label = side === "L" ? "reactants" : "products";
    const box = `M${x0 + 18},${TRAY_TOP} H${x0 + TRAY_W - 18} Q${x0 + TRAY_W},${TRAY_TOP} ${x0 + TRAY_W},${TRAY_TOP + 18} V${TRAY_TOP + TRAY_H - 14} Q${x0 + TRAY_W},${TRAY_TOP + TRAY_H} ${x0 + TRAY_W - 14},${TRAY_TOP + TRAY_H} H${x0 + 14} Q${x0},${TRAY_TOP + TRAY_H} ${x0},${TRAY_TOP + TRAY_H - 14} V${TRAY_TOP + 18} Q${x0},${TRAY_TOP} ${x0 + 18},${TRAY_TOP} Z`;
    const labelW = caveatWidth(label, 56);
    const labelP = prog(f, k.check + (side === "L" ? 22 : 30), 18, linear);
    return (
      <g key={side}>
        <HandLayer rough={0.7} seed={side === "L" ? 61 : 62}>
          <InkShape d={box} draw={trayDraw} fill={trayFill} color={tint} width={4.5} />
          <path
            d={`M${x0 + 26},${TRAY_TOP + DIVIDER_Y} L${x0 + TRAY_W - 26},${TRAY_TOP + DIVIDER_Y - 2}`}
            stroke={ink}
            strokeOpacity={0.55}
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${seg(trayFill, 0.2, 1)} 2`}
            fill="none"
          />
        </HandLayer>
        <Scribble x={x0 + TRAY_W / 2 - labelW / 2} y={TRAY_TOP + HEADER_Y} text={label} size={56} color={ink} progress={labelP} />
        {(["C", "H", "O"] as const).map((kd) => (
          <AtomBadge key={kd} x={x0 + BADGE_X} y={TRAY_TOP + rowMid(kd)} kind={kd} r={29} progress={prog(f, badgeAt[kd] - 4, 14, linear)} />
        ))}
        {counts
          .filter((c) => c.side === side)
          .map((c) => {
            const gapT = COUNT_SIZE * 0.06;
            const ws = c.toks.map((t) => caveatWidth(t.t, COUNT_SIZE));
            const total = ws.reduce((a, b) => a + b, 0) + gapT * (ws.length - 1);
            let x = x0 + COUNT_CX - total / 2;
            const y = TRAY_TOP + rowMid(c.kind) + COUNT_SIZE * 0.3;
            return c.toks.map((t, i) => {
              const at = x;
              x += ws[i] + gapT;
              return <Scribble key={`${c.kind}${i}`} x={at} y={y} text={t.t} size={COUNT_SIZE} color={t.color} progress={prog(f, t.at - 1, Math.max(6, 4 * t.t.length), linear)} />;
            });
          })}
      </g>
    );
  };

  return (
    <WorldStage world="notebook">
      <InkTopicTag n={1} title="What is photosynthesis?" />

      {/* ============ 1 · heading ============ */}
      <Scribble x={HEAD.x} y={HEAD.y} text={head.text} size={HEAD.size} color={C.ink500} progress={scribbleProgress(head, headPx)} />

      {/* ============ highlights (under the ink) ============ */}
      {highlights.map((h) => (
        <HighlightSwipe key={h.key} x1={h.x1} x2={h.x2} y={EQ_Y - SIZE * 0.25} h={SIZE * 0.9} progress={h.p} color={W2.sticky} opacity={0.62 * h.o} seed={3} />
      ))}

      {/* ============ 2 · the symbol equation ============ */}
      {PARTS.map((t, i) =>
        i === ARROW_PART ? null : (
          <HandChem key={i} x={EQ_X + EQ.parts[i].x0} y={EQ_Y} formula={t} size={SIZE} color={PART_COLOUR[i]} reveal={revealAt(f) - EQ.parts[i].x0} />
        ),
      )}
      {(() => {
        const g = partGlyphs(ARROW_PART)[0];
        const [t0, t1] = sched[g.i];
        return (
          <HandArrow
            from={[EQ_X + g.x0, EQ_Y - SIZE * 0.32]}
            to={[EQ_X + g.x1, EQ_Y - SIZE * 0.32]}
            progress={prog(f, t0, t1 - t0, linear)}
            color={W2.inkText}
            width={7}
            bend={0.02}
            seed={15}
          />
        );
      })()}
      {/* their names */}
      {namesOut < 1
        ? NAMES.map((name, i) => {
            if (!name) return null;
            const w = caveatWidth(name, NAME_SIZE);
            return (
              <Scribble
                key={`n${i}`}
                x={EQ_X + EQ.parts[i].cx - w / 2}
                y={NAME_Y}
                text={name}
                size={NAME_SIZE}
                color={mix(PART_COLOUR[i], W2.notePaper, 0.12)}
                progress={prog(f, partEnd(i) - 2, Math.max(10, name.length * 1.4), linear)}
                opacity={1 - namesOut}
              />
            );
          })
        : null}

      {/* ============ 3 · the see-saw, the trays and the counting ============ */}
      <SeeSaw layout={SAW} tilt={tilt} draw={sawDraw} fill={sawFill} face={sawFill} mood={happy} look={-Math.tanh(tilt / 2)}>
        {trayDraw > 0 ? (
          <>
            {tray("L")}
            {tray("R")}
          </>
        ) : null}
        {/* "=" between the rows, written when a row matches */}
        {equals.map((e, i) => {
          const y = TRAY_TOP + rowMid(e.kind);
          const cascade = pulse(f, k.balances - 2 + i * 6, 20);
          const size = 84 * (1 + 0.22 * cascade);
          const w = caveatWidth("=", size);
          return <Scribble key={e.kind} x={-w / 2} y={y + size * 0.28} text="=" size={size} color={C.leafDeep} progress={prog(f, e.at - 2, 8, linear)} />;
        })}
      </SeeSaw>

      {/* atom beads: hop from the equation into the trays (landed ones ride on the plank) */}
      {pips.map((p) => {
        if (f < p.launch) return null;
        const target = seeSawToPage(SAW, tilt, slotLocal(p.g.side, p.g.kind, p.slot));
        const u = clamp01((f - p.launch) / FLIGHT);
        let pos: Pt = target;
        if (u < 1) {
          const s0 = srcPt(p.g);
          const jx = ((p.i * 37) % 11) - 5;
          const s: Pt = [s0[0] + jx * 2, s0[1] + ((p.i * 23) % 7) - 3];
          const e = EASE.inOut(u);
          const c: Pt = [(s[0] + target[0]) / 2 + (p.g.side === "L" ? -40 : 40), Math.min(s[1], target[1]) - 70];
          pos = [
            (1 - e) * (1 - e) * s[0] + 2 * (1 - e) * e * c[0] + e * e * target[0],
            (1 - e) * (1 - e) * s[1] + 2 * (1 - e) * e * c[1] + e * e * target[1],
          ];
        }
        const pop = clamp01((f - p.launch) / 4);
        const squash = 1 + 0.28 * pulse(f, p.land, 8);
        return <AtomPip key={`${p.gi}-${p.i}`} x={pos[0]} y={pos[1]} kind={p.g.kind} r={12} scale={(0.4 + 0.6 * pop) * squash} />;
      })}

      {/* ============ 4 · it balances ============ */}
      <InkStamp x={960} y={440} text="BALANCED" progress={stampP} size={44} rotate={-5} color={C.leafDeep} seed={9} />

      {/* the pen */}
      <Pen x={pen.tip[0]} y={pen.tip[1]} kind="pen" color={C.ink600} progress={pen.on} angle={-38} scale={0.9} />
    </WorldStage>
  );
};
