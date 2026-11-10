import { NextResponse } from "next/server";
import { latestDesktopRelease } from "@/lib/downloads";

export const revalidate = 60;

/** `{ version, url, releaseDate, fromManifest }` of the newest desktop installer. */
export async function GET() {
  return NextResponse.json(await latestDesktopRelease());
}
