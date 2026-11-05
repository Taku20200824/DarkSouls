/**
 * Bounds-checked little-endian readers. Every read that would run off the end of
 * the buffer returns null instead of throwing or reading garbage — untrusted save
 * files are parsed through these and nothing else.
 */
export function readUint(buf: Uint8Array, off: number, size: 1 | 2 | 4): number | null {
  if (!Number.isInteger(off) || off < 0 || off + size > buf.length) return null;
  let v = 0;
  for (let i = size - 1; i >= 0; i--) v = v * 256 + buf[off + i];
  return v;
}
export const u8 = (b: Uint8Array, o: number) => readUint(b, o, 1);
export const u16 = (b: Uint8Array, o: number) => readUint(b, o, 2);
export const u32 = (b: Uint8Array, o: number) => readUint(b, o, 4);
/** u64 as a JS number; returns null when it would exceed 2^53. */
export function u64(b: Uint8Array, o: number): number | null {
  const lo = u32(b, o);
  const hi = u32(b, o + 4);
  if (lo === null || hi === null) return null;
  if (hi >= 0x200000) return null;
  return hi * 0x1_0000_0000 + lo;
}

/** Find a byte pattern; returns -1 if absent. */
export function indexOf(hay: Uint8Array, needle: Uint8Array, from = 0): number {
  if (needle.length === 0) return from;
  const first = needle[0];
  const last = hay.length - needle.length;
  outer: for (let i = Math.max(0, from); i <= last; i++) {
    if (hay[i] !== first) continue;
    for (let j = 1; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/** Read a NUL-terminated UTF-16LE string of at most maxChars characters. */
export function readUtf16(buf: Uint8Array, off: number, maxChars: number): string {
  if (off < 0 || off >= buf.length) return "";
  const end = Math.min(buf.length, off + maxChars * 2);
  let s = "";
  for (let p = off; p + 1 < end; p += 2) {
    const c = buf[p] | (buf[p + 1] << 8);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
