import "server-only";
import { DSR_APPID, getPlayerAchievements, getPublicAchievements, getSchema, mergeAchievements, type ApiResult, type SchemaAchievement } from "@/lib/steam/webapi";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { cloudLinkPath, type CloudLink } from "./desktop-cloud";
import type { Store } from "./store";

const SCHEMA_TTL = 24 * 3600_000;
/** DS Remastered keeps its original document (the DS1 tracker reads it); other games get one each. */
export const achievementsPath = (steamId: string, appid = DSR_APPID) =>
  appid === DSR_APPID ? `users/${steamId}/meta/achievements` : `users/${steamId}/gameAchievements/${appid}`;

export interface AchievementsDoc {
  status: string;
  message?: string | null;
  fetchedAt?: number;
  checkedAt: number;
  items?: ReturnType<typeof mergeAchievements>;
  /** Where the list came from: the Web API, or the public community stats page (no key needed). */
  via?: "web_api" | "community";
  /** Why the Web API was skipped when the community page was used (e.g. "bad_key"). */
  apiStatus?: string | null;
}

type Items = ReturnType<typeof mergeAchievements>;

/** Web API path: schema (cached a day) + the player's unlocks. */
async function viaWebApi(store: Store, steamId: string, now: number, appid: number): Promise<ApiResult<Items>> {
  const schemaPath = `cache/steamSchema${appid}`;
  let cached = await store.get<{ fetchedAt: number; data: SchemaAchievement[] }>(schemaPath);
  if (!cached || now - cached.fetchedAt > SCHEMA_TTL) {
    const s = await getSchema(undefined, appid);
    if (s.ok && s.data.length > 0) {
      cached = { fetchedAt: now, data: s.data };
      await store.set(schemaPath, cached);
    } else if (!cached?.data?.length) {
      // A stale cache is still fine (the list hardly ever changes); with none, report why.
      return s.ok ? { ok: false, reason: "error", message: "empty schema" } : s;
    }
  }
  const p = await getPlayerAchievements(steamId, undefined, appid);
  return p.ok ? { ok: true, data: mergeAchievements(cached.data, p.data) } : p;
}

/**
 * Pulls the player's achievements for one game from the Steam Web API (needs STEAM_API_KEY,
 * so it only works on the hosted server) and stores them (see achievementsPath).
 */
export async function syncSteamAchievements(store: Store, steamId: string, now = Date.now(), appid = DSR_APPID): Promise<AchievementsDoc> {
  const api = await viaWebApi(store, steamId, now, appid);
  if (api.ok) {
    const doc: AchievementsDoc = { status: "ok", fetchedAt: now, checkedAt: now, items: api.data, via: "web_api", apiStatus: null, message: null };
    await store.set(achievementsPath(steamId, appid), doc);
    return doc;
  }
  if (api.reason === "bad_key") console.error("Steam rejected STEAM_API_KEY (403). Using the public community stats instead.");
  return saveCommunityAchievements(store, steamId, now, appid, api.reason, api.message);
}

/** Key-free fallback (also what the app uses when it can't reach the website). */
async function saveCommunityAchievements(store: Store, steamId: string, now: number, appid: number, apiStatus: string | null, apiMessage?: string): Promise<AchievementsDoc> {
  const path = achievementsPath(steamId, appid);
  const pub = await getPublicAchievements(steamId, undefined, appid);
  if (pub.ok) {
    const doc: AchievementsDoc = { status: "ok", fetchedAt: now, checkedAt: now, items: pub.data, via: "community", apiStatus, message: null };
    await store.set(path, doc);
    return doc;
  }
  // Both failed. "private" only when Steam itself says so; otherwise keep the API's reason.
  const status = pub.reason === "private" || apiStatus === "private" ? "private" : apiStatus ?? pub.reason;
  const doc: AchievementsDoc = { status, message: apiMessage ?? pub.message ?? null, checkedAt: now, apiStatus };
  await store.set(path, doc, true);
  return doc;
}

/**
 * Desktop build: the app has no Steam API key, so it asks the hosted site to fetch the
 * achievements with the upload token it got at Steam sign-in, then keeps a local copy.
 */
export async function syncAchievementsViaCloud(store: Store, steamId: string, now = Date.now(), appid = DSR_APPID): Promise<AchievementsDoc> {
  const link = await store.get<CloudLink>(cloudLinkPath(steamId));
  if (!link?.token || link.error === "invalid_token") return saveCommunityAchievements(store, steamId, now, appid, "not_linked");
  const response = await fetch(`${CLOUD_SITE_URL}/api/companion/achievements`, {
    method: "POST",
    headers: { Authorization: `Bearer ${link.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ appid }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  const body = (await response?.json().catch(() => null)) as { ok?: boolean; achievements?: AchievementsDoc } | null;
  if (response?.status === 401) await store.set(cloudLinkPath(steamId), { error: "invalid_token" }, true);
  if (!response?.ok || !body?.ok || !body.achievements?.status || body.achievements.status !== "ok") {
    // The website couldn't help (offline, revoked, Steam error): read the public stats directly.
    return saveCommunityAchievements(store, steamId, now, appid, response?.status === 401 ? "not_linked" : body?.achievements?.status ?? "cloud_unavailable");
  }
  const doc: AchievementsDoc = { ...body.achievements, checkedAt: now };
  await store.set(achievementsPath(steamId, appid), doc, doc.status !== "ok");
  return doc;
}
