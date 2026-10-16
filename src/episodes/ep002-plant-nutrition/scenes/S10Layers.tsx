/**
 * S10 · Layers — the rest of the leaf cross-section (continues S09 at the same position: layout.ts SECTION).
 *
 * 1. Spongy mesophyll: rounder cells (outlined), loosely packed; the air spaces between them tint ice (air).
 *    Carbon dioxide diffuses through the air spaces to the cells; the cell surfaces light up — a large
 *    surface area for gas exchange.
 * 2. Vascular bundle: xylem on top brings water (ice drops) and mineral ions (small green ions) into the leaf,
 *    up to the mesophyll cells; phloem below takes sucrose and amino acids away (they slip into the phloem
 *    and shrink away along the vein, into the page — "to the rest of the plant").
 * 3. Lower epidermis with stomata (the three pores ring). The camera pushes in to one stoma (change of
 *    scale): carbon dioxide diffuses in through it to a palisade cell, oxygen diffuses out. Closer still:
 *    the guard cells open and close the pore — "guard cells". "In the light": light washes down onto the
 *    (closed) stoma, photons land on the guard cells, and they open the pore again; carbon dioxide from the air
 *    below diffuses in through it to a spongy cell. (The section tag carries the EXTENDED badge throughout.)
 * 4. Recap: back out to the whole section; each label returns, and its layer lights, as it is named,
 *    top to bottom. Ends on the fully labelled diagram.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { SectionTag } from "../../../components/SectionTag";
import { LeafLayer, LeafSection, Sucrose } from "../../../components/bio";
import { Photon } from "../../../components/Light";
import { CarbonDioxide, Oxygen, mix } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { s10Timing } from "./S10Layers.timing";
import { SECTION } from "./layout";
import {
  AirTint,
  AminoBead,
  BandGlow,
  COL_SIZE,
  ColLabel,
  END_GLOW,
  FOCUS_MAX,
  ForkLabel,
  GlowDot,
  PATHS,
  SEC_BUNDLE,
  SEC_STOMATA,
  SEC_Y,
  SecLocal,
  SoftDefs,
  SpongyOutlines,
  SubLine,
  alongPts,
  colSubY,
  secP,
  smoothPts,
} from "./parts/S09-section";

// ------------------------------------------------------------------ layout
const STOMA: Pt = secP(SEC_STOMATA[0], 478);
const SUB_X = SECTION.labelX + 4;
/** Bottom-row and top labels for the bundle (outside the section, never over it). */
const BUNDLE_AT: Pt = [1190, 800];
const BUNDLE_ANCHOR: Pt = secP(SEC_BUNDLE.x - 68, SEC_BUNDLE.y + 66);
const XYLEM_AT: Pt = [1236, 222];
const XYLEM_ANCHOR: Pt = secP(SEC_BUNDLE.x - 6, SEC_BUNDLE.y - 46);
const PHLOEM_AT: Pt = [1228, 812];
const PHLOEM_ANCHOR: Pt = secP(SEC_BUNDLE.x, SEC_BUNDLE.y + 52);
const GUARD2_AT: Pt = [1530, 830];
/** Where the stoma sits on screen when zoomed (×2 for the gases, ×3.2 for the guard cells): left of centre,
 *  so the section still fills the frame on the left and the free space below the leaf holds the labels. */
const Z2: Pt = [600, 600];
const Z3: Pt = [860, 560];

// gas routes through the real gaps between the cells (screen = world at 1×)
const CO2_ROUTES: Pt[][] = [
  [[868, 668], [878, 628], [881, 585], [889, 548], [898, 515]], // up between two spongy cells to a palisade cell
  [[858, 674], [826, 677], [800, 672], [788, 652]], // along the bottom air space to a spongy cell
  [[872, 650], [896, 616], [914, 600], [921, 584]], // up-right into a spongy cell
  [[1094, 668], [1090, 630], [1068, 600], [1044, 586], [1030, 578]], // the air space beside the vein
];
const CO2_WAVES = [
  { r: 0, d: 0 },
  { r: 1, d: 9 },
  { r: 2, d: 17 },
];
const CO2_WAVES2 = [
  { r: 3, d: 0 },
  { r: 0, d: 10 },
  { r: 2, d: 22 },
];
// water + ions: out of the xylem, up to the mesophyll cells
const W = PATHS.water;
const WATER_ROUTES: Pt[][] = [
  [...W],
  [secP(766, 312), secP(820, 250), secP(910, 180), secP(970, 120)],
  [secP(760, 300), secP(764, 250), secP(770, 186)],
];
// "so carbon dioxide can diffuse in": from the air below the leaf, in through the re-opened stoma, to a spongy cell
const GUARD_CO2: Pt[] = [secP(414, 596), secP(362, 528), secP(338, 500), secP(SEC_STOMATA[0], 478), secP(334, 450), secP(356, 418), secP(392, 380), secP(424, 346)];
// sucrose + amino acids: from the mesophyll cells into the phloem
const SUC_ROUTES: Pt[][] = [[...PATHS.sucrose], [secP(560, 320), secP(630, 370), secP(735, 402)]];

