import type { SceneEntry } from "../../../components/EpisodeFrame";
import { S01Hook } from "./S01Hook";
import { S02Title } from "./S02Title";
import { S03Definition } from "./S03Definition";
import { S04Equation } from "./S04Equation";
import { S05Balanced } from "./S05Balanced";
import { S06Chlorophyll } from "./S06Chlorophyll";
import { S07Uses } from "./S07Uses";
import { S08Minerals } from "./S08Minerals";
import { S09Leaf } from "./S09Leaf";
import { S10Layers } from "./S10Layers";
import { S11StarchTest } from "./S11StarchTest";
import { S12Needs } from "./S12Needs";
import { S13RateMethod } from "./S13RateMethod";
import { S14RateResults } from "./S14RateResults";
import { S15Limiting } from "./S15Limiting";
import { S16Predict } from "./S16Predict";
import { S17Reveal } from "./S17Reveal";
import { S18Resolve } from "./S18Resolve";
import { S19Recap } from "./S19Recap";
import { S20End } from "./S20End";

/** Scene order for EP002. Each id must exist in timeline.json (from script.md headings). */
export const SCENES: readonly SceneEntry[] = [
  { id: "S01", Comp: S01Hook },
  { id: "S02", Comp: S02Title },
  { id: "S03", Comp: S03Definition },
  { id: "S04", Comp: S04Equation },
  { id: "S05", Comp: S05Balanced },
  { id: "S06", Comp: S06Chlorophyll },
  { id: "S07", Comp: S07Uses },
  { id: "S08", Comp: S08Minerals },
  { id: "S09", Comp: S09Leaf },
  { id: "S10", Comp: S10Layers },
  { id: "S11", Comp: S11StarchTest },
  { id: "S12", Comp: S12Needs },
  { id: "S13", Comp: S13RateMethod },
  { id: "S14", Comp: S14RateResults },
  { id: "S15", Comp: S15Limiting },
  { id: "S16", Comp: S16Predict },
  { id: "S17", Comp: S17Reveal },
  { id: "S18", Comp: S18Resolve },
  { id: "S19", Comp: S19Recap },
  { id: "S20", Comp: S20End },
];
