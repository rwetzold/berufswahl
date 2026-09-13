import { describe, it, expect } from "vitest";
import {
  createRankingSession,
  choosePreferred,
  repairSessionWithoutHistory,
  restoreRankingSession,
  migrateLegacySession,
} from "../src/ranking.js";
const jobs = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `job${i}`, title: `Beruf ${i}` }));
const pair = (s) => s.currentPair?.map((c) => c.id);
function shuffled(items, seed) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

describe("varied comparison sequence", () => {
  it("shows all 60 careers once before repeating any", () => {
    let s = createRankingSession(jobs(60));
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
      for (const id of pair(s)) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
      s = choosePreferred(s, s.currentPair[0].id);
    }
    expect(seen.size).toBe(60);
    expect(s.seen).toHaveLength(60);
    expect(s.isComplete).toBe(false);
  });
  it("also discovers an odd final career before refining the list", () => {
    let s = createRankingSession(jobs(5));
    for (let i = 0; i < 3; i++) s = choosePreferred(s, s.currentPair[0].id);
    expect(s.seen).toHaveLength(5);
  });
  for (let seed = 1; seed <= 12; seed++)
    it(`recovers a known preference order with varied cards (seed ${seed})`, () => {
      const careers = jobs(60),
        expected = shuffled(careers, seed),
        ranks = new Map(expected.map((c, i) => [c.id, i]));
      let s = createRankingSession(careers),
        last = [],
        repeats = 0,
        known = 0;
      const asked = new Set();
      while (!s.isComplete) {
        const p = pair(s),
          key = [...p].sort().join("/");
        expect(asked.has(key)).toBe(false);
        asked.add(key);
        if (p.some((id) => last.includes(id))) repeats++;
        last = p;
        s = choosePreferred(s, ranks.get(p[0]) < ranks.get(p[1]) ? p[0] : p[1]);
        expect(s.resolvedPairs).toBeGreaterThan(known);
        known = s.resolvedPairs;
        if (s.comparisons > 400) throw Error("Too many comparisons");
      }
      expect(s.ranked).toEqual(expected);
      expect(s.resolvedPairs).toBe(s.totalPairs);
      expect(repeats / s.comparisons).toBeLessThan(0.08);
    });
  it("skips preferences already implied transitively", () => {
    const s = restoreRankingSession(jobs(3), {
      decisions: [
        ["job0", "job1"],
        ["job1", "job2"],
      ],
    });
    expect(s.isComplete).toBe(true);
    expect(s.comparisons).toBe(2);
    expect(s.currentPair).toBeNull();
  });
  it("restores exactly the previous state without a separate undo history", () => {
    let s = createRankingSession(jobs(6));
    const snapshots = [];
    while (!s.isComplete) {
      snapshots.push(s);
      s = choosePreferred(s, s.currentPair[0].id);
    }
    while (snapshots.length) {
      s = repairSessionWithoutHistory(s);
      expect(s).toEqual(snapshots.pop());
    }
    expect(repairSessionWithoutHistory(s)).toBeNull();
  });
  it("does not mutate previous states or accept unrelated choices", () => {
    const s = createRankingSession(jobs(4)),
      before = JSON.stringify(s);
    expect(choosePreferred(s, "job3")).toBe(s);
    choosePreferred(s, "job0");
    expect(JSON.stringify(s)).toBe(before);
  });
  it("handles empty, singleton and two-career lists", () => {
    for (const n of [0, 1])
      expect(createRankingSession(jobs(n)).isComplete).toBe(true);
    const s = choosePreferred(createRankingSession(jobs(2)), "job1");
    expect(s.ranked.map((c) => c.id)).toEqual(["job1", "job0"]);
    expect(choosePreferred(s, "job0")).toBe(s);
  });
  it("preserves partial insertion bounds when migrating an old session", () => {
    const careers = jobs(5);
    let s = migrateLegacySession({
      careers,
      ranked: careers.slice(0, 3),
      candidateIndex: 3,
      insertion: { low: 1, high: 2, mid: 1 },
      comparisons: 5,
      isComplete: false,
    });
    expect(s.comparisons).toBe(5);
    expect(s.seen).toHaveLength(4);
    while (!s.isComplete) s = choosePreferred(s, s.currentPair[0].id);
    const rank = new Map(s.ranked.map((c, i) => [c.id, i]));
    expect(rank.get("job0")).toBeLessThan(rank.get("job3"));
    expect(rank.get("job3")).toBeLessThan(rank.get("job2"));
    expect(rank.get("job0")).toBeLessThan(rank.get("job1"));
    expect(rank.get("job1")).toBeLessThan(rank.get("job2"));
  });
  it("rejects cyclic or unknown preferences", () => {
    expect(() =>
      restoreRankingSession(jobs(2), {
        decisions: [
          ["job0", "job1"],
          ["job1", "job0"],
        ],
      }),
    ).toThrow();
    expect(() =>
      restoreRankingSession(jobs(2), { decisions: [["job0", "missing"]] }),
    ).toThrow();
  });
});
