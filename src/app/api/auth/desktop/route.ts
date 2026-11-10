import type { NextRequest } from "next/server";
import { z } from "zod";
import { verifyAssertion } from "@/lib/steam/openid";
import { ok, readJson } from "@/lib/server/api";
import { clientIp, jsonError, randomToken, rateLimit, sha256Hex } from "@/lib/server/security";
import { getStore, StoreUnavailableError } from "@/lib/server/store";
import { loadSteamProfile } from "@/lib/server/steam-profile";

export const dynamic = "force-dynamic";
const Body = z.object({ assertion: z.string().max(12_000), verifier: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });

/** The hosted server verifies Steam's signed response and issues an account-scoped upload token. */
export async function POST(req: NextRequest) {
  if (!rateLimit(`desktop-login:${clientIp(req)}`, 20, 60_000)) return jsonError(429, "rate_limited");
  const body = Body.safeParse(await readJson(req, 16_000).catch(() => null));
  if (!body.success) return jsonError(422, "invalid_payload");
  const params = new URLSearchParams(body.data.assertion);
  let callback: URL;
  try {
    callback = new URL(params.get("openid.return_to") ?? "");
  } catch {
    return jsonError(400, "bad_return_to");
  }
  if (callback.protocol !== "http:" || callback.hostname !== "127.0.0.1" || Number(callback.port) < 1024 ||
      callback.pathname !== "/api/auth/steam/callback" || callback.username || callback.password || callback.hash ||
      callback.searchParams.getAll("desktop_proof").length !== 1 ||
      callback.searchParams.get("desktop_proof") !== await sha256Hex(body.data.verifier)) {
    return jsonError(400, "bad_desktop_proof");
  }
  const identity = await verifyAssertion(params, callback.href);
  if (!identity.ok) return jsonError(401, identity.reason);

  try {
    const store = getStore();
    if (store.kind !== "firestore" || !store.atomic) return jsonError(503, "store_unavailable");
    const { steamId, nonce } = identity;
    const token = randomToken(32);
    const [profile, nonceHash, tokenHash] = await Promise.all([loadSteamProfile(steamId), sha256Hex(nonce), sha256Hex(token)]);
    const now = Date.now();
    const device = { deviceName: "Lordran Tracker for Windows", createdAt: now };
    const recorded = await store.atomic(async (tx) => {
      const noncePath = `nonces/${nonceHash}`;
      if (await tx.get(noncePath)) return false;
      await tx.set(noncePath, { at: now });
      await tx.set(`users/${steamId}`, profile, true);
      await tx.set(`companionTokens/${tokenHash}`, { ...device, steamId });
      await tx.set(`users/${steamId}/companionTokens/${tokenHash}`, device);
      await tx.set(`users/${steamId}/meta/companion`, { deviceName: device.deviceName, pairedAt: now }, true);
      return true;
    });
    return recorded ? ok({ token, profile }) : jsonError(401, "replayed_nonce");
  } catch (e) {
    if (e instanceof StoreUnavailableError) return jsonError(503, "store_unavailable");
    console.error(e);
    return jsonError(500, "internal_error");
  }
}
