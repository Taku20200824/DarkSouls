/**
 * NPC questlines. The save reader only exposes a handful of NPC flags (from the
 * sl2-analyzer known-flag table): Dusk rescued / summonable / dead, Siegmeyer dead,
 * Lautrec dead, Oswald dead, Shiva's bodyguard dead, first talks with Andre,
 * the Crestfallen Merchant and the Giant Blacksmith. Every other stage is tracked
 * manually by the player and is labelled as such.
 */
export interface QuestStage {
  id: string;
  mn: string;
  area?: string;
  /** World flag (category/name) that proves this stage. */
  flag?: { category: string; name: string };
  decisionMn?: string;
}
export interface Quest {
  id: string;
  npc: string;
  mn: string;
  stages: QuestStage[];
  failureMn: string[];
  rewardsMn: string[];
  missableMn?: string;
  deathFlag?: string;
}

export const QUESTS: Quest[] = [
  {
    id: "solaire", npc: "Solaire of Astora",
    mn: "Нарны дайчин. Хамгийн их тусалдаг summon.",
    stages: [
      { id: "meet", mn: "Undead Burg-ийн гүүрний ойролцоо уулзах", area: "undead-burg" },
      { id: "gargoyles", mn: "Bell Gargoyles-д summon хийх боломжтой", area: "undead-parish" },
      { id: "anor", mn: "Ornstein & Smough-д summon хийх боломжтой", area: "anor-londo" },
      { id: "izalith", mn: "Lost Izalith-ийн Sunlight Maggot-ыг Solaire-ээс түрүүлж устгах", area: "lost-izalith", decisionMn: "Хэрэв Solaire түрүүлж хүрвэл хий үзэгдэлд автаж дайсан болно." },
      { id: "kiln", mn: "Gwyn-ийн тулаанд summon хийх", area: "kiln-of-the-first-flame" },
    ],
    failureMn: ["Lost Izalith-д Sunlight Maggot-ыг түрүүлж устгаагүй бол Solaire hollow болно.", "Solaire-ийг алах эсвэл түүнийг дайсагнуулах."],
    rewardsMn: ["Gwyn хүртэлх summon тусламж", "Warrior of Sunlight covenant-ийн тухай мэдээлэл"],
    missableMn: "Lost Izalith-ийн шийдвэр.",
  },
  {
    id: "siegmeyer", npc: "Siegmeyer of Catarina",
    mn: "Сонгины хуягтай баатар. Олон газар гарч ирнэ.",
    stages: [
      { id: "sen", mn: "Sen's Fortress-ийн хаалганы өмнө уулзах", area: "sens-fortress" },
      { id: "anor", mn: "Anor Londo-д дахин уулзах", area: "anor-londo" },
      { id: "blight", mn: "Blighttown / Quelaag's Domain-ийн ойролцоо", area: "blighttown" },
      { id: "izalith", mn: "Lost Izalith-д түүнд туслах", area: "lost-izalith" },
      { id: "sieglinde", mn: "Охин Sieglinde-тэй холбоотой төгсгөл", area: "ash-lake" },
    ],
    failureMn: ["Тусламж хэрэгтэй үед нь туслаагүй бол quest тасарч болно."],
    rewardsMn: ["Catarina-ийн хуягтай холбоотой шагналууд (quest-ын төгсгөлд)"],
    deathFlag: "Siegmeyer, Dead",
  },
  {
    id: "logan", npc: "Big Hat Logan",
    mn: "Агуу шидтэн. Sorcery-ийн гол худалдагч.",
    stages: [
      { id: "free", mn: "Sen's Fortress-ийн торноос суллах", area: "sens-fortress" },
      { id: "firelink", mn: "Firelink Shrine-д sorcery зарна", area: "firelink-shrine" },
      { id: "archives", mn: "Duke's Archives-ийн шоронгоос суллах", area: "dukes-archives" },
      { id: "library", mn: "Archives-ийн номын санд — sorcery-уудыг худалдаж ав", area: "dukes-archives" },
      { id: "end", mn: "Seath-ийг ялсны дараа Logan-ий төгсгөл", area: "dukes-archives" },
    ],
    failureMn: ["Худалдаж авах sorcery-гоо Logan алга болохоос өмнө авахгүй бол Wisdom of a Sage-д дутна."],
    rewardsMn: ["Logan-ий sorcery-ууд", "Big Hat Logan-ий хувцас (quest-ын төгсгөлд)"],
    missableMn: "Wisdom of a Sage-д хамаарна.",
  },
  {
    id: "rhea", npc: "Rhea of Thorolund",
    mn: "Thorolund-ийн гэгээнтэн. Miracle худалдагч.",
    stages: [
      { id: "firelink", mn: "Firelink Shrine-д Petrus-тай хамт", area: "firelink-shrine" },
      { id: "buy", mn: "Miracle-уудыг эрт худалдаж ав", area: "firelink-shrine" },
      { id: "tomb", mn: "Tomb of the Giants руу явна", area: "tomb-of-giants" },
      { id: "end", mn: "Quest-ын төгсгөл (Duke's Archives)", area: "dukes-archives" },
    ],
    failureMn: ["Rhea явахаас өмнө miracle-уудыг авахгүй бол Prayer of a Maiden-д дутна."],
    rewardsMn: ["Rhea-ийн miracle-ууд"],
    missableMn: "Prayer of a Maiden.",
  },
  {
    id: "lautrec", npc: "Knight Lautrec of Carim",
    mn: "Undead Parish-ийн шоронд түгжигдсэн баатар.",
    stages: [
      { id: "cell", mn: "Undead Parish-ийн шоронгоос суллах эсэх", area: "undead-parish", decisionMn: "Суллавал тэр хожим Fire Keeper Anastacia-г алдаг." },
      { id: "anastacia", mn: "Anastacia алагдсан бол Lautrec Anor Londo-д довтолно", area: "anor-londo" },
      { id: "dead", mn: "Lautrec-ыг ялж Fire Keeper Soul буцааж авах", area: "anor-londo", flag: { category: "NPC", name: "Lautrec, Dead" } },
    ],
    failureMn: ["Lautrec-ыг суллахгүй байх нь хамгийн аюулгүй."],
    rewardsMn: ["Fire Keeper Soul (Anastacia) — Lautrec-ыг ялахад", "Lautrec-ийн хуяг"],
    deathFlag: "Lautrec, Dead",
  },
  {
    id: "quelana", npc: "Quelana of Izalith",
    mn: "Pyromancy-ийн эх. Blighttown-д.",
    stages: [
      { id: "meet", mn: "Blighttown-ийн намагт уулзах (Pyromancy Flame шаардлагатай)", area: "blighttown" },
      { id: "learn", mn: "Pyromancy-ууд худалдаж авах", area: "blighttown" },
      { id: "release", mn: "Bed of Chaos-ыг ялж Quelana-д мэдэгдэх", area: "lost-izalith" },
    ],
    failureMn: ["Pyromancy Flame-гүй бол Quelana харагдахгүй."],
    rewardsMn: ["Quelana-гийн pyromancy-ууд"],
    missableMn: "Bond of a Pyromancer.",
  },
  {
    id: "dusk", npc: "Dusk of Oolacile",
    mn: "DLC-ийн түлхүүр NPC. Darkroot Basin-ий Golden Crystal Golem-д хоригдсон.",
    stages: [
      { id: "rescue", mn: "Golden Crystal Golem-ийг ялж Dusk-ийг аврах", area: "darkroot-basin", flag: { category: "NPC", name: "Dusk, Rescued From Golem" } },
      { id: "summon", mn: "Тусламжинд 'Yes' гэж хариулах", area: "darkroot-basin", flag: { category: "NPC", name: "Dusk, Available for Summon (Said Yes After Rescue)" } },
      { id: "dlc", mn: "Broken Pendant-тай Oolacile руу орох", area: "oolacile" },
    ],
    failureMn: ["Dusk-ийг алах."],
    rewardsMn: ["Dusk-ийн sorcery-ууд", "Oolacile (DLC) руу орох боломж"],
    deathFlag: "Dusk, Dead",
  },
  {
    id: "oswald", npc: "Oswald of Carim",
    mn: "Undead Parish-ийн хонхны цамхагт. Нүглийг уучлагч.",
    stages: [{ id: "meet", mn: "Хонхны цамхагт уулзах", area: "undead-parish" }],
    failureMn: [],
    rewardsMn: ["Indictment / absolution үйлчилгээ"],
    deathFlag: "Oswald, Dead",
  },
];
