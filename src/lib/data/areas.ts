/**
 * Lordran areas and their in-game connections.
 *
 * Map coordinates (x, y in a 1160x740 canvas) are ILLUSTRATIVE — the save format does
 * not expose world coordinates. Connections follow the actual game world.
 * `bonfireArea` matches the area strings of the bonfire table so discovered bonfires
 * can be attributed to an area.
 */
export interface Area {
  id: string;
  name: string;
  /** Short label for cramped UI (map node text); falls back to `name` when absent. */
  shortName?: string;
  mn: string; // Mongolian short description
  x: number;
  y: number;
  dlc?: boolean;
  bonfireArea?: string;
  /** Optional subset for areas sharing a save-file bonfire group. */
  bonfireIds?: number[];
  bosses: string[]; // boss ids
  npcs: string[];
  items: string[]; // notable items (official names)
  shortcuts: string[]; // in Mongolian
  secrets: string[];
}

export type ConnectionKind = "path" | "lift" | "shortcut" | "gate" | "warp" | "drop";

export interface Connection {
  from: string;
  to: string;
  kind?: ConnectionKind;
  oneWay?: boolean;
  /** A bypass that the standard route avoids when another route exists. */
  alternate?: boolean;
  /** Mongolian travel requirement, when applicable. */
  requires?: string;
}

