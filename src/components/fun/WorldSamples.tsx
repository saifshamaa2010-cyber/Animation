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

const PARTS: readonly { title: string; bg: readonly [string, string]; ink?: string; accent?: string }[] = [
  { title: "What is photosynthesis?", bg: ["#FFF7E3", "#EFDDB8"], ink: W2.inkText, accent: "#C46A1F" },
  { title: "What plants do with glucose", bg: ["#F7B24E", "#D9662F"], ink: W2.inkText, accent: "#FFFFFF" },
  { title: "Mineral ions", bg: ["#8A6447", "#4A3122"], accent: C.amberLight },
  { title: "Leaf structure", bg: ["#2C6B4A", "#123A2A"] },
  { title: "Testing a leaf for starch", bg: ["#F7E3D3", "#D9C6EE"], ink: W2.inkText, accent: "#8E4FC4" },
  { title: "What photosynthesis needs", bg: ["#1F6F78", "#0E3B44"] },
  { title: "Rate of photosynthesis", bg: ["#24418C", "#14204A"], accent: C.ice },
  { title: "Limiting factors", bg: ["#C2456B", "#6B2346"] },
  { title: "Gas exchange", bg: ["#B07AD8", "#6B3FA0"] },
];

/** Dev check: frame i shows the card of part i + 1 (all nine parts of EP002). */
export const PartCardsAll: React.FC = () => {
  const i = Math.min(8, useCurrentFrame());
  const p = PARTS[i];
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <SectionCard topic="Plant nutrition" part={i + 1} of={9} title={p.title} t={40} dur={200} look={{ bg: p.bg, ink: p.ink, accent: p.accent }} />
    </svg>
  );
};
