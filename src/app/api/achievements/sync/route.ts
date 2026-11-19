import { z } from "zod";
import { withUser, ok, readJson } from "@/lib/server/api";
import { syncAchievementsViaCloud, syncSteamAchievements } from "@/lib/server/achievements";
import { isDesktopApp } from "@/lib/server/env";
import { GAME_APPIDS } from "@/lib/games";
import { DSR_APPID } from "@/lib/steam/webapi";
import { jsonError } from "@/lib/server/security";

export const dynamic = "force-dynamic";

const Body = z.object({ appid: z.number().int().refine((a) => GAME_APPIDS.includes(a)).optional() });

export const POST = withUser(
  async ({ req, steamId, store }) => {
    const body = Body.safeParse((await readJson(req, 1024).catch(() => ({}))) ?? {});
    if (!body.success) return jsonError(422, "invalid_appid");
    const appid = body.data.appid ?? DSR_APPID;
    // The Windows app ships without a Steam API key; it relays through the hosted site.
    const doc = isDesktopApp() ? await syncAchievementsViaCloud(store, steamId, Date.now(), appid) : await syncSteamAchievements(store, steamId, Date.now(), appid);
    return ok({ status: doc.status, count: doc.items ? Object.keys(doc.items).length : 0 });
  },
  { mutation: true, limit: 12 },
);