/** Camera that keeps the stoma as its anchor: zoom in log space, the stoma glides between screen points. */
type CamKey = { readonly f: number; readonly z: number; readonly S: Pt };
const anchorCam = (f: number, keys: readonly CamKey[], w: Pt) => {
  let z = keys[0].z;
  let S: Pt = keys[0].S;
  if (f >= keys[keys.length - 1].f) {
    z = keys[keys.length - 1].z;
    S = keys[keys.length - 1].S;
  } else {
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (f >= a.f && f < b.f) {
        const t = EASE.inOut(Math.max(0, Math.min(1, (f - a.f) / Math.max(1, b.f - a.f))));
        z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t);
        S = [a.S[0] + (b.S[0] - a.S[0]) * t, a.S[1] + (b.S[1] - a.S[1]) * t];
        break;
      }
    }
  }
  const cx = w[0] - (S[0] - 960) / z;
  const cy = w[1] - (S[1] - 540) / z;
  return {
    z,
    T: `translate(960 540) scale(${z}) translate(${-cx} ${-cy})`,
    toScreen: (p: Pt): Pt => [(p[0] - cx) * z + 960, (p[1] - cy) * z + 540],
  };
};

export const S10Layers: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s10Timing(sc);
  const gid = useSvgId("s10");

  // ---------------------------------------------------------------- camera
  const cam = anchorCam(
    f,
    [
      { f: k.zoomIn[0], z: 1, S: STOMA },
      { f: k.zoomIn[1], z: 2, S: Z2 },
      { f: k.zoomGuard[0], z: 2, S: Z2 },
      { f: k.zoomGuard[1], z: 3.2, S: Z3 },
      { f: k.zoomOut[0], z: 3.2, S: Z3 },
      { f: k.zoomOut[1], z: 1, S: STOMA },
    ],
    STOMA,
  );
  const inZoom = f >= k.zoomIn[0] && f < k.zoomOut[1];
  const inRecap = f >= k.zoomOut[0];

  // ---------------------------------------------------------------- focus (continues S09: palisade)
  const segs: { l: LeafLayer | null; a: number }[] = [
    { l: "palisade", a: -80 },
    { l: "spongy", a: k.spongyWord - 6 },
    { l: "bundle", a: k.bundle - 2 },
    { l: "lower", a: k.lower - 2 },
    { l: "stomata", a: k.stomata - 2 },
    { l: null, a: k.zoomOut[0] },
  ];
  let focus: LeafLayer | null = null;
  let focusAmount = 0;
  for (let i = 0; i < segs.length; i++) {
    const a = segs[i].a;
    const b = i + 1 < segs.length ? segs[i + 1].a : k.end + 60;
    if (f >= a && f < b) {
      focus = segs[i].l;
      focusAmount = FOCUS_MAX * Math.min(prog(f, a, 14), 1 - prog(f, b - 10, 10, EASE.in));
    }
  }
  // while the gases move through the leaf, its inside stays visible
  if (focus === "stomata") focusAmount *= 1 - 0.6 * window01(f, k.zoomIn[0], k.zoomGuard[0] + 6, 16);
  const chloroGlow = END_GLOW * (1 - prog(f, k.spongyWord - 6, 30));

  // stoma: opens, closes, then stays closed until "In the light, they open the stomata"
  const stomataOpen = 0.7 + 0.3 * prog(f, k.opened - 4, 16) - 0.94 * prog(f, k.closed - 4, 18, EASE.inOut) + 0.94 * prog(f, k.reopen, 26, EASE.inOut);

  // ---------------------------------------------------------------- spongy + air spaces
  const rounderGlow = pulse(f, k.rounder - 4, 54);
  const airP = Math.max(prog(f, k.air - 4, 20) * (1 - prog(f, k.bundle - 4, 16)), 0.7 * window01(f, k.zoomIn[0], k.zoomOut[0] + 10, 16));
  const surfaceGlow = prog(f, k.large - 4, 16) * (1 - prog(f, k.bundle - 6, 14));
  const wave1 = k.carbon - 6;
  const wave2 = Math.max(wave1 + 40, k.large - 14);
  const CO2_TRAVEL = 56;

  // ---------------------------------------------------------------- bundle
  const waterStart = k.water - 8;
  const ionStart = k.ions - 10;
  const phloemGlow = window01(f, k.sucrose + 24, k.plant + 30, 16);
  const sucStart = k.sucrose - 8;
  const aminoStart = k.amino - 8;
  const awayAt = Math.max(k.away - 2, sucStart + 40);

  // ---------------------------------------------------------------- labels
  const colOut = 1 - prog(f, k.zoomIn[0] - 6, 12);
  const dimAt = (next: number) => 1 - 0.55 * prog(f, next - 4, 14);
  // (never before the camera is back at 1×, or the leader lines would point at the wrong place)
  const recapP = (w: number) => prog(f, Math.max(w - 2, k.zoomOut[1] - 2), 20);
  const lab = (pre: { progress: number; opacity: number }, word: number) =>
    inRecap ? { progress: recapP(word), opacity: 1 } : { progress: pre.progress, opacity: pre.opacity * colOut };

  // zoomed-in labels (screen)
  const gasLabelsOut = 1 - prog(f, k.zoomGuard[0] - 4, 12);
  const co2Label = prog(f, k.zoomIn[0] + 18, 16) * gasLabelsOut;
  const o2Label = prog(f, k.oxygen - 2, 16) * gasLabelsOut;
  const openWord = Math.max(window01(f, k.opened - 2, k.closed - 2, 8), window01(f, k.reopen + 4, k.zoomOut[0] - 2, 8));
  const closedWord = window01(f, k.closed - 2, k.reopen + 4, 8);
  const gcOut = 1 - prog(f, k.zoomOut[0] - 4, 10);
  const gap = 4 + 16 * stomataOpen;
  const gcLeft = cam.toScreen(secP(SEC_STOMATA[0] - (gap / 2 + 17), 486));
  const gcRight = cam.toScreen(secP(SEC_STOMATA[0] + (gap / 2 + 17), 486));
  // "In the light": light falls on the guard cells, they open the stoma, carbon dioxide diffuses in
  const lightP = prog(f, k.inLight - 8, 20) * (1 - prog(f, k.zoomOut[0] - 4, 16));
  const co2InStart = Math.max(k.reopen + 16, k.co2Again - 14);
  const co2InLabel = prog(f, k.co2Again - 2, 16) * (1 - prog(f, k.zoomOut[0] - 4, 10));

  // recap: each named layer lights as the label returns
  const rg = (w: number) => (inRecap ? pulse(f, w - 4, 40) : 0);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.42, lightY: 0.3 }}>
      <SoftDefs gid={gid} />

      {/* ============ the section (world: zooms in to one stoma and back) ============ */}
      <g transform={inZoom ? cam.T : undefined}>
        <LeafSection x={SECTION.x} y={SECTION.y} w={SECTION.w} focus={focus} focusAmount={focusAmount} chloroGlow={chloroGlow} stomataOpen={stomataOpen} />
        <AirTint p={airP} />
        <SpongyOutlines p={rounderGlow * 0.9} color={C.leafLight} />
        <SpongyOutlines p={surfaceGlow} color={C.ice} />

        {/* the stomata: tiny pores in the lower epidermis */}
        <SecLocal>
          {SEC_STOMATA.map((sx, i) => {
            const ring = Math.max(pulse(f, k.pores - 4 + i * 4, 30), 0.8 * pulse(f, k.stomataWord - 4 + i * 4, 40));
            return ring > 0 ? <ellipse key={i} cx={sx} cy={478} rx={56} ry={44} fill="none" stroke={C.ice} strokeWidth={5} opacity={ring} /> : null;
          })}
        </SecLocal>

        {/* recap glows */}
        <BandGlow y0={SEC_Y.cutTop} y1={SEC_Y.upTop + 2} p={rg(k.rCuticle)} />
        <BandGlow y0={SEC_Y.loBot - 2} y1={SEC_Y.cutBot} p={rg(k.rCuticle)} />
        <BandGlow y0={SEC_Y.upTop} y1={SEC_Y.upBot} p={rg(k.rUpper)} />
        <BandGlow y0={SEC_Y.palTop} y1={SEC_Y.palBot} p={rg(k.rPalisade)} />
        <BandGlow y0={SEC_Y.spTop} y1={SEC_Y.spBot} p={rg(k.rSpongy)} />
        <BandGlow y0={SEC_Y.loTop} y1={SEC_Y.loBot} p={rg(k.rLower)} />
        <SecLocal>
          {rg(k.rBundle) > 0 ? <circle cx={SEC_BUNDLE.x} cy={SEC_BUNDLE.y} r={SEC_BUNDLE.r + 4} fill={C.paper} opacity={0.18 * rg(k.rBundle)} /> : null}
          {SEC_STOMATA.map((sx, i) => {
            const g = Math.max(rg(k.rStomata), rg(k.rGuard));
            return g > 0 ? <ellipse key={i} cx={sx} cy={478} rx={48} ry={34} fill={C.paper} opacity={0.2 * g} /> : null;
          })}
        </SecLocal>

        {/* carbon dioxide diffuses through the air spaces to the cells */}
        {[
          { start: wave1, list: CO2_WAVES },
          { start: wave2, list: CO2_WAVES2 },
        ].map((w, wi) =>
          w.list.map((m, i) => {
            const s = w.start + m.d;
            if (f < s || f > s + CO2_TRAVEL + 40) return null;
            const route = smoothPts(CO2_ROUTES[m.r], 10);
            const q = prog(f, s, CO2_TRAVEL, EASE.inOut);
            const [x, y] = alongPts(route, q);
            const absorbed = prog(f, s + CO2_TRAVEL - 8, 12);
            const end = route[route.length - 1];
            const glow = pulse(f, s + CO2_TRAVEL - 8, 34);
            return (
              <g key={`${wi}-${i}`}>
                {glow > 0 ? <circle cx={end[0]} cy={end[1]} r={22} fill={C.leafLight} opacity={0.5 * glow} filter={`url(#${gid}-soft)`} /> : null}
                <CarbonDioxide
                  x={x + noise2D(`c10x${wi}${i}`, f * 0.04, 0) * 3}
                  y={y + noise2D(`c10y${wi}${i}`, f * 0.04, 2) * 3}
                  scale={0.2 * (1 - 0.4 * absorbed)}
                  rotate={i * 50 + noise2D(`c10r${wi}${i}`, f * 0.02, 1) * 30}
                  progress={prog(f, s, 10)}
                  opacity={1 - absorbed}
                  seed={110 + wi * 5 + i}
                />
              </g>
            );
          }),
        )}

        {/* xylem: water (ice) and mineral ions (green) come along the vein and up to the cells */}
        {[0, 1, 2, 0, 1].map((ri, i) => {
          const s = waterStart + i * 9;
          return <Traveller key={`w${i}`} f={f} start={s} route={WATER_ROUTES[ri]} travel={44} kind="water" gid={gid} />;
        })}
        {[1, 2, 0].map((ri, i) => {
          const s = ionStart + i * 10;
          return <Traveller key={`i${i}`} f={f} start={s} route={WATER_ROUTES[ri]} travel={46} kind="ion" gid={gid} />;
        })}

        {/* phloem: sucrose and amino acids in, then away along the vein (into the page) */}
        {phloemGlow > 0 ? <circle cx={PHLOEM_ANCHOR[0]} cy={PHLOEM_ANCHOR[1] - 4} r={44} fill={C.amber} opacity={0.4 * phloemGlow} filter={`url(#${gid}-soft)`} /> : null}
        {[0, 1, 0].map((ri, i) => (
          <Loader key={`s${i}`} f={f} start={sucStart + i * 12} away={awayAt + i * 8} route={SUC_ROUTES[ri]} kind="sucrose" gid={gid} i={i} />
        ))}
        {[1, 0].map((ri, i) => (
          <Loader key={`a${i}`} f={f} start={aminoStart + i * 10} away={awayAt + 10 + i * 8} route={SUC_ROUTES[ri]} kind="amino" gid={gid} i={i} />
        ))}

        {/* gases through one stoma: carbon dioxide in, oxygen out */}
        {[0, 1, 2].map((i) => {
          const s = k.zoomIn[0] + 4 + i * 18;
          return <Gas key={`ci${i}`} f={f} start={s} travel={84} route={PATHS.co2In} kind="co2" i={i} gid={gid} />;
        })}
        {[0, 1].map((i) => {
          const s = k.oxygen - 10 + i * 16;
          return <Gas key={`oo${i}`} f={f} start={s} travel={80} route={PATHS.o2Out} kind="o2" i={i} gid={gid} />;
        })}

        {/* in the light, the open stoma lets carbon dioxide diffuse in */}
        {[0, 1, 2].map((i) => (
          <Gas key={`cg${i}`} f={f} start={co2InStart + i * 14} travel={58} route={GUARD_CO2} kind="co2" i={i + 3} gid={gid} size={0.125} rot={84 + i * 8} />
        ))}
      </g>

      {/* "In the light": light falls on the leaf; packets of light land on the guard cells */}
      {lightP > 0 ? (
        <g style={{ mixBlendMode: "screen" }}>
          <defs>
            <linearGradient id={`${gid}-wash`} x1="0" y1="0" x2="0.25" y2="1">
              <stop offset="0" stopColor={C.sun} stopOpacity={0.3} />
              <stop offset="0.7" stopColor={C.sun} stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={1920} height={1080} fill={`url(#${gid}-wash)`} opacity={lightP} />
          {[gcLeft, gcRight].map((g, i) => (
            <ellipse key={i} cx={g[0]} cy={g[1]} rx={52} ry={78} fill={C.sun} opacity={0.22 * lightP} filter={`url(#${gid}-soft)`} />
          ))}
        </g>
      ) : null}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const s = k.inLight - 16 + i * 5;
        const to = i % 2 ? gcRight : gcLeft;
        const p = (f - s) / 24;
        const land = pulse(f, s + 22, 18);
        return (
          <g key={`ph${i}`}>
            <Photon from={[to[0] - 300 + i * 12, to[1] - 680]} to={to} p={p} size={0.8} />
            {land > 0 ? <circle cx={to[0]} cy={to[1]} r={30} fill={C.sun} opacity={0.5 * land} filter={`url(#${gid}-soft)`} /> : null}
          </g>
        );
      })}

      {/* ============ labels: the left column (carried over from S09, then the new ones) ============ */}
      {(() => {
        const L = lab({ progress: 1, opacity: 0.45 }, k.rCuticle);
        return <ColLabel k="cuticle" progress={L.progress} opacity={L.opacity} />;
      })()}
      {(() => {
        const L = lab({ progress: 1, opacity: 0.45 }, k.rUpper);
        return <ColLabel k="upper" progress={L.progress} opacity={L.opacity} />;
      })()}
      {(() => {
        const L = lab({ progress: 1, opacity: dimAt(k.spongyWord) }, k.rPalisade);
        return <ColLabel k="palisade" progress={L.progress} opacity={L.opacity} />;
      })()}
      <SubLine x={SUB_X} y={colSubY("palisade", 1)} text="most photosynthesis" p={1} opacity={1 - prog(f, k.spongyWord - 10, 12)} anchor="end" color={C.sun} />
      {(() => {
        const L = lab({ progress: prog(f, k.spongyWord - 2, 24), opacity: dimAt(k.bundle) }, k.rSpongy);
        return <ColLabel k="spongy" progress={L.progress} opacity={L.opacity} />;
      })()}
      <SubLine x={SUB_X} y={colSubY("spongy", 1)} text="loosely packed" p={prog(f, k.loosely - 2, 16)} opacity={1 - prog(f, k.bundle - 6, 12)} anchor="end" />
      {!inRecap ? <ColLabel k="air" progress={prog(f, k.airWord - 2, 24)} opacity={dimAt(k.bundle) * colOut * (1 - prog(f, k.lower - 6, 14))} /> : null}
      <SubLine x={SUB_X} y={colSubY("air", 1)} text="large surface area" p={prog(f, k.large - 2, 16)} opacity={1 - prog(f, k.bundle - 6, 12)} anchor="end" color={C.ice} />
      {(() => {
        const L = lab({ progress: prog(f, k.lowerWord - 2, 24), opacity: dimAt(k.stomata) }, k.rLower);
        return <ColLabel k="lower" progress={L.progress} opacity={L.opacity} />;
      })()}
      {(() => {
        const L = lab({ progress: prog(f, k.stomataWord - 2, 24), opacity: 1 }, k.rStomata);
        return <ColLabel k="stomata" progress={L.progress} opacity={L.opacity} />;
      })()}
      <SubLine x={SUB_X} y={colSubY("stomata", 1)} text="one pore = stoma" p={prog(f, k.onePore - 2, 16)} opacity={colOut * (inRecap ? 0 : 1)} anchor="end" />

      {/* the vascular bundle: below the section; xylem above it, phloem below it (as in the leaf) */}
      {(() => {
        const L = lab({ progress: prog(f, k.vascular - 2, 24), opacity: dimAt(k.lower) }, k.rBundle);
        return <Label anchor={BUNDLE_ANCHOR} at={BUNDLE_AT} text="vascular bundle" align="end" size={COL_SIZE} progress={L.progress} opacity={L.opacity} />;
      })()}
      {!inRecap ? (
        <>
          <Label anchor={XYLEM_ANCHOR} at={XYLEM_AT} text="xylem" color={C.ice} size={COL_SIZE} progress={prog(f, k.xylemWord - 2, 24)} opacity={(1 - 0.5 * prog(f, k.phloem - 4, 14)) * (1 - prog(f, k.lower - 6, 14))} />
          <SubLine x={XYLEM_AT[0] + 14} y={XYLEM_AT[1] + COL_SIZE * 0.34 + 46} text="water + ions" p={prog(f, k.water - 2, 16)} opacity={(1 - 0.5 * prog(f, k.phloem - 4, 14)) * (1 - prog(f, k.lower - 6, 14))} color={C.ice} />
          <Label anchor={PHLOEM_ANCHOR} at={PHLOEM_AT} text="phloem" color={C.amber} size={COL_SIZE} progress={prog(f, k.phloemWord - 2, 24)} opacity={1 - prog(f, k.lower - 6, 14)} />
          <SubLine x={PHLOEM_AT[0] + 14} y={PHLOEM_AT[1] + COL_SIZE * 0.34 + 46} text="sucrose + amino acids" p={prog(f, k.sucrose - 2, 16)} opacity={1 - prog(f, k.lower - 6, 14)} color={C.amberLight} />
        </>
      ) : null}

      {/* ============ zoomed in: one stoma ============ */}
      {co2Label > 0 ? <SubLine x={480} y={774} text="carbon dioxide in" p={co2Label} anchor="end" color={C.ice} weight={600} size={42} /> : null}
      {o2Label > 0 ? <SubLine x={770} y={846} text="oxygen out" p={o2Label} color={C.coral} weight={600} size={42} /> : null}
      <SubLine x={Z3[0] + 136} y={700} text="open" p={openWord} color={C.ink300} />
      <SubLine x={Z3[0] + 136} y={700} text="closed" p={closedWord} color={C.ink300} />
      {co2InLabel > 0 ? <SubLine x={1130} y={900} text="carbon dioxide in" p={co2InLabel} color={C.ice} weight={600} size={42} /> : null}
      <ForkLabel anchors={[gcLeft, gcRight]} join={[Z3[0], 736]} text="guard cells" textAt={[Z3[0], 800]} color={C.leafLight} size={COL_SIZE} progress={prog(f, k.guardWord - 2, 24)} opacity={gcOut} />

      {/* ============ recap: guard cells (on another stoma, so lines never cross) ============ */}
      {inRecap ? (
        <Label
          anchor={secP(SEC_STOMATA[1] + (gap / 2 + 17), 490)}
          at={GUARD2_AT}
          text="guard cells"
          color={C.leafLight}
          size={COL_SIZE}
          progress={recapP(k.rGuard)}
        />
      ) : null}

      <SectionTag n={4} title="Leaf structure" t={200} extended opacity={1 - window01(f, k.zoomIn[0], k.zoomOut[1] - 6, 14)} />
    </Stage>
  );
};

