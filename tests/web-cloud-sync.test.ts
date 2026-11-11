import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { POST as redeem, DELETE as disconnect } from "@/app/api/companion/pair/route";
import { POST as sync } from "@/app/api/companion/sync/route";
import { POST as authorizeDesktop } from "@/app/api/auth/desktop/route";
import { POST as refreshAchievements } from "@/app/api/achievements/sync/route";
import { GET as state } from "@/app/api/state/route";
import { sha256Hex } from "@/lib/server/security";
import { getSession } from "@/lib/server/session";
import { __setStore, type Store } from "@/lib/server/store";
import { parseSave } from "@/lib/save/ds1";

vi.mock("@/lib/server/session", () => ({ getSession: vi.fn() }));

const owner = "76561198362101413";
const other = "76561197960265729";
const base = "https://cloud-sync.example";

function memoryStore(): Store {
  const docs = new Map<string, object>();
  const store: Store = {
    kind: "firestore",
    get: async <T,>(path: string) => docs.get(path) as T ?? null,
    async set(path, data, merge) { docs.set(path, merge ? { ...docs.get(path), ...data } : data); },
    async create(path, data) { if (docs.has(path)) return false; docs.set(path, data); return true; },
    async add(path, data) { const id = String(docs.size); docs.set(`${path}/${id}`, data); return id; },
    list: async <T,>(path: string) => [...docs.entries()].filter(([key]) => key.startsWith(`${path}/`))
      .map(([key, value]) => ({ ...value as T, id: key.split("/").at(-1)! })),
    async delete(path) { docs.delete(path); },
    async deleteTree(path) { for (const key of [...docs.keys()]) if (key === path || key.startsWith(`${path}/`)) docs.delete(key); },
    async atomic(operation) { return operation(store); },
  };
  return store;
}

afterEach(() => { __setStore(null); vi.mocked(getSession).mockReset(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("authorizes a Steam-signed Windows login once, then serves the uploaded save and Steam profile to that account", async () => {
  const store = memoryStore();
  __setStore(store);
  vi.stubEnv("STEAM_API_KEY", "test-key");
  const steam = vi.fn(async (url: string) => {
    if (url === "https://steamcommunity.com/openid/login") return new Response("is_valid:true\n");
    if (url.includes("/GetPlayerSummaries/")) return Response.json({ response: { players: [{ steamid: owner, personaname: "Chosen Undead" }] } });
    if (url.includes("/GetOwnedGames/")) return Response.json({ response: { game_count: 1, games: [{ appid: 570940, playtime_forever: 91 }] } });
    if (url.includes("/GetSchemaForGame/")) return Response.json({ game: { availableGameStats: { achievements: [{ name: "bonfire", displayName: "Enkindle" }] } } });
    if (url.includes("/GetPlayerAchievements/")) return Response.json({ playerstats: { success: true, achievements: [{ apiname: "bonfire", achieved: 1, unlocktime: 1 }] } });
    throw new Error("Unexpected request");
  });
  vi.stubGlobal("fetch", steam);
  const verifier = "a".repeat(43);
  const callback = `http://127.0.0.1:47831/api/auth/steam/callback?state=xyz&desktop_proof=${await sha256Hex(verifier)}`;
  const identity = `https://steamcommunity.com/openid/id/${owner}`;
  const params = new URLSearchParams({
    "openid.mode": "id_res",
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.op_endpoint": "https://steamcommunity.com/openid/login",
    "openid.claimed_id": identity,
    "openid.identity": identity,
    "openid.return_to": callback,
    "openid.response_nonce": new Date().toISOString().replace(/\.\d+Z$/, "Z") + "test-desktop",
    "openid.signed": "op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
  });
  const signIn = (proof = verifier) => authorizeDesktop(new NextRequest(`${base}/api/auth/desktop`, {
    method: "POST", body: JSON.stringify({ assertion: params.toString(), verifier: proof }),
  }));
  expect((await signIn("b".repeat(43))).status).toBe(400);
  params.set("openid.return_to", callback.replace("127.0.0.1", "other.example"));
  expect((await signIn()).status).toBe(400);
  params.set("openid.return_to", callback);
  params.append("openid.claimed_id", `https://steamcommunity.com/openid/id/${other}`);
  expect((await signIn()).status).toBe(401);
  expect(steam).not.toHaveBeenCalled();
  params.set("openid.claimed_id", identity);
  const response = await signIn();
  expect(response.status).toBe(200);
  const { token } = await response.json();
  expect((await signIn()).status).toBe(401);
  expect(await store.list("companionTokens")).toHaveLength(1);
  const parsed = parseSave(readFileSync("tests/fixtures/ptde-dsfp.sl2"));
  const uploaded = await sync(new NextRequest(`${base}/api/companion/sync`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...parsed, client: "companion", consent: true, saveModifiedAt: Date.now() }),
  }));
  expect(uploaded.status).toBe(200);
  vi.mocked(getSession).mockResolvedValue({ steamId: owner });
  expect((await refreshAchievements(new NextRequest(`${base}/api/achievements/sync`, {
    method: "POST", headers: { origin: base },
  }))).status).toBe(200);
  const web = await (await state(new NextRequest(`${base}/api/state`))).json();
  expect(web.user).toMatchObject({ steamId: owner, personaName: "Chosen Undead", ownsGame: true, playtimeMinutes: 91 });
  expect(web.characters).toHaveLength(parsed.characters.length);
  expect(web.characters[0].character.name).toEqual(parsed.characters[0].name);
  expect(web.achievements.items.Enkindle).toMatchObject({ unlocked: true });
});

