import { Easing } from "remotion";

/**
 * "Soft Lab" — the channel's visual identity. Every colour, size and easing
 * used in any episode comes from here. Do not hard-code new colours in scenes.
 */
export const C = {
  // Backgrounds (deep ink blue)
  ink950: "#08111E",
  ink900: "#0C1828",
  ink800: "#122238",
  ink700: "#1A2E4A",
  ink600: "#25405F",
  ink500: "#46607F",
  ink400: "#6C84A1",
  ink300: "#9AAEC5",

  // Text and diagram lines
  paper: "#F4EFE6",
  paperDim: "#CFC8BC",

  // Main enzyme (teal)
  teal: "#38C6B0",
  tealDeep: "#17897C",
  tealDark: "#0F5E57",
  tealLight: "#A3F0E2",

  // Sugars / substrate (amber). Locked-up starch is the muted "cream".
  amber: "#F5B95C",
  amberDeep: "#C9842C",
  amberLight: "#FFE2A8",
  cream: "#E9D7B3",
  creamDeep: "#B9A27A",

  // Heat / danger / myths
  coral: "#FF7B63",
  coralDeep: "#C9493A",

  // Secondary enzymes, alkaline end of pH
  violet: "#9F8EFF",
  violetDeep: "#6450DA",
  violetLight: "#D3CBFF",

  // Cold. Also water and carbon dioxide in EP002 (blue = air/water).
  ice: "#7FC4FF",
  iceDeep: "#3E86C8",

  // Plants (EP002+). Yellow-green, so a leaf is never mistaken for a teal enzyme.
  leaf: "#7DC36B",
  leafDeep: "#3F8F4F",
  leafDark: "#25583A",
  leafLight: "#C6EBAA",
  chloro: "#4FAF5A",
  /** Deficiency yellowing (chlorosis). */
  leafYellow: "#E2CF68",
  stem: "#8FB45A",
  bark: "#8D6B52",
  barkDeep: "#5C4535",
  soil: "#6E4D38",
  soilLight: "#9A7457",
  terracotta: "#CF7A55",
  terracottaDeep: "#9C5038",
  /** Sunlight (energy from light). */
  sun: "#FFD36E",

  // Practical colours: these must match what students really see in the lab.
  /** Iodine solution, and a leaf with no starch: orange-brown. */
  iodine: "#C8742A",
  /** Iodine + starch. Always shown on a white tile so it reads on the dark background. */
  blueBlack: "#1B1D3A",
  /** Hydrogencarbonate indicator: red (air), yellow (more CO2), purple (less CO2). */
  indRed: "#E0475E",
  indYellow: "#F1C743",
  indPurple: "#8E4FC4",
  glass: "#BFD8E6",
  foil: "#B9C0C8",
  flame: "#6FA8FF",
} as const;

/**
 * "Worlds" palette (EP002 v2 onwards): each chapter can sit in its own setting — a study desk, a lab
 * bench, inside the leaf, a sunlit meadow — and the mascot Chloro hosts. Warmer and more playful than
 * the ink-blue Soft Lab look, but the science colours above (CO2 ice, O2 coral, glucose amber, leaf
 * greens, indicator colours) stay the same so the meaning of a colour never changes between videos.
 */
export const W2 = {
  // study desk (purple grid)
  deskTop: "#4A2C8F",
  deskBottom: "#2A1B5E",
  deskGrid: "#B9A6FF",
  // lab bench
  wallTop: "#F7E3D3",
  wallBottom: "#D9C6EE",
  tile: "#FFFFFF",
  wood: "#E2B47E",
  woodDeep: "#B7834F",
  woodDark: "#7C5534",
  // inside the leaf
  leafNight: "#1E1747",
  leafNightDeep: "#120E2E",
  cellFill: "#8DD46E",
  cellDeep: "#4E9E45",
  cellLine: "#2E6B33",
  // sunlit meadow
  skyMagenta: "#A63A72",
  skyCoral: "#F2735F",
  skyGold: "#F7B24E",
  hill: "#7CB65A",
  hillDeep: "#4F8E43",
  // old journal page (history)
  parchment: "#F3E3C0",
  parchmentDeep: "#D9BC88",
  sepia: "#6B4A2B",
  sepiaLight: "#A47B52",
  // notebook paper (definitions, equations, exam technique)
  notePaper: "#FBF8F1",
  noteShade: "#EEE7D8",
  noteLine: "#A9C6E8",
  noteMargin: "#E88D8D",
  // soil cut-away (roots, mineral ions)
  skyDay: "#BFE3F7",
  skyDayLow: "#E8F5FB",
  grass: "#78B957",
  grassDeep: "#4F8E3E",
  soilTop: "#8A6447",
  soilMid: "#6E4B34",
  soilDeep: "#4A3122",
  pebble: "#A38B74",
  // Chloro the mascot
  chloroLight: "#B5EC6A",
  chloroMid: "#6CCB4E",
  chloroDeep: "#3E9A3C",
  chloroLine: "#21592A",
  cheek: "#FF7FAF",
  // paper things
  sticky: "#FFC85A",
  stickyDeep: "#E9A532",
  tape: "#E8E2D2",
  neon: "#7CFFB2",
  neonOff: "#3A5546",
  inkText: "#1E1A2E",
} as const;

export const FONT_SIZES = {
  hero: 120,
  headline: 84,
  title: 64,
  label: 44,
  small: 40,
} as const;

/** Safe area: keep key content this far inside the 1920×1080 frame. */
export const SAFE = { x: 100, y: 100 } as const;

export const EASE = {
  /** Entrances, things arriving and settling. */
  out: Easing.bezier(0.22, 1, 0.36, 1),
  /** Things leaving. */
  in: Easing.bezier(0.55, 0, 0.75, 0.06),
  /** Moves from A to B. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** The one allowed "snap" (bond breaking). */
  snap: Easing.bezier(0.1, 0.9, 0.2, 1),
} as const;

export const W = 1920;
export const H = 1080;
export const FPS = 30;
