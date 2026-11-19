import "server-only";
import { cloudLinkPath, withDesktopLock, type CloudLink } from "./desktop-cloud";
import { syncDesktopSave } from "./desktop-sync";
import { isDesktopApp } from "./env";
import { getStore, type Store } from "./store";

/**
 * Desktop build: the local server itself pushes the save to the website (Firestore) for
 * every account linked by a Steam sign-in, on a timer. Before this, uploads only ran
 * while the app's page was loaded and signed in, because the page drove the polling.
 */
export const AUTO_SYNC_MS = 10_000;

/** Runs one sync pass over every account that has a web link. Returns the accounts tried. */
export async function syncLinkedAccounts(store: Store, roots?: string[]): Promise<string[]> {
  const users = await store.list<Record<string, unknown>>("users");
  const tried: string[] = [];
  for (const { id: steamId } of users) {
    if (!/^\d{17}$/.test(steamId)) continue;
    const link = await store.get<CloudLink>(cloudLinkPath(steamId));
    if (!link?.token) continue;
    tried.push(steamId);
    try {
      await withDesktopLock(steamId, () => syncDesktopSave(steamId, store, Date.now(), roots));
    } catch (e) {
      console.error("background desktop sync failed", e);
    }
  }
  return tried;
}

const STARTED = Symbol.for("lordran.desktopAutoSync");

/** Starts the background loop once per server process (desktop build only). */
export function startDesktopAutoSync() {
  const g = globalThis as { [STARTED]?: boolean };
  if (g[STARTED] || !isDesktopApp()) return;
  let store: Store;
  try {
    store = getStore();
  } catch {
    return;
  }
  if (store.kind !== "dev-file") return;
  g[STARTED] = true;
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await syncLinkedAccounts(store);
    } catch (e) {
      console.error("background desktop sync failed", e);
    } finally {
      busy = false;
    }
  };
  setTimeout(tick, 2_000);
  setInterval(tick, AUTO_SYNC_MS);
}
