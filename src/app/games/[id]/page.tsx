"use client";
import clsx from "clsx";
import { BadgeCheck, CircleHelp, Lock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { AchievementIcon, ProgressRing } from "@/components/AchievementIcon";
import { useOwnership } from "@/components/GameBar";
import { Gate } from "@/components/Shell";
import { useTracker } from "@/components/TrackerProvider";
import { Empty, Loading, PageTitle, Panel, fmtDate } from "@/components/ui";
import { gameById } from "@/lib/games";

const STATUS_MN: Record<string, string> = {
  private: "Steam профайл эсвэл «Game details» private байна — Steam Privacy Settings-ээс Public болгоно уу.",
  not_owned: "Энэ Steam бүртгэлд энэ тоглоомын статистик олдсонгүй.",
  no_key: "Сервер дээр STEAM_API_KEY тохируулаагүй.",
  bad_key: "Steam API key хүчингүй байна.",
  not_linked: "App вэбтэй холбогдоогүй байна. Тохиргоо → «Steam-ээр дахин нэвтэрч синк асаах».",
  cloud_unavailable: "Вэб сервертэй холбогдож чадсангүй. Дараа дахин оролдоно уу.",
  error: "Steam алдаа гаргалаа. Дараа дахин оролдоно уу.",
};

type Filter = "all" | "unlocked" | "locked";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "unlocked", label: "Нээсэн" },
  { id: "locked", label: "Нээгээгүй" },
];

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const g = gameById(id);
  const { state, post, demo } = useTracker();
  const ownership = useOwnership();
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const doc = g ? state?.gameAchievements?.[g.appid] : undefined;
  const rows = useMemo(
    () =>
      Object.entries(doc?.items ?? {})
        .map(([name, a]) => ({ name, ...a }))
        .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || (b.unlockTime ?? 0) - (a.unlockTime ?? 0)),
    [doc],
  );

  if (!g) return <Empty>Тоглоом олдсонгүй.</Empty>;
  if (g.tracker === "full")
    return (
      <Panel className="mx-auto max-w-xl text-center">
        <p className="text-ash-300">{g.title}-ийг save файлаас бүрэн хянадаг.</p>
        <Link className="btn btn-ember mt-4" href="/dashboard">Хяналтын самбар руу</Link>
      </Panel>
    );

  const own = ownership(g);
  const lib = state?.library?.games[g.appid];
  const done = rows.filter((r) => r.unlocked).length;
  const pct = rows.length ? Math.round((done / rows.length) * 100) : null;
  const shown = rows.filter((r) => filter === "all" || (filter === "unlocked" ? r.unlocked : !r.unlocked));
  const recent = rows.filter((r) => r.unlocked && r.unlockTime).slice(0, 6);

  async function sync() {
    if (!g) return;
    setBusy(true);
    try {
      await post("/api/achievements/sync", { appid: g.appid });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title={g.title} sub={`${g.year} · ${g.tagline}`} />
      <Gate>
        <Panel className="mb-5 overflow-hidden">
          <div className="ach-hero-glow" aria-hidden />
          <div className="relative grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex justify-center">
              <ProgressRing value={done} total={rows.length}>
                <span className="font-display text-4xl font-semibold leading-none text-gold-200">{pct ?? "?"}<span className="text-lg text-gold-500">%</span></span>
                <span className="mt-1 font-display text-micro uppercase tracking-caps text-ash-500">{rows.length ? `${done} / ${rows.length}` : "Unknown"}</span>
              </ProgressRing>
            </div>

            <div className="min-w-0 space-y-4">
              <p className="flex items-center gap-2 text-sm" role="status">
                {own === "owned" ? (
                  <><BadgeCheck className="h-4 w-4 shrink-0 text-success" aria-hidden /><span className="text-success">Steam-ээр баталгаажсан — таны бүртгэлд байгаа</span></>
                ) : own === "not_owned" ? (
                  <><Lock className="h-4 w-4 shrink-0 text-ash-500" aria-hidden /><span className="text-ash-300">Энэ Steam бүртгэлд байхгүй</span></>
                ) : (
                  <><CircleHelp className="h-4 w-4 shrink-0 text-ash-500" aria-hidden /><span className="text-ash-300">Эзэмшлийг шалгаж байна…</span></>
                )}
              </p>
              <dl className="grid max-w-md grid-cols-2 gap-2 text-sm">
                <div className="border border-gold-600/15 bg-black/30 px-3 py-2">
                  <dt className="font-display text-micro uppercase tracking-caps text-ash-500">Тоглосон</dt>
                  <dd className="font-display mt-0.5 text-lg text-gold-300">{lib?.playtimeMinutes != null ? `${Math.round(lib.playtimeMinutes / 60)} цаг` : "—"}</dd>
                </div>
                <div className="border border-gold-600/15 bg-black/30 px-3 py-2">
                  <dt className="font-display text-micro uppercase tracking-caps text-ash-500">Сүүлд тоглосон</dt>
                  <dd className="font-display mt-0.5 text-lg text-gold-300">{lib?.lastPlayed ? fmtDate(lib.lastPlayed * 1000) : "—"}</dd>
                </div>
              </dl>
              {recent.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="font-display text-micro uppercase tracking-caps text-ash-500">Сүүлд нээсэн</span>
                  <div className="flex -space-x-2">
                    {recent.map((r) => (
                      <div key={r.apiName} title={`${r.name} — ${fmtDate(r.unlockTime! * 1000)}`}>
                        <AchievementIcon name={r.name} unlocked synced={r} size={36} className="ring-2 ring-stone-950" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 lg:items-end">
              {!demo && own !== "not_owned" && (
                <button className="btn btn-ember" disabled={busy} aria-busy={busy} onClick={() => void sync()}>
                  <RefreshCw size={14} className={clsx(busy && "animate-spin")} aria-hidden />
                  {busy ? "Синк…" : "Steam-ээс синк"}
                </button>
              )}
              <p className="max-w-64 text-center text-xs text-ash-500 lg:text-right">
                {doc?.status === "ok" ? `Steam синк: ${fmtDate(doc.checkedAt)}` : doc?.status ? STATUS_MN[doc.status] ?? STATUS_MN.error : own === "not_owned" ? "" : "Steam-ээс синк хийгээгүй."}
              </p>
            </div>
          </div>
        </Panel>

        {own === "not_owned" ? (
          <Empty>Steam-ийн мэдээллээр энэ бүртгэл {g.title}-ийг эзэмшдэггүй. Худалдаж авсан бол дээрх «Steam шалгах» товчийг дарна уу.</Empty>
        ) : rows.length === 0 ? (
          doc?.status && doc.status !== "ok" ? (
            <Empty>{STATUS_MN[doc.status] ?? STATUS_MN.error}</Empty>
          ) : demo ? (
            // Demo mode never talks to Steam, so there is nothing to wait for.
            <Empty>Demo Mode-д энэ тоглоомын жишээ achievement байхгүй. Steam-ээр нэвтэрч өөрийн ахицаа харна уу.</Empty>
          ) : (
            <Loading label="Steam-ээс achievement татаж байна…" />
          )
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="seg" role="group" aria-label="Шүүлтүүр">
                {FILTERS.map((f) => (
                  <button key={f.id} type="button" aria-pressed={filter === f.id} className={clsx("seg__btn", filter === f.id && "seg__btn--on")} onClick={() => setFilter(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="ml-auto font-display text-micro uppercase tracking-caps text-ash-500">{shown.length} achievement</span>
            </div>
            {shown.length === 0 ? (
              <Empty>Энэ шүүлтүүрт тохирох achievement алга.</Empty>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {shown.map((a) => (
                  <li key={a.apiName} className={clsx("ach-card", a.unlocked ? "ach-card--on" : "ach-card--off")}>
                    <AchievementIcon name={a.name} unlocked={a.unlocked} synced={{ icon: a.icon, iconGray: a.iconGray }} size={64} />
                    <div className="min-w-0 flex-1">
                      <h3 className={clsx("font-display text-base font-semibold leading-snug", a.unlocked ? "text-gold-200" : "text-ash-300")}>{a.name}</h3>
                      {a.description && <p className="mt-1 text-sm leading-relaxed text-ash-400">{a.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={clsx("font-display text-micro font-semibold uppercase tracking-caps", a.unlocked ? "text-ember-300" : "text-ash-500")}>{a.unlocked ? "Unlocked" : "Locked"}</span>
                        {a.unlockTime && <span className="text-label text-ash-500">{fmtDate(a.unlockTime * 1000)}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Gate>
    </>
  );
}
