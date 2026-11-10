"use client";
import { useEffect, useState } from "react";
import type { DesktopRelease } from "@/lib/downloads";

/** Latest desktop release from `/api/desktop/latest`; null while loading or if it fails. */
export function useLatestDesktop(): DesktopRelease | null {
  const [release, setRelease] = useState<DesktopRelease | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/desktop/latest")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DesktopRelease | null) => { if (alive && d?.version) setRelease(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return release;
}
