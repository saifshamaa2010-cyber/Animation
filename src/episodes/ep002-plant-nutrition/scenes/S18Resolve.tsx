/**
 * S18 · Resolve — back to van Helmont's willow (same framing as the end of S01).
 * Carbon dioxide streams into the leaves from the air; water rises from the soil up the trunk; light
 * lands and glucose forms in the leaves; sugar flows down and locks into the trunk as cellulose (amber
 * → bark). The soil's −57 g is mineral ions (nitrate, magnesium). "Made of water?" — partly: the tree
 * fills with water — but the wood itself glows amber: built from carbon dioxide, out of thin air.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { Label } from "../../../components/Label";
import { Pot } from "../../../components/bio";
import { hexIconPath } from "../../../components/bio/Organisms";
import { Scale } from "../../../components/lab/Lab";
import { Photon, SunBeams } from "../../../components/Light";
import { Glucose, GlucoseRing, RingDefs } from "../../../components/SugarChain";
import { HandArrow, HandUnderline, LitShape, Water, mix, textWidth } from "../../../components/kit";
import { circlePath } from "../../../components/kit/shared";
import { camTransform } from "../../../lib/camera";
import { Pt, rng } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { toScreen } from "../../../lib/world";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { WILLOW } from "./layout";
import { s18Timing } from "./S18Resolve.timing";
import { END_CAM, WillowTree, crownTargets, willowGeometry } from "./parts/S01-Willow";
import { LEDGER, Ledger, ledgerValueBox } from "./parts/S01-Ledger";
import { Co2Molecules, co2Flights, co2Glint } from "./parts/S01-Co2Stream";

const lin = (v: number) => v;
const FULL = willowGeometry(1);
const TARGETS = crownTargets(FULL, 14, 1, 5);
/** where glucose forms: leaves that have just taken in carbon dioxide */
const SITES = TARGETS.slice(0, 5);
const cam = END_CAM;
const S = (p: Pt) => toScreen(cam, p);
const [BX, BY] = FULL.base;
const SLOT_X = WILLOW.ledgerX;
const SLOT_Y = 214;
/** cellulose builds in the trunk from the bottom up */
const SLOT_T = [0.2, 0.35, 0.5, 0.65, 0.8];
const RING_S = 0.6;
const LEFT_X = 436;

/** Up the trunk (u 0..0.6), then out along a limb into the crown (u 0.6..1). */
const rise = (u: number, limb: number, off: number): Pt => {
  if (u < 0.6) {
    const t = 0.02 + 0.98 * (u / 0.6);
    const c = FULL.trunkAt(t);
    return [c[0] + off * FULL.trunkHalf(t) * 0.45, c[1]];
  }
  return FULL.limbAt(limb, ((u - 0.6) / 0.4) * 0.72);
};

/** From a leaf to the fork, then straight down the trunk to its slot. */
const flow = (u: number, site: Pt, slotT: number): Pt => {
  const crotch = FULL.crotch;
  if (u < 0.55) {
    const p = u / 0.55;
    const c: Pt = [(site[0] + crotch[0]) / 2, Math.min(site[1], crotch[1]) - 30];
    const q = 1 - p;
    return [q * q * site[0] + 2 * q * p * c[0] + p * p * crotch[0], q * q * site[1] + 2 * q * p * c[1] + p * p * crotch[1]];
  }
  const p = (u - 0.55) / 0.45;
  const t = 1 + (slotT - 1) * p;
  return FULL.trunkAt(t);
};

/** "A living tree is full of water": water molecules all through the trunk and the crown. */
const WATER_FIELD: { p: Pt; seed: number }[] = (() => {
  const r = rng(77);
  const out: { p: Pt; seed: number }[] = [];
  [0.12, 0.3, 0.46, 0.62, 0.78, 0.92].forEach((t, i) => {
    const c = FULL.trunkAt(t);
    out.push({ p: [c[0] + (i % 2 ? 1 : -1) * FULL.trunkHalf(t) * 0.35, c[1]], seed: 500 + i });
  });
  const leaves = FULL.front.flatMap((s) => s.leaves).filter((l) => l.y < FULL.crotch[1] + 150);
  for (let i = 0; i < 14; i++) {
    const l = leaves[Math.floor(r() * leaves.length)];
    out.push({ p: [l.x, l.y], seed: 520 + i });
  }
  return out;
})();

