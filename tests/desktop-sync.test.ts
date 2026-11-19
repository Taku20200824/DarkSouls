import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsRoots, findSave, steamAccountId, syncDesktopSave, STABLE_MS } from "@/lib/server/desktop-sync";
import { ingest } from "@/lib/server/progress";
import { cloudLinkPath, UPLOAD_RETRY_MS } from "@/lib/server/desktop-cloud";
import { syncLinkedAccounts } from "@/lib/server/desktop-autosync";
import type { Store } from "@/lib/server/store";

vi.mock("@/lib/server/progress", () => ({ ingest: vi.fn(async () => []) }));

const STEAM_ID = "76561198362101413";
const ACCOUNT = "401835685";
const FIXTURE = path.join(__dirname, "fixtures", "ptde-dsfp.sl2");

function memoryStore(): Store {
  const docs = new Map<string, object>();
  return {
    kind: "dev-file",
    get: async <T,>(p: string) => (docs.get(p) as T) ?? null,
    set: async (p: string, data: object, merge = false) => {
      docs.set(p, merge ? { ...docs.get(p), ...data } : data);
    },
    create: async () => true,
    add: async () => "id",
    list: async <T,>(c: string) => [...docs.entries()]
      .filter(([k]) => k.startsWith(`${c}/`) && !k.slice(c.length + 1).includes("/"))
      .map(([k, v]) => ({ ...(v as T), id: k.slice(c.length + 1) })),
    delete: async () => {},
    deleteTree: async () => {},
  };
}