// ------------------------------------------------------------------ movers
/** Water (ice drop) or a mineral ion (small green ion) coming along the vein out of the xylem, then up a route. */
const Traveller: React.FC<{ f: number; start: number; route: Pt[]; travel: number; kind: "water" | "ion"; gid: string }> = ({ f, start, route, travel, kind, gid }) => {
  if (f < start || f > start + 14 + travel + 16) return null;
  const appear = prog(f, start, 12);
  const q = prog(f, start + 12, travel, EASE.inOut);
  const [x, y] = alongPts(smoothPts(route, 10), q);
  const fade = 1 - prog(f, start + 12 + travel - 6, 12);
  const r = kind === "water" ? 7.5 : 5.5;
  const s = 0.3 + 0.7 * EASE.out(appear);
  if (kind === "water") return <GlowDot x={x} y={y} r={r * s} color={C.ice} opacity={appear * fade} gid={gid} />;
  return (
    <g opacity={appear * fade}>
      <circle cx={x} cy={y} r={r * 2 * s} fill={C.leafLight} opacity={0.35} filter={`url(#${gid}-soft)`} />
      <circle cx={x} cy={y} r={r * s} fill={mix(C.leafLight, C.paper, 0.2)} />
      <circle cx={x} cy={y} r={(r + 3) * s} fill="none" stroke={C.leafLight} strokeWidth={1.6} opacity={0.8} />
    </g>
  );
};

