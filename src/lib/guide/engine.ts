import { ACHIEVEMENTS, type AchievementInfo } from "@/lib/data/achievements";
import { AREAS, routeBetween } from "@/lib/data/areas";
import { BOSSES, type Boss } from "@/lib/data/bosses";
import { BOSS_FLAG_DB } from "@/lib/save/itemdb";
import { INFUSION_TO_PATH, UPGRADE_PATHS, planUpgrade, totalMaterials } from "@/lib/data/upgrades";
import type { InventoryItem, ParsedCharacter } from "@/lib/save/types";

export type Source = "Steam API" | "Parsed save file" | "Companion" | "User confirmation" | "Inference" | "Demo";

export interface AchievementState {
  unlocked: boolean;
  unlockTime: number | null; // unix seconds
  apiName?: string;
  icon?: string;
  iconGray?: string;
}

export interface TrackerContext {
  character: ParsedCharacter | null;
  /** keyed by achievement display name; null when Steam data is unavailable */
  achievements: Record<string, AchievementState> | null;
  manualBosses: Record<string, boolean>; // bossId -> defeated
  manualAchievements: Record<string, boolean>;
  demo?: boolean;
}

export interface BossStatus {
  state: "defeated" | "alive" | "unknown";
  certainty: "verified" | "inferred" | "manual" | "unknown";
  sources: string[]; // Mongolian explanation lines
}

export function bossStatus(boss: Boss, ctx: TrackerContext): BossStatus {
  const ch = ctx.character;
  const sources: string[] = [];
  let verified = false;
  let inferredHit = false;
  if (ch) {
    for (const ev of boss.evidence) {
      for (const e of ch.bosses[ev] ?? []) {
        if (e === "flag") {
          verified = true;
          sources.push("Save: boss-defeat flag (verified)");
        } else if (e === "soul") {
          inferredHit = true;
          sources.push("Save: boss soul inventory-д байна (inferred)");
        } else if (e === "ng-clear") {
          inferredHit = true;
          sources.push("Save: NG+ — заавал ялах boss (inferred)");
        }
      }
    }
    const names = new Set(ch.inventory.map((i) => i.baseName));
    for (const it of boss.itemEvidence ?? []) {
      if (names.has(it)) {
        inferredHit = true;
        sources.push(`Save: '${it}' эзэмшиж байгаа (inferred)`);
      }
    }
    // Any verified bonfire outside the Asylum proves the Asylum Demon was beaten.
    if (boss.id === "asylum-demon" && ch.bonfires.value?.some((b) => b.area !== "Undead Asylum")) {
      inferredHit = true;
      sources.push("Save: Asylum-аас гадуурх bonfire олдсон (inferred)");
    }
    const wf = ch.worldFlags.value;
    if (wf) {
      for (const f of boss.worldFlagEvidence ?? []) {
        if (Object.values(wf).some((list) => list.includes(f))) {
          inferredHit = true;
          sources.push(`Save: world flag '${f}' (inferred)`);
        }
      }
    }
  }
  if (ctx.achievements) {
    for (const a of boss.achievementEvidence ?? []) {
      if (ctx.achievements[a]?.unlocked) {
        inferredHit = true;
        sources.push(`Steam: '${a}' achievement нээгдсэн`);
      }
    }
  }
  if (verified) return { state: "defeated", certainty: "verified", sources };
  if (inferredHit) return { state: "defeated", certainty: "inferred", sources };
  if (ctx.manualBosses[boss.id] === true) return { state: "defeated", certainty: "manual", sources: ["Хэрэглэгч гараар баталгаажуулсан"] };
  // "Alive" can only be claimed when this boss has a verified flag, the flag region was read, and it is unset.
  const hasFlag = boss.evidence.some((e) => e in BOSS_FLAG_DB);
  if (ch && hasFlag && ch.worldFlags.certainty === "verified") {
    return { state: "alive", certainty: "verified", sources: ["Save: boss-defeat flag тавигдаагүй (энэ NG тойрогт)"] };
  }
  return { state: "unknown", certainty: "unknown", sources: ["Найдвартай нотолгоо алга — гараар баталгаажуулж болно"] };
}

export function hasItem(ch: ParsedCharacter | null, baseName: string): boolean {
  return !!ch?.inventory.some((i) => i.baseName === baseName || i.name === baseName);
}
export function itemQty(ch: ParsedCharacter | null, name: string): number | null {
  if (!ch) return null;
  return ch.inventory.filter((i) => i.baseName === name).reduce((a, b) => a + b.quantity, 0);
}

