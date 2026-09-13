import { describe, it, expect } from "vitest";
import {
  band,
  populationBounds,
  salaryBounds,
  demandBounds,
  demandBand,
  trainingBand,
  metrics,
} from "../src/metrics.js";
import careers from "../src/careers.json";
describe("fixed metric scales", () => {
  for (const bounds of [populationBounds, salaryBounds, demandBounds])
    it("handles each boundary and missing values: " + bounds.join(","), () => {
      bounds.forEach((b, i) => {
        expect(band(b, bounds)).toBe(i + 1);
        expect(band(b + 0.001, bounds)).toBe(i + 2);
      });
      for (const value of [null, undefined, NaN, -1, Infinity])
        expect(band(value, bounds)).toBeNull();
      expect(band(0, bounds)).toBe(1);
    });
  it("caps years without hiding the absolute duration", () => {
    expect(trainingBand(3.5)).toBe(4);
    expect(trainingBand(11.25)).toBe(10);
    expect(trainingBand(null)).toBeNull();
    expect(
      metrics(careers.find((c) => c.id === "hausarzt")).find(
        (m) => m.key === "training",
      ).value,
    ).toContain("11,25");
  });
  it("does not present missing demand as zero", () => {
    expect(demandBand(undefined)).toBeNull();
    expect(
      metrics({ ...careers[0], demand: null }).find((m) => m.key === "demand")
        .score,
    ).toBeNull();
  });
});
