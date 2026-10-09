/**
 * Static style frames for the storyboard check-in. Each one is a key moment
 * from the storyboard, built from the same reusable components the animation uses.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, H, W } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { Stage } from "../../components/Stage";
import { Enzyme } from "../../components/Enzyme";
import { SugarChain, straightChain } from "../../components/SugarChain";
import { dockedChain } from "../../components/dock";
import { Label, Keyword } from "../../components/Label";
import { Thermometer } from "../../components/Thermometer";
import { Graph, bell, rateVsTemperature } from "../../components/Graph";
import { MythCard } from "../../components/MythCard";
import { PausePredict } from "../../components/PausePredict";
import { Cracker, Crumb } from "../../components/Cracker";
import { Cross, Hourglass, PanEgg, PaperSheet } from "../../components/Icons";
import { DOCK } from "../../components/molecule-geometry";

export const FRAME_NAMES = [
  "hook",
  "starch",
  "protein",
  "activeSite",
  "snap",
  "specific",
  "myth1",
  "predict",
  "denatured",
  "egg",
  "ph",
  "title",
] as const;
export type FrameName = (typeof FRAME_NAMES)[number];

export const FRAME_CAPTIONS: Record<FrameName, string> = {
  hook: "S01 Hook — keep chewing; the crumbs warm to amber as sweetness rises",
  starch: "S03 Zoom in: starch = a chain of glucose; one link lasts millions of years",
  protein: "S04 An enzyme is a folded chain of amino acids (shown unfolding)",
  activeSite: "S05 Substrate fits the active site → enzyme–substrate complex",
  snap: "S05 Snap: maltose (2 glucose) leaves, glowing amber = sweet",
  specific: "S05 Specific: cellulose (paper) is glucose too, but doesn't fit",
  myth1: "S07 Myth #1 struck out and corrected",
  predict: "S09 Pause & predict: what happens above 37 °C?",
  denatured: "S10 70 °C: weak bonds snap, chain unravels, pocket lost",
  egg: "S10 Same kind of change as egg white setting; cooling won't undo it",
  ph: "S12 Optimum pH: pepsin ≈ 2 (stomach), amylase ≈ 7 (mouth)",
  title: "S02 / S13 Title card",
};

const Hook: React.FC = () => {
  const ringCx = 1330;
  const ringCy = 440;
  const r = 165;
  const circ = 2 * Math.PI * r;
  const t = 0.75;
  return (
    <Stage bg={{ tone: "warm", lightX: 0.35 }}>
      <Cracker x={600} y={540} size={470} rotate={-8} bites={2} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Crumb key={i} x={820 + i * 26} y={330 + (i % 2) * 40} r={10 + (i % 3) * 4} seed={i + 3} rot={i * 40} />
      ))}
      <circle cx={ringCx} cy={ringCy} r={r} fill="none" stroke={C.ink600} strokeWidth={14} />
      <circle
        cx={ringCx}
        cy={ringCy}
        r={r}
        fill="none"
        stroke={C.amber}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={`${circ * t} ${circ}`}
        transform={`rotate(-90 ${ringCx} ${ringCy})`}
      />
      {Array.from({ length: 10 }, (_, i) => {
        const a = i * 0.63 + 0.3;
        const rr = 105 + (i % 3) * 12;
        return <Crumb key={i} x={ringCx + Math.cos(a) * rr} y={ringCy + Math.sin(a) * rr} r={9 + (i % 3) * 3} seed={i + 20} rot={i * 33} glow={0.75} opacity={0.9} />;
      })}
      <text x={ringCx} y={ringCy + 24} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={72} fill={C.paper}>
        0:45
      </text>
      {/* sweetness meter */}
      <g transform="translate(1110 760)">
        <text x={0} y={-26} fontFamily={FONT} fontWeight={500} fontSize={38} fill={C.ink300}>
          sweetness
        </text>
        <rect x={0} y={0} width={440} height={26} rx={13} fill={C.ink700} />
        <rect x={0} y={0} width={440 * 0.62} height={26} rx={13} fill={C.amber} />
      </g>
    </Stage>
  );
};

