// electron-builder's automatic "node modules collector" (used for @electron/rebuild
// bookkeeping) walks up from electron/ — which has no node_modules of its own — to the
// project root and force-includes the *entire* web app's node_modules into the package,
// while separately failing to carry over the Next.js standalone server's own already-
// traced node_modules via extraResources. Rather than fight that, this hook takes over
// placement of resources/app-server by hand: delete whatever got auto-collected, then
// copy .next/standalone verbatim.
const fs = require("node:fs");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const projectRoot = path.join(__dirname, "..");
  const resourcesDir = path.join(context.appOutDir, "resources");

  // resources/app/ is the real Electron entry point (main.js + package.json) — keep it,
  // just strip the node_modules electron-builder mistakenly collected into it.
  const bogusModules = path.join(resourcesDir, "app", "node_modules");
  if (fs.existsSync(bogusModules)) fs.rmSync(bogusModules, { recursive: true, force: true });

  const appServer = path.join(resourcesDir, "app-server");
  fs.rmSync(appServer, { recursive: true, force: true });
  fs.cpSync(path.join(projectRoot, ".next", "standalone"), appServer, { recursive: true });

  console.log(`[after-pack] placed Next.js standalone server at ${appServer}`);
};
