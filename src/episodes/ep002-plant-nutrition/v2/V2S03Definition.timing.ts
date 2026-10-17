import type { CueFns } from "../../../lib/cues";
import { s03Timing } from "../scenes/S03Definition.timing";

/**
 * EP002 v2 · S03 key moments (shared by the animation and its sound effects). v1's beats plus the
 * spoken words the notebook version writes or marks on. Pure TS (also evaluated in Node).
 */
export const v2s03Timing = (t: CueFns) => {
  const k = s03Timing(t);
  return {
    ...k,
    you: t.word("you", 1), // "You eat to get your food."
    youFood: t.word("food", 1),
    youFoodEnd: t.wordEnd("food", 1),
    dont: t.word("don't", 1),
    makeEnd: t.wordEnd("make", 1),
    foodEnd: t.wordEnd("food", 2),
    photo: t.word("photosynthesis", 1), // "…by photosynthesis."
    photoEnd: t.wordEnd("photosynthesis", 1),
    learn: t.word("learn", 1), // "Learn it word for word."
    wfwEnd: t.wordEnd("word", 2),
    defEnd: t.wordEnd("light", 1), // end of the definition as read
    synEnd: t.wordEnd("synthesise", 2), // "Synthesise means make."
    make2: t.word("make", 2),
    make2End: t.wordEnd("make", 2),
    carbWord: t.word("carbohydrate", 1), // "The carbohydrate it makes is glucose, a simple sugar."
    carbEnd: t.wordEnd("carbohydrate", 1),
    glucoseEnd: t.wordEnd("glucose", 1),
    aWord: t.word("a", 1),
    sugarEnd: t.wordEnd("sugar", 1),
    raw2: t.word("raw", 2), // "The raw materials are carbon dioxide and water."
    materials2End: t.wordEnd("materials", 2),
    co2End: t.wordEnd("dioxide", 1),
    and: t.word("and", 1),
    waterEnd: t.wordEnd("water", 1),
    light2End: t.wordEnd("light", 2), // "…comes from light."
  };
};
