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
they are.

| # | Section tag |
|---|---|
| S03–S06 | 1 · What is photosynthesis? |
| S07 | 2 · What plants do with glucose |
| S08 | 3 · Mineral ions |
| S09–S10 | 4 · Leaf structure |
| S11 | 5 · Testing a leaf for starch |
| S12 | 6 · What photosynthesis needs |
| S13–S14 | 7 · Rate of photosynthesis |
| S15 | 8 · Limiting factors |
| S16–S17 | 9 · Gas exchange |

---

## S01 hook — van Helmont's willow
- `{pot}` A sapling willow (`Willow growth≈0.08`) in a terracotta `Pot`, standing on a `Scale`, left of centre. A small two-row ledger card appears on the right: "willow" / "soil" (no numbers yet).
- `{weigh}` Each row gets a tick as it's said ("He weighed the tree" → willow ✓, "He weighed the soil" → soil ✓); the scale display blinks.
- `{water}` Water drops fall into the pot, rhythmically; a "year 1 → 5" counter ticks; the tree grows smoothly to `growth 1` across the five years (camera pulls back gently to fit it — scale change).
- `{grown}` Willow row: counter rolls to "+74 kg". `{soil}` Soil row: "−57 g".
- `{question}` "Where did the mass come from?" (≤ 6 words), centred above. `{notSoil}` The soil row is struck through.
- `{air}` "Most of the wood came out of thin air": the trunk and branches warm softly amber on "wood" while carbon dioxide drifts out of the air into the leaves (leaves glint). S18 pays it off with the full amber glow.
- `{promise}` Hold; everything settles. Exit leaves room for the title.

## S02 title (3 s)
- "Plant Nutrition" (hero size) + "Photosynthesis · IGCSE Biology" below. Motif: one photon lands on a small leaf, a glucose ring pops out. Clears before S03.

## S03 definition
- `{eat}` Left: a plate-and-fork icon with "you: eat food"; right: a small potted `Plant`. `{make}` Sun beams fall on the plant, a glucose ring forms in a leaf, "plants: make food".
- `{define}` Clear centre. `{defLine}` The definition builds as **keyword chips** in sync with the words: "synthesise", "carbohydrates", "raw materials", "energy from light" (use `word()` on those words). Subtitles carry the full sentence.
- `{synthesise}` The "synthesise" chip flips to "synthesise = make". `{carbs}` A glucose ring under "carbohydrates" + label "glucose". `{raw}` CO₂ and H₂O molecules under "raw materials". `{light}` A sun icon + photons under "energy from light".

## S04 equation
- `{equation}` The word equation (`Equation`) builds in the centre, term by term — `{co2}` `{water}` `{glucose}` `{oxygen}` — each molecule (CO₂, H₂O, glucose ring, O₂) above its word as it's said.
- `{conditions}` "light" above / "chlorophyll" below the arrow (sun icon, chloroplast icon). `{notReactants}` a bracket + "conditions, not reactants".
- `{inputs}` The equation moves to the top; a `Plant` in a `SoilBlock` takes the stage. `{co2From}` CO₂ drifts from the air into a leaf. `{waterFrom}` Water molecules go from soil into roots and up the stem (stem highlights blue: xylem). `{oxygenOut}` O₂ leaves the leaf; one O₂ curls back into the leaf ("respiration"), `{release}` the rest drift out.

## S05 balanced
- Opens on S04's word equation. `{symbol}` On "symbol equation" a guide drops from each word to where its formula will sit.
- `{balanced}` Each formula lands as it is read — 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ — in the word equation's colours.
- `{check}` The equation lifts; an atom tally builds below. `{carbon}` C: 6 = 6 (the C's in the equation flash), `{hydrogen}` H: 12 = 12, `{oxygenCount}` O: 12 + 6 = 18 = 6 + 12 (each part highlighted as it's said). `{balances}` a tick.

