/**
 * Steam Web API calls (server-side only; the key never reaches the browser).
 * Dark Souls: Remastered appid = 570940.
 */
export const DSR_APPID = 570940;
const BASE = "https://api.steampowered.com";

type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface PlayerSummary {
  steamid: string;
  personaname: string;
  avatarfull?: string;
  avatarmedium?: string;
  profileurl?: string;
  communityvisibilitystate?: number; // 3 = public
}

export interface SchemaAchievement {
  name: string; // api name
  displayName: string;
  description?: string;
  icon?: string;
  icongray?: string;
  hidden?: number;
}

export interface PlayerAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; reason: "private" | "no_key" | "not_owned" | "error"; status?: number; message?: string };

function key(): string | null {
  const k = process.env.STEAM_API_KEY;
  return k && k.trim() ? k.trim() : null;
}

export async function getPlayerSummary(steamId: string, f: FetchLike = fetch as unknown as FetchLike): Promise<ApiResult<PlayerSummary>> {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  try {
    const r = await f(`${BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(k)}&steamids=${steamId}`);
    if (!r.ok) return { ok: false, reason: "error", status: r.status };
    const j = (await r.json()) as { response?: { players?: PlayerSummary[] } };
    const p = j.response?.players?.[0];
    return p ? { ok: true, data: p } : { ok: false, reason: "error", message: "player not found" };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

/** Ownership check. Returns null data when the game list is hidden (private game details). */
export async function getOwnsGame(steamId: string, f: FetchLike = fetch as unknown as FetchLike): Promise<ApiResult<{ owned: boolean | null; playtimeMinutes: number | null }>> {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  try {
    const url = `${BASE}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(k)}&steamid=${steamId}&include_played_free_games=1&appids_filter%5B0%5D=${DSR_APPID}`;
    const r = await f(url);
    if (!r.ok) return { ok: false, reason: "error", status: r.status };
    const j = (await r.json()) as { response?: { game_count?: number; games?: { appid: number; playtime_forever: number }[] } };
    if (!j.response || j.response.game_count === undefined) return { ok: true, data: { owned: null, playtimeMinutes: null } }; // private
    const g = j.response.games?.find((x) => x.appid === DSR_APPID);
    return { ok: true, data: { owned: !!g, playtimeMinutes: g ? g.playtime_forever : null } };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

export async function getSchema(f: FetchLike = fetch as unknown as FetchLike): Promise<ApiResult<SchemaAchievement[]>> {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  try {
    const r = await f(`${BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${encodeURIComponent(k)}&appid=${DSR_APPID}&l=english`);
    if (!r.ok) return { ok: false, reason: "error", status: r.status };
    const j = (await r.json()) as { game?: { availableGameStats?: { achievements?: SchemaAchievement[] } } };
    const a = j.game?.availableGameStats?.achievements;
    return a ? { ok: true, data: a } : { ok: false, reason: "error", message: "no schema" };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

export async function getPlayerAchievements(steamId: string, f: FetchLike = fetch as unknown as FetchLike): Promise<ApiResult<PlayerAchievement[]>> {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  try {
    const r = await f(`${BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${encodeURIComponent(k)}&steamid=${steamId}&appid=${DSR_APPID}`);
    const j = (await r.json().catch(() => ({}))) as { playerstats?: { success?: boolean; error?: string; achievements?: PlayerAchievement[] } };
    const ps = j.playerstats;
    if (ps?.success && ps.achievements) return { ok: true, data: ps.achievements };
    const msg = ps?.error ?? "";
    if (/not public/i.test(msg) || r.status === 403) return { ok: false, reason: "private", status: r.status, message: msg };
    if (/no stats|requested app has no stats/i.test(msg)) return { ok: false, reason: "not_owned", status: r.status, message: msg };
    return { ok: false, reason: "error", status: r.status, message: msg };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

/** Merge schema + player data into a map keyed by display name. */
export function mergeAchievements(schema: SchemaAchievement[], player: PlayerAchievement[]) {
  const byApi = new Map(player.map((p) => [p.apiname, p]));
  const out: Record<string, { unlocked: boolean; unlockTime: number | null; apiName: string; icon?: string; iconGray?: string; description?: string }> = {};
  for (const s of schema) {
    const p = byApi.get(s.name);
    out[s.displayName] = {
      unlocked: !!p && p.achieved === 1,
      unlockTime: p && p.achieved === 1 && p.unlocktime > 0 ? p.unlocktime : null,
      apiName: s.name,
      icon: s.icon,
      iconGray: s.icongray,
      description: s.description,
    };
  }
  return out;
}
