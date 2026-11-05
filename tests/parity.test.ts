import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseSave } from "@/lib/save/ds1";
import { buildDsr } from "./helpers/dsr";

/** The Python companion parser must produce exactly what the TypeScript parser produces. */
const hasPy = spawnSync("python3", ["-c", "import cryptography"]).status === 0;
const py = (file: string) => JSON.parse(execFileSync("python3", ["companion/ds1parser.py", file], { encoding: "utf8", maxBuffer: 64 << 20 }));
const ts = (buf: Uint8Array) => JSON.parse(JSON.stringify(parseSave(buf)));

describe.skipIf(!hasPy)("TS <-> Python parser parity", () => {
  it("real PtDE fixture", () => {
    const f = "tests/fixtures/ptde-dsfp.sl2";
    expect(py(f)).toEqual(ts(new Uint8Array(readFileSync(f))));
  });
  it("synthetic encrypted DSR file", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "lt-"));
    const f = path.join(dir, "DRAKS0005.sl2");
    const buf = buildDsr();
    writeFileSync(f, buf);
    const out = py(f);
    expect(out.game).toBe("dsr");
    expect(out).toEqual(ts(buf));
  });
});
