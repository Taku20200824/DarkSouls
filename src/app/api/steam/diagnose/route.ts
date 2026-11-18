import { withUser, ok } from "@/lib/server/api";
import { DSR_APPID } from "@/lib/steam/webapi";

export const dynamic = "force-dynamic";

/**
 * Signed-in user's own Steam connectivity check, run from the server (where the site's
 * achievement sync runs). Never returns the API key: only whether it is set and well-formed,
 * and each call's status plus the start of its body with the key redacted.
 */
export const GET = withUser(
  async ({ steamId }) => {
    const raw = process.env.STEAM_API_KEY ?? "";
    const key = raw.trim();
    const redact = (s: string) => (key ? s.split(key).join("<key>") : s);
    const probe = async (label: string, url: string) => {
      const started = Date.now();
      try {
        const r = await fetch(url, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(10_000) });
        const text = await r.text();
        return {
          label, status: r.status, contentType: r.headers.get("content-type"), ms: Date.now() - started, finalUrl: redact(r.url).slice(0, 160),
          achievementBlocks: (text.match(/<achievement /g) ?? []).length,
          privacyState: /<privacyState>([^<]*)/.exec(text)?.[1] ?? null,
          body: redact(text.slice(0, 220)),
        };
      } catch (e) {
        return { label, status: null, ms: Date.now() - started, error: redact(String(e)).slice(0, 220) };
      }
    };
    const k = encodeURIComponent(key);
    const results = await Promise.all([
      probe("GetPlayerSummaries", `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${k}&steamids=${steamId}`),
      probe("GetPlayerAchievements", `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${k}&steamid=${steamId}&appid=${DSR_APPID}`),
      probe("CommunityStatsXml", `https://steamcommunity.com/profiles/${steamId}/stats/${DSR_APPID}/achievements/?xml=1&l=english`),
    ]);
    return ok({
      steamId,
      region: process.env.VERCEL_REGION ?? null,
      key: {
        set: key.length > 0,
        length: key.length,
        hadSurroundingWhitespace: raw !== key,
        looksLikeSteamKey: /^[0-9A-F]{32}$/.test(key),
        hasQuotes: /["']/.test(key),
      },
      results,
    });
  },
  { limit: 6 },
);
