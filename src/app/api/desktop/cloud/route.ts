import { z } from "zod";
import { withUser, ok, readJson } from "@/lib/server/api";
import { cloudLinkPath, cloudRequest, withDesktopLock, type CloudLink } from "@/lib/server/desktop-cloud";
import { isDesktopApp } from "@/lib/server/env";
import { jsonError } from "@/lib/server/security";

export const dynamic = "force-dynamic";

const PairCode = z.object({ code: z.string().regex(/^[A-Z2-9]{8}$/) });
const PairResponse = z.object({ ok: z.literal(true), steamId: z.string(), token: z.string().regex(/^[A-Za-z0-9_-]{40,80}$/) });

export const POST = withUser(async ({ req, steamId, store }) => {
  if (!isDesktopApp() || store.kind !== "dev-file") return jsonError(404, "not_found");
  const input = PairCode.safeParse(await readJson(req, 1024).catch(() => null));
  if (!input.success) return jsonError(422, "invalid_code");
  return withDesktopLock(steamId, async () => {
    const path = cloudLinkPath(steamId);
    const previous = await store.get<CloudLink>(path);
    const response = await cloudRequest("pair", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: input.data.code, steamId, deviceName: "Lordran Tracker for Windows" }),
    }).catch(() => null);
    if (response?.status === 401) return jsonError(401, "invalid_or_expired_code");
    if (response?.status === 403) return jsonError(403, "steam_account_mismatch");
    if (!response?.ok) return jsonError(502, "cloud_unavailable");
    const paired = PairResponse.safeParse(await response.json().catch(() => null));
    if (!paired.success || paired.data.steamId !== steamId) return jsonError(502, "pairing_failed");
    await store.set(path, { token: paired.data.token });
    if (previous) await revoke(previous.token);
    return ok();
  });
}, { mutation: true, limit: 10 });

async function revoke(token: string) {
  const response = await cloudRequest("pair", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  return response?.ok || response?.status === 401;
}

export const DELETE = withUser(async ({ steamId, store }) => {
  if (!isDesktopApp() || store.kind !== "dev-file") return jsonError(404, "not_found");
  return withDesktopLock(steamId, async () => {
    const path = cloudLinkPath(steamId);
    const link = await store.get<CloudLink>(path);
    await store.delete(path);
    return ok({ remoteRevoked: !link || await revoke(link.token) });
  });
}, { mutation: true, limit: 10 });
