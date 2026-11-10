import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as { version: string };

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Shown in the sidebar and settings, so users can tell which build they are running.
  // NEXT_PUBLIC_DESKTOP_BUILD marks the Electron build, so pages can drop things that only
  // make sense on the website (e.g. "download the desktop app" inside the app itself).
  env: { NEXT_PUBLIC_APP_VERSION: version, NEXT_PUBLIC_DESKTOP_BUILD: process.env.ELECTRON_BUILD === "1" ? "1" : "" },
  // Standalone output is how the Electron desktop build packages a minimal,
  // self-contained server (see electron/main.js, build/copy-standalone.mjs and the
  // "dist:win" script). Only enabled for that build — Vercel has its own output
  // handling and some Next versions have had packaging issues with this set globally.
  ...(process.env.ELECTRON_BUILD === "1" ? { output: "standalone" as const } : {}),
  serverExternalPackages: ["firebase-admin"],
  images: {
    // Desktop build: serve images as-is. The optimizer caches into .next/cache/images
    // inside the install folder, whose long hashed file names can pass Windows' 260-char
    // path limit and make the NSIS uninstaller (run on every update) fail. All local art
    // is already small WebP, so there's nothing to gain from optimizing on a local server.
    ...(process.env.ELECTRON_BUILD === "1" ? { unoptimized: true } : {}),
    remotePatterns: [
      { protocol: "https", hostname: "avatars.steamstatic.com" },
      { protocol: "https", hostname: "avatars.akamai.steamstatic.com" },
      { protocol: "https", hostname: "steamcdn-a.akamaihd.net" },
      { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
      { protocol: "https", hostname: "shared.akamai.steamstatic.com" },
      { protocol: "https", hostname: "cdn.fastly.steamstatic.com" },
      { protocol: "https", hostname: "shared.fastly.steamstatic.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
