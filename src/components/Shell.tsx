"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { useTracker } from "./TrackerProvider";
import { Loading, fmtAgo } from "./ui";
import { BOSSES } from "@/lib/data/bosses";
import { Menu, X } from "lucide-react";
import { navFor, roman } from "./nav";
import { BonfireMark } from "./BonfireMark";
import { BossThumb } from "./BossThumb";
import { GameBar, useCurrentGame, useOwnership, useSyncPickedGame } from "./GameBar";
import type { GameInfo } from "@/lib/games";



export function LiveStatus() {
  const { state, demo, status } = useTracker();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  if (demo) return <Pill color="fuchsia" main="DEMO MODE" sub="Жишээ өгөгдөл — бодит биш" />;
  if (status !== "ready" || !state) return <Pill color="ash" main="NOT CONNECTED" sub="Steam-ээр нэвтэрнэ үү" />;
  const c = state.companion;
  const lastSync = state.sync?.lastSyncAt;
  if (c?.connected) {
    const waiting = !lastSync || now - lastSync > 60_000;
    return <Pill color="ember" main="CONNECTED — LIVE TRACKING" sub={waiting ? `WAITING FOR NEXT SAVE · сүүлийн sync ${fmtAgo(lastSync, now)}` : `Шинэ save ${fmtAgo(lastSync, now)}`} pulse />;
  }
  if (lastSync) return <Pill color="ash" main="OFFLINE — LAST SYNC" sub={fmtAgo(lastSync, now)} />;
  return <Pill color="ash" main="NOT CONNECTED" sub="Companion эсвэл save upload хийгдээгүй" />;
}

function Pill({ main, sub, color, pulse }: { main: string; sub?: string; color: "ember" | "ash" | "fuchsia"; pulse?: boolean }) {
  return (
    <div className={clsx("border px-3 py-2.5 text-xs", color === "ember" ? "border-ember-500/50 bg-[linear-gradient(90deg,rgba(242,106,27,0.15),transparent)] shadow-[0_0_24px_-10px_var(--color-ember-500)]" : color === "fuchsia" ? "border-demo-line/60 bg-demo-deep/20" : "border-ash-500/30 bg-black/40")}>
      <div className="font-display flex items-center gap-2 text-micro font-semibold tracking-label text-gold-300">
        <span className={clsx("h-2 w-2 rounded-full", color === "ember" ? "bg-ember-400" : color === "fuchsia" ? "bg-demo-dot" : "bg-ash-500", pulse && "animate-pulse")} />
        {main}
      </div>
      {sub && <div className="mt-0.5 text-ash-400">{sub}</div>}
    </div>
  );
}

/** Status pill for a game followed through Steam only: what Steam says about this account. */
function SteamStatus({ game }: { game: GameInfo }) {
  const { state, demo, status } = useTracker();
  const own = useOwnership()(game);
  if (demo) return <Pill color="fuchsia" main="DEMO MODE" sub="Жишээ өгөгдөл — бодит биш" />;
  if (status !== "ready" || !state) return <Pill color="ash" main="NOT CONNECTED" sub="Steam-ээр нэвтэрнэ үү" />;
  const checked = state.library?.checkedAt;
  if (own === "owned") return <Pill color="ember" main="STEAM — VERIFIED" sub={`Таны бүртгэлд байгаа · шалгасан ${fmtAgo(checked)}`} />;
  if (own === "not_owned") return <Pill color="ash" main="NOT OWNED" sub="Энэ Steam бүртгэлд байхгүй" />;
  return <Pill color="ash" main="STEAM — ШАЛГАЖ БАЙНА" sub={state.library?.status === "private" ? "Game details private байна" : "Эзэмшлийг шалгаж байна…"} />;
}

const VICTORY_MS = 8000;
const ACK_BATCH = 50; // the ack route accepts at most 50 ids per request

