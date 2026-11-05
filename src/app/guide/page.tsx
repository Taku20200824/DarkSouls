"use client";
import Link from "next/link";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, PageTitle, Panel } from "@/components/ui";
import { areaById } from "@/lib/data/areas";
import { achievementHints, achievementUnlocked, computeObjectives, estimateArea, nextRoute, nextUpgradeAdvice } from "@/lib/guide/engine";

export default function Guide() {
  const { tracker, demo } = useTracker();
  const objectives = computeObjectives(tracker);
  const next = objectives.find((o) => !o.done);
  const cur = estimateArea(tracker).areaId;
  const route = next ? nextRoute(cur, next.area) : [];
  const advice = nextUpgradeAdvice(tracker.character);
  const hints = achievementHints(tracker).filter((h) => h.satisfiedBySave && achievementUnlocked(tracker, h.ach.name).unlocked !== true);
  const noData = !tracker.character && !tracker.achievements;
  return (
    <>
      <PageTitle title="Personalized 100% Guide" sub="Таны save болон Steam өгөгдөлд тулгуурласан дараагийн алхмууд." />
      {noData && <p className="mb-4 rounded border border-ash-500/40 p-3 text-sm text-ash-400">Өгөгдөл холбогдоогүй тул доорх жагсаалт ерөнхий дараалал (бүгд “Unknown”).</p>}
      {next && (
        <Panel title={<>Дараагийн зорилт: {next.title}</>} right={<Badge kind={demo ? "demo" : "inference"} />}>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <Info k="Яагаад чухал" v={next.whyMn} />
            <Info k="Хаашаа явах" v={`${next.whereMn} (${areaById(next.area)?.name})`} />
            <Info k="Цуглуулах" v={next.collectMn.join(", ")} />
            <Info k="Дайснууд" v={next.enemiesMn.join(", ")} />
            <Info k="Алдаж болохгүй" v={next.avoidMissingMn.join(" · ") || "—"} warn />
            <Info k="Бэлтгэл" v={next.prepareMn.join(" · ")} />
            {next.achievement && <Info k="Холбогдох achievement" v={next.achievement} />}
            <Info k="Маршрут" v={route.map((r) => areaById(r)?.name).join(" → ") || "—"} />
          </div>
          <Link href={`/map?focus=${next.area}`} className="btn mt-4">Газрын зураг</Link>
        </Panel>
      )}
      {advice && (
        <Panel title="Зэвсгийн бэлтгэл" className="mt-4" right={<Badge kind="inference" />}>
          <p className="text-sm">{advice.weapon.name} → +{advice.nextLevel}: {advice.needs.map((n) => `${n.material} ×${n.qty}${n.missing ? ` (дутуу ${n.missing})` : ""}`).join(", ")}</p>
        </Panel>
      )}
      {hints.length > 0 && (
        <Panel title="Save-ийн дагуу нээгдэх боломжтой achievement" className="mt-4">
          <ul className="space-y-1 text-sm">{hints.map((h) => <li key={h.ach.name}>✦ {h.ach.name} <span className="text-ash-500">— save дээр нөхцөл биелсэн харагдаж байна, Steam синк хийж шалгана уу.</span></li>)}</ul>
        </Panel>
      )}
      <Panel title="Үндсэн замын явц" className="mt-4">
        <ol className="space-y-2">
          {objectives.map((o, i) => (
            <li key={o.id} className={`flex items-start gap-3 rounded p-2 ${o === next ? "bg-ember-600/10 ring-1 ring-ember-500/40" : ""}`}>
              <span className={`font-display mt-0.5 w-6 text-right ${o.done ? "text-emerald-300" : "text-ash-500"}`}>{o.done ? "✓" : i + 1}</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className={o.done ? "text-ash-400 line-through" : "text-gold-300"}>{o.title}</span>{o.done && <Badge kind={demo ? "demo" : o.doneCertainty} />}</div>
                <div className="text-xs text-ash-500">{o.whyMn}</div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}

function Info({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-ash-500">{k}</div>
      <div className={warn ? "text-amber-300" : "text-ash-300"}>{v}</div>
    </div>
  );
}