## S06 chlorophyll (the approved preview, longer version)
- Leaf left, magnifying `Lens` right showing palisade cells packed with chloroplasts.
- `{what}` the leaf in sunlight; light lands on it in straight lines.
- `{chloroplasts}` lens opens, label "chloroplast". `{chlorophyll}` label "chlorophyll · green pigment".
- `{absorb}` photons stream in; chloroplasts glow where light lands. `{transfer}` energy passes from a glowing chloroplast into a forming glucose ring (amber glow) — label "energy in chemicals". `{stored}` glucose ring settles.
- `{careful}` `ExamTip`: "transfers energy" with "makes energy" struck through on `{notMake}`; `{transfers}` underline.

## S07 uses — five uses of glucose
- `{uses}` Big glucose ring centre; on "five uses" five spokes reach out with numbered, unlit badges. On each "One… Two…" the badge lights and a glucose ring travels out along its spoke, then becomes its use:
  1 `{respiration}` inside a cell the ring is broken down, energy bursts out — "releases energy"; 2 `{starch}` rings join and the chain coils up compactly — "energy store"; `{insoluble}` "insoluble" chip, water molecules drift past unaffected; 3 `{cellulose}` rings are laid one by one around a cell: its wall; 4 `{sucrose}` glucose + fructose = sucrose; "another sugar" sub-line (the molecule glows amber), which becomes "transported in phloem" as the sucrose is carried along the phloem (sieve plates); an arrow on "other parts of the plant"; 5 `{nectar}` nectar fills a `Flower`, a `Bee` arrives.
- Finished uses step back while the next is explained. `{five}` only the five names remain; each pulses as it is said (sucrose on its "Sucrose").

## S08 minerals
- `{chon}` glucose ring with C, H, O chips. `{protein}` an `AminoChain` builds bead by bead, then folds into a protein blob. `{nitrogen}` an N chip lights on each amino acid.
- `{nitrate}` A `Plant` in a `SoilBlock` with `Roots`; NO₃⁻ `Ion`s move into the roots. `{nitrateUse}` an arrow from the ion to the amino-acid chain. `{nitrateLack}` side-by-side: healthy vs stunted plant with yellow older leaves — "stunted · older leaves yellow".
- `{magnesium}` Mg²⁺ ions in. `{magnesiumUse}` arrow to a chloroplast that turns greener. `{magLack}` a `Leaf` with `interveinal` yellowing — "yellow between veins". `{lessPs}` fewer photons absorbed (some bounce off).
- `{examLine}` A three-link chain: "ion → makes → without it" with the two examples beneath.

## S09 leaf (structure, top layers)
- `{leaf}` a potted plant in sunlight; the camera pushes into one leaf (scale change). `{broadThin}` `{area}` a width arrow; light rains onto the wide blade — "large surface area". `{thin}` the leaf turns edge-on: a thin slab; CO₂ crosses it with a short dimension bracket — "short diffusion distance".
- `{slice}` a window is cut into the slab, camera pushes into the cut (scale change) and the `LeafSection` fills the right of the frame (labels in a left column with leader lines).
- `{section}` "cross-section · dicot leaf". `{dicot}` a small dicot seedling rises out of a strip of soil in the left column; its two seed leaves come up folded, then open out; both light up on "two" and a forked label "2 seed leaves" points to each. It fades as `{simplified}` the small "simplified" tag arrives.
- `{nameExplain}` two rows build in the left column: "its name" (on "name"), "how it helps" (on "helps"). `{layers}` the rows fade; a band of light sweeps down the layers, top to bottom.
- `{cuticle}` focus cuticle, label "waxy cuticle"; `{cuticleWhy}` water drops can't get out ("reduces water loss"), photons pass through ("transparent"). `{upper}` "upper epidermis"; `{upperWhy}` "transparent", "no chloroplasts": photons pass through. `{palisade}` "palisade mesophyll"; `{palisadeWhy}` "tall, tightly packed", "full of chloroplasts" (chloroplasts glow). `{most}` "most photosynthesis".

