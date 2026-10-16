/**
 * S07 · Uses — what plants do with glucose (section 2).
 *
 * The glucose ring sits at the centre; five spokes reach out on "five uses" with numbered, unlit
 * badges. On each "One… Two…" the badge lights and a glucose ring travels out along its spoke, then
 * becomes the thing it is used for, built in time with the narration:
 *  1 respiration — inside a cell the ring is broken down and energy bursts out;
 *  2 starch — rings join and the chain coils up compactly ("energy store"); "insoluble": water
 *    molecules drift past it, unaffected;
 *  3 cellulose — rings are laid one by one around a cell: its wall;
 *  4 sucrose — glucose + fructose; "another sugar" (it glows amber, the sugar colour), then it is carried
 *    along the phloem to other parts of the plant;
 *  5 nectar — fills a flower; a bee arrives (pollination).
 * Finished uses step back while the next is explained; their second line fades so that only the five
 * names remain for the closing list, where each one pulses as it is said.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C, EASE } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { SectionTag } from "../../../components/SectionTag";
import { Glucose } from "../../../components/SugarChain";
import { Bee, Flower, Sucrose } from "../../../components/bio";
import { Water, mix, textWidth } from "../../../components/kit";
import { Pt } from "../../../lib/geometry";
import { prog, window01 } from "../../../lib/motion";
import { pulse } from "../../../lib/track";
import { useScene } from "../../../lib/timeline";
import { useSvgId } from "../../../components/ids";
import { SUPPLY, s07Timing } from "./S07Uses.timing";
import {
  Badge,
  CelluloseIcon,
  HUB,
  HUB_SCALE,
  PhloemTube,
  RespirationIcon,
  STATIONS,
  StarchIcon,
  StationLabel,
  TUBE,
  spokeOf,
} from "./parts/S07-uses";

const SUC_SCALE = 0.55;
/** sucrose: px per frame along the phloem */
const SUC_SPEED = 2.6;
const CHIP: Pt = [1480, 566];

