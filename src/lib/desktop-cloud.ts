export const CLOUD_SITE_URL = "https://darksouls-five.vercel.app";

export interface DesktopCloudState {
  lastSyncedAt?: number;
  error?: "account_save_not_found" | "invalid_token" | "upload_failed" | null;
  /** What the website did with the last upload: saved new progress, or confirmed it already had it. */
  lastResult?: "stored" | "unchanged";
}
