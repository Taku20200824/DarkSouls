import "server-only";
import { GAME_APPIDS } from "@/lib/games";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { getOwnedGames, getPublicAchievements, type OwnedGame } from "@/lib/steam/webapi";
import { cloudLinkPath, type CloudLink } from "./desktop-cloud";
import type { Store } from "./store";

/**
 * Which Souls games the signed-in Steam account owns ("verified" ownership), so the game
 * picker can show only what the player actually has. Stored at users/{id}/meta/library.
 */
export const libraryPath = (steamId: string) => `users/${steamId}/meta/library`;

export interface LibraryGame {
  /** null = Steam would not say (private game details, or the check failed for that game). */
  owned: boolean | null;
  playtimeMinutes?: number | null;
  lastPlayed?: number | null;
}

export interface LibraryDoc {
  /** ok: every game answered. private: the account hides its games. Otherwise why it failed. */
  status: "ok" | "private" | "partial" | "error";
  checkedAt: number;
  via?: "web_api" | "community" | "cloud";
  games: Record<string, LibraryGame>;
}

/**
 * Key-free fallback: a game whose public achievement page lists achievements is owned.
 * Slower (one request per game) and has no playtime, but needs no Steam API key.
 */
async function viaCommunity(steamId: string): Promise<Omit<LibraryDoc, "checkedAt">> {
  const answers = await Promise.all(GAME_APPIDS.map(async (appid) => [appid, await getPublicAchievements(steamId, undefined, appid)] as const));
  const games: Record<string, LibraryGame> = {};
  let unknown = 0;
  let privateCount = 0;
  for (const [appid, r] of answers) {
    if (r.ok) games[appid] = { owned: true };
    else if (r.reason === "not_owned") games[appid] = { owned: false };
    else {
      games[appid] = { owned: null };
      unknown++;
      if (r.reason === "private") privateCount++;
    }
  }
  const status = unknown === 0 ? "ok" : privateCount === unknown ? "private" : unknown === answers.length ? "error" : "partial";
  return { status, via: "community", games };
}

export async function checkLibrary(steamId: string): Promise<Omit<LibraryDoc, "checkedAt">> {
  const api = await getOwnedGames(steamId, GAME_APPIDS);
  if (api.ok && api.data) {
    const games: Record<string, LibraryGame> = {};
    for (const [appid, g] of Object.entries(api.data) as [string, OwnedGame][]) games[appid] = g;
    return { status: "ok", via: "web_api", games };
  }
  // No key, a rejected key or hidden game details: try the public pages.
  return viaCommunity(steamId);
}

/** Hosted site (has the Steam key): checks and stores the library. */
export async function syncLibrary(store: Store, steamId: string, now = Date.now()): Promise<LibraryDoc> {
  const doc: LibraryDoc = { ...(await checkLibrary(steamId)), checkedAt: now };
  await store.set(libraryPath(steamId), doc);
  return doc;
}

const LibraryReply = (v: unknown): v is { ok: true; library: LibraryDoc } => {
  const b = v as { ok?: unknown; library?: { status?: unknown; games?: unknown } } | null;
  return b?.ok === true && typeof b.library?.status === "string" && !!b.library.games && typeof b.library.games === "object";
};

/** Desktop build: asks the website (which has the Steam key) with the sign-in token. */
export async function syncLibraryViaCloud(store: Store, steamId: string, now = Date.now()): Promise<LibraryDoc> {
  const link = await store.get<CloudLink>(cloudLinkPath(steamId));
  if (link?.token && link.error !== "invalid_token") {
    const response = await fetch(`${CLOUD_SITE_URL}/api/companion/library`, {
      method: "POST", headers: { Authorization: `Bearer ${link.token}` },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20_000),
    }).catch(() => null);
    if (response?.status === 401) await store.set(cloudLinkPath(steamId), { error: "invalid_token" }, true);
    const body = response?.ok ? await response.json().catch(() => null) : null;
    if (LibraryReply(body)) {
      const doc: LibraryDoc = { status: body.library.status, games: body.library.games, via: "cloud", checkedAt: now };
      await store.set(libraryPath(steamId), doc);
      return doc;
    }
  }
  const doc: LibraryDoc = { ...(await viaCommunity(steamId)), checkedAt: now };
  await store.set(libraryPath(steamId), doc);
  return doc;
}
