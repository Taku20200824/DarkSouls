/** Runs once when the Next server starts. The desktop build uses it to sync saves in the background. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.LORDRAN_DESKTOP !== "1") return;
  const { startDesktopAutoSync } = await import("./lib/server/desktop-autosync");
  startDesktopAutoSync();
}
