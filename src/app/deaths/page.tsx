"use client";
import { useMemo } from "react";
import { Gate } from "@/components/Shell";
import { useSelected, useTracker } from "@/components/TrackerProvider";
import { Badge, Empty, PageTitle, Panel, Stat, fmtDate } from "@/components/ui";
import { BOSSES } from "@/lib/data/bosses";
import { BossThumb } from "@/components/BossThumb";
import type { ClientEvent } from "@/lib/client/types";
import { deathStats } from "@/lib/deaths";

const fmtSpan = (ms: number) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} мин` : `${Math.floor(m / 60)}ц ${String(m % 60).padStart(2, "0")}м`;
};

export default function Deaths() {
  return (
    <Gate>
      <Inner />
    </Gate>
  );
}

function Inner() {
  const { state, tracker, demo, post } = useTracker();
  const sel = useSelected();
  const ch = tracker.character;
  const key = sel?.id;
  const deaths = useMemo(() => (state?.events ?? []).filter((e) => e.type === "death" && (demo || e.charKey === key)).sort((a, b) => a.at - b.at), [state, key, demo]);
  const snaps = useMemo(() => (state?.snapshots ?? []).filter((s) => (demo || s.charKey === key) && s.deaths !== null).sort((a, b) => a.at - b.at), [state, key, demo]);

  const delta = (e: ClientEvent) => Number(e.data.delta ?? 0);
  const total = ch?.deaths.value ?? null;

  const stats = useMemo(() => deathStats(deaths, snaps), [deaths, snaps]);
  const perDay = stats.perDay;
  const dayMax = Math.max(1, ...perDay.map(([, n]) => n));
  const perNg = new Map<number, { min: number; max: number }>();
  for (const s of snaps) {
    if (s.ng === null || s.deaths === null) continue;
    const r = perNg.get(s.ng) ?? { min: s.deaths, max: s.deaths };
    r.min = Math.min(r.min, s.deaths);
    r.max = Math.max(r.max, s.deaths);
    perNg.set(s.ng, r);
  }
  const byBoss = new Map<string, number>();
  for (const d of deaths) if (d.attribution?.label === "User confirmation" && d.attribution.bossId) byBoss.set(d.attribution.bossId, (byBoss.get(d.attribution.bossId) ?? 0) + delta(d));
  const hardest = [...byBoss.entries()].sort((a, b) => b[1] - a[1]);

  // Trend chart
  const W = 600, H = 160;
  const pts = snaps.map((s) => ({ t: s.at, v: s.deaths! }));
  const t0 = pts[0]?.t ?? 0, t1 = pts[pts.length - 1]?.t ?? 1;
  const v0 = Math.min(...pts.map((p) => p.v), 0), v1 = Math.max(...pts.map((p) => p.v), 1);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${((p.t - t0) / Math.max(1, t1 - t0)) * W},${H - ((p.v - v0) / Math.max(1, v1 - v0)) * H}`).join(" ");

  return (
    <>
      <PageTitle title="YOU DIED — Analytics" sub="Save дахь нийт тооллогын өөрчлөлтийг snapshot бүрээр харьцуулж үхлийг илрүүлнэ." />
      {!ch ? <Empty>Save өгөгдөл алга (Waiting for save data).</Empty> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Нийт үхэл" value={total ?? "Тодорхойгүй"} certainty={ch.deaths.certainty} demo={demo} />
            <Stat label="Энэ session" value={stats.sessionLive ? stats.session : "—"} certainty={stats.sessionLive ? "inferred" : "unknown"} demo={demo} hint={stats.sessionLive ? "Одоогийн тоглолт (2 цагаас бага завсартай)" : "Сүүлийн 2 цагт тоглоогүй"} />
            <Stat label="Өнөөдөр" value={stats.today} certainty="inferred" demo={demo} hint="Өнөөдөр болсон нь тодорхой үхэл" />
            <Stat label="Үхэлгүй хамгийн урт" value={stats.longestAliveMs ? fmtSpan(stats.longestAliveMs) : "—"} certainty={stats.longestAliveMs ? "inferred" : "unknown"} demo={demo} hint="Тоглож байх үеийн хамгийн урт хугацаа" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Үхлийн чиг хандлага" right={<Badge kind={demo ? "demo" : "save"} />}>
              {pts.length < 2 ? <p className="text-sm text-ash-500">Хоёроос дээш синк хэрэгтэй.</p> : (
                <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full"><path d={path} fill="none" stroke="#ff8a3d" strokeWidth="2" /></svg>
              )}
            </Panel>
            <Panel title="Өдөр тутмын үхэл">
              {perDay.length === 0 ? <p className="text-sm text-ash-500">Өдөр нь тодорхой үхэл алга.</p> : (
                <ul className="space-y-1.5 text-sm">{perDay.slice(-10).map(([d, n]) => (
                  <li key={d} className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-2">
                    <span className="text-ash-500">{d}</span>
                    <span className="h-2 overflow-hidden rounded bg-stone-800"><span className="block h-full rounded bg-blood-500" style={{ width: `${(n / dayMax) * 100}%` }} /></span>
                    <span className="text-right tabular-nums">{n}</span>
                  </li>
                ))}</ul>
              )}
              {stats.undated > 0 && (
                <p className="mt-3 border-t border-gold-600/10 pt-3 text-xs text-ash-400">
                  + {stats.undated} үхэл save синк хийгдээгүй хугацаанд (апп хаалттай байх үед) болсон тул аль өдөр болсныг тодорхойлох боломжгүй — өдөр болон session-д тооцоогүй. Нийт үхэлд орсон.
                </p>
              )}
            </Panel>
            <Panel title="NG тойрог тутам (хянаж эхэлснээс)">
              {perNg.size === 0 ? <p className="text-sm text-ash-500">Мэдээлэл алга.</p> : <ul className="text-sm">{[...perNg.entries()].map(([ng, r]) => <li key={ng}>{ng === 0 ? "NG" : `NG+${ng}`}: {r.max - r.min} үхэл (хянаж байх хугацаанд)</li>)}</ul>}
            </Panel>
            <Panel title="Хамгийн хэцүү тулаан">
              {hardest.length === 0 ? <p className="text-sm text-ash-500">Unconfirmed — үхлийг boss-д хамааруулах найдвартай өгөгдөл save-д алга. Доорх жагсаалтаас өөрөө тэмдэглэж болно.</p> : (
                <ul className="space-y-1.5 text-sm">{hardest.map(([id, n]) => {
                  const b = BOSSES.find((x) => x.id === id);
                  return <li key={id} className="flex items-center gap-2">{b && <BossThumb boss={b} defeated size={28} />}{b?.name}: {n} <Badge kind="manual" /></li>;
                })}</ul>
              )}
              <p className="mt-2 text-xs text-ash-500">Bonfire хоорондын үхэл: save файл үхэл бүрийн байршлыг хадгалдаггүй тул <b>Unconfirmed</b>.</p>
            </Panel>
          </div>
          <Panel title="Илрүүлсэн үхлүүд" className="mt-4">
            {deaths.length === 0 ? <p className="text-sm text-ash-500">Хоёр дахь синкээс эхлэн үхэл илрүүлнэ.</p> : (
              <ul className="divide-y divide-gold-600/10 text-sm">
                {[...deaths].reverse().slice(0, 50).map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>☠ +{delta(d)} <span className="text-ash-500">({String(d.data.from)} → {String(d.data.to)}) · {fmtDate(d.at)}</span></span>
                    <span className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                      <Badge kind={d.attribution?.label === "User confirmation" ? "manual" : "unknown"}>{d.attribution?.label === "User confirmation" ? "Хэрэглэгч баталсан" : "Баталгаажаагүй"}</Badge>
                      <select className="input input-sm max-w-full" aria-label={`Үхлийн шалтгаан: ${fmtDate(d.at)}`} value={d.attribution?.bossId ?? ""} onChange={(e) => post("/api/events/tag", { id: d.id, bossId: e.target.value || null, areaId: null })}>
                        <option value="">— шалтгаан —</option>
                        {BOSSES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
