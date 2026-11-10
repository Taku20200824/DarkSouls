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
          {link.error ? <p className="text-warning">{errors[link.error]}</p> : <p className="text-ember-300">{link.lastSyncedAt ? `Вэбтэй синк хийсэн · ${fmtDate(link.lastSyncedAt)}` : "Холбогдсон · save хүлээж байна"}</p>}
          <button className="btn btn-sm" disabled={busy} onClick={() => void disconnect()}>Холболт салгах</button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-warning">{error}</p>}
    </Panel>
  );
}
