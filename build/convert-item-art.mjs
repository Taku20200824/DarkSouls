import sharp from "sharp";
import { readdirSync, unlinkSync } from "node:fs";
import path from "node:path";

// Source PNGs (1024²) from Figma image generation → 256² WebP for ItemIcon.
const dir = path.join(import.meta.dirname, "..", "public", "artwork", "items");
const pngs = readdirSync(dir).filter((f) => f.endsWith(".png"));

for (const f of pngs) {
  const id = f.replace(/\.png$/, "");
  const src = path.join(dir, f);
  await sharp(src).resize(256, 256, { fit: "cover" }).webp({ quality: 82 }).toFile(path.join(dir, `${id}.webp`));
  if (process.argv.includes("--rm")) unlinkSync(src);
  console.log(`${id}.webp written`);
}
