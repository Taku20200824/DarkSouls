"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { useTracker } from "./TrackerProvider";
import { fmtAgo } from "./ui";
import { BOSSES } from "@/lib/data/bosses";
import { Backpack, Compass, Hammer, LayoutDashboard, Map as MapIcon, Milestone, ScrollText, Settings, Skull, Swords, Trophy, Users, Menu, X } from "lucide-react";
import { BonfireMark } from "./BonfireMark";

const NAV = [
  { href: "/dashboard", label: "Хяналтын самбар", en: "Dashboard", icon: LayoutDashboard },
  { href: "/characters", label: "Дүр сонгох", en: "Characters", icon: Users },
  { href: "/map", label: "Lordran газрын зураг", en: "World Map", icon: MapIcon },
  { href: "/bosses", label: "Boss-ууд", en: "Bosses", icon: Swords },
  { href: "/guide", label: "100% хөтөч", en: "Guide", icon: Compass },
  { href: "/upgrades", label: "Зэвсэг сайжруулах", en: "Upgrades", icon: Hammer },
  { href: "/inventory", label: "Эд зүйлс", en: "Inventory", icon: Backpack },
  { href: "/achievements", label: "Achievement", en: "Achievements", icon: Trophy },
  { href: "/deaths", label: "Үхлийн статистик", en: "Deaths", icon: Skull },
  { href: "/quests", label: "NPC quest", en: "Quests", icon: ScrollText },
  { href: "/roadmap", label: "NG → NG++", en: "Roadmap", icon: Milestone },
  { href: "/settings", label: "Тохиргоо / Companion", en: "Settings", icon: Settings },
];

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
    <div className={clsx("border px-3 py-2.5 text-xs", color === "ember" ? "border-ember-500/50 bg-[linear-gradient(90deg,rgba(242,106,27,0.15),transparent)] shadow-[0_0_24px_-10px_#f26a1b]" : color === "fuchsia" ? "border-fuchsia-600/60 bg-fuchsia-900/20" : "border-ash-500/30 bg-black/40")}>
      <div className="font-display flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-gold-300">
        <span className={clsx("h-2 w-2 rounded-full", color === "ember" ? "bg-ember-400" : color === "fuchsia" ? "bg-fuchsia-400" : "bg-ash-500", pulse && "animate-pulse")} />
        {main}
      </div>
      {sub && <div className="mt-0.5 text-ash-400">{sub}</div>}
    </div>
  );
}