it("links the correct Steam account, shows its save on the web, and safely retries or revokes sync", async () => {
  const store = memoryStore();
  __setStore(store);
  const code = "ABCDEF23";
  await store.set(`pairing/${code}`, { steamId: owner, expiresAt: Date.now() + 60_000 });
  const pair = (steamId: string) => redeem(new NextRequest(`${base}/api/companion/pair`, {
    method: "POST", body: JSON.stringify({ code, deviceName: "Windows", steamId }),
  }));
  expect((await pair(other)).status).toBe(403);
  const paired = await pair(owner);
  expect(paired.status).toBe(200);
  const { token } = await paired.json();
  expect((await pair(owner)).status).toBe(401);

  const parsed = parseSave(readFileSync("tests/fixtures/ptde-dsfp.sl2"));
  const timestamp = Date.now() - 60_000;
  const payload = { ...parsed, client: "companion", consent: true, saveModifiedAt: timestamp };
  const send = (body: object) => sync(new NextRequest(`${base}/api/companion/sync`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
  }));
  expect((await send({ ...payload, checksumsValid: false })).status).toBe(422);
  expect((await send(payload)).status).toBe(200);
  expect(await (await send(payload)).json()).toMatchObject({ results: [] });
  expect(await (await send({ ...payload, saveModifiedAt: timestamp - 1 })).json()).toMatchObject({ results: [] });
  expect(await store.list(`users/${owner}/snapshots`)).toHaveLength(parsed.characters.length);

  const load = async (steamId: string) => {
    vi.mocked(getSession).mockResolvedValue({ steamId });
    return (await state(new NextRequest(`${base}/api/state`))).json();
  };
  expect(parsed.characters.length).toBeGreaterThan(0);
  const sameUser = await load(owner);
  expect(sameUser.characters).toHaveLength(parsed.characters.length);
  expect(sameUser.characters[0].character.name).toEqual(parsed.characters[0].name);
  expect((await load(other)).characters).toEqual([]);

  expect((await disconnect(new NextRequest(`${base}/api/companion/pair`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
  }))).status).toBe(200);
  expect((await send(payload)).status).toBe(401);
});
