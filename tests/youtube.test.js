import { describe, expect, it } from 'vitest';
import { getYoutubeEmbedUrl, getYoutubeThumbnailUrl } from '../src/youtube.js';

describe('getYoutubeEmbedUrl', () => {
  it('builds a privacy-enhanced embed URL that enables player API control', () => {
    const url = getYoutubeEmbedUrl('EltgrumKJfk', 'http://127.0.0.1:5173');

    expect(url).toBe(
      'https://www.youtube-nocookie.com/embed/EltgrumKJfk?enablejsapi=1&origin=http%3A%2F%2F127.0.0.1%3A5173',
    );
  });

  it('builds a YouTube thumbnail URL for the video preview', () => {
    expect(getYoutubeThumbnailUrl('EltgrumKJfk')).toBe(
      'https://img.youtube.com/vi/EltgrumKJfk/hqdefault.jpg',
    );
  });
});
