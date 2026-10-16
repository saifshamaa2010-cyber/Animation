// EP002 v2 ("Worlds" restyle): the 20 scenes, same narration and timing as v1.
import type { SceneEntry } from "../../../components/EpisodeFrame";
import { V2S01Hook } from "./V2S01Hook";
import { V2S02Title } from "./V2S02Title";
import { V2S03Definition } from "./V2S03Definition";
import { V2S04Equation } from "./V2S04Equation";
import { V2S05Balanced } from "./V2S05Balanced";
import { V2S06Tip } from "./V2S06Tip";
import { V2S07Uses } from "./V2S07Uses";
import { V2S08Minerals } from "./V2S08Minerals";
import { V2S09Leaf } from "./V2S09Leaf";
import { V2S10Stomata } from "./V2S10Stomata";
import { V2S11StarchTest } from "./V2S11StarchTest";
import { V2S12Needs } from "./V2S12Needs";
import { V2S13RateMethod } from "./V2S13RateMethod";
import { V2S14RateResults } from "./V2S14RateResults";
import { V2S15Limiting } from "./V2S15Limiting";
import { V2S16Bench } from "./V2S16Bench";
import { V2S17Reveal } from "./V2S17Reveal";
import { V2S18Resolve } from "./V2S18Resolve";
import { V2S19Recap } from "./V2S19Recap";
import { V2S20End } from "./V2S20End";

export const V2_SCENES: readonly SceneEntry[] = [
  { id: "S01", Comp: V2S01Hook },
  { id: "S02", Comp: V2S02Title },
  { id: "S03", Comp: V2S03Definition },
  { id: "S04", Comp: V2S04Equation },
  { id: "S05", Comp: V2S05Balanced },
  { id: "S06", Comp: V2S06Tip },
  { id: "S07", Comp: V2S07Uses },
  { id: "S08", Comp: V2S08Minerals },
  { id: "S09", Comp: V2S09Leaf },
  { id: "S10", Comp: V2S10Stomata },
  { id: "S11", Comp: V2S11StarchTest },
  { id: "S12", Comp: V2S12Needs },
  { id: "S13", Comp: V2S13RateMethod },
  { id: "S14", Comp: V2S14RateResults },
  { id: "S15", Comp: V2S15Limiting },
  { id: "S16", Comp: V2S16Bench },
  { id: "S17", Comp: V2S17Reveal },
  { id: "S18", Comp: V2S18Resolve },
  { id: "S19", Comp: V2S19Recap },
  { id: "S20", Comp: V2S20End },
];
