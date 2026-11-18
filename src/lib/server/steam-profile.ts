import "server-only";
import { getOwnsGame, getPlayerSummary, getPublicProfile } from "@/lib/steam/webapi";

export async function loadSteamProfile(steamId: string, now = Date.now()) {
  const [summary, owns] = await Promise.all([getPlayerSummary(steamId), getOwnsGame(steamId)]);
  // Without a working Web API key, the public community profile still has the name and avatar.
  const pub = summary.ok ? null : await getPublicProfile(steamId);
  return {
    steamId,
    lastLoginAt: now,
    personaName: summary.ok ? summary.data.personaname : pub?.ok ? pub.data.personaname : null,
    avatar: summary.ok ? (summary.data.avatarfull ?? null) : pub?.ok ? pub.data.avatarfull : null,
    profileUrl: summary.ok ? (summary.data.profileurl ?? null) : `https://steamcommunity.com/profiles/${steamId}`,
    profilePublic: summary.ok ? summary.data.communityvisibilitystate === 3 : pub?.ok ? pub.data.isPublic : null,
    ownsGame: owns.ok ? owns.data.owned : null,
    playtimeMinutes: owns.ok ? owns.data.playtimeMinutes : null,
    steamApiStatus: summary.ok ? "ok" : summary.reason,
  };
}