## S10 layers (structure, lower layers)
- Same `LeafSection`, same position. `{spongy}` "spongy mesophyll"; `{spongyWhy}` rounder cells outlined — "loosely packed"; `{air}` "air spaces" (gaps tinted ice). `{diffuse}` CO₂ diffuses through the air spaces to the cells; the cell surfaces light up — "large surface area".
- `{bundle}` "vascular bundle"; `{xylem}` "xylem: water + ions" (water drops and small ions rise into the mesophyll); `{phloem}` "phloem: sucrose + amino acids" (they slip into the phloem and shrink away along the vein — "to the rest of the plant").
- `{lower}` "lower epidermis"; `{stomata}` "stomata" (three pores ringed), "one pore = stoma". `{gases}` the camera pushes in to one stoma (scale change): "carbon dioxide in" to a palisade cell, "oxygen out". `{guard}` closer still: the guard cells open and close the pore — "guard cells".
- `{guardOpen}` Still zoomed on the closed stoma: warm light washes down and photons land on the guard cells; on "open" they bow apart ("closed" → "open"); on "carbon dioxide" CO₂ from the air below slips through the pore, crosses the air space and is absorbed by a spongy cell ("carbon dioxide in"). Then the camera pulls back out.
- `{recap}` the whole section again; each label returns, and its layer lights, as it is named, top to bottom. Ends fully labelled.

## S11 starch test
- `{prove}` / `{test}` iodine bottle + "starch test".
- `{destarch}` a potted plant goes into darkness ("dark · 1–2 days"); starch dots in its leaves fade (`{useUp}`). `{why}` "starch made during experiment".
- Four stations left → right, the camera moves along them (shift of focus), step number chips 1–4:
  1 `{boil}` beaker of boiling water on a lit `Bunsen`; leaf dips in, dulls — `{boilWhy}` "kills cells · membranes broken".
  2 `{ethanol}` the flame goes out (cross); `Tube` of ethanol standing in the hot water; `Bottle` "ethanol" with the flammable sign (`{flammable}`); `{decolour}` the leaf goes pale, the ethanol turns green.
  3 `{rinse}` leaf dipped in warm water — `{rinseWhy}` "softens it".
  4 `{tile}` leaf on a white `Tile`; `Dropper` adds iodine. `{blueBlack}` one leaf blue-black "starch present"; `{orange}` one orange-brown "no starch".

## S12 needs — three experiments with controls
- `{need}` three things a plant might need — chlorophyll, light, CO₂ — each with a "?".
- `{control}` a test row and a control row, identical ("=") except one factor (light crossed out: "≠"); `{controlWhy}` the results differ and an arrow shows the factor caused it.
- Three columns, built one after another (earlier columns step back), each: setup → result on a white tile → "✓ needed":
  1 `{chlorophyllTest}` a variegated `Leaf`; `{white}` "white: no chlorophyll"; `{lightUp}` light on it, "then test a leaf"; `{greenOnly}` green parts blue-black, white parts orange-brown. `{chlorophyllControl}` a leader line to a blue-black (formerly green) area: "green parts", then "= the control" on "control". `{chlorophyllNeeded}` labels clear, "✓ needed".
  2 `{cover}` "2 light" chip; the green leaf settles in on "Take a destarched plant", black paper slides onto its middle on "black". `{sunlit}` light on it for a few hours. `{uncovered}` blue-black except the covered band; `{lightControl}` "uncovered part = the control", "✓ needed".
  3 `{flask}` "3 CO₂" chip; one pot plant grows in, two long stalks arch out, each ending in a hanging leaf. On "seal" a `ConicalFlask` rises round the left leaf (stalk through the bung, CO₂ inside); on "attached" the stalk lights — "still attached". `{absorbs}` the `SodaLime` dish appears on "soda lime"; on "absorbs" — "absorbs CO₂" — the CO₂ drifts into the dish and vanishes. `{co2Control}` an identical flask with no dish rises round the other leaf; its CO₂ stays — "control". `{co2Result}` light falls on both flasks; on "only" a tile slides in with each flask's leaf: both orange-brown, then the control leaf turns blue-black. `{co2Needed}` "✓ needed"; all three columns light up together.

