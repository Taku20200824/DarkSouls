import sharp from "sharp";
import { readdirSync } from "node:fs";
import path from "node:path";

const dir = path.join(import.meta.dirname, "..", "public", "artwork", "areas");
const pngs = readdirSync(dir).filter((f) => f.endsWith(".png"));

for (const f of pngs) {
  const id = f.replace(/\.png$/, "");
  const src = path.join(dir, f);
  const dest = path.join(dir, `${id}.webp`);
  await sharp(src).resize(1024, 768, { fit: "cover" }).webp({ quality: 82 }).toFile(dest);
  console.log(`${id}.webp written`);
}
