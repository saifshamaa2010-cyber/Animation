import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Lexend (SIL Open Font Licence) was designed to improve reading proficiency —
// a good fit for a study channel. Bundled locally so renders never depend on the network.
export const FONT = "Lexend";

for (const weight of ["400", "500", "600", "700"]) {
  loadFont({
    family: FONT,
    url: staticFile(`fonts/lexend-latin-${weight}-normal.woff2`),
    weight,
  });
}

// Caveat (SIL Open Font Licence): a handwriting face for notes, sticky notes and teacher-style annotations.
export const HAND = "Caveat";

for (const weight of ["600", "700"]) {
  loadFont({
    family: HAND,
    url: staticFile(`fonts/caveat-latin-${weight}-normal.woff2`),
    weight,
  });
}
