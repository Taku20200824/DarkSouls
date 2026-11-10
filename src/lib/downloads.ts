/**
 * Desktop app installer, built by `npm run dist:win` and uploaded to the project's
 * public Vercel Blob store together with electron-updater's `latest.yml`.
 *
 * The site never hard-codes the current version: `/download` and
 * `/api/desktop/latest` read `latest.yml` (the same manifest installed apps poll
 * for auto-update), so uploading a new release is all it takes for the site to
 * offer it. FALLBACK_* is only used if the manifest can't be fetched.
 */
export const DESKTOP_BLOB_BASE = "https://bpcne2nkaruzhq1b.public.blob.vercel-storage.com/";
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

const FALLBACK_VERSION = "0.1.4";
const FALLBACK_FILE = `Lordran-Tracker-Setup-${FALLBACK_VERSION}.exe`;

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
    const res = await fetch(`${DESKTOP_BLOB_BASE}latest.yml`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const parsed = parseLatestYml(await res.text());
      if (parsed) return { version: parsed.version, url: DESKTOP_BLOB_BASE + encodeURIComponent(parsed.path), releaseDate: parsed.releaseDate, fromManifest: true };
    }
  } catch {
    // Offline (e.g. the desktop app without network) or Blob unavailable: use the fallback.
  }
  return { version: FALLBACK_VERSION, url: DESKTOP_BLOB_BASE + FALLBACK_FILE, releaseDate: null, fromManifest: false };
}
