"use client";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, PageTitle, Panel } from "@/components/ui";
import { QUESTS } from "@/lib/data/npcs";
import { areaById } from "@/lib/data/areas";

export default function Quests() {
  const { tracker, state, post, status, demo } = useTracker();
  const wf = tracker.character?.worldFlags.value ?? null;
  const manual = state?.manual?.quests ?? {};
  const flagSet = (cat: string, name: string) => (wf ? !!wf[cat]?.includes(name) : null);
  return (
    <>
      <PageTitle title="NPC Quest Tracker" sub="Save дээр баталгаажсан flag-тай алхмыг Verified, бусдыг таны тэмдэглэлээр (User confirmation) харуулна." />
      <div className="grid gap-4 lg:grid-cols-2">
        {QUESTS.map((q) => {
          const done = new Set(manual[q.id] ?? []);
          const dead = q.deathFlag ? flagSet("NPC", q.deathFlag) : null;
          return (
            <Panel key={q.id} title={q.npc} right={dead ? <span className="text-xs text-danger">☠ Нас барсан <Badge kind={demo ? "demo" : "verified"} /></span> : undefined}>
              <p className="text-sm text-ash-400">{q.mn}</p>
              <ol className="relative mt-4 space-y-3 border-l border-gold-600/30 pl-5">
                {q.stages.map((s) => {
                  const flagged = s.flag ? flagSet(s.flag.category, s.flag.name) : null;
                  const isDone = flagged === true || done.has(s.id);
                  return (
                    <li key={s.id} className="relative">
                      <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border ${isDone ? "border-ember-300 bg-ember-500" : "border-gold-600 bg-stone-900"}`} />
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className={isDone ? "text-gold-300" : "text-ash-300"}>{s.mn}</span>
                        {s.area && <span className="text-label text-ash-500">({areaById(s.area)?.name})</span>}
                        {flagged === true && <Badge kind={demo ? "demo" : "verified"} />}
                        {flagged !== true && done.has(s.id) && <Badge kind="manual" />}
                      </div>
                      {s.decisionMn && <p className="text-xs text-warning">⚖ {s.decisionMn}</p>}
                      {status === "ready" && flagged !== true && (
                        <button className="mt-1 text-label text-ember-300 underline" onClick={() => {
                          const next = new Set(done);
                          if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                          post("/api/manual", { kind: "quests", id: q.id, value: [...next] });
                        }}>{done.has(s.id) ? "Тэмдэг арилгах" : "Хийсэн гэж тэмдэглэх"}</button>
                      )}
                    </li>
                  );
                })}
              </ol>
              {q.failureMn.length > 0 && <div className="mt-3 text-xs text-danger">✗ {q.failureMn.join(" · ")}</div>}
              <div className="mt-2 text-xs text-ash-400">Шагнал: {q.rewardsMn.join(" · ")}</div>
              {q.missableMn && <div className="mt-1 text-xs text-warning">⚠ Missable: {q.missableMn}</div>}
            </Panel>
          );
        })}
      </div>
    </>
  );
}
