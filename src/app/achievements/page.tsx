"use client";
import { useState } from "react";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, PageTitle, Panel, fmtDate } from "@/components/ui";
import { ACHIEVEMENTS, type AchCategory } from "@/lib/data/achievements";
import { achievementHints, achievementUnlocked, completionPercent } from "@/lib/guide/engine";

const CAT: Record<AchCategory, string> = { story: "Түүх", boss: "Boss", covenant: "Covenant", weapon: "Зэвсэг", collection: "Цуглуулга", ending: "Төгсгөл", meta: "Platinum" };
const STATUS_MN: Record<string, string> = {
  private: "Steam профайл эсвэл 'Game details' private байна — Steam Privacy Settings-ээс Public болгоно уу.",
  no_key: "Сервер дээр STEAM_API_KEY тохируулаагүй.",
  not_owned: "Энэ бүртгэлд Dark Souls: Remastered-ийн статистик олдсонгүй.",
  error: "Steam API алдаа гаргалаа. Дараа дахин оролдоно уу.",
};

export default function Achievements() {
  const { tracker, state, post, demo, status } = useTracker();
  const [busy, setBusy] = useState(false);
  const comp = completionPercent(tracker);
  const hints = new Map(achievementHints(tracker).map((h) => [h.ach.name, h.satisfiedBySave]));
  const ach = state?.achievements;
  async function sync() {
    setBusy(true);
    await post("/api/achievements/sync", {});
    setBusy(false);
  }
  return (
    <>
      <PageTitle title="Achievement Tracker" sub="Бүх 41 achievement. Төлөв зөвхөн Steam-ээс эсвэл таны гарын баталгаагаар." />
      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="font-display text-4xl text-gold-300">{comp.known ? `${comp.unlocked}/${comp.total}` : "Unknown"}</div>
          <div className="min-w-48 flex-1">
            <div className="h-2 rounded bg-stone-800"><div className="h-2 rounded bg-gradient-to-r from-ember-600 to-gold-400" style={{ width: `${comp.known ? (comp.unlocked / comp.total) * 100 : 0}%` }} /></div>
            <p className="mt-1 text-xs text-ash-500">{ach?.status === "ok" ? `Steam синк: ${fmtDate(ach.fetchedAt)}` : ach?.status ? STATUS_MN[ach.status] ?? ach.status : "Steam-ээс синк хийгээгүй."}</p>
          </div>
          {status === "ready" && <button className="btn btn-ember" onClick={sync} disabled={busy} aria-busy={busy}>{busy ? "Синк…" : "Steam-ээс синк"}</button>}
        </div>
      </Panel>
      {(Object.keys(CAT) as AchCategory[]).map((cat) => (
        <Panel key={cat} title={CAT[cat]} className="mb-4">
          <ul className="divide-y divide-gold-600/10">
            {ACHIEVEMENTS.filter((a) => a.category === cat).map((a) => {
              const u = achievementUnlocked(tracker, a.name);
              const s = tracker.achievements?.[a.name];
              const manual = a.name in tracker.manualAchievements;
              return (
                <li key={a.name} className="flex flex-wrap items-start gap-3 py-3">
                  {s?.icon ? <img src={u.unlocked ? s.icon : s.iconGray ?? s.icon} alt="" width={48} height={48} className="rounded border border-gold-600/30" /> : <div className="flex h-12 w-12 items-center justify-center rounded border border-gold-600/30 bg-stone-900 text-gold-500">✦</div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={u.unlocked ? "font-display text-lg text-gold-300" : "font-display text-lg text-ash-400"}>{a.name}</span>
                      <span className={u.unlocked ? "text-xs text-success" : u.unlocked === false ? "text-xs text-ash-500" : "text-xs text-ash-500"}>{u.unlocked ? "Unlocked" : u.unlocked === false ? "Locked" : "Unknown"}</span>
                      {u.source && <Badge kind={demo ? "demo" : u.source === "Steam API" ? "steam" : "manual"} />}
                      <span className="rounded bg-stone-800 px-1.5 text-micro text-ash-400">{a.cycle}</span>
                    </div>
                    <p className="text-xs text-ash-500">{a.descEn}</p>
                    <p className="text-sm text-ash-300">{a.howMn}</p>
                    {a.missableMn && <p className="text-xs text-warning">⚠ {a.missableMn}</p>}
                    {hints.get(a.name) && !u.unlocked && <p className="text-xs text-success">Save дээр нөхцөл биелсэн харагдаж байна (Inferred).</p>}
                    {s?.unlockTime && <p className="text-label text-ash-500">Нээсэн: {fmtDate(s.unlockTime * 1000)}</p>}
                  </div>
                  {status === "ready" && !tracker.achievements && (
                    <button className="btn btn-sm" onClick={() => post("/api/manual", { kind: "achievements", id: a.name, value: manual ? null : true })}>{manual ? "Гарын тэмдэг арилгах" : "Гараар тэмдэглэх"}</button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      ))}
    </>
  );
}
