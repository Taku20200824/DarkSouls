"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ClientState } from "@/lib/client/types";
import { demoState } from "@/lib/client/demo";
import type { TrackerContext } from "@/lib/guide/engine";

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
}

const C = createContext<Ctx | null>(null);
const POLL_MS = 15_000;
const ACHIEVEMENTS_TTL = 10 * 60_000;
const DESKTOP_SYNC_MS = 10_000;

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
    const d = readFlag("lt_demo") === "1";
    demoRef.current = d;
    setDemoState(d);
    setSelected(readFlag("lt_char"));
    refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

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
    if (state.now - (state.achievements?.checkedAt ?? 0) < ACHIEVEMENTS_TTL) return;
    achievementsTriedAt.current = now;
    post("/api/achievements/sync", {}).catch(() => {});
  }, [status, demo, state, post]);

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
    <C.Provider value={{ status, state, demo, setDemo, selectedKey, select, refresh, post, tracker, errorMessage }}>{children}</C.Provider>
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
