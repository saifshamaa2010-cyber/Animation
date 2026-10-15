/**
 * S19 · Recap — six numbered places appear ("Let's recap"); each turns into a card as its point is
 * read, and its icon builds in time with the words (the equation's molecules, light → chlorophyll →
 * glucose, the five uses, the two ions, the leaf's layers, the three limiting factors). Only the card
 * being read is lit; the others settle back. On "And that's plant nutrition" the cards make way for
 * the title, which lands exactly where S20 (the end card) holds it.
 */
import React from "react";
import { C, EASE } from "../../../brand/tokens";
import { Stage } from "../../../components/Stage";
import { Photon, SunIcon } from "../../../components/Light";
import { Glucose } from "../../../components/SugarChain";
import { Flower, Leaf, LeafSection, Sucrose, leafGeometry } from "../../../components/bio";
import { CarbonDioxide, Oxygen, Water, mix } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { s19Timing } from "./S19Recap.timing";
import { TitleWords } from "./parts/S02-TitleCard";
import { FoldChain, GreeningChloroplast, IonBall, StraightArrow } from "./parts/S08-minerals";
import { CardSlot, EnergyBolt, MiniRateGraph, MiniThermometer, PlusMark, RecapCard, WallBricks, iconCentre } from "./parts/S19-recap";

/** Same y as S20's title, so the cut to the end card is seamless. */
const TITLE_Y = 262;

