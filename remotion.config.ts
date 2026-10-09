/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// In the cloud build container Remotion can't download its own Chrome, so use the
// preinstalled headless shell. On your own computer this path doesn't exist and
// Remotion downloads Chrome automatically.
const preinstalled = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browser = process.env.REMOTION_BROWSER ?? (existsSync(preinstalled) ? preinstalled : null);
if (browser) {
  Config.setBrowserExecutable(browser);
}
