"use client";
import Link from "next/link";
import { Gate } from "@/components/Shell";
import { useSelected, useTracker } from "@/components/TrackerProvider";
import { Badge, Empty, PageTitle, Panel, Stat, fmtAgo, fmtDuration, fmtNum } from "@/components/ui";
import { ItemIcon } from "@/components/ItemIcon";
import { BossThumb } from "@/components/BossThumb";
import { BOSSES } from "@/lib/data/bosses";
import { areaById } from "@/lib/data/areas";
import { BonfireMark } from "@/components/BonfireMark";
import { ArrowUpRight } from "lucide-react";
import { bossStatus, completionPercent, computeObjectives, estimateArea, nextObjective, nextUpgradeAdvice } from "@/lib/guide/engine";

export default function Dashboard() {
  return (
    <Gate>
      <Inner />
    </Gate>
  );
}

function Inner() {
  const { tracker, state, demo, post } = useTracker();
  const sel = useSelected();
  const ch = tracker.character;
  const objectives = computeObjectives(tracker);
  const next = nextObjective(objectives);
  const skipped = objectives.filter((o) => o.status === "skipped");
  const area = estimateArea(tracker);
  const comp = completionPercent(tracker);
  const bosses = BOSSES.map((b) => ({ b, s: bossStatus(b, tracker) }));
  const defeated = bosses.filter((x) => x.s.state === "defeated").length;
  const advice = nextUpgradeAdvice(ch);
  const achStatus = state?.achievements?.status;

  return (
    <>
      <div className="dashboard-chapter">
        <div className="relative z-10"><p className="eyebrow">THE CHRONICLE / {demo ? "DEMO JOURNEY" : "YOUR JOURNEY"}</p><p className="font-serif mt-3 text-3xl text-gold-200 md:text-4xl">The fire still burns.</p><p className="mt-2 text-xs leading-6 text-ash-400">Every soul has a story. This one is yours.</p></div>
        <Link href="/guide" className="btn relative z-10 !text-[10px]">Continue the path <ArrowUpRight size={14} /></Link>
        <BonfireMark className="chapter-bonfire" />
      </div>
      <PageTitle title={ch?.name.value ?? "Live Dashboard"} sub={ch ? `${ch.className.value ?? ""} · Slot ${ch.slot + 1} · ${sel?.source ?? ""} · ${fmtAgo(sel?.updatedAt)}` : "Дүрийн мэдээлэл хүлээгдэж байна"} />
      {!ch && (
        <Empty>
          Save өгөгдөл алга (<b>Waiting for save data</b>). <Link className="text-ember-300 underline" href="/characters">Save upload</Link> эсвэл <Link className="text-ember-300 underline" href="/settings">companion</Link> холбоно уу.
        </Empty>
      )}
      {ch && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Soul Level" value={ch.level.value} certainty={ch.level.certainty} demo={demo} />
          <Stat label="Souls" value={fmtNum(ch.souls.value)} certainty={ch.souls.certainty} demo={demo} />
          <Stat label="Нийт үхэл" value={fmtNum(ch.deaths.value) ?? "Тодорхойгүй"} certainty={ch.deaths.certainty} demo={demo} />
          <Stat label="Тоглосон хугацаа" value={fmtDuration(ch.playTimeSeconds.value) ?? "Тодорхойгүй"} certainty={ch.playTimeSeconds.certainty} demo={demo} />
          <Stat label="NG тойрог" value={ch.ngCycle.value === null ? "Тодорхойгүй" : ch.ngCycle.value === 0 ? "NG" : `NG+${ch.ngCycle.value}`} certainty={ch.ngCycle.certainty} demo={demo} />
          <Stat label="Humanity" value={ch.humanity.value} certainty={ch.humanity.certainty} demo={demo} />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Одоогийн байршил" right={<Badge kind="inference" />}>
          {area.areaId ? (
            <>
              <div className="font-display text-2xl text-gold-300">{areaById(area.areaId)?.name}</div>
              <p className="mt-1 text-xs text-ash-500">Save файл координат хадгалдаггүй тул явцаас тооцоолсон (Inferred).</p>
              <Link href={`/map?focus=${area.areaId}`} className="btn mt-3">Газрын зураг дээр харах</Link>
            </>
          ) : (
            <p className="text-sm text-ash-400">Unknown</p>
          )}
        </Panel>
        <Panel title="Дараагийн зорилт" className="lg:col-span-2" right={<Badge kind="inference" />}>
          {next ? (
            <div>
              <div className="flex items-center gap-3">
                {next.bossIds.slice(0, 3).map((id) => {
                  const b = BOSSES.find((x) => x.id === id)!;
                  return <BossThumb key={id} boss={b} size={48} />;
                })}
                <div className="font-display text-2xl text-gold-300">{next.title}</div>
              </div>
              <p className="mt-2 text-sm text-ash-300">{next.whyMn}</p>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div><span className="text-ash-500">Хаана: </span>{next.whereMn}</div>
                {next.achievement && <div><span className="text-ash-500">Achievement: </span>{next.achievement}</div>}
                {next.avoidMissingMn.length > 0 && <div className="md:col-span-2 text-amber-300">⚠ {next.avoidMissingMn.join(" · ")}</div>}
              </div>
              {skipped.length > 0 && (
                <p className="mt-3 text-xs text-ash-400">
                  <span className="text-amber-300">↷ Алгассан:</span> {skipped.map((o) => o.title).join(" · ")} — өөр замаар цааш явсан тул дараагийн зорилтод тооцохгүй.
                </p>
              )}
              <Link href="/guide" className="btn mt-3">Бүрэн хөтөч</Link>
            </div>
          ) : (
            <p className="text-sm text-ash-400">Үндсэн замын бүх зорилт биелсэн эсвэл өгөгдөл хангалтгүй.</p>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Boss-ууд" right={<Link href="/bosses" className="text-xs text-ember-300">Бүгд →</Link>}>
          <div className="font-display text-3xl text-gold-300">{defeated} <span className="text-lg text-ash-500">/ {BOSSES.length}</span></div>
          <p className="text-xs text-ash-500">Ялсан (verified + inferred + manual). Тодорхойгүй: {bosses.filter((x) => x.s.state === "unknown").length}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {bosses.filter((x) => x.s.state === "defeated").slice(0, 6).map(({ b, s }) => (
              <li key={b.id} className="flex items-center justify-between gap-2">
                <Link href={`/bosses/${b.id}`} className="flex min-w-0 items-center gap-2 hover:text-ember-300"><BossThumb boss={b} defeated size={28} /><span className="truncate">{b.name}</span></Link>
                <Badge kind={demo ? "demo" : s.certainty} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Achievement" right={<Link href="/achievements" className="text-xs text-ember-300">Бүгд →</Link>}>
          {comp.known ? (
            <>
              <div className="font-display text-3xl text-gold-300">{comp.unlocked} <span className="text-lg text-ash-500">/ {comp.total}</span></div>
              <div className="mt-2 h-2 rounded bg-stone-800"><div className="h-2 rounded bg-gradient-to-r from-ember-600 to-gold-400" style={{ width: `${(comp.unlocked / comp.total) * 100}%` }} /></div>
              <p className="mt-2 text-xs text-ash-500">100% хүртэл: {Math.round((comp.unlocked / comp.total) * 100)}% · <Badge kind={demo ? "demo" : "steam"} /></p>
            </>
          ) : (
            <>
              <p className="text-sm text-ash-400">Steam achievement өгөгдөл: <b>{achStatus === "private" ? "Профайл private" : achStatus === "no_key" ? "Steam API key тохируулаагүй" : "Not connected"}</b></p>
              <button className="btn mt-3" onClick={() => post("/api/achievements/sync", {})}>Steam-ээс синк</button>
            </>
          )}
        </Panel>
        <Panel title="Зэвсэг сайжруулах зөвлөмж" right={<Badge kind="inference" />}>
          {advice ? (
            <div className="text-sm">
              <div className="flex items-center gap-2 text-gold-300"><ItemIcon name={advice.weapon.name} category="weapons" size={36} />{advice.weapon.name} → +{advice.nextLevel}</div>
              <p className="text-xs text-ash-500">Хамгийн их сайжруулсан зэвсэг (зүүсэн зэвсэг save-ээс уншигддаггүй).</p>
              <ul className="mt-2 space-y-1.5">
                {advice.needs.map((n) => (
                  <li key={n.material} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><ItemIcon name={n.material} category="goods" size={30} />{n.material} ×{n.qty}</span>
                    <span className={n.missing ? "text-red-300" : "text-emerald-300"}>{n.missing ? `дутуу ${n.missing}` : "хангалттай"} (байгаа {n.have ?? "?"})</span>
                  </li>
                ))}
              </ul>
              {advice.smith && <p className="mt-1 text-xs text-ash-400">Дархан: {advice.smith}{advice.ember ? ` · ${advice.ember}` : ""}</p>}
              <Link href="/upgrades" className="btn mt-3">Төлөвлөгч</Link>
            </div>
          ) : (
            <p className="text-sm text-ash-400">Сайжруулах боломжтой зэвсэг олдсонгүй эсвэл save өгөгдөл алга.</p>
          )}
        </Panel>
      </div>

      {ch && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Attributes">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(ch.stats).map(([k, v]) => (
                <div key={k} className="min-w-0 rounded bg-stone-900/60 px-3 py-2">
                  <div className="truncate text-[10px] uppercase tracking-[0.12em] text-ash-400" title={k}>{k}</div>
                  <div className="font-display text-2xl leading-tight tabular-nums text-gold-300">{v.value ?? "?"}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ash-500">HP {fmtNum(ch.hp.value)} · Stamina {fmtNum(ch.stamina.value)} · <Badge kind={demo ? "demo" : "verified"} /></p>
          </Panel>
          <Panel title="Сүүлийн үйл явдал">
            {(state?.events ?? []).length === 0 ? (
              <p className="text-sm text-ash-400">Хоёр дахь синкээс эхлэн өөрчлөлтүүд энд харагдана.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {state!.events.slice(0, 10).map((e) => (
                  <li key={e.id} className="flex justify-between gap-2">
                    <span>
                      {e.type === "death" && `☠ Үхэл +${e.data.delta}`}
                      {e.type === "boss" && `⚔ Boss ялагдсан: ${e.data.boss}`}
                      {e.type === "level" && `▲ Түвшин ${e.data.from} → ${e.data.to}`}
                      {e.type === "bonfire" && `🔥 Шинэ bonfire: ${(e.data.bonfires as string[]).join(", ")}`}
                      {e.type === "ng" && `↻ NG тойрог ${e.data.from} → ${e.data.to}`}
                    </span>
                    <span className="text-xs text-ash-500">{fmtAgo(e.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
      {ch?.notes.length ? (
        <Panel title="Өгөгдлийн хязгаарлалт" className="mt-4">
          <ul className="list-disc space-y-1 pl-5 text-xs text-ash-400">{ch.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </Panel>
      ) : null}
    </>
  );
}
