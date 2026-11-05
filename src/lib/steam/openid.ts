/**
 * Steam OpenID 2.0 (https://steamcommunity.com/dev) — real verification:
 *  1. structural checks (mode, ns, op_endpoint, claimed_id format, return_to)
 *  2. direct verification with Steam (openid.mode=check_authentication)
 *  3. nonce freshness (+ replay check by the caller)
 */
export const STEAM_OPENID = "https://steamcommunity.com/openid/login";
const NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";
const CLAIMED_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

export function buildLoginUrl(returnTo: string, realm: string): string {
  const p = new URLSearchParams({
    "openid.ns": NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": IDENTIFIER_SELECT,
    "openid.claimed_id": IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID}?${p.toString()}`;
}

export type VerifyResult = { ok: true; steamId: string; nonce: string } | { ok: false; reason: string };

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; text(): Promise<string> }>;

export async function verifyAssertion(
  params: URLSearchParams,
  expectedReturnTo: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  now: number = Date.now(),
): Promise<VerifyResult> {
  const g = (k: string) => params.get(`openid.${k}`);
  if (g("mode") !== "id_res") return { ok: false, reason: g("mode") === "cancel" ? "cancelled" : "bad_mode" };
  if (g("ns") !== NS) return { ok: false, reason: "bad_ns" };
  if (g("op_endpoint") !== STEAM_OPENID) return { ok: false, reason: "bad_endpoint" };
  const claimed = g("claimed_id");
  const identity = g("identity");
  const m = claimed ? CLAIMED_RE.exec(claimed) : null;
  if (!m || identity !== claimed) return { ok: false, reason: "bad_claimed_id" };
  const returnTo = g("return_to");
  if (!returnTo) return { ok: false, reason: "bad_return_to" };
  try {
    const a = new URL(returnTo);
    const b = new URL(expectedReturnTo);
    if (a.origin !== b.origin || a.pathname !== b.pathname) return { ok: false, reason: "bad_return_to" };
  } catch {
    return { ok: false, reason: "bad_return_to" };
  }
  const signed = (g("signed") ?? "").split(",");
  for (const req of ["op_endpoint", "claimed_id", "identity", "return_to", "response_nonce", "assoc_handle"])
    if (!signed.includes(req)) return { ok: false, reason: "unsigned_fields" };
  const nonce = g("response_nonce") ?? "";
  const ts = Date.parse(nonce.slice(0, 20));
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 5 * 60 * 1000) return { ok: false, reason: "stale_nonce" };

  const body = new URLSearchParams();
  for (const [k, v] of params) if (k.startsWith("openid.")) body.set(k, v);
  body.set("openid.mode", "check_authentication");
  let text: string;
  try {
    const res = await fetchImpl(STEAM_OPENID, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return { ok: false, reason: "steam_unreachable" };
    text = await res.text();
  } catch {
    return { ok: false, reason: "steam_unreachable" };
  }
  if (!/^is_valid\s*:\s*true\s*$/m.test(text)) return { ok: false, reason: "invalid_signature" };
  return { ok: true, steamId: m[1], nonce };
}