export interface Objective {
  id: string;
  title: string;
  area: string;
  whyMn: string;
  whereMn: string;
  collectMn: string[];
  enemiesMn: string[];
  avoidMissingMn: string[];
  prepareMn: string[];
  achievement?: string;
  bossIds: string[];
  done: boolean;
  doneCertainty: BossStatus["certainty"];
}

interface MilestoneDef {
  id: string;
  title: string;
  area: string;
  bossIds: string[];
  whyMn: string;
  whereMn: string;
  collectMn: string[];
  enemiesMn: string[];
  avoidMissingMn: string[];
  prepareMn: string[];
  achievement?: string;
  optional?: boolean;
}

/** Main route through NG. Done-ness is derived from boss evidence. */
export const MILESTONES: MilestoneDef[] = [
  { id: "asylum", title: "Undead Asylum-аас зугтах", area: "undead-asylum", bossIds: ["asylum-demon"], whyMn: "Estus Flask авч Lordran руу нисэх.", whereMn: "Northern Undead Asylum", collectMn: ["Estus Flask", "Undead Asylum F2 East Key"], enemiesMn: ["Asylum Demon"], avoidMissingMn: ["Oscar-аас Estus Flask ба түлхүүр авах"], prepareMn: ["Бамбай + үндсэн зэвсэг"], achievement: "Reach Lordran" },
  { id: "burg", title: "Undead Burg — Taurus Demon", area: "undead-burg", bossIds: ["taurus-demon"], whyMn: "Undead Parish руу зам нээнэ.", whereMn: "Firelink-ээс аквидукээр дээш", collectMn: ["Residence Key (Undead Merchant)", "Firebombs"], enemiesMn: ["Hollow Soldier", "Taurus Demon"], avoidMissingMn: ["Solaire-тэй ярих (summon)"], prepareMn: ["Titanite Shard-аар зэвсгээ +3–5"] },
  { id: "parish", title: "Undead Parish — Хонх №1", area: "undead-parish", bossIds: ["bell-gargoyles"], whyMn: "Хоёр хонхны эхнийх. Sen's Fortress-ийг нээх нөхцөл.", whereMn: "Undead Burg-ийн Hellkite гүүрээр", collectMn: ["Basement Key", "Fire Keeper Soul (Undead Parish)"], enemiesMn: ["Berenike Knight", "Channeler", "Bell Gargoyles"], avoidMissingMn: ["Gargoyle-ийн сүүлийг тасдаж Gargoyle Tail Axe авах", "Andre of Astora-тай ярих (дархан)"], prepareMn: ["Зэвсэг +5", "Fire-д тэсвэртэй бамбай (2-р gargoyle галт амьсгалтай)"], achievement: "Ring the Bell (Undead Church)" },
  { id: "capra", title: "Lower Undead Burg — Capra Demon", area: "lower-undead-burg", bossIds: ["capra-demon"], whyMn: "Key to Depths авна.", whereMn: "Undead Burg-ийн доод хэсэг", collectMn: ["Key to Depths"], enemiesMn: ["Capra Demon", "нохой"], avoidMissingMn: ["Griggs of Vinheim-ийг суллах (sorcery)"], prepareMn: ["Орсон даруй шатаар гарах төлөвлөгөө"] },
  { id: "depths", title: "Depths — Gaping Dragon", area: "depths", bossIds: ["gaping-dragon"], whyMn: "Blighttown Key авна.", whereMn: "Lower Undead Burg-ийн доорх хаалга", collectMn: ["Blighttown Key"], enemiesMn: ["Gaping Dragon", "Channeler"], avoidMissingMn: ["Gaping Dragon-ий сүүлийг тасдах (Dragon King Greataxe)", "Laurentius-ыг аврах"], prepareMn: ["Хор/Toxic-ийн эсрэг Purple Moss"] },
  { id: "quelaag", title: "Blighttown — Quelaag, Хонх №2", area: "quelaags-domain", bossIds: ["quelaag"], whyMn: "Хоёр дахь хонх → Sen's Fortress нээгдэнэ.", whereMn: "Blighttown-ийн доод намаг", collectMn: ["Soul of Quelaag"], enemiesMn: ["Chaos Witch Quelaag", "Parasitic Wall Hugger"], avoidMissingMn: ["Chaos Servant covenant (Quelaag's Sister)", "Quelana-д уулзах (pyromancer)"], prepareMn: ["Purple Moss Clump", "Fire-д тэсвэртэй хуяг (Quelaag fire-д тэсвэртэй тул бусад төрлийн зэвсэг)"], achievement: "Ring the Bell (Quelaag's Domain)" },
  { id: "sens", title: "Sen's Fortress — Iron Golem", area: "sens-fortress", bossIds: ["iron-golem"], whyMn: "Anor Londo руу хүрэх цорын ганц зам.", whereMn: "Undead Parish-ийн хаалга (хоёр хонхны дараа)", collectMn: ["Cage Key", "Lightning Spear"], enemiesMn: ["Serpent Soldier", "Iron Golem"], avoidMissingMn: ["Big Hat Logan-ыг торноос суллах"], prepareMn: ["Lightning зэвсэг/resin (Iron Golem lightning-д сул)"], achievement: "Reach Anor Londo" },
  { id: "anor", title: "Anor Londo — Ornstein & Smough", area: "anor-londo", bossIds: ["ornstein-smough"], whyMn: "Lordvessel → Lord Soul-ын шат нээгдэнэ.", whereMn: "Anor Londo-ийн сүм", collectMn: ["Lordvessel", "Silver Knight equipment"], enemiesMn: ["Silver Knight", "Ornstein & Smough"], avoidMissingMn: ["Peculiar Doll байгаа бол Painted World", "Darkmoon covenant-д Gwyndolin-оос өмнө элсэх"], prepareMn: ["Giant Blacksmith-аар сайжруулалт", "Solaire summon"], achievement: "Lordvessel" },
  { id: "darkroot", title: "Darkroot — Sif (Covenant of Artorias)", area: "darkroot-garden", bossIds: ["sif"], whyMn: "Four Kings-ийн тулаанд Covenant of Artorias заавал.", whereMn: "Darkroot Garden (Crest of Artorias хаалга)", collectMn: ["Covenant of Artorias", "Soul of Sif"], enemiesMn: ["Great Grey Wolf Sif"], avoidMissingMn: ["Moonlight Butterfly (optional)", "Alvina — Forest Hunter covenant"], prepareMn: ["Crest of Artorias (Andre-аас) эсвэл Darkroot Basin-ээр"], achievement: "Art of Abysswalking" },
  { id: "kings", title: "New Londo — Four Kings", area: "the-abyss", bossIds: ["four-kings"], whyMn: "Lord Soul #1.", whereMn: "New Londo Ruins → The Abyss", collectMn: ["Bequeathed Lord Soul Shard (Four Kings)"], enemiesMn: ["Ghost", "Darkwraith", "The Four Kings"], avoidMissingMn: ["Darkwraith covenant хүсвэл Lordvessel-ийг Frampt-д өгөхөөс өмнө Four Kings-ийг ал"], prepareMn: ["Key to the Seal (Ingward)", "Хүчтэй, хурдан DPS"], achievement: "Defeat the Four Kings" },
  { id: "nito", title: "Catacombs → Tomb of the Giants — Nito", area: "tomb-of-giants", bossIds: ["pinwheel", "nito"], whyMn: "Lord Soul #2; Rite of Kindling.", whereMn: "Firelink-ийн оршуулгын газар", collectMn: ["Rite of Kindling", "Lord Soul (Nito)", "Skull Lantern"], enemiesMn: ["Skeleton", "Pinwheel", "Gravelord Nito"], avoidMissingMn: ["Gravelord Servant covenant", "Vamos (Fire дархан)"], prepareMn: ["Divine зэвсэг", "Skull Lantern / Sunlight Maggot (гэрэл)"], achievement: "Defeat Gravelord Nito" },
  { id: "seath", title: "Duke's Archives — Seath", area: "crystal-cave", bossIds: ["seath"], whyMn: "Lord Soul #3.", whereMn: "Anor Londo → Duke's Archives → Crystal Cave", collectMn: ["Bequeathed Lord Soul Shard (Seath)", "Crystal Ember"], enemiesMn: ["Crystal Golem", "Seath the Scaleless"], avoidMissingMn: ["Seath-ийн сүүлийг тасдах (Moonlight Greatsword)", "Logan-ийн sorcery"], prepareMn: ["Purging Stone (Curse)", "Эхний уулзалтанд үхэх нь скрипт"], achievement: "Defeat Seath the Scaleless" },
  { id: "izalith", title: "Demon Ruins → Lost Izalith — Bed of Chaos", area: "lost-izalith", bossIds: ["demon-firesage", "centipede-demon", "bed-of-chaos"], whyMn: "Lord Soul #4.", whereMn: "Quelaag's Domain → Demon Ruins → Lost Izalith", collectMn: ["Orange Charred Ring", "Lord Soul (Bed of Chaos)", "Chaos Flame Ember"], enemiesMn: ["Capra Demon (олон)", "Demon Firesage", "Centipede Demon", "Bed of Chaos"], avoidMissingMn: ["Solaire-ийн Sunlight Maggot-ыг түрүүлж устгах"], prepareMn: ["Orange Charred Ring (лаав)"], achievement: "Defeat Bed of Chaos" },
  { id: "gwyn", title: "Kiln of the First Flame — Gwyn", area: "firelink-altar", bossIds: ["gwyn"], whyMn: "Тоглоомын төгсгөл ба NG+.", whereMn: "Firelink Altar (4 Lord Soul байрлуулсны дараа)", collectMn: ["Soul of Gwyn, Lord of Cinder"], enemiesMn: ["Black Knight", "Gwyn, Lord of Cinder"], avoidMissingMn: ["NG+ эхлэхээс өмнө доорх 'NG+-ээс өмнө' жагсаалтыг шалга"], prepareMn: ["Parry дадлага", "Estus +"], achievement: "To Link the Fire" },
  { id: "dlc", title: "Artorias of the Abyss (DLC)", area: "oolacile", bossIds: ["sanctuary-guardian", "artorias", "kalameet", "manus"], whyMn: "DLC boss-ууд ба ховор зэвсгүүд.", whereMn: "Darkroot Basin (Dusk + Broken Pendant)", collectMn: ["Guardian Tail", "Obsidian Greatsword", "Soul of Artorias", "Soul of Manus"], enemiesMn: ["Sanctuary Guardian", "Knight Artorias", "Black Dragon Kalameet", "Manus"], avoidMissingMn: ["Sanctuary Guardian-ийн сүүл", "Kalameet-ийн сүүл", "Silver Pendant-ыг Manus-д авч явах"], prepareMn: ["Зэвсэг +10 / +5", "Silver Pendant"], optional: true },
];

