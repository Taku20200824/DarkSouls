import type { ParsedCharacter } from "@/lib/save/types";
import type { ClientState } from "./types";
import { ACHIEVEMENTS } from "@/lib/data/achievements";

/**
 * DEMO MODE DATA — fictional values for showcasing the UI only.
 * Shown exclusively when the visitor turns on Demo Mode; every screen then carries
 * a "DEMO" banner and every metric's source is "Demo".
 */
const f = <T,>(value: T) => ({ value, certainty: "verified" as const, note: "DEMO" });
const DAY = 86400_000;

export function demoState(now = Date.now()): ClientState {
  const ch: ParsedCharacter = {
    slot: 0,
    game: "dsr",
    name: f("Demo Knight"),
    className: f("Knight"),
    gender: f("Male"),
    level: f(42),
    souls: f(13377),
    humanity: f(3),
    hp: f(1020),
    stamina: f(118),
    stats: {
      Vitality: f(20), Attunement: f(10), Endurance: f(22), Strength: f(18),
      Dexterity: f(14), Resistance: f(10), Intelligence: f(9), Faith: f(20),
    },
    deaths: f(128),
    playTimeSeconds: f(19 * 3600 + 42 * 60),
    ngCycle: f(0),
    bonfires: f([
      { id: 1021960, name: "Firelink Shrine", area: "Firelink Shrine", state: "kindled +1" },
      { id: 1011962, name: "Undead Burg", area: "Undead Burg", state: "lit" },
      { id: 1011964, name: "Undead Parish", area: "Undead Parish", state: "lit" },
      { id: 1001960, name: "Depths", area: "Depths", state: "lit" },
      { id: 1201961, name: "Darkroot Garden", area: "Darkroot Garden", state: "lit" },
    ]),
    bosses: { "Asylum Demon": ["ng-clear"], "Taurus Demon": ["flag"], "Capra Demon": ["flag"], "Moonlight Butterfly": ["flag", "soul"] },
    worldFlags: f({ "Bells of Awakening": ["Undead Parish"], "Join Covenants": ["Way of White"], NPC: [] }),
    inventory: [
      { name: "Claymore +3", baseName: "Claymore", id: 1050003, category: "weapons", quantity: 1, level: 3, infusion: "Normal" },
      { name: "Grass Crest Shield", baseName: "Grass Crest Shield", id: 1401000, category: "weapons", quantity: 1, level: 0, infusion: "Normal" },
      { name: "Titanite Shard", baseName: "Titanite Shard", id: 1000, category: "goods", quantity: 2, },
      { name: "Estus Flask", baseName: "Estus Flask", id: 201, category: "goods", quantity: 10 },
      { name: "Humanity", baseName: "Humanity", id: 500, category: "goods", quantity: 2 },
      { name: "Soul of the Moonlight Butterfly", baseName: "Soul of the Moonlight Butterfly", id: 702, category: "goods", quantity: 1 },
      { name: "Blighttown Key", baseName: "Blighttown Key", id: 2007, category: "goods", quantity: 1 },
      { name: "Key to Depths", baseName: "Key to Depths", id: 2014, category: "goods", quantity: 1 },
      { name: "Havel's Ring", baseName: "Havel's Ring", id: 100, category: "rings", quantity: 1 },
      { name: "Sorcery: Soul Arrow", baseName: "Sorcery: Soul Arrow", id: 3000, category: "spells", quantity: 1 },
    ],
    unknownItemCount: 0,
    notes: ["DEMO DATA — not a real save."],
  };
  const deaths = Array.from({ length: 14 }, (_, i) => ({
    id: `demo-d${i}`,
    type: "death" as const,
    at: now - (13 - i) * DAY * 0.4,
    charKey: "demo",
    data: { from: 100 + i * 2, to: 102 + i * 2, delta: 2 },
    attribution: i % 3 === 0 ? { label: "User confirmation" as const, bossId: "bell-gargoyles" } : { label: "Unconfirmed" as const },
    source: "Demo",
    ackedAt: now,
  }));
  return {
    now,
    storeKind: "demo",
    demo: true,
    user: { steamId: "00000000000000000", personaName: "Demo Undead", avatar: null, ownsGame: true },
    characters: [{ id: "demo", character: ch, source: "Demo", updatedAt: now - 5 * 60_000, checksumsValid: true, parserVersion: "demo" }],
    events: [...deaths].reverse(),
    snapshots: deaths.map((d, i) => ({ id: `s${i}`, charKey: "demo", at: d.at, level: 30 + i, deaths: (d.data.to as number), ng: 0 })),
    achievements: {
      status: "ok",
      fetchedAt: now,
      items: Object.fromEntries(
        ACHIEVEMENTS.map((a) => {
          const i = ["Enkindle", "Estus Flask", "Reach Lordran", "Ring the Bell (Undead Church)", "Covenant: Way of White"].indexOf(a.name);
          return [a.name, i >= 0 ? { unlocked: true, unlockTime: Math.floor((now - (5 - i) * DAY) / 1000) } : { unlocked: false, unlockTime: null }];
        }),
      ),
    },
    manual: { bosses: {}, achievements: {}, quests: { solaire: ["meet", "gargoyles"] } },
    companion: { connected: true, lastHeartbeat: now - 10_000, lastSyncAt: now - 5 * 60_000, deviceName: "DEMO-PC", saveFound: true },
    sync: { lastSyncAt: now - 5 * 60_000, lastSource: "Demo" },
  };
}
