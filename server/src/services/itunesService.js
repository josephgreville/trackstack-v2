import env from '../config/env.js';
import { TtlCache } from '../utils/cache.js';
import { BadRequestError, NotFoundError, UpstreamError } from '../utils/errors.js';

const cache = new TtlCache({
  maxEntries: 300,
  defaultTtlMs: env.itunes.cacheTtlMs,
});

const inFlight = new Map();

// A small, curated shelf of real iTunes albums. The API still supplies every
// title, artist, year and image; these are only identifiers.
const FEATURED_IDS = [
  '594061854', // Rumours — Fleetwood Mac
  '269572838', // Thriller — Michael Jackson
  '268443092', // Kind of Blue — Miles Davis
  '697194953', // Discovery — Daft Punk
  '1492263092', // Blue — Joni Mitchell
  '1276760743', // The Miseducation of Lauryn Hill — Lauryn Hill
  '1109714933', // In Rainbows — Radiohead
  '1440856219', // Back to Black — Amy Winehouse
];

const GENRE_ALIASES = {
  'hip-hop/rap': ['hip-hop', 'rap'],
  'r&b/soul': ['r&b', 'soul'],
  electronic: ['electronic', 'dance'],
  indie: ['alternative', 'indie'],
  'singer/songwriter': ['singer/songwriter', 'folk'],
  'alternative': ['alternative', 'indie'],
  'rock': ['rock'],
  'pop': ['pop'],
  'jazz': ['jazz'],
  'soul': ['soul', 'r&b'],
  'country': ['country'],
  'classical': ['classical'],
  'folk': ['folk', 'singer/songwriter'],
  'metal': ['metal'],
  'blues': ['blues'],
};

function normaliseArtwork(url, size = 600) {
  if (!url) return null;
  return url.replace(/\/\d+x\d+bb\.(jpg|jpeg|png|webp)$/i, `/${size}x${size}bb.$1`);
}

function releaseYear(releaseDate) {
  if (typeof releaseDate !== 'string') return null;
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) && year >= 1000 && year <= 2100 ? year : null;
}

function normaliseAlbum(item) {
  if (!item || item.wrapperType !== 'collection' || !item.collectionId) return null;

  return {
    externalId: String(item.collectionId),
    title: item.collectionName ?? 'Untitled album',
    artist: item.artistName ?? 'Unknown artist',
    releaseYear: releaseYear(item.releaseDate),
    genre: item.primaryGenreName ?? null,
    artworkUrl: normaliseArtwork(item.artworkUrl100),
    trackCount: Number.isInteger(item.trackCount) ? item.trackCount : null,
    appleMusicUrl: item.collectionViewUrl ?? null,
  };
}

function genreMatches(actualGenre, selectedGenre) {
  if (!selectedGenre) return true;
  if (!actualGenre) return false;

  const actual = actualGenre.toLowerCase();
  const selected = selectedGenre.toLowerCase();
  const aliases = GENRE_ALIASES[selected] ?? [selected];

  return aliases.some((alias) => actual.includes(alias));
}

async function fetchItunes(path, params) {
  const url = new URL(path, env.itunes.baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(env.itunes.timeoutMs),
    });

    if (!response.ok) {
      throw new UpstreamError('The iTunes catalogue did not respond. Please try again.');
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.results)) {
      throw new UpstreamError('The iTunes catalogue returned an unexpected response.');
    }
    return payload;
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    throw new UpstreamError('The music catalogue is unavailable right now. Please try again.');
  }
}

