"use client";

import { useState } from "react";
import { CLOUD_SITE_URL } from "@/lib/desktop-cloud";
import { useTracker } from "./TrackerProvider";
import { Panel, fmtDate } from "./ui";

const errors: Record<string, string> = {
  account_save_not_found: "Энэ Steam бүртгэлийн save файл олдсонгүй. Өөр бүртгэлийн save вэб рүү илгээгдэхгүй.",
  invalid_token: "Холболтын эрх цуцлагдсан. Steam-ээр дахин нэвтэрнэ үү.",
  upload_failed: "Вэб рүү илгээж чадсангүй. App автоматаар дахин оролдоно.",
};

export function DesktopCloudPanel() {
  const { state, refresh } = useTracker();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const link = state?.desktopCloud;
  const needsSignIn = !link || link.error === "invalid_token";

  const [sent, setSent] = useState<string | null>(null);

  async function sendNow() {
    setBusy(true);
    setError(null);
    setSent(null);
    try {
      const response = await fetch("/api/desktop/cloud", { method: "PUT" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error === "not_linked" ? "Вэбтэй холбогдоогүй байна. Steam-ээр дахин нэвтэрнэ үү." : "Вэб рүү илгээж чадсангүй. Дахин оролдоно уу.");
      } else if (body?.error) {
        setError(errors[body.error] ?? "Вэб рүү илгээж чадсангүй.");
      } else if (body?.lastResult) {
        setSent(body.lastResult === "unchanged" ? "Вэб дээрх ахиц аль хэдийн шинэ байна — баталгаажлаа." : "Шинэ ахиц вэб болон Firebase-д хадгалагдлаа.");
      } else {
        setError("Save файл олдсонгүй эсвэл бичигдэж байна. Тоглоомыг хадгалсны дараа дахин оролдоно уу.");
      }
      await refresh();
    } catch {
      setError("Вэбтэй холбогдож чадсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/desktop/cloud", { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(errors[body?.error] ?? "Вэбтэй холбогдож чадсангүй. Дахин оролдоно уу.");
        return;
      }
      const result = await response.json().catch(() => null);
      if (result?.remoteRevoked === false) setError("Энэ App синк хийхээ зогсоосон. Серверийн эрхийг вэб тохиргооноос цуцална уу.");
      await refresh();
    } catch {
      setError("Вэбтэй холбогдож чадсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Вэбтэй синк хийх">
      <p className="text-sm text-ash-300">App нээлттэй үед энэ Steam бүртгэлийн save ахиц автоматаар Firebase-д хадгалагдана. Вэб дээр ижил бүртгэлээр нэвтэрч ахиц болон Steam achievement-аа харна уу.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {needsSignIn && <a className="btn btn-ember" href="/login">Steam-ээр дахин нэвтэрч синк асаах</a>}
        <a className="btn btn-sm" href={`${CLOUD_SITE_URL}/characters`} target="_blank" rel="noreferrer">Вэб дээр ахицаа харах ↗</a>
      </div>
      {link && (
        <div className="mt-4 space-y-2 text-sm" aria-live="polite">
          {link.error ? <p className="text-warning">{errors[link.error]}</p> : <p className="text-ember-300">{link.lastSyncedAt ? `Вэбтэй синк хийсэн · ${fmtDate(link.lastSyncedAt)}${link.lastResult === "unchanged" ? " · вэб дээр аль хэдийн шинэ" : ""}` : "Холбогдсон · save хүлээж байна"}</p>}
          <div className="flex flex-wrap gap-2">
            {link.error !== "invalid_token" && <button className="btn btn-sm btn-ember" disabled={busy} aria-busy={busy} onClick={() => void sendNow()}>Одоо вэб рүү илгээх</button>}
            <button className="btn btn-sm" disabled={busy} onClick={() => void disconnect()}>Холболт салгах</button>
          </div>
        </div>
      )}
      {sent && <p role="status" className="mt-3 text-sm text-success">{sent}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-warning">{error}</p>}
    </Panel>
  );
}
