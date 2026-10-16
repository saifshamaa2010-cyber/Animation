import React from "react";
import { C, W2 } from "../../brand/tokens";
import { FONT, HAND } from "../../brand/fonts";
import { Chloro, ChloroMood, ChloroPose } from "./Chloro";
import { CO2Buddy, O2Buddy, QuestionBuddy } from "./Buddies";
import { HandText, NeonSign, Sparkle, SpeechBubble, StickyNote } from "./Paper";
import { WorldStage } from "./Worlds";

/** Visual check of the worlds kit: Chloro's moods and poses, the characters and the paper props. */
export const FunKitSheet: React.FC = () => {
  const moods: [ChloroMood, ChloroPose][] = [
    ["happy", "rest"],
    ["explain", "point"],
    ["thinking", "chin"],
    ["shocked", "rest"],
    ["celebrate", "cheer"],
    ["worried", "hold"],
  ];
  return (
    <WorldStage world="desk">
      {moods.map(([m, p], i) => (
        <g key={m}>
          <Chloro x={170 + i * 270} y={420} size={250} mood={m} pose={p} cap={i === 1} glasses={i === 2} seed={i + 1} talk={i === 1 ? 0.6 : 0} />
          <text x={170 + i * 270} y={480} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill={C.paper}>
            {m}
          </text>
        </g>
      ))}
      <CO2Buddy x={180} y={640} scale={1.4} mood="happy" />
      <CO2Buddy x={420} y={640} scale={1.4} mood="excited" seed={3} />
      <O2Buddy x={620} y={640} scale={1.4} mood="happy" />
      <QuestionBuddy x={780} y={650} size={100} />
      <StickyNote x={880} y={560} w={420} h={330} progress={1}>
        <text x={40} y={80} fontFamily={FONT} fontWeight={700} fontSize={44} fill={W2.inkText}>
          EXAM TIP
        </text>
        <HandText x={40} y={180} text="transfers energy" size={76} />
        <HandText x={40} y={268} text="makes energy" size={64} color={C.coralDeep} strike={1} />
      </StickyNote>
      <SpeechBubble x={1370} y={560} w={430} h={150} tail={[1420, 760]} progress={1}>
        <text textAnchor="middle" y={16} fontFamily={FONT} fontWeight={700} fontSize={46} fill={W2.inkText}>
          Energy is passed on!
        </text>
      </SpeechBubble>
      <NeonSign x={1590} y={900} text="OPEN" on={1} size={80} />
      <Sparkle x={1360} y={900} r={22} />
      <Sparkle x={1310} y={960} r={14} seed={4} />
      <text x={1360} y={1010} fontFamily={HAND} fontWeight={700} fontSize={56} fill={C.amberLight}>
        handwriting
      </text>
    </WorldStage>
  );
};
