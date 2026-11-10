import { describe, expect, it } from "vitest";
import { parseLatestYml } from "@/lib/downloads";

const YML = `version: 0.1.4
files:
  - url: Lordran Tracker-Setup-0.1.4.exe
    sha512: abc==
    size: 144401578
path: Lordran Tracker-Setup-0.1.4.exe
sha512: abc==
releaseDate: '2026-11-10T01:18:32.643Z'
`;

describe("latest.yml parsing", () => {
  it("reads the top-level version, installer path and release date", () => {
    expect(parseLatestYml(YML)).toEqual({ version: "0.1.4", path: "Lordran Tracker-Setup-0.1.4.exe", releaseDate: "2026-11-10T01:18:32.643Z" });
  });
  it("rejects manifests without a version or with a path outside the store root", () => {
    expect(parseLatestYml("path: x.exe")).toBeNull();
    expect(parseLatestYml("version: 1.0.0\npath: ../evil.exe")).toBeNull();
    expect(parseLatestYml("version: 1.0.0\npath: https://evil.example/x.exe")).toBeNull();
  });
});
