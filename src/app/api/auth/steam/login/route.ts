import { NextResponse, type NextRequest } from "next/server";
import { buildLoginUrl } from "@/lib/steam/openid";
import { appUrl, isProduction } from "@/lib/server/env";
import { clientIp, rateLimit, randomToken } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Starts Steam OpenID. A random state bound to a short-lived cookie prevents login CSRF. */
export async function GET(req: NextRequest) {
  if (!rateLimit(`login:${clientIp(req)}`, 20, 60_000)) return new NextResponse("Too many requests", { status: 429 });
  const state = randomToken(18);
  const base = appUrl();
  const returnTo = `${base}/api/auth/steam/callback?state=${state}`;
  const res = NextResponse.redirect(buildLoginUrl(returnTo, base));
  res.cookies.set("lt_oid_state", state, { httpOnly: true, secure: isProduction(), sameSite: "lax", path: "/api/auth/steam", maxAge: 600 });
  return res;
}
