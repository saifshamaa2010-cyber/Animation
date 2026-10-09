import { useId } from "react";

/** SVG-safe unique id (React ids contain characters that break url(#…)). */
export const useSvgId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
