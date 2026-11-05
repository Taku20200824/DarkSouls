"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { useTracker } from "./TrackerProvider";
import { fmtAgo } from "./ui";
import { BOSSES } from "@/lib/data/bosses";

const NAV = [
  { href: "/dashboard", label: "Хяналтын самбар", en: "Dashboard" },
  { href: "/characters", label: "Дүр сонгох", en: "Characters" },
  { href: "/map", label: "Lordran газрын зураг", en: "World Map" },
  { href: "/bosses", label: "Boss-ууд", en: "Bosses" },
  { href: "/guide", label: "100% хөтөч", en: "Guide" },
  { href: "/upgrades", label: "Зэвсэг сайжруулах", en: "Upgrades" },
  { href: "/inventory", label: "Эд зүйлс", en: "Inventory" },
  { href: "/achievements", label: "Achievement", en: "Achievements" },
  { href: "/deaths", label: "Үхлийн статистик", en: "Deaths" },
  { href: "/quests", label: "NPC quest", en: "Quests" },
  { href: "/roadmap", label: "NG → NG++", en: "Roadmap" },
  { href: "/settings", label: "Тохиргоо / Companion", en: "Settings" },
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
    <div className={clsx("rounded border px-3 py-2 text-xs", color === "ember" ? "border-ember-500/60 bg-ember-600/10" : color === "fuchsia" ? "border-fuchsia-600/60 bg-fuchsia-900/20" : "border-ash-500/40 bg-stone-900/60")}>
      <div className="flex items-center gap-2 font-semibold tracking-widest text-gold-300">
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
      <aside className={clsx("fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gold-600/20 bg-stone-950/95 p-4 transition-transform md:static md:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Link href="/" className="block">
          <div className="font-display gold-text text-2xl font-bold tracking-[0.2em]">LORDRAN</div>
          <div className="font-display text-xs tracking-[0.5em] text-ash-500">TRACKER</div>
        </Link>
        <div className="ornament my-4" />
        <nav className="space-y-0.5">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={clsx("block rounded px-3 py-2 text-sm transition", path.startsWith(n.href) ? "bg-ember-600/15 text-gold-300 shadow-[inset_2px_0_0_#ff8a3d]" : "text-ash-400 hover:bg-stone-800 hover:text-gold-300")}>
              <div>{n.label}</div>
              <div className="text-[10px] uppercase tracking-widest text-ash-500">{n.en}</div>
            </Link>
          ))}
        </nav>
        <div className="mt-6"><LiveStatus /></div>
        {status === "ready" && state && !demo && (
          <div className="mt-4 flex items-center gap-2 text-xs text-ash-400">
            {state.user.avatar && <img src={state.user.avatar} alt="" className="h-8 w-8 rounded border border-gold-600/40" />}
            <div className="min-w-0">
              <div className="truncate text-gold-300">{state.user.personaName ?? state.user.steamId}</div>
              <div className="text-[10px] text-ash-500">SteamID {state.user.steamId}</div>
            </div>
          </div>
        )}
        {state?.storeKind === "dev-file" && <div className="mt-3 rounded border border-amber-600/50 p-2 text-[10px] text-amber-300">DEV STORE — Firebase тохируулаагүй (local file)</div>}
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gold-600/10 bg-stone-950/80 px-4 py-2 backdrop-blur md:hidden">
          <button className="btn !px-3 !py-1" onClick={() => setOpen(!open)} aria-label="Цэс">☰</button>
          <span className="font-display gold-text tracking-[0.2em]">LORDRAN TRACKER</span>
        </div>
        {demo && <div className="bg-fuchsia-900/40 px-4 py-1.5 text-center text-xs font-semibold tracking-widest text-fuchsia-200">DEMO MODE — эдгээр нь жишээ утгууд, таны бодит статистик биш</div>}
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
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
