"use client";
import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { AchievementIcon, ProgressRing } from "@/components/AchievementIcon";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, PageTitle, Panel, fmtDate } from "@/components/ui";
import { ACHIEVEMENTS, type AchCategory } from "@/lib/data/achievements";
import { achievementHints, achievementUnlocked, completionPercent } from "@/lib/guide/engine";

const CAT: Record<AchCategory, string> = { story: "Түүх", boss: "Boss", covenant: "Covenant", weapon: "Зэвсэг", collection: "Цуглуулга", ending: "Төгсгөл", meta: "Platinum" };
const STATUS_MN: Record<string, string> = {
  private: "Steam профайл эсвэл 'Game details' private байна — Steam Privacy Settings-ээс Public болгоно уу.",
  no_key: "Сервер дээр STEAM_API_KEY тохируулаагүй.",
  bad_key: "Steam API key буруу эсвэл хүчингүй байна (403). Vercel дээрх STEAM_API_KEY-г шинэчилнэ үү.",
  not_owned: "Энэ бүртгэлд Dark Souls: Remastered-ийн статистик олдсонгүй.",
  error: "Steam API алдаа гаргалаа. Дараа дахин оролдоно уу.",
  not_linked: "App вэбтэй холбогдоогүй байна. Тохиргоо → «Steam-ээр дахин нэвтэрч синк асаах»-аар холбоно уу.",
};

type Filter = "all" | "unlocked" | "locked" | "missable";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "unlocked", label: "Нээсэн" },
  { id: "locked", label: "Нээгээгүй" },
  { id: "missable", label: "Алдаж болзошгүй" },
];

