import { hexToBytes, indexOf, readUtf16, u16, u32, u8 } from "./bytes";
import { entryBlob, checksumOk, decodePtdeEntry, decryptDsrEntry, detectVariant, parseBnd4 } from "./bnd4";
import { BONFIRE_DB, BOSS_FLAG_DB, BOSS_SOUL_DB, ITEM_DB, KNOWN_FLAG_DB } from "./itemdb";
import {
  inferred,
  known,
  unknown,
  type BossEvidence,
  type Field,
  type GameVariant,
  type InventoryCategory,
  type InventoryItem,
  type ParsedCharacter,
  type ParsedSave,
} from "./types";

/**
 * Dark Souls (Remastered / PtDE) character slot reader.
 *
 * Offsets and validation gates are a TypeScript port of darthdemono/sl2-analyzer
 * `sl2/ds1.py` (Apache-2.0), whose author verified them against real DSR and PtDE
 * saves, combined with tarvitz/dsfp (MIT) for the PtDE death counter. Each value is
 * only reported when its sanity gate passes; otherwise it is `unknown`.
 */
export const PARSER_VERSION = "ds1-1.0.0";

const SLOT_COUNT = 10;
const MENU_ENTRY = 10;

const DSR_MAGIC = hexToBytes("00FFFFFFFF000000000000000000000000FFFFFFFF");
const D = {
  souls: -291,
  hp: -419,
  stamina: -391,
  level: -295,
  klass: -233,
  humanity: -307,
  gender: -237,
  name: -271,
  ng: 0x1e3a7,
} as const;
const STAT_D = {
  Vitality: -375,
  Attunement: -367,
  Endurance: -359,
  Strength: -351,
  Dexterity: -343,
  Resistance: -303,
  Intelligence: -335,
  Faith: -327,
} as const;

const CLASSES = ["Warrior", "Knight", "Wanderer", "Thief", "Bandit", "Hunter", "Sorcerer", "Pyromancer", "Cleric", "Deprived"];
const GENDER: Record<number, string> = { 0: "Female", 1: "Male" };

const DEATHS_OFF: Record<GameVariant, number> = { ptde: 0x1f118, dsr: 0x1f2d8 };
const DEATHS_SENTINEL = 0xffffffff;

const FLAG_BASE: Record<GameVariant, number> = { dsr: 127721, ptde: 127273 };
const FLAG_SPAN = 23156;
const FLAG_MAX_DENSITY = 0.05;

const MENU_LEVEL_D = 36;
const MENU_PLAYTIME_D = 40;

const INV_START = 0x988;
const INV_ANCHOR = hexToBytes("0000000000000000A0BB0D00");
const INV_END = hexToBytes("00000000FFFFFFFFFFFFFFFF");
const INV_REC = 28;

const INFUSION: Record<number, string> = {
  0: "Normal",
  1: "Crystal",
  2: "Lightning",
  3: "Raw",
  4: "Magic",
  5: "Enchanted",
  6: "Divine",
  7: "Occult",
  8: "Fire",
  9: "Chaos",
};

const BONFIRE_REC = 20;
const BONFIRE_STATE: Record<number, string> = {
  0: "discovered",
  10: "lit",
  20: "kindled +1",
  30: "kindled +2",
  40: "kindled +3",
};
const BONFIRE_MIN_RUN = 5;

/**
 * Bosses that must be dead to start NG+ (so NG+>0 proves them dead in an earlier cycle).
 * sl2-analyzer's list plus the two unavoidable gatekeepers: Asylum Demon (only exit from
 * the Asylum) and Pinwheel (guards the only way into the Tomb of the Giants / Nito).
 */
export const MANDATORY_BOSSES = [
  "Asylum Demon",
  "Pinwheel",
  "Bell Gargoyles",
  "Chaos Witch Quelaag",
  "Iron Golem",
  "Dragon Slayer Ornstein",
  "Executioner Smough",
  "Great Grey Wolf Sif",
  "The Four Kings",
  "Seath the Scaleless",
  "Gravelord Nito",
  "Bed of Chaos",
  "Gwyn, Lord of Cinder",
];

