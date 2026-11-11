// Microsoft Store (AppX/MSIX) tile and logo images, generated from the app icon.
// electron-builder picks these up from build/appx/ (buildResources/appx); without them it
// ships its own sample placeholder logos. Sizes are the ones the AppX manifest template uses.
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(dir, "icon-source.svg"));
const out = join(dir, "appx");
mkdirSync(out, { recursive: true });

const BG = { r: 5, g: 5, b: 6, alpha: 1 }; // --color-stone-950, same as appx.backgroundColor

/** Icon (with `pad` fraction of margin) centred on a w×h canvas. */
async function tile(name, w, h, pad, background = BG) {
  const side = Math.round(Math.min(w, h) * (1 - pad * 2));
  const icon = await sharp(svg, { density: 384 }).resize(side, side).png().toBuffer();
  await sharp({ create: { width: w, height: h, channels: 4, background } })
    .composite([{ input: icon, gravity: "centre" }])
    .png()
    .toFile(join(out, name));
  console.log(`build/appx/${name} ${w}x${h}`);
}

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
await tile("StoreLogo.png", 50, 50, 0.06, transparent);
await tile("Square44x44Logo.png", 44, 44, 0.04, transparent); // taskbar / Start list: no plate
await tile("Square150x150Logo.png", 150, 150, 0.16);
await tile("Wide310x150Logo.png", 310, 150, 0.14);
