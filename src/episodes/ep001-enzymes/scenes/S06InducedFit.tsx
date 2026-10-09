/**
 * S06 · Induced fit.
 * Lock and key (rigid, a model) is a simplified picture of the real enzyme. The real enzyme flexes;
 * it settles with its pocket a little too open, the substrate settles in loosely, and only THEN —
 * because the substrate has bound — the active site closes around it: induced fit.
 * Then: for GCSE/IGCSE, lock and key ✓ (the model, on the left); induced fit (the real thing, on the
 * right) is A-level. "A model, not a photograph."
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Enzyme } from "../../../components/Enzyme";
import { SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label } from "../../../components/Label";
import { FocusPull, HandArrow, HandTick, KeyIcon, LitShape, LockIcon, POCKET_LEN, textWidth } from "../../../components/kit";
import { roundRectPath } from "../../../components/kit/shared";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { blendJit, jit, jitTransform, moveRings, toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s06Timing } from "./S06InducedFit.timing";
import { Chip, HangingTag, WipeText, settleSwing } from "./S06-S12-shared";

const E = { x: 1200, y: 560, s: 1.6 } as const;
const PIVOT = [E.x, E.y] as const;

// Lock & key (kit icons) — the keyhole IS the pocket outline, the key's bit IS the substrate end.
const LK = { x: 410, y: 395, size: 268 } as const;
/**
 * Where the model sits for the exam beat. It is fully hidden between the two beats, so it can come
 * back further left: model (left) and the real enzyme (right) must read as two separate things.
 */
const LK2 = { x: 30, y: 452 } as const;
/** Exam framing: the model on its own card (left), the real enzyme free on the right, clear air between. */
const EXAM_CAM = { x: 760, y: 545, z: 0.86 } as const;
/** The model's card (world units, relative to LK2): it reads as "a diagram", apart from the enzyme. */
const CARD = { x0: -196, y0: -226, x1: 372, y1: 352 } as const;
/** Substrate length in this scene: 4 rings keeps the chain's free end well clear of the model. */
const RINGS = 4;
const LOCK_K = (LK.size * 0.8 * 0.56) / POCKET_LEN;
const KEY_UNITS = POCKET_LEN + 262;
const KEY_SIZE = LOCK_K * KEY_UNITS;
const LOCK_TOP = -(LK.size * 0.8) / 2 + LK.size * 0.14;
const HOLE_MOUTH_DY = LOCK_TOP + LK.size * 0.8 * 0.5 + (POCKET_LEN * LOCK_K) / 2;
const KEY_OFFX = LOCK_K * (262 - KEY_UNITS / 2);
/** Top of the shackle's right leg (the tag's string hangs here), relative to the lock centre. */
const TAG_DX = LK.size * 0.3 + 4;
const TAG_DY = LOCK_TOP - LK.size * 0.36 + LK.size * 0.3 - 10;

/** Exam chips: fixed screen positions taken from the final exam framing (they never slide). */
const CHIP_Y = 232;
const CHIP_FS = 44;
const chipW = (t: string) => textWidth(t, CHIP_FS, 600, 1) + CHIP_FS * 1.2;
const CHIP1_X = 132 + chipW("GCSE") / 2;
const CHIP2_X = CHIP1_X + (chipW("GCSE") + chipW("IGCSE")) / 2 + 18;
const TICK_X = CHIP2_X + chipW("IGCSE") / 2 + 58;

const Model: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly keyIn: number;
  readonly keySlide: number;
  readonly tagP: number;
  readonly tagAngle: number;
  readonly tagGlow: number;
}> = ({ x, y, keyIn, keySlide, tagP, tagAngle, tagGlow }) => (
  <>
    <LockIcon x={x} y={y} size={LK.size} progress={1} />
    <g opacity={keyIn}>
      <KeyIcon x={x - KEY_OFFX} y={y + HOLE_MOUTH_DY + keySlide} size={KEY_SIZE} rotate={-90} />
    </g>
    <HangingTag anchor={[x + TAG_DX, y + TAG_DY]} text="model" angle={tagAngle} progress={tagP} glow={tagGlow} size={50} />
  </>
);

