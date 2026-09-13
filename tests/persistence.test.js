import { describe, expect, it } from 'vitest';
import {
  clearSessionState,
  loadSessionHistory,
  loadSelectedSongSetId,
  loadSessionState,
  saveSelectedSongSetId,
  saveSessionState,
} from '../src/persistence.js';

const songs = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
];
const yearSafeSongs = [
  { id: '2026-a', legacyId: 'a', title: 'A' },
  { id: '2026-b', legacyId: 'b', title: 'B' },
  { id: '2026-c', legacyId: 'c', title: 'C' },
];

function createMemoryStorage() {
  const entries = new Map();

  return {
    getItem: (key) => entries.get(key) ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, value),
  };
}

describe('ranking persistence', () => {
  it('ignores and preserves Eurovision storage when loading, saving and clearing', () => {
    const storage = createMemoryStorage();
    const original = JSON.stringify({
      songIds: ['a', 'b', 'c'], rankedIds: ['a'], candidateIndex: 1,
      comparisons: 1, isComplete: false, currentPairIds: ['b', 'a'],
    });
    const oldKeys = ['eurovision-ranking-session', 'eurovision-ranking-session:2026'];
    oldKeys.forEach((key) => storage.setItem(key, original));
    storage.setItem('eurovision-ranking-selected-set', 'combined');

    expect(loadSessionState(storage, songs)).toBeNull();
    expect(loadSessionHistory(storage, songs)).toEqual([]);
    expect(loadSelectedSongSetId(storage)).toBe('2026');

    saveSessionState(storage, {
      songs, ranked: [songs[0]], candidateIndex: 1, insertion: null,
      comparisons: 1, isComplete: false, currentPair: [songs[1], songs[0]],
    });
    saveSelectedSongSetId(storage, '2025');
    expect(loadSessionState(storage, songs).ranked).toEqual([songs[0]]);
    expect(loadSelectedSongSetId(storage)).toBe('2025');
    clearSessionState(storage);
    expect(loadSessionState(storage, songs)).toBeNull();
    oldKeys.forEach((key) => expect(storage.getItem(key)).toBe(original));
    expect(storage.getItem('eurovision-ranking-selected-set')).toBe('combined');
  });

  it('saves and restores a session using song ids', () => {
    const storage = createMemoryStorage();
    const session = {
      songs,
      ranked: [songs[1], songs[0]],
      candidateIndex: 2,
      insertion: { low: 0, high: 2, mid: 1 },
      comparisons: 3,
      isComplete: false,
      currentPair: [songs[2], songs[0]],
    };

    saveSessionState(storage, session, '2025');
    const restored = loadSessionState(storage, songs, '2025');

    expect(restored.ranked.map((song) => song.id)).toEqual(['b', 'a']);
    expect(restored.currentPair.map((song) => song.id)).toEqual(['c', 'a']);
    expect(restored.comparisons).toBe(3);
  });

  it('saves and restores session history using song ids', () => {
    const storage = createMemoryStorage();
    const previousSession = {
      songs,
      ranked: [],
      candidateIndex: 2,
      insertion: null,
      comparisons: 0,
      isComplete: false,
      currentPair: [songs[0], songs[1]],
    };
    const currentSession = {
      songs,
      ranked: [songs[1], songs[0]],
      candidateIndex: 2,
      insertion: { low: 0, high: 2, mid: 1 },
      comparisons: 1,
      isComplete: false,
      currentPair: [songs[2], songs[0]],
    };

    saveSessionState(storage, currentSession, '2025', [previousSession]);

    const restoredHistory = loadSessionHistory(storage, songs, '2025');

    expect(restoredHistory).toHaveLength(1);
    expect(restoredHistory[0].ranked).toEqual([]);
    expect(restoredHistory[0].currentPair.map((song) => song.id)).toEqual(['a', 'b']);
    expect(loadSessionState(storage, songs, '2025').ranked.map((song) => song.id)).toEqual(['b', 'a']);
  });

  it('keeps sessions for each selected song set separate', () => {
    const storage = createMemoryStorage();
    const session2025 = {
      songs,
      ranked: [songs[0]],
      candidateIndex: 1,
      insertion: null,
      comparisons: 1,
      isComplete: false,
      currentPair: [songs[1], songs[0]],
    };
    const sessionCombined = {
      songs,
      ranked: [songs[2]],
      candidateIndex: 1,
      insertion: null,
      comparisons: 2,
      isComplete: false,
      currentPair: [songs[1], songs[2]],
    };

    saveSessionState(storage, session2025, '2025');
    saveSessionState(storage, sessionCombined, 'combined');

    expect(loadSessionState(storage, songs, '2025').ranked.map((song) => song.id)).toEqual(['a']);
    expect(loadSessionState(storage, songs, 'combined').ranked.map((song) => song.id)).toEqual(['c']);
    expect(loadSessionState(storage, songs, '2026')).toBeNull();
  });

  it('keeps session history for each selected song set separate', () => {
    const storage = createMemoryStorage();
    const session2025 = {
      songs,
      ranked: [songs[0]],
      candidateIndex: 1,
      insertion: null,
      comparisons: 1,
      isComplete: false,
      currentPair: [songs[1], songs[0]],
    };
    const sessionCombined = {
      songs,
      ranked: [songs[2]],
      candidateIndex: 1,
      insertion: null,
      comparisons: 2,
      isComplete: false,
      currentPair: [songs[1], songs[2]],
    };

    saveSessionState(storage, session2025, '2025', [sessionCombined]);
    saveSessionState(storage, sessionCombined, 'combined', [session2025]);

    expect(loadSessionHistory(storage, songs, '2025')[0].ranked.map((song) => song.id)).toEqual(['c']);
    expect(loadSessionHistory(storage, songs, 'combined')[0].ranked.map((song) => song.id)).toEqual(['a']);
    expect(loadSessionHistory(storage, songs, '2026')).toEqual([]);
  });

  it('saves and restores the selected song set id', () => {
    const storage = createMemoryStorage();

    expect(loadSelectedSongSetId(storage)).toBe('2026');

    saveSelectedSongSetId(storage, 'combined');

    expect(loadSelectedSongSetId(storage)).toBe('combined');
  });

  it('loads legacy 2026 sessions saved under the original unscoped key', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      'berufswahl-ranking-session',
      JSON.stringify({
        songIds: ['a', 'b', 'c'],
        rankedIds: ['b', 'a'],
        candidateIndex: 2,
        insertion: { low: 0, high: 2, mid: 1 },
        comparisons: 3,
        isComplete: false,
        currentPairIds: ['c', 'a'],
      }),
    );

    const restored = loadSessionState(storage, yearSafeSongs, '2026');

    expect(restored.ranked.map((song) => song.id)).toEqual(['2026-b', '2026-a']);
    expect(restored.currentPair.map((song) => song.id)).toEqual(['2026-c', '2026-a']);
    expect(loadSessionState(storage, yearSafeSongs, '2025')).toBeNull();
    expect(loadSessionHistory(storage, yearSafeSongs, '2026')).toEqual([]);
  });

  it('returns null for missing or incompatible state and ignores incompatible history', () => {
    const storage = createMemoryStorage();

    expect(loadSessionState(storage, songs, '2025')).toBeNull();

    storage.setItem('berufswahl-ranking-session:2025', '{"rankedIds":["missing"]}');

    expect(loadSessionState(storage, songs, '2025')).toBeNull();

    storage.setItem(
      'berufswahl-ranking-session:2025',
      JSON.stringify({
        songIds: ['a', 'b', 'c'],
        rankedIds: ['b', 'a'],
        candidateIndex: 2,
        insertion: { low: 0, high: 2, mid: 1 },
        comparisons: 3,
        isComplete: false,
        currentPairIds: ['c', 'a'],
        history: [
          {
            songIds: ['missing'],
            rankedIds: [],
            candidateIndex: 2,
            insertion: null,
            comparisons: 0,
            isComplete: false,
            currentPairIds: ['missing', 'a'],
          },
        ],
      }),
    );

    expect(loadSessionState(storage, songs, '2025').ranked.map((song) => song.id)).toEqual(['b', 'a']);
    expect(loadSessionHistory(storage, songs, '2025')).toEqual([]);
  });
});
