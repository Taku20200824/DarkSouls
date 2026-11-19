"use client";
import clsx from "clsx";
import { BadgeCheck, CircleHelp, Lock, RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_GAME, GAMES, gameById, gameHome, type GameInfo } from "@/lib/games";
import { isDs1Path } from "./nav";
import { useTracker } from "./TrackerProvider";

export type Ownership = "owned" | "not_owned" | "unknown";

export function useOwnership() {
  const { state, status } = useTracker();
  return (g: GameInfo): Ownership => {
    if (status !== "ready" || !state) return "unknown";
    const owned = state.library?.games[g.appid]?.owned;
    return owned === true ? "owned" : owned === false ? "not_owned" : "unknown";
  };
}

/**
 * The game the screen is about: the one in the URL (/games/…), Dark Souls: Remastered on
 * its tracker pages, otherwise the last one picked (e.g. on Settings).
 */
export function useCurrentGame(): GameInfo {
  const path = usePathname();
  const { game } = useTracker();
  const fromPath = path.startsWith("/games/") ? gameById(path.split("/")[2]) : isDs1Path(path) ? gameById(DEFAULT_GAME) : null;
  return fromPath ?? gameById(game) ?? GAMES[0];
}

/** Keeps the remembered pick in step with the page (a link or the back button changes games too). */
export function useSyncPickedGame() {
  const current = useCurrentGame();
  const { game, setGame } = useTracker();
  useEffect(() => {
    if (current.id !== game) setGame(current.id);
  }, [current.id, game, setGame]);
}

const hours = (min: number | null | undefined) => (min ? `${Math.round(min / 60)} цаг` : null);

/**
 * The game picker across the top: every Souls game, marked with what Steam says about
 * the signed-in account (verified owned / not owned / unknown).
 */
export function GameBar() {
  const router = useRouter();
  const { state, status, demo, setGame, post } = useTracker();
  const ownership = useOwnership();
  const [busy, setBusy] = useState(false);
  const active = useCurrentGame().id;
  const signedIn = status === "ready" && !!state;

  const games = GAMES;

  async function verify() {
    setBusy(true);
    try {
      await post("/api/library/sync", {});
    } finally {
      setBusy(false);
    }
  }

  const lib = state?.library;
  return (
    <div className="game-bar sticky top-0 z-20 border-b border-gold-600/15 bg-stone-950/90 backdrop-blur max-md:top-[53px]">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 md:px-10">
        <nav aria-label="Тоглоом сонгох" className="scrollbar-thin flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5">
          {games.map((g) => {
            const own = ownership(g);
            const on = g.id === active;
            const time = hours(lib?.games[g.appid]?.playtimeMinutes);
            return (
              <button
                key={g.id}
                type="button"
                aria-current={on ? "page" : undefined}
                title={`${g.title} (${g.year})${own === "owned" ? " — Steam-ээр баталгаажсан" : own === "not_owned" ? " — энэ Steam бүртгэлд байхгүй" : ""}`}
                onClick={() => {
                  setGame(g.id);
                  router.push(gameHome(g));
                }}
                className={clsx(
                  "group flex shrink-0 items-center gap-2 border px-3 py-1.5 text-left transition",
                  on ? "border-ember-500/70 bg-[linear-gradient(180deg,rgba(242,106,27,0.18),rgba(242,106,27,0.04))] text-gold-200" : "border-gold-600/20 bg-black/30 hover:border-gold-500/50",
                  own === "not_owned" && !on && "opacity-55",
                )}
              >
                {own === "owned" ? (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Баталгаажсан" />
                ) : own === "not_owned" ? (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-ash-500" aria-label="Байхгүй" />
                ) : (
                  <CircleHelp className="h-3.5 w-3.5 shrink-0 text-ash-500" aria-label="Тодорхойгүй" />
                )}
                <span className="leading-tight">
                  <span className={clsx("font-display block whitespace-nowrap text-label font-semibold tracking-caps", on ? "text-gold-200" : "text-gold-400 group-hover:text-gold-300")}>{g.short}</span>
                  <span className="block whitespace-nowrap text-micro text-ash-500">{time ?? g.year}</span>
                </span>
              </button>
            );
          })}
        </nav>
        {signedIn && !demo && (
          <button type="button" className="btn btn-sm shrink-0" disabled={busy} aria-busy={busy} onClick={() => void verify()} title="Steam бүртгэлийн тоглоомуудыг дахин шалгах">
            <RefreshCw className={clsx("h-3.5 w-3.5", busy && "animate-spin")} />
            <span className="max-sm:hidden">Steam шалгах</span>
          </button>
        )}
      </div>
      {signedIn && !demo && lib?.status === "private" && (
        <p className="mx-auto max-w-7xl px-4 pb-2 text-micro text-warning md:px-10">
          Steam профайлын «Game details» private тул эзэмшсэн тоглоомыг шалгаж чадсангүй. Steam → Privacy Settings-ээс Public болгоно уу.
        </p>
      )}
    </div>
  );
}
