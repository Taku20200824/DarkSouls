import { NextResponse, type NextRequest } from "next/server";
import { verifyAssertion } from "@/lib/steam/openid";
import { getOwnsGame, getPlayerSummary } from "@/lib/steam/webapi";
import { appUrl } from "@/lib/server/env";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/session";
import { sha256Hex } from "@/lib/server/security";
import { getStore, StoreUnavailableError } from "@/lib/server/store";

export const dynamic = "force-dynamic";

function fail(reason: string) {
  return NextResponse.redirect(`${appUrl()}/login?error=${encodeURIComponent(reason)}`);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const state = params.get("state");
  const cookieState = req.cookies.get("lt_oid_state")?.value;
  if (!state || !cookieState || state !== cookieState) return fail("state_mismatch");

  const result = await verifyAssertion(params, `${appUrl()}/api/auth/steam/callback`);
  if (!result.ok) return fail(result.reason);

  try {
    const store = getStore();
    // Replay protection: each signed nonce may be used once.
    const fresh = await store.create(`nonces/${await sha256Hex(result.nonce)}`, { at: Date.now() });
    if (!fresh) return fail("replayed_nonce");

    const now = Date.now();
    const [summary, owns] = await Promise.all([getPlayerSummary(result.steamId), getOwnsGame(result.steamId)]);
    await store.set(
      `users/${result.steamId}`,
      {
        steamId: result.steamId,
        lastLoginAt: now,
        personaName: summary.ok ? summary.data.personaname : null,
        avatar: summary.ok ? (summary.data.avatarfull ?? null) : null,
        profileUrl: summary.ok ? (summary.data.profileurl ?? null) : null,
        profilePublic: summary.ok ? summary.data.communityvisibilitystate === 3 : null,
        ownsGame: owns.ok ? owns.data.owned : null,
        playtimeMinutes: owns.ok ? owns.data.playtimeMinutes : null,
        steamApiStatus: summary.ok ? "ok" : summary.reason,
      },
      true,
    );
  } catch (e) {
    if (e instanceof StoreUnavailableError) return fail("store_unavailable");
    console.error(e);
    return fail("internal_error");
  }

  const res = NextResponse.redirect(`${appUrl()}/characters`);
  res.cookies.set(SESSION_COOKIE, await createSessionToken(result.steamId), sessionCookieOptions());
  res.cookies.delete({ name: "lt_oid_state", path: "/api/auth/steam" });
  return res;
}
