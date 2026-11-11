"use client";
import Link from "next/link";
import { useState } from "react";
import { Gate } from "@/components/Shell";
import { useTracker } from "@/components/TrackerProvider";
import { SaveUpload } from "@/components/SaveUpload";
import { PageTitle, Panel, fmtAgo, fmtDate } from "@/components/ui";
import { DESKTOP_DOWNLOAD_PATH, IS_DESKTOP_BUILD, compareVersions } from "@/lib/downloads";
import { useLatestDesktop } from "@/components/useLatestDesktop";
import { DesktopCloudPanel } from "@/components/DesktopCloudPanel";
import { DeleteAccountPanel } from "@/components/DeleteAccountPanel";

export default function Settings() {
  const { demo, setDemo, status } = useTracker();
  return (
    <>
      <PageTitle title="Settings & Companion" sub="Companion холболт, manual upload, Demo Mode, нууцлал." />
      <p className="-mt-6 mb-6 text-center text-xs text-ash-400"><Link href="/privacy" className="text-ember-300 underline">Нууцлал ба аюулгүй байдал</Link> — ямар өгөгдөл хадгалдаг, юуг огт авдаггүй.</p>
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
      <>
      <Panel title="Автомат sync">
        <div className="text-sm">
          <p>Төлөв: {c?.connected ? <span className="text-ember-300">CONNECTED — LIVE TRACKING</span> : <span className="text-ash-500">Эхэлж байна…</span>}</p>
          {c?.saveFound === false && <p className="text-warning">Save файл олдсонгүй. Тоглоомыг нэг удаа ажиллуулж хадгална уу, эсвэл Manual upload ашиглана уу.</p>}
          {c?.saveFound && c.message && <p className="text-warning">{c.message}</p>}
          {c?.saveModifiedAt && <p className="text-ash-400">Сүүлийн save: {fmtDate(c.saveModifiedAt)}</p>}
          {c?.lastSyncAt && <p className="text-ash-400">Сүүлийн sync: {fmtAgo(c.lastSyncAt)}</p>}
          <p className="text-ash-400">Хувилбар: {process.env.NEXT_PUBLIC_APP_VERSION}</p>
        </div>
        <p className="mt-4 text-sm text-ash-300">App нээлттэй үед save файлыг энэ компьютерээс шууд уншина. App хаалттай үед тоглосон ахиц дараагийн нээхэд автоматаар орж ирнэ.</p>
      </Panel>
      <DesktopCloudPanel />
      </>
      ) : (
      <>
      <Panel title="Windows App & Companion">
        <div className="text-sm">
          <p>Төлөв: {c?.connected ? <span className="text-ember-300">CONNECTED — LIVE TRACKING</span> : c?.lastHeartbeat ? <span>OFFLINE — LAST SYNC {fmtAgo(c.lastSyncAt ?? c.lastHeartbeat)}</span> : <span className="text-ash-500">Not connected</span>}</p>
          {c?.deviceName && <p className="text-ash-400">Төхөөрөмж: {c.deviceName} {c.version ? `· v${c.version}` : ""}</p>}
          {c?.saveFound === false && <p className="text-warning">Companion save файлыг олсонгүй: {c.message}</p>}
          {c?.saveModifiedAt && <p className="text-ash-400">Сүүлийн save: {fmtDate(c.saveModifiedAt)}</p>}
        </div>
        <p className="mt-4 text-sm text-ash-300">Windows App болон энэ сайтад ижил Steam бүртгэлээр нэвтэрнэ үү. App save ахицыг Firebase-д автоматаар хадгална. Энэ сайт тэндээс ахицыг, Steam-ээс профайл болон achievement-ийг авна.</p>
        <details className="mt-4 text-sm text-ash-400">
          <summary className="cursor-pointer">Тусдаа Python Companion ашиглах</summary>
          <p className="mt-2"><code>pair КОД</code>, дараа нь <code>run</code>.</p>
          <button className="btn btn-sm mt-2" onClick={makeCode}>Companion код үүсгэх</button>
          {code && <div className="mt-3 rounded border border-ember-500/50 p-3 text-center"><div className="font-display text-3xl tracking-code text-gold-300">{code.code}</div><div className="text-xs text-ash-500">Дуусах: {fmtDate(code.expiresAt)}</div></div>}
        </details>
        <button className="btn btn-danger btn-sm mt-4" onClick={() => post("/api/companion/revoke", {})}>Бүх companion-ий эрхийг цуцлах</button>
      </Panel>
      <Panel title={IS_DESKTOP_BUILD ? "App-ийн хувилбар" : "Desktop App (Windows)"}>
        {!IS_DESKTOP_BUILD && <p className="text-sm text-ash-400">Windows App-ийг суулгаад Steam-ээр нэвтэрнэ үү. Хуучин хувилбараас шинэчилсэн бол App дээр нэг удаа дахин нэвтэрч автомат синкийг асаана уу.</p>}
        <DesktopDownload />
        {!IS_DESKTOP_BUILD && <p className="mt-2 text-xs text-ash-500">Гарын үсэггүй build тул анх удаа ажиллуулахад «Windows protected your PC» гарна → «More info» → «Run anyway».</p>}
      </Panel>
      </>
      )}
      <Panel title="Manual upload"><SaveUpload /></Panel>
      <Panel title="Steam">
        <p className="text-sm text-ash-400">SteamID64: {state?.user.steamId}</p>
        <p className="text-sm text-ash-400">Dark Souls: Remastered эзэмшил: {state?.user.ownsGame === true ? "Тийм" : state?.user.ownsGame === false ? "Олдсонгүй" : "Unknown (тоглоомын жагсаалт private эсвэл API key алга)"}</p>
        {state?.user.playtimeMinutes != null && <p className="text-sm text-ash-400">Steam дээр тоглосон хугацаа: {Math.floor(state.user.playtimeMinutes / 60)} цаг {state.user.playtimeMinutes % 60} мин</p>}
        <button className="btn mt-3" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}>Гарах</button>
      </Panel>
      <Panel title="Нууцлал">
        <ul className="list-disc space-y-1 pl-5 text-sm text-ash-400">
          <li>Save файлыг таны компьютер дээр (браузер эсвэл companion) задлана. Эх .sl2 файл сервер рүү илгээгддэггүй.</li>
          <li>Хадгалдаг: SteamID64, нэр/avatar, задлагдсан тоглоомын статистик, синкийн цаг.</li>
          <li>Steam API key зөвхөн сервер дээр. Companion token-ийн зөвхөн SHA-256 hash хадгална.</li>
          <li>Save файлд хэзээ ч бичихгүй, өөрчлөхгүй.</li>
        </ul>
        <Link href="/privacy" className="mt-2 inline-block text-xs text-ember-300 underline">Дэлгэрэнгүй: Нууцлал ба аюулгүй байдал</Link>
      </Panel>
      <DeleteAccountPanel />
    </div>
  );
}

