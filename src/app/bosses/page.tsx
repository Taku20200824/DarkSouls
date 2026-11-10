"use client";
import Link from "next/link";
import { useState } from "react";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, PageTitle } from "@/components/ui";
import { BOSSES } from "@/lib/data/bosses";
import { areaById } from "@/lib/data/areas";
import { bossStatus } from "@/lib/guide/engine";
import { BossPortrait } from "@/components/BossPortrait";
import { BossSpotlight } from "@/components/BossSpotlight";

export default function Bosses() {
  const { tracker, demo } = useTracker();
  const [filter, setFilter] = useState<"all" | "defeated" | "alive" | "unknown">("all");
  const rows = BOSSES.map((b) => ({ b, s: bossStatus(b, tracker) })).filter((r) => filter === "all" || r.s.state === filter);
  return (
    <>
      <PageTitle title="Boss Encyclopedia" sub="Үндсэн, сонголтот болон DLC boss-ууд. Төлөв нь save/Steam нотолгоонд суурилна." />
      <BossSpotlight compact />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "defeated", "alive", "unknown"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? "btn-ember" : ""}`}>{{ all: "Бүгд", defeated: "Defeated", alive: "Alive", unknown: "Unknown" }[f]}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ b, s }) => (
          <Link key={b.id} href={`/bosses/${b.id}`} className="panel flex flex-col overflow-hidden transition hover:ring-1 hover:ring-ember-400/60">
            <BossPortrait boss={b} defeated={s.state === "defeated"} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
            <div className="min-w-0 p-4">
              <div className="font-display text-lg leading-tight text-gold-300">{b.name}</div>
              <div className="text-xs text-ash-500">{areaById(b.area)?.name} · {b.dlc ? "DLC" : b.optional ? "Optional" : "Mandatory"}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={s.state === "defeated" ? "text-success" : s.state === "alive" ? "text-danger" : "text-ash-500"}>{s.state === "defeated" ? "Defeated" : s.state === "alive" ? "Alive" : "Unknown"}</span>
                <Badge kind={demo ? "demo" : s.certainty} />
              </div>
              {b.tailCut && <div className="mt-1 text-label text-warning">✂ Tail: {b.tailCut}</div>}
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-xs text-ash-500">NG+ анхааруулга: boss soul ба NG тойргийн нотолгоо нь өмнөх тойрогт ялсныг илэрхийлж болно; “Alive” нь зөвхөн одоогийн тойргийн verified flag дээр суурилна.</p>
      <p className="mt-2 text-xs text-ash-500">Boss-уудын зураг нь AI-аар бүтээсэн албан бус fan art бөгөөд тоглоомын албан ёсны зураг биш.</p>
    </>
  );
}
