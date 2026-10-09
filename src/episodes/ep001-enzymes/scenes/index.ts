import type React from "react";
import { S08Temperature } from "./S08Temperature";
import { S09Predict } from "./S09Predict";
import { S10Denature } from "./S10Denature";
import { S01Hook } from "./S01Hook";
import { S02Title } from "./S02Title";
import { S03Starch } from "./S03Starch";
import { S04Enzyme } from "./S04Enzyme";
import { S05ActiveSite } from "./S05ActiveSite";
import { S13Resolve } from "./S13Resolve";
import { S14End } from "./S14End";
import { S06InducedFit } from "./S06InducedFit";
import { S07MythUsedUp } from "./S07MythUsedUp";
import { S11MythKilled } from "./S11MythKilled";
import { S12Ph } from "./S12Ph";

export type SceneEntry = {
  readonly id: string;
  readonly Comp: React.FC;
  /** How this scene arrives: soft focus pull (default) or a hard cut (for match cuts). */
  readonly transition?: "focus" | "cut";
};

/** Scene order for EP001. Each id must exist in timeline.json (from script.md headings). */
export const SCENES: readonly SceneEntry[] = [
  { id: "S01", Comp: S01Hook },
  { id: "S02", Comp: S02Title },
  { id: "S03", Comp: S03Starch },
  { id: "S04", Comp: S04Enzyme },
  { id: "S05", Comp: S05ActiveSite },
  { id: "S06", Comp: S06InducedFit },
  { id: "S07", Comp: S07MythUsedUp },
  { id: "S08", Comp: S08Temperature },
  { id: "S09", Comp: S09Predict, transition: "cut" },
  { id: "S10", Comp: S10Denature, transition: "cut" },
  { id: "S11", Comp: S11MythKilled },
  { id: "S12", Comp: S12Ph },
  { id: "S13", Comp: S13Resolve },
  { id: "S14", Comp: S14End, transition: "cut" },
];
