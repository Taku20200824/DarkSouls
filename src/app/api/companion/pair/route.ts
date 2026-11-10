import { type NextRequest } from "next/server";
import { z } from "zod";
import { ok, readJson, withCompanion } from "@/lib/server/api";
import { clientIp, jsonError, rateLimit, randomToken, sha256Hex } from "@/lib/server/security";
import { getStore, StoreUnavailableError, type TransactionStore } from "@/lib/server/store";

const Body = z.object({
  code: z.string().regex(/^[A-Z2-9]{8}$/),
  deviceName: z.string().min(1).max(60),
  steamId: z.string().regex(/^\d{17}$/).optional(),
});

/** Exchanges a pairing code for a long-lived companion token (only its SHA-256 is stored). */
export async function POST(req: NextRequest) {
  if (!rateLimit(`pair:${clientIp(req)}`, 10, 60_000)) return jsonError(429, "rate_limited");
  const p = Body.safeParse(await readJson(req, 1024).catch(() => null));
  if (!p.success) return jsonError(422, "invalid_payload");
  try {
    const store = getStore();
    const token = randomToken(32);
    const hash = await sha256Hex(token);
    const now = Date.now();
    const redeem = async (tx: TransactionStore) => {
      const codePath = `pairing/${p.data.code}`;
      const rec = await tx.get<{ steamId: string; expiresAt: number }>(codePath);
      if (!rec || rec.expiresAt <= now) return { error: "invalid_or_expired_code", status: 401 } as const;
      if (p.data.steamId && p.data.steamId !== rec.steamId) return { error: "steam_account_mismatch", status: 403 } as const;
      await tx.delete(codePath);
      const device = { deviceName: p.data.deviceName, createdAt: now };
      await tx.set(`companionTokens/${hash}`, { ...device, steamId: rec.steamId });
      await tx.set(`users/${rec.steamId}/companionTokens/${hash}`, device);
      await tx.set(`users/${rec.steamId}/meta/companion`, { deviceName: device.deviceName, pairedAt: now }, true);
      return { steamId: rec.steamId };
    };
    const result = await (store.atomic ? store.atomic(redeem) : redeem(store));
    if (result.error) return jsonError(result.status, result.error);
    return ok({ token, steamId: result.steamId });
  } catch (e) {
    if (e instanceof StoreUnavailableError) return jsonError(503, "store_unavailable");
    console.error(e);
    return jsonError(500, "internal_error");
  }
}

/** A paired app can revoke its own token without disconnecting other devices. */
export const DELETE = withCompanion(async ({ steamId, tokenHash, store }) => {
  await store.set(`companionTokens/${tokenHash}`, { revoked: true }, true);
  await store.delete(`users/${steamId}/companionTokens/${tokenHash}`);
  return ok();
}, 10);
