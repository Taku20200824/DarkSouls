import { z } from "zod";
import { withUser, ok, readJson } from "@/lib/server/api";
import { jsonError } from "@/lib/server/security";

const Body = z.object({
  kind: z.enum(["bosses", "achievements", "quests", "items"]),
  id: z.string().min(1).max(120),
  value: z.union([z.boolean(), z.array(z.string().max(60)).max(20), z.null()]),
});

/** Manual confirmations — always shown with source "User confirmation". */
export const POST = withUser(
  async ({ req, steamId, store }) => {
    const parsed = Body.safeParse(await readJson(req, 10_000).catch(() => null));
    if (!parsed.success) return jsonError(422, "invalid_payload");
    const { kind, id, value } = parsed.data;
    const path = `users/${steamId}/meta/manual`;
    const cur = (await store.get<Record<string, Record<string, unknown>>>(path)) ?? {};
    const section = { ...(cur[kind] ?? {}) };
    if (value === null) delete section[id];
    else section[id] = value;
    await store.set(path, { ...cur, [kind]: section, updatedAt: Date.now() });
    return ok();
  },
  { mutation: true, limit: 120 },
);
