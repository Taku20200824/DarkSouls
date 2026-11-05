"use client";
import { use } from "react";
import Link from "next/link";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, PageTitle, Panel, Sigil } from "@/components/ui";
import { bossById } from "@/lib/data/bosses";
import { areaById } from "@/lib/data/areas";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import { bossStatus } from "@/lib/guide/engine";

export default function BossPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const b = bossById(id);
  const { tracker, demo, post, status } = useTracker();
  if (!b) return <p className="text-ash-400">Boss олдсонгүй.</p>;
  const s = bossStatus(b, tracker);
  const related = ACHIEVEMENTS.filter((a) => b.achievementEvidence?.includes(a.name) || a.name === b.achievement);
  const manual = tracker.manualBosses[b.id];
  return (
    <>
      <PageTitle title={b.name} sub={`${areaById(b.area)?.name} · ${b.dlc ? "DLC" : b.optional ? "Optional" : "Mandatory"}`} />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Panel>
          <div className="flex justify-center"><Sigil text={b.sigil} defeated={s.state === "defeated"} size={140} /></div>
          <div className="mt-4 text-center">
            <div className={`font-display text-2xl ${s.state === "defeated" ? "text-emerald-300" : s.state === "alive" ? "text-red-300" : "text-ash-400"}`}>{s.state === "defeated" ? "DEFEATED" : s.state === "alive" ? "ALIVE" : "UNKNOWN"}</div>
            <Badge kind={demo ? "demo" : s.certainty} />
          </div>
          <ul className="mt-3 space-y-1 text-xs text-ash-400">{s.sources.map((x) => <li key={x}>• {x}</li>)}</ul>
          {status === "ready" && s.certainty !== "verified" && s.certainty !== "inferred" && (
            <button className="btn mt-4 w-full justify-center text-xs" onClick={() => post("/api/manual", { kind: "bosses", id: b.id, value: manual ? null : true })}>
              {manual ? "Гарын баталгааг цуцлах" : "Ялсан гэж гараар баталгаажуулах"}
            </button>
          )}
        </Panel>
        <div className="space-y-4">
          <Panel title="Стратеги">
            <p className="text-ash-300">{b.strategyMn}</p>
            <h4 className="mt-3 text-xs uppercase tracking-widest text-ash-500">Довтолгооны хэв маяг</h4>
            <ul className="mt-1 list-disc pl-5 text-sm">{b.attacksMn.map((a) => <li key={a}>{a}</li>)}</ul>
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Сул тал / тэсвэр">
              <p className="text-sm">{b.weakMn ?? <span className="text-ash-500">Сул тал: баталгаажсан мэдээлэл оруулаагүй.</span>}</p>
              {b.resistMn && <p className="mt-1 text-sm">{b.resistMn}</p>}
              {b.weaponsMn && <p className="mt-1 text-sm text-ash-300">Зэвсэг: {b.weaponsMn}</p>}
            </Panel>
            <Panel title="Тусламж (Summon)"><p className="text-sm">{b.summonMn ?? <span className="text-ash-500">Мэдээлэл оруулаагүй.</span>}</p></Panel>
            <Panel title="Шагнал">
              <p className="text-sm">Boss Soul: {b.soul ?? <span className="text-ash-500">байхгүй / —</span>}</p>
              {b.soulWeapons && <p className="mt-1 text-sm">Soul зэвсэг: {b.soulWeapons.join(", ")}</p>}
              {b.tailCut && <p className="mt-1 text-sm text-amber-300">✂ Сүүл тасдахад: {b.tailCut} — boss-ыг алахаас өмнө!</p>}
            </Panel>
            <Panel title="Achievement / NG+">
              {related.length ? <ul className="text-sm">{related.map((a) => <li key={a.name}><Link href="/achievements" className="text-gold-300 hover:text-ember-300">{a.name}</Link></li>)}</ul> : <p className="text-sm text-ash-500">Шууд холбоотой achievement алга.</p>}
              {b.ngMn && <p className="mt-2 text-sm text-ash-300">{b.ngMn}</p>}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
