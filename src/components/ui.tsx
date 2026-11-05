"use client";
import clsx from "clsx";
import type { Certainty } from "@/lib/save/types";

export function Panel({ children, className, title, right }: { children: React.ReactNode; className?: string; title?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className={clsx("panel p-4 md:p-5", className)}>
      {title && (
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg text-gold-300 md:text-xl">{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display gold-text text-3xl font-bold uppercase md:text-4xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-ash-400">{sub}</p>}
      <div className="ornament mt-3" />
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
    <span title={b.title} className={clsx("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", b.cls)}>
      {children ?? b.label}
    </span>
  );
}

export function Stat({ label, value, certainty, demo, hint }: { label: string; value: React.ReactNode; certainty?: Certainty; demo?: boolean; hint?: string }) {
  return (
    <div className="rounded border border-gold-600/20 bg-stone-900/60 p-3">
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-widest text-ash-500">
        <span>{label}</span>
        {demo ? <Badge kind="demo" /> : certainty && <Badge kind={certainty} />}
      </div>
      <div className="font-display mt-1 text-2xl text-gold-300">{value ?? <span className="text-ash-500">—</span>}</div>
      {hint && <div className="mt-1 text-xs text-ash-500">{hint}</div>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded border border-dashed border-ash-500/40 p-6 text-center text-sm text-ash-400">{children}</div>;
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
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={clsx(defeated ? "opacity-100" : "opacity-80")}>
      <defs>
        <radialGradient id={`g-${text}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={defeated ? "#ffb36b" : "#3a3640"} />
          <stop offset="100%" stopColor="#0e0e12" />
        </radialGradient>
      </defs>
      <polygon points="32,2 60,18 60,46 32,62 4,46 4,18" fill={`url(#g-${text})`} stroke={defeated ? "#d4b97a" : "#6b675f"} strokeWidth="1.5" />
      <polygon points="32,8 54,21 54,43 32,56 10,43 10,21" fill="none" stroke="rgba(212,185,122,0.25)" />
      <text x="32" y="38" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="18" fontWeight="700" fill={defeated ? "#1a0d05" : "#d4b97a"}>
        {text}
      </text>
    </svg>
  );
}
