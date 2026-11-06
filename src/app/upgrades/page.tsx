"use client";
import { useMemo, useState } from "react";
import { useTracker } from "@/components/TrackerProvider";
import { Badge, PageTitle, Panel } from "@/components/ui";
import { ItemIcon } from "@/components/ItemIcon";
import { ALL_WEAPON_NAMES } from "@/lib/save/itemdb";
import { FARMING_MN, INFUSION_TO_PATH, SOULS_COST_NOTE_MN, UPGRADE_PATHS, planUpgrade, totalMaterials } from "@/lib/data/upgrades";
import { itemQty } from "@/lib/guide/engine";

export default function Upgrades() {
  const { tracker, demo } = useTracker();
  const ch = tracker.character;
  const owned = (ch?.inventory ?? []).filter((i) => i.category === "weapons" && i.baseName !== "Fists");
  const [weapon, setWeapon] = useState<string>(owned[0]?.baseName ?? "Claymore");
  const ownedMatch = owned.find((o) => o.baseName === weapon);
  const [curPath, setCurPath] = useState<string>(ownedMatch ? INFUSION_TO_PATH[ownedMatch.infusion ?? "Normal"] : "normal");
  const [curLevel, setCurLevel] = useState<number>(ownedMatch?.level ?? 0);
  const [target, setTarget] = useState("normal");
  const [targetLevel, setTargetLevel] = useState(15);
  const tPath = UPGRADE_PATHS.find((p) => p.id === target)!;
  const plan = useMemo(() => planUpgrade(curPath, curLevel, target, Math.min(targetLevel, tPath.maxLevel)), [curPath, curLevel, target, targetLevel, tPath.maxLevel]);
  const totals = plan ? totalMaterials(plan) : [];
  const embers = plan ? [...new Set(plan.filter((l) => l.ember).map((l) => l.ember!))] : [];
  const smiths = plan ? [...new Set(plan.filter((l) => l.smith).map((l) => l.smith!))] : [];

  function pickWeapon(name: string) {
    setWeapon(name);
    const o = owned.find((x) => x.baseName === name);
    if (o) {
      setCurPath(INFUSION_TO_PATH[o.infusion ?? "Normal"] ?? "normal");
      setCurLevel(o.level ?? 0);
    }
  }

  return (
    <>
      <PageTitle title="Weapon Upgrade Planner" sub="Баталгаажсан жороор материал, ember, дархныг тооцоолно." />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Panel title="Сонголт">
          <label className="block text-xs text-ash-500">Зэвсэг</label>
          <input list="weapons" className="input mt-1 w-full" value={weapon} onChange={(e) => pickWeapon(e.target.value)} />
          <datalist id="weapons">
            {owned.map((o) => <option key={`o-${o.id}`} value={o.baseName}>{`${o.name} (эзэмшдэг)`}</option>)}
            {ALL_WEAPON_NAMES.map((n) => <option key={n} value={n} />)}
          </datalist>
          {ownedMatch && <p className="mt-1 text-xs text-emerald-300">Inventory: {ownedMatch.name} <Badge kind={demo ? "demo" : "verified"} /></p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div><label className="block text-xs text-ash-500">Одоогийн зам</label>
              <select className="input mt-1 w-full" value={curPath} onChange={(e) => setCurPath(e.target.value)}>{UPGRADE_PATHS.filter((p) => p.verified).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-xs text-ash-500">Одоогийн +</label>
              <input type="number" min={0} max={15} className="input mt-1 w-full" value={curLevel} onChange={(e) => setCurLevel(Math.max(0, Math.min(15, Number(e.target.value))))} /></div>
            <div><label className="block text-xs text-ash-500">Зорилтот зам</label>
              <select className="input mt-1 w-full" value={target} onChange={(e) => { setTarget(e.target.value); setTargetLevel(UPGRADE_PATHS.find((p) => p.id === e.target.value)!.maxLevel); }}>{UPGRADE_PATHS.map((p) => <option key={p.id} value={p.id}>{p.name}{p.verified ? "" : " (баталгаажаагүй)"}</option>)}</select></div>
            <div><label className="block text-xs text-ash-500">Зорилтот +</label>
              <input type="number" min={0} max={tPath.maxLevel} className="input mt-1 w-full" value={targetLevel} onChange={(e) => setTargetLevel(Number(e.target.value))} /></div>
          </div>
          <p className="mt-3 text-xs text-ash-400">{tPath.mn}</p>
        </Panel>
        <div className="space-y-4">
          {!tPath.verified ? (
            <Panel title={tPath.name}><p className="text-sm">Материал: <b>{tPath.material}</b>. Түвшин тус бүрийн тоо хэмжээ энэ хувилбарт баталгаажаагүй тул тооцоолохгүй.</p></Panel>
          ) : !plan ? (
            <Panel title="Зам боломжгүй"><p className="text-sm text-ash-400">Одоогийн замаас зорилтот зам руу шилжих боломжгүй (жишээ нь Crystal нь Normal +10-аас, Chaos нь Fire +5-аас эхэлнэ), эсвэл салаалах түвшнийг аль хэдийн давсан.</p></Panel>
          ) : (
            <>
              <Panel title="Шаардлагатай материал">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-ash-500"><tr><th>Материал</th><th>Хэрэгтэй</th><th>Байгаа</th><th>Дутуу</th></tr></thead>
                  <tbody>
                    {totals.map((t) => {
                      const have = itemQty(ch, t.material);
                      const miss = have === null ? null : Math.max(0, t.qty - have);
                      return (
                        <tr key={t.material} className="border-t border-gold-600/10">
                          <td className="py-1.5 text-gold-300"><span className="flex items-center gap-2"><ItemIcon name={t.material} category="goods" size={24} />{t.material}</span></td><td>{t.qty}</td>
                          <td>{have ?? <span className="text-ash-500">Not connected</span>}</td>
                          <td className={miss ? "text-red-300" : "text-emerald-300"}>{miss === null ? "—" : miss}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {embers.length > 0 && <p className="mt-3 text-sm">Ember: {embers.join(", ")}</p>}
                {smiths.length > 0 && <p className="text-sm">Дархан: {smiths.join(", ")}</p>}
                <p className="mt-2 text-xs text-ash-500">{SOULS_COST_NOTE_MN}</p>
              </Panel>
              <Panel title="Алхам алхмаар">
                <ol className="space-y-1 text-sm">
                  {plan.map((l, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-600/5 py-1">
                      <span>{UPGRADE_PATHS.find((p) => p.id === l.path)?.name} +{l.level}</span>
                      <span className="flex items-center gap-2 text-ash-300">
                        <ItemIcon name={l.material} category="goods" size={22} />
                        {l.material} ×{l.qty}{l.ember ? ` · ${l.ember}` : ""}{l.smith ? ` · ${l.smith}` : ""}
                      </span>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title="Farm хийх газар">
                <ul className="space-y-1.5 text-sm">{totals.map((t) => <li key={t.material} className="flex items-start gap-2"><ItemIcon name={t.material} category="goods" size={22} /><span><span className="text-gold-300">{t.material}:</span> {FARMING_MN[t.material] ?? "Мэдээлэл алга."}</span></li>)}</ul>
              </Panel>
            </>
          )}
        </div>
      </div>
      <p className="mt-6 text-xs text-ash-500">Эх сурвалж: Dark Souls Wiki (wikidot) — Normal, Crystal, Lightning, Raw, Magic, Enchanted, Divine, Occult, Fire, Chaos хуудсууд.</p>
    </>
  );
}