function VictoryOverlay() {
  const { state, post, demo } = useTracker();
  // Hidden locally at once, so a failed or slow acknowledgement can never leave the overlay up.
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const pending = useMemo(
    () => (state?.events ?? []).filter((e) => e.type === "boss" && !e.ackedAt && !dismissed.has(e.id) && Date.now() - e.at < 24 * 3600_000),
    [state, dismissed],
  );
  const ev = pending[0];
  const dismiss = useCallback(() => {
    const ids = pending.map((p) => p.id);
    setDismissed((prev) => new Set([...prev, ...ids]));
    void (async () => {
      for (let i = 0; i < ids.length; i += ACK_BATCH) {
        await post("/api/events/ack", { ids: ids.slice(i, i + ACK_BATCH) }).catch(() => null);
      }
    })();
  }, [pending, post]);
  useEffect(() => {
    if (demo || !ev) return;
    const timer = setTimeout(dismiss, VICTORY_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [demo, ev, dismiss]);
  if (demo || !ev) return null;
  const bossName = String(ev.data.boss ?? "");
  const boss = BOSSES.find((b) => b.evidence.includes(bossName));
  return (
    <AnimatePresence>
      <motion.div key={ev.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={dismiss}>
        <motion.div initial={{ scale: 1.15, opacity: 0, letterSpacing: "0.6em" }} animate={{ scale: 1, opacity: 1, letterSpacing: "0.25em" }} transition={{ duration: 2.2, ease: "easeOut" }} className="text-center">
          <div className="h-px w-[80vw] max-w-3xl bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          <h2 className="font-display gold-text py-6 text-4xl font-bold md:text-7xl">VICTORY ACHIEVED</h2>
          <div className="h-px w-[80vw] max-w-3xl bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          {boss && <BossThumb boss={boss} defeated size={140} className="mx-auto mt-6 shadow-[0_0_40px_-8px_rgba(255,145,66,0.6)]" />}
          <p className="font-display mt-6 text-2xl text-gold-300">{boss?.name ?? bossName}</p>
          {pending.length > 1 && <p className="mt-2 text-sm text-gold-400">+{pending.length - 1} boss</p>}
          <p className="mt-2 text-xs text-ash-400">Нотолгоо: {(ev.data.evidence as string[] | undefined)?.join(", ")} · {ev.source}</p>
          <p className="mt-6 text-xs text-ash-500">Хаах бол дарна уу (Esc) — автоматаар хаагдана</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** True below the md breakpoint (where the sidebar becomes a drawer). */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state, demo, status } = useTracker();
  const [open, setOpen] = useState(false);
  const mobile = useIsMobile();
  const game = useCurrentGame();
  // Close the drawer on navigation and with Escape.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useSyncPickedGame();
  const nav = navFor(game);
  const bare = path === "/" || path === "/login";
  if (bare) return <>{children}</>;
  return (
    <div className="relative z-10 flex min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={clsx("scrollbar-thin scrollbar-quiet fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col overflow-y-auto border-r border-gold-600/15 bg-[linear-gradient(180deg,rgba(11,11,14,0.98),rgba(5,5,6,0.98))] px-4 py-5 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}
        // Off-screen on phones while closed: keep its links out of the tab order and screen readers.
        inert={mobile && !open ? true : undefined}
        aria-label="Үндсэн цэс"
      >
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold-500/40 to-transparent" />
        <Link href="/" className="group flex items-center gap-3 px-2">
          <BonfireMark className="h-12 w-9" />
          <div>
            <div className="font-display gold-text text-xl font-bold tracking-eyebrow">LORDRAN</div>
            <div className="font-display text-micro tracking-logo text-ash-500 group-hover:text-ember-300">TRACKER</div>
          </div>
        </Link>
        <div className="mt-3 flex items-center gap-2 border-l-2 border-ember-500/70 bg-black/30 px-3 py-1.5">
          <span className="sr-only">Сонгосон тоглоом: </span>
          <span className="font-display min-w-0 text-label font-semibold leading-snug tracking-caps text-gold-300">{game.title}</span>
        </div>
        <div className="ornament my-3" aria-hidden />
        <nav id="tracker-navigation" aria-label="Tracker navigation" className="space-y-0.5">
          {nav.map((n, i) => {
            const active = path.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={clsx("nav-item group relative flex items-center gap-3 overflow-hidden px-3 py-2 transition", active ? "nav-item--on text-gold-200" : "text-ash-400 hover:text-gold-300")}>
                {active && <motion.span layoutId="nav-active" className="nav-item__active absolute inset-0" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                <span className={clsx("nav-item__icon relative mx-0.5 grid h-7 w-7 shrink-0 place-items-center", active && "nav-item__icon--on")}>
                  <Icon className={clsx("h-4 w-4 transition", active ? "text-ember-300" : "text-ash-500 group-hover:text-gold-400")} strokeWidth={1.6} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-body-sm">{n.label}</span>
                  <span className="font-display block text-micro uppercase tracking-eyebrow text-ash-500">{n.en}</span>
                </span>
                <span className={clsx("font-display relative w-7 text-right text-label tracking-caps transition", active ? "text-ember-300" : "text-ash-500/60 group-hover:text-gold-500")}>{roman(i)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          {game.tracker === "full" ? <LiveStatus /> : <SteamStatus game={game} />}
          {status === "ready" && state && !demo && (
            <div className="mt-3 flex items-center gap-3 border border-gold-600/15 bg-black/30 p-2.5 text-xs text-ash-400">
              {state.user.avatar && <img src={state.user.avatar} alt="" className="h-9 w-9 border border-gold-500/50" />}
              <div className="min-w-0">
                <div className="truncate text-gold-300">{state.user.personaName ?? state.user.steamId}</div>
                <div className="font-display text-micro tracking-widest text-ash-500">STEAM · {state.user.steamId}</div>
              </div>
            </div>
          )}
          {state?.storeKind === "dev-file" && (
            <div className={clsx("mt-3 border p-2 text-micro", state.desktop ? "border-ash-500/30 text-ash-500" : "border-warning-line/50 text-warning")}>
              {state.desktop ? "LOCAL STORAGE — энэ компьютер дээр хадгалагдана" : "DEV STORE — Firebase тохируулаагүй"}
            </div>
          )}
          <div className="font-display mt-3 text-center text-micro tracking-widest text-ash-500">
            v{process.env.NEXT_PUBLIC_APP_VERSION}{state?.desktop ? " · Desktop" : ""}
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex h-[var(--mobile-bar-h)] items-center justify-between border-b border-gold-600/15 bg-stone-950/95 px-4 backdrop-blur md:hidden">
          <button className="btn btn-sm" onClick={() => setOpen(!open)} aria-label="Цэс" aria-expanded={open} aria-controls="tracker-navigation">{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
          <span className="font-display gold-text text-sm font-bold tracking-eyebrow">LORDRAN TRACKER</span>
          <BonfireMark className="h-7 w-5" />
        </div>
        <GameBar />
        {demo && <div className="bg-demo-deep/40 px-4 py-1.5 text-center text-xs font-semibold tracking-widest text-demo-soft">DEMO MODE — эдгээр нь жишээ утгууд, таны бодит статистик биш</div>}
        <motion.main id="main-content" key={path} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="tracker-main mx-auto max-w-7xl p-4 md:p-10">{children}</motion.main>
      </div>
      <VictoryOverlay />
    </div>
  );
}

/** Wraps pages that need either a login or demo mode. */
export function Gate({ children }: { children: React.ReactNode }) {
  const { status, setDemo, errorMessage, refresh } = useTracker();
  if (status === "loading") return <Loading />;
  if (status === "store_unavailable")
    return (
      <div className="panel mx-auto max-w-xl p-6 text-center">
        <h2 className="font-display text-xl text-gold-300">Өгөгдлийн сан тохируулаагүй</h2>
        <p className="mt-2 text-sm text-ash-400">Firebase-ийн орчны хувьсагчид (FIREBASE_*) байхгүй байна. README-г үзнэ үү.</p>
        {errorMessage && <p className="mt-2 text-xs text-ash-500">{errorMessage}</p>}
      </div>
    );
  if (status === "anon")
    return (
      <div className="panel mx-auto max-w-xl p-6 text-center">
        <h2 className="font-display text-2xl text-gold-300">Нэвтрээгүй байна</h2>
        <p className="mt-2 text-sm text-ash-400">Өөрийн явцаа харахын тулд Steam-ээр нэвтэрнэ үү. Эсвэл Demo Mode-оор интерфэйсийг үзнэ үү.</p>
        <div className="mt-5 flex justify-center gap-3">
          <a className="btn btn-ember" href="/api/auth/steam/login">Sign in through Steam</a>
          <button className="btn" onClick={() => setDemo(true)}>Demo Mode</button>
        </div>
      </div>
    );
  if (status === "error")
    return (
      <div role="alert" className="panel mx-auto max-w-xl p-6 text-center">
        <h2 className="font-display text-xl text-gold-300">Сервертэй холбогдож чадсангүй</h2>
        <p className="mt-2 text-sm text-ash-400">Интернэт холболтоо шалгаад дахин оролдоно уу.</p>
        {errorMessage && <p className="mt-2 break-words text-xs text-ash-500">{errorMessage}</p>}
        <button className="btn btn-ember mt-5" onClick={() => void refresh()}>Дахин оролдох</button>
      </div>
    );
  return <>{children}</>;
}
