import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S09 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s09Timing = (t: CueFns) => {
  // ---- the plant, then one leaf
  const leaf = t.cue("leaf");
  const inLeaves = t.word("leaves", 1); // "…happens in the leaves,"
  const adapted = t.word("adapted", 1); // "…leaves are adapted for it."
  // ---- broad and thin
  const broadThin = t.cue("broadThin");
  const broad = t.word("broad", 1);
  const area = t.cue("area"); // "Broad means a large surface area,"
  const large = t.word("large", 1);
  const absorb = t.word("absorb", 1); // "…to absorb more light."
  const thin = t.cue("thin"); // "Thin means a short distance…"
  const short = t.word("short", 1);
  const distance = t.word("distance", 1);
  const carbon = t.word("carbon", 1);
  const diffuse = t.word("diffuse", 1);
  const inside = t.word("inside", 1); // "…to the cells inside."
  // ---- the cut and the push into the section
  const slice = t.cue("slice");
  const cut = t.word("cut", 1);
  const section = t.cue("section");
  const crossSection = t.word("cross-section", 1);
  const dicot = t.word("dicotyledonous", 1);
  // "That's a plant whose seeds have two seed leaves."
  const dicotGloss = t.cue("dicot");
  const seeds = t.word("seeds", 1);
  const two = t.word("two", 1);
  const simplified = t.cue("simplified");
  const simpWord = t.word("simplified", 1);
  // "Everyone needs to name each part. Explaining how each part helps photosynthesis is for the Extended paper."
  const extendedLeaf = t.cue("extendedLeaf");
  const name = t.word("name", 1);
  const explaining = t.word("explaining", 1);
  const extWord = t.word("extended", 1);
  const layers = t.cue("layers"); // "Let's go through it layer by layer, from the top."
  const layer = t.word("layer", 1); // "…layer by layer,"
  const top = t.word("top", 1); // "…from the top."
  // ---- cuticle
  const cuticle = t.cue("cuticle");
  const waxy = t.word("waxy", 1);
  const cuticleWhy = t.cue("cuticleWhy");
  const reduces = t.word("reduces", 1);
  const loss = t.word("loss", 1);
  const transparent = t.word("transparent", 1);
  const lightThrough = t.word("light", 2); // "…light passes straight through it."
  // ---- upper epidermis
  const upper = t.cue("upper");
  const upperWord = t.word("upper", 1);
  const upperWhy = t.cue("upperWhy");
  const transparent2 = t.word("transparent", 2); // "These cells are transparent too,"
  const noChloro = t.word("chloroplasts", 1); // "…they have no chloroplasts,"
  const below = t.word("below", 1); // "…to the cells below."
  // ---- palisade
  const palisade = t.cue("palisade");
  const palWord = t.word("palisade", 1);
  const palisadeWhy = t.cue("palisadeWhy");
  const tall = t.word("tall", 1);
  const tightly = t.word("tightly", 1);
  const close = t.word("close", 1); // "close to the top surface"
  const full = t.word("full", 1); // "…and full of chloroplasts."
  const most = t.cue("most"); // "So they absorb the most light."
  const absorbMost = t.word("absorb", 2);
  const mostPs = t.word("most", 4); // "This is where most photosynthesis happens."
  const happens = t.wordEnd("happens", 2);
  return {
    leaf,
    inLeaves,
    adapted,
    broadThin,
    broad,
    area,
    large,
    absorb,
    thin,
    short,
    distance,
    carbon,
    diffuse,
    inside,
    slice,
    cut,
    section,
    crossSection,
    dicot,
    dicotGloss,
    seeds,
    two,
    simplified,
    simpWord,
    extendedLeaf,
    name,
    explaining,
    extWord,
    layers,
    layer,
    top,
    cuticle,
    waxy,
    cuticleWhy,
    reduces,
    loss,
    transparent,
    lightThrough,
    upper,
    upperWord,
    upperWhy,
    transparent2,
    noChloro,
    below,
    palisade,
    palWord,
    palisadeWhy,
    tall,
    tightly,
    close,
    full,
    most,
    absorbMost,
    mostPs,
    happens,
    // camera pushes (both are changes of scale)
    plantPush: [adapted - 8, Math.max(adapted + 30, broadThin - 4)] as const,
    cutDraw: cut - 4,
    sectionPush: [cut + 22, Math.max(cut + 64, Math.min(crossSection + 2, cut + 80))] as const,
    // the EXTENDED badge glides from the left column up into the section tag (it stays there for S09 and S10)
    badgeFly: [Math.max(layers - 4, extWord + 26), Math.max(layers - 4, extWord + 26) + 28] as const,
    end: t.dur,
  };
};

export const s09Sfx = (t: CueFns): SfxEvent[] => {
  const k = s09Timing(t);
  return [
    { frame: k.plantPush[0], sfx: "whoosh_zoom", gainDb: -10 }, // plant → one leaf
    { frame: k.broad, sfx: "ui_blip", gainDb: -11 }, // "broad": width arrow
    { frame: k.thin + 2, sfx: "whoosh_soft", gainDb: -11 }, // the leaf turns edge-on
    { frame: k.short, sfx: "ui_blip", gainDb: -11 }, // thickness bracket
    { frame: k.cut, sfx: "snip", gainDb: -8 }, // the leaf is cut open
    { frame: k.sectionPush[0], sfx: "whoosh_zoom", gainDb: -7 }, // push into the cut: the cross-section
    { frame: k.crossSection, sfx: "ui_blip", gainDb: -12 }, // "cross-section"
    { frame: k.two, sfx: "ui_blip", gainDb: -13 }, // the seedling's two seed leaves unfold
    { frame: k.name, sfx: "ui_blip", gainDb: -14 }, // "name: everyone"
    { frame: k.extWord, sfx: "ui_blip", gainDb: -11 }, // EXTENDED badge
    { frame: k.badgeFly[0], sfx: "whoosh_soft", gainDb: -15 }, // the badge moves up to the section tag
    { frame: k.waxy, sfx: "ui_blip", gainDb: -11 }, // label: waxy cuticle
    { frame: k.upperWord, sfx: "ui_blip", gainDb: -11 }, // label: upper epidermis
    { frame: k.palWord, sfx: "ui_blip", gainDb: -11 }, // label: palisade mesophyll
    { frame: k.mostPs, sfx: "ui_blip", gainDb: -12 }, // "most photosynthesis"
  ];
};
