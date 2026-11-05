/**
 * The 41 Dark Souls: Remastered achievements (names as on Steam).
 * Unlock state ALWAYS comes from Steam (or is clearly labelled manual). The
 * `saveHint` field only lets the guide say "your save suggests you can unlock this".
 */
export type AchCategory = "story" | "boss" | "covenant" | "weapon" | "collection" | "ending" | "meta";

export interface AchievementInfo {
  name: string;
  descEn: string;
  mn: string;
  howMn: string;
  category: AchCategory;
  /** Recommended cycle */
  cycle: "NG" | "NG+" | "NG++";
  missableMn?: string;
  area?: string;
  dependsOn?: string[];
  saveHint?:
    | { kind: "covenantFlag"; flag: string }
    | { kind: "maxWeapon"; infusion: string; level: number }
    | { kind: "boss"; bossId: string }
    | { kind: "item"; item: string }
    | { kind: "worldFlag"; category: string; flag: string };
}

const cov = (
  name: string,
  flag: string,
  howMn: string,
  area: string,
  missableMn?: string,
): AchievementInfo => ({
  name: `Covenant: ${name}`,
  descEn: `Discover ${name} covenant.`,
  mn: `${name} covenant-ыг олох`,
  howMn,
  category: "covenant",
  cycle: "NG",
  area,
  missableMn,
  saveHint: { kind: "covenantFlag", flag },
});

const weap = (name: string, infusion: string, level: number, howMn: string): AchievementInfo => ({
  name: `${name} Weapon`,
  descEn: `Acquire best weapon through ${infusion.toLowerCase()} reinforcement.`,
  mn: `${infusion} замаар зэвсгийг дээд түвшинд (+${level}) хүргэх`,
  howMn,
  category: "weapon",
  cycle: "NG",
  saveHint: { kind: "maxWeapon", infusion, level },
});

