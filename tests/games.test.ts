import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { POST as hostedAchievements } from "@/app/api/companion/achievements/route";
import { POST as hostedLibrary } from "@/app/api/companion/library/route";
import { POST as librarySync } from "@/app/api/library/sync/route";
import { GET as state } from "@/app/api/state/route";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { GAME_APPIDS } from "@/lib/games";
import { cloudLinkPath } from "@/lib/server/desktop-cloud";
import { sha256Hex } from "@/lib/server/security";
import { getSession } from "@/lib/server/session";
import { __setStore, type Store } from "@/lib/server/store";

vi.mock("@/lib/server/session", () => ({ getSession: vi.fn() }));

const owner = "76561198362101413";
const base = "https://relay.example";
const token = "t".repeat(43);
const DS3 = 374320;
const ER = 1245620;

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

const bearer = (path: string, body?: object) =>
  new NextRequest(`${base}${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) });

async function hosted(fetchImpl: (url: string) => Promise<Response>, key: string | null = "test-key") {
  const store = memoryStore("firestore");
  __setStore(store);
  if (key) vi.stubEnv("STEAM_API_KEY", key);
  else vi.stubEnv("STEAM_API_KEY", "");
  vi.stubGlobal("fetch", vi.fn(fetchImpl));
  await store.set(`companionTokens/${await sha256Hex(token)}`, { steamId: owner });
  vi.mocked(getSession).mockResolvedValue({ steamId: owner });
  return store;
}

const communityStats = (owned: Set<number>) => (url: string) => {
  const m = /\/profiles\/\d+\/stats\/(\d+)\//.exec(url);
  if (!m) return null;
  const inner = owned.has(Number(m[1]))
    ? `<achievement closed="1"><name><![CDATA[Won]]></name><apiname><![CDATA[a1]]></apiname><unlockTimestamp>1700000000</unlockTimestamp></achievement>`
    : "";
  return new Response(`<playerstats><privacyState>public</privacyState><achievements>${inner}</achievements></playerstats>`);
};

afterEach(() => { __setStore(null); vi.mocked(getSession).mockReset(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("hosted: verifies owned Souls games with the Web API and shows them in the state", async () => {
  const store = await hosted(async (url) => {
    expect(url).toContain("/GetOwnedGames/");
    for (const a of GAME_APPIDS) expect(url).toContain(`=${a}`);
    return Response.json({ response: { game_count: 2, games: [{ appid: DS3, playtime_forever: 600, rtime_last_played: 1700000000 }, { appid: ER, playtime_forever: 30 }] } });
  });
  const body = await (await hostedLibrary(bearer("/api/companion/library"))).json();
  expect(body.library).toMatchObject({ status: "ok", via: "web_api" });
  expect(body.library.games[DS3]).toEqual({ owned: true, playtimeMinutes: 600, lastPlayed: 1700000000 });
  expect(body.library.games[570940]).toMatchObject({ owned: false });

  const s = await (await state(new NextRequest(`${base}/api/state`))).json();
  expect(s.library.games[ER]).toMatchObject({ owned: true, playtimeMinutes: 30 });
  expect(await store.get(`users/${owner}/meta/library`)).toMatchObject({ status: "ok" });
});

it("hosted: without a key, ownership comes from the public achievement pages", async () => {
  await hosted(async (url) => communityStats(new Set([570940, DS3]))(url) ?? new Response("unexpected", { status: 500 }), null);
  const body = await (await hostedLibrary(bearer("/api/companion/library"))).json();
  expect(body.library).toMatchObject({ status: "partial", via: "community" });
  expect(body.library.games[DS3]).toEqual({ owned: true });
  // No proof either way: unknown, never "not owned".
  expect(body.library.games[ER]).toEqual({ owned: null });
});

it("hosted: a public stats page with every achievement locked and 0 hours is not proof of ownership", async () => {
  // Steam serves the full (locked) list for games the account doesn't own.
  const lockedList = `<playerstats><privacyState>public</privacyState><game><gameName>X</gameName></game><stats><hoursPlayed>0</hoursPlayed></stats><achievements>
<achievement closed="0"><name><![CDATA[A]]></name><apiname><![CDATA[a]]></apiname></achievement></achievements></playerstats>`;
  const played = lockedList.replace("<hoursPlayed>0</hoursPlayed>", "<hoursPlayed>12.5</hoursPlayed>");
  await hosted(async (url) => new Response(url.includes(`/stats/${DS3}/`) ? played : lockedList), null);
  const body = await (await hostedLibrary(bearer("/api/companion/library"))).json();
  expect(body.library.games[DS3]).toEqual({ owned: true });
  expect(body.library.games[ER]).toEqual({ owned: null });
  expect(body.library.games[570940]).toEqual({ owned: null });
});

it("hosted: hidden game details are reported as private, not as 'not owned'", async () => {
  await hosted(async (url) => url.includes("/GetOwnedGames/") ? Response.json({ response: {} }) : new Response("<playerstats><privacyState>friendsonly</privacyState></playerstats>"));
  const body = await (await hostedLibrary(bearer("/api/companion/library"))).json();
  expect(body.library.status).toBe("private");
  expect(body.library.games[DS3]).toEqual({ owned: null });
});

it("hosted: achievements of another game are stored per game and listed in the state", async () => {
  await hosted(async (url) => {
    expect(url).toContain(`appid=${DS3}`);
    if (url.includes("/GetSchemaForGame/")) return Response.json({ game: { availableGameStats: { achievements: [{ name: "LOC", displayName: "Lord of Cinder", icon: "https://x/i.jpg" }] } } });
    return Response.json({ playerstats: { success: true, achievements: [{ apiname: "LOC", achieved: 1, unlocktime: 1700000001 }] } });
  });
  const body = await (await hostedAchievements(bearer("/api/companion/achievements", { appid: DS3 }))).json();
  expect(body.achievements.items["Lord of Cinder"]).toMatchObject({ unlocked: true });
  const s = await (await state(new NextRequest(`${base}/api/state`))).json();
  expect(s.gameAchievements[DS3]).toMatchObject({ status: "ok", items: { "Lord of Cinder": { unlocked: true, unlockTime: 1700000001 } } });
  expect(s.achievements).toBeNull(); // DS Remastered's own document is untouched

  expect((await hostedAchievements(bearer("/api/companion/achievements", { appid: 730 }))).status).toBe(422);
});

it("desktop: the library check goes through the website with the sign-in token", async () => {
  const store = memoryStore("dev-file");
  __setStore(store);
  vi.stubEnv("LORDRAN_DESKTOP", "1");
  vi.stubEnv("APP_URL", "http://127.0.0.1:3000");
  vi.mocked(getSession).mockResolvedValue({ steamId: owner });
  await store.set(cloudLinkPath(owner), { token });
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    expect(url).toBe(`${CLOUD_SITE_URL}/api/companion/library`);
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${token}`);
    return Response.json({ ok: true, library: { status: "ok", checkedAt: 1, games: { [ER]: { owned: true, playtimeMinutes: 90 } } } });
  }));
  const res = await librarySync(new NextRequest("http://127.0.0.1:3000/api/library/sync", { method: "POST", headers: { origin: "http://127.0.0.1:3000" } }));
  expect(res.status).toBe(200);
  expect(await store.get(`users/${owner}/meta/library`)).toMatchObject({ status: "ok", via: "cloud", games: { [ER]: { owned: true } } });
});
