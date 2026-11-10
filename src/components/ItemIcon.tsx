"use client";
import Image from "next/image";
import clsx from "clsx";
import weaponTable from "@/lib/data/ds1db/MeleeWeapons.json";
import { ALL_ARMOR_NAMES, ALL_RING_NAMES, ALL_SPELL_NAMES, BOSS_SOUL_DB } from "@/lib/save/itemdb";
import type { InventoryCategory } from "@/lib/save/types";

/**
 * Item art: one original illustration per item *type* (public/artwork/items/<type>.webp,
 * generated from written prompts — not extracted game textures or wiki images, see
 * public/artwork/README.md). The type is resolved from the item name/category; a tint
 * colour distinguishes titanite / ember grades and boss souls inside the hex badge.
 */
export type ItemArt =
  | "sword" | "heavy" | "polearm" | "bow" | "catalyst" | "shield"
  | "armor" | "ring" | "spell" | "titanite" | "ember" | "soul"
  | "key" | "estus" | "consumable" | "humanity" | "soapstone";

const TITANITE_TINT: [RegExp, string][] = [
  [/^Green /, "#7cffa8"],
  [/^Blue /, "#7ec8ff"],
  [/^White /, "#fff6dc"],
  [/^Red /, "#ff8a6b"],
  [/^Twinkling /, "#d8cfff"],
  [/^Demon /, "#ff6a3d"],
];

const EMBER_TINT: [RegExp, string][] = [
  [/^Large Magic Ember/, "#8ec8ff"],
  [/^Enchanted Ember/, "#a0ffe8"],
  [/^Large Divine Ember/, "#fff6dc"],
  [/^Divine Ember/, "#fff6dc"],
  [/^Dark Ember/, "#c29bff"],
  [/^Large Flame Ember/, "#ff7a3d"],
  [/^Chaos Flame Ember/, "#ff4d4d"],
  [/^Very Large Ember/, "#ffd27a"],
  [/^Large Ember/, "#ffb36b"],
];

const KEY_ITEM_RE = /Key|Lordvessel|Peculiar Doll|Broken Pendant|Rite of Kindling|Crest of Artorias|Fire Keeper Soul|Pendant|Lord Soul|Bequeathed/;
const INFUSION_RE = /^(Crystal|Lightning|Raw|Magic|Enchanted|Divine|Occult|Fire|Chaos) /;

/** Weapon id ranges from MeleeWeapons.json (id / 100000) → art type. */
function weaponArtForId(id: number, name: string): ItemArt {
  const k = Math.floor(id / 100000);
  if (k === 7 || k === 8) return "heavy";
  if (k === 10 || k === 11) return "polearm";
  if (k === 12 || k === 20 || k === 21) return "bow";
  if (k === 13) return "catalyst";
  if (k === 14 || k === 15) return "shield";
  if (k === 90) return /Shield|Sanctus|Bloodshield/.test(name) ? "shield" : "sword";
  return "sword";
}

const WEAPON_ART = new Map<string, ItemArt>();
for (const [name, v] of Object.entries(weaponTable as Record<string, string | string[]>)) {
  if (name.includes("[")) continue;
  const id = parseInt(Array.isArray(v) ? v[0] : v, 10);
  WEAPON_ART.set(name, weaponArtForId(id, name));
}
const RINGS = new Set(ALL_RING_NAMES);
const ARMOR = new Set(ALL_ARMOR_NAMES);
const SPELLS = new Set(ALL_SPELL_NAMES);

function baseName(name: string) {
  return name.replace(/\s*\+\d+$/, "").replace(/\s*\(.*\)$/, "").trim();
}

function weaponArt(name: string): ItemArt | undefined {
  const n = baseName(name);
  return WEAPON_ART.get(n) ?? WEAPON_ART.get(n.replace(INFUSION_RE, ""));
}

export function itemArtFor(name: string, category?: InventoryCategory): ItemArt {
  const n = baseName(name);
  if (/Ember/.test(n)) return "ember";
  if (/Titanite|Dragon Scale/.test(n)) return "titanite";
  if (/Estus/.test(n)) return "estus";
  if (/Humanity/.test(n)) return "humanity";
  if (KEY_ITEM_RE.test(n)) return "key";
  if (n in BOSS_SOUL_DB || /Soul/.test(n)) return "soul";
  if (/Soapstone|Orb|Eye of Death|Cracked Red Eye|Black Separation Crystal|Dried Finger|Servant Roster/.test(n)) return "soapstone";
  if (category === "weapons") return weaponArt(n) ?? "sword";
  if (category === "armors") return "armor";
  if (category === "rings") return "ring";
  if (category === "spells") return "spell";
  if (category === "goods") return "consumable";
  // No category given (e.g. area item lists): infer from the name tables.
  const w = weaponArt(n);
  if (w) return w;
  if (RINGS.has(n)) return "ring";
  if (ARMOR.has(n)) return "armor";
  if (SPELLS.has(n)) return "spell";
  return "consumable";
}

function tintFor(name: string): string | undefined {
  for (const [re, color] of TITANITE_TINT) if (re.test(name)) return color;
  for (const [re, color] of EMBER_TINT) if (re.test(name)) return color;
  if (/Dragon Scale/.test(name)) return "#9fe8d8";
  if (baseName(name) in BOSS_SOUL_DB) return "#c6a8ff";
  return undefined;
}

export function ItemIcon({ name, category, size = 30, className }: { name: string; category?: InventoryCategory; size?: number; className?: string }) {
  const art = itemArtFor(name, category);
  const tint = tintFor(name);
  return (
    <span
      className={clsx("item-icon", tint && art === "titanite" && "item-icon--tinted", className)}
      style={{ width: size, height: size, "--ic-color": tint ?? "#cfb173" } as React.CSSProperties}
      aria-hidden
    >
      <Image src={`/artwork/items/${art}.webp`} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}
