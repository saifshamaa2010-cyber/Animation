import React from "react";
import { Stage } from "../../../components/Stage";
import { useScene } from "../../../lib/timeline";
import { prog } from "../../../lib/motion";
import { EASE } from "../../../brand/tokens";
import { TitleCard } from "./TitleCard";

/** S02 · Title (a 3-second silence in the narration, filled by music and the title sting). */
export const S02Title: React.FC = () => {
  const { f, dur } = useScene();
  // The words clear before the next scene focuses in, so the title never double-exposes the cracker.
  const out = 1 - prog(f, dur - 14, 10, EASE.in);
  return (
    <Stage bg={{ particles: 26, lightY: 0.45 }}>
      <TitleCard t={f} opacity={out} />
    </Stage>
  );
};
