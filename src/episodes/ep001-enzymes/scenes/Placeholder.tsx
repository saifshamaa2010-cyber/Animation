import React from "react";
import { C, W } from "../../../brand/tokens";
import { FONT } from "../../../brand/fonts";
import { Stage } from "../../../components/Stage";
import { useScene } from "../../../lib/timeline";

/** Stand-in for scenes not yet animated: shows the scene name and the words being spoken. */
export const Placeholder: React.FC = () => {
  const { f, scene, fps } = useScene();
  const t = (scene.startFrame + f) / fps;
  return (
    <Stage>
      <text x={W / 2} y={420} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={72} fill={C.ink400}>
        {scene.id} · {scene.slug}
      </text>
      <text x={W / 2} y={560} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={44} fill={C.paper}>
        {Object.entries(scene.cues)
          .filter(([, c]) => c.sec <= t)
          .map(([k]) => k)
          .slice(-1)[0] ?? ""}
      </text>
    </Stage>
  );
};
