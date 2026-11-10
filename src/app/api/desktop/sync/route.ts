import { withUser, ok } from "@/lib/server/api";
import { syncDesktopSave } from "@/lib/server/desktop-sync";
import { isDesktopApp } from "@/lib/server/env";
import { withDesktopLock } from "@/lib/server/desktop-cloud";
import { jsonError } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Desktop build only: the hosted site has no access to the player's disk. */
export const POST = withUser(
  async ({ steamId, store }) => {
    if (!isDesktopApp()) return jsonError(404, "not_found");
    return withDesktopLock(steamId, async () => ok(await syncDesktopSave(steamId, store)));
  },
  { mutation: true, limit: 30 },
);
