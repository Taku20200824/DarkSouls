/**
 * Weapon reinforcement recipes.
 * Source: Dark Souls Wiki (darksouls.wikidot.com) pages "Normal", "Crystal",
 * "Lightning", "Raw", "Magic", "Enchanted", "Divine", "Occult", "Fire", "Chaos".
 * Each step = the material needed to reach that level.
 * Boss / Unique / Dragon paths are listed with their material type only: per-level
 * quantities were NOT verified for this build and are therefore not shown.
 */
export interface UpgradeStep {
  level: number; // level reached
  material: string;
  qty: number;
  /** Ember or ascension requirement at this step. */
  ember?: string;
  smith?: string; // required smith for this step (ascension / ember gated)
}

export interface UpgradePath {
  id: string;
  name: string;
  maxLevel: number;
  /** path id + level required before entering this path (e.g. normal +5) */
  from?: { path: string; level: number };
  steps: UpgradeStep[] | null;
  verified: boolean;
  mn: string;
  material?: string;
}

const s = (level: number, material: string, qty: number, ember?: string, smith?: string): UpgradeStep => ({ level, material, qty, ember, smith });

export const UPGRADE_PATHS: UpgradePath[] = [
  {
    id: "normal", name: "Normal (Regular)", maxLevel: 15, verified: true,
    mn: "Үндсэн зам. +5 хүртэл Weapon Smithbox эсвэл ямар ч дархан.",
    steps: [
      s(1, "Titanite Shard", 1), s(2, "Titanite Shard", 1), s(3, "Titanite Shard", 2), s(4, "Titanite Shard", 2), s(5, "Titanite Shard", 3),
      s(6, "Large Titanite Shard", 1, "Large Ember", "Andre of Astora"), s(7, "Large Titanite Shard", 1), s(8, "Large Titanite Shard", 2), s(9, "Large Titanite Shard", 2), s(10, "Large Titanite Shard", 3),
      s(11, "Titanite Chunk", 1, "Very Large Ember", "Andre of Astora"), s(12, "Titanite Chunk", 1), s(13, "Titanite Chunk", 2), s(14, "Titanite Chunk", 3),
      s(15, "Titanite Slab", 1),
    ],
  },
  {
    id: "crystal", name: "Crystal", maxLevel: 5, verified: true, from: { path: "normal", level: 10 },
    mn: "Normal +10-аас. Бат бөх чанар маш бага, засах боломжгүй.",
    steps: [s(0, "Titanite Chunk", 1, undefined, "Giant Blacksmith"), s(1, "Titanite Chunk", 1), s(2, "Titanite Chunk", 1), s(3, "Titanite Chunk", 2), s(4, "Titanite Chunk", 3), s(5, "Titanite Slab", 1)],
  },
  {
    id: "lightning", name: "Lightning", maxLevel: 5, verified: true, from: { path: "normal", level: 10 },
    mn: "Normal +10-аас. Giant Blacksmith (Anor Londo).",
    steps: [s(0, "Titanite Chunk", 1, undefined, "Giant Blacksmith"), s(1, "Titanite Chunk", 1), s(2, "Titanite Chunk", 1), s(3, "Titanite Chunk", 2), s(4, "Titanite Chunk", 3), s(5, "Titanite Slab", 1)],
  },
  {
    id: "raw", name: "Raw", maxLevel: 5, verified: true, from: { path: "normal", level: 5 },
    mn: "Normal +5-аас. Scaling багасч үндсэн хохирол өснө.",
    steps: [s(0, "Large Titanite Shard", 1, "Large Ember", "Andre of Astora"), s(1, "Large Titanite Shard", 1), s(2, "Large Titanite Shard", 1), s(3, "Large Titanite Shard", 2), s(4, "Large Titanite Shard", 2), s(5, "Large Titanite Shard", 3)],
  },
  {
    id: "magic", name: "Magic", maxLevel: 10, verified: true, from: { path: "normal", level: 5 },
    mn: "Normal +5-аас. Rickert of Vinheim (New Londo Ruins).",
    steps: [
      s(0, "Green Titanite Shard", 1, undefined, "Rickert of Vinheim"), s(1, "Green Titanite Shard", 1), s(2, "Green Titanite Shard", 1), s(3, "Green Titanite Shard", 2), s(4, "Green Titanite Shard", 2), s(5, "Green Titanite Shard", 3),
      s(6, "Blue Titanite Chunk", 1, "Large Magic Ember", "Rickert of Vinheim"), s(7, "Blue Titanite Chunk", 1), s(8, "Blue Titanite Chunk", 2), s(9, "Blue Titanite Chunk", 3), s(10, "Blue Titanite Slab", 1),
    ],
  },
  {
    id: "enchanted", name: "Enchanted", maxLevel: 5, verified: true, from: { path: "magic", level: 5 },
    mn: "Magic +5-аас. Intelligence-ээр scale хийнэ.",
    steps: [s(0, "Blue Titanite Chunk", 1, "Enchanted Ember", "Rickert of Vinheim"), s(1, "Blue Titanite Chunk", 1), s(2, "Blue Titanite Chunk", 1), s(3, "Blue Titanite Chunk", 2), s(4, "Blue Titanite Chunk", 3), s(5, "Blue Titanite Slab", 1)],
  },
  {
    id: "divine", name: "Divine", maxLevel: 10, verified: true, from: { path: "normal", level: 5 },
    mn: "Normal +5-аас. Араг ясыг бүрмөсөн устгана (Catacombs).",
    steps: [
      s(0, "Green Titanite Shard", 1, "Divine Ember", "Andre of Astora"), s(1, "Green Titanite Shard", 1), s(2, "Green Titanite Shard", 1), s(3, "Green Titanite Shard", 2), s(4, "Green Titanite Shard", 2), s(5, "Green Titanite Shard", 3),
      s(6, "White Titanite Chunk", 1, "Large Divine Ember", "Andre of Astora"), s(7, "White Titanite Chunk", 1), s(8, "White Titanite Chunk", 2), s(9, "White Titanite Chunk", 3), s(10, "White Titanite Slab", 1),
    ],
  },
  {
    id: "occult", name: "Occult", maxLevel: 5, verified: true, from: { path: "divine", level: 5 },
    mn: "Divine +5-аас. Faith-ээр scale хийнэ.",
    steps: [s(0, "White Titanite Chunk", 1, "Dark Ember", "Andre of Astora"), s(1, "White Titanite Chunk", 1), s(2, "White Titanite Chunk", 1), s(3, "White Titanite Chunk", 2), s(4, "White Titanite Chunk", 3), s(5, "White Titanite Slab", 1)],
  },
  {
    id: "fire", name: "Fire", maxLevel: 10, verified: true, from: { path: "normal", level: 5 },
    mn: "Normal +5-аас. Vamos (Catacombs). Scaling алга болно.",
    steps: [
      s(0, "Green Titanite Shard", 1, undefined, "Vamos"), s(1, "Green Titanite Shard", 1), s(2, "Green Titanite Shard", 1), s(3, "Green Titanite Shard", 2), s(4, "Green Titanite Shard", 2), s(5, "Green Titanite Shard", 3),
      s(6, "Red Titanite Chunk", 1, "Large Flame Ember", "Vamos"), s(7, "Red Titanite Chunk", 1), s(8, "Red Titanite Chunk", 2), s(9, "Red Titanite Chunk", 3), s(10, "Red Titanite Slab", 1),
    ],
  },
  {
    id: "chaos", name: "Chaos", maxLevel: 5, verified: true, from: { path: "fire", level: 5 },
    mn: "Fire +5-аас. Humanity-ээр scale хийнэ.",
    steps: [s(0, "Red Titanite Chunk", 1, "Chaos Flame Ember", "Vamos"), s(1, "Red Titanite Chunk", 1), s(2, "Red Titanite Chunk", 1), s(3, "Red Titanite Chunk", 2), s(4, "Red Titanite Chunk", 3), s(5, "Red Titanite Slab", 1)],
  },
  { id: "boss", name: "Boss weapons", maxLevel: 5, verified: false, steps: null, material: "Demon Titanite", mn: "Boss soul-оос хийсэн зэвсэг. Материал: Demon Titanite. Түвшин тус бүрийн тоо хэмжээ энэ хувилбарт баталгаажаагүй." },
  { id: "unique", name: "Unique weapons", maxLevel: 5, verified: false, steps: null, material: "Twinkling Titanite", mn: "Өвөрмөц зэвсэг. Материал: Twinkling Titanite. Тоо хэмжээ баталгаажаагүй." },
  { id: "dragon", name: "Dragon weapons", maxLevel: 5, verified: false, steps: null, material: "Dragon Scale", mn: "Лууны зэвсэг. Материал: Dragon Scale. Тоо хэмжээ баталгаажаагүй." },
];

