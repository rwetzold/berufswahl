import { describe, expect, it } from "vitest";
import { shuffleCareers } from "../src/shuffle.js";

describe("shuffleCareers", () => {
  it("returns a shuffled copy without mutating the original list", () => {
    const careers = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

    const shuffled = shuffleCareers(careers, () => 0);

    expect(shuffled.map((career) => career.id)).toEqual(["b", "c", "d", "a"]);
    expect(careers.map((career) => career.id)).toEqual(["a", "b", "c", "d"]);
  });
});
