import React from "react";
import { useCurrentFrame } from "remotion";
import { C, W2 } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { SectionCard } from "./SectionCard";
import { WorldKind, WorldStage } from "./Worlds";

/** Dev check: one world with its name (composition per world). */
export const WorldSample: React.FC<{ readonly world: WorldKind }> = ({ world }) => {
  const light = world === "bench" || world === "notebook" || world === "journal" || world === "soil";
  return (
    <WorldStage world={world}>
      <text x={960} y={560} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={110} fill={light ? W2.inkText : C.paper} opacity={0.85}>
        {world}
      </text>
    </WorldStage>
  );
};

/** Dev check: the part card. */
export const PartCardSample: React.FC = () => {
  const t = useCurrentFrame();
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <SectionCard topic="Plant nutrition" part={4} of={9} title="Leaf structure" t={t} dur={200} look={{ bg: ["#2C6B4A", "#123A2A"], accent: C.amberLight }} chloro />
    </svg>
  );
};
