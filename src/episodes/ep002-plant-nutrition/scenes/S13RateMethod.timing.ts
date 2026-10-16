import type { CueFns, SfxEvent } from "../../../lib/cues";

/** S13 key moments, derived from the narration (shared by the animation and the sound effects). */
export const s13Timing = (t: CueFns) => {
  // ---- what "rate" means
  const rate = t.cue("rate");
  const howFast = t.word("how", 1); // "how fast is photosynthesis happening?"
  const rateWord = t.word("rate", 1); // "That's its rate."
  // ---- the pondweed in water + sodium hydrogencarbonate
  const pondweed = t.cue("pondweed");
  const pondweedWord = t.word("pondweed", 1);
  const waterPlant = t.word("water", 1); // "a water plant"
  const setup = t.cue("setup");
  const sodium = t.word("sodium", 1);
  const supplies = t.word("supplies", 1);
  const co2Word = t.word("carbon", 1); // "…supplies carbon dioxide"
  // ---- bubbles of (mostly) oxygen, in the light
  const bubbles = t.cue("bubbles");
  const light = t.word("light", 1); // "In the light"
  const gives = t.word("gives", 1); // "gives off bubbles"
  const mostly = t.word("mostly", 1);
  // ---- measuring: count, or collect the gas
  const count = t.cue("count");
  const perMinute = t.word("per", 1);
  const syringe = t.cue("syringe"); // "Or, for more accurate results…"
  const collect = t.word("collect", 1);
  const volume = t.word("volume", 1);
  const sizes = t.word("different", 1); // "…bubbles can be different sizes"
  // ---- the lamp: distance → light intensity
  const lamp = t.cue("lamp");
  const closer1 = t.word("closer", 1); // "move a lamp closer"
  const further = t.word("further", 1); // "or further away"
  const closer2 = t.word("closer", 2); // "The closer the lamp, the higher the light intensity"
  const higher = t.word("higher", 1);
  // ---- variables
  const variables = t.cue("variables");
  const lightIV = t.word("light", 4); // "So, light intensity is the independent variable"
  const independent = t.word("independent", 1);
  const youChange = t.word("change", 2); // "…the one you change"
  const dependentCue = t.cue("dependent");
  const rate2 = t.word("rate", 2); // "The rate is the dependent variable"
  const dependent = t.word("dependent", 1);
  const youMeasure = t.word("measure", 3); // "…the one you measure"
  const constant = t.cue("constant");
  const kept = t.word("kept", 1);
  const samePlant = t.word("plant", 2);
  const sameCo2 = t.word("carbon", 2);
  const sameTemp = t.word("temperature", 1);
  const noLights = t.word("no", 1); // "…and no other lights on"
  // ---- water bath: keeps the temperature steady
  const waterBath = t.cue("waterBath"); // "To keep the temperature steady"
  const stand = t.word("stand", 1); // "stand the beaker in a water bath"
  const bathWord = t.word("bath", 1);
  const led = t.cue("led");
  const lessHeat = t.word("less", 1);
  // ---- method: wait at each new distance, repeat → mean
  const acclimatise = t.cue("acclimatise");
  const newDistance = t.word("distance", 1);
  const wait = t.word("wait", 1);
  const adjust = t.word("adjust", 1);
  const repeat = t.cue("repeat");
  const repeatWord = t.word("repeat", 1);
  const mean = t.word("mean", 1);
  // ---- the other two factors, one at a time
  const otherFactors = t.cue("otherFactors");
  const twoFactors = t.word("factors", 1); // "test the other two factors"
  const oneThing = t.word("just", 1); // "Just change one thing at a time"
  const co2Method = t.cue("co2Method"); // "To vary carbon dioxide…"
  const concentrations = t.word("concentrations", 1);
  const sodium2 = t.word("sodium", 2); // "…of sodium hydrogencarbonate"
  const tempMethod = t.cue("tempMethod"); // "To vary temperature…"
  const setBath = t.word("set", 1); // "set the water bath"
  const temps = t.word("different", 3); // "to different temperatures"
  return {
    rate,
    howFast,
    rateWord,
    pondweed,
    pondweedWord,
    waterPlant,
    setup,
    sodium,
    supplies,
    co2Word,
    bubbles,
    light,
    gives,
    mostly,
    count,
    perMinute,
    syringe,
    collect,
    volume,
    sizes,
    lamp,
    closer1,
    further,
    closer2,
    higher,
    variables,
    lightIV,
    independent,
    youChange,
    dependentCue,
    rate2,
    dependent,
    youMeasure,
    constant,
    kept,
    samePlant,
    sameCo2,
    sameTemp,
    noLights,
    waterBath,
    stand,
    bathWord,
    led,
    lessHeat,
    acclimatise,
    newDistance,
    wait,
    adjust,
    repeat,
    repeatWord,
    mean,
    otherFactors,
    twoFactors,
    oneThing,
    co2Method,
    concentrations,
    sodium2,
    tempMethod,
    setBath,
    temps,
    end: t.dur,
  };
};

