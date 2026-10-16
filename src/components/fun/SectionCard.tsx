import React, { useContext } from "react";
import { useCurrentFrame } from "remotion";
import { SceneContext } from "../../lib/timeline";
import { C, EASE } from "../../brand/tokens";
import { FONT } from "../../brand/fonts";
import { useSvgId } from "../ids";
import { textWidth } from "../kit/text";
import { Chloro } from "./Chloro";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type SectionLook = {
  /** background gradient, top-left → bottom-right */
  readonly bg: readonly [string, string];
  /** text colour for the title (paper on dark backgrounds, ink on light ones) */
  readonly ink?: string;
  /** accent colour for the overline and the current progress step */
  readonly accent?: string;
};

/**
 * Part card: one chapter of the syllabus, divided into parts. Reads "PLANT NUTRITION · PART 4 OF 9" /
 * "Leaf structure", with a progress bar of all the parts. Full frame; `t` = frames since it started.
 * Never "Chapter N" — the whole video is one chapter.
 */
export const SectionCard: React.FC<{
  readonly topic: string;
  readonly part: number;
  readonly of: number;
  readonly title: string;
  readonly t: number;
  readonly dur: number;
  readonly look: SectionLook;
  /** Chloro waves on the card (optional) */
  readonly chloro?: boolean;
}> = ({ topic, part, of, title, t, dur, look, chloro = false }) => {
  const id = useSvgId("part");
  const inP = EASE.out(clamp01(t / 16));
  const outP = clamp01((t - (dur - 12)) / 12);
  const op = Math.min(t < 0 ? 1 : clamp01(t / 6 + 0.4), 1 - outP);
  if (op <= 0) return null;
  const ink = look.ink ?? C.paper;
  const accent = look.accent ?? C.amberLight;
  const x0 = 640;
  const titleSize = Math.min(124, ((1920 - x0 - 120) / Math.max(1, textWidth(title, 124, 700))) * 124);
  const slide = (1 - inP) * 50;
  const barW = Math.min(110, (1920 - x0 - 140) / of - 14);
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={look.bg[0]} />
          <stop offset="1" stopColor={look.bg[1]} />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id}-bg)`} />
      {/* big outlined part number */}
      <text x={150 - slide} y={830} fontFamily={FONT} fontWeight={700} fontSize={760} fill="none" stroke={ink} strokeOpacity={0.16} strokeWidth={6}>
        {part}
      </text>
      <text x={x0 + slide} y={386} fontFamily={FONT} fontWeight={700} fontSize={44} fill={accent} letterSpacing={8}>
        {`${topic.toUpperCase()}  ·  PART ${part} OF ${of}`}
      </text>
      <text x={x0 - 4 + slide * 1.4} y={520} fontFamily={FONT} fontWeight={700} fontSize={titleSize} fill={ink} letterSpacing={-2}>
        {title}
      </text>
      {Array.from({ length: of }, (_, i) => {
        const done = i < part - 1;
        const cur = i === part - 1;
        const grow = cur ? clamp01((t - 10) / 18) : 1;
        return (
          <g key={i}>
            <rect x={x0 + i * (barW + 14)} y={600} width={barW} height={14} rx={7} fill={ink} opacity={0.2} />
            {done || cur ? <rect x={x0 + i * (barW + 14)} y={600} width={barW * EASE.out(grow)} height={14} rx={7} fill={cur ? accent : ink} opacity={cur ? 1 : 0.75} /> : null}
          </g>
        );
      })}
      {chloro ? <Chloro x={1690} y={1000} size={250} mood="happy" pose="wave" enter={clamp01((t - 10) / 16)} seed={part} /> : null}
    </g>
  );
};

/** Length of a part card at the start of a scene (the script has a matching [pause] before the first word). */
export const PART_CARD_FRAMES = 66;

/**
 * Drop this LAST inside a scene's stage: shows the part card over the first ~2 s of the scene, then
 * fades to reveal the scene underneath.
 */
export const PartIntro: React.FC<{
  readonly part: number;
  readonly title: string;
  readonly look: SectionLook;
  readonly topic?: string;
  readonly of?: number;
  readonly chloro?: boolean;
  readonly dur?: number;
}> = ({ part, title, look, topic = "Plant nutrition", of = 9, chloro = false, dur = PART_CARD_FRAMES }) => {
  const ctx = useContext(SceneContext);
  const f = useCurrentFrame() - (ctx?.preroll ?? 0); // scene clock when inside a scene
  if (f >= dur) return null;
  return <SectionCard topic={topic} part={part} of={of} title={title} t={f} dur={dur} look={look} chloro={chloro} />;
};
