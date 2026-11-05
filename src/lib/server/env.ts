import "server-only";

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

export function appUrl(): string {
  return (env("APP_URL") ?? (env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : "http://localhost:3000")).replace(/\/$/, "");
}

export function firebaseConfigured(): boolean {
  return !!(env("FIREBASE_PROJECT_ID") && env("FIREBASE_CLIENT_EMAIL") && env("FIREBASE_PRIVATE_KEY"));
}

export function sessionSecret(): Uint8Array {
  const s = env("SESSION_SECRET");
  if (!s || s.length < 32) {
    if (isProduction()) throw new Error("SESSION_SECRET must be set (>= 32 chars) in production");
    return new TextEncoder().encode("dev-only-insecure-session-secret-change-me-please!!");
  }
  return new TextEncoder().encode(s);
}
