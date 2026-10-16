import React from "react";
import { EpisodeFrame, EpisodeFrameProps, ScenePreviewFrame } from "../../../components/EpisodeFrame";
import { TL } from "../timeline";
import { V2_SCENES } from ".";

/** EP002 v2: the whole episode in the "Worlds" style. */
export const EpisodeV2: React.FC<EpisodeFrameProps> = (p) => <EpisodeFrame tl={TL} scenes={V2_SCENES} {...p} />;

export const ScenePreviewV2: React.FC<{ readonly sceneId: string; readonly audio: string; readonly audit?: boolean; readonly captions?: boolean }> = (p) => (
  <ScenePreviewFrame tl={TL} scenes={V2_SCENES} {...p} />
);
