"use client";
import { useState } from "react";
import { Panel } from "./ui";
import { DELETE_CONFIRMATION } from "@/lib/account";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { IS_DESKTOP_BUILD } from "@/lib/downloads";

/** Settings: permanently delete this Steam account's stored data (see /api/account). */
export function DeleteAccountPanel() {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = typed.trim() === DELETE_CONFIRMATION;

  async function remove() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: DELETE_CONFIRMATION }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? "Хэт олон оролдлого. Нэг минутын дараа дахин оролдоно уу." : "Устгаж чадсангүй. Дахин оролдоно уу.");
        return;
      }
      window.location.href = "/?deleted=1";
    } catch {
      setError("Сервертэй холбогдож чадсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Өгөгдлөө устгах" className="lg:col-span-2">
      <p className="text-sm text-ash-300">
        {IS_DESKTOP_BUILD ? (
          <>Энэ App дээр хадгалсан таны ахиц, үйл явдал, тохиргоог бүрмөсөн устгаж, вэб рүү синк хийх эрхийг цуцална. Вэб дээрх хуулбарыг устгахын тул <a className="text-ember-300 underline" href={`${CLOUD_SITE_URL}/settings`} target="_blank" rel="noreferrer">вэбийн Settings</a>-ээс мөн устгана уу.</>
        ) : (
          <>Энэ Steam бүртгэлд хадгалсан бүх өгөгдлийг (ахиц, үйл явдал, snapshot, achievement, гараар тэмдэглэсэн зүйл, Windows App / companion-ий холболт) <b className="text-danger">бүрмөсөн</b> устгаж, гаргана. Буцаах боломжгүй.</>
        )}
      </p>
      <p className="mt-2 text-xs text-ash-400">Save файл болон Steam бүртгэлд нөлөөлөхгүй. Дараа нь дахин нэвтэрвэл шинээр эхэлнэ.</p>
      <label className="mt-3 block text-xs text-ash-400" htmlFor="delete-confirm">
        Баталгаажуулахын тулд <b className="text-gold-300">{DELETE_CONFIRMATION}</b> гэж бичнэ үү
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          id="delete-confirm"
          className="input w-48"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          aria-invalid={typed.length > 0 && !ready}
          aria-describedby={error ? "delete-error" : undefined}
        />
        <button className="btn btn-danger" disabled={!ready || busy} aria-busy={busy} onClick={() => void remove()}>
          Бүрмөсөн устгах
        </button>
      </div>
      {error && <p id="delete-error" role="alert" className="mt-2 text-sm text-warning">{error}</p>}
    </Panel>
  );
}
