/**
 * S11 · Myth #2: heat "kills" enzymes.
 * Card: "Heat [kills] enzymes" → scratched out on "never alive", "denatures" written in.
 * A living cell; zoom inset: one enzyme inside it is just a molecule (a clever one: it snips starch).
 * Heat our enzyme: it denatures. Beside it, a healthy one for comparison. The same substrate fits the
 * healthy active site ✓ and not the misshapen one ✗ — "active site changes shape": the marks-earning answer.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE, H, W } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Enzyme } from "../../../components/Enzyme";
import { Link, Ring, SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label } from "../../../components/Label";
import { CellOutline, HandCross, HandTick, textBox, textWidth } from "../../../components/kit";
import { Pt, rng } from "../../../lib/geometry";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { blendJit, jit, jitTransform, moveRings } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s11Timing } from "./S11MythKilled.timing";
import { MythCard2 } from "./S06-S12-shared";

const CELL = { x: 470, y: 590, rx: 300, ry: 230 } as const;
const PICK = { x: 560, y: 540, r: 20 } as const; // the molecule we zoom into
const INSET = { x: 1250, y: 560, r: 330 } as const;
const EI = { x: 1290, y: 560, s: 0.95 } as const; // enzyme inside the inset
const ER = { x: 1380, y: 470, s: 1.0 } as const; // right: our enzyme, heated
const EL = { x: 560, y: 470, s: 1.0 } as const; // left: a healthy one
const LABEL_TEXT = "active site changes shape";
const LABEL_SIZE = 54;
/** Leader-label position: text starts here; leaves room for the tick before the right safe edge. */
const LABEL_AT: Pt = [Math.min(1000, 1820 - 130 - textWidth(LABEL_TEXT, LABEL_SIZE, 600) - 14), 840];

/** Tiny molecules inside the cell (seeded). */
const DOTS = (() => {
  const r = rng(1111);
  const cols = [C.teal, C.violet, C.amber, C.paperDim, C.tealLight];
  return Array.from({ length: 46 }, (_, i) => {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 0.84;
    return { x: CELL.x + Math.cos(a) * CELL.rx * rr, y: CELL.y + Math.sin(a) * CELL.ry * rr, r: 3.5 + r() * 3.5, c: cols[i % cols.length], i };
  }).filter((d) => Math.hypot((d.x - (CELL.x - 70)) / 95, (d.y - (CELL.y + 30)) / 75) > 1 && Math.hypot(d.x - PICK.x, d.y - PICK.y) > 34);
})();

/** External tangent points between two circles (for the zoom-inset callout). */
const tangents = (c1: Pt, r1: number, c2: Pt, r2: number): [Pt, Pt][] => {
  const dx = c2[0] - c1[0];
  const dy = c2[1] - c1[1];
  const d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  const beta = Math.acos((r1 - r2) / d);
  return [1, -1].map((s) => {
    const a = base + s * beta;
    const n: Pt = [Math.cos(a), Math.sin(a)];
    return [
      [c1[0] + r1 * n[0], c1[1] + r1 * n[1]],
      [c2[0] + r2 * n[0], c2[1] + r2 * n[1]],
    ] as [Pt, Pt];
  });
};

