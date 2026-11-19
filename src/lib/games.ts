/**
 * The FromSoftware "Souls" games on Steam that the tracker knows about. Shared by the
 * server (Steam ownership / achievements) and the UI (the game picker bar).
 *
 * tracker "full": the save is read and parsed (bosses, map, guide …) — Dark Souls:
 * Remastered, whose save the DS1 parser understands. Steam editions/bundles (The Fire Fades,
 * Shadow of the Erdtree) share the base game's appid, which is what ownership is checked on.
 * "steam": ownership, playtime and Steam achievements only (no save parser for that game yet).
 */
export interface GameInfo {
  id: string;
  appid: number;
  title: string;
  short: string;
  year: number;
  tracker: "full" | "steam";
  /** One line on why to play it next (shown on the login picker). */
  tagline: string;
}

export const GAMES: readonly GameInfo[] = [
  { id: "dsr", appid: 570940, title: "DARK SOULS: REMASTERED", short: "DS Remastered", year: 2018, tracker: "full", tagline: "Одоо тоглож байгаагаа дуусга" },
  { id: "ds2sotfs", appid: 335300, title: "DARK SOULS II: Scholar of the First Sin", short: "DS II SotFS", year: 2015, tracker: "steam", tagline: "Дараагийн ангид ор" },
  { id: "ds3", appid: 374320, title: "DARK SOULS III: The Fire Fades Edition", short: "DS III", year: 2016, tracker: "steam", tagline: "Цувралын төгсгөлийг үз" },
  { id: "eldenring", appid: 1245620, title: "ELDEN RING + Shadow of the Erdtree", short: "ELDEN RING", year: 2022, tracker: "steam", tagline: "Илүү том open-world туршлага" },
];

export const DEFAULT_GAME = "dsr";
export const GAME_APPIDS = GAMES.map((g) => g.appid);
export const gameById = (id: string | null | undefined) => GAMES.find((g) => g.id === id) ?? null;
export const gameByAppid = (appid: number) => GAMES.find((g) => g.appid === appid) ?? null;
/** Where picking a game takes you: the DS1 tracker, or that game's Steam page. */
export const gameHome = (g: GameInfo) => (g.tracker === "full" ? "/dashboard" : `/games/${g.id}`);
