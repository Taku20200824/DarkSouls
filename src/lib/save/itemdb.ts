import weapons from "@/lib/data/ds1db/MeleeWeapons.json";
import armor from "@/lib/data/ds1db/Armor.json";
import rings from "@/lib/data/ds1db/Rings.json";
import goods from "@/lib/data/ds1db/Consumables.json";
import spells from "@/lib/data/ds1db/Spells.json";
import bonfires from "@/lib/data/ds1db/bonfires.json";
import bossFlags from "@/lib/data/ds1db/boss_flags.json";
import bossSouls from "@/lib/data/ds1db/boss_souls.json";
import knownFlags from "@/lib/data/ds1db/known_flags.json";
import type { InventoryCategory } from "./types";

/**
 * Item / flag tables from darthdemono/sl2-analyzer `db_ds1/` (Apache-2.0, see
 * src/lib/data/ds1db/LICENSE-sl2-analyzer.txt). Tables are name -> id (or id list).
 */
type NameTable = Record<string, string | string[]>;

function invert(t: NameTable): Map<number, string> {
  const m = new Map<number, string>();
  for (const [name, v] of Object.entries(t)) {
    for (const id of Array.isArray(v) ? v : [v]) {
      const n = parseInt(id, 10);
      if (!m.has(n)) m.set(n, name);
    }
  }
  return m;
}

export const ITEM_DB: Record<InventoryCategory, Map<number, string>> = {
  weapons: invert(weapons as NameTable),
  armors: invert(armor as NameTable),
  rings: invert(rings as NameTable),
  goods: invert(goods as NameTable),
  spells: invert(spells as NameTable),
};

export const BONFIRE_DB: Map<number, [string, string]> = new Map(
  Object.entries(bonfires as unknown as Record<string, [string, string]>).map(([k, v]) => [parseInt(k, 10), v]),
);

/** boss -> [byte offset inside event-flag region, u32 mask] */
export const BOSS_FLAG_DB = bossFlags as unknown as Record<string, [number, number]>;
/** boss soul item name -> boss canonical name */
export const BOSS_SOUL_DB = bossSouls as Record<string, string>;
/** category -> [offset, mask, name][] */
export const KNOWN_FLAG_DB = knownFlags as unknown as Record<string, [number, number, string][]>;

export const ALL_WEAPON_NAMES = Object.keys(weapons as NameTable).filter((n) => !n.includes("["));
export const ALL_SPELL_NAMES = Object.keys(spells as NameTable);
export const ALL_RING_NAMES = Object.keys(rings as NameTable);
export const ALL_ARMOR_NAMES = Object.keys(armor as NameTable);
export const ALL_GOODS_NAMES = Object.keys(goods as NameTable);
