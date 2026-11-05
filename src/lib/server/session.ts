import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isProduction, sessionSecret } from "./env";

export const SESSION_COOKIE = "lt_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface Session {
  steamId: string;
}

export async function createSessionToken(steamId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(steamId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .setAudience("lordran-tracker")
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { audience: "lordran-tracker", algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || !/^\d{17}$/.test(payload.sub)) return null;
    return { steamId: payload.sub };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: isProduction(), sameSite: "lax" as const, path: "/", maxAge: MAX_AGE };
}
