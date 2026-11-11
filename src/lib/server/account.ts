import "server-only";
import type { Store } from "./store";

/**
 * Permanently deletes everything stored for one Steam account:
 *  - users/{steamId} and every subcollection (characters, events, snapshots, meta/*,
 *    companionTokens), and
 *  - the top-level companionTokens/{hash} records that let the Windows app / companion
 *    upload for this account (so a leftover token can't recreate data afterwards).
 * Not covered (no personal data): nonces/{hash} (used-once login nonces, only a timestamp)
 * and pairing/{code} (expires 10 minutes after it is created).
 */
export async function deleteAccountData(store: Store, steamId: string): Promise<{ tokensRevoked: number }> {
  if (!/^\d{17}$/.test(steamId)) throw new Error("invalid steamId");
  const tokens = await store.list<object>(`users/${steamId}/companionTokens`);
  for (const t of tokens) await store.delete(`companionTokens/${t.id}`);
  await store.deleteTree(`users/${steamId}`);
  return { tokensRevoked: tokens.length };
}
