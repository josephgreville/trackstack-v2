import { vi } from 'vitest';
import { pool } from '../src/db/pool.js';
import { clearCatalogCache } from '../src/services/itunesService.js';

export const mockItunesFetch = vi.fn(async (input) => {
  const url = new URL(input);
  const ids = (url.searchParams.get('id') ?? '594061854').split(',');
  const results = ids.map((id) => ({
    wrapperType: 'collection',
    collectionId: Number(id),
    collectionName: `Test Album ${id}`,
    artistName: 'Test Artist',
    releaseDate: '2001-01-01T00:00:00Z',
    primaryGenreName: 'Rock',
    artworkUrl100: `https://example.test/${id}/100x100bb.jpg`,
    trackCount: 2,
    collectionViewUrl: `https://example.test/${id}`,
  }));
  if (url.searchParams.get('entity') === 'song') {
    results.push({
      wrapperType: 'track',
      trackId: 9001,
      trackName: 'First Track',
      trackNumber: 1,
      discNumber: 1,
      trackTimeMillis: 180000,
    });
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({ resultCount: results.length, results }),
  };
});

export async function resetTestDatabase() {
  vi.stubGlobal('fetch', mockItunesFetch);
  mockItunesFetch.mockClear();
  await pool.query(
    'TRUNCATE users, collections, albums, collection_albums, sessions RESTART IDENTITY CASCADE',
  );
  clearCatalogCache();
}
