import "server-only";
import { CLOUD_SITE_URL, type DesktopCloudState } from "@/lib/desktop-cloud";
import type { SyncPayload } from "@/lib/save/schema";
import type { Store } from "./store";

export interface CloudLink extends DesktopCloudState {
  token: string;
  syncedSaveAt?: number;
  syncedParser?: string;
  /** After a failed upload, the next attempt waits until this time. */
  retryAt?: number;
}

export const UPLOAD_RETRY_MS = 30_000;

export const cloudLinkPath = (steamId: string) => `users/${steamId}/meta/desktopCloud`;

// Pairing, unlinking, the page's save poll and the background sync (instrumentation.ts)
// share the same local connection record. Next bundles instrumentation separately from
// the route handlers, so the lock lives on globalThis to be one map for both.
const LOCKS = Symbol.for("lordran.desktopLocks");
const lockHolder = globalThis as { [LOCKS]?: Map<string, Promise<unknown>> };
const active = (lockHolder[LOCKS] ??= new Map<string, Promise<unknown>>());
export async function withDesktopLock<T>(steamId: string, operation: () => Promise<T>): Promise<T> {
  const next = (active.get(steamId) ?? Promise.resolve()).catch(() => {}).then(operation);
  active.set(steamId, next);
  try {
    return await next;
  } finally {
    if (active.get(steamId) === next) active.delete(steamId);
  }
}

export function cloudRequest(endpoint: "pair" | "sync", options: RequestInit): Promise<Response> {
  return fetch(`${CLOUD_SITE_URL}/api/companion/${endpoint}`, {
    ...options, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
  });
}

export async function revokeCloudLink(token: string) {
  const response = await cloudRequest("pair", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  return response?.ok || response?.status === 401;
}

export async function uploadDesktopSave(store: Store, steamId: string, link: CloudLink, payload: SyncPayload) {
  const response = await cloudRequest("sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${link.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
  const receipt = response?.ok ? await response.json().catch(() => null) : null;
  const docPath = cloudLinkPath(steamId);
  if (receipt?.ok === true) {
    await store.set(docPath, {
      syncedSaveAt: payload.saveModifiedAt, syncedParser: payload.parserVersion, lastSyncedAt: Date.now(), error: null,
      lastResult: receipt.unchanged === true ? "unchanged" : "stored",
    }, true);
    return true;
  }
  if (response && !response.ok) console.error("cloud upload rejected", response.status);
  const error = response?.status === 401 ? "invalid_token" : "upload_failed";
  // Offline or a website outage: wait a little before the next attempt instead of every poll.
  await store.set(docPath, { error, retryAt: Date.now() + UPLOAD_RETRY_MS }, true);
  return link.error !== error;
}
