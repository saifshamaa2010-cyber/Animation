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

  // Cold
  ice: "#7FC4FF",
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
