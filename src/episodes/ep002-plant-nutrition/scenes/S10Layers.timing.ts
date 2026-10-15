import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S10 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s10Timing = (t: CueFns) => {
  // ---- spongy mesophyll and air spaces
  const spongy = t.cue("spongy");
  const spongyWord = t.word("spongy", 1);
  const spongyWhy = t.cue("spongyWhy");
  const rounder = t.word("rounder", 1);
  const loosely = t.word("loosely", 1);
  const air = t.cue("air");
  const airWord = t.word("air", 1);
  const diffuse = t.cue("diffuse");
  const carbon = t.word("carbon", 1);
  const toCells = t.word("cells", 2); // "…diffuse to the cells,"
  const large = t.word("large", 1); // "…a large surface area for gas exchange."
  const exchange = t.word("exchange", 1);
  // ---- vascular bundle
  const bundle = t.cue("bundle");
  const vascular = t.word("vascular", 1);
  const xylem = t.cue("xylem");
  const xylemWord = t.word("xylem", 1);
  const water = t.word("water", 1);
  const ions = t.word("ions", 1);
  const phloem = t.cue("phloem");
  const phloemWord = t.word("phloem", 1);
  const sucrose = t.word("sucrose", 1);
  const amino = t.word("amino", 1);
  const away = t.word("away", 1);
  const plant = t.word("plant", 1); // "…to the rest of the plant."
  // ---- lower epidermis, stomata, guard cells
  const lower = t.cue("lower");
  const lowerWord = t.word("lower", 1);
  const stomata = t.cue("stomata");
  const pores = t.word("pores", 1);
  const stomataWord = t.word("stomata", 1);
  const onePore = t.word("one", 1); // "One pore is called a stoma."
  const gases = t.cue("gases");
  const diffusesIn = t.word("diffuses", 1);
  const oxygen = t.word("oxygen", 1);
  const out = t.word("out", 1);
  const guard = t.cue("guard");
  const opened = t.word("opened", 1);
  const closed = t.word("closed", 1);
  const guardWord = t.word("guard", 1);
  // ---- recap, top to bottom, in time with the list
  const recap = t.cue("recap");
  const rCuticle = t.word("cuticle", 1);
  const rUpper = t.word("upper", 1);
  const rPalisade = t.word("palisade", 2);
  const rSpongy = t.word("spongy", 2);
  const rBundle = t.word("vascular", 2);
  const rLower = t.word("lower", 2);
  const rStomata = t.word("stomata", 3);
  const rGuard = t.word("guard", 2);
  return {
    spongy,
    spongyWord,
    spongyWhy,
    rounder,
    loosely,
    air,
    airWord,
    diffuse,
    carbon,
    toCells,
    large,
    exchange,
    bundle,
    vascular,
    xylem,
    xylemWord,
    water,
    ions,
    phloem,
    phloemWord,
    sucrose,
    amino,
    away,
    plant,
    lower,
    lowerWord,
    stomata,
    pores,
    stomataWord,
    onePore,
    gases,
    diffusesIn,
    oxygen,
    out,
    guard,
    opened,
    closed,
    guardWord,
    recap,
    rCuticle,
    rUpper,
    rPalisade,
    rSpongy,
    rBundle,
    rLower,
    rStomata,
    rGuard,
    // camera: in to the stoma for the gases (×2), closer for the guard cells, back out for the recap
    zoomIn: [gases - 6, gases + 34] as const,
    zoomGuard: [guard - 4, guard + 30] as const,
    zoomOut: [recap - 2, Math.max(recap + 30, Math.min(recap + 46, rCuticle - 6))] as const,
    end: t.dur,
  };
};

export const s10Sfx = (t: CueFns): SfxEvent[] => {
  const k = s10Timing(t);
  return [
    { frame: k.spongyWord, sfx: "ui_blip", gainDb: -11 }, // label: spongy mesophyll
    { frame: k.airWord, sfx: "ui_blip", gainDb: -12 }, // air spaces tinted
    { frame: k.vascular, sfx: "ui_blip", gainDb: -11 }, // label: vascular bundle
    { frame: k.xylemWord, sfx: "ui_blip", gainDb: -12 }, // xylem
    { frame: k.phloemWord, sfx: "ui_blip", gainDb: -12 }, // phloem
    { frame: k.lowerWord, sfx: "ui_blip", gainDb: -11 }, // lower epidermis
    { frame: k.stomataWord, sfx: "ui_blip", gainDb: -11 }, // stomata
    { frame: k.zoomIn[0], sfx: "whoosh_zoom", gainDb: -9 }, // in to one stoma
    { frame: k.zoomGuard[0], sfx: "whoosh_soft", gainDb: -13 }, // closer: the guard cells
    { frame: k.opened, sfx: "tick", gainDb: -10 }, // stoma opens
    { frame: k.closed, sfx: "tock", gainDb: -10 }, // stoma closes
    { frame: k.guardWord, sfx: "ui_blip", gainDb: -11 }, // label: guard cells
    { frame: k.zoomOut[0], sfx: "whoosh_soft", gainDb: -10 }, // back out to the whole section
    { frame: k.rCuticle, sfx: "ui_blip", gainDb: -14 }, // recap: labels light top to bottom
    { frame: k.rSpongy, sfx: "ui_blip", gainDb: -14 },
    { frame: k.rLower, sfx: "ui_blip", gainDb: -14 },
    { frame: k.rGuard, sfx: "ui_blip", gainDb: -13 },
  ];
};