export const S11MythKilled: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s11Timing(sc);
  const out = EASE.out;
  const clipId = useSvgId("s11inset");
  const amp37 = thermalAmplitude(37) * 0.8;

  // ---------------- card
  const cardEnter = prog(f, k.myth, 20);
  const cardOut = prog(f, k.cardOut, 14, EASE.in);

  // ---------------- cell + inset
  const cellP = prog(f, k.cellIn, 30, (t) => t);
  const cellOut = 1 - prog(f, k.die + 4, 20);
  const pickP = prog(f, k.inset - 6, 12);
  const insetP = prog(f, k.inset, 24, out);
  const insetOut = 1 - prog(f, k.die + 2, 18);
  const tl = tangents([PICK.x, PICK.y], PICK.r, [INSET.x, INSET.y], INSET.r * insetP);

  // ---------------- our enzyme: inset → right-hand position → heated, denatured
  const move = prog(f, k.die, k.correct + 12 - k.die, EASE.inOut);
  const ex = EI.x + (ER.x - EI.x) * move;
  const ey = EI.y + (ER.y - EI.y) * move;
  const es = EI.s + (ER.s - EI.s) * move;
  const heat = prog(f, k.denat - 6, 26);
  const denature = prog(f, k.denat + 2, 34, EASE.inOut);
  const ampR = thermalAmplitude(37 + 30 * heat) * 0.8;
  const ejR = jit("E11R", f, ampR);
  const enzIn = prog(f, k.inset + 8, 20);
  const siteVis = window01(f, k.active, k.end + 30, 14);

  // ---------------- the clever snip (inside the inset)
  const dockC = prog(f, k.clever - 14, 14) * (1 - prog(f, k.snip, 10));
  const cc = dockedChain(5, EI.x, EI.y, EI.s, { wave: 1.2 * Math.sin(f * 0.06) * (1 - dockC * 0.7) });
  const cx0 = track(f, [[k.clever - 40, -520], [k.clever, 0, out], [k.snip, 0], [k.snip + 10, -54, EASE.snap], [k.die + 20, -420, EASE.in]]);
  const freed = f >= k.snip + 2;
  const mx = track(f, [[k.snip + 6, 0], [k.snip + 50, -120, out]]);
  const my = track(f, [[k.snip + 6, 0], [k.snip + 50, -170, out]]);
  const chainA = moveRings(cc.rings.slice(0, 3), cx0, 0);
  const malt = moveRings(cc.rings.slice(3), freed ? mx : cx0, freed ? my : 0, freed ? -14 * prog(f, k.snip + 6, 40) : 0).map(
    (r): Ring => ({ ...r, tone: freed ? "sugar" : "starch", glow: prog(f, k.snip + 2, 16) }),
  );
  const linksC: Link[] = cc.links.map((l, i) => (i === 2 ? { ...l, broken: prog(f, k.snip, 6, EASE.snap), opacity: 1 - prog(f, k.snip + 8, 8) } : l));
  const strainC = window01(f, k.snip - 10, k.snip + 2, 5);

  // ---------------- side by side: the same substrate meets both
  const leftIn = prog(f, k.denat + 14, 22);
  const ejL = jit("E11L", f, amp37);
  const dockL = prog(f, k.dock - 14, 14);
  const lc = dockedChain(4, EL.x, EL.y, EL.s, { wave: 1.2 * Math.sin(f * 0.06 + 1) * (1 - dockL * 0.7) });
  const lx = track(f, [[k.sub, -560], [k.dock - 14, -60, out], [k.dock, 0, out]]);
  const ly = track(f, [[k.sub, 150], [k.dock - 14, 6, out], [k.dock, 0, out]]);
  const leftRings = moveRings(lc.rings, lx, ly);
  const cjL = blendJit(jit("C11L", f, amp37 * 1.2), ejL, dockL);
  const rc = dockedChain(4, ER.x, ER.y, ER.s, { wave: 1.2 * Math.sin(f * 0.06 + 2) });
  const rx = track(f, [[k.sub + 4, -560], [k.bounce - 16, -170, out], [k.bounce, -104, EASE.in], [k.bounce + 18, -300, out]]);
  const ry = track(f, [[k.sub + 4, 150], [k.bounce - 16, 8, out], [k.bounce, 0], [k.bounce + 18, 36, out]]);
  const rrot = track(f, [[k.bounce, 0], [k.bounce + 18, -8, out]]);
  const rightRings = moveRings(rc.rings, rx, ry, rrot);
  const cjR = jit("C11R", f, amp37 * 1.2);
  const chainsVis = prog(f, k.sub, 14);

  // ---------------- marks: focus on the answer
  const focus = prog(f, k.marks, 20);
  const box = textBox(LABEL_TEXT, LABEL_AT[0] + 14, LABEL_AT[1] + LABEL_SIZE * 0.34, LABEL_SIZE, 600, "start");
  const hl = prog(f, k.answer, 18, EASE.inOut);

  return (
    <Stage bg={{ particles: 38, lightX: 0.55 }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={INSET.x} cy={INSET.y} r={INSET.r * insetP} />
        </clipPath>
        <radialGradient id={`${clipId}-heat`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.coral} stopOpacity={0.4} />
          <stop offset="1" stopColor={C.coral} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ---- a living cell, and one molecule inside it */}
      {cellP > 0 && cellOut > 0 ? (
        <g opacity={cellOut}>
          <CellOutline cx={CELL.x} cy={CELL.y} rx={CELL.rx} ry={CELL.ry} progress={cellP} seed={21} color={C.paperDim} fill={C.ink600} />
          <g opacity={prog(f, k.cellIn + 12, 20)}>
            <ellipse cx={CELL.x - 70} cy={CELL.y + 30} rx={88} ry={68} fill={C.ink600} opacity={0.75} />
            <ellipse cx={CELL.x - 70} cy={CELL.y + 30} rx={88} ry={68} fill="none" stroke={C.ink300} strokeOpacity={0.5} strokeWidth={3} />
            {DOTS.map((d) => (
              <circle key={d.i} cx={d.x + noise2D(`d${d.i}`, f * 0.03, 0) * 4} cy={d.y + noise2D(`d${d.i}`, f * 0.03, 5) * 4} r={d.r} fill={d.c} opacity={0.75} />
            ))}
            <circle cx={PICK.x} cy={PICK.y} r={7} fill={C.teal} />
          </g>
        </g>
      ) : null}
      {pickP > 0 && insetOut > 0 ? (
        <g opacity={insetOut}>
          <circle cx={PICK.x} cy={PICK.y} r={PICK.r} fill="none" stroke={C.paper} strokeWidth={3} opacity={pickP} />
          {insetP > 0.02
            ? tl.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.paper} strokeOpacity={0.35} strokeWidth={2.5} />)
            : null}
          <circle cx={INSET.x} cy={INSET.y} r={INSET.r * insetP} fill={C.ink900} opacity={0.85} />
          <circle cx={INSET.x} cy={INSET.y} r={INSET.r * insetP} fill="none" stroke={C.paper} strokeOpacity={0.6} strokeWidth={3} />
        </g>
      ) : null}

      {/* ---- the clever snip, clipped to the inset */}
      {f > k.clever - 42 && f < k.die + 30 ? (
        <g clipPath={`url(#${clipId})`} opacity={insetOut}>
          <g transform={jitTransform(blendJit(jit("C11", f, amp37), ejR, dockC), [EI.x, EI.y])}>
            <SugarChain rings={[...chainA, ...malt]} links={linksC.map((l, i) => (i === 2 && !freed ? { ...l, highlight: strainC } : l))} />
          </g>
        </g>
      ) : null}

      {/* ---- heat under our enzyme */}
      {heat > 0 ? <circle cx={ER.x} cy={ER.y + 40} r={360} fill={`url(#${clipId}-heat)`} opacity={heat * (1 - 0.4 * focus)} /> : null}

      {/* ---- left: a healthy enzyme for comparison */}
      {leftIn > 0 ? (
        <g opacity={leftIn * (1 - 0.5 * focus)}>
          <g transform={jitTransform(cjL, [EL.x, EL.y])} opacity={chainsVis}>
            <SugarChain rings={leftRings} links={lc.links} />
          </g>
          <g transform={jitTransform(ejL, [EL.x, EL.y])}>
            <g transform={`translate(${EL.x} ${EL.y}) scale(${1 + 0.014 * pulse(f, k.dock - 2, 12)}) translate(${-EL.x} ${-EL.y})`}>
              <Enzyme x={EL.x} y={EL.y} scale={EL.s} still showSite={siteVis} seed={7} />
            </g>
          </g>
        </g>
      ) : null}

      {/* ---- right: our enzyme (inset → heated → denatured) */}
      <g opacity={enzIn * (1 - 0.5 * focus)}>
        {chainsVis > 0 ? (
          <g transform={jitTransform(cjR, [ER.x, ER.y])} opacity={chainsVis}>
            <SugarChain rings={rightRings} links={rc.links} />
          </g>
        ) : null}
        <g clipPath={move < 0.02 ? `url(#${clipId})` : undefined}>
          <g transform={jitTransform(ejR, [ex, ey])}>
            <g transform={`translate(${ex} ${ey}) scale(${1 + 0.012 * pulse(f, k.clever - 2, 12) - 0.008 * pulse(f, k.snip, 8)}) translate(${-ex} ${-ey})`}>
              <Enzyme x={ex} y={ey} scale={es} still denature={denature} showSite={siteVis} siteColor={denature > 0.5 ? C.coral : C.paper} seed={7} />
            </g>
          </g>
        </g>
      </g>

      {/* ---------------- annotations */}
      <MythCard2 x={W / 2} y={H / 2 - 20 - cardOut * 700} number={2} before="Heat " word="kills" after=" enzymes" replacement="denatures" enter={cardEnter} strike={prog(f, k.strike, 14, (t) => t)} replace={prog(f, k.replace, 20, (t) => t)} opacity={1 - cardOut} seed={11} />

      <Label anchor={[CELL.x - 110, CELL.y - CELL.ry + 14]} at={[CELL.x - 190, CELL.y - CELL.ry - 120]} text="living cell" align="end" progress={prog(f, k.cellIn + 10, 22)} opacity={cellOut} />
      <Label anchor={[EI.x + 40, EI.y - 170]} at={[EI.x + 170, EI.y - 330]} text="a molecule" color={C.tealLight} progress={prog(f, k.molWord, 22)} opacity={1 - prog(f, k.die, 14)} />

      <HandTick cx={EL.x - 150} cy={EL.y - 215} size={92} progress={prog(f, k.dock + 2, 18, (t) => t)} opacity={1 - 0.5 * focus} seed={3} />
      <HandCross cx={ER.x - 150} cy={ER.y - 215} size={80} progress={prog(f, k.bounce + 2, 18, (t) => t)} opacity={1 - 0.5 * focus} seed={4} />

      {/* the marks-earning phrase: highlighter swipe + tick */}
      {hl > 0 ? (
        <g opacity={0.32}>
          <rect
            x={box.x0 - 16}
            y={box.top - 12}
            width={(box.w + 32) * hl}
            height={box.bottom - box.top + 22}
            rx={10}
            fill={C.amber}
            transform={`rotate(-0.8 ${box.x0} ${box.cy})`}
          />
        </g>
      ) : null}
      <Label
        anchor={[ER.x - 88 * ER.s + ejR.dx, ER.y + 26 + ejR.dy]}
        at={LABEL_AT}
        text={LABEL_TEXT}
        align="start"
        size={LABEL_SIZE}
        color={C.paper}
        progress={prog(f, k.active, 24)}
      />
      <HandTick cx={box.x1 + 66} cy={box.cy - 10} size={84} progress={prog(f, k.tick, 18, (t) => t)} seed={8} />
    </Stage>
  );
};
