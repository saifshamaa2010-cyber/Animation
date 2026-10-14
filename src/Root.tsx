import React from "react";
import { Composition, Folder, Still } from "remotion";
import { StoryboardSheet, StyleFrame } from "./episodes/ep001-enzymes/StyleFrames";
import { Thumbnail } from "./episodes/ep001-enzymes/Thumbnail";
import { Episode, ScenePreview } from "./episodes/ep001-enzymes/Episode";
import { TL } from "./episodes/ep001-enzymes/timeline";
import { Episode as Episode2, ScenePreview as ScenePreview2 } from "./episodes/ep002-plant-nutrition/Episode";
import { TL as TL2 } from "./episodes/ep002-plant-nutrition/timeline";
import { PhotosynthesisPreview } from "./previews/PhotosynthesisPreview";
import { BioKitDemo } from "./components/bio/BioKitDemo";

const sceneLen = (id: string, tl = TL) => {
  const s = tl.scenes.find((x) => x.id === id);
  return s ? Math.max(1, s.endFrame - s.startFrame) : 1;
};
const EP2_AUDIO = "episodes/ep002-plant-nutrition/narration.wav";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="ep001-enzymes">
        <Composition
          id="ep001"
          component={Episode}
          durationInFrames={TL.durationFrames}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ audio: "episodes/ep001-enzymes/narration.wav" }}
        />
        <Folder name="ep001-scenes">
          {TL.scenes.map((s) => (
            <Composition
              key={s.id}
              id={`ep001-${s.id}`}
              component={ScenePreview}
              durationInFrames={sceneLen(s.id)}
              fps={30}
              width={1920}
              height={1080}
              defaultProps={{ sceneId: s.id, audio: "episodes/ep001-enzymes/narration.wav" }}
            />
          ))}
        </Folder>
        <Folder name="style-frames">
          <Still id="sf-hook" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "hook" as const }} />
          <Still id="sf-starch" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "starch" as const }} />
          <Still id="sf-protein" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "protein" as const }} />
          <Still id="sf-activeSite" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "activeSite" as const }} />
          <Still id="sf-snap" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "snap" as const }} />
          <Still id="sf-specific" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "specific" as const }} />
          <Still id="sf-myth1" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "myth1" as const }} />
          <Still id="sf-predict" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "predict" as const }} />
          <Still id="sf-denatured" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "denatured" as const }} />
          <Still id="sf-egg" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "egg" as const }} />
          <Still id="sf-ph" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "ph" as const }} />
          <Still id="sf-title" component={StyleFrame} width={1920} height={1080} defaultProps={{ name: "title" as const }} />
        </Folder>
        <Still id="ep001-storyboard" component={StoryboardSheet} width={1960} height={1990} />
        <Still id="ep001-thumbnail" component={Thumbnail} width={1280} height={720} />
      </Folder>
      <Folder name="ep002-plant-nutrition">
        <Composition id="ep002" component={Episode2} durationInFrames={TL2.durationFrames} fps={30} width={1920} height={1080} defaultProps={{ audio: EP2_AUDIO, captions: false }} />
        <Composition id="ep002-preview" component={Episode2} durationInFrames={TL2.durationFrames} fps={30} width={1920} height={1080} defaultProps={{ audio: EP2_AUDIO, captions: true }} />
        <Folder name="ep002-scenes">
          {TL2.scenes.map((s) => (
            <Composition
              key={s.id}
              id={`ep002-${s.id}`}
              component={ScenePreview2}
              durationInFrames={sceneLen(s.id, TL2)}
              fps={30}
              width={1920}
              height={1080}
              defaultProps={{ sceneId: s.id, audio: EP2_AUDIO, captions: true }}
            />
          ))}
        </Folder>
      </Folder>
      <Composition id="preview-photosynthesis" component={PhotosynthesisPreview} durationInFrames={300} fps={30} width={1920} height={1080} />
      <Composition id="bio-kit-demo" component={BioKitDemo} durationInFrames={150} fps={30} width={1920} height={1080} />
    </>
  );
};