const Starch: React.FC = () => {
  const ch = straightChain(26, -80, 560, { wave: 26, phase: 0.2 });
  const links = ch.links.map((l) => (l.a === 12 ? { ...l, highlight: 1 } : l));
  const r7 = ch.rings[7];
  const l12a = ch.rings[12];
  const l12b = ch.rings[13];
  const lx = (l12a.x + l12b.x) / 2;
  const ly = (l12a.y + l12b.y) / 2;
  return (
    <Stage bg={{ particles: 60 }}>
      <SugarChain rings={ch.rings} links={links} />
      <Label anchor={[r7.x, r7.y - 30]} at={[r7.x - 60, 300]} text="glucose" progress={1} align="end" />
      <Label anchor={[lx, ly + 12]} at={[lx + 60, 820]} text="one link" sub="millions of years to break alone" progress={1} />
      <Hourglass x={lx - 30} y={850} size={90} color={C.amberLight} sand={0.15} />
    </Stage>
  );
};

const Protein: React.FC = () => (
  <Stage bg={{ particles: 30 }}>
    <Enzyme x={960} y={560} scale={1.15} unfold={0.8} still seed={7} />
    <Label anchor={[560, 600]} at={[440, 820]} text="amino acids" sub="linked in a long chain" progress={1} align="end" />
    <Keyword x={960} y={190} text="An enzyme is a folded chain" progress={1} size={64} />
  </Stage>
);

const ActiveSite: React.FC = () => {
  const ex = 1180;
  const ey = 560;
  const s = 1.6;
  const ch = dockedChain(9, ex, ey, s);
  return (
    <Stage bg={{ particles: 40 }}>
      <SugarChain rings={ch.rings} links={ch.links} />
      <Enzyme x={ex} y={ey} scale={s} showSite={1} still />
      <Label anchor={[ex + s * -30, ey - s * 40]} at={[ex - 40, 230]} text="active site" progress={1} align="end" color={C.paper} />
      <Label anchor={[ex + s * -205, ey + 30]} at={[ex - 420, 820]} text="substrate" sub="starch" progress={1} align="end" />
      <Label anchor={[ex + s * 120, ey + s * 120]} at={[ex + 330, 900]} text="amylase" sub="enzyme" progress={1} align="end" color={C.tealLight} />
    </Stage>
  );
};

const Snap: React.FC = () => {
  const ex = 1180;
  const ey = 560;
  const s = 1.6;
  const chain = dockedChain(8, ex, ey, s, { offset: [-70, 40] });
  // remove the two docked rings from the chain (they become maltose)
  const rings = chain.rings.slice(0, 6);
  const links = chain.links.slice(0, 5);
  const mx = ex + s * DOCK.outer[0] - 190;
  const my = ey - 210;
  const maltose = {
    rings: [
      { x: mx, y: my, rot: -14, tone: "sugar" as const, glow: 1, scale: s },
      { x: mx + 80 * s * Math.cos(-0.24), y: my + 80 * s * Math.sin(-0.24), rot: -14, tone: "sugar" as const, glow: 1, scale: s },
    ],
    links: [{ a: 0, b: 1 }],
  };
  const cut = [ex + s * DOCK.cut[0] - 30, ey + 10];
  return (
    <Stage bg={{ particles: 40 }}>
      <SugarChain rings={rings} links={links} />
      <Enzyme x={ex} y={ey} scale={s} still />
      <SugarChain rings={maltose.rings} links={maltose.links} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cut[0] + Math.cos(a) * 30}
            y1={cut[1] + Math.sin(a) * 30}
            x2={cut[0] + Math.cos(a) * 52}
            y2={cut[1] + Math.sin(a) * 52}
            stroke={C.amberLight}
            strokeWidth={5}
            strokeLinecap="round"
          />
        );
      })}
      <Label anchor={[mx + 60, my - 50]} at={[mx - 60, 150]} text="maltose" sub="two glucose units — sweet" progress={1} align="end" color={C.amberLight} />
    </Stage>
  );
};