/** Character names: any letter in any script (Cyrillic etc.), digits, a few symbols. */
export function isValidName(s: string): boolean {
  // ASCII, Latin-1 letters, Cyrillic, Japanese kana and CJK ideographs.
  return (
    s.length >= 1 &&
    s.length <= 13 &&
    /^[A-Za-z0-9 \-_'.\u00C0-\u00FF\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF]+$/.test(s)
  );
}

function statsAt(buf: Uint8Array, m: number) {
  return Object.values(STAT_D).map((d) => u8(buf, m + d));
}
function plausible(buf: Uint8Array, m: number): boolean {
  const lvl = u16(buf, m + D.level);
  return lvl !== null && lvl >= 1 && lvl <= 838 && statsAt(buf, m).every((v) => v !== null && v >= 0 && v <= 99);
}

/**
 * DS1 game rule: Soul Level = sum of the eight attributes - K, where K depends on the
 * starting class (Sorcerer 79; Knight, Thief 81; Wanderer, Pyromancer 83; all others 82).
 * K values per darthdemono/sl2-analyzer tests/test_level_rule.py. Used as a hard gate
 * for the PtDE name-anchor search and as a consistency check for DSR.
 */
const CLASS_K: Record<number, number> = { 0: 82, 1: 81, 2: 83, 3: 81, 4: 82, 5: 82, 6: 79, 7: 83, 8: 82, 9: 82 };
export function levelRuleHolds(buf: Uint8Array, m: number): boolean {
  const lvl = u16(buf, m + D.level);
  const klass = u8(buf, m + D.klass);
  const st = statsAt(buf, m);
  if (lvl === null || klass === null || st.some((v) => v === null)) return false;
  const k = CLASS_K[klass];
  if (k === undefined) return false;
  return (st as number[]).reduce((a, b) => a + b, 0) - k === lvl;
}

/** DSR: the magic pattern recurs, so the true anchor is the one whose stat block is sane. */
export function findDsrAnchor(buf: Uint8Array): number | null {
  let o = 0;
  for (;;) {
    const m = indexOf(buf, DSR_MAGIC, o);
    if (m === -1) return null;
    if (plausible(buf, m)) return m;
    o = m + 1;
  }
}

/** PtDE: no magic; the name field is the anchor and the stat block must also be sane. */
export function findPtdeAnchor(buf: Uint8Array): number | null {
  for (let o = 0; o < buf.length - 1; o++) {
    // Fast reject: first UTF-16 code unit must be non-zero.
    if (buf[o] === 0 && buf[o + 1] === 0) continue;
    const name = readUtf16(buf, o, 13);
    if (name.length >= 2 && isValidName(name)) {
      const m = o - D.name;
      if (plausible(buf, m) && levelRuleHolds(buf, m)) return m;
    }
  }
  return null;
}

function resolveItem(cat: InventoryCategory, id: number): Omit<InventoryItem, "quantity" | "category" | "id"> | null {
  const table = ITEM_DB[cat];
  if (cat === "weapons") {
    const base = id - (id % 1000);
    const path = Math.floor((id % 1000) / 100);
    const level = id % 100;
    const baseName = table.get(base);
    if (baseName) {
      const infusion = INFUSION[path] ?? "Normal";
      const name = `${baseName}${level ? ` +${level}` : ""}${infusion !== "Normal" ? ` (${infusion})` : ""}`;
      return { name, baseName, level, infusion };
    }
    const direct = table.get(id);
    return direct ? { name: direct, baseName: direct.replace(/\s*\[.*\]$/, "") } : null;
  }
  const direct = table.get(id);
  if (direct) return { name: direct, baseName: direct };
  if (cat === "rings") {
    const r = table.get(Math.floor(id / 1000));
    return r ? { name: r, baseName: r } : null;
  }
  if (cat === "armors") {
    const base = id - (id % 1000);
    const level = id % 100;
    const n = table.get(base);
    return n ? { name: `${n}${level ? ` +${level}` : ""}`, baseName: n, level } : null;
  }
  return null;
}

export function readInventory(buf: Uint8Array): { items: InventoryItem[]; unknown: number } {
  const items: InventoryItem[] = [];
  let unknownCount = 0;
  const start = indexOf(buf, INV_ANCHOR, INV_START);
  if (start === -1) return { items, unknown: 0 };
  let end = indexOf(buf, INV_END, start);
  if (end === -1) end = buf.length;
  for (let o = start; o + INV_REC <= end; o += INV_REC) {
    const stype = u32(buf, o + 4);
    const id = u32(buf, o + 8);
    const qty = u32(buf, o + 12);
    if (!id || stype === null || qty === null) continue;
    const top = Math.floor(stype / 0x10000000) * 0x10000000;
    let cat: InventoryCategory | null =
      top === 0 ? "weapons" : top === 0x10000000 ? "armors" : top === 0x20000000 ? "rings" : top === 0x40000000 ? "goods" : null;
    if (cat === "goods" && ITEM_DB.spells.has(id)) cat = "spells";
    const r = cat ? resolveItem(cat, id) : null;
    if (!cat || !r) {
      unknownCount++;
      continue;
    }
    items.push({ ...r, id, category: cat, quantity: qty });
  }
  // Merge stackables (same name) preserving order.
  const merged = new Map<string, InventoryItem>();
  for (const it of items) {
    const k = `${it.category}:${it.name}`;
    const prev = merged.get(k);
    if (prev) prev.quantity += it.quantity;
    else merged.set(k, { ...it });
  }
  return { items: [...merged.values()], unknown: unknownCount };
}

export function readDeaths(buf: Uint8Array, game: GameVariant): Field<number> {
  const off = DEATHS_OFF[game];
  if (u32(buf, off + 4) !== DEATHS_SENTINEL) return unknown("Death counter structure not at the expected location.");
  return known(u32(buf, off));
}

export function readBonfires(buf: Uint8Array): Field<{ id: number; name: string; area: string; state: string }[]> {
  let best: [number, number][] = [];
  let o = 0;
  while (o + BONFIRE_REC <= buf.length) {
    const first = u32(buf, o);
    if (first !== null && BONFIRE_DB.has(first)) {
      const run: [number, number][] = [];
      const seen = new Set<number>();
      let p = o;
      while (p + BONFIRE_REC <= buf.length) {
        const id = u32(buf, p);
        const st = u32(buf, p + 4);
        if (id === null || st === null || !BONFIRE_DB.has(id) || !(st in BONFIRE_STATE) || seen.has(id)) break;
        seen.add(id);
        run.push([id, st]);
        p += BONFIRE_REC;
      }
      if (run.length > best.length) best = run;
      o = Math.max(p, o + 1);
    } else o++;
  }
  if (best.length < BONFIRE_MIN_RUN) return unknown("No believable bonfire list found (fewer than 5 records).");
  return {
    value: best.map(([id, st]) => {
      const [name, area] = BONFIRE_DB.get(id)!;
      return { id, name, area, state: BONFIRE_STATE[st] };
    }),
    certainty: "verified",
  };
}

function popcount8(b: number) {
  let c = 0;
  while (b) {
    c += b & 1;
    b >>= 1;
  }
  return c;
}

/** Event-flag region: boss kills + world state. Disabled when the region does not read sparse. */
export function readFlags(buf: Uint8Array, game: GameVariant) {
  const base = FLAG_BASE[game];
  if (base + FLAG_SPAN > buf.length) return null;
  let bits = 0;
  for (let i = base; i < base + FLAG_SPAN; i++) bits += popcount8(buf[i]);
  if (bits > FLAG_SPAN * 8 * FLAG_MAX_DENSITY) return null;
  const bosses: string[] = [];
  for (const [name, [off, mask]] of Object.entries(BOSS_FLAG_DB)) {
    const v = u32(buf, base + off);
    if (v !== null && (v & mask) >>> 0 !== 0) bosses.push(name);
  }
  const world: Record<string, string[]> = {};
  for (const [cat, rows] of Object.entries(KNOWN_FLAG_DB)) {
    world[cat] = rows.filter(([off, mask]) => ((u32(buf, base + off) ?? 0) & mask) >>> 0 !== 0).map((r) => r[2]);
  }
  return { bosses, world };
}

export function readPlayTime(menu: Uint8Array | null, name: string | null, level: number | null): Field<number> {
  if (!menu || !name || level === null) return unknown("Load-screen roster not readable.");
  const want = new Uint8Array(name.length * 2);
  for (let i = 0; i < name.length; i++) {
    const c = name.charCodeAt(i);
    want[i * 2] = c & 0xff;
    want[i * 2 + 1] = c >> 8;
  }
  let pos = indexOf(menu, want);
  while (pos >= 0) {
    if (u32(menu, pos + MENU_LEVEL_D) === level) return known(u32(menu, pos + MENU_PLAYTIME_D));
    pos = indexOf(menu, want, pos + 2);
  }
  return unknown("Roster record matching this character's name and level not found.");
}

function parseSlot(buf: Uint8Array, slot: number, game: GameVariant, menu: Uint8Array | null): ParsedCharacter | null {
  const m = game === "dsr" ? findDsrAnchor(buf) : findPtdeAnchor(buf);
  if (m === null) return null;
  const rawName = readUtf16(buf, m + D.name, 13);
  const name = isValidName(rawName) ? rawName : null;
  const level = u16(buf, m + D.level);
  const klass = u8(buf, m + D.klass);
  const gender = u8(buf, m + D.gender);
  const stats = Object.fromEntries(
    Object.entries(STAT_D).map(([k, d]) => [k, known(u8(buf, m + d))]),
  ) as ParsedCharacter["stats"];

  const { items, unknown: unk } = readInventory(buf);
  const flags = readFlags(buf, game);

  const ng: Field<number> =
    game === "dsr"
      ? known(u8(buf, m + D.ng), "NG+ counter (0 = first journey)")
      : unknown("NG cycle offset is only calibrated for Remastered saves.");

  // Boss evidence: flags (direct), held souls (inferred), NG+ (inferred).
  const bosses: Record<string, Set<BossEvidence>> = {};
  const add = (b: string, e: BossEvidence) => (bosses[b] ??= new Set()).add(e);
  for (const it of items) {
    if (it.category !== "goods") continue;
    const boss = BOSS_SOUL_DB[it.name];
    if (boss) add(boss, "soul");
  }
  if ((ng.value ?? 0) > 0) for (const b of MANDATORY_BOSSES) add(b, "ng-clear");
  if (flags) for (const b of flags.bosses) add(b, "flag");

  const notes: string[] = [];
  if (!levelRuleHolds(buf, m)) notes.push("Soul level does not equal attributes-82; the save may have been edited.");
  notes.push(
    "Current location / coordinates are not decoded; area is estimated from progress.",
    "Only 12 bosses have verified defeat flags; others are inferred from boss souls held, NG+ or Steam achievements.",
  );
  if (!flags) notes.push("Event-flag region failed its sanity check; boss flags and world state were not read.");
  if (unk) notes.push(`${unk} inventory entries could not be identified and were skipped.`);

  return {
    slot,
    game,
    name: name ? known(name) : unknown("Name field did not decode cleanly."),
    className: klass !== null && CLASSES[klass] ? known(CLASSES[klass], "Starting class") : unknown(),
    gender: gender !== null && GENDER[gender] ? known(GENDER[gender]) : unknown(),
    level: known(level),
    souls: known(u32(buf, m + D.souls)),
    humanity: known(u8(buf, m + D.humanity)),
    hp: known(u32(buf, m + D.hp)),
    stamina: known(u32(buf, m + D.stamina)),
    stats,
    deaths: readDeaths(buf, game),
    playTimeSeconds: readPlayTime(menu, name, level),
    ngCycle: ng,
    bonfires: readBonfires(buf),
    bosses: Object.fromEntries(Object.entries(bosses).map(([k, v]) => [k, [...v].sort()])),
    worldFlags: flags ? { value: flags.world, certainty: "verified" } : unknown("Event-flag region not verified."),
    inventory: items,
    unknownItemCount: unk,
    notes,
  };
}

/** Parse a DRAKS0005.sl2 (read-only; the input buffer is never modified). */
export function parseSave(input: Uint8Array): ParsedSave {
  const data = input; // never written to
  const entries = parseBnd4(data);
  const game = detectVariant(data, entries);
  let checksumsValid = true;
  const decode = (i: number): Uint8Array | null => {
    const blob = entryBlob(data, entries[i]);
    if (!checksumOk(blob)) checksumsValid = false;
    return game === "dsr" ? decryptDsrEntry(blob) : decodePtdeEntry(blob);
  };
  const menu = entries.length > MENU_ENTRY ? decode(MENU_ENTRY) : null;
  const characters: ParsedCharacter[] = [];
  for (let i = 0; i < Math.min(SLOT_COUNT, entries.length); i++) {
    const buf = decode(i);
    if (!buf) continue;
    const ch = parseSlot(buf, i, game, menu);
    if (ch) characters.push(ch);
  }
  return { game, checksumsValid, entryCount: entries.length, characters, parserVersion: PARSER_VERSION };
}

export { inferred };
