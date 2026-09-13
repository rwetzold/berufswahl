import { describe, expect, it } from 'vitest';
import { shuffleSongs } from '../src/shuffle.js';

describe('shuffleSongs', () => {
  it('returns a shuffled copy without mutating the original list', () => {
    const songs = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
    ];

    const shuffled = shuffleSongs(songs, () => 0);

    expect(shuffled.map((song) => song.id)).toEqual(['b', 'c', 'd', 'a']);
    expect(songs.map((song) => song.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
