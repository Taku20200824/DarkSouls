import { withUser, ok } from "@/lib/server/api";
import { isDesktopApp } from "@/lib/server/env";
import type { StoredCharacter, TrackerEvent } from "@/lib/server/progress";

export const dynamic = "force-dynamic";

export const GET = withUser(async ({ steamId, store }) => {
  const [user, chars, events, snapshots, ach, manual, companion, sync] = await Promise.all([
    store.get<Record<string, unknown>>(`users/${steamId}`),
    store.list<StoredCharacter>(`users/${steamId}/characters`),
    store.list<TrackerEvent>(`users/${steamId}/events`, { orderBy: "at", desc: true, limit: 500 }),
    store.list<Record<string, unknown>>(`users/${steamId}/snapshots`, { orderBy: "at", desc: true, limit: 500 }),
    store.get<Record<string, unknown>>(`users/${steamId}/meta/achievements`),
    store.get<Record<string, unknown>>(`users/${steamId}/meta/manual`),
    store.get<{ lastHeartbeat?: number; deviceName?: string; version?: string; saveFound?: boolean; message?: string }>(`users/${steamId}/meta/companion`),
    store.get<{ lastSyncAt?: number; lastSource?: string; saveModifiedAt?: number | null }>(`users/${steamId}/meta/sync`),
  ]);
  const now = Date.now();
  const companionConnected = !!companion?.lastHeartbeat && now - companion.lastHeartbeat < 90_000;
  return ok({
    now,
    storeKind: store.kind,
    desktop: isDesktopApp(),
    user: user ?? { steamId },
    characters: chars,
    events,
    snapshots,
    achievements: ach ?? null,
    manual: manual ?? { bosses: {}, achievements: {}, quests: {} },
    companion: companion ? { ...companion, connected: companionConnected } : null,
    sync: sync ?? null,
  });
});
