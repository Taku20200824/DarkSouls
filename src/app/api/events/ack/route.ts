import { z } from "zod";
import { withUser, ok, readJson } from "@/lib/server/api";
import { jsonError } from "@/lib/server/security";

const Body = z.object({ ids: z.array(z.string().max(64)).min(1).max(50) });

/** Marks events as seen so cinematic animations never replay on reload. */
export const POST = withUser(
  async ({ req, steamId, store }) => {
    const p = Body.safeParse(await readJson(req, 10_000).catch(() => null));
    if (!p.success) return jsonError(422, "invalid_payload");
    const now = Date.now();
    for (const id of p.data.ids) {
      const path = `users/${steamId}/events/${id}`;
      if (await store.get(path)) await store.set(path, { ackedAt: now }, true);
    }
    return ok();
  },
  { mutation: true, limit: 60 },
);
