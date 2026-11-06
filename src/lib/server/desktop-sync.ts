import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { MAX_SAVE_BYTES } from "@/lib/save/bnd4";
import { PARSER_VERSION, parseSave } from "@/lib/save/ds1";
import { SyncPayloadSchema } from "@/lib/save/schema";
import { ingest } from "./progress";
import type { Store } from "./store";

/**
 * Automatic save sync for the desktop build. The app runs on the same PC as the
 * game, so it reads DRAKS0005.sl2 directly (read-only) and needs no pairing code
 * and no separate companion process.
 */
const STEAM_ID64_BASE = 76561197960265728n;
const SAVE_NAME = "DRAKS0005.sl2";
const SAVE_FOLDERS = [
  ["NBGI", "DARK SOULS REMASTERED"],
  ["FromSoftware", "DARK SOULS REMASTERED"],
  ["NBGI", "570940"],
];
/** The game must have left the file alone this long before it is read. */
export const STABLE_MS = 3_000;
/** Keeps the status "connected" (the state route allows 90 s) without a write on every poll. */
export const HEARTBEAT_MS = 30_000;

interface DesktopStatus {
  lastHeartbeat?: number;
  saveFound?: boolean;
  saveModifiedAt?: number | null;
  message?: string | null;
  syncedSaveAt?: number;
  syncedParser?: string;
}

/** The game names each save folder after the 32-bit Steam account ID. */
export function steamAccountId(steamId: string): string {
  return (BigInt(steamId) - STEAM_ID64_BASE).toString();
}

export function documentsRoots(e: Record<string, string | undefined> = process.env): string[] {
  const roots = [e.LORDRAN_DOCUMENTS_DIR];
  if (e.OneDrive) roots.push(path.join(e.OneDrive, "Documents"));
  if (e.USERPROFILE) roots.push(path.join(e.USERPROFILE, "Documents"), path.join(e.USERPROFILE, "OneDrive", "Documents"));
  return [...new Set(roots.filter((r): r is string => !!r))];
}

/** The signed-in account's save, or the newest save when no folder matches that account. */
export async function findSave(steamId: string, roots: string[]): Promise<string | null> {
  const account = steamAccountId(steamId);
  const found: { file: string; mtime: number; own: boolean }[] = [];
  for (const root of roots) {
    for (const folder of SAVE_FOLDERS) {
      const base = path.join(root, ...folder);
      const ids = await fs.readdir(base).catch(() => [] as string[]);
      for (const id of ids) {
        const file = path.join(base, id, SAVE_NAME);
        const st = await fs.stat(file).catch(() => null);
        if (st?.isFile()) found.push({ file, mtime: st.mtimeMs, own: id === account });
      }
    }
  }
  found.sort((a, b) => Number(b.own) - Number(a.own) || b.mtime - a.mtime);
  return found[0]?.file ?? null;
}

export async function syncDesktopSave(steamId: string, store: Store, now = Date.now(), roots = documentsRoots()): Promise<{ changed: boolean }> {
  const statusPath = `users/${steamId}/meta/companion`;
  const prev = (await store.get<DesktopStatus>(statusPath)) ?? {};

  const report = async (next: Pick<DesktopStatus, "saveFound" | "saveModifiedAt" | "message">, synced?: Pick<DesktopStatus, "syncedSaveAt" | "syncedParser">) => {
    const changed = !!synced || prev.saveFound !== next.saveFound || prev.saveModifiedAt !== next.saveModifiedAt || prev.message !== next.message;
    if (changed || now - (prev.lastHeartbeat ?? 0) >= HEARTBEAT_MS) {
      await store.set(statusPath, { ...next, ...synced, deviceName: "Энэ компьютер", lastHeartbeat: now, ...(synced ? { lastSyncAt: now } : {}) }, true);
    }
    return { changed };
  };

  const file = await findSave(steamId, roots);
  if (!file) return report({ saveFound: false, saveModifiedAt: null, message: `${SAVE_NAME} not found` });

  const st = await fs.stat(file).catch(() => null);
  if (!st) return report({ saveFound: false, saveModifiedAt: null, message: `${SAVE_NAME} not found` });
  const saveModifiedAt = Math.floor(st.mtimeMs);
  const alreadySynced = prev.syncedSaveAt === saveModifiedAt && prev.syncedParser === PARSER_VERSION;
  if (alreadySynced || now - saveModifiedAt < STABLE_MS) return report({ saveFound: true, saveModifiedAt, message: null });
  if (st.size > MAX_SAVE_BYTES) return report({ saveFound: true, saveModifiedAt, message: "Save file is too large" });

  try {
    const data = await fs.readFile(file);
    const after = await fs.stat(file);
    const parsed = parseSave(data);
    // A half-written save fails its MD5 checks; the next poll tries again.
    if (after.size !== st.size || after.mtimeMs !== st.mtimeMs || data.length !== st.size || !parsed.checksumsValid) {
      return report({ saveFound: true, saveModifiedAt, message: "Save file is being written; will retry" });
    }
    const payload = SyncPayloadSchema.safeParse({
      parserVersion: parsed.parserVersion,
      game: parsed.game,
      checksumsValid: parsed.checksumsValid,
      characters: parsed.characters,
      saveModifiedAt,
      client: "companion",
      consent: true,
    });
    if (!payload.success) return report({ saveFound: true, saveModifiedAt, message: "Save data failed validation" });
    await ingest(steamId, payload.data, now);
    return report({ saveFound: true, saveModifiedAt, message: null }, { syncedSaveAt: saveModifiedAt, syncedParser: PARSER_VERSION });
  } catch (e) {
    console.error(e);
    return report({ saveFound: true, saveModifiedAt, message: "Could not read the save file; will retry" });
  }
}
