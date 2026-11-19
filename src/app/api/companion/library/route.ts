import { ok, withCompanion } from "@/lib/server/api";
import { syncLibrary } from "@/lib/server/library";

export const dynamic = "force-dynamic";

/** For the Windows app (no Steam key): checks the token owner's games here and returns them. */
export const POST = withCompanion(async ({ steamId, store }) => ok({ library: await syncLibrary(store, steamId) }), 6);
