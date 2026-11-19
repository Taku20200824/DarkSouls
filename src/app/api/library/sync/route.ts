import { withUser, ok } from "@/lib/server/api";
import { isDesktopApp } from "@/lib/server/env";
import { syncLibrary, syncLibraryViaCloud } from "@/lib/server/library";

export const dynamic = "force-dynamic";

/** Re-checks which Souls games the signed-in Steam account owns. */
export const POST = withUser(
  async ({ steamId, store }) => {
    const library = isDesktopApp() ? await syncLibraryViaCloud(store, steamId) : await syncLibrary(store, steamId);
    return ok({ library });
  },
  { mutation: true, limit: 6 },
);
