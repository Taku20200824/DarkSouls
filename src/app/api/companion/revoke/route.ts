import { withUser, ok } from "@/lib/server/api";

/** Revokes every companion token for this user. */
export const POST = withUser(
  async ({ steamId, store }) => {
    const tokens = await store.list<{ deviceName: string }>(`users/${steamId}/companionTokens`);
    for (const t of tokens) {
      await store.set(`companionTokens/${t.id}`, { revoked: true }, true);
      await store.delete(`users/${steamId}/companionTokens/${t.id}`);
    }
    await store.set(`users/${steamId}/meta/companion`, { lastHeartbeat: 0, revokedAt: Date.now() }, true);
    return ok();
  },
  { mutation: true, limit: 5 },
);
