import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, jsonError, rateLimit, randomToken, sha256Hex } from "@/lib/server/security";
import { getStore, StoreUnavailableError } from "@/lib/server/store";

const Body = z.object({ code: z.string().regex(/^[A-Z2-9]{8}$/), deviceName: z.string().min(1).max(60) });

/** Exchanges a pairing code for a long-lived companion token (only its SHA-256 is stored). */
export async function POST(req: NextRequest) {
  if (!rateLimit(`pair:${clientIp(req)}`, 10, 60_000)) return jsonError(429, "rate_limited");
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return jsonError(422, "invalid_payload");
  try {
    const store = getStore();
    const rec = await store.get<{ steamId: string; expiresAt: number }>(`pairing/${p.data.code}`);
    await store.delete(`pairing/${p.data.code}`); // single use, even on failure
    if (!rec || rec.expiresAt < Date.now()) return jsonError(401, "invalid_or_expired_code");
    const token = randomToken(32);
    const hash = await sha256Hex(token);
    await store.set(`companionTokens/${hash}`, { steamId: rec.steamId, deviceName: p.data.deviceName, createdAt: Date.now() });
    await store.set(`users/${rec.steamId}/companionTokens/${hash}`, { deviceName: p.data.deviceName, createdAt: Date.now() });
    await store.set(`users/${rec.steamId}/meta/companion`, { deviceName: p.data.deviceName, pairedAt: Date.now() }, true);
    return NextResponse.json({ ok: true, token, steamId: rec.steamId });
  } catch (e) {
    if (e instanceof StoreUnavailableError) return jsonError(503, "store_unavailable");
    console.error(e);
    return jsonError(500, "internal_error");
  }
}
