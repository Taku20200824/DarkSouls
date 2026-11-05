// Dev helper: write a synthetic DSR save. Usage: tsx tests/helpers/write-dsr.ts OUT DEATHS [taurusFlag]
import { writeFileSync, renameSync } from "node:fs";
import { buildDsr } from "./dsr";
const [out, deaths, taurus] = process.argv.slice(2);
const buf = buildDsr((slot) => {
  new DataView(slot.buffer).setUint32(0x1f2d8, Number(deaths), true);
  if (taurus) new DataView(slot.buffer).setUint32(127721 + 3952, 67108864, true); // Taurus Demon flag
});
writeFileSync(out + ".tmp", buf);
renameSync(out + ".tmp", out);
