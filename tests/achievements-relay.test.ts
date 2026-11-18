import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { POST as hostedAchievements } from "@/app/api/companion/achievements/route";
import { POST as upload } from "@/app/api/companion/sync/route";
import { POST as refreshAchievements } from "@/app/api/achievements/sync/route";
import { GET as state } from "@/app/api/state/route";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { cloudLinkPath } from "@/lib/server/desktop-cloud";
import { sha256Hex } from "@/lib/server/security";
import { getSession } from "@/lib/server/session";
import { __setStore, type Store } from "@/lib/server/store";
import { parseSave } from "@/lib/save/ds1";

vi.mock("@/lib/server/session", () => ({ getSession: vi.fn() }));

const owner = "76561198362101413";
const base = "https://relay.example";
const token = "t".repeat(43);

function memoryStore(kind: Store["kind"]): Store {
  const docs = new Map<string, object>();
  const store: Store = {
    kind,
    get: async <T,>(path: string) => (docs.get(path) as T) ?? null,
    async set(path, data, merge) { docs.set(path, merge ? { ...docs.get(path), ...data } : data); },
    async create(path, data) { if (docs.has(path)) return false; docs.set(path, data); return true; },
    async add(path, data) { const id = String(docs.size); docs.set(`${path}/${id}`, data); return id; },
    list: async <T,>(path: string) => [...docs.entries()].filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes("/"))
      .map(([key, value]) => ({ ...(value as T), id: key.split("/").at(-1)! })),
    async delete(path) { docs.delete(path); },
    async deleteTree(path) { for (const key of [...docs.keys()]) if (key === path || key.startsWith(`${path}/`)) docs.delete(key); },
    async atomic(operation) { return operation(store); },
  };
  return store;
}

const steamApi = vi.fn(async (url: string) => {
  if (url.includes("/GetSchemaForGame/")) return Response.json({ game: { availableGameStats: { achievements: [{ name: "bonfire", displayName: "Enkindle", icon: "https://x/i.jpg" }] } } });
  if (url.includes("/GetPlayerAchievements/")) return Response.json({ playerstats: { success: true, achievements: [{ apiname: "bonfire", achieved: 1, unlocktime: 1700000000 }] } });
  throw new Error(`Unexpected request ${url}`);
});

/** Minimal Steam Community stats page (?xml=1) with one unlocked and one locked achievement. */
const COMMUNITY_XML = `<?xml version="1.0"?><playerstats><privacyState>public</privacyState><achievements>
<achievement closed="1"><iconClosed><![CDATA[https://x/on.jpg]]></iconClosed><iconOpen><![CDATA[https://x/off.jpg]]></iconOpen><name><![CDATA[Knight's Honor]]></name><apiname><![CDATA[a03]]></apiname><description><![CDATA[Acquire all rare weapons.]]></description><unlockTimestamp>1793276699</unlockTimestamp></achievement>
<achievement closed="0"><iconClosed><![CDATA[https://x/on2.jpg]]></iconClosed><iconOpen><![CDATA[https://x/off2.jpg]]></iconOpen><name><![CDATA[The Dark Soul]]></name><apiname><![CDATA[a00]]></apiname><description><![CDATA[All achievements.]]></description></achievement>
</achievements></playerstats>`;
const community = (url: string) => url.startsWith("https://steamcommunity.com/profiles/") ? new Response(COMMUNITY_XML) : null;

afterEach(() => { __setStore(null); vi.mocked(getSession).mockReset(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); steamApi.mockClear(); });

async function hostedWithToken() {
  const store = memoryStore("firestore");
  __setStore(store);
  vi.stubEnv("STEAM_API_KEY", "test-key");
  vi.stubGlobal("fetch", steamApi);
  await store.set(`companionTokens/${await sha256Hex(token)}`, { steamId: owner });
  return store;
}

it("hosted: a Windows app token fetches the owner's Steam achievements and saves them to Firestore", async () => {
  const store = await hostedWithToken();
  const res = await hostedAchievements(new NextRequest(`${base}/api/companion/achievements`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.achievements.status).toBe("ok");
  expect(body.achievements.items.Enkindle).toMatchObject({ unlocked: true, unlockTime: 1700000000 });
  expect(await store.get(`users/${owner}/meta/achievements`)).toMatchObject({ status: "ok" });
  expect((await hostedAchievements(new NextRequest(`${base}/api/companion/achievements`, { method: "POST", headers: { Authorization: `Bearer ${"x".repeat(43)}` } }))).status).toBe(401);
});

it("hosted: an unchanged save is confirmed (sync time moves) and the upload refreshes achievements", async () => {
  const store = await hostedWithToken();
  const parsed = parseSave(readFileSync("tests/fixtures/ptde-dsfp.sl2"));
  const payload = { ...parsed, client: "companion", consent: true, saveModifiedAt: Date.now() - 60_000 };
  const send = () => upload(new NextRequest(`${base}/api/companion/sync`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) }));

  const first = await (await send()).json();
  expect(first).toMatchObject({ ok: true, unchanged: false, achievements: "ok" });
  const firstSync = (await store.get<{ lastSyncAt: number }>(`users/${owner}/meta/sync`))!.lastSyncAt;

  await new Promise((r) => setTimeout(r, 5));
  const second = await (await send()).json();
  expect(second).toMatchObject({ ok: true, unchanged: true, results: [], achievements: null });
  expect((await store.get<{ lastSyncAt: number }>(`users/${owner}/meta/sync`))!.lastSyncAt).toBeGreaterThan(firstSync);
});