async function cachedRequest(key, task) {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  if (inFlight.has(key)) return inFlight.get(key);

  const promise = task()
    .then((value) => {
      cache.set(key, value);
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

export async function searchAlbums({ q, genre, artist, yearFrom, yearTo, sort = 'relevance', limit = 24, page = 1 }) {
  const query = q?.trim() ?? '';
  const selectedGenre = genre?.trim() ?? '';
  const selectedArtist = artist?.trim() ?? '';

  if (!query && !selectedGenre && !selectedArtist) {
    throw new BadRequestError('Enter an album, artist or genre to search.');
  }

  const term = query || selectedArtist || selectedGenre;
  const key = `search:${term}:${selectedGenre}:${selectedArtist}:${yearFrom}:${yearTo}:${sort}:${limit}:${page}`;

  return cachedRequest(key, async () => {
    const payload = await fetchItunes('/search', {
      term,
      country: env.itunes.country,
      media: 'music',
      entity: 'album',
      limit: 50,
      offset: (page - 1) * limit,
    });

    const results = payload.results
      .map(normaliseAlbum)
      .filter(Boolean)
      .filter((album) => genreMatches(album.genre, selectedGenre))
      .filter((album) => !selectedArtist || album.artist.toLowerCase().includes(selectedArtist.toLowerCase()))
      .filter((album) => album.releaseYear === null || (yearFrom === undefined || album.releaseYear >= yearFrom)
        && (yearTo === undefined || album.releaseYear <= yearTo))
      .sort((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title);
        if (sort === 'artist') return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
        if (sort === 'year') return (a.releaseYear ?? 0) - (b.releaseYear ?? 0);
        return 0;
      })
      .slice(0, limit);

    return {
      query,
      genre: selectedGenre,
      total: payload.resultCount ?? results.length,
      page,
      results,
    };
  });
}

export async function getAlbumSummary(externalId) {
  const id = String(externalId);
  const key = `summary:${id}`;

  return cachedRequest(key, async () => {
    const payload = await fetchItunes('/lookup', {
      id,
      country: env.itunes.country,
      media: 'music',
      entity: 'album',
    });

    const album = payload.results.map(normaliseAlbum).find(Boolean);
    if (!album) throw new NotFoundError('That album could not be found in the iTunes catalogue.');
    return album;
  });
}

export async function getAlbumDetail(externalId) {
  const id = String(externalId);
  const key = `detail:${id}`;

  return cachedRequest(key, async () => {
    const payload = await fetchItunes('/lookup', {
      id,
      country: env.itunes.country,
      media: 'music',
      entity: 'song',
    });

    const album = payload.results.map(normaliseAlbum).find(Boolean);
    if (!album) throw new NotFoundError('That album could not be found in the iTunes catalogue.');

    const tracks = payload.results
      .filter((item) => item.wrapperType === 'track' && item.trackName)
      .map((track) => ({
        externalId: track.trackId ? String(track.trackId) : null,
        title: track.trackName,
        trackNumber: Number.isInteger(track.trackNumber) ? track.trackNumber : null,
        discNumber: Number.isInteger(track.discNumber) ? track.discNumber : null,
        durationMs: Number.isFinite(track.trackTimeMillis) ? track.trackTimeMillis : null,
        previewUrl: track.previewUrl ?? null,
      }))
      .sort((a, b) => (a.discNumber ?? 1) - (b.discNumber ?? 1) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0));

    const collection = payload.results.find(
      (item) => item.wrapperType === 'collection' && String(item.collectionId) === id,
    );

    let related = [];
    try {
      const relatedPayload = await searchAlbums({
        q: album.artist,
        genre: '',
        limit: 8,
        page: 1,
      });
      related = relatedPayload.results.filter((item) => item.externalId !== id).slice(0, 6);
    } catch {
      // Related albums are a bonus. The album page still works if this call fails.
    }

    return {
      album: {
        ...album,
        copyright: collection?.copyright ?? null,
        tracks,
      },
      related,
    };
  });
}

export async function getFeaturedAlbums() {
  const key = `featured:${env.itunes.country}`;

  return cachedRequest(key, async () => {
    const payload = await fetchItunes('/lookup', {
      id: FEATURED_IDS.join(','),
      country: env.itunes.country,
      media: 'music',
      entity: 'album',
    });

    const byId = new Map(
      payload.results.map(normaliseAlbum).filter(Boolean).map((album) => [album.externalId, album]),
    );

    return FEATURED_IDS.map((id) => byId.get(id)).filter(Boolean);
  });
}

export function clearCatalogCache() {
  cache.clear();
  inFlight.clear();
}
