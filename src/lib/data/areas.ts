/**
 * Lordran areas and their in-game connections.
 *
 * Map coordinates (x, y in a 1000x700 canvas) are ILLUSTRATIVE — the save format does
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
  bosses: string[]; // boss ids
  npcs: string[];
  items: string[]; // notable items (official names)
  shortcuts: string[]; // in Mongolian
  secrets: string[];
}

export interface Connection {
  from: string;
  to: string;
  /** Mongolian requirement note; empty for open paths. */
  requires?: string;
}

export const AREAS: Area[] = [
  {
    id: "undead-asylum",
    name: "Northern Undead Asylum",
    mn: "Аялал эхэлдэг шорон. Asylum Demon-ийг ялж Estus Flask авна.",
    x: 910, y: 70, bonfireArea: "Undead Asylum",
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
    x: 480, y: 400, bonfireArea: "Firelink Shrine",
    bosses: [], npcs: ["Crestfallen Warrior", "Petrus of Thorolund", "Anastacia of Astora", "Kingseeker Frampt", "Laurentius of the Great Swamp"],
    items: ["Homeward Bone", "Binoculars (Undead Burg)", "Covenant: Way of White (Petrus)"],
    shortcuts: ["Undead Parish-аас буух лифт", "New Londo Ruins руу буух лифт"], secrets: [],
  },
  {
    id: "undead-burg",
    name: "Undead Burg",
    mn: "Firelink-ээс дээш гарах эхний хот. Taurus Demon, Hellkite Drake гүүр.",
    x: 480, y: 310, bonfireArea: "Undead Burg",
    bosses: ["taurus-demon"], npcs: ["Solaire of Astora", "Undead Merchant (Male)"],
    items: ["Drake Sword (Hellkite Drake tail)", "Covenant: Warrior of Sunlight (Sunlight Altar)"],
    shortcuts: ["Firelink руу буцах шат"], secrets: [],
  },
  {
    id: "lower-undead-burg",
    name: "Lower Undead Burg",
    mn: "Доод хороолол. Capra Demon, Depths руу орох хаалга.",
    x: 610, y: 330,
    bosses: ["capra-demon"], npcs: ["Undead Merchant (Female)", "Griggs of Vinheim"],
    items: ["Key to Depths (Capra Demon)", "Mystery Key"],
    shortcuts: ["Undead Burg-ийн Watchtower Basement Key → Darkroot Basin"], secrets: [],
  },
  {
    id: "undead-parish",
    name: "Undead Parish",
    mn: "Анхны Хонх (Bell of Awakening) ба Bell Gargoyles.",
    x: 480, y: 210, bonfireArea: "Undead Parish",
    bosses: ["bell-gargoyles"], npcs: ["Andre of Astora", "Oswald of Carim", "Knight Lautrec of Carim (cell)"],
    items: ["Gargoyle Tail Axe (tail cut)", "Basement Key", "Fire Keeper Soul (Undead Parish)"],
    shortcuts: ["Firelink руу буух лифт"], secrets: [],
  },
  {
    id: "darkroot-garden",
    name: "Darkroot Garden",
    mn: "Ой. Moonlight Butterfly, Sif-ийн оршуулга, Forest Hunter covenant.",
    x: 630, y: 170, bonfireArea: "Darkroot Garden",
    bosses: ["moonlight-butterfly", "sif"], npcs: ["Alvina of the Darkroot Wood", "Shiva of the East"],
    items: ["Crest of Artorias (Andre-аас худалдаж авна)", "Covenant of Artorias (Sif)", "Wolf Ring"],
    shortcuts: [], secrets: [],
  },
  {
    id: "darkroot-basin",
    name: "Darkroot Basin",
    mn: "Нуур, Hydra, Golden Crystal Golem (Dusk of Oolacile).",
    x: 700, y: 260, bonfireArea: "Darkroot Basin",
    bosses: [], npcs: ["Dusk of Oolacile"],
    items: ["Grass Crest Shield", "Havel's Ring (Watchtower — Havel)"],
    shortcuts: ["Watchtower → Undead Burg"], secrets: ["DLC: Dusk-ийг аварсны дараа Golden Crystal Golem → Oolacile"],
  },
  {
    id: "valley-of-drakes",
    name: "Valley of Drakes",
    mn: "Луунуудын хөндий. Blighttown, New Londo, Darkroot-ийг холбоно.",
    x: 580, y: 470,
    bosses: [], npcs: [],
    items: ["Dragon Crest Shield", "Red Tearstone Ring"],
    shortcuts: [], secrets: [],
  },
  {
    id: "new-londo-ruins",
    name: "New Londo Ruins",
    mn: "Живсэн хот. Ghost-уудыг цохихын тулд Transient Curse эсвэл Cursed зэвсэг хэрэгтэй.",
    x: 290, y: 560,
    bosses: ["four-kings"], npcs: ["Ingward", "Darkstalker Kaathe"],
    items: ["Key to the Seal (Ingward)", "Transient Curse"],
    shortcuts: ["Firelink руу лифт"], secrets: [],
  },
  {
    id: "the-abyss",
    name: "The Abyss",
    mn: "Four Kings-ийн тулаан. Covenant of Artorias бөгж заавал.",
    x: 220, y: 650, bonfireArea: "The Abyss",
    bosses: [], npcs: ["Darkstalker Kaathe"], items: ["Bequeathed Lord Soul Shard (Four Kings)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "depths",
    name: "The Depths",
    mn: "Бохир ус, Gaping Dragon. Blighttown-ийн хаалгыг нээх түлхүүр.",
    x: 680, y: 400, bonfireArea: "Depths",
    bosses: ["gaping-dragon"], npcs: ["Laurentius of the Great Swamp (rescue)"],
    items: ["Blighttown Key (Gaping Dragon)", "Dragon King Greataxe (tail cut)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "blighttown",
    name: "Blighttown",
    mn: "Хортой намаг. Quelaag ба хоёр дахь хонх руу хүрэх зам.",
    x: 730, y: 480, bonfireArea: "Blighttown",
    bosses: [], npcs: ["Shiva of the East", "Fair Lady"], items: ["Power Within", "Fire Keeper Soul (Blighttown)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "quelaags-domain",
    name: "Quelaag's Domain",
    mn: "Chaos Witch Quelaag, хоёр дахь Bell of Awakening, Chaos Servant covenant.",
    x: 830, y: 550, bonfireArea: "Quelaag's Domain",
    bosses: ["quelaag"], npcs: ["Quelaag's Sister (Daughter of Chaos)", "Quelana of Izalith"],
    items: ["Soul of Quelaag"], shortcuts: [], secrets: [],
  },
  {
    id: "great-hollow",
    name: "The Great Hollow",
    mn: "Модны хөндий. Blighttown-ийн нууц хана.",
    x: 650, y: 560, bonfireArea: "The Great Hollow",
    bosses: [], npcs: [], items: ["Cloranthy Ring"], shortcuts: [], secrets: ["Blighttown-ийн доод хэсэгт illusory wall"],
  },
  {
    id: "ash-lake",
    name: "Ash Lake",
    mn: "Мөнхийн лууны нуур. Path of the Dragon covenant.",
    x: 580, y: 650, bonfireArea: "Ash Lake",
    bosses: [], npcs: ["Everlasting Dragon"], items: ["Dragon Greatsword (Everlasting Dragon tail)", "Great Magic Barrier"],
    shortcuts: [], secrets: ["Hydra-гийн ард illusory wall"],
  },
  {
    id: "demon-ruins",
    name: "Demon Ruins",
    mn: "Чөтгөрүүдийн балгас. Ceaseless Discharge, Demon Firesage, Centipede Demon.",
    x: 880, y: 620, bonfireArea: "Demon Ruins",
    bosses: ["ceaseless-discharge", "demon-firesage", "centipede-demon"], npcs: ["Quelana of Izalith"],
    items: ["Orange Charred Ring (Centipede Demon)", "Gold-Hemmed Black set"], shortcuts: [], secrets: [],
  },
  {
    id: "lost-izalith",
    name: "Lost Izalith",
    mn: "Bed of Chaos — Lord Soul. Lordvessel байрлуулсны дараа нээгдэнэ.",
    x: 960, y: 680, bonfireArea: "Lost Izalith",
    bosses: ["bed-of-chaos"], npcs: [], items: ["Lord Soul (Bed of Chaos)", "Chaos Flame Ember"], shortcuts: [], secrets: [],
  },
  {
    id: "sens-fortress",
    name: "Sen's Fortress",
    mn: "Хавх, дүүжин сүх. Хоёр хонх дуугарсны дараа нээгдэнэ.",
    x: 400, y: 110, bonfireArea: "Sen's Fortress",
    bosses: ["iron-golem"], npcs: ["Big Hat Logan (cell)", "Crestfallen Merchant", "Siegmeyer of Catarina"],
    items: ["Core of an Iron Golem", "Lightning Spear", "Cage Key"], shortcuts: [], secrets: [],
  },
  {
    id: "anor-londo",
    name: "Anor Londo",
    mn: "Бурхдын хот. Ornstein & Smough, Gwynevere, Lordvessel.",
    x: 400, y: 20, bonfireArea: "Anor Londo",
    bosses: ["ornstein-smough", "gwyndolin"], npcs: ["Giant Blacksmith", "Gwynevere", "Darkmoon Knightess"],
    items: ["Lordvessel", "Silver Knight set", "Covenant: Princess's Guard", "Covenant: Blade of the Darkmoon"],
    shortcuts: [], secrets: ["Gwynevere-ийн хүрээ нь illusion — Dark Sun Gwyndolin"],
  },
  {
    id: "painted-world",
    name: "Painted World of Ariamis",
    mn: "Зураг доторх ертөнц. Peculiar Doll хэрэгтэй. Crossbreed Priscilla.",
    x: 210, y: 15, bonfireArea: "Painted World of Ariamis",
    bosses: ["priscilla"], npcs: ["Crossbreed Priscilla"], items: ["Priscilla's Dagger (tail cut)", "Velka's Rapier", "Vow of Silence"],
    shortcuts: [], secrets: [],
  },
  {
    id: "dukes-archives",
    name: "The Duke's Archives",
    mn: "Seath-ийн номын сан. Lordvessel-ийн дараа нээгдэнэ.",
    x: 280, y: 110, bonfireArea: "The Duke's Archives",
    bosses: [], npcs: ["Big Hat Logan", "Sieglinde of Catarina (cell)", "Rhea / Petrus (variants)"],
    items: ["Archive Tower Cell Key", "Crystal Ember", "Fire Keeper Soul (Duke's Archives)"], shortcuts: [], secrets: [],
  },
  {
    id: "crystal-cave",
    name: "Crystal Cave",
    mn: "Үл үзэгдэх гүүр. Seath the Scaleless — Primordial Crystal-ийг эвд.",
    x: 150, y: 150, bonfireArea: "Crystal Cave",
    bosses: ["seath"], npcs: [], items: ["Bequeathed Lord Soul Shard (Seath)", "Moonlight Greatsword (tail cut)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "catacombs",
    name: "The Catacombs",
    mn: "Араг ясны оршуулга. Divine зэвсэггүй бол араг яс сэргэнэ.",
    x: 290, y: 440, bonfireArea: "Catacombs",
    bosses: ["pinwheel"], npcs: ["Patches the Hyena"], items: ["Darkmoon Seance Ring", "Rite of Kindling (Pinwheel)"],
    shortcuts: [], secrets: [],
  },
  {
    id: "tomb-of-giants",
    name: "Tomb of the Giants",
    mn: "Харанхуй булш. Gravelord Nito — Lord Soul.",
    x: 170, y: 500, bonfireArea: "Tomb of the Giants",
    bosses: ["nito"], npcs: ["Patches the Hyena", "Rhea of Thorolund"],
    items: ["Lord Soul (Nito)", "Skull Lantern"], shortcuts: [], secrets: [],
  },
  {
    id: "firelink-altar",
    name: "Firelink Altar / Kiln of the First Flame",
    shortName: "Kiln of the First Flame",
    mn: "Lordvessel ба 4 Lord Soul-ыг байрлуулсны дараа Gwyn руу хүрэх зам.",
    x: 480, y: 520, bonfireArea: "Firelink Altar",
    bosses: ["gwyn"], npcs: ["Kingseeker Frampt"], items: ["Soul of Gwyn, Lord of Cinder"], shortcuts: [], secrets: [],
  },
  {
    id: "oolacile",
    name: "Oolacile (Sanctuary Garden → Royal Wood → Township)",
    shortName: "Oolacile (DLC)",
    mn: "DLC: Artorias of the Abyss. Sanctuary Guardian, Artorias, Kalameet, Manus.",
    x: 870, y: 230, dlc: true, bonfireArea: "Oolacile",
    bosses: ["sanctuary-guardian", "artorias", "kalameet"], npcs: ["Elizabeth", "Hawkeye Gough", "Marvellous Chester"],
    items: ["Guardian Tail (tail cut)", "Obsidian Greatsword (Kalameet tail)"], shortcuts: [], secrets: [],
  },
  {
    id: "chasm-of-the-abyss",
    name: "Chasm of the Abyss",
    mn: "DLC: Manus, Father of the Abyss. Silver Pendant заавал авч яв.",
    x: 950, y: 320, dlc: true, bonfireArea: "Chasm of the Abyss",
    bosses: ["manus"], npcs: ["Dusk of Oolacile"], items: ["Soul of Manus"], shortcuts: [], secrets: [],
  },
];

export const CONNECTIONS: Connection[] = [
  { from: "undead-asylum", to: "firelink-shrine", requires: "Asylum Demon-ийн дараа хэрээ" },
  { from: "firelink-shrine", to: "undead-burg" },
  { from: "firelink-shrine", to: "new-londo-ruins", requires: "Лифт / New Londo руу буух шат" },
  { from: "firelink-shrine", to: "catacombs" },
  { from: "firelink-shrine", to: "undead-parish", requires: "Parish-ийн лифт (shortcut)" },
  { from: "firelink-shrine", to: "firelink-altar", requires: "Хоёр хонх → Frampt" },
  { from: "undead-burg", to: "undead-parish", requires: "Taurus Demon гүүр" },
  { from: "undead-burg", to: "lower-undead-burg", requires: "Mystery/Residence key эсвэл Parish-аас" },
  { from: "undead-burg", to: "darkroot-basin", requires: "Watchtower Basement Key" },
  { from: "undead-parish", to: "darkroot-garden", requires: "Andre-ийн ойролцоох хаалга (Crest of Artorias дотор)" },
  { from: "undead-parish", to: "sens-fortress", requires: "Хоёр хонх дуугарсан" },
  { from: "lower-undead-burg", to: "depths", requires: "Key to Depths (Capra Demon)" },
  { from: "darkroot-garden", to: "darkroot-basin" },
  { from: "darkroot-basin", to: "valley-of-drakes" },
  { from: "darkroot-basin", to: "oolacile", requires: "DLC: Dusk + Broken Pendant" },
  { from: "valley-of-drakes", to: "new-londo-ruins", requires: "Key to New Londo Ruins / Master Key" },
  { from: "valley-of-drakes", to: "blighttown", requires: "Дээд Blighttown-ий хаалга (Master Key эсвэл New Londo-оос)" },
  { from: "depths", to: "blighttown", requires: "Blighttown Key (Gaping Dragon)" },
  { from: "blighttown", to: "quelaags-domain" },
  { from: "blighttown", to: "great-hollow", requires: "Illusory wall" },
  { from: "great-hollow", to: "ash-lake" },
  { from: "quelaags-domain", to: "demon-ruins", requires: "Quelaag-ийн дараа" },
  { from: "demon-ruins", to: "lost-izalith", requires: "Lordvessel байрлуулсан + Centipede Demon" },
  { from: "sens-fortress", to: "anor-londo", requires: "Iron Golem → Batwing Demon" },
  { from: "anor-londo", to: "painted-world", requires: "Peculiar Doll" },
  { from: "anor-londo", to: "dukes-archives", requires: "Lordvessel байрлуулсан" },
  { from: "dukes-archives", to: "crystal-cave" },
  { from: "catacombs", to: "tomb-of-giants", requires: "Pinwheel" },
  { from: "new-londo-ruins", to: "the-abyss", requires: "Key to the Seal + Covenant of Artorias" },
  { from: "oolacile", to: "chasm-of-the-abyss" },
];

export const areaById = (id: string) => AREAS.find((a) => a.id === id);

/** Shortest route (BFS over undirected connections). */
export function routeBetween(from: string, to: string): string[] {
  if (from === to) return [from];
  const adj = new Map<string, string[]>();
  for (const c of CONNECTIONS) {
    (adj.get(c.from) ?? adj.set(c.from, []).get(c.from)!).push(c.to);
    (adj.get(c.to) ?? adj.set(c.to, []).get(c.to)!).push(c.from);
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
