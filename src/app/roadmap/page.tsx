"use client";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, PageTitle, Panel } from "@/components/ui";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import { achievementUnlocked, beforeNgPlus } from "@/lib/guide/engine";

const CYCLES = [
  { id: "NG", title: "NG — FIRST JOURNEY", mn: "Судлах, гол ба сонголтот boss-ууд, DLC, NPC quest, сүүл тасдах зэвсэг, covenant-ууд, анхны төгсгөл." },
  { id: "NG+", title: "NG+ — SECOND JOURNEY", mn: "Нөгөө төгсгөл, давхар Boss Soul, үлдсэн зэвсэг ба шившлэг, covenant-ын ахиц, орхигдсон цуглуулга." },
  { id: "NG++", title: "NG++ — FINAL JOURNEY", mn: "Сүүлчийн boss-soul зэвсгүүд (жишээ нь гурав дахь Soul of Sif), Knight's Honor, үлдсэн achievement, 100% баталгаажуулалт." },
] as const;

export default function Roadmap() {
  const { tracker, demo } = useTracker();
  const ng = tracker.character?.ngCycle.value;
  const checklist = beforeNgPlus(tracker);
  return (
    <>
      <PageTitle title="NG → NG+ → NG++ Roadmap" sub={`Одоогийн тойрог: ${ng === null || ng === undefined ? "Unknown" : ng === 0 ? "NG" : `NG+${ng}`}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        {CYCLES.map((c, i) => {
          const list = ACHIEVEMENTS.filter((a) => a.cycle === c.id);
          const active = ng !== null && ng !== undefined && Math.min(ng, 2) === i;
          return (
            <Panel key={c.id} title={c.title} className={active ? "ring-1 ring-ember-400" : ""} right={active ? <span className="text-xs text-ember-300">ОДОО</span> : undefined}>
              <p className="text-sm text-ash-400">{c.mn}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {list.map((a) => {
                  const u = achievementUnlocked(tracker, a.name);
                  return <li key={a.name} className="flex justify-between gap-2"><span className={u.unlocked ? "text-ash-500 line-through" : "text-gold-300"}>{a.name}</span><span className="text-xs">{u.unlocked ? "✓" : u.unlocked === false ? "—" : "?"}</span></li>;
                })}
              </ul>
            </Panel>
          );
        })}
      </div>
      <Panel title="NG+ эхлэхээс ӨМНӨ дуусгах" className="mt-4">
        <ul className="space-y-2 text-sm">
          {checklist.map((c) => (
            <li key={c.mn} className="flex items-center justify-between gap-2">
              <span>{c.mn}</span>
              <span className="flex items-center gap-1">{c.done === true ? <span className="text-emerald-300">✓</span> : c.done === false ? <span className="text-red-300">✗</span> : <span className="text-ash-500">Unknown</span>}{c.done !== null && <Badge kind={demo ? "demo" : "inferred"} />}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ash-500">Gwyn-ийг ялж төгсгөлөө сонгомогц NG+ шууд эхэлнэ — буцах боломжгүй.</p>
      </Panel>
    </>
  );
}
