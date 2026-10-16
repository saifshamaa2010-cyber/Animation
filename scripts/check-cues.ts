/**
 * Check one scene's timing against the narration: every key its timing function returns, the frame it
 * resolves to, and the words being spoken there (so a `t.word("light", 3)` that now points at the
 * wrong "light" after a script edit is obvious at a glance).
 *
 *   npx tsx scripts/check-cues.ts ep002-plant-nutrition S12
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { cueFns, type Timeline } from "../src/lib/cues";

const [ep, sid] = process.argv.slice(2);
if (!ep || !sid) {
  console.log("usage: npx tsx scripts/check-cues.ts <episode-id> <scene-id, e.g. S12>");
  process.exit(1);
}
const root = path.resolve(__dirname, "..");

const main = async () => {
  const tl = JSON.parse(readFileSync(path.join(root, "episodes", ep, "build", "timeline.json"), "utf8")) as Timeline;
  const scene = tl.scenes.find((s) => s.id === sid);
  if (!scene) throw new Error(`No scene ${sid} in the timeline`);
  const dir = path.join(root, "src", "episodes", ep, "scenes");
  const file = readdirSync(dir).find((f) => f.startsWith(sid) && f.endsWith(".timing.ts"));
  if (!file) throw new Error(`No ${sid}*.timing.ts in ${dir}`);
  const mod = await import(path.join(dir, file));
  const fn = mod[`${sid.toLowerCase()}Timing`] as ((t: ReturnType<typeof cueFns>) => Record<string, unknown>) | undefined;
  if (!fn) throw new Error(`${file} has no export ${sid.toLowerCase()}Timing`);
  const words = tl.words.filter((w) => w.scene === sid);
  const t = cueFns(scene, tl.words, tl.fps);
  const keys = fn(t);
  const say = (frame: number) => {
    const sec = (scene.startFrame + frame) / tl.fps;
    let i = words.findIndex((w) => w.startSec >= sec - 0.12);
    if (i < 0) i = words.length;
    return `${words.slice(Math.max(0, i - 3), i).map((w) => w.text).join(" ")} ▸ ${words.slice(i, i + 4).map((w) => w.text).join(" ")}`;
  };
  console.log(`${sid}: ${scene.endFrame - scene.startFrame} frames; cues: ${Object.keys(scene.cues).join(", ")}\n`);
  for (const [k, v] of Object.entries(keys)) {
    const vals = Array.isArray(v) ? v : [v];
    for (const [j, x] of vals.entries()) {
      if (typeof x !== "number") continue;
      console.log(`${(Array.isArray(v) ? `${k}[${j}]` : k).padEnd(22)} ${String(x).padStart(5)}  ${say(x)}`);
    }
  }
};

main().catch((e) => {
  console.error(`ERROR: ${(e as Error).message}`);
  process.exit(1);
});
