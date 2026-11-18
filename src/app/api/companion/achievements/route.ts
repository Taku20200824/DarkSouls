import { ok, withCompanion } from "@/lib/server/api";
import { syncSteamAchievements } from "@/lib/server/achievements";

export const dynamic = "force-dynamic";

/**
 * For the Windows app: refreshes the token owner's Steam achievements here (where the
 * Steam API key lives), stores them in Firestore and returns them for the app's local copy.
 */
export const POST = withCompanion(async ({ steamId, store }) => {
  const achievements = await syncSteamAchievements(store, steamId);
  return ok({ achievements });
}, 6);
