import { NextResponse } from "next/server";
import { latestDesktopRelease } from "@/lib/downloads";

export const revalidate = 60;

/** Redirects to the newest desktop installer listed in the Blob store's latest.yml. */
export async function GET() {
  const release = await latestDesktopRelease();
  return NextResponse.redirect(release.url, 302);
}
