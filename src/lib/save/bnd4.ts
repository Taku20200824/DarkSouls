import { cbc } from "@noble/ciphers/aes";
import { md5 } from "@noble/hashes/legacy";
import { bytesEqual, hexToBytes, u32, u64 } from "./bytes";
import { SaveParseError, type GameVariant } from "./types";

/**
 * BND4 container + DSR entry crypto.
 * Format notes (cross-checked against darthdemono/sl2-analyzer (Apache-2.0),
 * pawREP/Dark-Souls-Remastered-SL2-Unpacker (MIT) and the Souls Modding wiki):
 *   header 0x40 bytes, "BND4" magic, entry count u32 @0x0C,
 *   entry headers 0x20 bytes each from 0x40: size u64 @+8, data offset u32 @+0x10.
 *   Each DSR entry blob = MD5(16) | IV(16) | AES-128-CBC ciphertext.
 *   MD5 covers everything after the first 16 bytes. The plaintext starts with a u32 length.
 *   PtDE (Prepare to Die) entries are MD5(16) | plaintext (not encrypted).
 */

export const DSR_KEY = hexToBytes("0123456789ABCDEFFEDCBA9876543210");
const HEADER_LEN = 0x40;
const ENTRY_LEN = 0x20;
/** Hard cap so a hostile file cannot make us allocate/iterate absurdly. */
export const MAX_SAVE_BYTES = 16 * 1024 * 1024;

export interface Bnd4Entry {
  index: number;
  offset: number;
  size: number;
}

export function parseBnd4(data: Uint8Array): Bnd4Entry[] {
  if (data.length > MAX_SAVE_BYTES) throw new SaveParseError("File too large to be a Dark Souls save.");
  if (data.length < HEADER_LEN || data[0] !== 0x42 || data[1] !== 0x4e || data[2] !== 0x44 || data[3] !== 0x34)
    throw new SaveParseError("Not a BND4 / .sl2 file.");
  const count = u32(data, 12);
  if (count === null || count <= 0 || count > 64) throw new SaveParseError(`Implausible BND4 entry count: ${count}`);
  const entries: Bnd4Entry[] = [];
  for (let i = 0; i < count; i++) {
    const base = HEADER_LEN + ENTRY_LEN * i;
    if (base + ENTRY_LEN > data.length) throw new SaveParseError(`Truncated entry header #${i}.`);
    const size = u64(data, base + 8);
    const offset = u32(data, base + 16);
    if (size === null || offset === null || size <= 32 || offset + size > data.length)
      throw new SaveParseError(`Entry #${i} points outside the file.`);
    entries.push({ index: i, offset, size });
  }
  return entries;
}

export function entryBlob(data: Uint8Array, e: Bnd4Entry): Uint8Array {
  return data.subarray(e.offset, e.offset + e.size);
}

/** True when blob[0:16] == MD5(blob[16:]). A partially written save fails this. */
export function checksumOk(blob: Uint8Array): boolean {
  if (blob.length < 32) return false;
  return bytesEqual(md5(blob.subarray(16)), blob.subarray(0, 16));
}

/**
 * Which DS1 release wrote this file. DSR has 11 entries and an all-zero signature
 * at 0x18..0x20; PtDE has 11 entries with a non-zero signature.
 */
export function detectVariant(data: Uint8Array, entries: Bnd4Entry[]): GameVariant {
  if (entries.length !== 11) {
    throw new SaveParseError(
      `This does not look like a Dark Souls (Remastered) save: expected 11 BND4 entries, found ${entries.length}.`,
    );
  }
  let zero = true;
  for (let i = 24; i < 32; i++) if (data[i] !== 0) zero = false;
  return zero ? "dsr" : "ptde";
}

/** Decrypt one DSR entry, returning the game data (after the u32 length prefix) or null. */
export function decryptDsrEntry(blob: Uint8Array): Uint8Array | null {
  if (blob.length < 48) return null;
  const iv = blob.slice(16, 32);
  const ctLen = Math.floor((blob.length - 32) / 16) * 16;
  const ct = blob.slice(32, 32 + ctLen);
  let pt: Uint8Array;
  try {
    pt = cbc(DSR_KEY, iv, { disablePadding: true }).decrypt(ct);
  } catch {
    return null;
  }
  const len = u32(pt, 0);
  if (len === null || len <= 0 || len > pt.length - 4) return null;
  return pt.subarray(4, 4 + len);
}

/** PtDE entries are not encrypted: strip the 16-byte MD5. */
export function decodePtdeEntry(blob: Uint8Array): Uint8Array {
  return blob.subarray(16);
}

/** Build a DSR entry blob from plaintext game data (used only by tests to create fixtures). */
export function encryptDsrEntry(gameData: Uint8Array, iv: Uint8Array, totalCipherLen: number): Uint8Array {
  const pt = new Uint8Array(totalCipherLen);
  new DataView(pt.buffer).setUint32(0, gameData.length, true);
  pt.set(gameData, 4);
  const ct = cbc(DSR_KEY, iv, { disablePadding: true }).encrypt(pt);
  const body = new Uint8Array(16 + ct.length);
  body.set(iv, 0);
  body.set(ct, 16);
  const blob = new Uint8Array(16 + body.length);
  blob.set(md5(body), 0);
  blob.set(body, 16);
  return blob;
}
