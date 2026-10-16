/**
 * EP002 v2 style preview: three excerpts of the real episode (same script, same timing), each in its
 * own "world" and introduced by a chapter card. Read-along captions stand in for the voice.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { W2 } from "../../../brand/tokens";
import { Captions } from "../../../components/EpisodeFrame";
import { SectionCard } from "../../../components/fun";
import { SceneContext } from "../../../lib/timeline";
import { TL } from "../timeline";
import { V2S06Tip } from "./V2S06Tip";
import { V2S10Stomata } from "./V2S10Stomata";
import { V2S16Bench } from "./V2S16Bench";

const CARD = 66; // chapter bumper, frames

const scene = (id: string) => {
  const s = TL.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`No ${id}`);
  return s;
};
/** scene-relative frame of a cue (as the scenes see it) */
const cueAt = (id: string, cue: string) => scene(id).cues[cue].frame - scene(id).startFrame;

type Segment = { id: string; from: number; to: number; Comp: React.FC; n: number; title: string; bg: readonly [string, string] };
const SEGMENTS: Segment[] = [
  { id: "S06", from: cueAt("S06", "careful") - 12, to: scene("S06").endFrame - scene("S06").startFrame, Comp: V2S06Tip, n: 1, title: "What is photosynthesis?", bg: [W2.deskTop, W2.deskBottom] },
  { id: "S10", from: cueAt("S10", "gases") - 12, to: cueAt("S10", "recap"), Comp: V2S10Stomata, n: 4, title: "Leaf structure", bg: ["#3A2A80", W2.leafNightDeep] },
  { id: "S16", from: cueAt("S16", "tubeA") - 12, to: scene("S16").endFrame - scene("S16").startFrame, Comp: V2S16Bench, n: 9, title: "Gas exchange", bg: ["#B07AD8", "#E89A7E"] },
];

export const V2_PREVIEW_FRAMES = SEGMENTS.reduce((a, s) => a + CARD + (s.to - s.from), 0);

const Card: React.FC<{ seg: Segment }> = ({ seg }) => {
  const t = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <SectionCard topic="Plant nutrition" part={seg.n} of={9} title={seg.title} t={t} dur={CARD} look={{ bg: seg.bg }} chloro />
      </svg>
    </AbsoluteFill>
  );
};

export const V2Preview: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {SEGMENTS.map((seg) => {
        const s = scene(seg.id);
        const len = seg.to - seg.from;
        const start = at;
        at += CARD + len;
        const Comp = seg.Comp;
        return (
          <React.Fragment key={seg.id}>
            <Sequence from={start} durationInFrames={CARD} name={`card ${seg.n}`}>
              <Card seg={seg} />
            </Sequence>
            <Sequence from={start + CARD} durationInFrames={len} name={`${seg.id} excerpt`}>
              <SceneContext.Provider value={{ scene: s, words: TL.words, preroll: 0, fps: TL.fps }}>
                <Sequence from={-seg.from}>
                  <Comp />
                </Sequence>
              </SceneContext.Provider>
              <Captions words={TL.words} fps={TL.fps} offsetFrames={s.startFrame + seg.from} />
            </Sequence>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};


