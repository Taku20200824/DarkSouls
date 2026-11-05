import { withUser, ok } from "@/lib/server/api";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Creates a single-use 8-character pairing code valid for 10 minutes. */
export const POST = withUser(
  async ({ steamId, store }) => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const code = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
    const expiresAt = Date.now() + 10 * 60_000;
    await store.set(`pairing/${code}`, { steamId, expiresAt });
    return ok({ code, expiresAt });
  },
  { mutation: true, limit: 10 },
);
