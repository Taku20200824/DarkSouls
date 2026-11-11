import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { DELETE as deleteAccount } from "@/app/api/account/route";
import { DELETE_CONFIRMATION } from "@/lib/account";
import { getSession } from "@/lib/server/session";
import { __setStore, type Store } from "@/lib/server/store";

vi.mock("@/lib/server/session", async (orig) => ({ ...(await orig<typeof import("@/lib/server/session")>()), getSession: vi.fn() }));

const owner = "76561198362101413";
const other = "76561197960265729";
const base = "https://delete.example";

function memoryStore() {
  const docs = new Map<string, object>();
  const store: Store = {
    kind: "firestore",
    get: async <T,>(p: string) => (docs.get(p) as T) ?? null,
    async set(p, data, merge) { docs.set(p, merge ? { ...docs.get(p), ...data } : data); },
    async create(p, data) { if (docs.has(p)) return false; docs.set(p, data); return true; },
    async add(p, data) { const id = String(docs.size); docs.set(`${p}/${id}`, data); return id; },
    list: async <T,>(p: string) => [...docs.entries()]
      .filter(([k]) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes("/"))
      .map(([k, v]) => ({ ...(v as T), id: k.split("/").at(-1)! })),
    async delete(p) { docs.delete(p); },
    async deleteTree(p) { for (const k of [...docs.keys()]) if (k === p || k.startsWith(`${p}/`)) docs.delete(k); },
  };
  return { store, docs };
}

function seed(docs: Map<string, object>, steamId: string) {
  docs.set(`users/${steamId}`, { personaName: "x" });
  docs.set(`users/${steamId}/characters/0`, { name: "Knight" });
  docs.set(`users/${steamId}/events/e1`, { type: "death" });
  docs.set(`users/${steamId}/snapshots/s1`, { at: 1 });
  docs.set(`users/${steamId}/meta/sync`, { lastSyncAt: 1 });
  docs.set(`users/${steamId}/companionTokens/hash-${steamId}`, { deviceName: "PC" });
  docs.set(`companionTokens/hash-${steamId}`, { steamId });
}

const call = (body: unknown, origin: string | null = base) =>
  deleteAccount(new NextRequest(`${base}/api/account`, {
    method: "DELETE",
    headers: origin ? { origin, "content-type": "application/json" } : { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));

afterEach(() => { __setStore(null); vi.mocked(getSession).mockReset(); });

it("requires a session, same origin and the typed confirmation", async () => {
  const { store, docs } = memoryStore();
  __setStore(store);
  seed(docs, owner);
  vi.mocked(getSession).mockResolvedValue(null);
  expect((await call({ confirm: DELETE_CONFIRMATION })).status).toBe(401);
  vi.mocked(getSession).mockResolvedValue({ steamId: owner });
  expect((await call({ confirm: DELETE_CONFIRMATION }, "https://evil.example")).status).toBe(403);
  expect((await call({ confirm: DELETE_CONFIRMATION }, null)).status).toBe(403);
  expect((await call({ confirm: "delete" })).status).toBe(422);
  expect((await call({})).status).toBe(422);
  expect(docs.has(`users/${owner}/characters/0`)).toBe(true);
});

it("deletes only the signed-in account's data, revokes its upload tokens and signs out", async () => {
  const { store, docs } = memoryStore();
  __setStore(store);
  seed(docs, owner);
  seed(docs, other);
  vi.mocked(getSession).mockResolvedValue({ steamId: owner });
  const res = await call({ confirm: DELETE_CONFIRMATION });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, tokensRevoked: 1, scope: "web" });
  expect(res.headers.get("set-cookie")).toMatch(/lt_session=;.*Max-Age=0/i);
  expect([...docs.keys()].filter((k) => k.includes(owner))).toEqual([]);
  expect(docs.has(`companionTokens/hash-${owner}`)).toBe(false);
  expect(docs.has(`users/${other}/characters/0`)).toBe(true);
  expect(docs.has(`companionTokens/hash-${other}`)).toBe(true);
});
