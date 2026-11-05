import { describe, expect, it, vi } from "vitest";
import { buildLoginUrl, verifyAssertion } from "@/lib/steam/openid";
import { getPlayerAchievements, mergeAchievements } from "@/lib/steam/webapi";

const RETURN = "https://lordran.example/api/auth/steam/callback";
function assertion(over: Record<string, string> = {}, now = new Date()) {
  const nonce = `${now.toISOString().slice(0, 19)}Zabc123`;
  const p = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "id_res",
    "openid.op_endpoint": "https://steamcommunity.com/openid/login",
    "openid.claimed_id": "https://steamcommunity.com/openid/id/76561197960287930",
    "openid.identity": "https://steamcommunity.com/openid/id/76561197960287930",
    "openid.return_to": `${RETURN}?state=xyz`,
    "openid.response_nonce": nonce,
    "openid.assoc_handle": "1234567890",
    "openid.signed": "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
    "openid.sig": "c2lnbmF0dXJl",
    ...over,
  });
  return p;
}
const steamSays = (txt: string) => vi.fn(async () => ({ ok: true, text: async () => txt }));

describe("Steam OpenID", () => {
  it("builds an identifier_select login URL", () => {
    const u = new URL(buildLoginUrl(`${RETURN}?state=1`, "https://lordran.example"));
    expect(u.origin + u.pathname).toBe("https://steamcommunity.com/openid/login");
    expect(u.searchParams.get("openid.mode")).toBe("checkid_setup");
    expect(u.searchParams.get("openid.claimed_id")).toBe("http://specs.openid.net/auth/2.0/identifier_select");
  });
  it("accepts a valid assertion only after Steam confirms is_valid:true", async () => {
    const f = steamSays("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n");
    const r = await verifyAssertion(assertion(), RETURN, f);
    expect(r).toMatchObject({ ok: true, steamId: "76561197960287930" });
    const body = new URLSearchParams((f.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(body.get("openid.mode")).toBe("check_authentication");
    expect(body.get("openid.sig")).toBe("c2lnbmF0dXJl");
  });
  it("rejects when Steam says is_valid:false", async () => {
    expect(await verifyAssertion(assertion(), RETURN, steamSays("is_valid:false\n"))).toMatchObject({ ok: false, reason: "invalid_signature" });
  });
  it("rejects forged claimed_id hosts, mismatched identity, foreign return_to, stale nonce, unsigned fields", async () => {
    const f = steamSays("is_valid:true\n");
    expect((await verifyAssertion(assertion({ "openid.claimed_id": "https://evil.com/openid/id/76561197960287930" }), RETURN, f)).ok).toBe(false);
    expect((await verifyAssertion(assertion({ "openid.identity": "https://steamcommunity.com/openid/id/76561197960287931" }), RETURN, f)).ok).toBe(false);
    expect((await verifyAssertion(assertion({ "openid.return_to": "https://evil.com/api/auth/steam/callback" }), RETURN, f)).ok).toBe(false);
    expect((await verifyAssertion(assertion({ "openid.op_endpoint": "https://evil.com/openid/login" }), RETURN, f)).ok).toBe(false);
    expect((await verifyAssertion(assertion({}, new Date(Date.now() - 3600_000)), RETURN, f)).ok).toBe(false);
    expect((await verifyAssertion(assertion({ "openid.signed": "op_endpoint" }), RETURN, f)).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
  it("handles cancel and network failure", async () => {
    expect(await verifyAssertion(assertion({ "openid.mode": "cancel" }), RETURN, steamSays(""))).toMatchObject({ reason: "cancelled" });
    const boom = vi.fn(async () => { throw new Error("net"); });
    expect(await verifyAssertion(assertion(), RETURN, boom)).toMatchObject({ reason: "steam_unreachable" });
  });
});

describe("Steam Web API", () => {
  it("maps a private profile to reason=private", async () => {
    process.env.STEAM_API_KEY = "TESTKEY";
    const f = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ playerstats: { error: "Profile is not public", success: false } }) }));
    expect(await getPlayerAchievements("76561197960287930", f)).toMatchObject({ ok: false, reason: "private" });
  });
  it("reports no_key without calling Steam", async () => {
    delete process.env.STEAM_API_KEY;
    const f = vi.fn();
    expect(await getPlayerAchievements("76561197960287930", f)).toMatchObject({ ok: false, reason: "no_key" });
    expect(f).not.toHaveBeenCalled();
  });
  it("merges schema and player data by display name", () => {
    const m = mergeAchievements(
      [{ name: "ACH_A", displayName: "Enkindle", icon: "i.jpg", icongray: "g.jpg" }, { name: "ACH_B", displayName: "Estus Flask" }],
      [{ apiname: "ACH_A", achieved: 1, unlocktime: 1700000000 }, { apiname: "ACH_B", achieved: 0, unlocktime: 0 }],
    );
    expect(m["Enkindle"]).toMatchObject({ unlocked: true, unlockTime: 1700000000, apiName: "ACH_A" });
    expect(m["Estus Flask"]).toMatchObject({ unlocked: false, unlockTime: null });
  });
});
