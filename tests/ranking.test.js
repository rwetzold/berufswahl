import { describe, expect, it } from 'vitest';
import { choosePreferred, createRankingSession, repairSessionWithoutHistory } from '../src/ranking.js';

const songs = [
  { id: 'albania', country: 'Albania', artist: 'Alis', title: 'Nan' },
  { id: 'armenia', country: 'Armenia', artist: 'SIMON', title: 'Paloma Rumba' },
  { id: 'australia', country: 'Australia', artist: 'Delta Goodrem', title: 'Eclipse' },
  { id: 'austria', country: 'Austria', artist: 'COSMO', title: 'Tanzschein' },
];

describe('ranking session', () => {
  it('starts with a neutral first pair and no ranked playlist', () => {
    const session = createRankingSession(songs);

    expect(session.isComplete).toBe(false);
    expect(session.currentPair.map((song) => song.id)).toEqual(['albania', 'armenia']);
    expect(session.ranked).toEqual([]);
  });

  it('uses the first choice to seed the ranked playlist', () => {
    const session = choosePreferred(createRankingSession(songs), 'armenia');

    expect(session.ranked.map((song) => song.id)).toEqual(['armenia', 'albania']);
    expect(session.currentPair.map((song) => song.id)).toEqual(['australia', 'albania']);
  });

  it('builds a complete ordered playlist from pairwise choices', () => {
    let session = createRankingSession(songs);

    session = choosePreferred(session, 'armenia');
    session = choosePreferred(session, 'australia');
    session = choosePreferred(session, 'armenia');
    session = choosePreferred(session, 'australia');
    session = choosePreferred(session, 'austria');

    expect(session.isComplete).toBe(true);
    expect(session.currentPair).toBeNull();
    expect(session.ranked.map((song) => song.id)).toEqual([
      'armenia',
      'australia',
      'austria',
      'albania',
    ]);
  });

  it('repairs after the first choice by returning to the opening pair', () => {
    const session = choosePreferred(createRankingSession(songs), 'armenia');

    const repaired = repairSessionWithoutHistory(session);

    expect(repaired.ranked).toEqual([]);
    expect(repaired.candidateIndex).toBe(2);
    expect(repaired.comparisons).toBe(0);
    expect(repaired.currentPair.map((song) => song.id)).toEqual(['albania', 'armenia']);
  });

  it('repairs an in-progress insertion by restarting the current candidate', () => {
    let session = createRankingSession(songs);
    session = choosePreferred(session, 'armenia');
    session = choosePreferred(session, 'australia');

    const repaired = repairSessionWithoutHistory(session);

    expect(repaired.ranked.map((song) => song.id)).toEqual(['armenia', 'albania']);
    expect(repaired.candidateIndex).toBe(2);
    expect(repaired.insertion).toEqual({ low: 0, high: 2, mid: 1 });
    expect(repaired.currentPair.map((song) => song.id)).toEqual(['australia', 'albania']);
  });

  it('repairs a newly started candidate by re-inserting the previous candidate', () => {
    let session = createRankingSession(songs);
    session = choosePreferred(session, 'armenia');
    session = choosePreferred(session, 'australia');
    session = choosePreferred(session, 'armenia');

    const repaired = repairSessionWithoutHistory(session);

    expect(repaired.ranked.map((song) => song.id)).toEqual(['armenia', 'albania']);
    expect(repaired.candidateIndex).toBe(2);
    expect(repaired.insertion).toEqual({ low: 0, high: 2, mid: 1 });
    expect(repaired.currentPair.map((song) => song.id)).toEqual(['australia', 'albania']);
  });
});
