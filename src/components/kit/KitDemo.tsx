import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, H, W } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { Stage } from "../Stage";
import { Enzyme } from "../Enzyme";
import { SugarChain, straightChain } from "../SugarChain";
import { dockedChain } from "../dock";
import {
  Bubble,
  CellOutline,
  Counter,
  DepthMolecules,
  FocusPull,
  H2O2,
  HandArrow,
  HandBracket,
  HandCircle,
  HandCross,
  HandTick,
  HandUnderline,
  Hourglass,
  KeyIcon,
  LockIcon,
  Oxygen,
  PHScale,
  ScaleBar,
  Stopwatch,
  StrikeThrough,
  Water,
  WordEquation,
  circleAround,
  textBox,
  textWidth,
} from ".";

/** Dev caption (QA sheet only — never used in an episode). */
const Cap: React.FC<{ x: number; y: number; t: string; anchor?: "start" | "middle" | "end" }> = ({ x, y, t, anchor = "middle" }) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={500} fontSize={24} fill={C.ink400} letterSpacing={1}>
    {t.toUpperCase()}
  </text>
);

const Word: React.FC<{ x: number; y: number; t: string; size?: number; color?: string; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  t,
  size = 64,
  color = C.paper,
  anchor = "start",
}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={600} fontSize={size} fill={color}>
    {t}
  </text>
);

// ---------------------------------------------------------------------------

const Annotations: React.FC = () => {
  const s = 76;
  const x0 = 170;
  const by = 250;
  const pre = "Enzymes get ";
  const wrong = textBox("used up", x0 + textWidth(pre, s), by, s);
  const glu = textBox("glucose", 1330, by, s, 600, "middle");
  const site = textBox("active site", 1010, 520, 56, 600, "start");
  const chain = straightChain(2, 360, 840, { tone: "sugar" });
  return (
    <Stage>
      <Cap x={x0} y={80} t="StrikeThrough (passes 2) + HandArrow" anchor="start" />
      <Word x={x0} y={by} t={`${pre}used up`} size={s} />
      <StrikeThrough x1={wrong.x0} x2={wrong.x1} y={wrong.strikeY} progress={1} passes={2} seed={4} />
      <Word x={wrong.cx} y={by - 108} t="reused" size={56} color={C.teal} anchor="middle" />
      <HandArrow from={[wrong.x1 + 40, by - 150]} to={[wrong.x1 - 6, wrong.top - 4]} bend={-0.4} progress={1} color={C.teal} width={6} seed={9} head={22} />

      <Cap x={glu.cx} y={120} t="HandCircle" />
      <Word x={glu.cx} y={by} t="glucose" size={s} color={C.amber} anchor="middle" />
      <HandCircle {...circleAround(glu, 34, 20)} progress={1} color={C.amber} seed={2} />

      <Cap x={330} y={400} t="HandArrow + HandUnderline (double)" anchor="start" />
      <Enzyme x={720} y={560} scale={0.62} still showSite={0.9} />
      <HandArrow from={[site.x0 - 20, 520 - 18]} to={[720 - 0.62 * 60, 560 - 18]} bend={0.3} progress={1} width={7} seed={3} />
      <Word x={site.x0} y={520} t="active site" size={56} />
      <HandUnderline x1={site.x0} x2={site.x1} y={540} progress={1} double seed={5} />

      <Cap x={1560} y={400} t="HandCross · HandTick" />
      <HandCross cx={1470} cy={520} size={92} progress={1} seed={1} />
      <HandTick cx={1660} cy={520} size={104} progress={1} seed={1} />

      <Cap x={330} y={720} t="HandBracket curly / square" anchor="start" />
      <SugarChain {...chain} />
      <HandBracket from={[300, 900]} to={[500, 900]} depth={40} side={-1} progress={1} color={C.amber} seed={6} />
      <Word x={400} y={1000} t="maltose" size={48} color={C.amber} anchor="middle" />
      <HandBracket from={[760, 780]} to={[760, 960]} depth={34} side={-1} variant="square" progress={1} seed={8} />
      <Word x={800} y={885} t="2 units" size={44} />

      <Cap x={1340} y={720} t="Draw-on: 0.35 · 0.7 · 1" />
      {[0.35, 0.7, 1].map((p, i) => (
        <g key={i}>
          <HandCircle cx={1120 + i * 230} cy={850} rx={80} ry={56} progress={p} seed={12} color={C.paper} />
        </g>
      ))}
    </Stage>
  );
};

// ---------------------------------------------------------------------------

