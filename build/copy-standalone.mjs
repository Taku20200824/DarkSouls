// Next.js `output: "standalone"` traces only the files server.js actually needs —
// it does NOT copy public/ or .next/static/, so the desktop build does that here.
// https://nextjs.org/docs/app/api-reference/config/next-config-js/output
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error("Missing .next/standalone — run `next build` with ELECTRON_BUILD=1 first.");
  process.exit(1);
}

mkdirSync(join(standalone, "public"), { recursive: true });
cpSync(join(root, "public"), join(standalone, "public"), { recursive: true });
cpSync(join(root, ".next", "static"), join(standalone, ".next", "static"), { recursive: true });

console.log("Copied public/ and .next/static/ into .next/standalone/");
