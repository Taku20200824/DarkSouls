import { z } from "zod";
import { withUser, ok, readJson } from "@/lib/server/api";
import { jsonError } from "@/lib/server/security";
import { BOSSES } from "@/lib/data/bosses";
import { AREAS } from "@/lib/data/areas";

const Body = z.object({ id: z.string().max(64), bossId: z.string().max(60).nullable(), areaId: z.string().max(60).nullable() });

/** The player may attribute a death to a boss/area. Stored as "User confirmation". */
export const POST = withUser(
  async ({ req, steamId, store }) => {
    const p = Body.safeParse(await readJson(req, 5_000).catch(() => null));
    if (!p.success) return jsonError(422, "invalid_payload");
    const { id, bossId, areaId } = p.data;
    if (bossId && !BOSSES.some((b) => b.id === bossId)) return jsonError(422, "unknown_boss");
    if (areaId && !AREAS.some((a) => a.id === areaId)) return jsonError(422, "unknown_area");
    const path = `users/${steamId}/events/${id}`;
    const ev = await store.get<{ type: string }>(path);
    if (!ev || ev.type !== "death") return jsonError(404, "not_found");
    const attribution = bossId || areaId ? { label: "User confirmation", bossId: bossId ?? undefined, area: areaId ?? undefined } : { label: "Unconfirmed" };
    await store.set(path, { attribution }, true);
    return ok();
  },
  { mutation: true, limit: 120 },
);