const Props: React.FC = () => (
  <Stage>
    <Cap x={300} y={120} t="Stopwatch" />
    <Stopwatch x={300} y={340} size={320} seconds={45} readout />
    <Cap x={700} y={120} t="Hourglass" />
    <Hourglass x={700} y={350} size={340} sand={0.4} />

    <Cap x={1380} y={120} t="Counter (odometer)" />
    <Counter x={1300} y={215} value={1000000} size={84} suffix="years" />
    <Counter x={1300} y={340} value={47289.4} size={84} speed={900} suffix="per second" />

    <Cap x={1380} y={450} t="ScaleBar (mid-roll · settled)" />
    <ScaleBar x={1180} y={590} length={260} labels={["1 mm", "1 µm", "1 nm"]} step={0.45} progress={1} />
    <ScaleBar x={1560} y={590} length={140} labels={["1 mm", "1 µm", "1 nm"]} step={2} progress={1} />

    <Cap x={960} y={680} t="WordEquation" />
    <WordEquation x={960} y={760} left="starch" over="amylase" right="maltose" progress={1} />

    <PHScale x={360} y={940} width={1200} height={22} progress={1} marker={7} markerLabel="amylase" markerColor={C.teal} />
  </Stage>
);

// ---------------------------------------------------------------------------

