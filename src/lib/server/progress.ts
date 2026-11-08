import "server-only";
import type { ParsedCharacter } from "@/lib/save/types";
import type { SyncPayload } from "@/lib/save/schema";
import { getStore } from "./store";

export type EventType = "death" | "level" | "boss" | "bonfire" | "ng";
export interface TrackerEvent {
  type: EventType;
  at: number;
  charKey: string;
  data: Record<string, unknown>;
  /** for deaths: what we can say about the cause */
  attribution?: { label: "Unconfirmed" | "User confirmation"; bossId?: string; area?: string };
  source: "Parsed save file" | "Companion";
  ackedAt?: number;
}

export interface StoredCharacter {
  character: ParsedCharacter;
  source: "Parsed save file" | "Companion";
  updatedAt: number;
  saveModifiedAt?: number;
  checksumsValid: boolean;
  parserVersion: string;
  /** Every boss ever recorded as defeated, so a boss that drops out of one parse and returns is not celebrated twice. */
  bossesSeen?: string[];
}

/** Drops boss events for bosses that were already recorded before. */
export function withoutSeenBosses(events: TrackerEvent[], seen: ReadonlySet<string>): TrackerEvent[] {
  return events.filter((e) => e.type !== "boss" || !seen.has(String(e.data.boss)));
}

export function charKey(c: Pick<ParsedCharacter, "slot" | "name">): string {
  const n = c.name.value ?? "unnamed";
  let h = 0;
  for (const ch of n) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return `slot${c.slot}-${h.toString(36)}`;
}

const defeatedSet = (c: ParsedCharacter) => new Set(Object.keys(c.bosses));

/** Pure diff: what changed between two snapshots of the same character. */
export function diffCharacters(prev: ParsedCharacter, next: ParsedCharacter, at: number, key: string, source: TrackerEvent["source"]): TrackerEvent[] {
  const ev: TrackerEvent[] = [];
  const pd = prev.deaths.value;
  const nd = next.deaths.value;
  if (pd !== null && nd !== null && nd > pd)
    ev.push({ type: "death", at, charKey: key, source, data: { from: pd, to: nd, delta: nd - pd }, attribution: { label: "Unconfirmed" } });
  const pl = prev.level.value;
  const nl = next.level.value;
  if (pl !== null && nl !== null && nl > pl) ev.push({ type: "level", at, charKey: key, source, data: { from: pl, to: nl } });
  const pn = prev.ngCycle.value;
  const nn = next.ngCycle.value;
  if (pn !== null && nn !== null && nn !== pn) ev.push({ type: "ng", at, charKey: key, source, data: { from: pn, to: nn } });
  const before = defeatedSet(prev);
  for (const b of Object.keys(next.bosses)) {
    if (!before.has(b)) ev.push({ type: "boss", at, charKey: key, source, data: { boss: b, evidence: next.bosses[b] } });
  }
  const pb = new Set((prev.bonfires.value ?? []).map((b) => b.id));
  const newB = (next.bonfires.value ?? []).filter((b) => !pb.has(b.id));
  if (prev.bonfires.value && newB.length) ev.push({ type: "bonfire", at, charKey: key, source, data: { bonfires: newB.map((b) => b.name) } });
  return ev;
}

/** Seeds `bossesSeen` for characters stored before it existed, from their past boss events. */
async function bossesFromEvents(steamId: string, key: string, prev: ParsedCharacter): Promise<string[]> {
  const past = await getStore().list<TrackerEvent>(`users/${steamId}/events`, { orderBy: "at", desc: true, limit: 500 });
  const fromEvents = past.filter((e) => e.type === "boss" && e.charKey === key).map((e) => String(e.data.boss));
  return [...Object.keys(prev.bosses), ...fromEvents];
}

export async function ingest(steamId: string, payload: SyncPayload, now = Date.now()) {
  const store = getStore();
  const source: TrackerEvent["source"] = payload.client === "companion" ? "Companion" : "Parsed save file";
  const results: { key: string; events: number; baseline: boolean }[] = [];
  for (const c of payload.characters as ParsedCharacter[]) {
    const key = charKey(c);
    const path = `users/${steamId}/characters/${key}`;
    const prev = await store.get<StoredCharacter>(path);
    const seen = new Set(prev?.bossesSeen ?? (prev ? await bossesFromEvents(steamId, key, prev.character) : []));
    const events = prev ? withoutSeenBosses(diffCharacters(prev.character, c, now, key, source), seen) : [];
    for (const e of events) await store.add(`users/${steamId}/events`, e);
    const doc: StoredCharacter = {
      character: c,
      source,
      updatedAt: now,
      saveModifiedAt: payload.saveModifiedAt,
      checksumsValid: payload.checksumsValid,
      parserVersion: payload.parserVersion,
      bossesSeen: [...new Set([...seen, ...Object.keys(c.bosses)])],
    };
    await store.set(path, doc);
    await store.add(`users/${steamId}/snapshots`, {
      charKey: key,
      at: now,
      level: c.level.value,
      deaths: c.deaths.value,
      souls: c.souls.value,
      ng: c.ngCycle.value,
      bosses: Object.keys(c.bosses).length,
      bonfires: c.bonfires.value?.length ?? null,
      source,
    });
    results.push({ key, events: events.length, baseline: !prev });
  }
  await store.set(`users/${steamId}/meta/sync`, { lastSyncAt: now, lastSource: source, saveModifiedAt: payload.saveModifiedAt ?? null }, true);
  return results;
}
