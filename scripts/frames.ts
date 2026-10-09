/**
 * Render a handful of frames from any composition (one bundle, one browser) and tile them into a
 * contact sheet with the frame number and time under each. Used for visual QA.
 *
 *   npx tsx scripts/frames.ts <compositionId> <frames> [outDir] [--cols=4] [--width=480]
 *     <frames>: "0,30,90"  or  "every:60"  or  "count:24"
 *
 * Example: npx tsx scripts/frames.ts ep001-S05 count:12 out/qa/S05
 */
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const PREINSTALLED = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

const main = async () => {
  const [id, spec, outArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const opt = (name: string, def: number) => {
    const a = process.argv.find((x) => x.startsWith(`--${name}=`));
    return a ? Number(a.split("=")[1]) : def;
  };
  if (!id || !spec) {
    console.log("usage: npx tsx scripts/frames.ts <compositionId> <0,30,90|every:N|count:N> [outDir]");
    process.exit(1);
  }
  const outDir = path.resolve(outArg ?? `out/qa/${id}`);
  mkdirSync(outDir, { recursive: true });
  const root = path.resolve(__dirname, "..");
  const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
  const browserExecutable = process.env.REMOTION_BROWSER ?? (existsSync(PREINSTALLED) ? PREINSTALLED : null);
  const browser = await openBrowser("chrome", { browserExecutable });
  const comp = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable });
  const n = comp.durationInFrames;
  let frames: number[];
  if (spec.startsWith("every:")) {
    const step = Number(spec.slice(6));
    frames = Array.from({ length: Math.ceil(n / step) }, (_, i) => i * step);
  } else if (spec.startsWith("count:")) {
    const c = Number(spec.slice(6));
    frames = Array.from({ length: c }, (_, i) => Math.round(((i + 0.5) * n) / c));
  } else {
    frames = spec.split(",").map(Number);
  }
  frames = frames.filter((f) => f >= 0 && f < n);
  const files: string[] = [];
  for (const frame of frames) {
    const output = path.join(outDir, `f${String(frame).padStart(5, "0")}.jpg`);
    await renderStill({ serveUrl, composition: comp, frame, output, imageFormat: "jpeg", jpegQuality: 88, puppeteerInstance: browser, browserExecutable, overwrite: true });
    files.push(output);
    process.stdout.write(`.${frame}`);
  }
  await browser.close({ silent: true });
  // Each bundle copies public/ (hundreds of MB), so never leave it behind in /tmp.
  rmSync(serveUrl, { recursive: true, force: true });
  console.log(`\n${files.length} frames → ${outDir}`);

  // Contact sheet: each frame labelled with its number and timestamp.
  const cols = opt("cols", 4);
  const w = opt("width", 480);
  const h = Math.round((w * comp.height) / comp.width);
  const labelled = files.map((f, i) => {
    const fr = frames[i];
    const t = (fr / comp.fps).toFixed(2);
    const o = f.replace(/\.jpg$/, "-l.jpg");
    execFileSync("ffmpeg", [
      "-loglevel", "error", "-y", "-i", f,
      "-vf", `scale=${w}:${h},pad=${w}:${h + 34}:0:0:color=0x08111E,drawtext=text='${id}  f${fr}  ${t}s':x=8:y=${h + 8}:fontsize=18:fontcolor=0xCFC8BC`,
      o,
    ]);
    return o;
  });
  if (labelled.length === 1) {
    execFileSync("cp", [labelled[0], path.join(outDir, "contact-sheet.jpg")]);
    console.log(`contact sheet → ${path.join(outDir, "contact-sheet.jpg")}`);
    return;
  }
  const rows = Math.ceil(labelled.length / cols);
  const sheet = path.join(outDir, "contact-sheet.jpg");
  const inputs = labelled.flatMap((f) => ["-i", f]);
  const pads = cols * rows - labelled.length;
  const blank = pads > 0 ? ["-f", "lavfi", "-i", `color=c=0x08111E:s=${w}x${h + 34}:d=1`] : [];
  const n2 = labelled.length + (pads > 0 ? 1 : 0);
  const layout = Array.from({ length: cols * rows }, (_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * (h + 34)}`).join("|");
  const streams = Array.from({ length: cols * rows }, (_, i) => (i < labelled.length ? `[${i}:v]` : `[${n2 - 1}:v]`)).join("");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...inputs, ...blank, "-filter_complex", `${streams}xstack=inputs=${cols * rows}:layout=${layout}`, "-frames:v", "1", "-q:v", "3", sheet]);
  console.log(`contact sheet → ${sheet}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
