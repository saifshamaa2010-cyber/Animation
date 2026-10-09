import React from "react";
import { Composition, Folder, Still } from "remotion";
import { KitDemo, KitMotion } from "./KitDemo";

/** Stand-alone root for the kit's QA sheet (kept out of the main Root on purpose). */
export const RemotionRoot: React.FC = () => (
  <Folder name="kit">
    <Still id="kit-demo" component={KitDemo} width={1920} height={1080} defaultProps={{ page: "overview" as const }} />
    <Still id="kit-demo-annotations" component={KitDemo} width={1920} height={1080} defaultProps={{ page: "annotations" as const }} />
    <Still id="kit-demo-props" component={KitDemo} width={1920} height={1080} defaultProps={{ page: "props" as const }} />
    <Still id="kit-demo-molecules" component={KitDemo} width={1920} height={1080} defaultProps={{ page: "molecules" as const }} />
    <Still id="kit-demo-drawon" component={KitDemo} width={1920} height={1080} defaultProps={{ page: "drawon" as const }} />
    <Still id="kit-demo-zoom" component={KitDemo} width={1920} height={1080} defaultProps={{ page: "zoom" as const }} />
    <Composition id="kit-motion" component={KitMotion} width={1920} height={1080} fps={30} durationInFrames={160} />
  </Folder>
);
