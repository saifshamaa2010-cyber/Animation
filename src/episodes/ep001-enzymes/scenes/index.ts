import type React from "react";
import { Placeholder } from "./Placeholder";
import { S04Enzyme } from "./S04Enzyme";
import { S05ActiveSite } from "./S05ActiveSite";

export type SceneEntry = {
  readonly id: string;
  readonly Comp: React.FC;
  /** How this scene arrives: soft focus pull (default) or a hard cut (for match cuts). */
  readonly transition?: "focus" | "cut";
};

/** Scene order for EP001. Each id must exist in timeline.json (from script.md headings). */
export const SCENES: readonly SceneEntry[] = [
  { id: "S01", Comp: Placeholder },
  { id: "S02", Comp: Placeholder },
  { id: "S03", Comp: Placeholder },
  { id: "S04", Comp: S04Enzyme },
  { id: "S05", Comp: S05ActiveSite },
  { id: "S06", Comp: Placeholder },
  { id: "S07", Comp: Placeholder },
  { id: "S08", Comp: Placeholder },
  { id: "S09", Comp: Placeholder },
  { id: "S10", Comp: Placeholder },
  { id: "S11", Comp: Placeholder },
  { id: "S12", Comp: Placeholder },
  { id: "S13", Comp: Placeholder },
  { id: "S14", Comp: Placeholder },
];