/** Infusion name from the save -> path id */
export const INFUSION_TO_PATH: Record<string, string> = {
  Normal: "normal", Crystal: "crystal", Lightning: "lightning", Raw: "raw", Magic: "magic",
  Enchanted: "enchanted", Divine: "divine", Occult: "occult", Fire: "fire", Chaos: "chaos",
};

export const SOULS_COST_NOTE_MN =
  "Сүнсний зардал зэвсгийн хэмжээнээс хамаарч өөр (ихэнх зэвсэг түвшин тутамд ~200, 100–800 хооронд). Тодорхой зэвсгийн зардал баталгаажаагүй тул тооцоонд оруулаагүй.";

export interface PlanLine {
  path: string;
  level: number;
  material: string;
  qty: number;
  ember?: string;
  smith?: string;
}

/**
 * Compute the full route from (path, level) to (targetPath, targetLevel).
 * Returns null if the target is unreachable or uses an unverified path.
 */
export function planUpgrade(curPath: string, curLevel: number, targetPath: string, targetLevel: number): PlanLine[] | null {
  const byId = new Map(UPGRADE_PATHS.map((p) => [p.id, p]));
  const target = byId.get(targetPath);
  if (!target || !target.verified || !target.steps) return null;
  if (targetLevel > target.maxLevel) return null;
  // Chain of paths from root to target.
  const chain: { path: UpgradePath; startLevel: number }[] = [];
  let p: UpgradePath | undefined = target;
  while (p) {
    chain.unshift({ path: p, startLevel: 0 });
    p = p.from ? byId.get(p.from.path) : undefined;
  }
  const idx = chain.findIndex((c) => c.path.id === curPath);
  if (idx === -1) return null; // current path is not an ancestor of the target
  const lines: PlanLine[] = [];
  for (let i = idx; i < chain.length; i++) {
    const path = chain[i].path;
    const next = chain[i + 1];
    const goal = next ? next.path.from!.level : targetLevel;
    const startAfter = i === idx ? curLevel : -1; // entering a new path starts at +0 (ascension step level 0)
    if (i === idx && curLevel > goal) return null; // went past the branching level
    for (const st of path.steps ?? []) {
      if (st.level > startAfter && st.level <= goal) lines.push({ path: path.id, ...st });
    }
  }
  return lines;
}

