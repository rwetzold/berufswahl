import { describe, it, expect } from "vitest";
import {
  loadProgress,
  saveProgress,
  SESSION_STORAGE_KEY,
} from "../src/persistence.js";
import { createRankingSession, choosePreferred } from "../src/ranking.js";
const careers = [{ id: "a" }, { id: "b" }, { id: "c" }];
const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    data,
  };
};
describe("career progress", () => {
  it("roundtrips a comparison and its undo history", () => {
    const storage = memory(),
      first = createRankingSession(careers),
      next = choosePreferred(first, "b");
    expect(saveProgress(storage, next, [first])).toBe(true);
    expect(loadProgress(storage, careers)).toEqual({
      session: next,
      history: [first],
    });
  });
  it("roundtrips a completed ranking", () => {
    const storage = memory();
    let s = createRankingSession(careers);
    while (!s.isComplete) s = choosePreferred(s, s.currentPair[0].id);
    saveProgress(storage, s, []);
    expect(loadProgress(storage, careers).session).toEqual(s);
  });
  it("never reads or changes old Eurovision and example keys", () => {
    const storage = memory();
    for (const k of [
      "eurovision-ranking-session",
      "eurovision-ranking-session:2026",
      "berufswahl-ranking-session",
      "berufswahl-ranking-selected-set",
    ])
      storage.setItem(k, "old");
    expect(loadProgress(storage, careers)).toBeNull();
    const old = new Map(storage.data);
    saveProgress(storage, createRankingSession(careers), []);
    for (const [k, v] of old) expect(storage.getItem(k)).toBe(v);
    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeTruthy();
  });
  it("rejects malformed and mismatched data without crashing", () => {
    const storage = memory();
    for (const raw of [
      "{",
      "null",
      "[]",
      '{"version":1,"session":{},"history":[]}',
    ]) {
      storage.setItem(SESSION_STORAGE_KEY, raw);
      expect(loadProgress(storage, careers)).toBeNull();
    }
    saveProgress(storage, createRankingSession(careers), []);
    expect(loadProgress(storage, [{ id: "other" }])).toBeNull();
  });
  it("rejects duplicate ids and invalid insertion windows", () => {
    const storage = memory();
    let s = choosePreferred(createRankingSession(careers), "a");
    saveProgress(storage, s, []);
    let data = JSON.parse(storage.getItem(SESSION_STORAGE_KEY));
    data.session.insertion.mid = 99;
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    expect(loadProgress(storage, careers)).toBeNull();
    data.session.careers = ["a", "a", "c"];
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    expect(loadProgress(storage, careers)).toBeNull();
  });
  it("handles blocked storage", () => {
    const storage = {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("quota");
      },
    };
    expect(loadProgress(storage, careers)).toBeNull();
    expect(saveProgress(storage, createRankingSession(careers), [])).toBe(
      false,
    );
  });
});
