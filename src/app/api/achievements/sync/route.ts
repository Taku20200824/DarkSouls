import { withUser, ok } from "@/lib/server/api";
import { getPlayerAchievements, getSchema, mergeAchievements, type SchemaAchievement } from "@/lib/steam/webapi";

export const dynamic = "force-dynamic";
const SCHEMA_TTL = 24 * 3600_000;

export const POST = withUser(
  async ({ steamId, store }) => {
    let cached = await store.get<{ fetchedAt: number; data: SchemaAchievement[] }>("cache/steamSchema570940");
    if (!cached || Date.now() - cached.fetchedAt > SCHEMA_TTL) {
      const s = await getSchema();
      if (s.ok && s.data.length > 0) {
        cached = { fetchedAt: Date.now(), data: s.data };
        await store.set("cache/steamSchema570940", cached);
      } else if (!cached?.data?.length) {
        // No usable schema at all: report why. A stale cache is still fine to use (the
        // achievement list hardly ever changes), so a Steam hiccup doesn't break the sync.
        const reason = s.ok ? "error" : s.reason;
        await store.set(`users/${steamId}/meta/achievements`, { status: reason, checkedAt: Date.now() }, true);
        return ok({ status: reason });
      }
    }
    const p = await getPlayerAchievements(steamId);
    if (!p.ok) {
      await store.set(`users/${steamId}/meta/achievements`, { status: p.reason, message: p.message ?? null, checkedAt: Date.now() }, true);
      return ok({ status: p.reason });
    }
    const items = mergeAchievements(cached.data, p.data);
    await store.set(`users/${steamId}/meta/achievements`, { status: "ok", fetchedAt: Date.now(), checkedAt: Date.now(), items });
    return ok({ status: "ok", count: Object.keys(items).length });
  },
  { mutation: true, limit: 4 },
);
