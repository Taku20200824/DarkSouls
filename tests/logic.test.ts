import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import { AREAS, CONNECTIONS, routeBetween } from "@/lib/data/areas";
import { BOSSES } from "@/lib/data/bosses";
import { QUESTS } from "@/lib/data/npcs";
import { UPGRADE_PATHS, planUpgrade, totalMaterials } from "@/lib/data/upgrades";
import { BOSS_FLAG_DB, BOSS_SOUL_DB, KNOWN_FLAG_DB } from "@/lib/save/itemdb";
import { bossStatus, computeObjectives, type TrackerContext } from "@/lib/guide/engine";
import { diffCharacters, charKey, withoutSeenBosses } from "@/lib/server/progress";
import { parseSave } from "@/lib/save/ds1";
import { demoState } from "@/lib/client/demo";

const real = parseSave(new Uint8Array(readFileSync("tests/fixtures/ptde-dsfp.sl2")));

describe("static data integrity", () => {
  it("has exactly 41 unique achievements", () => {
    expect(ACHIEVEMENTS).toHaveLength(41);
    expect(new Set(ACHIEVEMENTS.map((a) => a.name)).size).toBe(41);
  });
  it("connections reference existing areas, bosses reference existing areas", () => {
    const ids = new Set(AREAS.map((a) => a.id));
    for (const c of CONNECTIONS) expect(ids.has(c.from) && ids.has(c.to), `${c.from}->${c.to}`).toBe(true);
    for (const b of BOSSES) expect(ids.has(b.area), b.id).toBe(true);
    for (const a of AREAS) for (const b of a.bosses) expect(BOSSES.some((x) => x.id === b), b).toBe(true);
  });
  it("boss evidence names line up with the save tables", () => {
    const canon = new Set([...Object.keys(BOSS_FLAG_DB), ...Object.values(BOSS_SOUL_DB)]);
    for (const name of canon) expect(BOSSES.some((b) => b.evidence.includes(name)), name).toBe(true);
  });
  it("covenant hints use real flag names", () => {
    const flags = new Set(KNOWN_FLAG_DB["Join Covenants"].map((r) => r[2]));
    for (const a of ACHIEVEMENTS) if (a.saveHint?.kind === "covenantFlag") expect(flags.has(a.saveHint.flag), a.name).toBe(true);
  });
  it("quest flags exist", () => {
    const npc = new Set(KNOWN_FLAG_DB.NPC.map((r) => r[2]));
    for (const q of QUESTS) {
      if (q.deathFlag) expect(npc.has(q.deathFlag), q.deathFlag).toBe(true);
      for (const s of q.stages) if (s.flag) expect(npc.has(s.flag.name), s.flag.name).toBe(true);
    }
  });
  it("whole world is connected", () => {
    for (const a of AREAS) expect(routeBetween("firelink-shrine", a.id).length, a.id).toBeGreaterThan(0);
    expect(routeBetween("firelink-shrine", "anor-londo")).toEqual(["firelink-shrine", "undead-parish", "sens-fortress", "anor-londo"]);
  });
});

describe("upgrade planner", () => {
  it("normal +0 -> +15 totals match the wiki table", () => {
    const t = Object.fromEntries(totalMaterials(planUpgrade("normal", 0, "normal", 15)!).map((x) => [x.material, x.qty]));
    expect(t).toEqual({ "Titanite Shard": 9, "Large Titanite Shard": 9, "Titanite Chunk": 7, "Titanite Slab": 1 });
  });
  it("crystal +5 from normal +0 (wiki totals 9/9/8/1)", () => {
    const t = Object.fromEntries(totalMaterials(planUpgrade("normal", 0, "crystal", 5)!).map((x) => [x.material, x.qty]));
    expect(t).toEqual({ "Titanite Shard": 9, "Large Titanite Shard": 9, "Titanite Chunk": 8, "Titanite Slab": 1 });
  });
  it("chaos +5 goes through fire +5 with the right embers", () => {
    const plan = planUpgrade("normal", 3, "chaos", 5)!;
    const t = Object.fromEntries(totalMaterials(plan).map((x) => [x.material, x.qty]));
    expect(t).toEqual({ "Titanite Shard": 5, "Green Titanite Shard": 10, "Red Titanite Chunk": 8, "Red Titanite Slab": 1 });
    expect(plan.some((l) => l.ember === "Chaos Flame Ember")).toBe(true);
  });
  it("magic +10 totals (wiki: 10 green, 7 blue chunk, 1 slab)", () => {
    const t = Object.fromEntries(totalMaterials(planUpgrade("magic", 0, "magic", 10)!).map((x) => [x.material, x.qty]));
    expect(t).toEqual({ "Green Titanite Shard": 9, "Blue Titanite Chunk": 7, "Blue Titanite Slab": 1 });
  });
  it("refuses impossible routes and unverified paths", () => {
    expect(planUpgrade("normal", 12, "raw", 5)).toBeNull(); // past the +5 branch point
    expect(planUpgrade("fire", 5, "magic", 5)).toBeNull();
    expect(planUpgrade("normal", 0, "boss", 5)).toBeNull();
    expect(UPGRADE_PATHS.filter((p) => !p.verified).every((p) => p.steps === null)).toBe(true);
  });
});

