import { Backpack, Compass, Hammer, LayoutDashboard, Map as MapIcon, Milestone, ScrollText, Settings, Skull, Swords, Trophy, Users } from "lucide-react";

/** Tracker sections, in "chapter" order. Shared by the sidebar and page titles. */
export const NAV = [
  { href: "/dashboard", label: "Хяналтын самбар", en: "Dashboard", icon: LayoutDashboard },
  { href: "/characters", label: "Дүр сонгох", en: "Characters", icon: Users },
  { href: "/map", label: "Lordran газрын зураг", en: "World Map", icon: MapIcon },
  { href: "/bosses", label: "Boss-ууд", en: "Bosses", icon: Swords },
  { href: "/guide", label: "100% хөтөч", en: "Guide", icon: Compass },
  { href: "/upgrades", label: "Зэвсэг сайжруулах", en: "Upgrades", icon: Hammer },
  { href: "/inventory", label: "Эд зүйлс", en: "Inventory", icon: Backpack },
  { href: "/achievements", label: "Achievement", en: "Achievements", icon: Trophy },
  { href: "/deaths", label: "Үхлийн статистик", en: "Deaths", icon: Skull },
  { href: "/quests", label: "NPC quest", en: "Quests", icon: ScrollText },
  { href: "/roadmap", label: "NG → NG++", en: "Roadmap", icon: Milestone },
  { href: "/settings", label: "Тохиргоо / Companion", en: "Settings", icon: Settings },
] as const;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export const roman = (i: number) => ROMAN[i] ?? String(i + 1);

/** The chapter a path belongs to (e.g. /bosses/gwyn → IV · Bosses). */
export function chapterFor(path: string | null): { numeral: string; en: string } | null {
  if (!path) return null;
  const i = NAV.findIndex((n) => path.startsWith(n.href));
  return i < 0 ? null : { numeral: roman(i), en: NAV[i].en };
}