## S13 rate method
- `{rate}` "rate" = how fast (a stopwatch runs).
- `{pondweed}` `Pondweed` goes into a `Beaker` of water — "a water plant". `{setup}` a spatula of sodium hydrogencarbonate dissolves; CO₂ appears in the water — "supplies carbon dioxide". `{bubbles}` the lamp switches on; `Bubble`s rise from the cut end — "mostly oxygen".
- `{count}` a counter ticks on each bubble that reaches the surface. `{syringe}` a funnel goes over the pondweed and the `GasSyringe` fills — "measure volume · more accurate" (bubbles vary in size).
- `{lamp}` the `Lamp` moves along a `Ruler`: "closer lamp → higher light intensity"; bubbles speed up (rate computed from distance).
- `{variables}` / `{dependent}` labels on the things themselves: lamp "light intensity · independent variable · you change", syringe "rate · dependent variable · you measure" (third line on "change" / "measure").
- `{constant}` "keep constant": "same temperature" (thermometer), "same carbon dioxide", "same plant", then "no other lights" — the room light dims and stays dim. `{waterBath}` the thermometer glows; a glass water bath slides up round the beaker and its water rises — "water bath / steady temperature". `{led}` "LED lamp · much less heat".
- `{acclimatise}` new distance: a stopwatch runs while the bubble rate settles. `{repeat}` three repeats merge into a mean.
- `{otherFactors}` the mean bar fades; rings pulse on the dissolved CO₂ and the thermometer glows ("carbon dioxide", "temperature"); `ExamTip` "change one thing at a time".
- `{co2Method}` three small set-ups (lamps at the same distance, beakers in water baths at 25 °C); 2 / 4 / 8 CO₂ molecules — "low / medium / high" — and an arrow "more NaHCO₃". `{tempMethod}` the CO₂ evens out ("same NaHCO₃"); the baths go to 15 / 25 / 35 °C (example settings), tinted cool → warm. Holds to the end.

