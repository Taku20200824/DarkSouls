import "server-only";
import { getPlayerAchievements, getSchema, mergeAchievements, type SchemaAchievement } from "@/lib/steam/webapi";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { cloudLinkPath, type CloudLink } from "./desktop-cloud";
import type { Store } from "./store";

const SCHEMA_PATH = "cache/steamSchema570940";
const SCHEMA_TTL = 24 * 3600_000;
export const achievementsPath = (steamId: string) => `users/${steamId}/meta/achievements`;

export interface AchievementsDoc {
  status: string;
  message?: string | null;
  fetchedAt?: number;
  checkedAt: number;
  items?: ReturnType<typeof mergeAchievements>;
}

/**
 * Pulls the player's achievements from the Steam Web API (needs STEAM_API_KEY, so it only
 * works on the hosted server) and stores them under users/{id}/meta/achievements.
 */
export async function syncSteamAchievements(store: Store, steamId: string, now = Date.now()): Promise<AchievementsDoc> {
  let cached = await store.get<{ fetchedAt: number; data: SchemaAchievement[] }>(SCHEMA_PATH);
  if (!cached || now - cached.fetchedAt > SCHEMA_TTL) {
    const s = await getSchema();
    if (s.ok && s.data.length > 0) {
      cached = { fetchedAt: now, data: s.data };
      await store.set(SCHEMA_PATH, cached);
    } else if (!cached?.data?.length) {
      // No usable schema at all: report why. A stale cache is still fine to use (the
      // achievement list hardly ever changes), so a Steam hiccup doesn't break the sync.
      const doc: AchievementsDoc = { status: s.ok ? "error" : s.reason, message: s.ok ? "empty schema" : s.message ?? null, checkedAt: now };
      await store.set(achievementsPath(steamId), doc, true);
      return doc;
    }
  }
  const p = await getPlayerAchievements(steamId);
  if (!p.ok) {
    const doc: AchievementsDoc = { status: p.reason, message: p.message ?? null, checkedAt: now };
    if (p.reason === "error") console.error("Steam GetPlayerAchievements failed", p.status ?? "", p.message ?? "");
    await store.set(achievementsPath(steamId), doc, true);
    return doc;
  }
  const doc: AchievementsDoc = { status: "ok", fetchedAt: now, checkedAt: now, items: mergeAchievements(cached.data, p.data), message: null };
  await store.set(achievementsPath(steamId), doc);
  return doc;
}

/**
 * Desktop build: the app has no Steam API key, so it asks the hosted site to fetch the
 * achievements with the upload token it got at Steam sign-in, then keeps a local copy.
 */
export async function syncAchievementsViaCloud(store: Store, steamId: string, now = Date.now()): Promise<AchievementsDoc> {
  const link = await store.get<CloudLink>(cloudLinkPath(steamId));
  if (!link?.token || link.error === "invalid_token") {
    const doc: AchievementsDoc = { status: "not_linked", checkedAt: now };
    await store.set(achievementsPath(steamId), doc, true);
    return doc;
  }
  const response = await fetch(`${CLOUD_SITE_URL}/api/companion/achievements`, {
    method: "POST",
    headers: { Authorization: `Bearer ${link.token}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  const body = (await response?.json().catch(() => null)) as { ok?: boolean; achievements?: AchievementsDoc } | null;
  if (response?.status === 401) await store.set(cloudLinkPath(steamId), { error: "invalid_token" }, true);
  if (!response?.ok || !body?.ok || !body.achievements?.status) {
    const doc: AchievementsDoc = { status: response?.status === 401 ? "not_linked" : "error", message: "cloud_unavailable", checkedAt: now };
    await store.set(achievementsPath(steamId), doc, true);
    return doc;
  }
  const doc: AchievementsDoc = { ...body.achievements, checkedAt: now };
  await store.set(achievementsPath(steamId), doc, doc.status !== "ok");
  return doc;
}
