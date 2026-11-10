"use client";
import Link from "next/link";
import { useTracker } from "./TrackerProvider";
import { AreaScene } from "./AreaScene";
import { BossThumb } from "./BossThumb";
import { ItemIcon } from "./ItemIcon";
import { Badge } from "./ui";
import { areaById, areaHasBonfire, CONNECTIONS, type Area } from "@/lib/data/areas";
import { BOSSES } from "@/lib/data/bosses";
import { BONFIRE_DB } from "@/lib/save/itemdb";
import { bossStatus, computeObjectives, hasItem } from "@/lib/guide/engine";

export function AreaDetail({ area, compact }: { area: Area; compact?: boolean }) {
  const { tracker, demo } = useTracker();
  const ch = tracker.character;
  const allBonfires = [...BONFIRE_DB.entries()].filter(([id, [, group]]) => areaHasBonfire(area, id, group));
  const found = new Set((ch?.bonfires.value ?? []).map((b) => b.id));
  const bonfiresKnown = ch?.bonfires.certainty === "verified";
  const objective = computeObjectives(tracker).find((o) => o.area === area.id);
  const neighbours = CONNECTIONS.filter((c) => c.from === area.id || c.to === area.id);
  const mapSearchName = (area.shortName ?? area.name).replace(/\s*\(DLC\)\s*/, "");
  const mapSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:darksouls.wiki.fextralife.com ${mapSearchName} map`)}`;
  return (
    <div className="space-y-4 text-sm">
      <AreaScene areaId={area.id} name={area.name} />
      <div>
        <h3 className="font-display text-2xl text-gold-300">{area.name.toUpperCase()}</h3>
        {area.dlc && <Badge kind="inferred">DLC</Badge>}
        <p className="mt-1 text-ash-300">{area.mn}</p>
        <a href={mapSearchUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-ember-300 hover:text-ember-200 hover:underline">
          🗺️ Дэлгэрэнгүй байршлын зураг (Fextralife) ↗
        </a>
      </div>
      <div>
        <h4 className="text-xs uppercase tracking-widest text-ash-500">Bonfire-ууд {bonfiresKnown ? `(${allBonfires.filter(([id]) => found.has(id)).length}/${allBonfires.length})` : ""}</h4>
        {allBonfires.length === 0 ? <p className="text-ash-500">Энэ бүсэд бүртгэгдсэн bonfire алга.</p> : (
          <ul className="mt-1 space-y-0.5">
            {allBonfires.map(([id, [name]]) => (
              <li key={id} className="flex justify-between"><span>{name}</span><span className={found.has(id) ? "text-ember-300" : "text-ash-500"}>{!bonfiresKnown ? "Unknown" : found.has(id) ? "🔥 олсон" : "олоогүй"}</span></li>
            ))}
          </ul>
        )}
      </div>
      {area.bosses.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-widest text-ash-500">Boss-ууд</h4>
          <ul className="mt-1 space-y-1.5">
            {area.bosses.map((id) => {
              const b = BOSSES.find((x) => x.id === id)!;
              const s = bossStatus(b, tracker);
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <Link href={`/bosses/${id}`} className="flex min-w-0 items-center gap-2 hover:text-ember-300"><BossThumb boss={b} defeated={s.state === "defeated"} size={36} /><span className="truncate">{b.name}</span></Link>
                  <span className="flex items-center gap-1"><span className={s.state === "defeated" ? "text-success" : s.state === "alive" ? "text-danger" : "text-ash-500"}>{s.state === "defeated" ? "Defeated" : s.state === "alive" ? "Alive" : "Unknown"}</span><Badge kind={demo ? "demo" : s.certainty} /></span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {!compact && area.npcs.length > 0 && (
        <div><h4 className="text-xs uppercase tracking-widest text-ash-500">NPC</h4><p className="mt-1">{area.npcs.join(" · ")}</p></div>
      )}
      <div>
        <h4 className="text-xs uppercase tracking-widest text-ash-500">Чухал эд зүйлс</h4>
        <ul className="mt-1 space-y-0.5">
          {area.items.map((it) => {
            const base = it.replace(/\s*\(.*\)$/, "");
            const owned = ch ? hasItem(ch, base) : null;
            return <li key={it} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2"><ItemIcon name={base} size={26} /><span className="truncate">{it}</span></span>{owned !== null && <span className={owned ? "text-success" : "text-ash-500"}>{owned ? "✓ эзэмшдэг" : "—"}</span>}</li>;
          })}
        </ul>
      </div>
      {area.shortcuts.length > 0 && <div><h4 className="text-xs uppercase tracking-widest text-ash-500">Shortcut</h4><p className="mt-1">{area.shortcuts.join(" · ")}</p></div>}
      {area.secrets.length > 0 && <div><h4 className="text-xs uppercase tracking-widest text-ash-500">Нууц</h4><p className="mt-1">{area.secrets.join(" · ")}</p></div>}
      {objective && (
        <div className="rounded border border-ember-500/40 bg-ember-600/10 p-3">
          <div className="text-xs uppercase tracking-widest text-ember-300">
            Зорилт {objective.status === "skipped" ? "↷ алгассан" : objective.done ? "✓ биелсэн" : ""}
          </div>
          <div className="font-display text-lg text-gold-300">{objective.title}</div>
          <p className="text-ash-300">{objective.statusNoteMn ?? objective.whyMn}</p>
          {objective.avoidMissingMn.length > 0 && <p className="mt-1 text-warning">⚠ {objective.avoidMissingMn.join(" · ")}</p>}
        </div>
      )}
      <div>
        <h4 className="text-xs uppercase tracking-widest text-ash-500">Холбогдох бүсүүд</h4>
        <ul className="mt-1 space-y-0.5">
          {neighbours.map((connection) => {
            const outgoing = connection.from === area.id;
            const id = outgoing ? connection.to : connection.from;
            const direction = connection.oneWay ? (outgoing ? "→" : "←") : "↔";
            return (
              <li key={`${connection.from}:${connection.to}`}>
                {direction} <Link className="text-gold-300 hover:text-ember-300" href={`/areas/${id}`}>{areaById(id)?.name}</Link>
                {connection.requires && <span className="text-ash-500"> · {connection.requires}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
