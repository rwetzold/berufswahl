import { describe, it, expect } from "vitest";
import fs from "node:fs";
import careers from "../src/careers.json";
describe("career content and evidence", () => {
  it("contains the 60 distinct careers and ten broad fields", () => {
    expect(careers).toHaveLength(60);
    expect(new Set(careers.map((c) => c.id)).size).toBe(60);
    expect(new Set(careers.map((c) => c.category)).size).toBe(10);
  });
  for (const c of careers)
    it(`${c.id}: complete, traceable and valid`, () => {
      expect(c.id).toMatch(/^[a-z]+$/);
      expect(c.description.length).toBeGreaterThan(40);
      expect(c.tasks).toHaveLength(3);
      expect(c.day).toHaveLength(3);
      for (const key of [
        "title",
        "hours",
        "challenge",
        "joy",
        "tryIt",
        "source",
        "futureReason",
      ])
        expect(c[key]?.length).toBeGreaterThan(5);
      expect(c.training.years).toBeGreaterThan(0);
      expect(c.training.path.length).toBeGreaterThan(15);
      for (const score of Object.values(c.scores)) {
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(10);
      }
      expect(c.evidence.year).toBe(2025);
      expect(c.evidence.group).not.toMatch(/^B \d+$/);
      if (c.salary !== null) expect(c.salary).toBeGreaterThan(0);
      if (c.employed !== null) expect(c.employed).toBeGreaterThan(0);
      if (c.gender) {
        expect(c.gender.men).toBeGreaterThan(0);
        expect(c.gender.women).toBeGreaterThan(0);
      }
      if (c.demand) {
        expect(c.demand.year).toBeGreaterThanOrEqual(2024);
        expect(c.demand.perHundred).toBeCloseTo(
          (c.demand.offers / c.demand.employees) * 100,
        );
      }
      expect(c.image?.kind).toBe("generated");
      expect(c.image?.author).toBe("OpenAI Imagegen");
      expect(c.image?.generated).toBe("2026-09-13");
      expect(c.image?.license).toBeUndefined();
      expect(c.image?.width).toBe(768);
      expect(c.image?.height).toBe(512);
      expect(c.image?.version).toMatch(/^[a-f0-9]{12}$/);
      expect(fs.existsSync("public/" + c.image?.path)).toBe(true);
    });
});