export const s13Sfx = (t: CueFns): SfxEvent[] => {
  const k = s13Timing(t);
  return [
    { frame: k.rateWord, sfx: "ui_blip", gainDb: -10 }, // "rate" = how fast
    { frame: k.pondweedWord, sfx: "whoosh_soft", gainDb: -13 }, // pondweed goes into the water
    { frame: k.sodium + 8, sfx: "ui_blip", gainDb: -13 }, // a little sodium hydrogencarbonate
    { frame: k.gives, sfx: "bubbles", gainDb: -9 }, // first bubbles from the cut end
    { frame: k.count, sfx: "tick", gainDb: -11 }, // the counter starts
    { frame: k.collect, sfx: "whoosh_soft", gainDb: -13 }, // funnel + gas syringe
    { frame: k.volume, sfx: "ui_blip", gainDb: -11 }, // measure the volume
    { frame: k.closer1, sfx: "whoosh_soft", gainDb: -15 }, // the lamp moves
    { frame: k.closer2, sfx: "bubbles", gainDb: -9 }, // closer lamp: bubbles come faster
    { frame: k.independent, sfx: "ui_blip", gainDb: -10 }, // independent variable
    { frame: k.dependent, sfx: "ui_blip", gainDb: -10 }, // dependent variable
    { frame: k.kept, sfx: "card_in", gainDb: -13 }, // kept constant
    { frame: k.sameTemp, sfx: "ui_blip", gainDb: -12 }, // thermometer goes in
    { frame: k.noLights, sfx: "whoosh_soft", gainDb: -17 }, // the room lights go down
    { frame: k.stand, sfx: "whoosh_soft", gainDb: -14 }, // the water bath goes round the beaker
    { frame: k.bathWord, sfx: "ui_blip", gainDb: -12 }, // "water bath: steady temperature"
    { frame: k.led, sfx: "ui_blip", gainDb: -11 }, // LED
    { frame: k.newDistance, sfx: "whoosh_soft", gainDb: -15 }, // new distance
    { frame: k.wait, sfx: "tick", gainDb: -11 }, // wait a few minutes
    { frame: k.repeatWord, sfx: "card_in", gainDb: -13 }, // repeats
    { frame: k.mean, sfx: "ui_blip", gainDb: -9 }, // → mean
    { frame: k.oneThing, sfx: "card_in", gainDb: -12 }, // "change one thing at a time"
    { frame: k.co2Method + 4, sfx: "whoosh_soft", gainDb: -13 }, // three set-ups slide in
    { frame: k.concentrations, sfx: "pop_bind", gainDb: -14 }, // more dissolved carbon dioxide, beaker by beaker
    { frame: k.tempMethod + 4, sfx: "whoosh_soft", gainDb: -15 }, // carbon dioxide evens out
    { frame: k.temps, sfx: "tick", gainDb: -11 }, // the baths go to three temperatures
  ];
};
