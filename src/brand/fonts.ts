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
