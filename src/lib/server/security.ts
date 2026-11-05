import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "./env";

/**
 * CSRF protection for cookie-authenticated, state-changing requests:
 * the session cookie is SameSite=Lax AND the Origin (or Referer) must match APP_URL.
 */
export function checkSameOrigin(req: NextRequest): boolean {
  const expected = new URL(appUrl()).origin;
  const origin = req.headers.get("origin");
  if (origin) return origin === expected || origin === req.nextUrl.origin;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const o = new URL(referer).origin;
      return o === expected || o === req.nextUrl.origin;
    } catch {
      return false;
    }
  }
  return false;
}

/** Simple fixed-window rate limiter (per server instance). */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.count++;
  return b.count <= limit;
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function jsonError(status: number, error: string, extra?: object) {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Buffer.from(a).toString("base64url");
}
