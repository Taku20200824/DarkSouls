import { withUser, ok } from "@/lib/server/api";
import { isDesktopApp } from "@/lib/server/env";
import { cloudLinkPath, type CloudLink } from "@/lib/server/desktop-cloud";
import type { StoredCharacter, TrackerEvent } from "@/lib/server/progress";

export const dynamic = "force-dynamic";

export const GET = withUser(async ({ steamId, store }) => {
  const desktop = isDesktopApp();
  const [user, chars, events, snapshots, ach, manual, companion, sync, link] = await Promise.all([
    store.get<Record<string, unknown>>(`users/${steamId}`),
    store.list<StoredCharacter>(`users/${steamId}/characters`),
    store.list<TrackerEvent>(`users/${steamId}/events`, { orderBy: "at", desc: true, limit: 500 }),
    store.list<Record<string, unknown>>(`users/${steamId}/snapshots`, { orderBy: "at", desc: true, limit: 500 }),
    store.get<Record<string, unknown>>(`users/${steamId}/meta/achievements`),
    store.get<Record<string, unknown>>(`users/${steamId}/meta/manual`),
    store.get<{ lastHeartbeat?: number; deviceName?: string; version?: string; saveFound?: boolean; message?: string }>(`users/${steamId}/meta/companion`),
    store.get<{ lastSyncAt?: number; lastSource?: string; saveModifiedAt?: number | null }>(`users/${steamId}/meta/sync`),
    desktop && store.kind === "dev-file" ? store.get<CloudLink>(cloudLinkPath(steamId)) : null,
  ]);
  const now = Date.now();
  const companionConnected = !!companion?.lastHeartbeat && now - companion.lastHeartbeat < 90_000;
  return ok({
    now,
    storeKind: store.kind,
    desktop,
    desktopCloud: link ? { lastSyncedAt: link.lastSyncedAt, error: link.error } : null,
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