export default function Achievements() {
  const { tracker, state, post, demo, status } = useTracker();
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [cat, setCat] = useState<AchCategory | "all">("all");
  const comp = completionPercent(tracker);
  const hints = new Map(achievementHints(tracker).map((h) => [h.ach.name, h.satisfiedBySave]));
  const ach = state?.achievements;

  const rows = useMemo(
    () => ACHIEVEMENTS.map((a) => ({ a, u: achievementUnlocked(tracker, a.name), s: tracker.achievements?.[a.name] })),
    [tracker],
  );
  const perCat = (Object.keys(CAT) as AchCategory[]).map((c) => {
    const list = rows.filter((r) => r.a.category === c);
    return { c, total: list.length, done: list.filter((r) => r.u.unlocked).length };
  });
  const shown = rows.filter(
    (r) =>
      (cat === "all" || r.a.category === cat) &&
      (filter === "all" ||
        (filter === "unlocked" && r.u.unlocked) ||
        (filter === "locked" && !r.u.unlocked) ||
        (filter === "missable" && !!r.a.missableMn && !r.u.unlocked)),
  );
  const recent = rows
    .filter((r) => r.u.unlocked && r.s?.unlockTime)
    .sort((x, y) => (y.s!.unlockTime ?? 0) - (x.s!.unlockTime ?? 0))
    .slice(0, 6);

  async function sync() {
    setBusy(true);
    await post("/api/achievements/sync", {});
    setBusy(false);
  }
  const pct = comp.known ? Math.round((comp.unlocked / comp.total) * 100) : null;

  return (
    <>
      <PageTitle title="Achievement Tracker" sub="Бүх 41 achievement. Төлөв зөвхөн Steam-ээс эсвэл таны гарын баталгаагаар." />

      <Panel className="mb-5 overflow-hidden">
        <div className="ach-hero-glow" aria-hidden />
        <div className="relative grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex justify-center">
            <ProgressRing value={comp.unlocked} total={comp.total}>
              <span className="font-display text-4xl font-semibold leading-none text-gold-200">{pct === null ? "?" : pct}<span className="text-lg text-gold-500">%</span></span>
              <span className="mt-1 font-display text-micro uppercase tracking-caps text-ash-500">{comp.known ? `${comp.unlocked} / ${comp.total}` : "Unknown"}</span>
            </ProgressRing>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:grid-cols-4">
              {perCat.map(({ c, total, done }) => (
                <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(cat === c ? "all" : c)} className={clsx("ach-cat text-left", cat === c && "ach-cat--active")}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-micro font-semibold uppercase tracking-caps text-ash-400">{CAT[c]}</span>
                    <span className="font-display text-xs text-gold-300">{done}/{total}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-ember-600 to-gold-400 transition-[width] duration-700" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                  </div>
                </button>
              ))}
            </div>
            {recent.length > 0 && (
              <div className="mt-5 flex items-center gap-3">
                <span className="font-display text-micro uppercase tracking-caps text-ash-500">Сүүлд нээсэн</span>
                <div className="flex -space-x-2">
                  {recent.map((r) => (
                    <div key={r.a.name} title={`${r.a.name} — ${fmtDate(r.s!.unlockTime! * 1000)}`}>
                      <AchievementIcon name={r.a.name} unlocked synced={r.s} size={36} className="ring-2 ring-stone-950" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 lg:items-end">
            {status === "ready" && (
              <button className="btn btn-ember" onClick={sync} disabled={busy} aria-busy={busy}>
                <RefreshCw size={14} className={clsx(busy && "animate-spin")} />
                {busy ? "Синк…" : "Steam-ээс синк"}
              </button>
            )}
            <p className="max-w-64 text-center text-xs text-ash-500 lg:text-right">
              {ach?.status === "ok" ? `Steam синк: ${fmtDate(ach.fetchedAt)}${(ach as { via?: string }).via === "community" ? " · Steam Community-оос" : ""}` : ach?.status ? STATUS_MN[ach.status] ?? ach.status : "Steam-ээс синк хийгээгүй."}
            </p>
          </div>
        </div>
      </Panel>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="seg" role="group" aria-label="Шүүлтүүр">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} className={clsx("seg__btn", filter === f.id && "seg__btn--on")} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={cat === "all"} className={clsx("chip", cat === "all" && "chip--on")} onClick={() => setCat("all")}>Бүх ангилал</button>
          {(Object.keys(CAT) as AchCategory[]).map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} className={clsx("chip", cat === c && "chip--on")} onClick={() => setCat(c)}>{CAT[c]}</button>
          ))}
        </div>
        <span className="ml-auto font-display text-micro uppercase tracking-caps text-ash-500">{shown.length} achievement</span>
      </div>

      {shown.length === 0 ? (
        <div className="panel border-dashed p-8 text-center font-serif text-lg italic text-ash-400">Энэ шүүлтүүрт тохирох achievement алга.</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map(({ a, u, s }) => {
            const manual = a.name in tracker.manualAchievements;
            const hinted = hints.get(a.name) && !u.unlocked;
            return (
              <li key={a.name} className={clsx("ach-card", u.unlocked ? "ach-card--on" : "ach-card--off")}>
                <AchievementIcon name={a.name} unlocked={u.unlocked} synced={s} size={64} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={clsx("font-display text-base font-semibold leading-snug", u.unlocked ? "text-gold-200" : "text-ash-300")}>{a.name}</h3>
                    <span className="rounded-sm border border-gold-600/30 px-1.5 py-px font-display text-micro tracking-caps text-gold-500">{a.cycle}</span>
                  </div>
                  <p className="mt-0.5 text-xs italic text-ash-500">{a.descEn}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ash-300">{a.howMn}</p>
                  {a.missableMn && <p className="mt-1 text-xs text-warning">⚠ {a.missableMn}</p>}
                  {hinted && <p className="mt-1 text-xs text-success">Save дээр нөхцөл биелсэн харагдаж байна (Inferred).</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={clsx("font-display text-micro font-semibold uppercase tracking-caps", u.unlocked ? "text-ember-300" : "text-ash-500")}>
                      {u.unlocked ? "Unlocked" : u.unlocked === false ? "Locked" : "Unknown"}
                    </span>
                    {u.source && <Badge kind={demo ? "demo" : u.source === "Steam API" ? "steam" : "manual"} />}
                    {s?.unlockTime && <span className="text-label text-ash-500">{fmtDate(s.unlockTime * 1000)}</span>}
                    {status === "ready" && !tracker.achievements && (
                      <button className="btn btn-sm ml-auto" onClick={() => post("/api/manual", { kind: "achievements", id: a.name, value: manual ? null : true })}>
                        {manual ? "Гарын тэмдэг арилгах" : "Гараар тэмдэглэх"}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
