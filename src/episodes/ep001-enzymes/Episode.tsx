import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { C } from "../../brand/tokens";
import { SceneContext } from "../../lib/timeline";
import { SceneShell, TRANSITION } from "../../components/SceneShell";
import { TL, sceneById } from "./timeline";
import { SCENES } from "./scenes";

export type EpisodeProps = {
  /** Audio file in public/. The final mix once `npm run audio` has run, otherwise the bare narration. */
  readonly audio: string;
};

/** The whole episode: every scene placed at the exact time its narration starts. */
export const Episode: React.FC<EpisodeProps> = ({ audio }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink950 }}>
      {SCENES.map((s, i) => {
        const t = sceneById(s.id);
        const pre = i > 0 && s.transition !== "cut" ? TRANSITION : 0;
        const next = SCENES[i + 1];
        const post = next && next.transition !== "cut" ? TRANSITION : 0;
        const total = t.endFrame - t.startFrame + pre + post;
        const Comp = s.Comp;
        return (
          <Sequence key={s.id} name={`${s.id} ${t.slug}`} from={t.startFrame - pre} durationInFrames={total} premountFor={30}>
            <SceneContext.Provider value={{ scene: t, words: TL.words, preroll: pre, fps: TL.fps }}>
              <SceneShell pre={pre} post={post} total={total}>
                <Comp />
              </SceneShell>
            </SceneContext.Provider>
          </Sequence>
        );
      })}
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};

/** One scene on its own, with its slice of the narration — for previewing and checking frames. */
export const ScenePreview: React.FC<{ readonly sceneId: string; readonly audio: string }> = ({ sceneId, audio }) => {
  const t = sceneById(sceneId);
  const s = SCENES.find((x) => x.id === sceneId);
  if (!s) throw new Error(`Scene ${sceneId} not registered`);
  const Comp = s.Comp;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink950 }}>
      <SceneContext.Provider value={{ scene: t, words: TL.words, preroll: 0, fps: TL.fps }}>
        <Comp />
      </SceneContext.Provider>
      <Audio src={staticFile(audio)} trimBefore={t.startFrame} />
    </AbsoluteFill>
  );
};
