import { describe, expect, it } from 'vitest';
import {
  finalSongs,
  finalSongs2025,
  finalSongs2026,
  getSongSetOption,
  songSetOptions,
} from '../src/songs.js';

describe('song sets', () => {
  it('contains only the 25 Eurovision 2026 grand final entries', () => {
    expect(finalSongs2026).toHaveLength(25);
    expect(finalSongs2026[0]).toMatchObject({
      id: '2026-bulgaria',
      legacyId: 'bulgaria',
      year: 2026,
      country: 'Bulgaria',
      artist: 'DARA',
      title: 'Bangaranga',
      finalPlace: 1,
      youtubeId: 'EltgrumKJfk',
    });
    expect(finalSongs2026.at(-1)).toMatchObject({
      id: '2026-united-kingdom',
      country: 'United Kingdom',
      artist: 'LOOK MUM NO COMPUTER',
      title: 'Eins, Zwei, Drei',
      finalPlace: 25,
    });
    expect(finalSongs2026.some((song) => song.country === 'Armenia')).toBe(false);
  });

  it('contains the 26 Eurovision 2025 grand final entries', () => {
    expect(finalSongs2025).toHaveLength(26);
    expect(finalSongs2025[0]).toMatchObject({
      id: '2025-austria',
      year: 2025,
      country: 'Austria',
      artist: 'JJ',
      title: 'Wasted Love',
      finalPlace: 1,
      runningOrder: 9,
      points: 436,
      youtubeId: 'onOex2WXjbA',
    });
    expect(finalSongs2025.at(-1)).toMatchObject({
      id: '2025-san-marino',
      country: 'San Marino',
      artist: 'Gabry Ponte',
      title: "Tutta L'Italia",
      finalPlace: 26,
      runningOrder: 25,
      points: 27,
    });
  });

  it('keeps the legacy finalSongs export mapped to the 2026 set', () => {
    expect(finalSongs).toBe(finalSongs2026);
  });

  it('offers 2026, 2025, and combined selectable song sets', () => {
    expect(songSetOptions.map((option) => option.id)).toEqual(['2026', '2025', 'combined']);
    expect(getSongSetOption('2026').songs).toHaveLength(25);
    expect(getSongSetOption('2025').songs).toHaveLength(26);
    expect(getSongSetOption('combined').songs).toHaveLength(51);
    expect(getSongSetOption('unknown')).toBe(getSongSetOption('2026'));
  });

  it('has stable unique ids and embeddable YouTube ids per selectable set', () => {
    songSetOptions.forEach((option) => {
      const ids = option.songs.map((song) => song.id);
      const videoIds = option.songs.map((song) => song.youtubeId);

      expect(new Set(ids).size).toBe(option.songs.length);
      expect(videoIds.every(Boolean)).toBe(true);
      expect(new Set(videoIds).size).toBe(option.songs.length);
    });
  });
});