const Chip: React.FC<{ readonly x: number; readonly y: number; readonly w: number; readonly text: string; readonly color: string; readonly p: number }> = ({ x, y, w, text, color, p }) => {
  if (p <= 0) return null;
  return (
    <g opacity={Math.min(1, p * 1.4)} transform={`translate(0 ${(1 - EASE.out(p)) * 14})`}>
      <rect x={x} y={y} width={w} height={60} rx={30} fill={C.ink800} stroke={color} strokeWidth={3} />
      <text x={x + w / 2} y={y + 43} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={color}>
        {text}
      </text>
    </g>
  );
};

export const S18Resolve: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s18Timing(sc);
  const gid = useSvgId("s18");

  // ---- carbon dioxide from the air, into the leaves (for the rest of the scene)
  const flights = co2Flights({
    start: k.co2In - 16,
    stop: k.end + 30,
    every: 12,
    travel: 80,
    targets: TARGETS,
    spawn: (_, r) => [1150 + r() * 230, -150 - r() * 70],
    seed: 18,
  });
  const glint = co2Glint(flights, f);

  // ---- water from the soil, up the trunk, into the crown
  const waterEvery = 15;
  const waterStart = k.waterIn - 6;
  // water rises while it is being talked about, then stops (the trunk is needed for the sugar)
  const waterStop = Math.min(k.buildInto - 50, k.built + 30);
  const waters = Array.from({ length: Math.max(0, Math.ceil((waterStop - waterStart) / waterEvery)) }, (_, i) => {
    const r = rng(1800 + i * 13);
    return { t0: waterStart + i * waterEvery, limb: [1, 2, 3, 4, 5, 6][Math.floor(r() * 6)], off: (r() - 0.5) * 2, rot: r() * 360, travel: 88 };
  });

  // ---- light, glucose, and sugar locking into the wood
  const beams = window01(f, k.built - 14, k.minerals + 6, 20);
  const ringAt = (i: number) => k.glucose - 4 + i * 4;
  const flowAt = (i: number) => k.flowStart + i * k.ringEvery;
  const lockAt = (i: number) => flowAt(i) + 34;
  const slots = SLOT_T.map((t) => FULL.trunkAt(t));

  // ---- the wood: water fills the living tree, then the wood glows (built from carbon dioxide)
  const waterFull = prog(f, k.full - 6, 24) * (1 - prog(f, k.wood, 26));
  const waterTint = 0.55 * waterFull;
  const glow = prog(f, k.woodW - 6, 26);

  // ---- mineral ions from the soil
  const ionsData = [
    { at: k.nitrate, color: C.ice, text: "nitrate", from: [BX - 74, BY - 10] as Pt, limb: 2, labelY: 590 },
    { at: k.magnesium, color: C.leafLight, text: "magnesium", from: [BX - 34, BY - 6] as Pt, limb: 4, labelY: 700 },
  ];

  const inWood = (
    <g>
      <RingDefs gid={`${gid}-r`} />
      {/* water rising in the xylem */}
      {waters.map((w, i) => {
        const u = (f - w.t0) / w.travel;
        if (u <= 0 || u >= 1) return null;
        const [x, y] = rise(EASE.inOut(u), w.limb, w.off);
        return <Water key={`w${i}`} x={x} y={y} scale={0.4} rotate={w.rot + u * 40} opacity={Math.min(1, u * 8) * Math.min(1, (1 - u) * 5)} temperature={20} seed={300 + i} />;
      })}
      {/* mineral ions, up the same way */}
      {ionsData.map((io, i) => {
        const up = prog(f, io.at + 30, 76, EASE.inOut);
        if (f < io.at - 2 || up >= 1) return null;
        const pop = prog(f, io.at - 2, 14);
        const start: Pt = [io.from[0], io.from[1] - 10 * EASE.out(pop)];
        const p = up < 0.12 ? ([start[0] + (FULL.trunkAt(0.02)[0] - start[0]) * (up / 0.12), start[1] + (FULL.trunkAt(0.02)[1] - start[1]) * (up / 0.12)] as Pt) : rise((up - 0.12) / 0.88, io.limb, 0);
        return (
          <g key={`ion${i}`} opacity={Math.min(1, pop * 1.6) * (1 - prog(f, io.at + 92, 14))}>
            <LitShape d={circlePath(p[0], p[1], 13)} top={mix(io.color, C.paper, 0.3)} bottom={mix(io.color, C.ink800, 0.3)} rimOpacity={0.6} shadow={0.35} shadowDy={4} shadowBlur={5} />
          </g>
        );
      })}
      {/* sugar flowing down from the leaves */}
      {SITES.map((s, i) => {
        const u = prog(f, flowAt(i), 34, EASE.inOut);
        if (u <= 0 || u >= 1) return null;
        const [x, y] = flow(u, [s.x, s.y], SLOT_T[i]);
        const [tx, ty] = flow(Math.max(0, u - 0.08), [s.x, s.y], SLOT_T[i]);
        return (
          <g key={`fl${i}`}>
            <line x1={tx} y1={ty} x2={x} y2={y} stroke={C.amber} strokeOpacity={0.5} strokeWidth={9} strokeLinecap="round" />
            <circle cx={x} cy={y} r={20} fill={C.amber} opacity={0.3} />
            <circle cx={x} cy={y} r={9} fill={C.amberLight} />
          </g>
        );
      })}
      {/* cellulose: the rings lock into a chain in the trunk, then turn to wood */}
      {slots.map((p, i) => {
        if (i === 0 || f < lockAt(i)) return null;
        const q = slots[i - 1];
        const woody = prog(f, lockAt(i) + 16, 30) * (1 - glow);
        return <line key={`ln${i}`} x1={q[0]} y1={q[1]} x2={p[0]} y2={p[1]} stroke={mix(C.amberDeep, C.barkDeep, woody)} strokeWidth={5} strokeLinecap="round" />;
      })}
      {slots.map((p, i) => {
        if (f < lockAt(i)) return null;
        const pop = prog(f, lockAt(i), 14);
        const woody = prog(f, lockAt(i) + 16, 30) * (1 - glow);
        const sc2 = RING_S * (0.55 + 0.45 * EASE.out(pop));
        return (
          <g key={`rg${i}`}>
            <GlucoseRing x={p[0]} y={p[1]} rot={90} flip={i % 2 === 1} tone="sugar" glow={Math.max(1 - prog(f, lockAt(i), 24), glow * 0.8)} scale={sc2} gid={`${gid}-r`} />
            <path d={hexIconPath(p[0], p[1], 30 * sc2)} transform={`rotate(90 ${p[0]} ${p[1]})`} fill={mix(C.bark, C.barkDeep, 0.3)} stroke={C.barkDeep} strokeWidth={2.5} opacity={0.88 * woody} />
          </g>
        );
      })}
    </g>
  );

  // ---- screen-space anchors and text
  const co2Anchor = S([1096, 30]);
  const waterAnchor = S([BX - 16, BY - 8]);
  const vbSoil = ledgerValueBox(1);
  const vbWillow = ledgerValueBox(0);
  const chips = [
    { text: "cellulose", color: C.amberLight, at: k.cellulose },
    { text: "starch", color: C.cream, at: k.starch },
    { text: "proteins", color: C.paper, at: k.proteins },
  ];
  const chipW = chips.map((c) => textWidth(c.text, 40, 600) + 48);
  const chipGap = 14;
  const chipsW = chipW.reduce((a, b) => a + b, 0) + chipGap * 2;
  const chipsOut = 1 - prog(f, k.minerals + 4, 14);
  let cx0 = LEDGER.x + LEDGER.w / 2 - chipsW / 2;
  const thoughtOut = 1 - prog(f, k.wood + 2, 16);
  const qWater = prog(f, k.madeOf - 2, 18) * thoughtOut;
  const qPartly = prog(f, k.partlyW - 2, 18) * thoughtOut;
  const endLabel = prog(f, k.co2Again - 2, 22);
  const woodAnchor = S([FULL.trunkAt(0.1)[0] - FULL.trunkHalf(0.1) + 4, FULL.trunkAt(0.1)[1]]);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.3, lightY: 0.28 }}>
      <SunBeams
        source={[-260, -300]}
        beams={[
          [[300, 620], [520, 660]],
          [[600, 470], [820, 520]],
          [[880, 200], [1000, 300]],
        ]}
        on={beams}
        fadeTo={[1100, 900]}
      />
      <g transform={camTransform(cam)}>
        <Scale x={WILLOW.potX} y={WILLOW.scaleY} w={WILLOW.scaleW} reading="" />
        {[-1, 0, 1].map((i) => (
          <rect key={i} x={WILLOW.potX + i * 56 - 18} y={WILLOW.scaleY + 80} width={36} height={8} rx={4} fill={C.ink600} />
        ))}
        <Pot x={WILLOW.potX} y={WILLOW.potY} w={WILLOW.potW} h={WILLOW.potH} />
        <WillowTree geo={FULL} glint={glint} water={waterTint} glow={glow} inWood={inWood} />
        {/* glucose forming in the leaves where light lands; each ring leaves as the sugar flows down */}
        {SITES.map((s, i) => {
          const p = prog(f, ringAt(i), 14);
          const out = prog(f, flowAt(i) - 4, 10);
          if (p <= 0 || out >= 1) return null;
          return <Glucose key={`gl${i}`} x={s.x + 6} y={s.y - 6} tone="sugar" glow={1 - 0.6 * prog(f, ringAt(i) + 10, 30)} scale={0.78 * (0.6 + 0.4 * EASE.out(p)) * (1 - 0.5 * out)} opacity={Math.min(1, p * 1.5) * (1 - out)} />;
        })}
        {waterFull > 0
          ? WATER_FIELD.map((w, i) => {
              const p = prog(f, k.full - 6 + (i % 7) * 3, 14) * (1 - prog(f, k.wood + (i % 5) * 2, 18));
              return p > 0 ? <Water key={`wf${i}`} x={w.p[0]} y={w.p[1]} scale={0.34} rotate={i * 47} progress={p} opacity={p} temperature={20} seed={w.seed} /> : null;
            })
          : null}
        <Co2Molecules f={f} flights={flights} scale={0.5} />
      </g>

      {/* light lands on the leaves where glucose is about to form */}
      {SITES.map((s, i) => {
        const to = S([s.x, s.y]);
        const land = ringAt(i) - 2;
        return <Photon key={`ph${i}`} from={[to[0] - 520, to[1] - 560]} to={to} p={(f - land + 22) / 22} size={0.95} />;
      })}
      {TARGETS.slice(5, 12).map((s, i) => {
        const to = S([s.x, s.y]);
        const land = k.built + 4 + i * 9;
        return <Photon key={`px${i}`} from={[to[0] - 520, to[1] - 560]} to={to} p={(f - land + 22) / 22} size={0.7} />;
      })}

      <Ledger
        card={prog(f, k.helmont - 4, 20)}
        rows={[1, 1]}
        ticks={[1, 1]}
        values={[74, 57]}
        valueOn={[1, 1]}
        hi={[window01(f, k.where - 2, k.co2In + 16, 10), window01(f, k.ions - 4, k.thought - 2, 10)]}
        strike={1}
        circle={prog(f, k.kg - 2, 20, lin)}
        circleOpacity={1 - prog(f, k.co2In + 20, 14)}
      />

      {/* inputs: carbon dioxide from the air, water from the soil */}
      <Label anchor={co2Anchor} at={[SLOT_X, SLOT_Y - 14]} text="carbon dioxide" sub="from the air" color={C.ice} size={52} progress={prog(f, k.co2In - 2, 22)} opacity={1 - prog(f, k.built + 2, 12)} />
      <Label anchor={waterAnchor} at={[LEFT_X, 610]} text="water" sub="from the soil" color={C.ice} align="end" progress={prog(f, k.water1 - 2, 22)} opacity={1 - prog(f, k.built + 8, 12)} />
      <Label anchor={S([SITES[0].x + 6, SITES[0].y - 6])} at={[SLOT_X, SLOT_Y - 14]} text="glucose" color={C.amberLight} size={52} progress={prog(f, k.glucose, 22)} opacity={1 - prog(f, k.cellulose - 6, 12)} />

      {/* what glucose is built into */}
      <g opacity={chipsOut}>
        {chips.map((c, i) => {
          const x = cx0;
          cx0 += chipW[i] + chipGap;
          return <Chip key={c.text} x={x} y={640} w={chipW[i]} text={c.text} color={c.color} p={prog(f, c.at - 2, 14)} />;
        })}
      </g>

      {/* the soil's small loss: mineral ions */}
      <Label anchor={[vbSoil.cx, vbSoil.bottom + 14]} at={[vbSoil.cx - 40, 672]} text="mineral ions" align="end" progress={prog(f, k.ions - 2, 22)} opacity={1 - prog(f, k.thought - 10, 12)} />
      {ionsData.map((io) => (
        <Label key={io.text} anchor={S([io.from[0], io.from[1] - 10])} at={[LEFT_X, io.labelY]} text={io.text} color={io.color} align="end" progress={prog(f, io.at - 2, 20)} opacity={1 - prog(f, io.at + 70, 14)} />
      ))}

      {/* "made of water?" — only partly right */}
      {qWater > 0 ? (
        <text x={SLOT_X} y={724 + (1 - qWater) * 12} fontFamily={FONT} fontWeight={700} fontSize={60} fill={C.ice} opacity={qWater} letterSpacing={-1}>
          made of water?
        </text>
      ) : null}
      {qPartly > 0 ? (
        <g opacity={qPartly}>
          <text x={SLOT_X} y={808 + (1 - qPartly) * 12} fontFamily={FONT} fontWeight={700} fontSize={60} fill={C.paper} letterSpacing={-1}>
            partly right
          </text>
          <HandUnderline x1={SLOT_X - 2} x2={SLOT_X + textWidth("partly", 60, 700, -1) + 4} y={826} progress={prog(f, k.partlyW + 6, 14, lin)} color={C.paper} width={6} seed={23} />
        </g>
      ) : null}

      {/* the wood itself: built from carbon dioxide, out of thin air */}
      <Label anchor={woodAnchor} at={[LEFT_X, 640]} text="wood" color={C.amberLight} size={52} align="end" progress={prog(f, k.woodW - 2, 22)} />
      <Label anchor={co2Anchor} at={[SLOT_X, SLOT_Y - 14]} text="carbon dioxide" color={C.ice} size={52} progress={endLabel} />
      {endLabel > 0 ? (
        <text x={SLOT_X + 14} y={SLOT_Y + 48} fontFamily={FONT} fontWeight={500} fontSize={44} fill={mix(C.ice, C.paper, 0.35)} opacity={prog(f, k.thin - 2, 16)}>
          out of thin air
        </text>
      ) : null}
      <HandArrow
        from={[SLOT_X + 14 + textWidth("carbon dioxide", 52, 600) + 26, SLOT_Y - 30]}
        to={[vbWillow.cx + 6, vbWillow.top - 4]}
        bend={-0.35}
        progress={prog(f, k.co2Again + 14, 20, lin)}
        color={C.ice}
        width={6}
        seed={9}
      />
    </Stage>
  );
};