function DesktopDownload() {
  const latest = useLatestDesktop();
  const { state } = useTracker();
  const current = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
  if (IS_DESKTOP_BUILD && state?.desktopStore) {
    return (
      <div className="mt-3 text-sm">
        <p>Энэ app: <span className="font-display text-gold-300">v{current}</span> · Microsoft Store</p>
        <p className="mt-1 text-ash-400">Шинэчлэлтийг Microsoft Store автоматаар суулгана.</p>
      </div>
    );
  }
  if (IS_DESKTOP_BUILD) {
    // Inside the installed app: no installer download — it updates itself on launch.
    const newer = Boolean(latest?.version && current && compareVersions(latest.version, current) > 0);
    return (
      <div className="mt-3 text-sm">
        <p>Энэ app: <span className="font-display text-gold-300">v{current}</span></p>
        <p className={newer ? "mt-1 text-ember-300" : "mt-1 text-ash-400"}>
          {!latest
            ? "Шинэ хувилбар шалгаж байна…"
            : !latest.version
              ? "Шинэ хувилбарын мэдээлэл авч чадсангүй (интернэт холболтоо шалгана уу)."
            : newer
              ? `Шинэ хувилбар v${latest.version} гарсан. App-ийг хаагаад дахин нээхэд шинэчлэх эсэхийг асууна.`
              : "Хамгийн сүүлийн хувилбар. Шинэ хувилбар гарвал app нээх үед автоматаар асууна."}
        </p>
      </div>
    );
  }
  return (
    <>
      <a className="btn btn-ember mt-3" href={DESKTOP_DOWNLOAD_PATH}>{latest?.version ? `v${latest.version} татах (.exe)` : "Хамгийн сүүлийн хувилбарыг татах (.exe)"}</a>
      {latest?.releaseDate && <p className="mt-2 text-xs text-ash-500">Гаргасан: {new Date(latest.releaseDate).toLocaleDateString("mn-MN")}</p>}
      <p className="mt-2 text-xs text-ash-400"><Link href="/code-signing" className="text-ember-300 underline">Code signing policy</Link> — татсан файлаа шалгах арга, гарын үсгийн бодлого.</p>
    </>
  );
}
