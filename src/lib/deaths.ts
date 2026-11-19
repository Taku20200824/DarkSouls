/**
 * Death analytics from the tracker's events and snapshots.
 *
 * A death event says the save's death counter went up between two syncs, stamped with the
 * time of the later sync. When the save had not been synced for a while (app closed, offline,
 * first sync after linking), one event holds every death of that whole gap — so it can't be
 * placed on a day or a session. Those deaths are counted as "undated" instead of being piled
 * onto the moment the sync happened.
 */
export const SESSION_GAP = 2 * 3600_000;

export interface DeathEventLike {
  at: number;
  data: Record<string, unknown>;
}
export interface SnapshotLike {
  at: number;
  deaths: number | null;
}

export interface DeathStats {
  /** Deaths during the current play session (trailing snapshots without a 2 h gap). */
  session: number;
  /** False when the last sync is over 2 h old: no session is going on. */
  sessionLive: boolean;
  /** Deaths dated to today (local time). */
  today: number;
  /** Deaths per local day, oldest first (dated deaths only). */
  perDay: [string, number][];
  /** Deaths that happened while no sync was watching (can't be dated). */
  undated: number;
  /** Longest stretch of active play (syncs ≤ 2 h apart) without the counter going up, in ms. */
  longestAliveMs: number;
}

const delta = (e: DeathEventLike) => Number(e.data.delta ?? 0);

export function deathStats(deathsIn: readonly DeathEventLike[], snapsIn: readonly SnapshotLike[], now = Date.now(), dayKey = (t: number) => new Date(t).toLocaleDateString("mn-MN")): DeathStats {
  const deaths = [...deathsIn].sort((a, b) => a.at - b.at);
  const snaps = snapsIn.filter((s) => s.deaths !== null).sort((a, b) => a.at - b.at);

  // When did the sync before this event happen? Newer events carry it; older ones are
  // matched to the last snapshot strictly before them.
  const sinceOf = (e: DeathEventLike): number | null => {
    const since = Number(e.data.sinceAt);
    if (Number.isFinite(since) && since > 0) return since;
    let prev: number | null = null;
    for (const s of snaps) {
      if (s.at >= e.at) break;
      prev = s.at;
    }
    return prev;
  };
  const dated = (e: DeathEventLike) => {
    const since = sinceOf(e);
    return since !== null && e.at - since <= SESSION_GAP;
  };

  let sessionStart = snaps.length ? snaps[snaps.length - 1].at : now;
  for (let i = snaps.length - 1; i > 0; i--) {
    if (snaps[i].at - snaps[i - 1].at > SESSION_GAP) break;
    sessionStart = snaps[i - 1].at;
  }
  // A session that ended more than 2 h ago is over: nothing counts as "this session".
  const sessionLive = snaps.length > 0 && now - snaps[snaps.length - 1].at <= SESSION_GAP;

  const todayKey = dayKey(now);
  let session = 0, today = 0, undated = 0;
  const perDay = new Map<string, number>();
  for (const e of deaths) {
    const n = delta(e);
    if (n <= 0) continue;
    if (!dated(e)) {
      undated += n;
      continue;
    }
    if (sessionLive && e.at >= sessionStart) session += n;
    const k = dayKey(e.at);
    if (k === todayKey) today += n;
    perDay.set(k, (perDay.get(k) ?? 0) + n);
  }

  let run = 0, longestAliveMs = 0;
  for (let i = 1; i < snaps.length; i++) {
    const gap = snaps[i].at - snaps[i - 1].at;
    if (gap > SESSION_GAP || snaps[i].deaths! > snaps[i - 1].deaths!) run = 0;
    else run += gap;
    longestAliveMs = Math.max(longestAliveMs, run);
  }

  return { session, sessionLive, today, perDay: [...perDay.entries()], undated, longestAliveMs };
}
