"use client";
import clsx from "clsx";
import { BadgeCheck, CircleHelp, Lock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { AchievementIcon, ProgressRing } from "@/components/AchievementIcon";
import { useOwnership } from "@/components/GameBar";
import { Gate } from "@/components/Shell";
import { useTracker } from "@/components/TrackerProvider";
import { PageTitle, Panel, fmtDate } from "@/components/ui";
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

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const g = gameById(id);
  const { state, post, demo, setGame } = useTracker();
  const ownership = useOwnership();
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(() => {
    if (g) setGame(g.id);
  }, [g, setGame]);

  const doc = g ? state?.gameAchievements?.[g.appid] : undefined;
  const rows = useMemo(
    () =>
      Object.entries(doc?.items ?? {})
        .map(([name, a]) => ({ name, ...a }))
        .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || (b.unlockTime ?? 0) - (a.unlockTime ?? 0)),
    [doc],
  );

  if (!g) return <p className="text-ash-400">Тоглоом олдсонгүй.</p>;
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
  const shown = rows.filter((r) => filter === "all" || (filter === "unlocked" ? r.unlocked : !r.unlocked));

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
      <PageTitle title={g.title} sub={`${g.year} · Steam achievement ба тоглосон цаг`} />
      <Gate>
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Panel>
            <div className="flex flex-col items-center text-center">
              <ProgressRing value={done} total={rows.length}>
                <span className="font-display text-3xl text-gold-200">{rows.length ? Math.round((done / rows.length) * 100) : 0}%</span>
                <span className="text-micro text-ash-500">{done} / {rows.length || "—"}</span>
              </ProgressRing>
              <div className="mt-4 flex items-center gap-2 text-sm">
                {own === "owned" ? (
                  <><BadgeCheck className="h-4 w-4 text-success" /><span className="text-success">Steam-ээр баталгаажсан</span></>
                ) : own === "not_owned" ? (
                  <><Lock className="h-4 w-4 text-ash-500" /><span className="text-ash-400">Энэ Steam бүртгэлд байхгүй</span></>
                ) : (
                  <><CircleHelp className="h-4 w-4 text-ash-500" /><span className="text-ash-400">Эзэмшил тодорхойгүй</span></>
                )}
              </div>
              <dl className="mt-4 grid w-full grid-cols-2 gap-2 text-left text-sm">
                <div className="border border-gold-600/15 bg-black/30 p-2">
                  <dt className="text-micro text-ash-500">Тоглосон</dt>
                  <dd className="font-display text-gold-300">{lib?.playtimeMinutes != null ? `${Math.round(lib.playtimeMinutes / 60)} цаг` : "—"}</dd>
                </div>
                <div className="border border-gold-600/15 bg-black/30 p-2">
                  <dt className="text-micro text-ash-500">Сүүлд</dt>
                  <dd className="font-display text-gold-300">{lib?.lastPlayed ? fmtDate(lib.lastPlayed * 1000) : "—"}</dd>
                </div>
              </dl>
              {!demo && own !== "not_owned" && (
                <button className="btn btn-sm mt-4" disabled={busy} aria-busy={busy} onClick={() => void sync()}>
                  <RefreshCw className={clsx("h-3.5 w-3.5", busy && "animate-spin")} /> Achievement шинэчлэх
                </button>
              )}
              {doc?.checkedAt && <p className="mt-2 text-micro text-ash-500">Шалгасан: {fmtDate(doc.checkedAt)}</p>}
            </div>
          </Panel>

          <Panel
            title="Achievement"
            right={
              rows.length > 0 && (
                <div className="flex gap-1" role="group" aria-label="Шүүлтүүр">
                  {(["all", "unlocked", "locked"] as Filter[]).map((f) => (
                    <button key={f} className={clsx("btn btn-sm", filter === f && "btn-ember")} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                      {f === "all" ? "Бүгд" : f === "unlocked" ? "Нээсэн" : "Нээгээгүй"}
                    </button>
                  ))}
                </div>
              )
            }
          >
            {own === "not_owned" ? (
              <p className="text-sm text-ash-400">
                Steam-ийн мэдээллээр энэ бүртгэл {g.title}-ийг эзэмшдэггүй. Худалдаж авсан бол дээрх «Steam шалгах» товчийг дарна уу.
              </p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-ash-400">{doc?.status && doc.status !== "ok" ? STATUS_MN[doc.status] ?? STATUS_MN.error : "Steam-ээс achievement татаж байна…"}</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {shown.map((a) => (
                  <li key={a.apiName} className={clsx("flex items-center gap-3 border p-2", a.unlocked ? "border-ember-500/30 bg-ember-500/5" : "border-gold-600/10 bg-black/20")}>
                    <AchievementIcon name={a.name} unlocked={a.unlocked} synced={{ icon: a.icon, iconGray: a.iconGray }} size={48} />
                    <div className="min-w-0">
                      <div className={clsx("truncate text-sm", a.unlocked ? "text-gold-200" : "text-ash-300")}>{a.name}</div>
                      {a.description && <div className="line-clamp-2 text-micro text-ash-500">{a.description}</div>}
                      {a.unlockTime && <div className="text-micro text-ember-300">{fmtDate(a.unlockTime * 1000)}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </Gate>
    </>
  );
}