it("desktop: achievements are fetched through the website, since the app has no Steam key", async () => {
  const store = memoryStore("dev-file");
  __setStore(store);
  vi.stubEnv("LORDRAN_DESKTOP", "1");
  vi.mocked(getSession).mockResolvedValue({ steamId: owner });
  const sync = () => refreshAchievements(new NextRequest("http://127.0.0.1:3000/api/achievements/sync", { method: "POST", headers: { origin: "http://127.0.0.1:3000" } }));
  vi.stubEnv("APP_URL", "http://127.0.0.1:3000");

  // Not linked yet: the app reads the public Steam Community stats itself (no key needed).
  vi.stubGlobal("fetch", vi.fn(async (url: string) => community(url) ?? new Response("unexpected", { status: 500 })));
  expect(await (await sync()).json()).toMatchObject({ status: "ok", count: 2 });
  expect(await store.get(`users/${owner}/meta/achievements`)).toMatchObject({ via: "community", apiStatus: "not_linked", items: { "Knight's Honor": { unlocked: true, unlockTime: 1793276699, icon: "https://x/on.jpg" }, "The Dark Soul": { unlocked: false } } });

  await store.set(cloudLinkPath(owner), { token });
  const cloud = vi.fn(async (url: string, init?: RequestInit) => {
    expect(url).toBe(`${CLOUD_SITE_URL}/api/companion/achievements`);
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`);
    return Response.json({ ok: true, achievements: { status: "ok", fetchedAt: 1, checkedAt: 1, items: { Enkindle: { unlocked: true, unlockTime: 5, apiName: "bonfire" } } } });
  });
  vi.stubGlobal("fetch", cloud);
  expect(await (await sync()).json()).toMatchObject({ status: "ok", count: 1 });
  const local = await (await state(new NextRequest("http://127.0.0.1:3000/api/state"))).json();
  expect(local.achievements).toMatchObject({ status: "ok", items: { Enkindle: { unlocked: true } } });

  // A revoked token marks the link (so the app asks to sign in again) and still shows achievements.
  vi.stubGlobal("fetch", vi.fn(async (url: string) => community(url) ?? Response.json({ error: "invalid_token" }, { status: 401 })));
  expect(await (await sync()).json()).toMatchObject({ status: "ok", count: 2 });
  expect(await store.get(cloudLinkPath(owner))).toMatchObject({ error: "invalid_token" });
});

it("hosted: a rejected API key (403 HTML) is not reported as a private profile; the public stats are used", async () => {
  const store = memoryStore("firestore");
  __setStore(store);
  vi.stubEnv("STEAM_API_KEY", "revoked-key");
  vi.stubGlobal("fetch", vi.fn(async (url: string) => community(url) ?? new Response("<html><h1>Forbidden</h1>Please verify your key= parameter.</html>", { status: 403, headers: { "Content-Type": "text/html" } })));
  await store.set(`companionTokens/${await sha256Hex(token)}`, { steamId: owner });
  const body = await (await hostedAchievements(new NextRequest(`${base}/api/companion/achievements`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }))).json();
  expect(body.achievements).toMatchObject({ status: "ok", via: "community", apiStatus: "bad_key" });
});

it("hosted: a truly private profile still says private", async () => {
  const store = memoryStore("firestore");
  __setStore(store);
  vi.stubEnv("STEAM_API_KEY", "good-key");
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.startsWith("https://steamcommunity.com/profiles/")) return new Response("<playerstats><privacyState>private</privacyState></playerstats>");
    if (url.includes("/GetSchemaForGame/")) return Response.json({ game: { availableGameStats: { achievements: [{ name: "a", displayName: "A" }] } } });
    return Response.json({ playerstats: { success: false, error: "Profile is not public" } }, { status: 403 });
  }));
  await store.set(`companionTokens/${await sha256Hex(token)}`, { steamId: owner });
  const body = await (await hostedAchievements(new NextRequest(`${base}/api/companion/achievements`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }))).json();
  expect(body.achievements).toMatchObject({ status: "private" });
});