export const S06InducedFit: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s06Timing(sc);
  const out = EASE.out;
  const amp = thermalAmplitude(37) * 0.8;

  // ---- camera: model beside the enzyme → rack to the enzyme → in on the pocket → pull back for the exam note
  const cam = camAt(f, [
    { f: -12, x: 930, y: 555, z: 1.2 },
    { f: k.simp, x: 930, y: 555, z: 1.2 },
    { f: k.simp + 58, x: 880, y: 525, z: 0.97 },
    { f: k.flex - 2, x: 880, y: 525, z: 0.97 },
    { f: k.flex + 48, x: 1075, y: 556, z: 1.14 },
    { f: k.site - 8, x: 1075, y: 556, z: 1.14 },
    { f: k.mould + 10, x: 1090, y: 560, z: 1.3 },
    { f: k.pullStart, x: 1090, y: 560, z: 1.3 },
    { f: k.pullEnd, ...EXAM_CAM },
  ]);
  const S = (p: readonly [number, number]) => toScreen(cam, p);

  // ---- the enzyme. "Real enzymes aren't rigid": it flexes, then settles with its pocket a little too
  // wide (not quite complementary). It holds that shape, steady, while the substrate arrives. The ONLY
  // change after that is the closure — and it starts after contact, because binding causes it.
  // Two clear flexes of the pocket walls on "aren't rigid" (the lock beside it never moves), settling a
  // little too wide by the end of "rigid" — before the substrate is even on screen.
  const fl = (a: number) => Math.round(k.flex + (k.flexEnd - k.flex) * a);
  const baseOpen = track(f, [
    [k.flex, 0],
    [fl(0.3), 0.85, EASE.inOut],
    [fl(0.58), 0.25, EASE.inOut],
    [fl(1), 1.15, EASE.inOut],
    [k.mould, 1.15],
    [k.closed, 0, out],
  ]);
  const wob = noise2D("s06flex", f * 0.035, 0);
  const wob2 = noise2D("s06breath", f * 0.03, 4);
  // a faint residual flex while the substrate approaches (it is a real, floppy molecule), none once bound
  const open = Math.max(0, baseOpen + 0.04 * wob * window01(f, k.flexEnd, k.bind - 6, 10));
  const breathe = 0.016 * wob2 * window01(f, k.flex - 4, k.flexEnd + 6, 16);
  const sx = 1 + breathe;
  const sy = 1 - breathe;
  const ej = jit("E06", f, amp);
  const grabBump = 1 + 0.012 * pulse(f, k.mould + 14, 16);
  const siteVis = window01(f, k.site, k.pullEnd + 20, 14);

  // ---- substrate: slides in, sits loosely in the too-wide pocket (rattling), then is gripped
  const dockAmt = prog(f, k.bind - 14, 14);
  const loose = window01(f, k.bind - 2, k.closed, 10);
  const ch = dockedChain(RINGS, E.x, E.y, E.s, { wave: 1.4 * Math.sin(f * 0.06) * (1 - dockAmt * 0.75) });
  const ax = track(f, [[k.subIn, -1000], [k.bind, 0, out]]);
  const ay = track(f, [[k.subIn, 170], [k.bind, 0, out]]);
  const arot = track(f, [[k.subIn, -10], [k.bind, 0, out]]);
  const rattle = loose * (Math.sin(f * 0.37) * 4 + Math.sin(f * 0.23 + 1) * 3);
  const rings = moveRings(ch.rings, ax, ay + rattle, arot, [E.x + E.s * -45, E.y]);
  const cj = blendJit(jit("C06", f, amp * 1.2), ej, dockAmt);
  const showChain = f > k.subIn - 2;

  // ---- the model, beat 1: in, key slides home, "model" tag; then out of focus while we look at the real thing
  const lockIn = prog(f, k.simp + 2, 18);
  const keySlide = track(f, [[k.keyIn - 22, 78], [k.keyIn - 2, 0, out]]);
  const lockBlur = track(f, [[k.flex, 0], [k.flex + 40, 9]]);
  const lockVis1 = lockIn * (1 - 0.65 * prog(f, k.flex, 40)) * (1 - prog(f, k.subIn - 30, 26));
  const tagAngle1 = settleSwing(f, k.keyIn + 2, 14, 0, 30, 16);

  // ---- the model, beat 2 (exam): back in focus at LK2, only once it is well inside the frame
  const lk2Screen = S([LK2.x + CARD.x0, LK2.y]); // the card's left edge must be inside the safe area
  const lockVis2 = f > k.pullStart ? Math.min(prog(f, k.pullEnd - 16, 18), Math.max(0, Math.min(1, (lk2Screen[0] - 100) / 60))) : 0;
  const tagAngle2 = 3 * pulse(f, k.model3, 18) * Math.sin((f - k.model3) * 0.4);

  // ---- annotations
  // "…but it's a simplification": the real enzyme, simplified, IS the lock (arrow from enzyme to lock).
  const simpP = prog(f, k.approx - 4, 18, (t) => t);
  const simpVis = 1 - prog(f, k.flex + 4, 14);
  const lockRight = S([LK.x + LK.size / 2 + 24, LK.y + 60]);
  const enzLeft = S([E.x + E.s * -236, LK.y + 60]);
  const lipTopW: [number, number] = [E.x + E.s * -205 + ej.dx, E.y + E.s * -62 + ej.dy];
  const lipBotW: [number, number] = [E.x + E.s * -168 + ej.dx, E.y + E.s * 64 + ej.dy];
  const arrowsP = prog(f, k.mould - 2, 18, (t) => t);
  const arrowsVis = 1 - prog(f, k.closed + 14, 14);
  const lipTop = S(lipTopW);
  const lipBot = S(lipBotW);

  // exam beat
  const examOut = 1 - prog(f, k.remember, 14);
  const capModel = prog(f, k.model3, 12, (t) => t);
  const capNot = prog(f, k.not, 8, (t) => t);
  const CAP = "a model, not a photograph";
  const capW = textWidth(CAP, 58, 600);
  const capX0 = 960 - capW / 2;
  const splitW = textWidth("a model, ", 58, 600);

  return (
    <Stage bg={{ particles: 40, lightX: 0.58 }}>
      <g transform={camTransform(cam)}>
        {/* the model, beat 1 */}
        {lockVis1 > 0.01 ? (
          <FocusPull blur={lockBlur} dim={0.4} opacity={Math.min(1, lockVis1)}>
            <Model x={LK.x} y={LK.y} keyIn={prog(f, k.simp + 8, 16)} keySlide={keySlide} tagP={prog(f, k.keyIn + 2, 14)} tagAngle={tagAngle1} tagGlow={0} />
          </FocusPull>
        ) : null}
        {/* the model, beat 2 (exam) */}
        {lockVis2 > 0.01 ? (
          <g opacity={lockVis2}>
            <LitShape
              d={roundRectPath(LK2.x + CARD.x0, LK2.y + CARD.y0, CARD.x1 - CARD.x0, CARD.y1 - CARD.y0, 40)}
              top={C.ink700}
              bottom={C.ink800}
              rim={C.paper}
              rimOpacity={0.2}
              rimWidth={4}
              slant={0.2}
              shadow={0.5}
              shadowDy={16}
              shadowBlur={24}
            />
            <Model x={LK2.x} y={LK2.y} keyIn={1} keySlide={0} tagP={1} tagAngle={tagAngle2} tagGlow={pulse(f, k.model3, 22)} />
          </g>
        ) : null}

        <g transform={jitTransform(ej, PIVOT)}>
          <g transform={`translate(${E.x} ${E.y}) scale(${sx * grabBump} ${sy * grabBump}) translate(${-E.x} ${-E.y})`}>
            <Enzyme x={E.x} y={E.y} scale={E.s} still open={open} showSite={siteVis} seed={7} />
          </g>
        </g>
        {/* substrate drawn over the enzyme: it sits inside the pocket, so the soft shadow must not dim it */}
        {showChain ? (
          <g transform={jitTransform(cj, PIVOT)}>
            <SugarChain rings={rings} links={ch.links} />
          </g>
        ) : null}
      </g>

      {/* ---- screen-space annotations */}
      {simpP > 0 && simpVis > 0 ? (
        <g opacity={simpVis}>
          <HandArrow from={[enzLeft[0], enzLeft[1]]} to={[lockRight[0], lockRight[1]]} bend={0.12} progress={simpP} width={5} head={20} color={C.paperDim} seed={6} />
          <WipeText x={(enzLeft[0] + lockRight[0]) / 2 + 10} y={lockRight[1] + 74} text="simplified" size={52} progress={prog(f, k.approx + 2, 14, (t) => t)} anchor="middle" color={C.paper} weight={600} />
        </g>
      ) : null}
      {arrowsP > 0 && arrowsVis > 0 ? (
        <>
          <HandArrow from={[lipTop[0] - 30, lipTop[1] - 92]} to={[lipTop[0] + 6, lipTop[1] - 14]} bend={0.22} progress={arrowsP} width={6} head={20} color={C.tealLight} opacity={arrowsVis} seed={11} />
          <HandArrow from={[lipBot[0] - 30, lipBot[1] + 92]} to={[lipBot[0] + 6, lipBot[1] + 14]} bend={-0.22} progress={arrowsP} width={6} head={20} color={C.tealLight} opacity={arrowsVis} seed={12} />
        </>
      ) : null}

      {/* "induced fit": named on its word, stays with the real enzyme through the pull-back, and gets its
          "A-level" tag when that is said (the model, left, is the GCSE picture) */}
      {(() => {
        // anchored on the active site's lower wall (where the fit happens); text sits clear of the body
        const a = S([E.x + E.s * -150 + ej.dx, E.y + E.s * 47 + ej.dy]);
        const tx = a[0] - 330;
        const ty = 920;
        const chipX = tx + 14 + textWidth("induced fit", 58, 600) + 34;
        const again = pulse(f, k.induced2, 24);
        return (
          <g opacity={examOut}>
            {again > 0.01 ? <ellipse cx={tx + 14 + textWidth("induced fit", 58, 600) / 2} cy={ty} rx={190} ry={48} fill={C.teal} opacity={0.16 * again} /> : null}
            <Label anchor={a} at={[tx, ty]} text="induced fit" align="start" size={58} color={C.tealLight} progress={prog(f, k.induced, 22)} />
            <Chip x={chipX} y={ty - 2} text="A-level" anchor="start" progress={prog(f, k.alevel, 14)} />
          </g>
        );
      })()}

      {/* exam note over the model (left): GCSE · IGCSE → lock and key ✓ */}
      <Chip x={CHIP1_X} y={CHIP_Y} text="GCSE" size={CHIP_FS} progress={prog(f, k.gcse, 14)} opacity={examOut} />
      <Chip x={CHIP2_X} y={CHIP_Y} text="IGCSE" size={CHIP_FS} progress={prog(f, k.igcse, 14)} opacity={examOut} />
      <HandTick cx={TICK_X} cy={CHIP_Y - 4} size={84} progress={prog(f, k.tick, 20, (t) => t)} opacity={examOut} seed={9} />

      {/* "a model, not a photograph" — written on the words; carried into the first beat of S07 */}
      <WipeText x={capX0} y={955} text="a model," size={58} progress={capModel} anchor="start" color={C.paper} weight={600} />
      <WipeText x={capX0 + splitW} y={955} text="not a photograph" size={58} progress={capNot} anchor="start" color={C.paper} weight={600} />
    </Stage>
  );
};
