import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "./session";
import { checkSameOrigin, clientIp, jsonError, rateLimit, sha256Hex } from "./security";
import { getStore, StoreUnavailableError, type Store } from "./store";

type Handler = (ctx: { req: NextRequest; steamId: string; store: Store }) => Promise<Response>;

/** Cookie-session route wrapper with CSRF (for mutations), rate limiting and store errors. */
export function withUser(handler: Handler, opts: { mutation?: boolean; limit?: number } = {}) {
  return async (req: NextRequest) => {
    const session = await getSession();
    if (!session) return jsonError(401, "not_authenticated");
    if (opts.mutation && !checkSameOrigin(req)) return jsonError(403, "bad_origin");
    if (!rateLimit(`${session.steamId}:${req.nextUrl.pathname}`, opts.limit ?? 60, 60_000)) return jsonError(429, "rate_limited");
    try {
      return await handler({ req, steamId: session.steamId, store: getStore() });
    } catch (e) {
      if (e instanceof StoreUnavailableError) return jsonError(503, "store_unavailable", { message: e.message });
      console.error(e);
      return jsonError(500, "internal_error");
    }
  };
}

type CompanionHandler = (ctx: { req: NextRequest; steamId: string; tokenHash: string; store: Store }) => Promise<Response>;

/** Bearer-token wrapper for the Windows companion (no cookies => no CSRF surface). */
export function withCompanion(handler: CompanionHandler, limit = 30) {
  return async (req: NextRequest) => {
    const auth = req.headers.get("authorization") ?? "";
    const m = /^Bearer ([A-Za-z0-9_-]{40,80})$/.exec(auth);
    if (!m) return jsonError(401, "missing_token");
    if (!rateLimit(`ip:${clientIp(req)}:${req.nextUrl.pathname}`, limit * 2, 60_000)) return jsonError(429, "rate_limited");
    try {
      const store = getStore();
      const tokenHash = await sha256Hex(m[1]);
      const rec = await store.get<{ steamId: string; revoked?: boolean }>(`companionTokens/${tokenHash}`);
      if (!rec || rec.revoked) return jsonError(401, "invalid_token");
      if (!rateLimit(`tok:${tokenHash}:${req.nextUrl.pathname}`, limit, 60_000)) return jsonError(429, "rate_limited");
      return await handler({ req, steamId: rec.steamId, tokenHash, store });
    } catch (e) {
      if (e instanceof StoreUnavailableError) return jsonError(503, "store_unavailable", { message: e.message });
      console.error(e);
      return jsonError(500, "internal_error");
    }
  };
}

export async function readJson(req: NextRequest, maxBytes: number): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > maxBytes) throw new PayloadTooLarge();
  const text = await req.text();
  if (text.length > maxBytes) throw new PayloadTooLarge();
  return JSON.parse(text);
}
export class PayloadTooLarge extends Error {}

export const ok = (data: object = {}) => NextResponse.json({ ok: true, ...data });
