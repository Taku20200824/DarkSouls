// Bundles electron/main.js (plus electron-updater and its deps) into one CJS file.
// electron-builder has a hard-coded `!**/node_modules/**` default ignore that an explicit
// `files` entry cannot override (see electron-builder.yml), so the shell can't ship a real
// node_modules folder — bundling sidesteps that entirely: the package ships one JS file.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const electronDir = join(dirname(fileURLToPath(import.meta.url)), "..", "electron");

await build({
  entryPoints: [join(electronDir, "main.js")],
  outfile: join(electronDir, "dist", "main.js"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["electron"],
  logLevel: "info",
});