const Molecules: React.FC = () => {
  const ex = 560;
  const ey = 800;
  const es = 0.7;
  const docked = dockedChain(4, ex, ey, es, { tone: "starch" });
  return (
    <Stage>
      {/* Background layer, rack-focused out. */}
      <FocusPull blur={9}>
        <Enzyme x={1640} y={300} scale={0.55} palette="violet" still opacity={0.7} />
      </FocusPull>

      <Cap x={380} y={110} t="CellOutline" />
      <CellOutline cx={380} cy={350} rx={250} ry={200} progress={1} seed={3} />
      <Enzyme x={340} y={340} scale={0.32} still />
      <Water x={500} y={420} still scale={0.8} />
      <Water x={250} y={450} still scale={0.8} rotate={40} />

      <Cap x={1060} y={110} t="H2O2 · H2O · O2 · Bubble" />
      <H2O2 x={850} y={250} label still />
      <Water x={1060} y={250} label still />
      <Oxygen x={1260} y={250} label still />
      <Bubble x={1000} y={480} r={56} seed={1} />
      <Bubble x={1110} y={430} r={30} seed={2} />
      <Bubble x={1170} y={520} r={20} seed={3} />
      <Bubble x={1270} y={470} r={40} seed={4} pop={0.35} />

      <Cap x={560} y={620} t="Enzyme pocket = keyhole = key bit" />
      <SugarChain {...docked} />
      <Enzyme x={ex} y={ey} scale={es} still />

      <KeyIcon x={1080} y={820} size={330} />
      <LockIcon x={1440} y={810} size={220} />
      <KeyIcon x={1720} y={660} size={200} variant="line" progress={1} />
      <LockIcon x={1730} y={880} size={130} variant="line" progress={1} />

      <DepthMolecules count={6} seed={4} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------

const DrawOn: React.FC = () => {
  const ps = [0.2, 0.45, 0.7, 1];
  const colX = (i: number) => 330 + i * 400;
  return (
    <Stage>
      {ps.map((p, i) => (
        <Cap key={i} x={colX(i)} y={110} t={`progress ${p}`} />
      ))}
      {ps.map((p, i) => (
        <g key={i}>
          <HandArrow from={[colX(i) - 140, 230]} to={[colX(i) + 130, 170]} bend={0.25} progress={p} seed={7} />
          <StrikeThrough x1={colX(i) - 130} x2={colX(i) + 130} y={300} passes={3} progress={p} seed={2} />
          <HandTick cx={colX(i) - 70} cy={410} size={90} progress={p} />
          <HandCross cx={colX(i) + 80} cy={410} size={80} progress={p} />
          <WordEquation x={colX(i)} y={540} left="H2O2" over="catalase" right="O2" size={48} progress={p} overColor={C.violet} leftColor={C.coral} rightColor={C.paper} arrowLength={190} />
          <CellOutline cx={colX(i)} cy={700} rx={150} ry={80} progress={p} />
          <Counter x={colX(i)} y={860} value={interpolate(p, [0, 1], [0, 1000])} size={64} />
          <PHScale x={colX(i) - 150} y={970} width={300} height={16} progress={p} numbers="key" />
        </g>
      ))}
    </Stage>
  );
};

// ---------------------------------------------------------------------------

/** 2× close-ups, to catch clumsy details (arrowheads, joins, thin lines). */
const Zoom: React.FC = () => {
  const cells: { cx: number; cy: number; el: React.ReactNode }[] = [
    { cx: 300, cy: 300, el: <Stopwatch x={300} y={300} size={320} seconds={45} readout /> },
    { cx: 300, cy: 300, el: <Hourglass x={300} y={300} size={340} sand={0.4} /> },
    {
      cx: 300,
      cy: 300,
      el: (
        <>
          <HandArrow from={[150, 380]} to={[420, 240]} bend={0.3} progress={1} seed={3} />
          <HandTick cx={200} cy={220} size={100} progress={1} />
        </>
      ),
    },
    {
      cx: 300,
      cy: 300,
      el: (
        <>
          <Word x={300} y={330} t="glucose" size={64} color={C.amber} anchor="middle" />
          <HandCircle {...circleAround(textBox("glucose", 300, 330, 64, 600, "middle"), 30, 18)} progress={1} color={C.amber} seed={2} />
        </>
      ),
    },
    { cx: 300, cy: 300, el: <KeyIcon x={300} y={300} size={300} /> },
    { cx: 300, cy: 300, el: <LockIcon x={300} y={310} size={200} /> },
  ];
  return (
    <Stage>
      {cells.map((c, i) => {
        const ox = (i % 3) * 640;
        const oy = Math.floor(i / 3) * 540;
        return (
          <g key={i}>
            <clipPath id={`zoomclip${i}`}>
              <rect x={ox + 6} y={oy + 6} width={628} height={528} rx={18} />
            </clipPath>
            <g clipPath={`url(#zoomclip${i})`}>
              <g transform={`translate(${ox + 320} ${oy + 270}) scale(2) translate(${-c.cx} ${-c.cy})`}>{c.el}</g>
            </g>
            <rect x={ox + 6} y={oy + 6} width={628} height={528} rx={18} fill="none" stroke={C.ink600} strokeWidth={2} />
          </g>
        );
      })}
    </Stage>
  );
};

export type KitDemoPage = "overview" | "annotations" | "props" | "molecules" | "drawon" | "zoom";

const PAGES: Record<Exclude<KitDemoPage, "overview">, React.FC> = {
  annotations: Annotations,
  props: Props,
  molecules: Molecules,
  drawon: DrawOn,
  zoom: Zoom,
};

/** QA sheet for the kit: every component at real 1080p scale (or all four pages at half size). */
export const KitDemo: React.FC<{ readonly page?: KitDemoPage }> = ({ page = "overview" }) => {
  if (page !== "overview") {
    const P = PAGES[page];
    return <P />;
  }
  const order: (keyof typeof PAGES)[] = ["annotations", "props", "molecules", "drawon"];
  return (
    <AbsoluteFill style={{ background: C.ink950 }}>
      {order.map((k, i) => {
        const P = PAGES[k];
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: (i % 2) * (W / 2),
              top: Math.floor(i / 2) * (H / 2),
              width: W,
              height: H,
              transform: "scale(0.5)",
              transformOrigin: "0 0",
              overflow: "hidden",
            }}
          >
            <P />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** A short animated check: marks drawing on with real timing (for scrubbing in the studio). */
export const KitMotion: React.FC = () => {
  const frame = useCurrentFrame();
  const p = (start: number, dur: number) => interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = 76;
  const wrong = textBox("used up", 400 + textWidth("Enzymes get ", s), 300, s);
  return (
    <Stage>
      <Word x={400} y={300} t="Enzymes get used up" size={s} />
      <StrikeThrough x1={wrong.x0} x2={wrong.x1} y={wrong.strikeY} progress={p(10, 22)} passes={2} seed={4} />
      <HandCircle cx={700} cy={620} rx={150} ry={90} progress={p(30, 24)} seed={2} color={C.amber} />
      <HandArrow from={[1000, 700]} to={[1400, 560]} bend={0.3} progress={p(50, 26)} seed={3} />
      <HandTick cx={1500} cy={800} size={110} progress={p(70, 14)} />
      <Stopwatch x={1550} y={300} size={260} seconds={frame / 30 * 4} />
      <Hourglass x={300} y={760} size={300} sand={p(0, 150)} />
      <Counter x={960} y={900} value={interpolate(frame, [80, 140], [0, 1000000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} speed={frame > 80 && frame < 140 ? 1000000 / 60 : 0} suffix="per second" />
      <HandUnderline x1={500} x2={900} y={420} progress={p(100, 16)} boil={0.3} />
    </Stage>
  );
};
