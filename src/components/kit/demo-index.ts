// Entry point for rendering the kit QA sheet on its own:
//   npx remotion still src/components/kit/demo-index.ts kit-demo /tmp/kit-demo.png
import { registerRoot } from "remotion";
import { RemotionRoot } from "./demo-root";

registerRoot(RemotionRoot);
