import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import { AREAS, CONNECTIONS, areaById, areaHasBonfire, connectionBetween, routeBetween } from "@/lib/data/areas";
import { BOSSES } from "@/lib/data/bosses";
import { QUESTS } from "@/lib/data/npcs";
import { UPGRADE_PATHS, planUpgrade, totalMaterials } from "@/lib/data/upgrades";
import { BOSS_FLAG_DB, BOSS_SOUL_DB, KNOWN_FLAG_DB } from "@/lib/save/itemdb";
import { bossStatus, computeObjectives, nextObjective, type TrackerContext } from "@/lib/guide/engine";
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
    for (const boss of BOSSES) expect(areaById(boss.area)?.bosses, boss.id).toContain(boss.id);
    for (const a of AREAS) for (const b of a.bosses) expect(BOSSES.some((x) => x.id === b && x.area === a.id), b).toBe(true);
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
  it("routes follow one-way transitions and show the standard progression without optional shortcuts", () => {
    expect(connectionBetween("the-abyss", "new-londo-ruins")).toBeUndefined();
    expect(routeBetween("the-abyss", "new-londo-ruins")).toEqual(["the-abyss", "firelink-shrine", "new-londo-ruins"]);
    expect(routeBetween("firelink-shrine", "blighttown", false)).toEqual(["firelink-shrine", "undead-burg", "lower-undead-burg", "depths", "blighttown"]);
    expect(routeBetween("firelink-shrine", "blighttown")).toEqual(["firelink-shrine", "new-londo-ruins", "valley-of-drakes", "blighttown"]);
    expect(routeBetween("oolacile", "chasm-of-the-abyss", false)).toEqual(["oolacile", "royal-wood", "oolacile-township", "chasm-of-the-abyss"]);
    expect(routeBetween("firelink-shrine", "kiln-of-the-first-flame")).toEqual(["firelink-shrine", "firelink-altar", "kiln-of-the-first-flame"]);
  });
  it("assigns shared Oolacile bonfires only to their own areas", () => {
    const sanctuary = areaById("oolacile")!;
    const township = areaById("oolacile-township")!;
    expect(areaHasBonfire(sanctuary, 1211961, "Oolacile")).toBe(true);
    expect(areaHasBonfire(sanctuary, 1211962, "Oolacile")).toBe(false);
    expect(areaHasBonfire(township, 1211962, "Oolacile")).toBe(true);
    expect(areaHasBonfire(township, 1211961, "Oolacile")).toBe(false);
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
  it("Quelaag beaten via the Master Key route => Capra/Depths skipped, not the next objective", () => {
    const manual = { "asylum-demon": true, "taurus-demon": true, "bell-gargoyles": true, quelaag: true };
    const objs = computeObjectives(ctx({ character: null, manualBosses: manual }));
    const by = (id: string) => objs.find((o) => o.id === id)!;
    expect(by("capra").status).toBe("skipped");
    expect(by("depths").status).toBe("skipped");
    expect(nextObjective(objs)?.id).toBe("sens");
  });
  it("later progress implies non-bypassable prerequisites", () => {
    const objs = computeObjectives(ctx({ character: null, manualBosses: { "iron-golem": true } }));
    const by = (id: string) => objs.find((o) => o.id === id)!;
    expect(by("parish").status).toBe("implied");
    expect(by("quelaag").status).toBe("implied");
    expect(by("burg").status).toBe("implied");
    expect(nextObjective(objs)?.id).toBe("anor");
  });
  it("Darkroot before Anor Londo: next is still the main path, not a done branch", () => {
    const objs = computeObjectives(ctx({ character: null, manualBosses: { "asylum-demon": true, "taurus-demon": true, "bell-gargoyles": true, sif: true } }));
    expect(nextObjective(objs)?.id).toBe("capra");
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
