"use client";
import Link from "next/link";
import { Gate } from "@/components/Shell";
import { useTracker } from "@/components/TrackerProvider";
import { SaveUpload } from "@/components/SaveUpload";
import { Badge, Empty, PageTitle, Panel, fmtAgo, fmtDuration } from "@/components/ui";

export default function Characters() {
  return (
    <Gate>
      <Inner />
    </Gate>
  );
}

function Inner() {
  const { state, select, selectedKey, demo } = useTracker();
  const chars = state?.characters ?? [];
  return (
    <>
      <PageTitle title="Дүр сонгох" sub="Character Selection — save файлын slot бүр тусдаа дүр." />
      {chars.length === 0 ? (
        <Empty>Одоогоор дүр алга. Доорх save upload эсвэл Windows companion-оор синк хийнэ үү.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chars.map((c) => {
            const ch = c.character;
            const active = (selectedKey ?? chars[0].id) === c.id;
            return (
              <button key={c.id} onClick={() => select(c.id)} className={`panel p-5 text-left transition ${active ? "ring-1 ring-ember-400" : "hover:ring-1 hover:ring-gold-600/50"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-2xl text-gold-300">{ch.name.value ?? "Нэргүй"}</div>
                    <div className="text-xs text-ash-500">Slot {ch.slot + 1} · {ch.className.value ?? "Unknown class"}</div>
                  </div>
                  <Badge kind={demo ? "demo" : c.source === "Companion" ? "companion" : "save"} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div><div className="text-micro uppercase text-ash-500">SL</div><div className="font-display text-xl text-gold-300">{ch.level.value ?? "—"}</div></div>
                  <div><div className="text-micro uppercase text-ash-500">NG</div><div className="font-display text-xl text-gold-300">{ch.ngCycle.value === null ? "?" : ch.ngCycle.value === 0 ? "NG" : `NG+${ch.ngCycle.value}`}</div></div>
                  <div><div className="text-micro uppercase text-ash-500">Үхэл</div><div className="font-display text-xl text-gold-300">{ch.deaths.value ?? "?"}</div></div>
                </div>
                <div className="mt-3 text-xs text-ash-500">Тоглосон: {fmtDuration(ch.playTimeSeconds.value) ?? "Unknown"} · Шинэчилсэн {fmtAgo(c.updatedAt)}</div>
                {active && <div className="mt-3 text-xs text-ember-300">✦ Сонгогдсон</div>}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Panel title="Save файл оруулах (Manual upload)"><SaveUpload /></Panel>
        <Panel title="Автомат синк">
          <p className="text-sm text-ash-400">Windows companion суулгавал тоглоом save хийх бүрт автоматаар шинэчлэгдэнэ.</p>
          <Link href="/settings" className="btn mt-4">Companion холбох</Link>
        </Panel>
      </div>
    </>
  );
}
