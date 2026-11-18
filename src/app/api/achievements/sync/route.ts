import { withUser, ok } from "@/lib/server/api";
import { syncAchievementsViaCloud, syncSteamAchievements } from "@/lib/server/achievements";
import { isDesktopApp } from "@/lib/server/env";

export const dynamic = "force-dynamic";

export const POST = withUser(
  async ({ steamId, store }) => {
    // The Windows app ships without a Steam API key; it relays through the hosted site.
    const doc = isDesktopApp() ? await syncAchievementsViaCloud(store, steamId) : await syncSteamAchievements(store, steamId);
    return ok({ status: doc.status, count: doc.items ? Object.keys(doc.items).length : 0 });
  },
  { mutation: true, limit: 4 },
);