const Specific: React.FC = () => {
  const ex = 1260;
  const ey = 560;
  const s = 1.5;
  const ch = dockedChain(8, ex, ey, s, { cellulose: true, offset: [-190, -26] });
  return (
    <Stage bg={{ particles: 40 }}>
      <Enzyme x={ex} y={ey} scale={s} still />
      <SugarChain rings={ch.rings} links={ch.links} />
      <Cross x={ex + s * -150} y={ey - 120} size={70} color={C.coral} stroke={9} />
      <PaperSheet x={300} y={300} size={110} color={C.paperDim} />
      <Label anchor={[380, 420]} at={[420, 260]} text="cellulose" sub="also glucose — but linked differently" progress={1} />
    </Stage>
  );
};

const Myth1: React.FC = () => {
  const ex = 1460;
  const ey = 820;
  const ch = dockedChain(5, ex, ey, 0.8);
  return (
    <Stage bg={{ particles: 30 }}>
      <g opacity={0.35}>
        <SugarChain rings={ch.rings} links={ch.links} />
        <Enzyme x={ex} y={ey} scale={0.8} still />
      </g>
      <MythCard x={W / 2} y={430} number={1} before="Enzymes get " word="used up" replacement="reused" enter={1} strike={1} replace={1} />
    </Stage>
  );
};

const Predict: React.FC = () => (
  <Stage bg={{ tone: "heat", lightX: 0.6 }}>
    <Thermometer x={260} y={260} height={520} temperature={70} />
    <Graph
      x={560}
      y={220}
      width={1180}
      height={600}
      xDomain={[0, 70]}
      xTicks={[0, 20, 37, 50, 70]}
      xTickFormat={(v) => `${v}°C`}
      yLabel="rate"
      curves={[
        { f: rateVsTemperature, color: C.teal, revealTo: 37 },
        { f: (t) => 1 + (t - 37) * 0.012, color: C.paper, revealFrom: 37, revealTo: 70, dashed: true },
        { f: (t) => Math.max(0, 1 - (t - 37) * 0.03), color: C.paper, revealFrom: 37, revealTo: 70, dashed: true },
      ]}
      guides={[{ x: 37, label: "optimum", opacity: 1 }]}
      marker={{ x: 37 }}
    />
    <PausePredict visible={1} countdown={0.35} question="Keep heating: faster, or slower?" />
  </Stage>
);

const Denatured: React.FC = () => {
  const ex = 1250;
  const ey = 520;
  const s = 1.45;
  const ch = dockedChain(5, ex, ey, s, { offset: [-150, 190] });
  return (
    <Stage bg={{ tone: "heat", lightX: 0.6 }}>
      <Thermometer x={230} y={260} height={520} temperature={70} />
      <Enzyme x={ex} y={ey} scale={s} denature={1} bonds={1} bondsBroken={0.75} still seed={7} />
      <SugarChain rings={ch.rings} links={ch.links} opacity={0.9} />
      <Cross x={ex - 215} y={ey + 120} size={64} color={C.coral} stroke={9} />
      <Label anchor={[ex - 40, ey - 230]} at={[ex - 180, 170]} text="denatured" sub="active site has lost its shape" progress={1} color={C.coral} align="end" />
    </Stage>
  );
};

const Egg: React.FC = () => (
  <Stage bg={{ tone: "warm" }}>
    <PanEgg x={640} y={540} size={420} cooked={1} />
    <Enzyme x={1340} y={540} scale={1} denature={1} still seed={7} />
    <text x={W / 2} y={940} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={52} fill={C.paper}>
      cooling doesn&apos;t undo it
    </text>
  </Stage>
);

