/**
 * Boss encyclopedia. Official English names, Mongolian guidance.
 * `evidence` lists the canonical names the save parser uses (flags / boss souls).
 * `achievementEvidence` lists Steam achievements that can only be unlocked after the
 * boss is dead (used as inferred evidence). Weaknesses are only given where they are
 * well established; otherwise the field is omitted rather than guessed.
 */
export interface Boss {
  id: string;
  name: string;
  area: string; // area id
  optional: boolean;
  dlc?: boolean;
  evidence: string[];
  achievementEvidence?: string[];
  worldFlagEvidence?: string[]; // known_flags names
  /** Items that can only be obtained after the boss is dead (inferred evidence). */
  itemEvidence?: string[];
  soul?: string;
  soulWeapons?: string[];
  tailCut?: string;
  weakMn?: string;
  resistMn?: string;
  attacksMn: string[];
  strategyMn: string;
  weaponsMn?: string;
  summonMn?: string;
  ngMn?: string;
  achievement?: string;
  /** Monogram used in place of copyrighted artwork. */
  sigil: string;
}

export const BOSSES: Boss[] = [
  {
    id: "asylum-demon", name: "Asylum Demon", area: "undead-asylum", optional: false, sigil: "AD",
    evidence: ["Asylum Demon"], achievementEvidence: ["Reach Lordran"],
    attacksMn: ["Том алхаар доош цохих", "Үсэрч буух цохилт"],
    strategyMn: "Эхний удаа зугтаж Estus авсны дараа дээд тагтнаас үсэрч plunging attack хийнэ — нэг цохилтоор их хувийг авна. Дараа нь хойноос нь эргэлдэж цохи.",
    summonMn: "Байхгүй.",
  },
  {
    id: "taurus-demon", name: "Taurus Demon", area: "undead-burg", optional: false, sigil: "TD",
    evidence: ["Taurus Demon"],
    attacksMn: ["Сүхээр хажуу тийш шүүрдэх", "Үсэрч дарах"],
    strategyMn: "Гүүрний ард байгаа цамхагийн шатаар гарч, дээрээс plunging attack хий. Нарийн гүүрэн дээр хөлийн хооронд нь эргэлд.",
    summonMn: "Solaire-ийн тэмдэг гүүрний ойролцоо (Human үед).",
  },
  {
    id: "bell-gargoyles", name: "Bell Gargoyles", area: "undead-parish", optional: false, sigil: "BG",
    evidence: ["Bell Gargoyles"], achievementEvidence: ["Ring the Bell (Undead Church)"], worldFlagEvidence: ["Undead Parish"],
    tailCut: "Gargoyle Tail Axe",
    attacksMn: ["Сүхэн жадаар хатгах", "Галт амьсгал (2 дахь gargoyle)"],
    strategyMn: "Эхнийх нь ~50% HP-д хүрэхэд хоёр дахь нь ирнэ. Эхнийхийг хурдан ал. Сүүлийг нь тасдвал Gargoyle Tail Axe унана.",
    summonMn: "Solaire (Undead Parish-ийн шатны дор).",
  },
  {
    id: "capra-demon", name: "Capra Demon", area: "lower-undead-burg", optional: false, sigil: "CD",
    evidence: ["Capra Demon"],
    attacksMn: ["Хоёр мачетэ", "Хоёр нохой"],
    strategyMn: "Орсон даруйд баруун талын шатаар гар, нохдыг эхэлж ал. Дараа нь шатны орой дээрээс Capra-г тулалд.",
    itemEvidence: ["Key to Depths"],
  },
  {
    id: "gaping-dragon", name: "Gaping Dragon", area: "depths", optional: false, sigil: "GD",
    evidence: ["Gaping Dragon"], tailCut: "Dragon King Greataxe",
    attacksMn: ["Урагш давхих", "Хүчил бөөлжих", "Үсэрч дарах"],
    strategyMn: "Хажуу тал болон сүүл рүү нь байрла. Ялсны дараа Blighttown Key унана.",
    itemEvidence: ["Blighttown Key"],
  },
  {
    id: "moonlight-butterfly", name: "Moonlight Butterfly", area: "darkroot-garden", optional: true, sigil: "MB",
    evidence: ["Moonlight Butterfly"], soul: "Soul of the Moonlight Butterfly",
    attacksMn: ["Soul Arrow мэт ид шид", "Гүүрэн дээр буух"],
    strategyMn: "Гүүрэн дээр буух үед нь ойртож цохи, эсвэл сум/ид шидээр алс зайнаас довтол.",
    summonMn: "Witch Beatrice (Human үед, гүүрний өмнө).",
  },
  {
    id: "sif", name: "Great Grey Wolf Sif", area: "darkroot-garden", optional: false, sigil: "GS",
    evidence: ["Great Grey Wolf Sif"], soul: "Soul of Sif", achievementEvidence: ["Art of Abysswalking"], itemEvidence: ["Covenant of Artorias"],
    soulWeapons: ["Greatsword of Artorias", "Greatshield of Artorias"],
    attacksMn: ["Том сэлмээр шүүрдэх", "Буцаж үсрэх", "Эргэлдэх цохилт"],
    strategyMn: "Урд хөлийнх нь доор зүүн тал руу байрлаж цохи. Ялахад Covenant of Artorias авна (Four Kings-д заавал).",
    summonMn: "Shiva of the East (Forest Hunter-тай холбоотой нөхцөлтэй).",
    ngMn: "Knight's Honor-д Soul of Sif-ийг олон удаа хэрэгтэй байж болох тул NG+ төлөвлөгөөнд оруул.",
  },
  {
    id: "quelaag", name: "Chaos Witch Quelaag", area: "quelaags-domain", optional: false, sigil: "CQ",
    evidence: ["Chaos Witch Quelaag"], soul: "Soul of Quelaag", achievementEvidence: ["Ring the Bell (Quelaag's Domain)"], worldFlagEvidence: ["Blighttown"],
    soulWeapons: ["Quelaag's Furysword"],
    resistMn: "Fire-д өндөр тэсвэртэй — галт зэвсэг/pyromancy үр дүн муутай.",
    attacksMn: ["Лаав нулимах", "Сэлмээр шүүрдэх", "Галт дэлбэрэлт (AoE)"],
    strategyMn: "Хүний биеийн хэсэг рүү нь бус, аалзны хөл рүү зүүн талаас цохи. Лаав газар дээр үлддэг тул байрлалаа солиорой.",
    summonMn: "Maneater Mildred (Human үед).",
  },
  {
    id: "stray-demon", name: "Stray Demon", area: "undead-asylum", optional: true, sigil: "SD",
    evidence: ["Stray Demon"],
    attacksMn: ["Алхаар цохих", "Ид шидийн дэлбэрэлт"],
    strategyMn: "Asylum-д буцаж ирээд Asylum Demon-ий өрөөний шал нурж унана. Хөлийнх нь ард байрла.",
  },
  {
    id: "iron-golem", name: "Iron Golem", area: "sens-fortress", optional: false, sigil: "IG",
    evidence: ["Iron Golem"], soul: "Core of an Iron Golem", achievementEvidence: ["Reach Anor Londo"],
    soulWeapons: ["Golem Axe"],
    weakMn: "Lightning-д сул.",
    attacksMn: ["Цохиж гаргах", "Барьж шидэх"],
    strategyMn: "Хөлийнх нь шагай руу байнга цохивол тэнцвэрээ алдаж унана; ирмэгээс түлхэж унагааж болно.",
    summonMn: "Black Iron Tarkus (Human үед, хаалганы өмнө).",
  },
  {
    id: "ornstein-smough", name: "Ornstein & Smough", area: "anor-londo", optional: false, sigil: "OS",
    evidence: ["Dragon Slayer Ornstein", "Executioner Smough"], achievementEvidence: ["Lordvessel"], worldFlagEvidence: ["Receive Lordvessel (Gwynevere Alive or Dead)"], itemEvidence: ["Lordvessel"],
    soul: "Soul of Ornstein / Soul of Smough", soulWeapons: ["Dragonslayer Spear (Ornstein)", "Smough's Hammer (Smough)"],
    resistMn: "Ornstein lightning-д тэсвэртэй.",
    attacksMn: ["Ornstein: хурдан жад, цахилгаан", "Smough: том алх, бие биеэ хамгаалах"],
    strategyMn: "Баганыг ашиглан нэг нэгээр нь тусгаарла. Хамгийн түрүүнд алсан нь нөгөөдөө хүчээ өгч super хэлбэрт оруулна — алах дарааллыг сонгож soul-оо шийд.",
    summonMn: "Solaire (Human үед, Giant Blacksmith-ын ойролцоо).",
  },
  {
    id: "gwyndolin", name: "Dark Sun Gwyndolin", area: "anor-londo", optional: true, sigil: "DG",
    evidence: ["Dark Sun Gwyndolin"], soul: "Soul of Gwyndolin", achievement: "Defeat the Dark Sun Gwyndolin",
    achievementEvidence: ["Defeat the Dark Sun Gwyndolin"],
    attacksMn: ["Сум мэт ид шид", "Teleport хийх"],
    strategyMn: "Урт коридорт баганын ард нуугдаж ойртоно. Бага HP-тэй тул ойртвол хурдан унана.",
    ngMn: "Gwyndolin-ийг алахад Darkmoon covenant-ын хандлага өөрчлөгдөнө — Blade of the Darkmoon-д эхэлж элс.",
  },
  {
    id: "priscilla", name: "Crossbreed Priscilla", area: "painted-world", optional: true, sigil: "CP",
    evidence: ["Crossbreed Priscilla"], soul: "Soul of Priscilla", achievement: "Defeat Crossbreed Priscilla",
    achievementEvidence: ["Defeat Crossbreed Priscilla"], tailCut: "Priscilla's Dagger", soulWeapons: ["Lifehunt Scythe"],
    attacksMn: ["Хусуураар шүүрдэх", "Үл үзэгдэх болох"],
    strategyMn: "Тулалдахгүйгээр гарах боломжтой. Үл үзэгдэх үед цасан дахь мөрийг нь хар. Сүүл тасдахад Priscilla's Dagger.",
  },
  {
    id: "pinwheel", name: "Pinwheel", area: "catacombs", optional: false, sigil: "PW",
    evidence: ["Pinwheel"], achievementEvidence: ["Rite of Kindling"], itemEvidence: ["Rite of Kindling"],
    attacksMn: ["Clone үүсгэх", "Галт бөмбөг"],
    strategyMn: "Хамгийн хялбар boss-уудын нэг. Түрэмгий ойртож цохи. Rite of Kindling унана.",
  },
  {
    id: "nito", name: "Gravelord Nito", area: "tomb-of-giants", optional: false, sigil: "GN",
    evidence: ["Gravelord Nito"], soul: "Lord Soul (Nito)", achievement: "Defeat Gravelord Nito", achievementEvidence: ["Defeat Gravelord Nito"],
    attacksMn: ["Том сэлмээр шүүрдэх", "Миазма (toxic AoE)"],
    strategyMn: "Араг яснуудыг Divine зэвсгээр устга эсвэл тойрон гар. Nito-г тусад нь татаж тулалд.",
    weaponsMn: "Divine зэвсэг араг ясыг бүрмөсөн устгана.",
  },
  {
    id: "seath", name: "Seath the Scaleless", area: "crystal-cave", optional: false, sigil: "SS",
    evidence: ["Seath the Scaleless"], soul: "Bequeathed Lord Soul Shard (Seath)", achievement: "Defeat Seath the Scaleless",
    achievementEvidence: ["Defeat Seath the Scaleless"], tailCut: "Moonlight Greatsword",
    attacksMn: ["Crystal breath (Curse)", "Сүүлээр шүүрдэх"],
    strategyMn: "Эхний уулзалт (Archives) скриптээр үхнэ — энэ хэвийн. Crystal Cave-д эхлээд Primordial Crystal-ийг эвд, дараа нь сүүлийг тасдаад Moonlight Greatsword ав. Curse-ийн эсрэг Purging Stone авч яв.",
  },
  {
    id: "four-kings", name: "The Four Kings", area: "the-abyss", optional: false, sigil: "FK",
    evidence: ["The Four Kings"], soul: "Bequeathed Lord Soul Shard (Four Kings)", achievement: "Defeat the Four Kings",
    achievementEvidence: ["Defeat the Four Kings"],
    attacksMn: ["Сэлмээр цохих", "Ид шидийн дэлбэрэлт", "Барьж амь сорох"],
    strategyMn: "Covenant of Artorias бөгж заавал. DPS уралдаан — Нэг хаан ~1 минут тутамд нэмэгдэнэ. Хүчтэй зэвсэг, бамбай.",
    ngMn: "Darkwraith covenant хүсвэл Four Kings-ийг Lordvessel-ийг Frampt-д өгөхөөс ӨМНӨ ал.",
  },
  {
    id: "ceaseless-discharge", name: "Ceaseless Discharge", area: "demon-ruins", optional: true, sigil: "CE",
    evidence: ["Ceaseless Discharge"],
    attacksMn: ["Лаавтай гараар цохих", "Лаав цацах"],
    strategyMn: "Fog gate-ийн ойролцоо хүлээж, түүнийг ирмэг рүү татвал унаж үхэх боломжтой.",
  },
  {
    id: "demon-firesage", name: "Demon Firesage", area: "demon-ruins", optional: false, sigil: "DF",
    evidence: ["Demon Firesage"],
    attacksMn: ["Галт дэлбэрэлт", "Алхаар цохих"],
    strategyMn: "Asylum Demon-тэй адил хөдөлгөөн. Хөлийнх нь ард эргэлд.",
  },
  {
    id: "centipede-demon", name: "Centipede Demon", area: "demon-ruins", optional: false, sigil: "CN",
    evidence: ["Centipede Demon"], itemEvidence: ["Orange Charred Ring"],
    attacksMn: ["Галт гар", "Лаав"],
    strategyMn: "Гарыг нь тасдах. Ялахад Orange Charred Ring — Lost Izalith-ийн лаавд заавал.",
  },
  {
    id: "bed-of-chaos", name: "Bed of Chaos", area: "lost-izalith", optional: false, sigil: "BC",
    evidence: ["Bed of Chaos"], soul: "Lord Soul (Bed of Chaos)", achievement: "Defeat Bed of Chaos", achievementEvidence: ["Defeat Bed of Chaos"],
    attacksMn: ["Мөчир шүүрдэх", "Галт багана", "Шал нурах"],
    strategyMn: "Хоёр талын үндсийг (бөмбөлөг) устгасны дараа голын модоор гүйж зүрхийг цохи.",
  },
  {
    id: "gwyn", name: "Gwyn, Lord of Cinder", area: "kiln-of-the-first-flame", optional: false, sigil: "GW",
    evidence: ["Gwyn, Lord of Cinder"], soul: "Soul of Gwyn, Lord of Cinder", achievementEvidence: ["To Link the Fire", "Dark Lord"],
    attacksMn: ["Галт сэлэм — хурдан комбо", "Барьж шатаах"],
    strategyMn: "Parry боломжтой — бамбай/сэлмээр parry → riposte. Ялсны дараа галыг асаах (To Link the Fire) эсвэл орхих (Dark Lord).",
    ngMn: "Хоёр төгсгөлийн achievement-д хамгийн багадаа 2 удаа (NG, NG+) ялна.",
  },
  {
    id: "sanctuary-guardian", name: "Sanctuary Guardian", area: "oolacile", optional: false, dlc: true, sigil: "SG",
    evidence: ["Sanctuary Guardian"], soul: "Guardian Soul", tailCut: "Guardian Tail",
    attacksMn: ["Цахилгаан амьсгал", "Сүүлээр цохих", "Нисэх дайралт"],
    strategyMn: "DLC-ийн анхны boss. Толгой талаас нь бус хажуугаас цохи. Сүүлийг тасдаж Guardian Tail ав.",
  },
  {
    id: "artorias", name: "Knight Artorias", area: "royal-wood", optional: false, dlc: true, sigil: "KA",
    evidence: ["Knight Artorias"], soul: "Soul of Artorias", soulWeapons: ["Abyss Greatsword", "Greatshield of Artorias"],
    attacksMn: ["Урт комбо", "Abyss эрч хүчээ цуглуулах (buff)"],
    strategyMn: "Buff цуглуулах үед нь тасалдуул. Комбоны дараах цонхонд цохи. Ялсны дараа Hawkeye Gough-тай ярь.",
  },
  {
    id: "kalameet", name: "Black Dragon Kalameet", area: "royal-wood", optional: true, dlc: true, sigil: "BK",
    evidence: ["Black Dragon Kalameet"], tailCut: "Obsidian Greatsword",
    attacksMn: ["Галт амьсгал", "Curse харц (Mark)"],
    strategyMn: "Artorias-ийн дараа Hawkeye Gough-тай ярьвал Kalameet-ийг газарт унагаана. Хөлийнх нь ард байрла.",
  },
  {
    id: "manus", name: "Manus, Father of the Abyss", area: "chasm-of-the-abyss", optional: false, dlc: true, sigil: "MF",
    evidence: ["Manus, Father of the Abyss"], soul: "Soul of Manus", soulWeapons: ["Manus Catalyst"],
    attacksMn: ["Урт комбо", "Dark Bead (харанхуй ид шид)"],
    strategyMn: "Silver Pendant-ийг Dark Bead-ийн үед ашиглаж ид шидийг няцаа. Комбоны хооронд цохи.",
  },
];

export const bossById = (id: string) => BOSSES.find((b) => b.id === id);