export const AREAS: Area[] = [
  {
    id: "undead-asylum",
    name: "Northern Undead Asylum",
    mn: "Аялал эхэлдэг шорон. Asylum Demon-ийг ялж Estus Flask авна.",
    x: 845, y: 64, bonfireArea: "Undead Asylum",
    bosses: ["asylum-demon", "stray-demon"],
    npcs: ["Oscar of Astora"],
    items: ["Estus Flask", "Undead Asylum F2 East Key", "Peculiar Doll", "Rusted Iron Ring"],
    shortcuts: [],
    secrets: ["Буцаж ирэхэд (Firelink-ээс хэрээгээр) Stray Demon-ийн өрөө нээгдэнэ."],
  },
  {
    id: "firelink-shrine",
    name: "Firelink Shrine",
    mn: "Лордраны төв зангилаа. Бүх гол замын салаа эндээс эхэлнэ.",
    x: 425, y: 378, bonfireArea: "Firelink Shrine",
    bosses: [], npcs: ["Crestfallen Warrior", "Petrus of Thorolund", "Anastacia of Astora", "Kingseeker Frampt", "Laurentius of the Great Swamp"],
    items: ["Homeward Bone", "Binoculars (Undead Burg)", "Covenant: Way of White (Petrus)"],
    shortcuts: ["Undead Parish-аас буух лифт", "New Londo Ruins руу буух лифт"], secrets: [],
  },
  {
    id: "undead-burg",
    name: "Undead Burg",
    mn: "Firelink-ээс дээш гарах эхний хот. Taurus Demon, Hellkite Drake гүүр.",
    x: 590, y: 290, bonfireArea: "Undead Burg",
    bosses: ["taurus-demon"], npcs: ["Solaire of Astora", "Undead Merchant (Male)"],
    items: ["Drake Sword (Hellkite Drake tail)", "Covenant: Warrior of Sunlight (Sunlight Altar)"],
    shortcuts: ["Hellkite гүүрнээс bonfire руу буух шат"], secrets: [],
  },
  {
    id: "lower-undead-burg",
    name: "Lower Undead Burg",
    mn: "Доод хороолол. Capra Demon, Depths руу орох хаалга.",
    x: 635, y: 373,
    bosses: ["capra-demon"], npcs: ["Undead Merchant (Female)", "Griggs of Vinheim"],
    items: ["Key to Depths (Capra Demon)", "Mystery Key"],
    shortcuts: ["Lower Burg талаас Firelink-ийн усан сувгийн хаалгыг нээнэ"], secrets: [],
  },
  {
    id: "undead-parish",
    name: "Undead Parish",
    mn: "Анхны Хонх (Bell of Awakening) ба Bell Gargoyles.",
    x: 460, y: 215, bonfireArea: "Undead Parish",
    bosses: ["bell-gargoyles"], npcs: ["Andre of Astora", "Oswald of Carim", "Knight Lautrec of Carim (cell)"],
    items: ["Gargoyle Tail Axe (tail cut)", "Basement Key", "Fire Keeper Soul (Undead Parish)"],
    shortcuts: ["Firelink руу буух лифт"], secrets: [],
  },
  {
    id: "darkroot-garden",
    name: "Darkroot Garden",
    mn: "Ой. Moonlight Butterfly, Sif-ийн оршуулга, Forest Hunter covenant.",
    x: 644, y: 175, bonfireArea: "Darkroot Garden",
    bosses: ["moonlight-butterfly", "sif"], npcs: ["Alvina of the Darkroot Wood", "Shiva of the East"],
    items: ["Crest of Artorias (Andre-аас худалдаж авна)", "Covenant of Artorias (Sif)", "Wolf Ring"],
    shortcuts: [], secrets: [],
  },
  {
    id: "darkroot-basin",
    name: "Darkroot Basin",
    mn: "Нуур, Hydra, Golden Crystal Golem (Dusk of Oolacile).",
    x: 748, y: 248, bonfireArea: "Darkroot Basin",
    bosses: [], npcs: ["Dusk of Oolacile"],
    items: ["Grass Crest Shield", "Havel's Ring (Watchtower — Havel)"],
    shortcuts: ["Watchtower → Undead Burg"], secrets: ["DLC: Dusk-ийг аварч, Duke’s Archives-аас Broken Pendant аваад нуурын портал руу буцна"],
  },
  {
    id: "valley-of-drakes",
    name: "Valley of Drakes",
    mn: "Луунуудын хөндий. Blighttown, New Londo, Darkroot-ийг холбоно.",
    x: 706, y: 447,
    bosses: [], npcs: [],
    items: ["Dragon Crest Shield", "Red Tearstone Ring"],
    shortcuts: [], secrets: [],
  },
  {
    id: "new-londo-ruins",
    name: "New Londo Ruins",
    mn: "Живсэн хот. Ghost-уудыг цохихын тулд Transient Curse эсвэл Cursed зэвсэг хэрэгтэй.",
    x: 480, y: 486,
    bosses: [], npcs: ["Ingward"],
    items: ["Key to the Seal (Ingward)", "Transient Curse"],
    shortcuts: ["Firelink руу лифт"], secrets: [],
  },
  {
    id: "the-abyss",
    name: "The Abyss",
    mn: "Four Kings-ийн тулаан. Covenant of Artorias бөгж заавал.",
    x: 467, y: 595, bonfireArea: "The Abyss",
    bosses: ["four-kings"], npcs: ["Darkstalker Kaathe"], items: ["Bequeathed Lord Soul Shard (Four Kings)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "depths",
    name: "The Depths",
    mn: "Бохир ус, Gaping Dragon. Blighttown-ийн хаалгыг нээх түлхүүр.",
    x: 827, y: 393, bonfireArea: "Depths",
    bosses: ["gaping-dragon"], npcs: ["Laurentius of the Great Swamp (rescue)"],
    items: ["Blighttown Key (Gaping Dragon)", "Dragon King Greataxe (tail cut)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "blighttown",
    name: "Blighttown",
    mn: "Хортой намаг. Quelaag ба хоёр дахь хонх руу хүрэх зам.",
    x: 826, y: 512, bonfireArea: "Blighttown",
    bosses: [], npcs: ["Shiva of the East", "Fair Lady"], items: ["Power Within", "Fire Keeper Soul (Blighttown)"],
    shortcuts: ["Усан хүрдээр Valley of Drakes руу гарна"], secrets: [],
  },
  {
    id: "quelaags-domain",
    name: "Quelaag's Domain",
    mn: "Chaos Witch Quelaag, хоёр дахь Bell of Awakening, Chaos Servant covenant.",
    x: 986, y: 510, bonfireArea: "Quelaag's Domain",
    bosses: ["quelaag"], npcs: ["Quelaag's Sister (Daughter of Chaos)", "Quelana of Izalith"],
    items: ["Soul of Quelaag"], shortcuts: [], secrets: [],
  },
  {
    id: "great-hollow",
    name: "The Great Hollow",
    mn: "Модны хөндий. Blighttown-ийн нууц хана.",
    x: 783, y: 604, bonfireArea: "The Great Hollow",
    bosses: [], npcs: [], items: ["Cloranthy Ring"], shortcuts: [], secrets: ["Blighttown-ийн доод хэсэгт illusory wall"],
  },
  {
    id: "ash-lake",
    name: "Ash Lake",
    mn: "Мөнхийн лууны нуур. Path of the Dragon covenant.",
    x: 768, y: 687, bonfireArea: "Ash Lake",
    bosses: [], npcs: ["Everlasting Dragon"], items: ["Dragon Greatsword (Everlasting Dragon tail)", "Great Magic Barrier"],
    shortcuts: [], secrets: ["Hydra-гийн ард illusory wall"],
  },
  {
    id: "demon-ruins",
    name: "Demon Ruins",
    mn: "Чөтгөрүүдийн балгас. Ceaseless Discharge, Demon Firesage, Centipede Demon.",
    x: 1025, y: 589, bonfireArea: "Demon Ruins",
    bosses: ["ceaseless-discharge", "demon-firesage", "centipede-demon"], npcs: ["Quelana of Izalith"],
    items: ["Orange Charred Ring (Centipede Demon)", "Gold-Hemmed Black set"], shortcuts: [], secrets: [],
  },
  {
    id: "lost-izalith",
    name: "Lost Izalith",
    mn: "Bed of Chaos — Lord Soul. Lordvessel байрлуулсны дараа нээгдэнэ.",
    x: 1026, y: 676, bonfireArea: "Lost Izalith",
    bosses: ["bed-of-chaos"], npcs: [], items: ["Lord Soul (Bed of Chaos)", "Chaos Flame Ember"], shortcuts: [], secrets: [],
  },
  {
    id: "sens-fortress",
    name: "Sen's Fortress",
    mn: "Хавх, дүүжин сүх. Хоёр хонх дуугарсны дараа нээгдэнэ.",
    x: 387, y: 146, bonfireArea: "Sen's Fortress",
    bosses: ["iron-golem"], npcs: ["Big Hat Logan (cell)", "Crestfallen Merchant", "Siegmeyer of Catarina"],
    items: ["Core of an Iron Golem", "Lightning Spear", "Cage Key"], shortcuts: [], secrets: [],
  },
  {
    id: "anor-londo",
    name: "Anor Londo",
    mn: "Бурхдын хот. Ornstein & Smough, Gwynevere, Lordvessel.",
    x: 388, y: 62, bonfireArea: "Anor Londo",
    bosses: ["ornstein-smough", "gwyndolin"], npcs: ["Giant Blacksmith", "Gwynevere", "Darkmoon Knightess"],
    items: ["Lordvessel", "Silver Knight set", "Covenant: Princess's Guard", "Covenant: Blade of the Darkmoon"],
    shortcuts: [], secrets: ["Gwynevere-ийн хүрээ нь illusion — Dark Sun Gwyndolin"],
  },
  {
    id: "painted-world",
    name: "Painted World of Ariamis",
    mn: "Зураг доторх ертөнц. Peculiar Doll хэрэгтэй. Crossbreed Priscilla.",
    x: 584, y: 62, bonfireArea: "Painted World of Ariamis",
    bosses: ["priscilla"], npcs: ["Crossbreed Priscilla"], items: ["Priscilla's Dagger (tail cut)", "Velka's Rapier", "Vow of Silence"],
    shortcuts: [], secrets: [],
  },
  {
    id: "dukes-archives",
    name: "The Duke's Archives",
    mn: "Seath-ийн номын сан. Lordvessel-ийн дараа нээгдэнэ.",
    x: 201, y: 65, bonfireArea: "The Duke's Archives",
    bosses: [], npcs: ["Big Hat Logan", "Sieglinde of Catarina (cell)", "Rhea / Petrus (variants)"],
    items: ["Archive Tower Cell Key", "Crystal Ember", "Fire Keeper Soul (Duke's Archives)"], shortcuts: [], secrets: [],
  },
  {
    id: "crystal-cave",
    name: "Crystal Cave",
    mn: "Үл үзэгдэх гүүр. Seath the Scaleless — Primordial Crystal-ийг эвд.",
    x: 108, y: 150, bonfireArea: "Crystal Cave",
    bosses: ["seath"], npcs: [], items: ["Bequeathed Lord Soul Shard (Seath)", "Moonlight Greatsword (tail cut)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "catacombs",
    name: "The Catacombs",
    mn: "Араг ясны оршуулга. Divine зэвсэггүй бол араг яс сэргэнэ.",
    x: 247, y: 437, bonfireArea: "Catacombs",
    bosses: ["pinwheel"], npcs: ["Patches the Hyena"], items: ["Darkmoon Seance Ring", "Rite of Kindling (Pinwheel)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "tomb-of-giants",
    name: "Tomb of the Giants",
    mn: "Харанхуй булш. Gravelord Nito — Lord Soul.",
    x: 126, y: 518, bonfireArea: "Tomb of the Giants",
    bosses: ["nito"], npcs: ["Patches the Hyena", "Rhea of Thorolund"],
    items: ["Lord Soul (Nito)", "Skull Lantern"], shortcuts: [], secrets: [],
  },
  {
    id: "firelink-altar",
    name: "Firelink Altar",
    mn: "Lordvessel болон дөрвөн Lord Soul-ыг байрлуулах тахилын ширээ.",
    x: 326, y: 543, bonfireArea: "Firelink Altar",
    bosses: [], npcs: ["Kingseeker Frampt"], items: [], shortcuts: [], secrets: [],
  },
  {
    id: "kiln-of-the-first-flame",
    name: "Kiln of the First Flame",
    shortName: "Kiln of the First Flame",
    mn: "Дөрвөн Lord Soul-ыг байрлуулсны дараа нээгдэх Gwyn-ийн бүс.",
    x: 250, y: 654,
    bosses: ["gwyn"], npcs: [], items: ["Soul of Gwyn, Lord of Cinder"], shortcuts: [], secrets: [],
  },
  {
    id: "oolacile",
    name: "Oolacile Sanctuary",
    mn: "DLC: Sanctuary Garden-аар орж Sanctuary Guardian-ийг давсны дараа Elizabeth-тэй уулзана.",
    x: 934, y: 170, dlc: true, bonfireArea: "Oolacile", bonfireIds: [1211961, 1211963],
    bosses: ["sanctuary-guardian"], npcs: ["Elizabeth"],
    items: ["Guardian Tail (tail cut)"], shortcuts: [], secrets: [],
  },
  {
    id: "royal-wood",
    name: "Royal Wood",
    mn: "DLC: Artorias-ийн талбай болон Kalameet-ийн хавцал.",
    x: 999, y: 247, dlc: true,
    bosses: ["artorias", "kalameet"], npcs: ["Hawkeye Gough", "Marvellous Chester"],
    items: ["Obsidian Greatsword (Kalameet tail)"], shortcuts: [], secrets: [],
  },
  {
    id: "oolacile-township",
    name: "Oolacile Township",
    mn: "DLC: Хотын дээврүүдээр бууж, шоронгоор дамжин Chasm of the Abyss-д хүрнэ.",
    x: 1028, y: 326, dlc: true, bonfireArea: "Oolacile", bonfireIds: [1211962, 1211964],
    bosses: [], npcs: [], items: ["Silver Pendant"], shortcuts: [], secrets: [],
  },
  {
    id: "chasm-of-the-abyss",
    name: "Chasm of the Abyss",
    mn: "DLC: Manus, Father of the Abyss. Silver Pendant нь түүний хар шидээс хамгаалахад тустай.",
    x: 1031, y: 418, dlc: true, bonfireArea: "Chasm of the Abyss",
    bosses: ["manus"], npcs: ["Dusk of Oolacile"], items: ["Soul of Manus"], shortcuts: [], secrets: [],
  },
];

export const CONNECTIONS: Connection[] = [
  { from: "undead-asylum", to: "firelink-shrine", kind: "warp", oneWay: true, requires: "Asylum Demon-ийн дараа хэрээгээр" },
  { from: "firelink-shrine", to: "undead-asylum", kind: "warp", oneWay: true, requires: "Дээвэр дээрх хэрээний үүр" },
  { from: "firelink-shrine", to: "undead-burg" },
  { from: "firelink-shrine", to: "new-londo-ruins", kind: "lift" },
  { from: "firelink-shrine", to: "catacombs" },
  { from: "firelink-shrine", to: "undead-parish", kind: "lift", requires: "Сүмийн талаас лифтийг идэвхжүүлнэ" },
  { from: "firelink-shrine", to: "lower-undead-burg", kind: "shortcut", alternate: true, requires: "Lower Burg талаас усан сувгийн хаалгыг нээнэ" },
  { from: "firelink-shrine", to: "firelink-altar", kind: "warp", requires: "Хоёр хонх → Frampt" },
  { from: "firelink-altar", to: "kiln-of-the-first-flame", kind: "gate", requires: "Lordvessel-д дөрвөн Lord Soul байрлуулсан" },
  { from: "undead-burg", to: "undead-parish" },
  { from: "undead-burg", to: "lower-undead-burg", kind: "gate", requires: "Basement Key (Undead Parish)" },
  { from: "undead-burg", to: "darkroot-basin", kind: "gate", alternate: true, requires: "Watchtower Basement Key эсвэл Master Key" },
  { from: "undead-parish", to: "darkroot-garden" },
  { from: "undead-parish", to: "sens-fortress", kind: "gate", requires: "Хоёр Bell of Awakening дуугарсан" },
  { from: "lower-undead-burg", to: "depths", kind: "gate", requires: "Key to Depths (Capra Demon)" },
  { from: "darkroot-garden", to: "darkroot-basin" },
  { from: "darkroot-basin", to: "valley-of-drakes", kind: "lift" },
  { from: "darkroot-basin", to: "oolacile", kind: "warp", oneWay: true, requires: "Dusk-ийг аварсан + Broken Pendant" },
  { from: "new-londo-ruins", to: "valley-of-drakes", kind: "shortcut", alternate: true, requires: "Дээд хаалга: Key to New Londo Ruins эсвэл Master Key. Доод гарц: ус буулгасан байх" },
  { from: "valley-of-drakes", to: "blighttown", alternate: true },
  { from: "depths", to: "blighttown", kind: "gate", requires: "Blighttown Key (Gaping Dragon)" },
  { from: "blighttown", to: "quelaags-domain" },
  { from: "blighttown", to: "great-hollow", kind: "shortcut", requires: "Нууц ханыг нээнэ" },
  { from: "great-hollow", to: "ash-lake" },
  { from: "quelaags-domain", to: "demon-ruins", kind: "gate", requires: "Chaos Witch Quelaag-ийг ялсан" },
  { from: "demon-ruins", to: "lost-izalith", kind: "gate", requires: "Lordvessel байрлуулсан + Centipede Demon, эсвэл Chaos Servant +2 товч зам" },
  { from: "sens-fortress", to: "anor-londo", kind: "warp", requires: "Iron Golem → Batwing Demon" },
  { from: "anor-londo", to: "painted-world", kind: "warp", oneWay: true, requires: "Peculiar Doll" },
  { from: "painted-world", to: "anor-londo", kind: "drop", oneWay: true, requires: "Priscilla-ийн цаадах тавцангаас үсэрнэ" },
  { from: "anor-londo", to: "dukes-archives", kind: "gate", requires: "Lordvessel байрлуулсан" },
  { from: "dukes-archives", to: "crystal-cave" },
  { from: "catacombs", to: "tomb-of-giants", kind: "gate", requires: "Pinwheel-ийг ялсан" },
  { from: "new-londo-ruins", to: "the-abyss", kind: "drop", oneWay: true, requires: "Ус буулгасан + Covenant of Artorias бөгж зүүсэн" },
  { from: "the-abyss", to: "firelink-shrine", kind: "warp", oneWay: true, requires: "Four Kings-ийн дараах bonfire-аас warp хийнэ" },
  { from: "oolacile", to: "firelink-shrine", kind: "warp", oneWay: true, requires: "Lordvessel-ээр bonfire-аас warp хийнэ" },
  { from: "oolacile", to: "royal-wood", kind: "gate", requires: "Sanctuary Guardian-ийг ялсан" },
  { from: "royal-wood", to: "oolacile-township", kind: "gate", requires: "Knight Artorias-ийг ялсан" },
  { from: "oolacile-township", to: "chasm-of-the-abyss" },
  { from: "royal-wood", to: "chasm-of-the-abyss", kind: "lift", alternate: true, requires: "Chasm талаас лифтийг идэвхжүүлнэ" },
];

export const areaById = (id: string) => AREAS.find((a) => a.id === id);

export function areaHasBonfire(area: Area, id: number, group: string): boolean {
  return area.bonfireArea === group && (area.bonfireIds?.includes(id) ?? true);
}

export function connectionBetween(from: string, to: string): Connection | undefined {
  return CONNECTIONS.find((c) => (c.from === from && c.to === to) || (!c.oneWay && c.from === to && c.to === from));
}

/** Shortest mapped route. Gate requirements are descriptive, not save-state checks. */
export function routeBetween(from: string, to: string, includeAlternates = true): string[] {
  if (!areaById(from) || !areaById(to)) return [];
  if (from === to) return [from];
  const adj = new Map<string, string[]>();
  for (const c of CONNECTIONS) {
    if (c.alternate && !includeAlternates) continue;
    (adj.get(c.from) ?? adj.set(c.from, []).get(c.from)!).push(c.to);
    if (!c.oneWay) (adj.get(c.to) ?? adj.set(c.to, []).get(c.to)!).push(c.from);
  }
  const prev = new Map<string, string>();
  const q = [from];
  const seen = new Set([from]);
  while (q.length) {
    const cur = q.shift()!;
    for (const n of adj.get(cur) ?? []) {
      if (seen.has(n)) continue;
      seen.add(n);
      prev.set(n, cur);
      if (n === to) {
        const path = [to];
        let p = to;
        while (prev.has(p)) path.unshift((p = prev.get(p)!));
        return path;
      }
      q.push(n);
    }
  }
  return [];
}
