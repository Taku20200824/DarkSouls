import { NextResponse, type NextRequest } from "next/server";
import { verifyAssertion } from "@/lib/steam/openid";
import { z } from "zod";
import { appUrl, isDesktopApp } from "@/lib/server/env";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/session";
import { sha256Hex } from "@/lib/server/security";
import { getStore, StoreUnavailableError } from "@/lib/server/store";
import { loadSteamProfile } from "@/lib/server/steam-profile";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { cloudLinkPath, revokeCloudLink, withDesktopLock, type CloudLink } from "@/lib/server/desktop-cloud";

export const dynamic = "force-dynamic";

function fail(reason: string) {
  return NextResponse.redirect(`${appUrl()}/login?error=${encodeURIComponent(reason)}`);
}

const DesktopLogin = z.object({
  ok: z.literal(true),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  profile: z.object({ steamId: z.string().regex(/^\d{17}$/) }).passthrough(),
});

async function signIn(steamId: string) {
  const res = NextResponse.redirect(`${appUrl()}/characters?signed_in=1`);
  res.cookies.set(SESSION_COOKIE, await createSessionToken(steamId), sessionCookieOptions());
  res.cookies.delete({ name: "lt_oid_state", path: "/api/auth/steam" });
  res.cookies.delete({ name: "lt_oid_verifier", path: "/api/auth/steam" });
  return res;
}

async function signInDesktop(req: NextRequest, returnTo: URL) {
  const verifier = req.cookies.get("lt_oid_verifier")?.value;
  if (!verifier) return fail("state_mismatch");
  returnTo.searchParams.set("desktop_proof", await sha256Hex(verifier));
  if (req.nextUrl.searchParams.get("openid.return_to") !== returnTo.href) return fail("bad_return_to");
  const response = await fetch(`${CLOUD_SITE_URL}/api/auth/desktop`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assertion: req.nextUrl.searchParams.toString(), verifier }),
    redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  const body = await response?.json().catch(() => null);
  if (response?.status === 401 && typeof body?.error === "string") return fail(body.error);
  const login = DesktopLogin.safeParse(body);
  if (!response?.ok || !login.success) return fail("cloud_unavailable");
  const { profile, token } = login.data;
  const store = getStore();
  if (store.kind !== "dev-file") return fail("store_unavailable");
  await withDesktopLock(profile.steamId, async () => {
    const path = cloudLinkPath(profile.steamId);
    const previous = await store.get<CloudLink>(path);
    await store.set(`users/${profile.steamId}`, profile, true);
    await store.set(path, { ...previous, token, error: null });
    if (previous) await revokeCloudLink(previous.token);
  });
  return signIn(profile.steamId);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const state = params.get("state");
  const cookieState = req.cookies.get("lt_oid_state")?.value;
  if (!state || !cookieState || state !== cookieState) return fail("state_mismatch");
  if (params.get("openid.mode") === "cancel") return fail("cancelled");
  const returnTo = new URL(`${appUrl()}/api/auth/steam/callback`);
  returnTo.searchParams.set("state", state);

  try {
    if (isDesktopApp()) return await signInDesktop(req, returnTo);
    const result = await verifyAssertion(params, returnTo.href);
    if (!result.ok) return fail(result.reason);
    const store = getStore();
    // Replay protection: each signed nonce may be used once.
    const fresh = await store.create(`nonces/${await sha256Hex(result.nonce)}`, { at: Date.now() });
    if (!fresh) return fail("replayed_nonce");

    await store.set(`users/${result.steamId}`, await loadSteamProfile(result.steamId), true);
    return await signIn(result.steamId);
  } catch (e) {
    if (e instanceof StoreUnavailableError) return fail("store_unavailable");
    console.error(e);
    return fail("internal_error");
  }

}
