/**
 * Handwriting that is written WHILE it is spoken: each word of a line is revealed (and the pen moves
 * across it) during the frames the narrator says that word. Use it for definitions the student must
 * learn word for word, so ear and eye get the same word at the same moment.
 *
 *   const lines = writeAsSpoken([[{ text: "Photosynthesis", t0, t1 }, …], […]], 74);
 *   const px = writtenPx(lines[0], f);                 // how far the pen has got (px from the line start)
 *   <Scribble … text={lines[0].text} size={74} progress={scribbleProgress(lines[0], px)} />
 *
 * Widths come from the measured Caveat metrics (Handwriting.tsx), so the pen tip and any highlight
 * or arrow placed with `wordBox` land exactly on the written word. Pure functions of the frame.
 */
import { caveatWidth } from "./Handwriting";

/** A word as displayed, with the frames it is spoken (scene frames; t1 = when it has been said). */
export type SpokenWord = { readonly text: string; readonly t0: number; readonly t1: number };
/** A word as laid out and scheduled on its line (x in px from the line start). */
export type WrittenWord = { readonly text: string; readonly x0: number; readonly x1: number; readonly t0: number; readonly t1: number };
export type WrittenLine = {
  readonly text: string;
  readonly size: number;
  readonly width: number;
  readonly words: readonly WrittenWord[];
  readonly t0: number;
  readonly t1: number;
};

/**
 * Lay out each line (words joined by single spaces) and schedule every word to be written while it is
 * spoken. A word never starts before the previous one is finished, takes at least `minFrames`, and the
 * first word of a new line waits `lineBreak` frames (the pen travelling back to the margin).
 */
export const writeAsSpoken = (
  lines: readonly (readonly SpokenWord[])[],
  size: number,
  opts: { readonly minFrames?: number; readonly lineBreak?: number } = {},
): WrittenLine[] => {
  const minF = opts.minFrames ?? 6;
  const lb = opts.lineBreak ?? 8;
  let prevEnd = -Infinity;
  return lines.map((ws, li) => {
    const text = ws.map((w) => w.text).join(" ");
    let acc = "";
    const words = ws.map((w, i) => {
      const x0 = caveatWidth(acc, size);
      const x1 = x0 + caveatWidth(w.text, size);
      acc += `${w.text} `;
      const t0 = Math.max(w.t0, prevEnd + (i === 0 && li > 0 ? lb : 0));
      const t1 = Math.max(w.t1, t0 + minF);
      prevEnd = t1;
      return { text: w.text, x0, x1, t0, t1 };
    });
    return { text, size, width: caveatWidth(text, size), words, t0: words[0].t0, t1: words[words.length - 1].t1 };
  });
};

/** How many px of the line the pen has written by frame `f` (it waits at the end of a word until the next is said). */
export const writtenPx = (line: WrittenLine, f: number) => {
  let x = 0;
  for (const w of line.words) {
    if (f < w.t0) return x;
    if (f < w.t1) return w.x0 + (w.x1 - w.x0) * ((f - w.t0) / (w.t1 - w.t0));
    x = w.x1;
  }
  return line.width;
};

/** True while the pen is actually moving through a word (for a writing bob). */
export const isWriting = (line: WrittenLine, f: number) => line.words.some((w) => f >= w.t0 && f < w.t1);

/** The `progress` to give <Scribble> so that exactly `px` of the line shows. */
export const scribbleProgress = (line: WrittenLine, px: number) => (px >= line.width - 0.5 ? 1 : Math.max(0, px) / (line.width + line.size * 0.25));

/**
 * Horizontal extent (px from the line start) of words `from`..`to` (inclusive) of a line, optionally
 * without trailing punctuation — for highlights, underlines and arrows that must hug written words.
 */
export const wordSpan = (line: WrittenLine, from: number, to = from, trimPunctuation = true) => {
  const last = line.words[to];
  const trail = trimPunctuation ? (last.text.match(/[.,;:!?]+$/)?.[0] ?? "") : "";
  return { x0: line.words[from].x0, x1: last.x1 - caveatWidth(trail, line.size) };
};
