/** Runs once when the Next server starts. The desktop build uses it to sync saves in the background. */
export async function register() {
  // Written exactly this way so webpack drops the import from the edge bundle
  // (firebase-admin, reached through the store, can't be bundled for the edge runtime).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.LORDRAN_DESKTOP !== "1") return;
    const { startDesktopAutoSync } = await import("./lib/server/desktop-autosync");
    startDesktopAutoSync();
  }
}
