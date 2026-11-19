import { z } from "zod";
import { ok, readJson, withCompanion } from "@/lib/server/api";
import { syncSteamAchievements } from "@/lib/server/achievements";
import { GAME_APPIDS } from "@/lib/games";
import { DSR_APPID } from "@/lib/steam/webapi";
import { jsonError } from "@/lib/server/security";

export const dynamic = "force-dynamic";

const Body = z.object({ appid: z.number().int().refine((a) => GAME_APPIDS.includes(a)).optional() });

/**
 * For the Windows app: refreshes the token owner's Steam achievements here (where the
 * Steam API key lives), stores them in Firestore and returns them for the app's local copy.
 * Older apps send no body: that means Dark Souls: Remastered.
 */
export const POST = withCompanion(async ({ req, steamId, store }) => {
  const raw = await readJson(req, 1024).catch(() => ({}));
  const body = Body.safeParse(raw ?? {});
  if (!body.success) return jsonError(422, "invalid_appid");
  const achievements = await syncSteamAchievements(store, steamId, Date.now(), body.data.appid ?? DSR_APPID);
  return ok({ achievements });
}, 12);
