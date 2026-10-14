import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../brand/tokens";
import { Stage } from "../Stage";
import { Label } from "../Label";
import { Leaf, leafGeometry } from "./Leaf";
import { LeafSection, leafSectionAnchors } from "./LeafSection";
import { Plant, Pot, Roots, SoilBlock, Willow } from "./Plant";
import { AminoChain, Bee, Flower, Ion, Pondweed, Sucrose, pondweedTip } from "./Organisms";
import { Beaker, Bottle, Bunsen, ConicalFlask, Dropper, FoilWrap, GasSyringe, Lamp, Rack, Ruler, Scale, SodaLime, Tile, Tube, WaterBath, rackSlots } from "../lab/Lab";
import { Equation } from "../Equation";
import { ExamTip } from "../ExamTip";
import { Lens } from "../Lens";
import { SunIcon } from "../Light";
import { Bubble } from "../kit";

/** QA sheet for the plant & lab components: one page per 30 frames. Not used in any episode. */
export const BioKitDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const page = Math.floor(frame / 30);
  const L = (cx: number, cy: number, len = 340) => leafGeometry({ cx, cy, len, wid: len * 0.48, ang: -10 });
  if (page === 0)
    return (
      <Stage>
        <Leaf geo={L(330, 300)} />
        <Leaf geo={L(960, 300)} margin={{ tone: "white", depth: 0.4 }} />
        <Leaf geo={L(1590, 300)} tone="blueBlack" margin={{ tone: "orange", depth: 0.4 }} />
        <Leaf geo={L(330, 760)} cover={{ u0: 0.35, u1: 0.6, p: 1 }} />
        <Leaf geo={L(960, 760)} tone="blueBlack" band={{ u0: 0.35, u1: 0.6, tone: "orange" }} />
        <Leaf geo={L(1590, 760)} interveinal={1} />
      </Stage>
    );
  if (page === 1) {
    const a = leafSectionAnchors(160, 300, 1600);
    return (
      <Stage>
        <LeafSection x={160} y={300} w={1600} stomataOpen={0.8} chloroGlow={0.3} />
        {Object.entries(a)
          .filter(([, v]) => !Array.isArray(v[0]))
          .map(([k, v]) => (
            <g key={k}>
              <circle cx={(v as [number, number])[0]} cy={(v as [number, number])[1]} r={8} fill={C.coral} />
              <text x={(v as [number, number])[0] + 10} y={(v as [number, number])[1] - 10} fontSize={22} fill={C.paper}>
                {k}
              </text>
            </g>
          ))}
      </Stage>
    );
  }
  if (page === 2)
    return (
      <Stage>
        <Willow x={260} y={620} growth={0.15} />
        <Pot x={260} y={612} w={220} h={180} />
        <Willow x={700} y={620} growth={1} />
        <Pot x={700} y={612} w={260} h={210} />
        <Scale x={700} y={830} reading="76.7 kg" />
        <SoilBlock x={1040} y={600} w={760} h={360} />
        <Plant x={1420} y={600} height={440} leafTone={(i) => (i < 2 ? "yellow" : "green")} leafInterveinal={(i) => (i === 3 ? 1 : 0)} />
        <Roots x={1420} y={600} depth={300} />
        <Ion x={1180} y={760} text="NO3^-" color={C.ice} />
        <Ion x={1660} y={860} text="Mg^2+" color={C.leafLight} />
      </Stage>
    );
  if (page === 3) {
    const slots = rackSlots(1460, 120, 3);
    return (
      <Stage>
        <Rack x={1460} y={120} n={3} />
        {slots.map(([sx, sy], i) => (
          <Tube key={i} x={sx} y={sy} liquid={0.75} liquidColor={[C.indPurple, C.indYellow, C.indRed][i]} bung />
        ))}
        <FoilWrap x={slots[1][0]} y={slots[1][1] + 30} w={74} h={280} />
        <Beaker x={260} y={520} w={260} h={320} liquid={0.85}>
          <Pondweed x={250} y={500} len={230} />
          <Bubble x={pondweedTip(250, 500, 230)[0]} y={pondweedTip(250, 500, 230)[1] - 40} r={10} />
        </Beaker>
        <ConicalFlask x={620} y={520} w={240} h={300}>
          <SodaLime x={620} y={510} w={120} />
        </ConicalFlask>
        <Bunsen x={900} y={520} flame={1} />
        <Bunsen x={1050} y={520} flame={0} />
        <WaterBath x={330} y={1000} w={460} h={230}>
          <Tube x={330} y={720} w={60} h={260} liquid={0.6} liquidColor={C.glass} />
        </WaterBath>
        <Tile x={860} y={860} w={400} h={260} />
        <Leaf geo={leafGeometry({ cx: 860, cy: 860, len: 260, wid: 130, ang: -8 })} tone="decolourised" showStalk={false} />
        <Dropper x={960} y={720} drop={0.7} />
        <Bottle x={1200} y={1000} label="ethanol" flammable />
        <Lamp x={1440} y={720} on={1} angle={0} beam={360} />
        <GasSyringe x={1300} y={560} length={400} plunger={0.4} />
        <Ruler x={1460} y={980} length={360} />
      </Stage>
    );
  }
  const a = leafSectionAnchors(1100, 330, 1400);
  return (
    <Stage>
      <Equation x={960} y={170} terms={[{ text: "carbon dioxide", color: C.ice, p: 1 }, { text: "+", color: C.ink300, p: 1 }, { text: "water", color: C.ice, p: 1 }, { arrow: true, p: 1, over: "light", under: "chlorophyll" }, { text: "glucose", color: C.amber, p: 1, emphasis: 1 }, { text: "+", color: C.ink300, p: 1 }, { text: "oxygen", color: C.coral, p: 1 }]} />
      <Equation x={960} y={360} terms={[{ text: "6CO2", color: C.ice, p: 1 }, { text: "+", color: C.ink300, p: 1 }, { text: "6H2O", color: C.ice, p: 1 }, { arrow: true, p: 1, length: 160 }, { text: "C6H12O6", color: C.amber, p: 1 }, { text: "+", color: C.ink300, p: 1 }, { text: "6O2", color: C.coral, p: 1 }]} />
      <ExamTip x={420} y={590} text="transfers energy" not="makes energy" progress={1} />
      <Sucrose x={900} y={560} />
      <AminoChain x={1150} y={560} n={7} />
      <Flower x={300} y={880} nectar={1} />
      <Bee x={470} y={820} />
      <SunIcon x={700} y={880} />
      <Lens cx={1400} cy={830} r={190} from={[900, 900]} open={1} cone={1}>
        <LeafSection x={1100} y={700} w={600} />
      </Lens>
      <Label anchor={a.palisade} at={[a.palisade[0] - 60, 260]} text="label" progress={0} />
    </Stage>
  );
};
