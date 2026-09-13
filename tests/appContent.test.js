import { describe, expect, it } from 'vitest';
import { pageContent } from '../src/appContent.js';

describe('pageContent', () => {
  it('describes the selectable Eurovision playlist purpose', () => {
    expect(pageContent.title).toBe('Eurovision Final-Playlist');
    expect(pageContent.description).toContain('Grand-Final-Songs');
    expect(pageContent.description).toContain('Wähle');
    expect(pageContent.description).toContain('für');
    expect(pageContent.description).toContain('persönliche');
    expect(pageContent.primaryAction).toBe('Ranking starten');
  });
});