export const ACHIEVEMENTS: AchievementInfo[] = [
  { name: "The Dark Soul", descEn: "All trophies obtained. Congratulations!", mn: "Бүх achievement-ыг авах", howMn: "Бусад 40 achievement-ыг нээх.", category: "meta", cycle: "NG++" },
  { name: "Enkindle", descEn: "Light bonfire flame.", mn: "Bonfire-ийг Kindle хийх", howMn: "Humanity-тэй (Human хэлбэр) үедээ bonfire дээр Kindle сонго.", category: "story", cycle: "NG", area: "firelink-shrine" },
  { name: "Estus Flask", descEn: "Acquire Estus Flask.", mn: "Estus Flask авах", howMn: "Undead Asylum-д Oscar of Astora-аас.", category: "story", cycle: "NG", area: "undead-asylum" },
  { name: "Reach Lordran", descEn: "Arrive in Lordran.", mn: "Lordran-д хүрэх", howMn: "Asylum Demon-ийг ялж хэрээгээр Firelink Shrine-д ирэх.", category: "story", cycle: "NG", area: "firelink-shrine", saveHint: { kind: "boss", bossId: "asylum-demon" } },
  { name: "Ring the Bell (Undead Church)", descEn: "Ring Bell of Awakening at Undead Church.", mn: "Undead Church-ийн хонхыг дуугаргах", howMn: "Bell Gargoyles-ыг ялаад цамхагт гарч хонхыг дуугарга.", category: "story", cycle: "NG", area: "undead-parish", saveHint: { kind: "worldFlag", category: "Bells of Awakening", flag: "Undead Parish" } },
  { name: "Ring the Bell (Quelaag's Domain)", descEn: "Ring Bell of Awakening in Quelaag's domain.", mn: "Quelaag-ийн нутаг дахь хонхыг дуугаргах", howMn: "Quelaag-ийг ялаад дээш гарч хонхыг дуугарга.", category: "story", cycle: "NG", area: "quelaags-domain", saveHint: { kind: "worldFlag", category: "Bells of Awakening", flag: "Blighttown" } },
  { name: "Reach Anor Londo", descEn: "Arrive in Anor Londo.", mn: "Anor Londo-д хүрэх", howMn: "Iron Golem-ийг ялсны дараа Batwing Demon-ууд авч явна.", category: "story", cycle: "NG", area: "anor-londo", saveHint: { kind: "boss", bossId: "iron-golem" } },
  { name: "Lordvessel", descEn: "Acquire the Lordvessel.", mn: "Lordvessel авах", howMn: "Ornstein & Smough-ыг ялаад Gwynevere-тэй ярих.", category: "story", cycle: "NG", area: "anor-londo", saveHint: { kind: "item", item: "Lordvessel" } },
  { name: "Rite of Kindling", descEn: "Acquire the Rite of Kindling.", mn: "Rite of Kindling авах", howMn: "Catacombs-ийн Pinwheel-ийг ялах.", category: "story", cycle: "NG", area: "catacombs", saveHint: { kind: "item", item: "Rite of Kindling" } },
  { name: "Art of Abysswalking", descEn: "Acquire the Art of Abysswalking.", mn: "Abysswalking-ийн урлагийг эзэмших", howMn: "Great Grey Wolf Sif-ийг ялж Covenant of Artorias авах.", category: "story", cycle: "NG", area: "darkroot-garden", saveHint: { kind: "item", item: "Covenant of Artorias" } },
  { name: "Defeat Gravelord Nito", descEn: "Defeat the Soul Lord Gravelord Nito.", mn: "Gravelord Nito-г ялах", howMn: "Tomb of the Giants-ийн төгсгөлд.", category: "boss", cycle: "NG", area: "tomb-of-giants", saveHint: { kind: "boss", bossId: "nito" } },
  { name: "Defeat Bed of Chaos", descEn: "Defeat the Soul Lord Bed of Chaos.", mn: "Bed of Chaos-ыг ялах", howMn: "Lost Izalith-д.", category: "boss", cycle: "NG", area: "lost-izalith", saveHint: { kind: "boss", bossId: "bed-of-chaos" } },
  { name: "Defeat Seath the Scaleless", descEn: "Defeat Seath the Scaleless, inheritor of souls.", mn: "Seath the Scaleless-ийг ялах", howMn: "Crystal Cave-д Primordial Crystal-ийг эвдээд.", category: "boss", cycle: "NG", area: "crystal-cave", saveHint: { kind: "boss", bossId: "seath" } },
  { name: "Defeat the Four Kings", descEn: "Defeat the Four Kings, inheritors of souls.", mn: "Four Kings-ийг ялах", howMn: "The Abyss-д (Covenant of Artorias шаардлагатай).", category: "boss", cycle: "NG", area: "the-abyss", saveHint: { kind: "boss", bossId: "four-kings" } },
  { name: "Defeat the Dark Sun Gwyndolin", descEn: "Defeat Dark Sun Gwyndolin, the Darkmoon God.", mn: "Dark Sun Gwyndolin-ийг ялах", howMn: "Anor Londo-ийн Darkmoon Tomb-д.", category: "boss", cycle: "NG", area: "anor-londo", missableMn: "Blade of the Darkmoon covenant-д эхэлж элсэхийг зөвлөнө.", saveHint: { kind: "boss", bossId: "gwyndolin" } },
  { name: "Defeat Crossbreed Priscilla", descEn: "Defeat Crossbreed Priscilla, the Lifehunter.", mn: "Crossbreed Priscilla-г ялах", howMn: "Painted World of Ariamis-д (Peculiar Doll).", category: "boss", cycle: "NG", area: "painted-world", missableMn: "Peculiar Doll-ыг Undead Asylum-д буцаж очиж авахгүй бол Painted World-д орж чадахгүй.", saveHint: { kind: "boss", bossId: "priscilla" } },
  { name: "To Link the Fire", descEn: "Reach 'To Link the Fire' ending.", mn: "'To Link the Fire' төгсгөл", howMn: "Gwyn-ийг ялаад голын bonfire-ийг асаах.", category: "ending", cycle: "NG", area: "firelink-altar" },
  { name: "Dark Lord", descEn: "Reach 'The Dark Lord' ending.", mn: "'The Dark Lord' төгсгөл", howMn: "Gwyn-ийг ялаад bonfire-д хүрэлгүй өрөөнөөс гарах.", category: "ending", cycle: "NG+", area: "firelink-altar" },
  cov("Way of White", "Way of White", "Firelink Shrine-д Petrus of Thorolund-тай ярьж элсэх.", "firelink-shrine"),
  cov("Princess's Guard", "Princess Guard", "Lordvessel-ийг авсны дараа Gwynevere-тэй дахин ярих.", "anor-londo", "Gwynevere-ийг алвал элсэх боломжгүй."),
  cov("Warrior of Sunlight", "Warrior of Sunlight", "Undead Burg-ийн Hellkite гүүрний доорх Sunlight Altar-т 25 Faith-тэй эсвэл Solaire-ийн тэмдэгтэй залбирах.", "undead-burg"),
  cov("Forest Hunter", "Forest Hunter", "Darkroot Garden-д Alvina-тай ярьж хоёр асуултанд 'Yes' гэх.", "darkroot-garden"),
  cov("Blade of the Darkmoon", "Darkmoon Blade", "Darkmoon Seance Ring-тэй Anor Londo-ийн Darkmoon Tomb-ийн fog gate-д сөхрөх.", "anor-londo", "Gwyndolin-ийг эхлэж алвал элсэх боломжгүй."),
  cov("Chaos Servant", "Chaos Servant", "Quelaag-ийн дараа хоёр дахь хонхны дор Quelaag's Sister-тэй ярьж элсэх.", "quelaags-domain"),
  cov("Gravelord Servant", "Gravelord Servant", "Catacombs-ийн авсанд хэвтэж Nito-гийн өмнө залбирах.", "tomb-of-giants"),
  cov("Path of the Dragon", "Path of the Dragon", "Ash Lake-ийн Everlasting Dragon-д залбирах.", "ash-lake"),
  cov("Darkwraith", "Darkwraith", "Lordvessel-ийг Frampt-д өгөхөөс өмнө Four Kings-ийг алж Kaathe-тэй ярих.", "the-abyss", "Lordvessel-ийг Frampt-д өгвөл тухайн NG-д энэ covenant-д элсэх боломжгүй."),
  weap("Strongest", "Normal", 15, "Энгийн зэвсгийг +15 хүртэл: Titanite Shard → Large → Chunk → Slab. Andre-д Large Ember, Very Large Ember."),
  weap("Crystal", "Crystal", 5, "Normal +10 → Giant Blacksmith-аар Crystal; Titanite Chunk + Slab."),
  weap("Lightning", "Lightning", 5, "Normal +10 → Giant Blacksmith-аар Lightning; Titanite Chunk + Slab."),
  weap("Raw", "Raw", 5, "Normal +5 → Andre (Large Ember); Large Titanite Shard."),
  weap("Magic", "Magic", 10, "Normal +5 → Rickert of Vinheim; Green Titanite Shard, Large Magic Ember, Blue Titanite."),
  weap("Enchanted", "Enchanted", 5, "Magic +5 → Rickert (Enchanted Ember); Blue Titanite Chunk + Slab."),
  weap("Divine", "Divine", 10, "Normal +5 → Andre (Divine Ember); Green Titanite Shard, Large Divine Ember, White Titanite."),
  weap("Occult", "Occult", 5, "Divine +5 → Andre (Dark Ember); White Titanite Chunk + Slab."),
  weap("Fire", "Fire", 10, "Normal +5 → Vamos; Green Titanite Shard, Large Flame Ember, Red Titanite."),
  weap("Chaos", "Chaos", 5, "Fire +5 → Vamos (Chaos Flame Ember); Red Titanite Chunk + Slab."),
  { name: "Knight's Honor", descEn: "Acquire all rare weapons.", mn: "Бүх ховор зэвсгийг цуглуулах", howMn: "Boss soul зэвсэг, сүүл тасдах зэвсэг (Drake Sword, Gargoyle Tail Axe, Dragon King Greataxe, Moonlight Greatsword, Priscilla's Dagger, Dragon Greatsword), Black/Silver/Stone Knight-ын ховор drop-ууд. Хамгийн багадаа 3 тойрог (NG/NG+/NG++) шаардлагатай.", category: "collection", cycle: "NG++", missableMn: "Сүүл тасдах зэвсгүүдийг boss-ыг алахаас өмнө ав." },
  { name: "Wisdom of a Sage", descEn: "Acquire all sorceries.", mn: "Бүх sorcery-г цуглуулах", howMn: "Griggs, Logan, Dusk зэрэг багшаас худалдаж ав; Logan-ий quest-ыг дуусга.", category: "collection", cycle: "NG+", missableMn: "Big Hat Logan-ий quest-ыг Duke's Archives-д хүртэл дагах." },
  { name: "Bond of a Pyromancer", descEn: "Acquire all pyromancies.", mn: "Бүх pyromancy-г цуглуулах", howMn: "Laurentius, Quelana, Eingyi; Chaos Servant covenant; Blighttown, Painted World, Lost Izalith дахь pyromancy-ууд.", category: "collection", cycle: "NG+", missableMn: "Laurentius-ыг Depths-ээс аврах; Quelana-д хүрэх." },
  { name: "Prayer of a Maiden", descEn: "Acquire all miracles.", mn: "Бүх miracle-ийг цуглуулах", howMn: "Petrus, Rhea-ийн quest; covenant miracle-ууд (Warrior of Sunlight, Darkmoon, Gravelord); Duke's Archives-ийн Piasca нар.", category: "collection", cycle: "NG+", missableMn: "Rhea-ийн miracle-уудыг эрт худалдаж ав — quest-ын явцад тэр алга болно." },
];

export const achievementByName = (n: string) => ACHIEVEMENTS.find((a) => a.name.toLowerCase() === n.toLowerCase());
