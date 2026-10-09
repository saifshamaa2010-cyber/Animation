import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import { cueFns, type SceneTiming, type Word } from "./cues";

export * from "./cues";

type SceneCtx = { readonly scene: SceneTiming; readonly words: readonly Word[]; readonly preroll: number; readonly fps: number };

export const SceneContext = createContext<SceneCtx | null>(null);

/**
 * Scene clock + cue lookup. Inside a scene:
 *   const { f, cue, word, dur } = useScene();
 *   f            — frames since the scene started (negative during the transition in)
 */
export const useScene = () => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene() must be used inside a scene");
  const f = useCurrentFrame() - ctx.preroll;
  return { f, ...cueFns(ctx.scene, ctx.words, ctx.fps) };
};