export function computeObjectives(ctx: TrackerContext): Objective[] {
  return MILESTONES.map((m) => {
    const statuses = m.bossIds.map((id) => bossStatus(BOSSES.find((b) => b.id === id)!, ctx));
    const done = statuses.every((s) => s.state === "defeated");
    const cert = done
      ? statuses.some((s) => s.certainty === "manual")
        ? "manual"
        : statuses.every((s) => s.certainty === "verified")
          ? "verified"
          : "inferred"
      : "unknown";
    return { ...m, done, doneCertainty: cert };
  });
}

/** Estimated current area: area of the first not-done main-route milestone. Clearly an estimate. */
export function estimateArea(ctx: TrackerContext): { areaId: string | null; label: "Inference" } {
  if (!ctx.character && !ctx.achievements) return { areaId: null, label: "Inference" };
  const next = computeObjectives(ctx).find((o) => !o.done && !MILESTONES.find((m) => m.id === o.id)?.optional);
  return { areaId: next?.area ?? "firelink-altar", label: "Inference" };
}

export function nextRoute(fromArea: string | null, toArea: string): string[] {
  return routeBetween(fromArea ?? "firelink-shrine", toArea);
}

/** The most-reinforced weapon in the inventory (equipped slots are not decoded). */
export function bestWeapon(ch: ParsedCharacter | null): InventoryItem | null {
  if (!ch) return null;
  const ws = ch.inventory.filter((i) => i.category === "weapons" && i.baseName !== "Fists" && i.infusion);
  if (!ws.length) return null;
  const score = (w: InventoryItem) => {
    const p = UPGRADE_PATHS.find((x) => x.id === INFUSION_TO_PATH[w.infusion ?? "Normal"]);
    const depth = p?.from ? (p.from.level ?? 0) : 0;
    return depth + (w.level ?? 0);
  };
  return [...ws].sort((a, b) => score(b) - score(a))[0];
}

