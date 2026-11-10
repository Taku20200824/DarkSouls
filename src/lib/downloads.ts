/**
 * Desktop app installer, built by `npm run dist:win` and attached — with
 * electron-updater's `latest.yml` and the .blockmap — to a GitHub Release of the
 * public repo (tag `v<version>`).
 *
 * The site never hard-codes the current version: `/download` and
 * `/api/desktop/latest` read the newest release's `latest.yml` (the same manifest
 * installed apps poll for auto-update), so publishing a release is all it takes for
 * the site to offer it. The github.com/…/releases/latest/download/<file> URL is a
 * plain redirect, not the rate-limited REST API. If it can't be read, the button
 * falls back to the Releases page.
 */
export const DESKTOP_REPO = "Taku20200824/DarkSouls";
const RELEASES = `https://github.com/${DESKTOP_REPO}/releases`;
export const DESKTOP_DOWNLOAD_PATH = "/download";

/** True in the Electron desktop build (set at build time in next.config.ts). */
export const IS_DESKTOP_BUILD = process.env.NEXT_PUBLIC_DESKTOP_BUILD === "1";

/** -1 / 0 / 1 comparing dotted numeric versions ("0.1.10" > "0.1.9"). */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const pb = b.split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

/** `version` is "" when the manifest couldn't be read (then `url` is the Releases page). */
export type DesktopRelease = { version: string; url: string; releaseDate: string | null; fromManifest: boolean };

/** Parses the top-level `version`, `path` and `releaseDate` of an electron-builder latest.yml. */
export function parseLatestYml(text: string): { version: string; path: string; releaseDate: string | null } | null {
  const field = (key: string) => text.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, "m"))?.[1] ?? null;
  const version = field("version");
  const path = field("path");
  if (!version || !path || !/^\d+\.\d+\.\d+/.test(version) || path.includes("/") || path.includes("..")) return null;
  return { version, path, releaseDate: field("releaseDate") };
}

/** Server-only: the newest published installer, re-checked at most once a minute. */
export async function latestDesktopRelease(): Promise<DesktopRelease> {
  try {
    const res = await fetch(`${RELEASES}/latest/download/latest.yml`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const parsed = parseLatestYml(await res.text());
      if (parsed) {
        // Same release the manifest came from, whatever its tag is called ("v0.1.9" or "0.1.9").
        const url = `${RELEASES}/latest/download/${encodeURIComponent(parsed.path)}`;
        return { version: parsed.version, url, releaseDate: parsed.releaseDate, fromManifest: true };
      }
    }
  } catch {
    // Offline (e.g. the desktop app without network) or GitHub unavailable.
  }
  return { version: "", url: `${RELEASES}/latest`, releaseDate: null, fromManifest: false };
}
