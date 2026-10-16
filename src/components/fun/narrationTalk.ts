import { useContext } from "react";
import { useCurrentFrame } from "remotion";
import { SceneContext } from "../../lib/timeline";

/**
 * 0..1 mouth opening that follows the narration: open-and-close while a word of this scene is being
 * spoken, shut in the gaps. Feed it to Chloro's `talk` so the host "says" the voice-over.
 * Returns 0 outside a scene.
 */
export const useNarrationTalk = (seed = 0): number => {
  const ctx = useContext(SceneContext);
  const frame = useCurrentFrame();
  if (!ctx) return 0;
  const f = frame - ctx.preroll;
  const sec = (ctx.scene.startFrame + f) / ctx.fps;
  const w = ctx.words.find((x) => x.scene === ctx.scene.id && sec >= x.startSec - 0.02 && sec <= x.endSec + 0.02);
  if (!w) return 0;
  // syllable-ish flapping, never fully shut mid-word
  return 0.3 + 0.7 * Math.abs(Math.sin((f + seed * 3) * 0.62));
};
