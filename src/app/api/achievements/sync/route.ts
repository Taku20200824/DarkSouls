import { withUser, ok } from "@/lib/server/api";
import { getPlayerAchievements, getSchema, mergeAchievements, type SchemaAchievement } from "@/lib/steam/webapi";

export const dynamic = "force-dynamic";
const SCHEMA_TTL = 24 * 3600_000;

export const POST = withUser(
  async ({ steamId, store }) => {
    let cached = await store.get<{ fetchedAt: number; data: SchemaAchievement[] }>("cache/steamSchema570940");
    if (!cached || Date.now() - cached.fetchedAt > SCHEMA_TTL) {
      const s = await getSchema();
      if (!s.ok) {
        await store.set(`users/${steamId}/meta/achievements`, { status: s.reason, checkedAt: Date.now() }, true);
        return ok({ status: s.reason });
      }
      cached = { fetchedAt: Date.now(), data: s.data };
      await store.set("cache/steamSchema570940", cached);
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
