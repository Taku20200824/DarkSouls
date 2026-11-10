"use client";
import { useState } from "react";
import { parseSave } from "@/lib/save/ds1";
import { MAX_SAVE_BYTES } from "@/lib/save/bnd4";
import type { ParsedSave } from "@/lib/save/types";
import { useTracker } from "./TrackerProvider";
import { Badge } from "./ui";

/**
 * Manual upload mode. The .sl2 is parsed IN THE BROWSER; the raw file never leaves
 * the computer. Only the parsed fields are sent, after explicit consent.
 */
export function SaveUpload() {
  const { post, demo, status } = useTracker();
  const [parsed, setParsed] = useState<ParsedSave | null>(null);
  const [mtime, setMtime] = useState<number | undefined>();
  const [err, setErr] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | undefined) {
    setErr(null);
    setMsg(null);
    setParsed(null);
    if (!f) return;
    if (f.size > MAX_SAVE_BYTES) return setErr("Файл хэт том байна.");
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const p = parseSave(buf);
      if (!p.characters.length) return setErr("Энэ файлаас дүр олдсонгүй.");
      setParsed(p);
      setMtime(f.lastModified || undefined);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function submit() {
    if (!parsed || !consent) return;
    setBusy(true);
    const r = await post("/api/sync", { ...parsed, characters: parsed.characters, saveModifiedAt: mtime, client: "browser-upload", consent: true });
    setBusy(false);
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? (j.demo ? "Demo Mode: илгээгээгүй." : `Хадгаллаа: ${parsed.characters.length} дүр.`) : `Алдаа: ${j.error ?? r.status}`);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ash-400">
        <code className="text-gold-400">Documents\NBGI\DARK SOULS REMASTERED\&lt;ID&gt;\DRAKS0005.sl2</code> файлыг сонгоно уу. Файл таны браузерт задлагдана — эх файл сервер рүү илгээгдэхгүй, өөрчлөгдөхгүй.
      </p>
      <input type="file" accept=".sl2" onChange={(e) => onFile(e.target.files?.[0])} className="block text-sm text-ash-400 file:mr-3 file:rounded file:border file:border-gold-600/50 file:bg-stone-800 file:px-3 file:py-1.5 file:text-gold-300" />
      {err && <p className="text-sm text-danger">{err}</p>}
      {parsed && (
        <div className="rounded border border-gold-600/20 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ash-400">
            <span>Тоглоом: {parsed.game === "dsr" ? "Dark Souls Remastered" : "Prepare to Die Edition"}</span>
            {parsed.checksumsValid ? <Badge kind="verified">MD5 OK</Badge> : <Badge kind="unknown">Checksum зөрсөн</Badge>}
          </div>
          <ul className="space-y-1 text-sm">
            {parsed.characters.map((c) => (
              <li key={c.slot} className="flex justify-between gap-2">
                <span className="text-gold-300">Slot {c.slot + 1}: {c.name.value ?? "?"}</span>
                <span className="text-ash-400">SL {c.level.value ?? "?"} · {c.className.value ?? "?"} · Үхэл {c.deaths.value ?? "Unknown"}</span>
              </li>
            ))}
          </ul>
          <label className="mt-3 flex items-start gap-2 text-xs text-ash-400">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            Дээрх задлагдсан тоглоомын статистикийг (нэр, түвшин, статистик, inventory, boss/bonfire төлөв, үхлийн тоо) миний бүртгэлд хадгалахыг зөвшөөрч байна.
          </label>
          <button className="btn btn-ember mt-3" disabled={!consent || busy || (status !== "ready")} aria-busy={busy} onClick={submit}>
            {busy ? "Илгээж байна…" : "Синк хийх"}
          </button>
          {demo && <p className="mt-2 text-xs text-demo">Demo Mode идэвхтэй үед өгөгдөл хадгалагдахгүй.</p>}
        </div>
      )}
      {msg && <p className="text-sm text-gold-300">{msg}</p>}
    </div>
  );
}