export interface UpgradeAdvice {
  weapon: InventoryItem;
  nextLevel: number;
  path: string;
  needs: { material: string; qty: number; have: number | null; missing: number }[];
  ember?: string;
  smith?: string;
}

export function nextUpgradeAdvice(ch: ParsedCharacter | null): UpgradeAdvice | null {
  const w = bestWeapon(ch);
  if (!w) return null;
  const path = INFUSION_TO_PATH[w.infusion ?? "Normal"];
  const p = UPGRADE_PATHS.find((x) => x.id === path);
  if (!p || !p.verified || (w.level ?? 0) >= p.maxLevel) return null;
  const target = Math.min(p.maxLevel, (w.level ?? 0) + 2);
  const plan = planUpgrade(path, w.level ?? 0, path, target);
  if (!plan) return null;
  const needs = totalMaterials(plan).map((m) => {
    const have = itemQty(ch, m.material);
    return { ...m, have, missing: Math.max(0, m.qty - (have ?? 0)) };
  });
  const first = plan.find((l) => l.ember || l.smith);
  return { weapon: w, nextLevel: target, path, needs, ember: first?.ember, smith: first?.smith };
}

/** Achievements the save suggests are within reach / already satisfied. */
export function achievementHints(ctx: TrackerContext): { ach: AchievementInfo; satisfiedBySave: boolean }[] {
  const ch = ctx.character;
  return ACHIEVEMENTS.map((a) => {
    let ok = false;
    const h = a.saveHint;
    if (ch && h) {
      if (h.kind === "covenantFlag") ok = !!ch.worldFlags.value?.["Join Covenants"]?.includes(h.flag);
      else if (h.kind === "worldFlag") ok = !!ch.worldFlags.value?.[h.category]?.includes(h.flag);
      else if (h.kind === "item") ok = hasItem(ch, h.item);
      else if (h.kind === "boss") ok = bossStatus(BOSSES.find((b) => b.id === h.bossId)!, ctx).state === "defeated";
      else if (h.kind === "maxWeapon")
        ok = ch.inventory.some((i) => i.category === "weapons" && i.infusion === h.infusion && (i.level ?? 0) >= h.level);
    }
    return { ach: a, satisfiedBySave: ok };
  });
}

