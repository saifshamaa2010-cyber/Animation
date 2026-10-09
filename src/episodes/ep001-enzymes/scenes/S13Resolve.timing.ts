import type { CueFns, SfxEvent } from "../../../lib/cues";

export const s13Timing = (t: CueFns) => {
  const back = t.cue("back");
  const chew = t.cue("chew");
  const zoomEnd = chew + 54;
  const fit = t.cue("fit");
  const dock = fit + 10;
  const cut = t.cue("cut");
  const snap = cut + 10;
  const again = t.cue("again");
  const snaps2 = [again + 12, again + 36].filter((x) => x < t.cue("conditions") - 6);
  const conditions = t.cue("conditions");
  const deg = t.word("37", 1, 0);
  const neutral = t.word("neutral", 1, 0);
  const aeons = t.cue("aeons");
  const chewWord = t.word("chew", 2, -2);
  const tongue = t.cue("tongue");
  const zoomOut = tongue - 6;
  const shapeLine = t.cue("shapeLine");
  const title = t.cue("title");
  return { back, chew, zoomEnd, fit, dock, cut, snap, again, snaps2, conditions, deg, neutral, aeons, chewWord, tongue, zoomOut, shapeLine, title, end: t.dur };
};

export const s13Sfx = (t: CueFns): SfxEvent[] => {
  const k = s13Timing(t);
  return [
    { frame: k.chew + 2, sfx: "whoosh_zoom", gainDb: -4 },
    { frame: k.dock, sfx: "pop_bind", gainDb: -2 },
    { frame: k.snap, sfx: "snip" },
    ...k.snaps2.map((s) => ({ frame: s, sfx: "snip", gainDb: -7 })),
    { frame: k.deg + 6, sfx: "ui_blip", gainDb: -8 },
    { frame: k.neutral + 6, sfx: "ui_blip", gainDb: -8 },
    { frame: k.zoomOut + 2, sfx: "whoosh_zoom", gainDb: -6 },
    { frame: k.tongue + 16, sfx: "shimmer_sweet", gainDb: -3 },
    { frame: k.title + 4, sfx: "chime_title", gainDb: -3 },
    { frame: k.shapeLine + 2, sfx: "ui_blip", gainDb: -10 },
  ];
};
