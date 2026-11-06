"use client";
import { CircleDot, FlaskConical, Flame, Gem, Key, Shield, Skull, Sparkles, Sword } from "lucide-react";
import { BOSS_SOUL_DB } from "@/lib/save/itemdb";
import type { InventoryCategory } from "@/lib/save/types";

/**
 * Original vector item glyphs (not extracted game textures or official art — see
 * public/artwork/README.md for the project's artwork policy). Resolves a lucide
 * icon + rarity tint from the item name/category so every row in Inventory,
 * Upgrades and the dashboard gets a small forged-emblem badge instead of bare text.
 */
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

const KEY_ITEM_RE = /Key|Lordvessel|Peculiar Doll|Broken Pendant|Rite of Kindling|Crest of Artorias|Fire Keeper Soul|Pendant/;

function tintFor(name: string): string {
  for (const [re, color] of TITANITE_TINT) if (re.test(name)) return color;
  for (const [re, color] of EMBER_TINT) if (re.test(name)) return color;
  if (/Dragon Scale/.test(name)) return "#9fe8d8";
  if (name in BOSS_SOUL_DB) return "#c6a8ff";
  return "#cfb173";
}

function iconFor(name: string, category?: InventoryCategory) {
  if (/Ember/.test(name)) return Flame;
  if (/Titanite|Dragon Scale/.test(name)) return Gem;
  if (name in BOSS_SOUL_DB) return Skull;
  if (KEY_ITEM_RE.test(name)) return Key;
  if (category === "weapons") return Sword;
  if (category === "armors") return Shield;
  if (category === "rings") return CircleDot;
  if (category === "spells") return Sparkles;
  return FlaskConical;
}

export function ItemIcon({ name, category, size = 30 }: { name: string; category?: InventoryCategory; size?: number }) {
  const Icon = iconFor(name, category);
  const color = tintFor(name);
  return (
    <span
      className="item-icon"
      style={{ width: size, height: size, "--ic-color": color } as React.CSSProperties}
      aria-hidden
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={1.6} style={{ color }} />
    </span>
  );
}
