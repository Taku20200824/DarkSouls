import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSave, isValidName } from "@/lib/save/ds1";
import { parseBnd4, checksumOk, entryBlob } from "@/lib/save/bnd4";
import { SaveParseError } from "@/lib/save/types";
import { SyncPayloadSchema } from "@/lib/save/schema";
import bossFlags from "@/lib/data/ds1db/boss_flags.json";
import { buildDsr } from "./helpers/dsr";

/**
 * Real PtDE save from tarvitz/dsfp (MIT). dsfp's own test asserts:
 *   slot0 "Карл" deaths=155, slot1 "Максимилиантр" deaths=0, 2 valid slots.
 */
const PTDE = new Uint8Array(readFileSync("tests/fixtures/ptde-dsfp.sl2"));

describe("PtDE real save (tarvitz/dsfp fixture)", () => {
  const s = parseSave(PTDE);
  it("detects game and validates checksums", () => {
    expect(s.game).toBe("ptde");
    expect(s.entryCount).toBe(11);
    expect(s.checksumsValid).toBe(true);
  });
  it("finds exactly the 2 valid characters with the reference names and death counts", () => {
    expect(s.characters.map((c) => c.name.value)).toEqual(["Карл", "Максимилиантр"]);
    expect(s.characters[0].deaths).toEqual({ value: 155, certainty: "verified" });
    expect(s.characters[1].deaths.value).toBe(0);
  });
  it("stats obey the DS1 level rule", () => {
    const c = s.characters[1];
    const sum = Object.values(c.stats).reduce((a, f) => a + (f.value ?? 0), 0);
    expect(c.className.value).toBe("Bandit");
    expect(sum - 82).toBe(c.level.value);
  });
  it("reads play time from the load-screen roster", () => {
    expect(s.characters[1].playTimeSeconds.value).toBe(4363);
    expect(s.characters[1].playTimeSeconds.certainty).toBe("verified");
  });
  it("reads inventory, bonfires and verified boss flags", () => {
    const c = s.characters[0];
    expect(c.inventory.length).toBeGreaterThan(50);
    expect(c.unknownItemCount).toBe(0);
    expect(c.bonfires.certainty).toBe("verified");
    expect(c.bosses["Taurus Demon"]).toContain("flag");
    expect(c.ngCycle.certainty).toBe("unknown"); // NG offset only calibrated for DSR
  });
  it("never mutates its input", () => {
    const copy = PTDE.slice();
    parseSave(copy);
    expect(Buffer.compare(Buffer.from(copy), Buffer.from(PTDE))).toBe(0);
  });
  it("produces payloads that pass server validation", () => {
    const r = SyncPayloadSchema.safeParse({ ...s, client: "companion", consent: true });
    if (!r.success) console.error(r.error.issues.slice(0, 3));
    expect(r.success).toBe(true);
  });
});

describe("DSR synthetic save (encryption + anchor)", () => {
  it("decrypts AES-CBC entries and reads the documented DSR fields", () => {
    const s = parseSave(buildDsr());
    expect(s.game).toBe("dsr");
    expect(s.checksumsValid).toBe(true);
    expect(s.characters).toHaveLength(1);
    const c = s.characters[0];
    expect(c.name.value).toBe("Тест");
    expect(c.level.value).toBe(42);
    expect(c.className.value).toBe("Knight");
    expect(c.gender.value).toBe("Female");
    expect(c.souls.value).toBe(13377);
    expect(c.humanity.value).toBe(4);
    expect(c.deaths.value).toBe(77);
    expect(c.ngCycle.value).toBe(2);
    // NG+2 => mandatory bosses inferred dead
    expect(c.bosses["Gwyn, Lord of Cinder"]).toEqual(["ng-clear"]);
    // bonfires not present in synthetic data => unknown, not invented
    expect(c.bonfires.certainty).toBe("unknown");
  });
  it("detects partially written / corrupted files via MD5", () => {
    const f = buildDsr();
    const e = parseBnd4(f)[3];
    f[e.offset + 100] ^= 0xff;
    expect(checksumOk(entryBlob(f, e))).toBe(false);
    expect(parseSave(f).checksumsValid).toBe(false);
  });
  it("follows the death and flag structs when a DSR save places them elsewhere", () => {
    const shift = -184; // measured on a real DSR save
    const [flagOff, flagMask] = bossFlags["Taurus Demon"];
    const s = parseSave(
      buildDsr((slot) => {
        const dv = new DataView(slot.buffer);
        dv.setUint32(0x1f2d8 + 4, 0, true);
        const off = 0x1f2d8 + shift;
        dv.setUint32(off, 160, true);
        dv.setUint32(off + 4, 0xffffffff, true);
        slot.set([0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00], off + 12);
        dv.setUint32(127721 + shift + flagOff, flagMask, true);
      }),
    );
    const c = s.characters[0];
    expect(c.deaths).toEqual({ value: 160, certainty: "verified" });
    expect(c.bosses["Taurus Demon"]).toContain("flag");
    // The calibrated NG byte holds unrelated data in this layout (the fixture sets it to 2).
    expect(c.ngCycle.value).toBe(0);
    expect(c.ngCycle.certainty).toBe("inferred");
    expect(c.bosses["Gwyn, Lord of Cinder"]).toBeUndefined();
  });

  it("reports unknown deaths when the sentinel is missing", () => {
    const s = parseSave(buildDsr((slot) => new DataView(slot.buffer).setUint32(0x1f2d8 + 4, 0, true)));
    expect(s.characters[0].deaths.certainty).toBe("unknown");
    expect(s.characters[0].deaths.value).toBeNull();
  });
});

describe("hostile input", () => {
  it("rejects non-BND4 data", () => {
    expect(() => parseSave(new Uint8Array(1000))).toThrow(SaveParseError);
  });
  it("rejects entry tables pointing outside the file", () => {
    const f = new Uint8Array(0x40 + 0x20 * 11);
    f.set([0x42, 0x4e, 0x44, 0x34]);
    new DataView(f.buffer).setUint32(12, 11, true);
    new DataView(f.buffer).setUint32(0x40 + 8, 0xfffffff, true);
    expect(() => parseSave(f)).toThrow(/outside/);
  });
  it("rejects absurd entry counts", () => {
    const f = new Uint8Array(0x100);
    f.set([0x42, 0x4e, 0x44, 0x34]);
    new DataView(f.buffer).setUint32(12, 100000, true);
    expect(() => parseSave(f)).toThrow(/count/);
  });
  it("name validation rejects garbage code points", () => {
    expect(isValidName("Карл")).toBe(true);
    expect(isValidName("Solaire")).toBe(true);
    expect(isValidName("ȃȁȀĂ")).toBe(false);
    expect(isValidName("")).toBe(false);
  });
});
