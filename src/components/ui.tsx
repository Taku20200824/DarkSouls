"use client";
import clsx from "clsx";
import { motion } from "motion/react";
import type { Certainty } from "@/lib/save/types";

export function Panel({ children, className, title, right, hover }: { children: React.ReactNode; className?: string; title?: React.ReactNode; right?: React.ReactNode; hover?: boolean }) {
  return (
    <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .5 }} className={clsx("panel p-5 md:p-6", hover && "panel-hover", className)}>
      {title && (
        <header className="mb-4 flex items-center justify-between gap-3 border-b border-gold-600/15 pb-3">
          <h2 className="font-display flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.18em] text-gold-300 md:text-base">
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-ember-400 shadow-[0_0_8px_#ff9142]" />
            {title}
          </h2>
          {right}
        </header>
      )}
      {children}
    </motion.section>
  );
}

function Flourish({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 160 14" className={clsx("h-3.5 w-24 md:w-40", flip && "-scale-x-100")} aria-hidden>
      <path d="M0 7 H120" stroke="url(#fl-g)" strokeWidth="1" />
      <path d="M120 7 C132 1 140 1 146 7 C140 13 132 13 120 7Z" fill="none" stroke="#cfb173" strokeWidth="1" />
      <rect x="150" y="4" width="6" height="6" transform="rotate(45 153 7)" fill="#ff9142" />
      <defs>
        <linearGradient id="fl-g" x1="0" x2="1">
          <stop offset="0" stopColor="#cfb173" stopOpacity="0" />
          <stop offset="1" stopColor="#cfb173" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8 text-center md:mb-10">
      <div className="flex items-center justify-center gap-3 md:gap-5">
        <Flourish />
        <h1 className="font-display shimmer-title text-2xl font-bold uppercase tracking-[0.16em] md:text-[2.6rem] md:leading-tight">{title}</h1>
        <Flourish flip />
      </div>
      {sub && <p className="font-serif mx-auto mt-3 max-w-3xl text-base italic text-ash-400 md:text-lg">{sub}</p>}
    </div>
  );
}

const BADGE: Record<string, { label: string; cls: string; title: string }> = {
  verified: { label: "Verified", cls: "border-emerald-700/60 text-emerald-300", title: "Тоглоомын өгөгдлөөс шууд уншсан" },
  inferred: { label: "Inferred", cls: "border-amber-600/60 text-amber-300", title: "Бусад нотолгоонд үндэслэн дүгнэсэн" },
  unknown: { label: "Unknown", cls: "border-ash-500/60 text-ash-400", title: "Найдвартай тодорхойлох боломжгүй" },
  manual: { label: "User confirmation", cls: "border-sky-700/60 text-sky-300", title: "Хэрэглэгч гараар баталгаажуулсан" },
  steam: { label: "Steam API", cls: "border-indigo-600/60 text-indigo-300", title: "Steam Web API-аас" },
  save: { label: "Parsed save file", cls: "border-emerald-700/60 text-emerald-300", title: "Save файлаас" },
  companion: { label: "Companion", cls: "border-emerald-700/60 text-emerald-300", title: "Windows companion-аас" },
  demo: { label: "DEMO", cls: "border-fuchsia-600/70 text-fuchsia-300", title: "Жишээ өгөгдөл — бодит биш" },
  inference: { label: "Inference", cls: "border-amber-600/60 text-amber-300", title: "Тооцоолсон" },
};

export function Badge({ kind, children }: { kind: keyof typeof BADGE | Certainty | string; children?: React.ReactNode }) {
  const b = BADGE[kind] ?? BADGE.unknown;
  return (
    <span title={b.title} className={clsx("inline-flex items-center rounded-[1px] border bg-black/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]", b.cls)}>
      {children ?? b.label}
    </span>
  );
}

export function Stat({ label, value, certainty, demo, hint }: { label: string; value: React.ReactNode; certainty?: Certainty; demo?: boolean; hint?: string }) {
  return (
    <div className="panel panel-hover group p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-ash-500">{label}</span>
        {demo ? <Badge kind="demo" /> : certainty && <Badge kind={certainty} />}
      </div>
      <div className="font-display mt-2 text-3xl font-semibold text-gold-200 transition group-hover:text-white group-hover:[text-shadow:0_0_18px_rgba(255,145,66,0.6)]">
        {value ?? <span className="text-ash-500">—</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-ash-500">{hint}</div>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="panel border-dashed p-8 text-center font-serif text-lg italic text-ash-400">{children}</div>;
}

export function fmtNum(n: number | null | undefined) {
  return n === null || n === undefined ? null : n.toLocaleString("en-US");
}
export function fmtDuration(sec: number | null | undefined) {
  if (sec === null || sec === undefined) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}ц ${m.toString().padStart(2, "0")}м`;
}
export function fmtAgo(ms: number | null | undefined, now = Date.now()) {
  if (!ms) return "—";
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return `${s} сек өмнө`;
  if (s < 3600) return `${Math.round(s / 60)} мин өмнө`;
  if (s < 86400) return `${Math.round(s / 3600)} цагийн өмнө`;
  return `${Math.round(s / 86400)} өдрийн өмнө`;
}
export function fmtDate(ms: number | null | undefined) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function Sigil({ text, defeated, size = 64 }: { text: string; defeated?: boolean | null; size?: number }) {
  const id = `sg-${text}-${defeated ? 1 : 0}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className="shrink-0">
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor={defeated ? "#ffb36b" : "#2c2930"} />
          <stop offset="45%" stopColor={defeated ? "#8a300a" : "#141317"} />
          <stop offset="100%" stopColor="#050506" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={defeated ? "#fff1cf" : "#8f8778"} />
          <stop offset="1" stopColor={defeated ? "#a8894f" : "#3a3640"} />
        </linearGradient>
      </defs>
      {defeated && <circle cx="50" cy="50" r="46" fill="none" stroke="#ff9142" strokeOpacity="0.25" strokeWidth="6" className="glow-pulse" />}
      <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1" strokeDasharray="2 4" />
      <path d="M50 8 L86 22 L82 62 Q76 82 50 94 Q24 82 18 62 L14 22 Z" fill={`url(#${id}-bg)`} stroke={`url(#${id}-rim)`} strokeWidth="2" />
      <path d="M50 16 L78 27 L75 60 Q70 76 50 86 Q30 76 25 60 L22 27 Z" fill="none" stroke={defeated ? "rgba(255,230,180,0.45)" : "rgba(207,177,115,0.2)"} />
      <text x="50" y="60" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="24" fontWeight="700" fill={defeated ? "#1a0b03" : "#cfb173"} letterSpacing="1">
        {text}
      </text>
    </svg>
  );
}
