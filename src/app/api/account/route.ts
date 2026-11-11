import { NextResponse } from "next/server";
import { z } from "zod";
import { withUser, readJson } from "@/lib/server/api";
import { deleteAccountData } from "@/lib/server/account";
import { cloudLinkPath, revokeCloudLink, withDesktopLock, type CloudLink } from "@/lib/server/desktop-cloud";
import { isDesktopApp } from "@/lib/server/env";
import { jsonError } from "@/lib/server/security";
import { SESSION_COOKIE } from "@/lib/server/session";
import { DELETE_CONFIRMATION } from "@/lib/account";

export const dynamic = "force-dynamic";

// The user has to type this word; a stray click or a replayed request can't wipe an account.
const Body = z.object({ confirm: z.literal(DELETE_CONFIRMATION) });

/**
 * Deletes the signed-in account's data and signs out. Cookie session + same-origin check
 * (withUser mutation) + typed confirmation. In the Windows app this clears the app's local
 * copy and revokes its upload token; the copy on the website is deleted from the website.
 */
export const DELETE = withUser(
  async ({ req, steamId, store }) => {
    const body = Body.safeParse(await readJson(req, 1_000).catch(() => null));
    if (!body.success) return jsonError(422, "confirmation_required");

    let remoteRevoked: boolean | null = null;
    if (isDesktopApp()) {
      await withDesktopLock(steamId, async () => {
        const link = await store.get<CloudLink>(cloudLinkPath(steamId));
        remoteRevoked = link ? await revokeCloudLink(link.token) : null;
      });
    }
    const { tokensRevoked } = await deleteAccountData(store, steamId);

    const res = NextResponse.json({ ok: true, tokensRevoked, remoteRevoked, scope: isDesktopApp() ? "desktop" : "web" });
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  },
  { mutation: true, limit: 3 },
);