/** Sucrose / an amino acid: made in a cell, moves into the phloem, then away along the vein (shrinks into the page). */
const Loader: React.FC<{ f: number; start: number; away: number; route: Pt[]; kind: "sucrose" | "amino"; gid: string; i: number }> = ({ f, start, away, route, kind, gid, i }) => {
  if (f < start || f > away + 56) return null;
  const appear = prog(f, start, 14);
  const q = prog(f, start + 6, Math.max(20, away - start - 10), EASE.inOut);
  const [x0, y0] = alongPts(smoothPts(route, 10), q);
  const go = prog(f, away, 46, EASE.in);
  const end = route[route.length - 1];
  const x = x0 + (end[0] + (i - 1) * 6 - x0) * go;
  const y = y0 + (end[1] + 4 - y0) * go;
  const s = (1 - 0.92 * go) * (0.6 + 0.4 * EASE.out(appear));
  const op = appear * (1 - prog(f, away + 30, 16));
  if (kind === "sucrose") {
    return (
      <g opacity={op}>
        <circle cx={x} cy={y} r={20 * s} fill={C.amber} opacity={0.3} filter={`url(#${gid}-soft)`} />
        <Sucrose x={x} y={y} scale={0.24 * s} rot={-12 + i * 20} />
      </g>
    );
  }
  return <AminoBead x={x} y={y} r={8 * s} color={i % 2 ? C.coral : C.violet} opacity={op} />;
};

