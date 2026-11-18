import { withCompanion, ok, readJson, PayloadTooLarge } from "@/lib/server/api";
import { SyncPayloadSchema } from "@/lib/save/schema";
import { ingest } from "@/lib/server/progress";
import { achievementsPath, syncSteamAchievements, type AchievementsDoc } from "@/lib/server/achievements";
import { jsonError } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Achievements are refreshed alongside a save upload at most this often. */
const ACHIEVEMENTS_REFRESH_MS = 60 * 60_000;

export const POST = withCompanion(async ({ req, steamId, store }) => {
  let body: unknown;
  try {
    body = await readJson(req, 2_000_000);
  } catch (e) {
    return jsonError(e instanceof PayloadTooLarge ? 413 : 400, "bad_body");
  }
  const parsed = SyncPayloadSchema.safeParse(body);
  if (!parsed.success) return jsonError(422, "invalid_payload", { issues: parsed.error.issues.slice(0, 5) });
  if (parsed.data.client !== "companion") return jsonError(422, "invalid_client");
  if (!parsed.data.checksumsValid) return jsonError(422, "invalid_save_checksum");
  const results = await ingest(steamId, parsed.data);
  const now = Date.now();
  await store.set(`users/${steamId}/meta/companion`, { lastHeartbeat: now, lastSyncAt: now }, true);

  // Keep the web's achievements current without anyone pressing "sync" on the site.
  let achievements: string | null = null;
  try {
    const current = await store.get<AchievementsDoc>(achievementsPath(steamId));
    if (!current?.checkedAt || now - current.checkedAt > ACHIEVEMENTS_REFRESH_MS) achievements = (await syncSteamAchievements(store, steamId, now)).status;
  } catch (e) {
    console.error("achievement refresh after upload failed", e);
  }
  return ok({ results, stored: results.length, unchanged: results.length === 0, achievements });
}, 20);
