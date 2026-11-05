import { z } from "zod";
import { withCompanion, ok, readJson } from "@/lib/server/api";
import { jsonError } from "@/lib/server/security";

const Body = z.object({
  version: z.string().max(20),
  saveFound: z.boolean(),
  saveModifiedAt: z.number().int().positive().nullable(),
  message: z.string().max(200).nullable(),
});

export const POST = withCompanion(async ({ req, steamId, store }) => {
  const p = Body.safeParse(await readJson(req, 5_000).catch(() => null));
  if (!p.success) return jsonError(422, "invalid_payload");
  await store.set(`users/${steamId}/meta/companion`, { ...p.data, lastHeartbeat: Date.now() }, true);
  return ok();
}, 10);
