/**
 * S06 · Induced fit.
 * Lock and key (rigid, a model) ≈ the real enzyme. The real enzyme flexes; its pocket waits a little
 * too open, the substrate settles in loosely, then the active site closes around it — induced fit.
 * Then: for GCSE/IGCSE use lock and key ✓ — and remember, it's a model, not a photograph.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Enzyme } from "../../../components/Enzyme";
import { SugarChain } from "../../../components/SugarChain";
import { dockedChain } from "../../../components/dock";
import { Label } from "../../../components/Label";
import { FocusPull, HandArrow, HandTick, KeyIcon, LockIcon, POCKET_LEN, textWidth } from "../../../components/kit";
import { camAt, camTransform } from "../../../lib/camera";
import { prog, thermalAmplitude, window01 } from "../../../lib/motion";
import { pulse, track } from "../../../lib/track";
import { blendJit, jit, jitTransform, moveRings, toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { s06Timing } from "./S06InducedFit.timing";
import { Chip, HandApprox, HangingTag, Viewfinder, WipeText, settleSwing } from "./S06-S12-shared";

const E = { x: 1200, y: 560, s: 1.6 } as const;
const PIVOT = [E.x, E.y] as const;

// Lock & key (kit icons) — the keyhole IS the pocket outline, the key's bit IS the substrate end.
const LK = { x: 410, y: 395, size: 268 } as const;
const LOCK_K = (LK.size * 0.8 * 0.56) / POCKET_LEN;
const KEY_UNITS = POCKET_LEN + 262;
const KEY_SIZE = LOCK_K * KEY_UNITS;
const LOCK_TOP = -(LK.size * 0.8) / 2 + LK.size * 0.14;
const HOLE_MOUTH_Y = LK.y + LOCK_TOP + LK.size * 0.8 * 0.5 + (POCKET_LEN * LOCK_K) / 2;
const KEY_OFFX = LOCK_K * (262 - KEY_UNITS / 2);
/** Top of the shackle's right leg (the tag's string hangs here). */
const TAG_ANCHOR = [LK.x + LK.size * 0.3 + 4, LK.y + LOCK_TOP - LK.size * 0.36 + LK.size * 0.3 - 10] as const;

