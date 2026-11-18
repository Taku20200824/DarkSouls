/**
 * Steam icons for the 41 achievements (hashes from Steam's public achievement list for app 570940).
 * Shown even before a Steam sync, for private profiles and in demo mode; a synced icon from
 * GetSchemaForGame still takes priority.
 */
const BASE = "https://cdn.fastly.steamstatic.com/steamcommunity/public/images/apps/570940/";

// name -> [unlocked icon, locked (grey) icon]
const ICONS: Record<string, [string, string]> = {
  "The Dark Soul": ["22067071ea9eeb92edb952b2d65abce16e973fc7", "0001fa9e92975a990f649d3c69d239dfca79dd12"],
  "To Link the Fire": ["fde13ddfbeb188d4e83ca5e581deb69dea09c615", "52bcaf712d1290af73067720174a859ab26a3dbe"],
  "Dark Lord": ["638c52abf0711ffcabc273473dd247b071cd3734", "7d07081488721d92cd2d0d595e7fe8c1aab1ad5c"],
  "Knight's Honor": ["62149815daa726018b21bcabdf215c593f0b3d7b", "1c420ec3dd224614e6503917c95cfa43d12f42e8"],
  "Wisdom of a Sage": ["cecb76c38356f44712e304ef2463e55e7a0dcf1e", "0badfa332f94a3ff28b8dd3c56dc45f282fa33d7"],
  "Bond of a Pyromancer": ["3ba9afc8fbfeaaafcd19cbb09f30a63d164e5412", "8cea46117affe09d4ebfcfd817e69cc51ed72b1f"],
  "Prayer of a Maiden": ["2ab79f60b52940c674b2c18782c67a7ccdd623e0", "7e98b42586ede68193a3262406198a58a95a4e6d"],
  "Covenant: Way of White": ["c028fb1af748399ebf2888267634e22d87e8632e", "fffdc57e4742efa8090fa63a0a6fc2c11ecce196"],
  "Covenant: Princess's Guard": ["c250e7b039ead972bec8ff3bbbc5f4dd13292e2a", "e365a1b28d79ed66f742bd18c8f03afc61416677"],
  "Covenant: Blade of the Darkmoon": ["8ff13be8b0113347950fdcad91ff764db8f6e02f", "6a8073f618b86ee004cdbeb7eabdca9f8b3c8b5f"],
  "Covenant: Warrior of Sunlight": ["6545dcbc911d088d786d18aff107ccd7217be624", "19673b8685edca5f7bd06b0efff467be2b03ae89"],
  "Covenant: Forest Hunter": ["92c7234cdb115df2d31d2a1c9f55ce384daf18eb", "9e176663602c689ef189f0df9801546be3961e60"],
  "Covenant: Darkwraith": ["a8b2238447bc674489e35deef185d8f36cc9e0ea", "23225ce547cdbf6f0e3e555a7bd2bc275ddb52b6"],
  "Covenant: Path of the Dragon": ["27ab0882f3da601233df240cfa292ccbb00e7b7f", "1527dfe4d351b6f19fe37749d3d6822a735f566f"],
  "Covenant: Gravelord Servant": ["8bd769ff7d147a5415fb903500412cfaaa666406", "33414fae276cf37ec3bf0f41b90d37260c9fdee9"],
  "Covenant: Chaos Servant": ["62829ea5acc97389e120a047e2cd41cbb648bb62", "5c1bb78cab99069167cdf4058b3a7a75c5291764"],
  "Strongest Weapon": ["9fea90493f48b2c309c3b707634ae0d0472fac45", "2f70397de5d7cc653e6c16f7d0de9f85e813cb7d"],
  "Crystal Weapon": ["fd8577284dd8db6457e4389cbf398550f1b894ee", "72dfccfac2a9081cdb186da605d26606e7a92c3a"],
  "Lightning Weapon": ["f3307f28bbdd5de359119afd1d1e8daa1625ad8d", "abadd232303d4fb1e5b4c800a273cb06428c7e1a"],
  "Raw Weapon": ["0d2fb85a570ccea020f769ce273717810e78d22c", "fddcab2eb6a4b1d1454d0fecfcb94a7388fe00d8"],
  "Magic Weapon": ["7270d351362be2d3156ee4f51025a4ecfa3dbe6d", "c54f4ae9370552dcc401efb3408d3e45175b2e59"],
  "Enchanted Weapon": ["03437e8700ccc93666feac747ef2fd0396ec4974", "6e635c5bdd2ee21bd19b74e9b91752dbbc8ee403"],
  "Divine Weapon": ["ecd78100b0f9846f7e1e38294f45b499d7654ee8", "155ba625c0d8f20545600d490564365ef5cdd2da"],
  "Occult Weapon": ["76ef0fa0c688d7cd1ac9ad8c7916a7ef09c2c133", "3ec3c66dea5ee8340620f72e2ed3f2648cc3d2df"],
  "Fire Weapon": ["62e51ec42b7459b1e1714ce60544053d6929f7d3", "79b8bf599c2adcd19ff1649dad686a4f1450b1c6"],
  "Chaos Weapon": ["b349c35d8e7b3322462bdd58a2f0b283a8757ea2", "f151c31b838fddca6d383f90c2e4feddd91f1785"],
  "Enkindle": ["b3e4ca8626661bf2a67b7c207dae62088927bba7", "948162c096874474c24ccf5f94e9fbc53754d965"],
  "Estus Flask": ["1cef9627ae9f7f676d22343778b9b5f52d77c304", "fd3cf75ee705a9f191bb626574e1b4d545441b39"],
  "Reach Lordran": ["2b1c1ecce6ddae50a8cef8a67bcf4c48e9a569a7", "1ce586acdcbeedce2a32e06ae966e38f6b0bf2af"],
  "Ring the Bell (Undead Church)": ["37d5a26e0ad900c659043a42f5b77e22acf1b7d4", "df0e2659abc816a8bf04f8df476c2ba3f0523189"],
  "Ring the Bell (Quelaag's Domain)": ["0bb6cff7312385f7b6347d4ac6f53ed4f0e7b266", "c4915d20c1df43a935761f10f988c03fe1561c1f"],
  "Rite of Kindling": ["089ee0bcbd7bf03b8b50cadc8bf3095f6c91a8eb", "28405d1d7fa6c08ccc9dc618a9f232d1f4386be0"],
  "Art of Abysswalking": ["811c9bb87cfb9b09d1a79754eecf28c60a001518", "b6f251e02521a02f160a4a12fe028e5119622430"],
  "Reach Anor Londo": ["49b3945daf48154bc6fc20765b23e3878e03b4b2", "bec02a760209f2ade81b7eaa4f3986abf8235e17"],
  "Lordvessel": ["de46ce7c230d63c6d7d87fbe7d98bb74a484ec30", "d0c652aa02d328df339b7776f788548aa4663ebc"],
  "Defeat Gravelord Nito": ["db896134ce1490a92163bd2caf0b16a611bb5a7e", "36b7b34331bc0e37c8c485aaa2e12e5deeca2edc"],
  "Defeat Bed of Chaos": ["99aeca599ae2cad0a8addd7a74103aae416fdafc", "608e53cf37c545cbfe952a4058017211c7611397"],
  "Defeat the Four Kings": ["9c074695d6c018dcb580cc1262c8a280714567f1", "31f65d06a914df1a43194ca7f72bf627846ff66b"],
  "Defeat Seath the Scaleless": ["be9fb791e12d9e2965153de127dea448235c76c0", "5bf82e6d5e8147c9711fc33d4e7c542a2e1e97a7"],
  "Defeat the Dark Sun Gwyndolin": ["1fac2ad00cca3f9bdf1bd38abc37ca8464b01472", "d8143b4fcc6349b04eae99c4a870ae1a8681e475"],
  "Defeat Crossbreed Priscilla": ["66ec494c0bd72ac4e3290efa1509ac78be00ee98", "8e668da7ee46372245a48d56e9c2bc08030a4d7a"],
};

export function achievementIcon(name: string, unlocked: boolean): string | null {
  const i = ICONS[name];
  return i ? `${BASE}${unlocked ? i[0] : i[1]}.jpg` : null;
}
