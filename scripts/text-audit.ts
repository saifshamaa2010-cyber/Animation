/**
 * Text QA: render frames with the composition's `audit` prop on and list every visible piece of
 * text that breaks the channel rules — smaller than 40 px, outside the 100 px safe area, or cut
 * off by the frame edge. Text that is fading (opacity < 0.35) or blurred by a transition is ignored.
 *
 *   npx tsx scripts/text-audit.ts <compositionId> <frames> [outFile]
 *     <frames>: "0,30,90" | "every:N" | "count:N"
 *
 * Example: npx tsx scripts/text-audit.ts ep001 every:15 out/ep001-enzymes/text-audit.md
 */
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const PREINSTALLED = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const MIN_PX = 40;
const SAFE = 100;
const TOL = 12; // text boxes include the full line height, so allow a little slack
const W = 1920;
const H = 1080;

type Item = { text: string; px: number; opacity: number; blur: boolean; box: [number, number, number, number] };
type Hit = { text: string; problem: string; detail: string; frames: number[] };

const main = async () => {
  const [id, spec, outArg] = process.argv.slice(2);
  if (!id || !spec) {
    console.log("usage: npx tsx scripts/text-audit.ts <compositionId> <0,30,90|every:N|count:N> [outFile]");
    process.exit(1);
  }
  const root = path.resolve(__dirname, "..");
  const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
  const browserExecutable = process.env.REMOTION_BROWSER ?? (existsSync(PREINSTALLED) ? PREINSTALLED : null);
  const browser = await openBrowser("chrome", { browserExecutable });
  const base = await selectComposition({ serveUrl, id, puppeteerInstance: browser, browserExecutable });
  const inputProps = { ...base.defaultProps, audit: true };
  const comp = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, browserExecutable });
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

  // Scene lookup for the whole-episode composition (absolute frames → scene id).
  const tlPath = path.join(root, "episodes/ep001-enzymes/build/timeline.json");
  const tl = existsSync(tlPath) ? JSON.parse(readFileSync(tlPath, "utf8")) : null;
  const sceneOf = (f: number) =>
    id === "ep001" && tl ? (tl.scenes.find((s: { startFrame: number; endFrame: number }) => f >= s.startFrame && f < s.endFrame)?.id ?? "?") : id;

  const hits = new Map<string, Hit>();
  const add = (scene: string, text: string, problem: string, detail: string, frame: number) => {
    const key = `${scene}|${text}|${problem}`;
    const h = hits.get(key) ?? { text: `${scene}  "${text}"`, problem, detail, frames: [] };
    h.frames.push(frame);
    if (problem === "small" && Number(detail) < Number(h.detail)) h.detail = detail;
    hits.set(key, h);
  };

  const tmp = path.join(os.tmpdir(), `text-audit-${process.pid}.jpg`);
  for (const frame of frames) {
    const got: { items: Item[] } = { items: [] };
    await renderStill({
      serveUrl, composition: comp, frame, output: tmp, imageFormat: "jpeg", jpegQuality: 30, scale: 0.25,
      inputProps, puppeteerInstance: browser, browserExecutable, overwrite: true, logLevel: "error",
      onBrowserLog: (log) => {
        const m = log.text.match(/^TEXTAUDIT (.*)$/s);
        if (m) got.items = (JSON.parse(m[1]) as { items: Item[] }).items;
      },
    });
    const scene = sceneOf(frame);
    for (const it of got.items) {
      if (it.opacity < 0.35 || it.blur) continue;
      const [l, t, r, b] = it.box;
      if (it.px < MIN_PX - 0.5) add(scene, it.text, "small", String(it.px), frame);
      if (r <= 0 || b <= 0 || l >= W || t >= H) continue; // fully off-screen: not visible
      if (l < 0 || t < 0 || r > W || b > H) add(scene, it.text, "cut by frame edge", `box ${it.box.join(",")}`, frame);
      else if (l < SAFE - TOL || t < SAFE - TOL || r > W - SAFE + TOL || b > H - SAFE + TOL) add(scene, it.text, "outside safe area", `box ${it.box.join(",")}`, frame);
    }
    process.stdout.write(`.${frame}`);
  }
  await browser.close({ silent: true });
  // Each bundle copies public/ (hundreds of MB), so never leave it behind in /tmp.
  rmSync(serveUrl, { recursive: true, force: true });

  const rows = [...hits.values()].sort((a, b) => a.frames[0] - b.frames[0]);
  const fmt = (fs: number[]) => (fs.length > 6 ? `${fs.slice(0, 6).join(", ")} … (${fs.length} frames)` : fs.join(", "));
  const lines = [
    `# Text audit: ${id} (${frames.length} frames checked, ${spec})`,
    "",
    `Rules: text ≥ ${MIN_PX} px, inside the ${SAFE} px safe area, never cut by the frame. Fading (opacity < 0.35) and transition-blurred text is ignored.`,
    "",
    rows.length ? "| Text | Problem | Detail | Frames |\n|---|---|---|---|" : "No problems found.",
    ...rows.map((h) => `| ${h.text.replace(/\|/g, "\\|")} | ${h.problem} | ${h.problem === "small" ? `${h.detail} px` : h.detail} | ${fmt(h.frames)} |`),
  ];
  const out = path.resolve(outArg ?? `out/qa/text-audit-${id}.md`);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, lines.join("\n") + "\n");
  console.log(`\n${rows.length} problems → ${out}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
