"use client";
import { useMemo, useState } from "react";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, Empty, PageTitle, Panel } from "@/components/ui";
import { ItemIcon } from "@/components/ItemIcon";
import { ALL_RING_NAMES, ALL_SPELL_NAMES, BOSS_SOUL_DB } from "@/lib/save/itemdb";
import type { InventoryItem } from "@/lib/save/types";

const TABS = [
  { id: "weapons", mn: "Зэвсэг / бамбай" },
  { id: "armors", mn: "Хуяг" },
  { id: "rings", mn: "Бөгж" },
  { id: "spells", mn: "Шившлэг" },
  { id: "key", mn: "Түлхүүр эд зүйлс" },
  { id: "materials", mn: "Сайжруулах материал" },
  { id: "souls", mn: "Boss Soul" },
  { id: "goods", mn: "Хэрэглээний" },
] as const;

const isMaterial = (n: string) => /Titanite|Dragon Scale|Ember/.test(n);
const isKey = (n: string) => /Key|Lordvessel|Peculiar Doll|Broken Pendant|Rite of Kindling|Crest of Artorias|Fire Keeper Soul|Pendant/.test(n);

export default function Inventory() {
  const { tracker, demo } = useTracker();
  const ch = tracker.character;
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("weapons");
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const inv = ch?.inventory ?? [];
    const pick = (i: InventoryItem) => {
      if (tab === "weapons" || tab === "armors" || tab === "rings" || tab === "spells") return i.category === tab;
      if (i.category !== "goods") return false;
      if (tab === "souls") return i.name in BOSS_SOUL_DB;
      if (tab === "materials") return isMaterial(i.name);
      if (tab === "key") return isKey(i.name);
      return !isMaterial(i.name) && !isKey(i.name) && !(i.name in BOSS_SOUL_DB);
    };
    return inv.filter(pick).filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  }, [ch, tab, q]);
  const collection = tab === "spells" ? ALL_SPELL_NAMES : tab === "rings" ? ALL_RING_NAMES : null;
  const ownedNames = new Set((ch?.inventory ?? []).map((i) => i.baseName));
  return (
    <>
      <PageTitle title="Inventory & Collection" sub="Save файлаас уншсан эд зүйлс. Тоглоомын нэр томьёо англиар." />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`btn btn-sm ${tab === t.id ? "btn-ember" : ""}`}>{t.mn}</button>)}
        <input className="input ml-auto w-full sm:w-64" placeholder="Хайх…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!ch ? (
        <Empty>Save өгөгдөл холбогдоогүй (Not connected).</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={`Эзэмшдэг (${items.length})`} right={<Badge kind={demo ? "demo" : "verified"} />}>
            {items.length === 0 ? <p className="text-sm text-ash-500">Хоосон.</p> : (
              <ul className="max-h-[60vh] space-y-1 overflow-y-auto text-sm">
                {items.map((i) => (
                  <li key={`${i.category}-${i.id}`} className="flex items-center justify-between gap-2 border-b border-gold-600/5 py-1.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <ItemIcon name={i.name} category={i.category} size={40} />
                      <span className="truncate text-gold-300">{i.name}</span>
                    </span>
                    <span className="shrink-0 text-ash-500">×{i.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
            {ch.unknownItemCount > 0 && <p className="mt-2 text-xs text-ash-500">{ch.unknownItemCount} тодорхойгүй бичлэг алгассан.</p>}
          </Panel>
          {collection && (
            <Panel title={`Цуглуулга: ${collection.filter((n) => ownedNames.has(n)).length} / ${collection.length}`}>
              <ul className="max-h-[60vh] space-y-1 overflow-y-auto text-sm">
                {collection.map((n) => (
                  <li key={n} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <ItemIcon name={n} category={tab === "spells" ? "spells" : "rings"} size={36} />
                      <span className={`truncate ${ownedNames.has(n) ? "text-gold-300" : "text-ash-500"}`}>{n}</span>
                    </span>
                    <span className="shrink-0">{ownedNames.has(n) ? "✓" : "—"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ash-500">Энэ жагсаалт зөвхөн save-ийн inventory хэсгийг шалгана; өөр хэсэгт хадгалагдсан зүйлс орхигдож болзошгүй.</p>
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
