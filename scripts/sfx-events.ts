/**
 * Evaluate every scene's sound-effect list against the real narration timeline and write
 * episodes/<id>/build/sfx-events.json — absolute times the Python mixer places SFX at.
 *
 *   npx tsx scripts/sfx-events.ts ep001-enzymes
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cueFns, type Timeline } from "../src/lib/cues";

const ep = process.argv[2] ?? "ep001-enzymes";
const root = path.resolve(__dirname, "..");

const main = async () => {
  const tl = JSON.parse(readFileSync(path.join(root, "episodes", ep, "build", "timeline.json"), "utf8")) as Timeline;
  const { SCENE_SFX } = await import(path.join(root, "src", "episodes", ep, "scenes", "sfx.ts"));
  const events: { sec: number; sfx: string; gainDb: number; scene: string }[] = [];
  for (const scene of tl.scenes) {
    const fn = SCENE_SFX[scene.id];
    if (!fn) continue;
    const t = cueFns(scene, tl.words, tl.fps);
    for (const e of fn(t)) {
      events.push({ sec: +((scene.startFrame + e.frame) / tl.fps).toFixed(3), sfx: e.sfx, gainDb: e.gainDb ?? 0, scene: scene.id });
    }
  }
  events.sort((a, b) => a.sec - b.sec);
  const out = path.join(root, "episodes", ep, "build", "sfx-events.json");
  writeFileSync(out, JSON.stringify({ episode: ep, events }, null, 1));
  console.log(`${events.length} sound effects → ${path.relative(root, out)}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
