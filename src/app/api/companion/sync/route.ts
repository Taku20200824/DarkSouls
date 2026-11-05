import { withCompanion, ok, readJson, PayloadTooLarge } from "@/lib/server/api";
import { SyncPayloadSchema } from "@/lib/save/schema";
import { ingest } from "@/lib/server/progress";
import { jsonError } from "@/lib/server/security";

export const dynamic = "force-dynamic";

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
  const results = await ingest(steamId, parsed.data);
  await store.set(`users/${steamId}/meta/companion`, { lastHeartbeat: Date.now(), lastSyncAt: Date.now() }, true);
  return ok({ results });
}, 20);
