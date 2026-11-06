import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export function requireEnv(name: string): string {
  const v = env(name);
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}

export const isProduction = () => process.env.NODE_ENV === "production";

/**
 * Set by the desktop (Electron) wrapper so the same `next build` output can run
 * locally with zero configuration: no Firebase project, no hand-set SESSION_SECRET.
 * Never set in the hosted/Vercel deployment.
 */
export const isDesktopApp = () => env("LORDRAN_DESKTOP") === "1";

/** Writable per-user directory for local state (dev-file store, generated secret). */
export function dataDir(): string {
  const d = env("LORDRAN_DATA_DIR") ?? process.cwd();
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export function appUrl(): string {
  return (env("APP_URL") ?? (env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : "http://localhost:3000")).replace(/\/$/, "");
}

export function firebaseConfigured(): boolean {
  return !!(env("FIREBASE_PROJECT_ID") && env("FIREBASE_CLIENT_EMAIL") && env("FIREBASE_PRIVATE_KEY"));
}

/** Generated once and persisted to disk so desktop sessions survive an app restart. */
function desktopSessionSecret(): string {
  const file = path.join(dataDir(), "session.key");
  try {
    const existing = fs.readFileSync(file, "utf8").trim();
    if (existing.length >= 32) return existing;
  } catch {
    /* first run */
  }
  const generated = crypto.randomBytes(48).toString("base64");
  fs.writeFileSync(file, generated, { mode: 0o600 });
  return generated;
}

export function sessionSecret(): Uint8Array {
  const s = env("SESSION_SECRET");
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (isDesktopApp()) return new TextEncoder().encode(desktopSessionSecret());
  if (isProduction()) throw new Error("SESSION_SECRET must be set (>= 32 chars) in production");
  return new TextEncoder().encode("dev-only-insecure-session-secret-change-me-please!!");
}