export function achievementUnlocked(ctx: TrackerContext, name: string): { unlocked: boolean | null; source: Source | null } {
  if (ctx.achievements && name in ctx.achievements) return { unlocked: ctx.achievements[name].unlocked, source: ctx.demo ? "Demo" : "Steam API" };
  if (name in ctx.manualAchievements) return { unlocked: ctx.manualAchievements[name], source: "User confirmation" };
  return { unlocked: null, source: null };
}

export function completionPercent(ctx: TrackerContext): { unlocked: number; total: number; known: boolean } {
  const total = ACHIEVEMENTS.length;
  let unlocked = 0;
  let any = false;
  for (const a of ACHIEVEMENTS) {
    const s = achievementUnlocked(ctx, a.name);
    if (s.unlocked !== null) any = true;
    if (s.unlocked) unlocked++;
  }
  return { unlocked, total, known: any };
}

/** Items/tasks to finish before starting NG+ (things that become harder or impossible). */
export function beforeNgPlus(ctx: TrackerContext): { mn: string; done: boolean | null }[] {
  const ch = ctx.character;
  const cov = (f: string) => (ch?.worldFlags.value ? ch.worldFlags.value["Join Covenants"]?.includes(f) ?? false : null);
  const boss = (id: string) => {
    const s = bossStatus(BOSSES.find((b) => b.id === id)!, ctx);
    return s.state === "defeated" ? true : s.state === "alive" ? false : null;
  };
  return [
    { mn: "Сүүл тасдах зэвсгүүд: Gargoyle Tail Axe, Dragon King Greataxe, Moonlight Greatsword, Priscilla's Dagger", done: ch ? ["Gargoyle Tail Axe", "Dragon King Greataxe", "Moonlight Greatsword", "Priscilla's Dagger"].every((n) => hasItem(ch, n)) : null },
    { mn: "Darkwraith covenant (Lordvessel-ийг Frampt-д өгөхөөс өмнө)", done: cov("Darkwraith") },
    { mn: "Blade of the Darkmoon covenant (Gwyndolin-оос өмнө)", done: cov("Darkmoon Blade") },
    { mn: "Chaos Servant covenant", done: cov("Chaos Servant") },
    { mn: "Path of the Dragon covenant (Ash Lake)", done: cov("Path of the Dragon") },
    { mn: "Optional boss: Crossbreed Priscilla", done: boss("priscilla") },
    { mn: "Optional boss: Dark Sun Gwyndolin", done: boss("gwyndolin") },
    { mn: "DLC boss: Manus, Father of the Abyss", done: boss("manus") },
    { mn: "Rhea, Logan, Quelana-гийн шившлэгүүдийг худалдаж авах", done: null },
  ];
}

export { AREAS };
