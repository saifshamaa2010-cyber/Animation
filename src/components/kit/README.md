# Hand-made kit

Annotation marks and illustrated props that make the video feel drawn by a person, not
generated. Import from `src/components/kit` (barrel `index.ts`). Everything is an SVG `<g>`
in 1920×1080 coordinates. It is driven only by props or `useCurrentFrame()` and is
deterministic, because all randomness comes from seeds. Colours come only from
`src/brand/tokens.ts`.

**How the hand marks work (`ink.ts`):** a few control points become a smooth curve, get
low-frequency seeded drift (a hand drifts, it doesn't shake), then become a filled ribbon
with pen pressure: a quick press-in, a slight variation along the line and a lift-off taper.
Width depends on position along the *whole* stroke, so the part already drawn never changes
while the stroke draws on. `HandLayer` adds a very slight static felt-tip edge (`rough`).
Pass `progress` **linear**, because pen-speed easing is built in. `boil` (default 0) is an
optional stepped redraw wobble; 0.3 is plenty.

Common props for all hand marks: `progress` (0..1), `color`, `width` (px), `seed`,
`opacity`, `rough` (0..1, default 0.6) and `boil` (default 0).

## Annotation marks (`hand.tsx`)
- **HandCircle**: `cx, cy, rx, ry?, startAngle? (−35°), overshoot? (0.16 turn), clockwise?`. A marker loop that overshoots its start. Use `circleAround(textBox(...))` to fit it to a word.
- **HandUnderline**: `x1, x2, y, double?, sag?, rise?`. Slight bow and an upward drift at the end. `double` adds a second, shorter stroke.
- **HandArrow**: `from, to, bend? (0.18, signed), head? (px), headAngle? (30°), gapStart?, gapEnd?`. The curved shaft draws first, then two tapered barbs.
- **HandCross**: `cx, cy, size? (90)`. Two strokes with a pen lift between them. Default colour is coral.
- **HandTick**: `cx, cy, size? (100)`. One stroke: press, rounded turn, long flick. Default colour is teal.
- **HandBracket**: `from, to, depth? (36), side? (1|−1), variant? ("curly"|"square")`. A brace drawn as two strokes that meet in a clean beak.
- **StrikeThrough**: `x1, x2, y (use textBox().strikeY), passes? (1|2|3)`. A marker scratch through a wrong word. Default colour is coral.

## Props
- **Stopwatch**: `x, y, size? (320), seconds, color? (amber), showElapsed?, readout?, progress?, opacity?`. Ink-metal case, crown, pusher and 60 ticks. The hand sweeps once every 60 s, and an amber arc shows the elapsed time.
- **Hourglass**: `x, y, size? (340), sand (0..1 fallen), flowing?, sandColor?, sandDeep?, progress?, opacity?`. The top sand drains into a funnel and the bottom mound grows. Falling grains are driven by the frame.
- **ScaleBar**: `x, y, length, labels[], step? (fractional index), progress, color?, size? (44)`. The bar grows from its centre. Labels roll like an odometer ("1 mm" → "1 µm" → "1 nm") and never overlap.
- **Counter**: `x, y, value, size? (84), color?, align?, minDigits?, separator? (","), speed? (value/frame → motion blur), prefix?, suffix?, progress?`. A mechanical odometer: each wheel turns only on a carry, leading zeros are blank, and new columns grow in smoothly.
- **WordEquation**: `x, y, left, right, over?, under?, progress, size? (64), leftColor?, rightColor?, overColor? (teal), arrowColor?, arrowLength?, seed?`. Builds up in reading order, and the enzyme name is "written" above a hand-drawn arrow. Formulas like `H2O2` get real subscripts.
- **PHScale**: `x (pH 0), y, width? (1200), height? (26), progress, marker?, markerLabel?, markerColor?, markerProgress?, numbers? ("key"|"all"), zones?`. A coral → paper → violet bar with ticks and a pin marker. `phColour(ph)` returns the bar colour at any pH.
- **CellOutline**: `cx, cy, rx, ry?, progress, seed?, color? (ink300), fill?, lumpiness? (0.05), flow? (2 px), opacity?`. An organic double-line membrane that draws round, then the lit interior fades in.

## Molecules (`Molecules.tsx`)
- **Molecule**, **H2O2**, **Water**, **Oxygen**: `kind ("H2O2"|"H2O"|"O2"), x, y, scale?, rotate?, progress?, temperature?, still?, seed?, label? (true|string), labelSize? (44), labelColor?`. Flat ball-and-stick with gradient atoms and rim light. O is coral and H is paper (CPK-style). They jiggle thermally unless `still` is set.
- **Formula**: `text ("H2O2"), x, y, size?, color?, anchor?`. Text with real subscripts (Lexend has no ₂ glyph).
- **Bubble**: `x, y, r, progress?, tint?, wobble? (0.5), pop? (0..1), seed?`. A rim-lit gas bubble. `pop` flashes a ring and throws droplets.

## Lock and key (`LockKey.tsx`)
- **LockIcon**: `x, y, size? (220), rotate?, variant? ("solid"|"line"), progress?, color?`. A teal padlock whose keyhole **is** the enzyme's active-site pocket.
- **KeyIcon**: `x, y, size? (340), rotate?, variant?, progress?, color? (cream), rings? (true)`. The bit **is** the docked substrate end (two glucose rings), the same shape as the pocket.
- **POCKET_POINTS / pocketPath(k, shrink)**: the shared pocket outline, built from `molecule-geometry.ts`.

## Depth (`Depth.tsx`)
- **FocusPull**: `blur (px), dim? (0.25), opacity?, children`. A rack-focus wrapper. Animate `blur` to shift attention between layers.
- **DepthMolecules**: `count? (5), seed?, kind? ("glucose"|"water"|"mixed"), blur? (12), opacity? (0.45), speed?, keepCentreClear? (true)`. Big, blurred foreground molecules on the frame edges that drift slowly with `@remotion/noise`.

## Helpers
- **textWidth / textBox / circleAround / formulaWidth / isFormula** (`text.ts`): measure Lexend exactly (`lexend-metrics.ts` is generated from the bundled fonts) so marks hug words.
- **LitShape** (`shared.tsx`): any path gets the house look (one gradient, rim light, soft shadow). **mix(a, b, t)** blends two token colours.
- **prepareStroke / inkGeometry / penEase / seg** (`ink.ts`): build new hand marks from raw points.

## QA sheet
`KitDemo.tsx` + `demo-root.tsx` + `demo-index.ts` are kept out of the main Root on purpose.

```
npx remotion still src/components/kit/demo-index.ts kit-demo /tmp/kit-demo.png        # all pages, half size
npx remotion still src/components/kit/demo-index.ts kit-demo-zoom /tmp/kit-zoom.png   # 2× details
# also: kit-demo-annotations, kit-demo-props, kit-demo-molecules, kit-demo-drawon
npx remotion studio src/components/kit/demo-index.ts                                   # kit-motion: timing check
```
