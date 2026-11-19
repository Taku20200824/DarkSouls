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

export type ApiResult<T> = { ok: true; data: T } | { ok: false; reason: "private" | "no_key" | "bad_key" | "not_owned" | "error"; status?: number; message?: string };

/** Steam answers a wrong or revoked key with a 403 HTML page ("Please verify your key= parameter"). */
const isBadKey = (status: number, json: unknown) => (status === 401 || status === 403) && (json === null || typeof json !== "object");

function key(): string | null {
  const k = process.env.STEAM_API_KEY;
  return k && k.trim() ? k.trim() : null;
}

export async function getPlayerSummary(steamId: string, f: FetchLike = fetch as unknown as FetchLike): Promise<ApiResult<PlayerSummary>> {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  try {
    const r = await f(`${BASE}/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(k)}&steamids=${steamId}`);
    if (!r.ok) return { ok: false, reason: isBadKey(r.status, null) ? "bad_key" : "error", status: r.status };
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
    if (!r.ok) return { ok: false, reason: isBadKey(r.status, null) ? "bad_key" : "error", status: r.status };
    const j = (await r.json()) as { response?: { game_count?: number; games?: { appid: number; playtime_forever: number }[] } };
    if (!j.response || j.response.game_count === undefined) return { ok: true, data: { owned: null, playtimeMinutes: null } }; // private
    const g = j.response.games?.find((x) => x.appid === DSR_APPID);
    return { ok: true, data: { owned: !!g, playtimeMinutes: g ? g.playtime_forever : null } };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

export interface OwnedGame {
  owned: boolean;
  playtimeMinutes: number | null;
  /** Unix seconds; 0 / missing when Steam does not say. */
  lastPlayed: number | null;
}

/**
 * Which of `appids` the account owns, with playtime. `null` data = the account's game
 * details are private, so ownership can't be told from the Web API.
 */
export async function getOwnedGames(steamId: string, appids: readonly number[], f: FetchLike = fetch as unknown as FetchLike): Promise<ApiResult<Record<number, OwnedGame> | null>> {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  try {
    const filter = appids.map((a, i) => `&appids_filter%5B${i}%5D=${a}`).join("");
    const r = await f(`${BASE}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(k)}&steamid=${steamId}&include_played_free_games=1&skip_unvetted_apps=0${filter}`);
    if (!r.ok) return { ok: false, reason: isBadKey(r.status, null) ? "bad_key" : "error", status: r.status };
    const j = (await r.json()) as { response?: { game_count?: number; games?: { appid: number; playtime_forever?: number; rtime_last_played?: number }[] } };
    if (!j.response || j.response.game_count === undefined) return { ok: true, data: null };
    const out: Record<number, OwnedGame> = {};
    for (const a of appids) {
      const g = j.response.games?.find((x) => x.appid === a);
      out[a] = { owned: !!g, playtimeMinutes: g ? g.playtime_forever ?? 0 : null, lastPlayed: g?.rtime_last_played || null };
    }
    return { ok: true, data: out };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

export async function getSchema(f: FetchLike = fetch as unknown as FetchLike, appid = DSR_APPID): Promise<ApiResult<SchemaAchievement[]>> {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  try {
    const r = await f(`${BASE}/ISteamUserStats/GetSchemaForGame/v2/?key=${encodeURIComponent(k)}&appid=${appid}&l=english`);
    if (!r.ok) return { ok: false, reason: isBadKey(r.status, null) ? "bad_key" : "error", status: r.status };
    const j = (await r.json()) as { game?: { availableGameStats?: { achievements?: SchemaAchievement[] } } };
    const a = j.game?.availableGameStats?.achievements;
    return a ? { ok: true, data: a } : { ok: false, reason: "error", message: "no schema" };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

export async function getPlayerAchievements(steamId: string, f: FetchLike = fetch as unknown as FetchLike, appid = DSR_APPID): Promise<ApiResult<PlayerAchievement[]>> {
  const k = key();
  if (!k) return { ok: false, reason: "no_key" };
  try {
    const r = await f(`${BASE}/ISteamUserStats/GetPlayerAchievements/v1/?key=${encodeURIComponent(k)}&steamid=${steamId}&appid=${appid}`);
    const raw = await r.json().catch(() => null);
    if (isBadKey(r.status, raw)) return { ok: false, reason: "bad_key", status: r.status, message: "Steam rejected the API key" };
    const j = (raw ?? {}) as { playerstats?: { success?: boolean; error?: string; achievements?: PlayerAchievement[] } };
    const ps = j.playerstats;
    if (ps?.success && ps.achievements) return { ok: true, data: ps.achievements };
    const msg = ps?.error ?? "";
    // Only Steam's own "not public" answer means private; a bare 403 is a key problem.
    if (/not public/i.test(msg)) return { ok: false, reason: "private", status: r.status, message: msg };
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

type TextFetch = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;
const xmlField = (block: string, tag: string) => {
  const m = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))</${tag}>`).exec(block);
  return m ? (m[1] ?? m[2] ?? "").trim() : null;
};

/**
 * Key-free fallback: the player's public Steam Community stats page (?xml=1). Works whenever
 * the profile's game details are public, even if the Web API key is missing or rejected.
 * Returns the same shape mergeAchievements() produces (keyed by English display name).
 */
export async function getPublicAchievements(steamId: string, f: TextFetch = fetch as unknown as TextFetch, appid = DSR_APPID): Promise<ApiResult<ReturnType<typeof mergeAchievements>>> {
  try {
    const r = await f(`https://steamcommunity.com/profiles/${steamId}/stats/${appid}/achievements/?xml=1&l=english`, { redirect: "follow", cache: "no-store" });
    if (!r.ok) return { ok: false, reason: "error", status: r.status };
    const xml = await r.text();
    const privacy = xmlField(xml, "privacyState");
    const blocks = xml.match(/<achievement closed="[01]">[\s\S]*?<\/achievement>/g) ?? [];
    if (!blocks.length) {
      if (privacy && privacy !== "public") return { ok: false, reason: "private", message: `profile ${privacy}` };
      // A public profile whose stats page for this game has no achievement list: Steam has
      // no stats for the account (it doesn't own the game, or game details are hidden).
      return { ok: false, reason: privacy === "public" ? "not_owned" : "error", message: "no achievements in community stats" };
    }
    const out: ReturnType<typeof mergeAchievements> = {};
    for (const b of blocks) {
      const name = xmlField(b, "name");
      const apiName = xmlField(b, "apiname");
      if (!name || !apiName) continue;
      const unlocked = b.startsWith('<achievement closed="1"');
      const ts = Number(xmlField(b, "unlockTimestamp") ?? 0);
      out[name] = {
        unlocked,
        unlockTime: unlocked && ts > 0 ? ts : null,
        apiName,
        icon: xmlField(b, "iconClosed") ?? undefined, // Steam calls the coloured, unlocked art "closed"
        iconGray: xmlField(b, "iconOpen") ?? undefined,
        description: xmlField(b, "description") ?? undefined,
      };
    }
    return { ok: true, data: out };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

/**
 * Key-free ownership evidence from the public stats page. Steam lists every achievement of a
 * game (all locked, 0 hours) even for accounts that don't own it, so the page existing proves
 * nothing: only hours played or an unlocked achievement count as proof. `owned: null` = can't tell.
 */
export async function getPublicOwnership(steamId: string, appid: number, f: TextFetch = fetch as unknown as TextFetch): Promise<ApiResult<{ owned: true | null; hoursPlayed: number | null }>> {
  try {
    const r = await f(`https://steamcommunity.com/profiles/${steamId}/stats/${appid}/achievements/?xml=1&l=english`, { redirect: "follow", cache: "no-store" });
    if (!r.ok) return { ok: false, reason: "error", status: r.status };
    const xml = await r.text();
    const privacy = xmlField(xml, "privacyState");
    if (privacy && privacy !== "public") return { ok: false, reason: "private", message: `profile ${privacy}` };
    const hours = Number(xmlField(xml, "hoursPlayed") ?? "");
    const unlocked = /<achievement closed="1">/.test(xml);
    const played = Number.isFinite(hours) && hours > 0;
    return { ok: true, data: { owned: played || unlocked ? true : null, hoursPlayed: Number.isFinite(hours) ? hours : null } };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}

/** Key-free profile basics from the public community profile (?xml=1). */
export async function getPublicProfile(steamId: string, f: TextFetch = fetch as unknown as TextFetch): Promise<ApiResult<{ personaname: string | null; avatarfull: string | null; isPublic: boolean }>> {
  try {
    const r = await f(`https://steamcommunity.com/profiles/${steamId}/?xml=1`, { redirect: "follow", cache: "no-store" });
    if (!r.ok) return { ok: false, reason: "error", status: r.status };
    const xml = await r.text();
    if (!xml.includes("<profile>")) return { ok: false, reason: "error", message: "no profile" };
    return { ok: true, data: { personaname: xmlField(xml, "steamID"), avatarfull: xmlField(xml, "avatarFull"), isPublic: xmlField(xml, "privacyState") === "public" } };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
}
