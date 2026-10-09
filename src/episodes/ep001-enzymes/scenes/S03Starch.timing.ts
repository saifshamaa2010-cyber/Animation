import type { CueFns, SfxEvent } from "../../../lib/cues";

export const s03Timing = (t: CueFns) => {
  const starchLabel = t.word("starch", 1, -2);
  const zoom = t.cue("zoom");
  const zoomEnd = zoom + 76;
  const chain = t.cue("chain");
  const count = t.word("hundreds", 1, 0);
  const linked = t.word("linked", 1, -2);
  const notSweet = t.cue("notSweet");
  const sugar = t.word("sugar", 1, -2);
  const locked = t.word("locked", 1, 0);
  const links = t.cue("links");
  const aeons = t.cue("aeons");
  return { starchLabel, zoom, zoomEnd, chain, count, linked, notSweet, sugar, locked, links, aeons, end: t.dur };
};

export const s03Sfx = (t: CueFns): SfxEvent[] => {
  const k = s03Timing(t);
  return [
    { frame: k.zoom, sfx: "whoosh_zoom" },
    { frame: k.sugar + 2, sfx: "shimmer_sweet", gainDb: -9 },
    { frame: k.locked + 14, sfx: "pop_bind", gainDb: -6 },
    { frame: k.links + 4, sfx: "ui_blip", gainDb: -8 },
  ];
};