const PH: React.FC = () => {
  const gx = 260;
  const gw = 1400;
  const sx = (v: number) => gx + (v / 14) * gw;
  return (
    <Stage bg={{ particles: 20 }}>
      <defs>
        <linearGradient id="phbar" x1="0" x2="1">
          <stop offset="0" stopColor={C.coral} />
          <stop offset="0.5" stopColor={C.paper} />
          <stop offset="1" stopColor={C.violet} />
        </linearGradient>
      </defs>
      <Graph
        x={gx}
        y={230}
        width={gw}
        height={520}
        xDomain={[0, 14]}
        xTicks={[0, 2, 7, 14]}
        yLabel="rate"
        curves={[
          { f: bell(2, 1.2), color: C.violet, revealTo: 14, fill: true },
          { f: bell(7, 1.2), color: C.teal, revealTo: 14, fill: true },
        ]}
      />
      <rect x={gx} y={835} width={gw} height={18} rx={9} fill="url(#phbar)" opacity={0.9} />
      <text x={gx + gw / 2} y={920} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={36} fill={C.ink300}>
        pH
      </text>
      <text x={sx(2)} y={150} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.violetLight}>
        pepsin
      </text>
      <text x={sx(2)} y={196} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={32} fill={C.ink300}>
        stomach
      </text>
      <text x={sx(7)} y={150} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={44} fill={C.tealLight}>
        amylase
      </text>
      <text x={sx(7)} y={196} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={32} fill={C.ink300}>
        mouth
      </text>
    </Stage>
  );
};

export const TitleArt: React.FC<{ readonly subtitle?: boolean }> = ({ subtitle = true }) => {
  const ch = dockedChain(6, 1080, 470, 0.9);
  return (
    <Stage bg={{ particles: 25, lightY: 0.45 }}>
      <SugarChain rings={ch.rings} links={ch.links} />
      <Enzyme x={1080} y={470} scale={0.9} still />
      <text x={W / 2} y={790} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={112} fill={C.paper} letterSpacing={-3}>
        How Enzymes Actually Work
      </text>
      {subtitle ? (
        <text x={W / 2} y={860} textAnchor="middle" fontFamily={FONT} fontWeight={400} fontSize={40} fill={C.ink300}>
          shape · temperature · pH
        </text>
      ) : null}
    </Stage>
  );
};

const FRAMES: Record<FrameName, React.FC> = {
  hook: Hook,
  starch: Starch,
  protein: Protein,
  activeSite: ActiveSite,
  snap: Snap,
  specific: Specific,
  myth1: Myth1,
  predict: Predict,
  denatured: Denatured,
  egg: Egg,
  ph: PH,
  title: TitleArt,
};

export const StyleFrame: React.FC<{ readonly name: FrameName }> = ({ name }) => {
  const F = FRAMES[name];
  return <F />;
};

/** All style frames on one sheet, with captions — the visual storyboard. */
export const StoryboardSheet: React.FC = () => {
  const cols = 3;
  const tw = 600;
  const th = (tw * H) / W;
  const gap = 40;
  const capH = 76;
  const top = 150;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink950, fontFamily: FONT }}>
      <div style={{ position: "absolute", left: gap, top: 40, color: C.paper, fontSize: 48, fontWeight: 700 }}>
        EP001 · How Enzymes Actually Work — style frames
      </div>
      <div style={{ position: "absolute", left: gap, top: 100, color: C.ink300, fontSize: 26 }}>
        Static key frames from the storyboard. Everything is vector, built from reusable components; motion comes next.
      </div>
      {FRAME_NAMES.map((n, i) => {
        const cx = gap + (i % cols) * (tw + gap);
        const cy = top + Math.floor(i / cols) * (th + capH + gap);
        return (
          <div key={n} style={{ position: "absolute", left: cx, top: cy, width: tw }}>
            <div style={{ width: tw, height: th, overflow: "hidden", borderRadius: 14, position: "relative", outline: `2px solid ${C.ink700}` }}>
              <div style={{ width: W, height: H, transform: `scale(${tw / W})`, transformOrigin: "0 0", position: "absolute" }}>
                <StyleFrame name={n} />
              </div>
            </div>
            <div style={{ color: C.paperDim, fontSize: 24, lineHeight: 1.3, marginTop: 12 }}>{FRAME_CAPTIONS[n]}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
