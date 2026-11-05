import { withUser, ok, readJson, PayloadTooLarge } from "@/lib/server/api";
import { SyncPayloadSchema } from "@/lib/save/schema";
import { ingest } from "@/lib/server/progress";
import { jsonError } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Manual upload mode: the browser parses the .sl2 locally and posts only the parsed fields. */
export const POST = withUser(
  async ({ req, steamId }) => {
    let body: unknown;
    try {
      body = await readJson(req, 2_000_000);
    } catch (e) {
      return jsonError(e instanceof PayloadTooLarge ? 413 : 400, e instanceof PayloadTooLarge ? "payload_too_large" : "bad_json");
    }
    const parsed = SyncPayloadSchema.safeParse(body);
    if (!parsed.success) return jsonError(422, "invalid_payload", { issues: parsed.error.issues.slice(0, 5) });
    if (parsed.data.client !== "browser-upload") return jsonError(422, "invalid_client");
    const results = await ingest(steamId, parsed.data);
    return ok({ results });
  },
  { mutation: true, limit: 20 },
);