describe("boss status + objectives", () => {
  const ctx = (over: Partial<TrackerContext> = {}): TrackerContext => ({ character: real.characters[0], achievements: null, manualBosses: {}, manualAchievements: {}, ...over });
  it("flag evidence => verified defeated; unset flag => alive; no flag => unknown", () => {
    const taurus = BOSSES.find((b) => b.id === "taurus-demon")!;
    const stray = BOSSES.find((b) => b.id === "stray-demon")!;
    const nito = BOSSES.find((b) => b.id === "nito")!;
    expect(bossStatus(taurus, ctx())).toMatchObject({ state: "defeated", certainty: "verified" });
    expect(bossStatus(stray, ctx())).toMatchObject({ state: "alive", certainty: "verified" });
    expect(bossStatus(nito, ctx())).toMatchObject({ state: "unknown" });
  });
  it("steam achievement => inferred; manual => manual", () => {
    const nito = BOSSES.find((b) => b.id === "nito")!;
    expect(bossStatus(nito, ctx({ achievements: { "Defeat Gravelord Nito": { unlocked: true, unlockTime: 1 } } }))).toMatchObject({ state: "defeated", certainty: "inferred" });
    expect(bossStatus(nito, ctx({ manualBosses: { nito: true } }))).toMatchObject({ state: "defeated", certainty: "manual" });
  });
  it("with no data, nothing is claimed done", () => {
    const objs = computeObjectives({ character: null, achievements: null, manualBosses: {}, manualAchievements: {} });
    expect(objs.every((o) => !o.done)).toBe(true);
  });
});

describe("snapshot diff", () => {
  const base = real.characters[1];
  it("does not celebrate a boss again when it drops out of one parse and returns", () => {
    const back = structuredClone(base);
    back.bosses = { ...back.bosses, "Capra Demon": ["flag"] };
    const ev = diffCharacters(base, back, 1, "k", "Companion");
    expect(ev.some((e) => e.type === "boss")).toBe(true);
    expect(withoutSeenBosses(ev, new Set(["Capra Demon"])).some((e) => e.type === "boss")).toBe(false);
    expect(withoutSeenBosses(ev, new Set())).toEqual(ev);
  });

  it("detects death increases, level ups and new bosses — and nothing when unchanged", () => {
    expect(diffCharacters(base, base, 1, "k", "Companion")).toEqual([]);
    const next = structuredClone(base);
    next.deaths = { value: 3, certainty: "verified" };
    next.level = { value: 15, certainty: "verified" };
    next.bosses = { ...next.bosses, "Capra Demon": ["flag"] };
    const ev = diffCharacters(base, next, 10, "k", "Companion");
    expect(ev.map((e) => e.type).sort()).toEqual(["boss", "death", "level"]);
    const d = ev.find((e) => e.type === "death")!;
    expect(d.data).toEqual({ from: 0, to: 3, delta: 3 });
    expect(d.attribution?.label).toBe("Unconfirmed");
  });
  it("unknown death counts never produce events", () => {
    const next = structuredClone(base);
    next.deaths = { value: null, certainty: "unknown" };
    expect(diffCharacters(base, next, 1, "k", "Companion").filter((e) => e.type === "death")).toEqual([]);
  });
  it("character key is stable per slot+name", () => {
    expect(charKey(base)).toBe(charKey(structuredClone(base)));
    expect(charKey(base)).not.toBe(charKey(real.characters[0]));
  });
});

describe("demo mode", () => {
  it("is explicitly labelled", () => {
    const d = demoState(0);
    expect(d.demo).toBe(true);
    expect(d.storeKind).toBe("demo");
    expect(d.characters[0].character.notes[0]).toMatch(/DEMO/);
  });
});
