# EP002 storyboard — Plant Nutrition

Look: the EP001 "Soft Lab" style exactly as approved in the 10-second preview
(`src/previews/PhotosynthesisPreview.tsx`): deep ink-blue background, lit flat shapes (one gradient,
rim light, soft contact shadow), Lexend, leader-line labels, the amber glucose ring from EP001.
**No decorative background particles or blurred depth molecules.** Light is drawn (beams + photons)
only when light is part of the explanation.

Colour code (constant through the episode): carbon dioxide and water = ice blue (inputs),
glucose/starch/sucrose = amber (EP001's sugar colour), oxygen = coral, light = sun yellow,
leaf/chlorophyll = leaf green, enzymes = teal (as in EP001), minerals: nitrate = ice, magnesium = leafLight.
Practical colours are the real ones: iodine orange-brown → blue-black (always on a white tile),
hydrogencarbonate red / yellow / purple.

Structure: a section tag (`SectionTag`, top-left) opens each section so the viewer always knows where
they are. Extended-only content gets the EXTENDED badge.

| # | Section tag |
|---|---|
| S03–S06 | 1 · What is photosynthesis? (S05 balanced equation: EXTENDED) |
| S07 | 2 · What plants do with glucose |
| S08 | 3 · Mineral ions |
| S09–S10 | 4 · Leaf structure |
| S11 | 5 · Testing a leaf for starch |
| S12 | 6 · What photosynthesis needs |
| S13–S14 | 7 · Rate of photosynthesis |
| S15 | 8 · Limiting factors (EXTENDED) |
| S16–S17 | 9 · Gas exchange in light and dark |

---

## S01 hook — van Helmont's willow
- `{pot}` A sapling willow (`Willow growth≈0.08`) in a terracotta `Pot`, standing on a `Scale`, left of centre. A small two-row ledger card appears on the right: "willow" / "soil" (no numbers yet).
- `{weigh}` Each row gets a tick as it's said ("He weighed the tree" → willow ✓, "He weighed the soil" → soil ✓); the scale display blinks.
- `{water}` Water drops fall into the pot, rhythmically; a "year 1 → 5" counter ticks; the tree grows smoothly to `growth 1` across the five years (camera pulls back gently to fit it — scale change).
- `{grown}` Willow row: counter rolls to "+74 kg". `{soil}` Soil row: "−57 g".
- `{question}` "Where did the mass come from?" (≤ 6 words), centred above. `{notSoil}` The soil row is struck through. `{air}` Carbon dioxide molecules drift in from the air into the crown; leaves glint.
- `{promise}` Hold; everything settles. Exit leaves room for the title.

## S02 title (3 s)
- "Plant Nutrition" (hero size) + "Photosynthesis · IGCSE Biology" below. Motif: one photon lands on a small leaf, a glucose ring pops out. Clears before S03.

## S03 definition
- `{eat}` Left: a plate-and-fork icon with "you: eat food"; right: a small potted `Plant`. `{make}` Sun beams fall on the plant, a glucose ring forms in a leaf, "plants: make food".
- `{define}` Clear centre. `{defLine}` The definition builds as **keyword chips** in sync with the words: "synthesise", "carbohydrates", "raw materials", "energy from light" (use `word()` on those words). Subtitles carry the full sentence.
- `{synthesise}` The "synthesise" chip flips to "synthesise = make". `{carbs}` A glucose ring under "carbohydrates" + label "glucose". `{raw}` CO₂ and H₂O molecules under "raw materials". `{light}` A sun icon + photons under "energy from light".

## S04 equation
- `{equation}` The word equation (`Equation`) builds in the centre; each molecule (CO₂, H₂O, glucose ring, O₂) sits above its word as it's said.
- `{conditions}` "light" above / "chlorophyll" below the arrow (sun icon, chloroplast icon). `{notReactants}` a bracket + "conditions, not reactants".
- `{inputs}` The equation moves to the top; a `Plant` in a `SoilBlock` takes the stage. `{co2From}` CO₂ drifts from the air into a leaf. `{waterFrom}` Water molecules go from soil into roots and up the stem (stem highlights blue: xylem). `{oxygenOut}` O₂ leaves the leaf; one O₂ curls back into the leaf ("respiration"), `{release}` the rest drift out.

## S05 balanced (EXTENDED)
- Symbol equation big in the centre: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂, coloured like the word equation.
- `{check}` An atom tally appears below. `{carbon}` C: 6 = 6 (the C's in the equation flash), `{hydrogen}` H: 12 = 12, `{oxygenCount}` O: 12 + 6 = 18 = 6 + 12 (each part highlighted as it's said). `{balances}` a tick.

## S06 chlorophyll (the approved preview, extended)
- Leaf left, magnifying `Lens` right showing palisade cells packed with chloroplasts.
- `{chloroplasts}` lens opens, label "chloroplast". `{chlorophyll}` label "chlorophyll · green pigment".
- `{absorb}` photons stream in; chloroplasts glow where light lands. `{transfer}` energy passes from a glowing chloroplast into a forming glucose ring (amber glow) — label "energy in chemicals". `{stored}` glucose ring settles.
- `{careful}` `ExamTip`: "transfers energy" with "makes energy" struck through on `{notMake}`; `{transfers}` underline.

## S07 uses — five uses of glucose
- Big glucose ring centre. Five spokes, numbered 1–5, each arriving on its cue with an icon and a ≤ 3-word label:
  1 `{respiration}` energy burst — "respiration · releases energy"; 2 `{starch}` a starch chain (`SugarChain`) coils into a granule — "starch · energy store"; `{insoluble}` "insoluble" chip, water drops pass by unaffected; 3 `{cellulose}` cell-wall bricks built from straight chains — "cellulose · cell walls"; 4 `{sucrose}` `Sucrose` slides along a phloem tube — "sucrose · phloem"; 5 `{nectar}` `Flower` with nectar, a `Bee` arrives — "nectar · pollination".
- `{five}` each spoke pulses in turn with the word.

## S08 minerals
- `{chon}` glucose ring with C, H, O chips. `{protein}` an `AminoChain` builds bead by bead, then folds into a protein blob. `{nitrogen}` an N chip lights on each amino acid.
- `{nitrate}` A `Plant` in a `SoilBlock` with `Roots`; NO₃⁻ `Ion`s move into the roots. `{nitrateUse}` an arrow from the ion to the amino-acid chain. `{nitrateLack}` side-by-side: healthy vs stunted plant with yellow older leaves — "stunted · older leaves yellow".
- `{magnesium}` Mg²⁺ ions in. `{magnesiumUse}` arrow to a chloroplast that turns greener. `{magLack}` a `Leaf` with `interveinal` yellowing — "yellow between veins". `{lessPs}` fewer photons absorbed (some bounce off).
- `{examLine}` A three-link chain: "ion → makes → without it" with the two examples beneath.

## S09 leaf (structure, top layers)
- `{leaf}` one big `Leaf`. `{broadThin}` `{area}` light rains onto the wide blade — "large surface area". `{thin}` the leaf turns edge-on: a thin slab; CO₂ crosses it with a short dimension bracket — "short diffusion distance".
- `{slice}` a cut line across the leaf, camera pushes into the cut (scale change) and the `LeafSection` builds layer by layer (diagram on the right, labels in a left column with leader lines).
- `{section}` "cross-section · dicot leaf"; `{simplified}` small "simplified" tag.
- `{cuticle}` focus cuticle, label "waxy cuticle"; `{cuticleWhy}` water drops can't get out, photons pass through. `{upper}` "upper epidermis", photons pass through. `{palisade}` "palisade mesophyll", chloroplasts glow. `{most}` "most photosynthesis here".

## S10 layers (structure, lower layers)
- Same `LeafSection`, same position. `{spongy}` "spongy mesophyll"; `{air}` "air spaces" (gaps tinted). `{diffuse}` CO₂ diffuses through the air spaces to cells.
- `{bundle}` "vascular bundle"; `{xylem}` "xylem: water + ions" (blue dots rise out of the xylem); `{phloem}` "phloem: sucrose + amino acids" (amber dots move in).
- `{lower}` "lower epidermis"; `{stomata}` "stomata"; `{gases}` CO₂ in / O₂ out through a stoma along `leafSectionPaths`; `{guard}` guard cells open and close — "guard cells".
- `{recap}` all labels lit at once, top to bottom, in time with the list.

## S11 starch test
- `{prove}` / `{test}` iodine bottle + "starch test".
- `{destarch}` a potted plant goes into darkness ("dark · 1–2 days"); starch dots in its leaves fade (`{useUp}`). `{why}` "starch made during experiment".
- Four stations left → right, the camera moves along them (shift of focus), step number chips 1–4:
  1 `{boil}` beaker of boiling water on a lit `Bunsen`; leaf dips in, dulls — `{boilWhy}` "kills cells · membranes broken".
  2 `{ethanol}` the flame goes out (cross); `Tube` of ethanol standing in the hot water; `Bottle` "ethanol" with the flammable sign (`{flammable}`); `{decolour}` the leaf goes pale, the ethanol turns green.
  3 `{rinse}` leaf dipped in warm water — `{rinseWhy}` "softens it".
  4 `{tile}` leaf on a white `Tile`; `Dropper` adds iodine. `{blueBlack}` one leaf blue-black "starch present"; `{orange}` one orange-brown "no starch".

## S12 needs — three experiments with controls
- `{control}` card: "control: identical except one factor"; `{controlWhy}` "shows the factor caused it".
- Three columns, built one after another, each: setup → after the test → "✓ … needed":
  1 `{chlorophyllTest}` variegated `Leaf` (`margin` white) → `{greenOnly}` green parts blue-black, white parts orange.
  2 `{cover}` black paper strip (`cover`) → `{uncovered}` blue-black except an orange band; `{lightControl}` "uncovered part = control".
  3 `{flask}` two `ConicalFlask`s, one with `SodaLime` — `{absorbs}` CO₂ molecules vanish into it; `{co2Result}` its leaf orange, the control's leaf blue-black.

## S13 rate method
- `{pondweed}` `Beaker` with `Pondweed`; `{setup}` "sodium hydrogencarbonate → CO₂". `{bubbles}` `Bubble`s rise from the cut end — "mostly oxygen". `{count}` a counter "bubbles per minute". `{syringe}` `GasSyringe` fills — "measure volume: more accurate".
- `{lamp}` `Lamp` + `Ruler`: the lamp moves closer, bubbles come faster (rate tied to distance). `{variables}` three chips: "independent: light intensity", "dependent: rate", `{constant}` "control: CO₂, temperature, plant". `{led}` "LED: little heat". `{acclimatise}` small clock "wait a few minutes". `{repeat}` "repeat → mean".

## S14 rate results
- Three `Graph`s in a row, drawn in turn: light (rise → plateau), CO₂ (rise → plateau), temperature (rise to optimum, steep fall).
- `{enzymes}` the teal `Enzyme` from EP001 with a substrate; `{below}` it jiggles faster, more collisions; `{above}` it denatures (active site changes shape). `{describe}` / `{explain}` two short chips: "describe: what + numbers", "explain: why".

## S15 limiting factors (EXTENDED)
- Big light graph. `{rising}` rising part shaded — "light is limiting". `{plateau}` flat part shaded — "something else limits". `{raise}` second curve (higher CO₂) rises higher and plateaus higher. `{proves}` "CO₂ was limiting".
- `{exam}` `ExamTip`: "increasing it increases the rate".
- `{conditions}` three cards: `{dawn}` low sun — "dawn / dull: light"; `{winter}` cold thermometer — "winter: temperature"; `{summer}` bright sun — "summer: CO₂".

## S16 predict — the one "pause and predict"
- `{indicator}` a colour key: yellow ← red → purple, "more CO₂" / "air" / "less CO₂" (`{red}` `{yellow}` `{purple}` in turn).
- `{tubes}` a `Rack` with three red tubes: `{tubeA}` leaf + `Lamp`; `{tubeB}` leaf + `FoilWrap`; `{tubeC}` empty.
- `{question}` "What colour after a few hours?" `{pauseNow}` `PausePredict` overlay with a countdown filling the 4-second silence.

## S17 reveal
- `{lightTube}` tube A turns purple; CO₂ arrows go *into* the leaf. `{darkTube}` tube B (foil lifted to show it) turns yellow; CO₂ arrows *out*. `{controlTube}` tube C stays red — "control". `{dim}` lamp dims on A: back to red — "rates equal".
- `{myth}` `MythCard`: "Plants only respire at night" → strike "only at night" → "all the time". `{net}` `ExamTip`: "net uptake of CO₂".

## S18 resolve
- Back to S01's grown willow and ledger. `{co2In}` CO₂ streams into the crown; `{waterIn}` water rises from the pot. `{built}` glucose rings flow down and lock into the trunk as cellulose (amber → bark). `{minerals}` a few ions leave the soil — the "−57 g" row lights. `{thought}` "water?" `{partly}` "partly right". `{wood}` the trunk glows amber. `{thinAir}` CO₂ keeps streaming in.

## S19 recap
- Six recap cards (2 × 3), each an icon + ≤ 6 words, arriving with r1…r6. `{title}` they slide away for "Plant Nutrition".

## S20 end (7 s)
- Title stays; three chips ("light", "chlorophyll", "glucose"); room for YouTube end-screen tiles; fade.