export const S07Uses: React.FC = () => {
  const sc = useScene();
  const { f } = sc;
  const k = s07Timing(sc);
  const gid = useSvgId("s07");

  // ---------------------------------------------------------------- the hub: glucose
  const hubIn = prog(f, -9, 26);
  const hubGlow = 0.5 + 0.3 * pulse(f, k.glucose - 4, 40);
  const hubLabel = prog(f, k.glucose - 2, 18);

  // ---------------------------------------------------------------- stations: shared timing
  const spokes = STATIONS.map(spokeOf);
  const arrival = (i: number) => k.starts[i] + 2 + SUPPLY;
  const lit = (i: number) => prog(f, k.starts[i] - 2, 12);
  // finished uses step back while the next is explained; all return for the closing list
  const dimOf = (i: number) => (i < 4 ? 1 - 0.5 * window01(f, k.starts[i + 1] - 2, k.recap + 2, 16) : 1);
  const recapPulse = (i: number) => pulse(f, k.recapWords[i] - 4, 30);
  const subOut = (i: number) => 1 - prog(f, (i < 4 ? k.starts[i + 1] : k.recap) - 4, 14);

  // 1 · respiration
  const burst = (f - (k.release - 2)) / 26;
  const warm = prog(f, k.release + 6, 22) * (0.75 + 0.25 * pulse(f, k.cells - 4, 34));
  // after the burst, energy keeps being released for the cell: a gentle wave every ~1.6 s
  const waves: number[] = [];
  for (let s = k.release + 30; s < k.end; s += 48) waves.push((f - s) / 44);

  // 2 · starch
  const grow = prog(f, arrival(1) - 4, 32, (v) => v);
  const coil = prog(f, k.starchWord - 4, 40, (v) => v);
  const granule = prog(f, k.store - 8, 22);
  const chipP = prog(f, k.insolubleWord - 2, 16) * (1 - prog(f, k.three - 4, 14));
  const chipW = textWidth("insoluble", 40, 600) + 52;
  // water keeps moving past the starch, unaffected (straight paths, only thermal jiggle)
  // a steady, evenly spaced stream of water flows past the starch the whole time: nothing pulls it aside
  const waterStart = k.insolubleWord + 18;
  const WATER: { from: Pt; to: Pt; s: number }[] = [];
  for (let s = waterStart, i = 0; s < k.three - 30; s += 28, i++) {
    WATER.push(i % 2 === 0 ? { from: [1790, 180], to: [1230, 180], s } : { from: [1672, 120], to: [1672, 640], s });
  }
  const waterEnd = k.three + 6;

  // 3 · cellulose
  const built = prog(f, arrival(2) - 4, Math.max(40, k.walls - arrival(2) + 2), (v) => v);
  const wall = prog(f, k.walls - 4, 18);

  // 4 · sucrose
  const tubeP = prog(f, k.four + 2, 26);
  const toSucrose = prog(f, k.sucroseWord - 4, 14);
  // "…another sugar": the new molecule glows amber (sugar) while its sub-line says so
  const sugarGlow = pulse(f, k.another - 2, 40);
  const anotherSub = prog(f, k.another - 2, 16) * (1 - prog(f, k.transported - 10, 8));
  const slide0 = k.transported - 4;
  const arrowP = prog(f, k.parts - 14, 16);
  const sucStream: number[] = [];
  for (let s = k.phloem + 20; s < k.end; s += 64) sucStream.push(s);

  // 5 · nectar
  const flowerP = prog(f, arrival(4) - 8, 24);
  const nectar = prog(f, k.nectarWord - 4, 26);
  const beeDur = Math.max(32, k.pollination - k.attract + 8);
  const beeQ = prog(f, k.attract - 6, beeDur, EASE.inOut);

  // ---------------------------------------------------------------- render helpers
  const supplyRing = (i: number) => {
    const q = prog(f, k.starts[i] + 2, SUPPLY, EASE.inOut);
    if (q <= 0 || f > arrival(i) + 2) return null;
    const s = spokes[i];
    const to = STATIONS[i].arrive;
    const x = s.from[0] + (to[0] - s.from[0]) * q;
    const y = s.from[1] + (to[1] - s.from[1]) * q;
    const scale = i === 3 ? SUC_SCALE : i === 1 ? 0.5 : i === 2 ? 0.34 + 0.26 * (1 - q) : 0.62;
    return <Glucose key={`sup${i}`} x={x} y={y} tone="sugar" glow={0.45} scale={scale} opacity={Math.min(1, q * 4)} />;
  };

  return (
    <Stage bg={{ tone: "warm", lightX: 0.5, lightY: 0.42 }}>
      <defs>
        <filter id={`${gid}-blur`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>

      {/* ============ spokes ============ */}
      {spokes.map((s, i) => {
        const p = prog(f, k.fiveUses - 4 + i * 4, 22);
        if (p <= 0) return null;
        const l = lit(i);
        const rp = recapPulse(i);
        const x2 = s.from[0] + (s.to[0] - s.from[0]) * p;
        const y2 = s.from[1] + (s.to[1] - s.from[1]) * p;
        return (
          <g key={`sp${i}`} opacity={0.5 + 0.5 * dimOf(i)}>
            {rp > 0 ? <line x1={s.from[0]} y1={s.from[1]} x2={x2} y2={y2} stroke={C.amber} strokeWidth={14} strokeLinecap="round" opacity={0.3 * rp} filter={`url(#${gid}-blur)`} /> : null}
            {p >= 1 && f < k.starts[i] + 8 ? <circle cx={s.to[0]} cy={s.to[1]} r={9} fill="none" stroke={C.ink400} strokeWidth={3} opacity={(1 - prog(f, k.starts[i], 8)) * 0.8} /> : null}
            <line x1={s.from[0]} y1={s.from[1]} x2={x2} y2={y2} stroke={mix(C.ink400, C.amber, l)} strokeOpacity={0.45 + 0.3 * l + 0.25 * rp} strokeWidth={3 + 2 * rp} strokeLinecap="round" />
          </g>
        );
      })}

      {/* ============ the hub ============ */}
      {hubIn > 0 ? (
        <g opacity={Math.min(1, hubIn * 1.4)}>
          <ellipse cx={HUB[0]} cy={HUB[1] + 6} rx={120} ry={100} fill={C.amber} opacity={0.12 * hubGlow} filter={`url(#${gid}-blur)`} />
          <Glucose x={HUB[0]} y={HUB[1]} tone="sugar" glow={hubGlow} scale={HUB_SCALE * (0.82 + 0.18 * EASE.out(hubIn))} />
        </g>
      ) : null}
      {hubLabel > 0 ? (
        <text x={HUB[0]} y={338 + (1 - EASE.out(hubLabel)) * 12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={52} fill={C.amber} opacity={hubLabel} letterSpacing={-0.5}>
          glucose
        </text>
      ) : null}

      {/* ============ 1 · respiration ============ */}
      <g opacity={dimOf(0)}>
        <RespirationIcon c={STATIONS[0].c} cell={prog(f, k.one + 4, 20)} ring={prog(f, arrival(0) - 2, 4)} burst={burst} warm={warm} waves={waves} gid={gid} />
      </g>

      {/* ============ 2 · starch (+ water drifting past) ============ */}
      {f >= waterStart && f < waterEnd + 10
        ? WATER.map((w, i) => {
            const s = w.s;
            const len = 190;
            const q = (f - s) / len;
            if (q <= 0 || q >= 1) return null;
            const x = w.from[0] + (w.to[0] - w.from[0]) * q + noise2D(`s7wx${i}`, f * 0.03, 0) * 4;
            const y = w.from[1] + (w.to[1] - w.from[1]) * q + noise2D(`s7wy${i}`, f * 0.03, 5) * 4;
            const fade = Math.min(1, q * 6, (1 - q) * 6) * (1 - prog(f, waterEnd - 8, 12));
            return <Water key={`w${i}`} x={x} y={y} scale={0.5} rotate={-15 + i * 30} opacity={fade} temperature={20} seed={30 + i} />;
          })
        : null}
      <StarchIcon c={STATIONS[1].c} grow={grow} coil={coil} granule={granule} opacity={dimOf(1)} />
      {chipP > 0 ? (
        <g opacity={chipP} transform={`translate(0 ${(1 - EASE.out(chipP)) * 10})`}>
          <rect x={CHIP[0] - chipW / 2} y={CHIP[1] - 32} width={chipW} height={64} rx={32} fill={mix(C.ink800, C.ice, 0.08)} stroke={C.ice} strokeOpacity={0.75} strokeWidth={3} />
          <text x={CHIP[0]} y={CHIP[1] + 14} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.paper}>
            insoluble
          </text>
        </g>
      ) : null}

      {/* ============ 3 · cellulose ============ */}
      <CelluloseIcon c={STATIONS[2].c} cell={prog(f, k.three + 6, 20)} built={built} wall={wall} opacity={dimOf(2)} />

      {/* ============ 4 · sucrose in the phloem ============ */}
      <PhloemTube p={tubeP} arrow={arrowP} gid={gid} opacity={dimOf(3)}>
        {/* the sucrose made here, then carried away */}
        {toSucrose > 0
          ? (() => {
              const x0 = STATIONS[3].arrive[0] + 44 * SUC_SCALE;
              const x = x0 + Math.max(0, f - slide0) * SUC_SPEED * prog(f, slide0, 20, (v) => v);
              return <Sucrose x={x} y={TUBE.y} scale={SUC_SCALE} glow={0.25 + 0.6 * sugarGlow} opacity={toSucrose} />;
            })()
          : null}
        {sucStream.map((s, i) => {
          if (f < s) return null;
          const x = TUBE.x - 50 + (f - s) * SUC_SPEED;
          if (x > TUBE.x + TUBE.w + 60) return null;
          return <Sucrose key={i} x={x} y={TUBE.y} scale={SUC_SCALE} glow={0.2} />;
        })}
      </PhloemTube>
      {/* glucose waiting to become sucrose (its glucose half stays in place as fructose joins) */}
      {f >= arrival(3) && toSucrose < 1 ? <Glucose x={STATIONS[3].arrive[0]} y={TUBE.y} tone="sugar" glow={0.45} scale={SUC_SCALE} opacity={dimOf(3)} /> : null}

      {/* ============ 5 · nectar ============ */}
      <Flower x={STATIONS[4].c[0]} y={STATIONS[4].c[1]} size={166} nectar={nectar} progress={flowerP} />
      {beeQ > 0
        ? (() => {
            const a: Pt = [-90, 560];
            const cpt: Pt = [190, 470];
            // lands beside the nectar (head at the centre of the flower), not on top of it
            const b: Pt = [STATIONS[4].c[0] - 42, STATIONS[4].c[1] - 34];
            const u = 1 - beeQ;
            const x = u * u * a[0] + 2 * u * beeQ * cpt[0] + beeQ * beeQ * b[0];
            const y = u * u * a[1] + 2 * u * beeQ * cpt[1] + beeQ * beeQ * b[1];
            const dx = 2 * u * (cpt[0] - a[0]) + 2 * beeQ * (b[0] - cpt[0]);
            const dy = 2 * u * (cpt[1] - a[1]) + 2 * beeQ * (b[1] - cpt[1]);
            const heading = (Math.atan2(dy, dx) * 180) / Math.PI;
            const rot = heading * (1 - EASE.inOut(prog(f, k.attract - 6 + beeDur - 14, 14))) + 32 * EASE.inOut(prog(f, k.attract - 6 + beeDur - 14, 14));
            return <Bee x={x} y={y} size={58} rot={rot} progress={Math.min(1, beeQ * 6)} />;
          })()
        : null}

      {/* ============ glucose travelling out along the spokes ============ */}
      {STATIONS.map((_, i) => supplyRing(i))}

      {/* ============ badges and labels ============ */}
      {spokes.map((s, i) => (
        <g key={`b${i}`} opacity={0.55 + 0.45 * dimOf(i)}>
          <Badge at={s.badge} n={STATIONS[i].n} appear={prog(f, k.fiveUses + 4 + i * 4, 16)} lit={lit(i)} pulse={recapPulse(i)} />
        </g>
      ))}
      {STATIONS.map((st, i) => {
        const titleAt = [k.respWord, k.starchWord, k.celluloseWord, k.sucroseWord, k.nectarWord][i];
        const subAt = [k.release, k.store - 10, k.walls - 6, k.transported, k.attract][i];
        return (
          <g key={`l${i}`} opacity={0.6 + 0.4 * dimOf(i)}>
            <StationLabel s={st} title={prog(f, titleAt - 2, 16)} sub={prog(f, subAt - 2, 16) * subOut(i)} glow={recapPulse(i)} />
            {/* sucrose: "another sugar" first (amber = sugar), until it is "transported in phloem" */}
            {i === 3 && anotherSub > 0 ? <StationLabel s={st} title={0} sub={anotherSub} subText="another sugar" subColor={C.amber} /> : null}
          </g>
        );
      })}

      <SectionTag n={2} title="What plants do with glucose" t={f} />
    </Stage>
  );
};
