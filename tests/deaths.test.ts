import { describe, expect, it } from "vitest";
import { deathStats } from "@/lib/deaths";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const day = (t: number) => new Date(t).toISOString().slice(0, 10);

describe("death analytics", () => {
  // Played on day 0, app closed for 10 days, then one sync jumps the counter 203 → 287.
  const t0 = Date.UTC(2026, 10, 9, 10);
  const back = t0 + 10 * DAY;
  const snaps = [
    { at: t0, deaths: 200 },
    { at: t0 + 10 * MIN, deaths: 202 },
    { at: t0 + 50 * MIN, deaths: 202 },
    { at: t0 + 80 * MIN, deaths: 203 },
    { at: back, deaths: 287 },
    { at: back + 5 * MIN, deaths: 288 },
  ];
  const deaths = [
    { at: t0 + 10 * MIN, data: { delta: 2 } },
    { at: t0 + 80 * MIN, data: { delta: 1 } },
    { at: back, data: { delta: 84 } },
    { at: back + 5 * MIN, data: { delta: 1 } },
  ];

  it("does not pile deaths from an unsynced gap onto the day and session of the sync", () => {
    const s = deathStats(deaths, snaps, back + 10 * MIN, day);
    expect(s.undated).toBe(84);
    expect(s.today).toBe(1);
    expect(s.session).toBe(1);
    expect(s.sessionLive).toBe(true);
    expect(s.perDay).toEqual([[day(t0), 3], [day(back), 1]]);
  });

  it("measures the longest death-free stretch only while playing, not across the gap", () => {
    const s = deathStats(deaths, snaps, back + 10 * MIN, day);
    expect(s.longestAliveMs).toBe(40 * MIN); // 10 → 50 min on day 0, before the death at 80 min
  });

  it("has no current session when nothing synced for over 2 hours", () => {
    const s = deathStats(deaths, snaps, back + 3 * HOUR, day);
    expect(s.sessionLive).toBe(false);
    expect(s.session).toBe(0);
  });

  it("uses the previous sync time stored on newer events", () => {
    const s = deathStats([{ at: back, data: { delta: 5, sinceAt: back - 20 * MIN } }], [{ at: back, deaths: 5 }], back, day);
    expect(s.undated).toBe(0);
    expect(s.today).toBe(5);
  });
});