/** CO2 in along `route` (absorbed into the palisade cell at the end) or O2 out (made in the cell, leaves the leaf). */
const Gas: React.FC<{
  f: number;
  start: number;
  travel: number;
  route: readonly Pt[];
  kind: "co2" | "o2";
  i: number;
  gid: string;
  /** world scale (0.2 at ×2 zoom; smaller when the camera is closer, so the size on screen stays the same) */
  size?: number;
  /** base rotation (deg); a near-vertical molecule slips through a narrow pore */
  rot?: number;
}> = ({ f, start, travel, route, kind, i, gid, size = 0.2, rot }) => {
  if (f < start || f > start + travel + 34) return null;
  const pts = smoothPts(route, 12);
  const q = prog(f, start, travel, (v) => v * 0.15 + EASE.inOut(v) * 0.85);
  const [x, y] = alongPts(pts, q);
  const appear = prog(f, start, 12);
  const endP = kind === "co2" ? prog(f, start + travel - 8, 12) : prog(f, start + travel - 10, 14);
  const wob = Math.sin(Math.PI * q);
  const jx = noise2D(`g10x${kind}${i}`, f * 0.035, 0) * 5 * wob * (size / 0.2);
  const jy = noise2D(`g10y${kind}${i}`, f * 0.035, 3) * 5 * wob * (size / 0.2);
  const end = pts[pts.length - 1];
  const glow = kind === "co2" ? pulse(f, start + travel - 8, 30) : 0;
  const common = { x: x + jx, y: y + jy, scale: size * (1 - 0.4 * endP), rotate: (rot ?? -40 + i * 35) + noise2D(`g10r${kind}${i}`, f * 0.02, 1) * 25, progress: appear, opacity: 1 - endP, seed: 140 + i + (kind === "co2" ? 0 : 10) };
  return (
    <g>
      {glow > 0 ? <circle cx={end[0]} cy={end[1]} r={16} fill={C.leafLight} opacity={0.55 * glow} filter={`url(#${gid}-soft)`} /> : null}
      {kind === "co2" ? <CarbonDioxide {...common} /> : <Oxygen {...common} />}
    </g>
  );
};
