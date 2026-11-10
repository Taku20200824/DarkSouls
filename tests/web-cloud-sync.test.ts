import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { POST as redeem, DELETE as disconnect } from "@/app/api/companion/pair/route";
import { POST as sync } from "@/app/api/companion/sync/route";
import { GET as state } from "@/app/api/state/route";
import { getSession } from "@/lib/server/session";
import { __setStore, type Store } from "@/lib/server/store";
import { parseSave } from "@/lib/save/ds1";

vi.mock("@/lib/server/session", () => ({ getSession: vi.fn() }));

const owner = "76561198362101413";
const other = "76561197960265729";
const base = "https://cloud-sync.example";

function memoryStore(): Store {
  const docs = new Map<string, object>();
  return {
    kind: "firestore",
    get: async <T,>(path: string) => docs.get(path) as T ?? null,
    async set(path, data, merge) { docs.set(path, merge ? { ...docs.get(path), ...data } : data); },
    async create(path, data) { if (docs.has(path)) return false; docs.set(path, data); return true; },
    async add(path, data) { const id = String(docs.size); docs.set(`${path}/${id}`, data); return id; },
    list: async <T,>(path: string) => [...docs.entries()].filter(([key]) => key.startsWith(`${path}/`))
      .map(([key, value]) => ({ ...value as T, id: key.split("/").at(-1)! })),
    async delete(path) { docs.delete(path); },
  };
}

afterEach(() => { __setStore(null); vi.mocked(getSession).mockReset(); });

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
