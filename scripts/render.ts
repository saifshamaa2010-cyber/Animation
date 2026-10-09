/**
 * Render the final episode MP4 with the mixed soundtrack, plus the deliverables folder.
 *
 *   npm run render -- ep001-enzymes
 *
 * Output (out/<id>/): <id>.mp4 · <id>-narration.wav · <id>.srt · <id>-thumbnail.png
 * Encoding: H.264 at high quality (YouTube re-encodes everything, so we upload generously),
 * AAC 320 kbps, 30 fps, 1920×1080.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const ep = process.argv[2] ?? "ep001-enzymes";
const comp = { "ep001-enzymes": "ep001" }[ep] ?? ep;
const root = path.resolve(__dirname, "..");
const out = path.join(root, "out", ep);
mkdirSync(out, { recursive: true });

const mix = `episodes/${ep}/mix.wav`;
const audio = existsSync(path.join(root, "public", mix)) ? mix : `episodes/${ep}/narration.wav`;
if (!audio.endsWith("mix.wav")) console.warn("⚠ No mix.wav yet (run npm run audio) — rendering with bare narration.");

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: "inherit", cwd: root });

run("npx", [
  "remotion", "render", comp, path.join(out, `${ep}.mp4`),
  `--props=${JSON.stringify({ audio })}`,
  "--codec=h264", "--crf=16", "--x264-preset=slow", "--audio-codec=aac", "--audio-bitrate=320k",
  "--pixel-format=yuv420p", "--concurrency=4",
]);

// Deliverables next to the video.
copyFileSync(path.join(root, "public", "episodes", ep, "narration.wav"), path.join(out, `${ep}-narration.wav`));
copyFileSync(path.join(root, "episodes", ep, "build", `${ep}.srt`), path.join(out, `${ep}.srt`));
run("npx", ["remotion", "still", `${comp}-thumbnail`, path.join(out, `${ep}-thumbnail.png`)]);
console.log(`\nDone → ${path.relative(root, out)}/`);
