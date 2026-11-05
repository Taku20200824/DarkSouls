import { encryptDsrEntry } from "@/lib/save/bnd4";

/** Build a synthetic DSR file: validates container + AES path + DSR anchor offsets. */
export function buildDsr(mutate?: (slot: Uint8Array) => void) {
  const SLOT_CT = 0x60000;
  const gameLen = SLOT_CT - 16;
  const slot = new Uint8Array(gameLen);
  const m = 0x2000; // anchor position
  const magic = [0x00, 0xff, 0xff, 0xff, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff];
  slot.set(magic, m);
  const dv = new DataView(slot.buffer);
  const stats = { Vitality: [-375, 20], Attunement: [-367, 10], Endurance: [-359, 22], Strength: [-351, 18], Dexterity: [-343, 14], Resistance: [-303, 10], Intelligence: [-335, 9], Faith: [-327, 20] } as const;
  for (const [, [d, v]] of Object.entries(stats)) slot[m + d] = v;
  const level = 20 + 10 + 22 + 18 + 14 + 10 + 9 + 20 - 81; // Knight K=81
  dv.setUint16(m - 295, level, true);
  dv.setUint32(m - 291, 13377, true); // souls
  slot[m - 233] = 1; // Knight
  slot[m - 237] = 0; // Female
  slot[m - 307] = 4; // humanity
  dv.setUint32(m - 419, 900, true);
  dv.setUint32(m - 391, 120, true);
  const name = "Тест";
  for (let i = 0; i < name.length; i++) dv.setUint16(m - 271 + i * 2, name.charCodeAt(i), true);
  slot[m + 0x1e3a7] = 2; // NG+2
  dv.setUint32(0x1f2d8, 77, true); // deaths
  dv.setUint32(0x1f2d8 + 4, 0xffffffff, true);
  mutate?.(slot);

  const entries: Uint8Array[] = [];
  for (let i = 0; i < 11; i++) {
    const iv = new Uint8Array(16).fill(i + 1);
    entries.push(i === 0 ? encryptDsrEntry(slot, iv, SLOT_CT) : encryptDsrEntry(new Uint8Array(64), iv, 0x100));
  }
  const header = 0x40 + 0x20 * 11;
  const total = header + entries.reduce((a, e) => a + e.length, 0);
  const out = new Uint8Array(total);
  out.set([0x42, 0x4e, 0x44, 0x34]);
  const odv = new DataView(out.buffer);
  odv.setUint32(12, 11, true);
  let off = header;
  entries.forEach((e, i) => {
    const b = 0x40 + 0x20 * i;
    odv.setUint32(b, 0x50, true);
    odv.setUint32(b + 4, 0xffffffff, true);
    odv.setUint32(b + 8, e.length, true);
    odv.setUint32(b + 16, off, true);
    out.set(e, off);
    off += e.length;
  });
  return out;
}

