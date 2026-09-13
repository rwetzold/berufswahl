import { describe, expect, it } from "vitest";
import { chooseWithHistory, stepBackSession } from "../src/undo.js";
import { choosePreferred, createRankingSession } from "../src/ranking.js";

const careers = [
  { id: "albania", country: "Albania", artist: "Alis", title: "Nan" },
  { id: "armenia", country: "Armenia", artist: "SIMON", title: "Paloma Rumba" },
  {
    id: "australia",
    country: "Australia",
    artist: "Delta Goodrem",
    title: "Eclipse",
  },
  { id: "austria", country: "Austria", artist: "COSMO", title: "Tanzschein" },
];

describe("undo session flow", () => {
  it("stores the current session before applying a valid choice", () => {
    const session = createRankingSession(careers);

    const result = chooseWithHistory(session, [], "armenia");

    expect(result.session.ranked.map((career) => career.id)).toEqual([
      "armenia",
      "albania",
    ]);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].currentPair.map((career) => career.id)).toEqual([
      "albania",
      "armenia",
    ]);
  });

  it("steps back through stored history before using repair fallback", () => {
    const openingSession = createRankingSession(careers);
    const nextSession = choosePreferred(openingSession, "armenia");

    const result = stepBackSession(nextSession, [openingSession]);

    expect(result.changed).toBe(true);
    expect(result.session.currentPair.map((career) => career.id)).toEqual([
      "albania",
      "armenia",
    ]);
    expect(result.history).toEqual([]);
  });

  it("uses repair fallback when no stored history exists", () => {
    const session = choosePreferred(createRankingSession(careers), "armenia");

    const result = stepBackSession(session, []);

    expect(result.changed).toBe(true);
    expect(result.session.ranked).toEqual([]);
    expect(result.session.currentPair.map((career) => career.id)).toEqual([
      "albania",
      "armenia",
    ]);
    expect(result.history).toEqual([]);
  });

  it("reports unchanged when neither history nor repair is available", () => {
    const session = createRankingSession(careers);

    const result = stepBackSession(session, []);

    expect(result.changed).toBe(false);
    expect(result.session).toBe(session);
    expect(result.history).toEqual([]);
  });
});
