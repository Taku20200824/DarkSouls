import "server-only";
import { getOwnsGame, getPlayerSummary } from "@/lib/steam/webapi";

export async function loadSteamProfile(steamId: string, now = Date.now()) {
  const [summary, owns] = await Promise.all([getPlayerSummary(steamId), getOwnsGame(steamId)]);
  return {
    steamId,
    lastLoginAt: now,
    personaName: summary.ok ? summary.data.personaname : null,
    avatar: summary.ok ? (summary.data.avatarfull ?? null) : null,
    profileUrl: summary.ok ? (summary.data.profileurl ?? null) : null,
    profilePublic: summary.ok ? summary.data.communityvisibilitystate === 3 : null,
    ownsGame: owns.ok ? owns.data.owned : null,
    playtimeMinutes: owns.ok ? owns.data.playtimeMinutes : null,
    steamApiStatus: summary.ok ? "ok" : summary.reason,
  };
}
