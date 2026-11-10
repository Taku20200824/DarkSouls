import { NextResponse, type NextRequest } from "next/server";
import { buildLoginUrl } from "@/lib/steam/openid";
import { appUrl, isDesktopApp, isProduction } from "@/lib/server/env";
import { clientIp, rateLimit, randomToken, sha256Hex } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Starts Steam OpenID. A random state bound to a short-lived cookie prevents login CSRF. */
export async function GET(req: NextRequest) {
  if (!rateLimit(`login:${clientIp(req)}`, 20, 60_000)) return new NextResponse("Too many requests", { status: 429 });
  const state = randomToken(18);
  const base = appUrl();
  const returnTo = new URL(`${base}/api/auth/steam/callback`);
  returnTo.searchParams.set("state", state);
  const verifier = isDesktopApp() ? randomToken(32) : null;
  if (verifier) returnTo.searchParams.set("desktop_proof", await sha256Hex(verifier));
  const res = NextResponse.redirect(buildLoginUrl(returnTo.href, base));
  const options = { httpOnly: true, secure: isProduction() && !isDesktopApp(), sameSite: "lax" as const, path: "/api/auth/steam", maxAge: 600 };
  res.cookies.set("lt_oid_state", state, options);
  if (verifier) res.cookies.set("lt_oid_verifier", verifier, options);
  return res;
}
