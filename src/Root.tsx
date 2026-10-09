import React from "react";
import { Folder, Still } from "remotion";
import { StoryboardSheet, StyleFrame } from "./episodes/ep001-enzymes/StyleFrames";
import { Thumbnail } from "./episodes/ep001-enzymes/Thumbnail";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="ep001-enzymes">
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
    </>
  );
};
