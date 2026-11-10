import type { ParsedCharacter } from "@/lib/save/types";
import type { AchievementState } from "@/lib/guide/engine";
import type { DesktopCloudState } from "@/lib/desktop-cloud";

export interface ClientEvent {
  id: string;
  type: "death" | "level" | "boss" | "bonfire" | "ng";
  at: number;
  charKey: string;
  data: Record<string, unknown>;
  attribution?: { label: "Unconfirmed" | "User confirmation"; bossId?: string; area?: string };
  source: string;
  ackedAt?: number;
}

export interface ClientState {
  now: number;
  storeKind: "firestore" | "dev-file" | "demo";
  desktop?: boolean;
  desktopCloud?: DesktopCloudState | null;
  user: { steamId: string; personaName?: string | null; avatar?: string | null; profileUrl?: string | null; ownsGame?: boolean | null; profilePublic?: boolean | null; playtimeMinutes?: number | null };
  characters: { id: string; character: ParsedCharacter; source: string; updatedAt: number; saveModifiedAt?: number; checksumsValid: boolean; parserVersion: string }[];
  events: ClientEvent[];
  snapshots: { id: string; charKey: string; at: number; level: number | null; deaths: number | null; ng: number | null }[];
  achievements: { status?: string; message?: string | null; fetchedAt?: number; checkedAt?: number; items?: Record<string, AchievementState & { description?: string }> } | null;
  manual: { bosses?: Record<string, boolean>; achievements?: Record<string, boolean>; quests?: Record<string, string[]>; items?: Record<string, boolean> };
  companion: { connected: boolean; lastHeartbeat?: number; lastSyncAt?: number; deviceName?: string; version?: string; saveFound?: boolean; saveModifiedAt?: number | null; message?: string | null } | null;
  sync: { lastSyncAt?: number; lastSource?: string; saveModifiedAt?: number | null } | null;
  demo?: boolean;
}