export const S19Recap: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s19Timing(sc);

  const starts = [k.r1, k.r2, k.r3, k.r4, k.r5, k.r6];
  const ends = [k.r2, k.r3, k.r4, k.r5, k.r6, k.title];
  const cards = [
    { title: "Photosynthesis", color: C.leaf },
    { title: "Chlorophyll", color: C.sun },
    { title: "Uses of glucose", color: C.amber },
    { title: "Mineral ions", color: C.ice },
    { title: "Leaf structure", color: C.leafLight },
    { title: "Limiting factors", color: C.paper, extended: true },
  ];
  const cardP = (i: number) => prog(f, starts[i] - 6, 18);
  const active = (i: number) => prog(f, starts[i] - 6, 12) * (1 - prog(f, ends[i] - 6, 14));
  const past = (i: number) => prog(f, ends[i] - 6, 14);
  const exit = (i: number) => prog(f, k.title + i * 2, 14, EASE.in);
  const anyCard = f < k.title + 40;

  // ---------------------------------------------------------------- card 1: the word equation, as molecules
  const c1 = iconCentre(0);
  const a1 = (at: number) => prog(f, at - 4, 14);

  // ---------------------------------------------------------------- card 2: light → chlorophyll → energy in glucose
  const c2 = iconCentre(1);
  const firstT0 = k.c2.light - 16;
  const dotDur0 = Math.max(18, Math.min(36, k.c2.chemicals - 4 - (firstT0 + 20)));
  const cycles: { t0: number; dot: number }[] = [];
  for (let n = 0; n < 8; n++) {
    const t0 = firstT0 + n * 54;
    if (n > 0 && t0 + 50 > k.r3 - 6) break;
    cycles.push({ t0, dot: n === 0 ? dotDur0 : 24 });
  }
  let chlGlow = 0;
  let glcGlow = 0;
  cycles.forEach((c) => {
    chlGlow = Math.max(chlGlow, pulse(f, c.t0 + 14, 26));
    glcGlow = Math.max(glcGlow, pulse(f, c.t0 + 20 + c.dot - 2, 30));
  });
  const glc2In = prog(f, firstT0 + 20 + dotDur0 - 12, 14);

  // ---------------------------------------------------------------- card 3: five uses
  const c3 = iconCentre(2);
  const ring3: Pt = [c3[0], c3[1] + 52];
  const USE_ANG = [-168, -129, -90, -51, -12];
  const useAt = (j: number): Pt => {
    const a = (USE_ANG[j] * Math.PI) / 180;
    return [ring3[0] + Math.cos(a) * 128, ring3[1] + Math.sin(a) * 128];
  };
  const ring3Glow = Math.max(0.2, ...k.c3.map((w) => pulse(f, w - 2, 22)));

  // ---------------------------------------------------------------- card 4: the two ions
  const c4 = iconCentre(3);
  const ionL: Pt = [c4[0] - 125, c4[1] - 46];
  const ionR: Pt = [c4[0] + 125, c4[1] - 46];

  // ---------------------------------------------------------------- card 5: broad, thin, layers
  const c5 = iconCentre(4);
  const leaf5 = leafGeometry({ cx: c5[0] - 128, cy: c5[1] - 6, len: 196, wid: 108, ang: -16, stalk: 0.1, veinPairs: 4 });
  const sec5 = { x: c5[0] + 22, y: c5[1] - 40, w: 232 };
  const secH = sec5.w * 0.34;
  const broadP = prog(f, k.c5.broad - 4, 14);
  const thinP = prog(f, k.c5.thin - 4, 14);
  const layersP = prog(f, k.c5.layers - 6, 40, (v) => v);

  // ---------------------------------------------------------------- card 6: limiting factors
  const c6 = iconCentre(5);
  const g6 = { x: c6[0] - 236, y: c6[1] - 64, w: 240, h: 150 };
  const fac = [k.r6, k.c6.co2, k.c6.temperature];
  const facX = [c6[0] + 66, c6[0] + 152, c6[0] + 232];
  const limGlow = pulse(f, k.c6.limiting - 2, 40);

  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.26 }}>
      {/* "Let's recap": six numbered places */}
      {anyCard
        ? cards.map((c, i) => <CardSlot key={`s${i}`} i={i} color={c.color} p={prog(f, k.recap + 2 + i * 4, 16) * (1 - prog(f, starts[i] - 4, 10))} />)
        : null}

      {anyCard ? (
        <>
          {/* 1 · photosynthesis: carbon dioxide + water → glucose + oxygen (light, chlorophyll) */}
          <RecapCard i={0} title={cards[0].title} color={cards[0].color} p={cardP(0)} active={active(0)} past={past(0)} exit={exit(0)}>
            <CarbonDioxide x={c1[0] - 200} y={c1[1]} scale={0.4} progress={a1(k.c1.co2)} temperature={20} seed={191} />
            <PlusMark x={c1[0] - 139} y={c1[1]} s={11} p={a1(k.c1.water)} />
            <Water x={c1[0] - 92} y={c1[1] + 4} scale={0.5} progress={a1(k.c1.water)} temperature={20} seed={192} />
            <StraightArrow from={[c1[0] - 50, c1[1]]} to={[c1[0] + 22, c1[1]]} p={prog(f, k.c1.gives - 4, 14)} color={C.paper} width={4} head={14} />
            {a1(k.c1.glucose) > 0 ? <Glucose x={c1[0] + 70} y={c1[1]} tone="sugar" glow={0.3} scale={0.9 * (0.7 + 0.3 * EASE.out(a1(k.c1.glucose)))} opacity={Math.min(1, a1(k.c1.glucose) * 1.5)} /> : null}
            <PlusMark x={c1[0] + 126} y={c1[1]} s={11} p={a1(k.c1.oxygen)} />
            <Oxygen x={c1[0] + 186} y={c1[1]} scale={0.46} progress={a1(k.c1.oxygen)} temperature={20} seed={193} />
            <SunIcon x={c1[0] - 14} y={c1[1] - 62} r={18} progress={prog(f, k.c1.light - 4, 16)} glow={0.4 + 0.5 * pulse(f, k.c1.light - 2, 30)} />
            <GreeningChloroplast x={c1[0] - 14} y={c1[1] + 58} scale={0.5} green={1} progress={prog(f, k.c1.chlorophyll - 4, 16)} glow={pulse(f, k.c1.chlorophyll - 2, 30)} />
          </RecapCard>

          {/* 2 · chlorophyll transfers energy from light into energy in chemicals */}
          <RecapCard i={1} title={cards[1].title} color={cards[1].color} p={cardP(1)} active={active(1)} past={past(1)} exit={exit(1)}>
            <GreeningChloroplast x={c2[0]} y={c2[1]} scale={0.85} green={1} progress={prog(f, k.r2 - 2, 16)} glow={chlGlow} />
            <SunIcon x={c2[0] - 186} y={c2[1]} r={26} progress={prog(f, k.c2.transfers - 4, 16)} glow={0.5} />
            <StraightArrow from={[c2[0] - 140, c2[1] + 54]} to={[c2[0] - 64, c2[1] + 54]} p={prog(f, firstT0 + 4, 14)} color={C.ink400} width={3} head={10} />
            <StraightArrow from={[c2[0] + 64, c2[1] + 54]} to={[c2[0] + 140, c2[1] + 54]} p={prog(f, firstT0 + 24, 14)} color={C.ink400} width={3} head={10} />
            {cycles.map((c, n) => {
              const u = prog(f, c.t0 + 20, c.dot, EASE.inOut);
              const col = mix(C.sun, C.amber, u);
              const ax = c2[0] + 58;
              const bx = c2[0] + 146;
              return (
                <g key={n}>
                  <Photon from={[c2[0] - 150, c2[1]]} to={[c2[0] - 52, c2[1]]} p={(f - c.t0) / 16} size={0.75} />
                  {u > 0 && u < 1 ? (
                    <g>
                      <circle cx={ax + (bx - ax) * u} cy={c2[1]} r={16} fill={col} opacity={0.3} />
                      <circle cx={ax + (bx - ax) * u} cy={c2[1]} r={7} fill={mix(col, C.paper, 0.4)} />
                    </g>
                  ) : null}
                </g>
              );
            })}
            {glc2In > 0 ? <Glucose x={c2[0] + 188} y={c2[1]} tone="sugar" glow={0.2 + 0.8 * glcGlow} scale={1.0 * (0.7 + 0.3 * EASE.out(glc2In))} opacity={Math.min(1, glc2In * 1.5)} /> : null}
          </RecapCard>

          {/* 3 · glucose: respiration, starch, cellulose, sucrose, nectar */}
          <RecapCard i={2} title={cards[2].title} color={cards[2].color} p={cardP(2)} active={active(2)} past={past(2)} exit={exit(2)}>
            {k.c3.map((w, j) => {
              const sp = prog(f, w - 8, 12, (v) => v);
              if (sp <= 0) return null;
              const a = (USE_ANG[j] * Math.PI) / 180;
              const from: Pt = [ring3[0] + Math.cos(a) * 42, ring3[1] + Math.sin(a) * 42];
              const end = useAt(j);
              const to: Pt = [end[0] - Math.cos(a) * 36, end[1] - Math.sin(a) * 36];
              return <line key={j} x1={from[0]} y1={from[1]} x2={from[0] + (to[0] - from[0]) * sp} y2={from[1] + (to[1] - from[1]) * sp} stroke={mix(C.amber, C.ink500, 0.35)} strokeWidth={4} strokeLinecap="round" />;
            })}
            {prog(f, k.r3 - 2, 16) > 0 ? <Glucose x={ring3[0]} y={ring3[1]} tone="sugar" glow={ring3Glow} scale={0.95 * (0.7 + 0.3 * EASE.out(prog(f, k.r3 - 2, 16)))} opacity={Math.min(1, prog(f, k.r3 - 2, 16) * 1.5)} /> : null}
            <EnergyBolt x={useAt(0)[0]} y={useAt(0)[1]} p={prog(f, k.c3[0] - 2, 14)} glow={pulse(f, k.c3[0], 26)} />
            {prog(f, k.c3[1] - 2, 14) > 0
              ? ([[-13, -9], [13, -9], [0, 12]] as const).map(([dx, dy], n) => (
                  <Glucose key={n} x={useAt(1)[0] + dx * 1.25} y={useAt(1)[1] + dy * 1.25} tone="starch" scale={0.44} opacity={Math.min(1, prog(f, k.c3[1] - 2 + n * 3, 12) * 1.5)} />
                ))
              : null}
            <WallBricks x={useAt(2)[0]} y={useAt(2)[1]} p={prog(f, k.c3[2] - 2, 14)} />
            {prog(f, k.c3[3] - 2, 14) > 0 ? <Sucrose x={useAt(3)[0] + 4} y={useAt(3)[1]} scale={0.5} opacity={Math.min(1, prog(f, k.c3[3] - 2, 14) * 1.5)} /> : null}
            <Flower x={useAt(4)[0]} y={useAt(4)[1]} size={60} nectar={1} progress={prog(f, k.c3[4] - 2, 16)} />
          </RecapCard>

          {/* 4 · nitrate → amino acids; magnesium → chlorophyll */}
          <RecapCard i={3} title={cards[3].title} color={cards[3].color} p={cardP(3)} active={active(3)} past={past(3)} exit={exit(3)}>
            <IonBall x={ionL[0]} y={ionL[1]} kind="nitrate" color={C.ice} progress={prog(f, k.r4 - 2, 16)} />
            <StraightArrow from={[ionL[0], ionL[1] + 70]} to={[ionL[0], ionL[1] + 96]} p={prog(f, k.c4.amino - 12, 12)} color={C.paper} width={4} head={11} />
            <FoldChain x={ionL[0]} y={ionL[1] + 114} r={12} fold={0} shown={6 * prog(f, k.c4.amino - 4, 18, (v) => v)} glow={0.4} />
            <IonBall x={ionR[0]} y={ionR[1]} kind="magnesium" color={C.leafLight} progress={prog(f, k.c4.magnesium - 2, 16)} />
            <StraightArrow from={[ionR[0], ionR[1] + 80]} to={[ionR[0], ionR[1] + 100]} p={prog(f, k.c4.chlorophyll - 12, 12)} color={C.paper} width={4} head={11} />
            <GreeningChloroplast x={ionR[0]} y={ionR[1] + 118} scale={0.55} green={prog(f, k.c4.chlorophyll - 2, 22)} progress={prog(f, k.c4.chlorophyll - 8, 14)} glow={pulse(f, k.c4.chlorophyll, 30)} />
          </RecapCard>

          {/* 5 · leaves: broad, thin, built in layers */}
          <RecapCard i={4} title={cards[4].title} color={cards[4].color} p={cardP(4)} active={active(4)} past={past(4)} exit={exit(4)}>
            <Leaf geo={leaf5} progress={prog(f, k.r5 - 2, 18)} sunlit={0.6 * broadP} shadow={0.4} />
            {broadP > 0 ? (
              <g>
                <StraightArrow from={[leaf5.cx, leaf5.cy + 82]} to={[leaf5.cx - 104, leaf5.cy + 82]} p={broadP} color={C.paper} width={4} head={11} />
                <StraightArrow from={[leaf5.cx, leaf5.cy + 82]} to={[leaf5.cx + 104, leaf5.cy + 82]} p={broadP} color={C.paper} width={4} head={11} />
              </g>
            ) : null}
            {thinP > 0 ? (
              <g opacity={thinP}>
                {layersP < 1 ? <rect x={sec5.x} y={sec5.y} width={sec5.w} height={secH} rx={10} fill={mix(C.leafDeep, C.ink800, 0.4)} stroke={C.leafLight} strokeOpacity={0.6} strokeWidth={3} opacity={1 - layersP} /> : null}
                <StraightArrow from={[sec5.x - 16, sec5.y + secH / 2]} to={[sec5.x - 16, sec5.y - 2]} p={thinP} color={C.paper} width={4} head={10} />
                <StraightArrow from={[sec5.x - 16, sec5.y + secH / 2]} to={[sec5.x - 16, sec5.y + secH + 2]} p={thinP} color={C.paper} width={4} head={10} />
              </g>
            ) : null}
            {layersP > 0 ? <LeafSection x={sec5.x} y={sec5.y} w={sec5.w} reveal={layersP} chloroGlow={pulse(f, k.c5.adapted - 2, 40)} /> : null}
          </RecapCard>

          {/* 6 · light, carbon dioxide and temperature can all be limiting factors */}
          <RecapCard i={5} title={cards[5].title} color={cards[5].color} p={cardP(5)} active={active(5)} past={past(5)} exit={exit(5)} extended>
            <MiniRateGraph x={g6.x} y={g6.y} w={g6.w} h={g6.h} axes={prog(f, k.r6 - 2, 14)} p={prog(f, k.r6 + 4, Math.max(30, k.c6.temperature - k.r6), (v) => v)} plateauGlow={limGlow} />
            <SunIcon x={facX[0]} y={c6[1] - 4} r={17} progress={prog(f, fac[0] - 2, 14)} glow={0.4 + 0.5 * Math.max(pulse(f, fac[0], 26), limGlow)} />
            <CarbonDioxide x={facX[1]} y={c6[1] - 4} scale={0.34} progress={prog(f, fac[1] - 2, 14)} temperature={20} seed={196} />
            <MiniThermometer x={facX[2]} y={c6[1] - 10} p={prog(f, fac[2] - 2, 14)} />
            {limGlow > 0
              ? facX.map((x, n) => <circle key={n} cx={x} cy={c6[1] - 4} r={30 + 6 * limGlow} fill="none" stroke={C.paper} strokeOpacity={0.4 * limGlow} strokeWidth={3} />)
              : null}
          </RecapCard>
        </>
      ) : null}

      {/* "And that's plant nutrition." */}
      <TitleWords t={f - k.title - 16} y={TITLE_Y} />
    </Stage>
  );
};
