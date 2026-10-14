import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { C } from "../brand/tokens";
import { FONT } from "../brand/fonts";
import { SceneContext, type Timeline, type Word } from "../lib/timeline";
import { TextAudit } from "../lib/TextAudit";
import { SceneShell, TRANSITION } from "./SceneShell";

export type SceneEntry = {
  readonly id: string;
  readonly Comp: React.FC;
  /** How this scene arrives: soft focus pull (default) or a hard cut (for match cuts). */
  readonly transition?: "focus" | "cut";
};

export type EpisodeFrameProps = {
  /** Audio file in public/. The final mix once `npm run audio` has run, otherwise the bare narration. */
  readonly audio: string;
  /** QA only: log every visible text's on-screen size and box (see scripts/text-audit.ts). */
  readonly audit?: boolean;
  /** Burn read-along captions in (preview cuts made before the narrator has recorded). */
  readonly captions?: boolean;
};

const sceneOf = (tl: Timeline, id: string) => {
  const s = tl.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`No scene ${id} in timeline`);
  return s;
};

/** The whole episode: every scene placed at the exact frame its narration starts. */
export const EpisodeFrame: React.FC<EpisodeFrameProps & { readonly tl: Timeline; readonly scenes: readonly SceneEntry[] }> = ({
  tl,
  scenes,
  audio,
  audit,
  captions,
}) => (
  <AbsoluteFill style={{ backgroundColor: C.ink950 }}>
    {scenes.map((s, i) => {
      const t = sceneOf(tl, s.id);
      const pre = i > 0 && s.transition !== "cut" ? TRANSITION : 0;
      const next = scenes[i + 1];
      const post = next && next.transition !== "cut" ? TRANSITION : 0;
      const total = t.endFrame - t.startFrame + pre + post;
      const Comp = s.Comp;
      return (
        <Sequence key={s.id} name={`${s.id} ${t.slug}`} from={t.startFrame - pre} durationInFrames={total} premountFor={30}>
          <SceneContext.Provider value={{ scene: t, words: tl.words, preroll: pre, fps: tl.fps }}>
            <SceneShell pre={pre} post={post} total={total}>
              <Comp />
            </SceneShell>
          </SceneContext.Provider>
        </Sequence>
      );
    })}
    <Audio src={staticFile(audio)} />
    {captions ? <Captions words={tl.words} fps={tl.fps} offsetFrames={0} /> : null}
    {audit ? <TextAudit /> : null}
  </AbsoluteFill>
);

/** One scene on its own, with its slice of the narration — for previewing and checking frames. */
export const ScenePreviewFrame: React.FC<{
  readonly tl: Timeline;
  readonly scenes: readonly SceneEntry[];
  readonly sceneId: string;
  readonly audio: string;
  readonly audit?: boolean;
  readonly captions?: boolean;
}> = ({ tl, scenes, sceneId, audio, audit, captions }) => {
  const t = sceneOf(tl, sceneId);
  const s = scenes.find((x) => x.id === sceneId);
  if (!s) throw new Error(`Scene ${sceneId} not registered`);
  const Comp = s.Comp;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink950 }}>
      <SceneContext.Provider value={{ scene: t, words: tl.words, preroll: 0, fps: tl.fps }}>
        <Comp />
      </SceneContext.Provider>
      <Audio src={staticFile(audio)} trimBefore={t.startFrame} />
      {captions ? <Captions words={tl.words} fps={tl.fps} offsetFrames={t.startFrame} /> : null}
      {audit ? <TextAudit /> : null}
    </AbsoluteFill>
  );
};

/** Group words into short caption lines, breaking at sentence ends, commas and pauses. */
const captionLines = (words: readonly Word[]) => {
  const lines: { text: string; start: number; end: number }[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) lines.push({ text: cur.map((w) => w.text).join(" "), start: cur[0].startSec, end: cur[cur.length - 1].endSec });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = cur[cur.length - 1];
    if (prev) {
      const len = cur.map((x) => x.text).join(" ").length + w.text.length + 1;
      const gap = w.startSec - prev.endSec;
      if (len > 52 || gap > 0.6 || w.scene !== prev.scene || (/[.?!:]$/.test(prev.text) && cur.length > 1)) flush();
    }
    cur.push(w);
    if (i === words.length - 1) flush();
  });
  return lines;
};

/** Read-along captions for preview cuts (the final upload uses the .srt file instead). */
export const Captions: React.FC<{ readonly words: readonly Word[]; readonly fps: number; readonly offsetFrames: number }> = ({ words, fps, offsetFrames }) => {
  const frame = useCurrentFrame();
  const t = (frame + offsetFrames) / fps;
  const lines = React.useMemo(() => captionLines(words), [words]);
  const line = lines.find((l, i) => t >= l.start - 0.05 && t < Math.min(l.end + 0.8, (lines[i + 1]?.start ?? Infinity) - 0.05));
  if (!line) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 34, pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1.25,
          color: C.paper,
          background: "rgba(8,17,30,0.78)",
          padding: "8px 26px 10px",
          borderRadius: 14,
          maxWidth: 1500,
          textAlign: "center",
        }}
      >
        {line.text}
      </div>
    </AbsoluteFill>
  );
};