export const S06InducedFit: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s06Timing(sc);
  const out = EASE.out;
  const amp = thermalAmplitude(37) * 0.8;

  // ---- camera: reveal the model beside the enzyme → rack to the enzyme → in on the pocket → pull back for the exam note
  const cam = camAt(f, [
    { f: -12, x: 930, y: 555, z: 1.2 },
    { f: k.simp, x: 930, y: 555, z: 1.2 },
    { f: k.simp + 58, x: 880, y: 525, z: 0.97 },
    { f: k.flex - 2, x: 880, y: 525, z: 0.97 },
    { f: k.flex + 48, x: 1075, y: 556, z: 1.14 },
    { f: k.site - 8, x: 1075, y: 556, z: 1.14 },
    { f: k.mould + 10, x: 1090, y: 560, z: 1.3 },
    { f: k.exam, x: 1090, y: 560, z: 1.3 },
    { f: k.exam + 52, x: 905, y: 545, z: 0.9 },
  ]);
  const S = (p: readonly [number, number]) => toScreen(cam, p);

  // ---- the enzyme: flexes (real enzymes aren't rigid), waits open, then closes around the substrate
  const flexAmp = window01(f, k.flex - 4, k.bind + 10, 22) * 0.42 + window01(f, k.bind, k.mould + 4, 8) * 0.06;
  const wob = noise2D("s06flex", f * 0.035, 0);
  const wob2 = noise2D("s06breath", f * 0.03, 4);
  const baseOpen = track(f, [
    [k.flex, 0],
    [k.flex + 20, 0.48],
    [k.subIn + 6, 0.48],
    [k.bind - 4, 1.3, out],
    [k.mould, 1.3],
    [k.closed, 0, out],
  ]);
  const open = Math.max(0, baseOpen + flexAmp * wob * (f < k.subIn ? 1.1 : 1));
  const breathe = 0.014 * wob2 * window01(f, k.flex - 4, k.bind, 20);
  const sx = 1 + breathe;
  const sy = 1 - breathe;
  const ej = jit("E06", f, amp);
  const grabBump = 1 + 0.012 * pulse(f, k.mould + 14, 16);
  const siteVis = window01(f, k.site, k.exam + 30, 14);

  // ---- substrate: slides in, sits loosely in the too-wide pocket, then is gripped
  const dockAmt = prog(f, k.bind - 14, 14);
  const loose = window01(f, k.bind - 4, k.closed, 10);
  const ch = dockedChain(5, E.x, E.y, E.s, { wave: 1.4 * Math.sin(f * 0.06) * (1 - dockAmt * 0.75) });
  const ax = track(f, [[k.subIn, -1000], [k.bind, 0, out]]);
  const ay = track(f, [[k.subIn, 170], [k.bind, 0, out]]);
  const arot = track(f, [[k.subIn, -10], [k.bind, 0, out]]);
  const rattle = loose * (Math.sin(f * 0.37) * 4 + Math.sin(f * 0.23 + 1) * 3);
  const rings = moveRings(ch.rings, ax, ay + rattle, arot, [E.x + E.s * -45, E.y]).map((r) => ({ ...r }));
  const cj = blendJit(jit("C06", f, amp * 1.2), ej, dockAmt);
  const showChain = f > k.subIn - 2;

  // ---- lock & key: in, key slides home, "model" tag; then out of focus while we look at the real thing
  const lockIn = prog(f, k.simp + 2, 18);
  const keySlide = track(f, [[k.keyIn - 22, 78], [k.keyIn - 2, 0, out]]);
  const lockBlur = track(f, [[k.flex, 0], [k.flex + 40, 9], [k.exam, 9], [k.exam + 36, 0, out]]);
  const lockVis = lockIn * (1 - 0.65 * prog(f, k.flex, 40)) * (1 - prog(f, k.subIn - 30, 26)) + prog(f, k.exam + 6, 30);
  const tagAngle = settleSwing(f, k.keyIn + 2, 14, 0, 30, 16) + 3 * pulse(f, k.model3, 18);
  const lockScreen = S([LK.x, LK.y]);

  // ---- annotations
  const approxP = prog(f, k.approx, 22, (t) => t);
  const approxVis = 1 - prog(f, k.flex + 6, 16);
  const lipTopW: [number, number] = [E.x + E.s * -205 + ej.dx, E.y + E.s * -62 + ej.dy];
  const lipBotW: [number, number] = [E.x + E.s * -168 + ej.dx, E.y + E.s * 64 + ej.dy];
  const arrowsP = prog(f, k.mould - 6, 18, (t) => t);
  const arrowsVis = 1 - prog(f, k.closed + 14, 14);
  const lipTop = S(lipTopW);
  const lipBot = S(lipBotW);
  const fitAnchor = S([E.x + E.s * -150 + ej.dx, E.y + E.s * -40 + ej.dy]);

  // exam beat
  const examOut = 1 - prog(f, k.remember, 14);
  const chipY = 196;
  const chip1X = lockScreen[0] - 70;
  const chip2X = lockScreen[0] + 110;
  const vf = prog(f, k.remember + 2, 26);

  return (
    <Stage bg={{ particles: 40, lightX: 0.58 }}>
      <g transform={camTransform(cam)}>
        {/* the model: lock & key */}
        {lockVis > 0.01 ? (
          <FocusPull blur={lockBlur} dim={0.4} opacity={Math.min(1, lockVis)}>
            <LockIcon x={LK.x} y={LK.y} size={LK.size} progress={1} />
            <g opacity={prog(f, k.simp + 8, 16)}>
              <KeyIcon x={LK.x - KEY_OFFX} y={HOLE_MOUTH_Y + keySlide} size={KEY_SIZE} rotate={-90} />
            </g>
            <HangingTag anchor={TAG_ANCHOR} text="model" angle={tagAngle} progress={prog(f, k.keyIn + 2, 14)} glow={pulse(f, k.model3, 22)} size={50} />
          </FocusPull>
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
      <HandApprox cx={S([712, 520])[0]} cy={S([712, 520])[1]} size={128} progress={approxP} opacity={approxVis} seed={6} />
      {arrowsP > 0 && arrowsVis > 0 ? (
        <>
          <HandArrow from={[lipTop[0] - 30, lipTop[1] - 92]} to={[lipTop[0] + 6, lipTop[1] - 14]} bend={0.22} progress={arrowsP} width={6} head={20} color={C.tealLight} opacity={arrowsVis} seed={11} />
          <HandArrow from={[lipBot[0] - 30, lipBot[1] + 92]} to={[lipBot[0] + 6, lipBot[1] + 14]} bend={-0.22} progress={arrowsP} width={6} head={20} color={C.tealLight} opacity={arrowsVis} seed={12} />
        </>
      ) : null}
      <Label
        anchor={fitAnchor}
        at={[fitAnchor[0] - 150, fitAnchor[1] - 190]}
        text="induced fit"
        align="end"
        size={60}
        color={C.tealLight}
        progress={prog(f, k.induced, 22)}
        opacity={1 - prog(f, k.exam + 4, 14)}
      />

      {/* exam: induced fit is beyond GCSE — an A-level idea */}
      {(() => {
        const a = S([E.x + E.s * -150 + ej.dx, E.y + E.s * 120 + ej.dy]);
        const tx = a[0] - 40;
        const ty = 928;
        const chipX = tx + 14 + textWidth("induced fit", 56, 600) + 34;
        return (
          <g opacity={examOut}>
            <Label anchor={a} at={[tx, ty]} text="induced fit" align="start" size={56} color={C.tealLight} progress={prog(f, k.induced2, 22)} />
            <Chip x={chipX} y={ty - 2} text="A-level" anchor="start" progress={prog(f, k.alevel, 14)} />
          </g>
        );
      })()}

      {/* exam note: GCSE · IGCSE → lock and key ✓ */}
      <Chip x={chip1X} y={chipY} text="GCSE" progress={prog(f, k.gcse, 14)} opacity={examOut} />
      <Chip x={chip2X} y={chipY} text="IGCSE" progress={prog(f, k.igcse, 14)} opacity={examOut} />
      <HandTick cx={chip2X + 150} cy={chipY - 4} size={84} progress={prog(f, k.tick, 20, (t) => t)} opacity={examOut} seed={9} />

      {/* a model, not a photograph */}
      <Viewfinder x0={250} y0={150} x1={1670} y1={860} progress={vf} color={C.paper} opacity={0.85} />
      {f > k.remember ? (
        <g>
          <WipeText x={960} y={955} text="not a photograph" size={58} progress={prog(f, k.not, 16, (t) => t)} anchor="middle" color={C.paper} weight={600} />
        </g>
      ) : null}
    </Stage>
  );
};
