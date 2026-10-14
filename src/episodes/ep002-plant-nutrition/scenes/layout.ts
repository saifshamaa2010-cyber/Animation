/**
 * Shared positions for scenes that continue into each other, so a hard cut between them is seamless:
 * S01 ↔ S18 (the willow), S06 (the approved preview layout), S09 → S10 (the leaf section),
 * S13 → S14 → S15 (pondweed and graphs), S16 → S17 (the indicator tubes).
 * Pure data — no React — so timing files may import it too.
 */

/** Willow in a pot on a scale (S01 hook, S18 resolve). Pot rim centre; the scale sits under the pot. */
export const WILLOW = {
  potX: 640,
  potY: 640,
  potW: 260,
  potH: 210,
  /** top of the scale plate (= bottom of the pot) */
  scaleY: 850,
  scaleW: 420,
  /** ledger card: willow / soil rows */
  ledgerX: 1180,
  ledgerY: 330,
  ledgerW: 620,
} as const;

/** Leaf + lens (S06, matches the approved preview). */
export const LEAF_LENS = {
  leaf: { cx: 600, cy: 560, len: 700, wid: 330, ang: -16 },
  lens: { cx: 1390, cy: 500, r: 262 },
  zoomAt: [770, 515] as const,
  sunSource: [-340, -380] as const,
} as const;

/** The leaf cross-section (S09 second half and all of S10): diagram on the right, labels in a left column. */
export const SECTION = {
  x: 560,
  y: 300,
  w: 1260,
  /** left label column: text right-aligned at this x */
  labelX: 500,
} as const;

/** Hydrogencarbonate indicator tubes (S16, S17): three tubes in a rack. */
export const TUBES = {
  rackX: 1180,
  rackY: 300,
  gap: 240,
  tubeW: 74,
  tubeH: 330,
  /** colour key strip (S16) */
  keyY: 820,
} as const;

/** Rate graphs (S14, S15): three small graphs in a row, or one big one. */
export const GRAPHS = {
  small: [
    { x: 160, y: 300, width: 440, height: 300 },
    { x: 740, y: 300, width: 440, height: 300 },
    { x: 1320, y: 300, width: 440, height: 300 },
  ],
  big: { x: 300, y: 240, width: 900, height: 560 },
} as const;
