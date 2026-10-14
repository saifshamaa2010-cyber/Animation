import React from "react";
import { EpisodeFrame, EpisodeFrameProps, ScenePreviewFrame } from "../../components/EpisodeFrame";
import { TL } from "./timeline";
import { SCENES } from "./scenes";

export const Episode: React.FC<EpisodeFrameProps> = (p) => <EpisodeFrame tl={TL} scenes={SCENES} {...p} />;

export const ScenePreview: React.FC<{ readonly sceneId: string; readonly audio: string; readonly audit?: boolean; readonly captions?: boolean }> = (p) => (
  <ScenePreviewFrame tl={TL} scenes={SCENES} {...p} />
);