describe("desktop save sync", () => {
  let docs: string;
  const place = (account: string, source = FIXTURE) => {
    const dir = path.join(docs, "NBGI", "DARK SOULS REMASTERED", account);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "DRAKS0005.sl2");
    fs.copyFileSync(source, file);
    return file;
  };
  const age = (file: string, seconds: number) => {
    const t = new Date(Date.now() - seconds * 1000);
    fs.utimesSync(file, t, t);
    return Math.floor(fs.statSync(file).mtimeMs);
  };

  beforeEach(() => {
    docs = fs.mkdtempSync(path.join(os.tmpdir(), "lordran-docs-"));
    vi.mocked(ingest).mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fs.rmSync(docs, { recursive: true, force: true });
  });

  it("maps a SteamID64 to the save folder name", () => {
    expect(steamAccountId(STEAM_ID)).toBe(ACCOUNT);
  });

  it("uses the Documents folder Electron reports, then OneDrive", () => {
    const roots = documentsRoots({ LORDRAN_DOCUMENTS_DIR: "D:\\Docs", USERPROFILE: "C:\\Users\\a" });
    expect(roots[0]).toBe("D:\\Docs");
    expect(roots).toContain(path.join("C:\\Users\\a", "OneDrive", "Documents"));
  });

  it("prefers the signed-in account over a newer save from another account", async () => {
    const own = place(ACCOUNT);
    const other = place("999");
    age(own, 500);
    age(other, 10);
    expect(await findSave(STEAM_ID, [docs])).toBe(own);
  });

  it("falls back to the newest save when no folder matches", async () => {
    const older = place("111");
    const newer = place("222");
    age(older, 500);
    age(newer, 10);
    expect(await findSave(STEAM_ID, [docs])).toBe(newer);
  });

  it("syncs a finished save once and then waits for the next change", async () => {
    const file = place(ACCOUNT);
    const modified = age(file, 60);
    const store = memoryStore();

    expect(await syncDesktopSave(STEAM_ID, store, Date.now(), [docs])).toEqual({ changed: true });
    expect(ingest).toHaveBeenCalledTimes(1);
    expect(vi.mocked(ingest).mock.calls[0][1]).toMatchObject({ client: "companion", saveModifiedAt: modified });

    expect(await syncDesktopSave(STEAM_ID, store, Date.now(), [docs])).toEqual({ changed: false });
    expect(ingest).toHaveBeenCalledTimes(1);

    age(file, 30);
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(ingest).toHaveBeenCalledTimes(2);
  });

  it("waits while the game may still be writing", async () => {
    const file = place(ACCOUNT);
    const modified = age(file, 0);
    await syncDesktopSave(STEAM_ID, memoryStore(), modified + STABLE_MS - 1, [docs]);
    expect(ingest).not.toHaveBeenCalled();
  });

  it("rejects a half-written save and reports it", async () => {
    const file = place(ACCOUNT);
    const bytes = fs.readFileSync(file);
    bytes.fill(0xff, 0x1000, 0x1100);
    fs.writeFileSync(file, bytes);
    age(file, 60);
    const store = memoryStore();
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(ingest).not.toHaveBeenCalled();
    expect(await store.get(`users/${STEAM_ID}/meta/companion`)).toMatchObject({ saveFound: true, message: expect.stringContaining("retry") });
  });

  it("reports a missing save", async () => {
    const store = memoryStore();
    expect(await syncDesktopSave(STEAM_ID, store, Date.now(), [docs])).toEqual({ changed: true });
    expect(await store.get(`users/${STEAM_ID}/meta/companion`)).toMatchObject({ saveFound: false });
  });

  it("uploads an already imported save after linking, retries failure, and stops after success", async () => {
    const file = place(ACCOUNT);
    const modified = age(file, 60);
    const store = memoryStore();
    const request = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal("fetch", request);
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(request).not.toHaveBeenCalled();

    await store.set(cloudLinkPath(STEAM_ID), { token: "test-token" });
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(await store.get(cloudLinkPath(STEAM_ID))).toMatchObject({ error: "upload_failed" });
    // Backs off instead of hitting the network on every poll …
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(request).toHaveBeenCalledTimes(1);
    // … and retries once the wait is over.
    const later = Date.now() + UPLOAD_RETRY_MS + 1;
    await syncDesktopSave(STEAM_ID, store, later, [docs]);
    expect(await store.get(cloudLinkPath(STEAM_ID))).toMatchObject({ syncedSaveAt: modified, error: null });
    await syncDesktopSave(STEAM_ID, store, later, [docs]);

    expect(ingest).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(2);
    const [url, options] = request.mock.calls[1];
    expect(url).toBe("https://darksouls-five.vercel.app/api/companion/sync");
    expect(JSON.parse(options.body)).toMatchObject({ saveModifiedAt: modified, checksumsValid: true, client: "companion" });
  });

  it("re-sends after the link is reset (new sign-in / send now) and records the website's answer", async () => {
    const file = place(ACCOUNT);
    age(file, 60);
    const store = memoryStore();
    const request = vi.fn()
      .mockResolvedValueOnce(Response.json({ ok: true, unchanged: false }))
      .mockResolvedValueOnce(Response.json({ ok: true, unchanged: true }));
    vi.stubGlobal("fetch", request);
    await store.set(cloudLinkPath(STEAM_ID), { token: "test-token" });
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(await store.get(cloudLinkPath(STEAM_ID))).toMatchObject({ lastResult: "stored", error: null });

    // Same save, nothing new: without a reset the app does not upload again …
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(request).toHaveBeenCalledTimes(1);
    // … but a reset (what sign-in and "send now" do) pushes it and the site confirms it.
    await store.set(cloudLinkPath(STEAM_ID), { token: "test-token", error: null });
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(request).toHaveBeenCalledTimes(2);
    expect(await store.get(cloudLinkPath(STEAM_ID))).toMatchObject({ lastResult: "unchanged", error: null });
  });

  it("can display a fallback save locally without uploading it for the wrong Steam account", async () => {
    age(place("999"), 60);
    const store = memoryStore();
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    await store.set(cloudLinkPath(STEAM_ID), { token: "test-token" });
    await syncDesktopSave(STEAM_ID, store, Date.now(), [docs]);
    expect(ingest).toHaveBeenCalledOnce();
    expect(request).not.toHaveBeenCalled();
    expect(await store.get(cloudLinkPath(STEAM_ID))).toMatchObject({ error: "account_save_not_found" });
  });

  it("syncs every linked account in the background, without the page open", async () => {
    const file = place(ACCOUNT);
    const modified = age(file, 60);
    const store = memoryStore();
    const request = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", request);
    await store.set(`users/${STEAM_ID}`, { steamId: STEAM_ID });
    await store.set("users/76561198000000001", { steamId: "76561198000000001" }); // signed in once, never linked
    await store.set(cloudLinkPath(STEAM_ID), { token: "test-token" });

    expect(await syncLinkedAccounts(store, [docs])).toEqual([STEAM_ID]);
    expect(request).toHaveBeenCalledOnce();
    expect(await store.get(cloudLinkPath(STEAM_ID))).toMatchObject({ syncedSaveAt: modified, error: null });
    // Nothing new on the next pass.
    await syncLinkedAccounts(store, [docs]);
    expect(request).toHaveBeenCalledOnce();
  });
});
