import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsRoots, findSave, steamAccountId, syncDesktopSave, STABLE_MS } from "@/lib/server/desktop-sync";
import { ingest } from "@/lib/server/progress";
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
    list: async () => [],
    delete: async () => {},
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
  afterEach(() => fs.rmSync(docs, { recursive: true, force: true }));

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
});
