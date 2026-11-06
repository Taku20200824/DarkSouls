"use client";
import { useState } from "react";
import { Gate } from "@/components/Shell";
import { useTracker } from "@/components/TrackerProvider";
import { SaveUpload } from "@/components/SaveUpload";
import { PageTitle, Panel, fmtAgo, fmtDate } from "@/components/ui";
import { DESKTOP_DOWNLOAD_URL, DESKTOP_APP_VERSION } from "@/lib/downloads";

export default function Settings() {
  const { demo, setDemo, status } = useTracker();
  return (
    <>
      <PageTitle title="Settings & Companion" sub="Companion холболт, manual upload, Demo Mode, нууцлал." />
      <Panel title="Demo Mode" className="mb-4">
        <p className="text-sm text-ash-400">Demo Mode нь зөвхөн интерфэйсийг үзүүлэх зориулалттай жишээ өгөгдөл харуулна. Бодит статистиктай хэзээ ч холилдохгүй.</p>
        <button className="btn mt-3" onClick={() => setDemo(!demo)}>{demo ? "Demo Mode унтраах" : "Demo Mode асаах"}</button>
      </Panel>
      {status === "anon" && !demo ? <Gate><span /></Gate> : !demo && <Connected />}
    </>
  );
}

function Connected() {
  const { state, post } = useTracker();
  const [code, setCode] = useState<{ code: string; expiresAt: number } | null>(null);
  const c = state?.companion;
  async function makeCode() {
    const r = await post("/api/companion/pair-code", {});
    if (r.ok) setCode(await r.json());
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {state?.desktop ? (
      <Panel title="Автомат sync">
        <div className="text-sm">
          <p>Төлөв: {c?.connected ? <span className="text-ember-300">CONNECTED — LIVE TRACKING</span> : <span className="text-ash-500">Эхэлж байна…</span>}</p>
          {c?.saveFound === false && <p className="text-amber-300">Save файл олдсонгүй. Тоглоомыг нэг удаа ажиллуулж хадгална уу, эсвэл Manual upload ашиглана уу.</p>}
          {c?.saveFound && c.message && <p className="text-amber-300">{c.message}</p>}
          {c?.saveModifiedAt && <p className="text-ash-400">Сүүлийн save: {fmtDate(c.saveModifiedAt)}</p>}
          {c?.lastSyncAt && <p className="text-ash-400">Сүүлийн sync: {fmtAgo(c.lastSyncAt)}</p>}
        </div>
        <p className="mt-4 text-sm text-ash-300">App нээлттэй үед save файлыг энэ компьютерээс шууд уншина. Холбох код эсвэл companion шаардлагагүй. App хаалттай үед тоглосон ахиц дараагийн нээхэд автоматаар орж ирнэ.</p>
      </Panel>
      ) : (
      <>
      <Panel title="Windows Companion">
        <div className="text-sm">
          <p>Төлөв: {c?.connected ? <span className="text-ember-300">CONNECTED — LIVE TRACKING</span> : c?.lastHeartbeat ? <span>OFFLINE — LAST SYNC {fmtAgo(c.lastSyncAt ?? c.lastHeartbeat)}</span> : <span className="text-ash-500">Not connected</span>}</p>
          {c?.deviceName && <p className="text-ash-400">Төхөөрөмж: {c.deviceName} {c.version ? `· v${c.version}` : ""}</p>}
          {c?.saveFound === false && <p className="text-amber-300">Companion save файлыг олсонгүй: {c.message}</p>}
          {c?.saveModifiedAt && <p className="text-ash-400">Сүүлийн save: {fmtDate(c.saveModifiedAt)}</p>}
        </div>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ash-300">
          <li>README-ийн дагуу <code>lordran-companion</code>-ийг Windows дээр суулга.</li>
          <li>Доорх товчоор 8 оронтой холбох код үүсгэ (10 минут хүчинтэй, нэг удаагийн).</li>
          <li>Companion-д <code>pair КОД</code> гэж оруул. Дараа нь <code>run</code>.</li>
        </ol>
        <button className="btn btn-ember mt-4" onClick={makeCode}>Холбох код үүсгэх</button>
        {code && <div className="mt-3 rounded border border-ember-500/50 p-3 text-center"><div className="font-display text-3xl tracking-[0.4em] text-gold-300">{code.code}</div><div className="text-xs text-ash-500">Дуусах: {fmtDate(code.expiresAt)}</div></div>}
        <button className="btn mt-4 text-xs" onClick={() => post("/api/companion/revoke", {})}>Бүх companion-ий эрхийг цуцлах</button>
      </Panel>
      <Panel title="Desktop App (Windows)">
        <p className="text-sm text-ash-400">Энэ сайтыг бүхэлд нь тусдаа PC app болгож суулгаж болно (нэвтрэх шаардлагагүй, Firebase тохируулахгүйгээр локал хадгална). <code>Windows Companion</code>-аас ялгаатай — энэ бол tracker-ийн бүх дэлгэц өөрөө.</p>
        <a className="btn btn-ember mt-3" href={DESKTOP_DOWNLOAD_URL} download>v{DESKTOP_APP_VERSION} татах (.exe)</a>
        <p className="mt-2 text-xs text-ash-500">Гарын үсэггүй build тул анх удаа ажиллуулахад «Windows protected your PC» гарна → «More info» → «Run anyway».</p>
      </Panel>
      </>
      )}
      <Panel title="Manual upload"><SaveUpload /></Panel>
      <Panel title="Steam">
        <p className="text-sm text-ash-400">SteamID64: {state?.user.steamId}</p>
        <p className="text-sm text-ash-400">Dark Souls: Remastered эзэмшил: {state?.user.ownsGame === true ? "Тийм" : state?.user.ownsGame === false ? "Олдсонгүй" : "Unknown (тоглоомын жагсаалт private эсвэл API key алга)"}</p>
        <button className="btn mt-3" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}>Гарах</button>
      </Panel>
      <Panel title="Нууцлал">
        <ul className="list-disc space-y-1 pl-5 text-sm text-ash-400">
          <li>Save файлыг таны компьютер дээр (браузер эсвэл companion) задлана. Эх .sl2 файл сервер рүү илгээгддэггүй.</li>
          <li>Хадгалдаг: SteamID64, нэр/avatar, задлагдсан тоглоомын статистик, синкийн цаг.</li>
          <li>Steam API key зөвхөн сервер дээр. Companion token-ийн зөвхөн SHA-256 hash хадгална.</li>
          <li>Save файлд хэзээ ч бичихгүй, өөрчлөхгүй.</li>
        </ul>
      </Panel>
    </div>
  );
}
