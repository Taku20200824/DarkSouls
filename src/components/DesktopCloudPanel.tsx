"use client";

import { useState, type FormEvent } from "react";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { useTracker } from "./TrackerProvider";
import { Panel, fmtDate } from "./ui";

const errors: Record<string, string> = {
  invalid_or_expired_code: "Код буруу эсвэл хугацаа дууссан. Вэбээс шинэ код авна уу.",
  steam_account_mismatch: "App болон вэб дээр ижил Steam бүртгэлээр нэвтэрнэ үү.",
  account_save_not_found: "Энэ Steam бүртгэлийн save файл олдсонгүй. Өөр бүртгэлийн save вэб рүү илгээгдэхгүй.",
  invalid_token: "Холболтын эрх цуцлагдсан. Вэбээс шинэ код авч дахин холбоно уу.",
  upload_failed: "Вэб рүү илгээж чадсангүй. App автоматаар дахин оролдоно.",
};

export function DesktopCloudPanel() {
  const { state, refresh } = useTracker();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const link = state?.desktopCloud;
  const showForm = !link || link.error === "invalid_token";

  async function changeLink(method: "POST" | "DELETE") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/desktop/cloud", {
        method,
        ...(method === "POST" ? {
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
        } : {}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(errors[body?.error] ?? "Вэбтэй холбогдож чадсангүй. Дахин оролдоно уу.");
        return;
      }
      if (method === "DELETE") {
        const result = await response.json().catch(() => null);
        if (result?.remoteRevoked === false) setError("Энэ App синк хийхээ зогсоосон. Серверийн эрхийг вэб тохиргооноос цуцална уу.");
      }
      setCode("");
      await refresh();
    } catch {
      setError("Вэбтэй холбогдож чадсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy) void changeLink("POST");
  }

  return (
    <Panel title="Вэбтэй синк хийх">
      <p className="text-sm text-ash-300">Вэб дээр ижил Steam бүртгэлээр нэвтэрч, тохиргооноос холбох код үүсгэнэ үү. Холбосны дараа энэ бүртгэлийн задалсан save өгөгдөл автоматаар синк хийнэ.</p>
      <a className="btn btn-sm mt-3" href={`${CLOUD_SITE_URL}/settings`} target="_blank" rel="noreferrer">Вэб тохиргоог нээх ↗</a>
      {showForm && (
        <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={submit}>
          <label className="flex flex-col gap-1 text-sm text-ash-300">
            Холбох код
            <input className="input w-40 font-mono tracking-widest" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={8} value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))} />
          </label>
          <button type="submit" className="btn btn-ember" disabled={busy || code.length !== 8}>Вэбтэй холбох</button>
        </form>
      )}
      {link && (
        <div className="mt-4 space-y-2 text-sm" aria-live="polite">
          {link.error ? <p className="text-warning">{errors[link.error]}</p> : <p className="text-ember-300">{link.lastSyncedAt ? `Вэбтэй синк хийсэн · ${fmtDate(link.lastSyncedAt)}` : "Холбогдсон · save хүлээж байна"}</p>}
          <button className="btn btn-sm" disabled={busy} onClick={() => void changeLink("DELETE")}>Холболт салгах</button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-warning">{error}</p>}
    </Panel>
  );
}