export function totalMaterials(lines: PlanLine[]): { material: string; qty: number }[] {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.material, (m.get(l.material) ?? 0) + l.qty);
  return [...m.entries()].map(([material, qty]) => ({ material, qty }));
}

/**
 * Farming hints. Only broad, well-established sources are stated; specific spawn
 * spots that could not be verified for this build are deliberately left out.
 */
export const FARMING_MN: Record<string, string> = {
  "Titanite Shard": "Andre of Astora, Giant Blacksmith, Vamos-оос 800 souls-оор худалдаж авна. Undead Burg/Parish-ийн дайснуудаас унана.",
  "Large Titanite Shard": "Lordran-ы дунд шатны бүсүүдийн дайснууд болон Crystal Lizard-ууд. Тодорхой farm цэг баталгаажаагүй.",
  "Titanite Chunk": "Titanite Demon-ууд болон хожуу бүсийн Crystal Lizard-ууд (тойрог бүрт хязгаартай).",
  "Titanite Slab": "Тодорхой байршилд цөөн тоогоор олдоно; NG тойрог бүрт хязгаартай.",
  "Green Titanite Shard": "Crystal Lizard-ууд болон эрт/дунд шатны бүсүүд. Тодорхой farm цэг баталгаажаагүй.",
  "Blue Titanite Chunk": "Crystal Lizard-ууд; тодорхой farm цэг баталгаажаагүй.",
  "Blue Titanite Slab": "Тойрог бүрт хязгаартай, тодорхой байршлаас.",
  "White Titanite Chunk": "Crystal Lizard-ууд; тодорхой farm цэг баталгаажаагүй.",
  "White Titanite Slab": "Тойрог бүрт хязгаартай, тодорхой байршлаас.",
  "Red Titanite Chunk": "Crystal Lizard-ууд; тодорхой farm цэг баталгаажаагүй.",
  "Red Titanite Slab": "Тойрог бүрт хязгаартай, тодорхой байршлаас.",
  "Demon Titanite": "Titanite Demon-ууд (Lost Izalith гэх мэт).",
  "Twinkling Titanite": "Crystal Lizard-ууд; тодорхой farm цэг баталгаажаагүй.",
  "Dragon Scale": "Тодорхой farm цэг баталгаажаагүй.",
};