function VictoryOverlay() {
  const { state, post, demo } = useTracker();
  const pending = useMemo(
    () => (state?.events ?? []).filter((e) => e.type === "boss" && !e.ackedAt && Date.now() - e.at < 24 * 3600_000),
    [state],
  );
  const [shown, setShown] = useState<string | null>(null);
  const ev = pending[0];
  useEffect(() => {
    if (ev && shown !== ev.id) setShown(ev.id);
  }, [ev, shown]);
  if (demo || !ev) return null;
  const bossName = String(ev.data.boss ?? "");
  const boss = BOSSES.find((b) => b.evidence.includes(bossName));
  const dismiss = () => post("/api/events/ack", { ids: pending.map((p) => p.id) });
  return (
    <AnimatePresence>
      <motion.div key={ev.id} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={dismiss}>
        <motion.div initial={{ scale: 1.15, opacity: 0, letterSpacing: "0.6em" }} animate={{ scale: 1, opacity: 1, letterSpacing: "0.25em" }} transition={{ duration: 2.2, ease: "easeOut" }} className="text-center">
          <div className="h-px w-[80vw] max-w-3xl bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          <h2 className="font-display gold-text py-6 text-4xl font-bold md:text-7xl">VICTORY ACHIEVED</h2>
          <div className="h-px w-[80vw] max-w-3xl bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          <p className="font-display mt-6 text-2xl text-gold-300">{boss?.name ?? bossName}</p>
          <p className="mt-2 text-xs text-ash-400">Нотолгоо: {(ev.data.evidence as string[] | undefined)?.join(", ")} · {ev.source}</p>
          <p className="mt-6 text-xs text-ash-500">Хаах бол дарна уу</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state, demo, status } = useTracker();
  const [open, setOpen] = useState(false);
  const bare = path === "/" || path === "/login";
  if (bare) return <>{children}</>;
  return (
    <div className="relative z-10 flex min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={clsx("scrollbar-thin fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col overflow-y-auto border-r border-gold-600/15 bg-[linear-gradient(180deg,rgba(11,11,14,0.98),rgba(5,5,6,0.98))] px-4 py-5 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold-500/40 to-transparent" />
        <Link href="/" className="group flex items-center gap-3 px-2">
          <BonfireMark className="h-12 w-9" />
          <div>
            <div className="font-display gold-text text-xl font-bold tracking-[0.28em]">LORDRAN</div>
            <div className="font-display text-[10px] tracking-[0.6em] text-ash-500 group-hover:text-ember-300">TRACKER</div>
          </div>
        </Link>
        <div className="ornament my-5" />
        <nav className="space-y-0.5">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={clsx("group relative flex items-center gap-3 overflow-hidden px-3 py-2.5 transition", active ? "text-gold-200" : "text-ash-400 hover:text-gold-300")}>
                {active && <motion.span layoutId="nav-active" className="absolute inset-0 border-l-2 border-ember-400 bg-[linear-gradient(90deg,rgba(242,106,27,0.18),transparent)]" transition={{ type: "spring", stiffness: 400, damping: 35 }} />}
                <Icon className={clsx("relative h-4 w-4 shrink-0 transition", active ? "text-ember-300 drop-shadow-[0_0_6px_#ff9142]" : "text-ash-500 group-hover:text-gold-400")} strokeWidth={1.6} />
                <span className="relative min-w-0">
                  <span className="block truncate text-[13px]">{n.label}</span>
                  <span className="font-display block text-[9px] uppercase tracking-[0.25em] text-ash-500">{n.en}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6">
          <LiveStatus />
          {status === "ready" && state && !demo && (
            <div className="mt-3 flex items-center gap-3 border border-gold-600/15 bg-black/30 p-2.5 text-xs text-ash-400">
              {state.user.avatar && <img src={state.user.avatar} alt="" className="h-9 w-9 border border-gold-500/50" />}
              <div className="min-w-0">
                <div className="truncate text-gold-300">{state.user.personaName ?? state.user.steamId}</div>
                <div className="font-display text-[9px] tracking-widest text-ash-500">STEAM · {state.user.steamId}</div>
              </div>
            </div>
          )}
          {state?.storeKind === "dev-file" && <div className="mt-3 border border-amber-600/50 p-2 text-[10px] text-amber-300">DEV STORE — Firebase тохируулаагүй</div>}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gold-600/15 bg-stone-950/85 px-4 py-2.5 backdrop-blur md:hidden">
          <button className="btn !px-2.5 !py-1.5" onClick={() => setOpen(!open)} aria-label="Цэс">{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
          <span className="font-display gold-text text-sm font-bold tracking-[0.3em]">LORDRAN TRACKER</span>
          <BonfireMark className="h-7 w-5" />
        </div>
        {demo && <div className="bg-fuchsia-900/40 px-4 py-1.5 text-center text-xs font-semibold tracking-widest text-fuchsia-200">DEMO MODE — эдгээр нь жишээ утгууд, таны бодит статистик биш</div>}
        <motion.main key={path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="mx-auto max-w-7xl p-4 md:p-10">{children}</motion.main>
      </div>
      <VictoryOverlay />
    </div>
  );
}

/** Wraps pages that need either a login or demo mode. */
export function Gate({ children }: { children: React.ReactNode }) {
  const { status, setDemo, errorMessage } = useTracker();
  if (status === "loading") return <div className="py-20 text-center text-ash-500">Ачааллаж байна…</div>;
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
  if (status === "error") return <div className="py-20 text-center text-blood-500">Сервертэй холбогдож чадсангүй. {errorMessage}</div>;
  return <>{children}</>;
}
