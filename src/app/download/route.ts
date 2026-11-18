import { NextResponse } from "next/server";
import { latestDesktopRelease } from "@/lib/downloads";

// Resolved per request (latestDesktopRelease() itself caches latest.yml for 60 s). As a
// statically revalidated route, Vercel kept serving the redirect baked in at build time
// ("STALE") after a new release, so the button offered the previous installer.
export const dynamic = "force-dynamic";

/** Redirects to the newest desktop installer listed in the latest GitHub release's latest.yml. */
export async function GET() {
  const release = await latestDesktopRelease();
  const res = NextResponse.redirect(release.url, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