## S14 rate results
- Three `Graph`s in a row, drawn in turn. `{lightGraph}` light intensity: the curve rises as described; `{levels}` it levels off. `{co2Graph}` the light curve's shape is laid over the new axes ("the same shape"), then the real curve draws along it. `{tempGraph}` temperature: rises to an "optimum", then falls quickly.
- `{enzymes}` the light and CO₂ graphs step aside for the teal `Enzyme` from EP001 and its substrates (a thermometer and a marker on the temperature graph). `{below}` molecules move faster and dock more often — "more kinetic energy", "more effective collisions" (each docking makes amber product). `{above}` weak bonds snap: "denatured", "active site changed shape"; a substrate bounces off.
- `{describe}` the "describe" chip grows as each part is said: "what happens" → "+ numbers" (ticks appear, 4 circled on the light graph's axis) → "+ units". `{explain}` "explain → why".

## S15 limiting factors
- `{explainShapes}` opens on S14's three graphs (exam chips clear); the curves pulse on "shapes". `{defn}` "limiting factor": two pills, "in short supply" → "limits the rate".
- `{graph}` the light graph returns big. `{rising}` rising part shaded, a marker climbs it — "light intensity / is limiting". `{plateau}` flat part shaded, the marker moves right but not up — "light no longer limiting / something else limits". `{other}` candidates appear: "carbon dioxide", "temperature".
- `{raise}` extra CO₂ molecules appear across the whole graph, under both curves; the old curve is labelled "lower carbon dioxide". `{same}` at low light the new curve traces exactly over the old one (ice dashes on the yellow line, a dot riding its head); the rising band lights again — "light intensity / still limiting". `{higher}` where the old curve bends over, the new one peels away, keeps rising to its own knee (dashed guide, arrow from the old knee: "keeps rising for longer") and levels off higher (up arrow, "higher carbon dioxide"). `{proves}` "carbon dioxide / was limiting".
- `{exam}` the factor is circled, then `ExamTip`: "increasing it increases the rate".
- `{conditions}` three slots, "different conditions". `{dawn}` low sun — "dawn or dull day: light intensity", reason "not much light"; `{winter}` cold thermometer — "cold winter day: temperature"; `{winterWhy}` "less kinetic energy"; `{summer}` the sun reaches full glow on "plenty" — "bright, warm summer: carbon dioxide"; `{summerWhy}` its two CO₂ molecules swell on "tiny amount" — "very little CO₂ in air". The card just finished dims as the next arrives.

## S16 predict — the one "pause and predict"
- `{indicator}` "One more practical": an empty demo tube stands centre. `{indicatorDef}` it fills with "hydrogencarbonate indicator"; CO₂ shows as small dots in the liquid.
- The colour key builds as each colour is named: `{red}` red at air level; `{yellow}` CO₂ dots stream in → yellow; `{purple}` dots stream out → purple. Key: yellow ← red → purple, "more CO₂ / air / less CO₂".
- `{tubes}` the key moves aside; a `Rack` of three red tubes arrives. `{bungs}` bungs push in on "sealed", are ringed on "bungs" — "bung: no CO₂ in or out"; CO₂ dots from the air fall onto the bungs and bounce off (can't get in). Cleared on `{tubeA}`.
- `{tubeA}` a sprig of pondweed fades in, fully under the indicator (soft green halo); the lamp arrives and switches on at "bright", photons reach the sprig — "light". `{tubeB}` pondweed again; foil wraps the tube on "wrapped" — "dark". `{tubeC}` stays empty — "no pondweed".
- `{question}` "What colour after a few hours?" — a "?" over each tube. `{pauseNow}` `PausePredict` overlay with a countdown filling the 4-second silence.

## S17 reveal
- `{reveal}` same rack (seamless cut): "A few hours later".
- `{lightTube}` tube A: CO₂ dots go into the pondweed, purple spreads out from it; rate bars: photosynthesis longer than respiration (a few dots still come out). `{darkTube}` tube B: the foil lifts — yellow; photosynthesis bar drops to zero, respiration carries on, dots come out. `{controlTube}` tube C stays red — "control"; both bars empty; then A's and B's pondweed glows (it caused the changes).
- `{dim}` a fresh tube A, the lamp dims (fewer photons); the bars become equal — "rates equal". `{noNet}` on "no net" a coral copy of the respiration bar slides onto the photosynthesis bar and cancels all of it — "no net change"; one dot goes in on "uptake", one out on "release"; the tube stays red.
- `{myth}` the experiment steps back; `MythCard`: "Plants respire only at night" → `{bust}` "only at night" struck → "all the time" (the respiration bar never stops while photosynthesis switches on and off with day and night).
- `{net}` the myth card leaves; the photosynthesis bar grows long on "bright", glows on "faster"; on "net uptake" the part beyond the respiration bar's end is outlined — "net". `{netWord}` "net = overall"; the respiration copy slides up and cancels its share, leaving the outlined net; the bars glow on "takes in" / "gives out". `{netExam}` `ExamTip`: "net uptake of carbon dioxide"; "net" underlined in amber, the net segment pulses.

## S18 resolve
- `{back}` Back to S01's grown willow and ledger. `{where}` the "+74 kg" row lights. `{co2In}` CO₂ streams into the crown; `{waterIn}` water rises from the pot. `{built}` glucose rings flow down and lock into the trunk as cellulose (amber → bark). `{minerals}` a few ions leave the soil — the "−57 g" row lights. `{thought}` "water?" `{partly}` "partly right". `{wood}` the trunk glows amber. `{thinAir}` CO₂ keeps streaming in.

## S19 recap
- `{recap}` six numbered places appear (2 × 3) on "Let's recap". Each turns into a card (icon + ≤ 6 words) as its point is read; only the card being read is lit, the others settle back.
- `{r1}` Photosynthesis: the equation's molecules. `{r2}` Chlorophyll: light → chlorophyll → glucose. `{r3}` Uses of glucose: the five uses. `{r4}` Mineral ions: NO₃⁻ → arrow → amino-acid chain on "amino acids", Mg²⁺ → arrow → greening chloroplast on "chlorophyll" (the arrows read as "needed to make"). `{r5}` Leaf structure: the leaf's layers.
- `{r6}` Limiting factors: three rows in exam wording, each on its word — sun + "light intensity", CO₂ + "CO₂ concentration", thermometer + "temperature"; on "limiting" all three light up together (soft glow behind each icon).
- `{title}` the cards make way for "Plant Nutrition", which lands where S20 holds it.

## S20 end (7 s)
- Title stays; three chips ("light", "chlorophyll", "glucose"); room for YouTube end-screen tiles; fade.
