import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(dir, "icon-source.svg"));

const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngBuffers = await Promise.all(
  sizes.map((size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()),
);

await sharp(svg, { density: 384 }).resize(1024, 1024).png().toFile(join(dir, "icon.png"));

const ico = await pngToIco(pngBuffers);
writeFileSync(join(dir, "icon.ico"), ico);

console.log("Wrote build/icon.png and build/icon.ico");
