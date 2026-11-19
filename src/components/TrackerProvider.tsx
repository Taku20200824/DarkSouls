"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ClientState } from "@/lib/client/types";
import { demoState } from "@/lib/client/demo";
import type { TrackerContext } from "@/lib/guide/engine";
import { useRouter } from "next/navigation";
import { DEFAULT_GAME, gameById, gameHome } from "@/lib/games";

type Status = "loading" | "anon" | "ready" | "error" | "store_unavailable";

interface Ctx {
  status: Status;
  state: ClientState | null;
  demo: boolean;
  setDemo(v: boolean): void;
  selectedKey: string | null;
  select(key: string): void;
  refresh(): Promise<void>;
  post(path: string, body: unknown): Promise<Response>;
  tracker: TrackerContext;
  errorMessage: string | null;
  /** The game picked in the top bar (see lib/games.ts). */
  game: string;
  setGame(id: string): void;
}

const C = createContext<Ctx | null>(null);
const POLL_MS = 15_000;
const ACHIEVEMENTS_TTL = 10 * 60_000;
const DESKTOP_SYNC_MS = 10_000;
/** How long a Steam library (owned games) check stays fresh. */
const LIBRARY_TTL = 6 * 3600_000;

function readFlag(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}
function writeFlag(k: string, v: string | null) {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, v);
  } catch {
    /* storage unavailable */
  }
}

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [state, setState] = useState<ClientState | null>(null);
  const [demo, setDemoState] = useState(false);
  const [selectedKey, setSelected] = useState<string | null>(null);
  const [errorMessage, setErr] = useState<string | null>(null);
  const demoRef = useRef(false);
  const [game, setGameState] = useState(DEFAULT_GAME);
  const router = useRouter();

  const refresh = useCallback(async () => {
    if (demoRef.current) {
      setState(demoState());
      setStatus("ready");
      return;
    }
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (r.status === 401) {
        setStatus("anon");
        setState(null);
        return;
      }
      const j = await r.json();
      if (r.status === 503) {
        setStatus("store_unavailable");
        setErr(j.message ?? null);
        return;
      }
      if (!r.ok) throw new Error(j.error ?? r.statusText);
      setState(j as ClientState);
      setStatus("ready");
    } catch (e) {
      setErr(String(e));
      setStatus((s) => (s === "ready" ? "ready" : "error"));
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const signedIn = url.searchParams.get("signed_in") === "1";
    if (signedIn) {
      writeFlag("lt_demo", null);
      url.searchParams.delete("signed_in");
      window.history.replaceState(window.history.state, "", url);
    }
    const d = !signedIn && readFlag("lt_demo") === "1";
    demoRef.current = d;
    setDemoState(d);
    setSelected(readFlag("lt_char"));
    const picked = gameById(readFlag("lt_game"));
    if (picked) setGameState(picked.id);
    // Picked a game on the login page: land on that game after Steam sign-in.
    if (signedIn && picked && picked.tracker === "steam") router.replace(gameHome(picked));
    refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => clearInterval(t);
    // Runs once on load; router is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const setGame = useCallback((id: string) => {
    if (!gameById(id)) return;
    setGameState(id);
    writeFlag("lt_game", id);
  }, []);

  const setDemo = useCallback(
    (v: boolean) => {
      demoRef.current = v;
      setDemoState(v);
      writeFlag("lt_demo", v ? "1" : null);
      setStatus("loading");
      refresh();
    },
    [refresh],
  );

  const select = useCallback((k: string) => {
    setSelected(k);
    writeFlag("lt_char", k);
  }, []);

  const post = useCallback(
    async (path: string, body: unknown) => {
      if (demoRef.current) return new Response(JSON.stringify({ ok: true, demo: true }), { status: 200 });
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
      await refresh();
      return r;
    },
    [refresh],
  );

  // Keep Steam achievements fresh without a button press once the user is signed in.
  const achievementsTriedAt = useRef(0);
  useEffect(() => {
    if (status !== "ready" || demo || !state || state.demo) return;
    const now = Date.now();
    if (now - achievementsTriedAt.current < ACHIEVEMENTS_TTL) return;
    // A result from before the app was linked to the website (no Steam key in the app)
    // is stale as soon as a link exists, so don't wait out the TTL in that case.
    const linkedSinceFailure = state.desktop && !!state.desktopCloud && !state.desktopCloud.error &&
      (state.achievements?.status === "no_key" || state.achievements?.status === "not_linked");
    if (!linkedSinceFailure && state.now - (state.achievements?.checkedAt ?? 0) < ACHIEVEMENTS_TTL) return;
    achievementsTriedAt.current = now;
    post("/api/achievements/sync", {}).catch(() => {});
  }, [status, demo, state, post]);

  // Verify which Souls games the Steam account owns, after sign-in and every few hours.
  const libraryTried = useRef(false);
  useEffect(() => {
    if (status !== "ready" || demo || !state || state.demo || libraryTried.current) return;
    if (state.library && state.now - state.library.checkedAt < LIBRARY_TTL) return;
    libraryTried.current = true;
    post("/api/library/sync", {}).catch(() => {});
  }, [status, demo, state, post]);

  // Steam achievements of the picked game (the DS1 tracker has its own sync above).
  const gameAchTried = useRef(new Map<number, number>());
  useEffect(() => {
    const g = gameById(game);
    if (status !== "ready" || demo || !state || state.demo || !g || g.tracker !== "steam") return;
    if (state.library?.games[g.appid]?.owned === false) return;
    const now = Date.now();
    if (now - (gameAchTried.current.get(g.appid) ?? 0) < ACHIEVEMENTS_TTL) return;
    if (state.now - (state.gameAchievements?.[g.appid]?.checkedAt ?? 0) < ACHIEVEMENTS_TTL) return;
    gameAchTried.current.set(g.appid, now);
    post("/api/achievements/sync", { appid: g.appid }).catch(() => {});
  }, [status, demo, state, post, game]);

  // The desktop build reads the save itself, so the game's autosaves appear with no setup.
  const desktopSync = status === "ready" && !demo && state?.desktop === true;
  useEffect(() => {
    if (!desktopSync) return;
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const r = await fetch("/api/desktop/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        if (r.ok && (await r.json()).changed) await refresh();
      } catch {
        /* the next tick retries */
      } finally {
        busy = false;
      }
    };
    tick();
    const t = setInterval(tick, DESKTOP_SYNC_MS);
    return () => clearInterval(t);
  }, [desktopSync, refresh]);

  const tracker = useMemo<TrackerContext>(() => {
    const chars = state?.characters ?? [];
    const sel = chars.find((c) => c.id === selectedKey) ?? [...chars].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const items = state?.achievements?.status === "ok" ? state.achievements.items ?? null : null;
    return {
      character: sel?.character ?? null,
      achievements: items,
      manualBosses: state?.manual?.bosses ?? {},
      manualAchievements: state?.manual?.achievements ?? {},
      demo,
    };
  }, [state, selectedKey, demo]);

  return (
    <C.Provider value={{ status, state, demo, setDemo, selectedKey, select, refresh, post, tracker, errorMessage, game, setGame }}>{children}</C.Provider>
  );
}

export function useTracker() {
  const c = useContext(C);
  if (!c) throw new Error("useTracker outside provider");
  return c;
}

/** The currently selected stored character record. */
export function useSelected() {
  const { state, selectedKey } = useTracker();
  const chars = state?.characters ?? [];
  return chars.find((c) => c.id === selectedKey) ?? [...chars].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}
