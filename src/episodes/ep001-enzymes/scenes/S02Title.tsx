import React from "react";
import { Stage } from "../../../components/Stage";
import { useScene } from "../../../lib/timeline";
import { TitleCard } from "./TitleCard";

/** S02 · Title (a 3-second silence in the narration, filled by music and the title sting). */
export const S02Title: React.FC = () => {
  const { f } = useScene();
  return (
    <Stage bg={{ particles: 26, lightY: 0.45 }}>
      <TitleCard t={f} />
    </Stage>
  );
};
