import { pool } from '../db/pool.js';
import { NotFoundError, UpstreamError } from '../utils/errors.js';
import { getAlbumDetail, getAlbumSummary } from './itunesService.js';

export function toAlbum(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    releaseYear: row.release_year,
    genre: row.genre,
    artworkUrl: row.artwork_url,
    externalId: row.external_id,
    trackCount: row.track_count,
    source: row.source,
    createdAt: row.created_at,
    ...(row.added_at ? { addedAt: row.added_at } : {}),
  };
}

export async function upsertItunesAlbum(externalId) {
  const summary = await getAlbumSummary(externalId);

  const { rows } = await pool.query(
    `INSERT INTO albums
       (title, artist, release_year, genre, artwork_url, external_id, track_count, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'itunes')
     ON CONFLICT (external_id) DO UPDATE SET
       title = EXCLUDED.title,
       artist = EXCLUDED.artist,
       release_year = EXCLUDED.release_year,
       genre = EXCLUDED.genre,
       artwork_url = EXCLUDED.artwork_url,
       track_count = EXCLUDED.track_count
     RETURNING *`,
    [
      summary.title,
      summary.artist,
      summary.releaseYear,
      summary.genre,
      summary.artworkUrl,
      summary.externalId,
      summary.trackCount,
    ],
  );

  return toAlbum(rows[0]);
}

export async function insertManualAlbum(manual) {
  const { rows } = await pool.query(
    `INSERT INTO albums
       (title, artist, release_year, genre, artwork_url, source)
     VALUES ($1, $2, $3, $4, $5, 'manual')
     RETURNING *`,
    [
      manual.title,
      manual.artist,
      manual.releaseYear ?? null,
      manual.genre || null,
      manual.artworkUrl || null,
    ],
  );

  return toAlbum(rows[0]);
}

export async function findManualDuplicate(collectionId, manual) {
  const { rows } = await pool.query(
    `SELECT a.id
     FROM albums a
     JOIN collection_albums ca ON ca.album_id = a.id
     WHERE ca.collection_id = $1
       AND lower(a.title) = lower($2)
       AND lower(a.artist) = lower($3)
       AND a.release_year IS NOT DISTINCT FROM $4
     LIMIT 1`,
    [collectionId, manual.title, manual.artist, manual.releaseYear ?? null],
  );
  return rows[0] ?? null;
}

export async function findExternalAlbumInCollection(collectionId, externalId) {
  const { rows } = await pool.query(
    `SELECT a.id
     FROM albums a
     JOIN collection_albums ca ON ca.album_id = a.id
     WHERE ca.collection_id = $1 AND a.external_id = $2
     LIMIT 1`,
    [collectionId, String(externalId)],
  );
  return rows[0] ?? null;
}

export async function getSavedAlbum(id) {
  const { rows } = await pool.query('SELECT * FROM albums WHERE id = $1', [id]);
  if (!rows[0]) throw new NotFoundError('That album is not in TrackStack.');

  const album = toAlbum(rows[0]);
  if (!album.externalId) {
    return { album: { ...album, tracks: [], copyright: null }, related: [], catalogueAvailable: false };
  }

  try {
    const detail = await getAlbumDetail(album.externalId);
    return {
      album: {
        ...album,
        ...detail.album,
        // Local IDs are the stable identifiers for saved albums.
        id: album.id,
        externalId: album.externalId,
        addedAt: album.addedAt,
      },
      related: detail.related,
      catalogueAvailable: true,
    };
  } catch (error) {
    if (!(error instanceof UpstreamError)) throw error;
    return {
      album: { ...album, tracks: [], copyright: null },
      related: [],
      catalogueAvailable: false,
    };
  }
}

export async function listRecentAlbums(userId, limit = 8) {
  const { rows } = await pool.query(
    `SELECT a.*, max(ca.added_at) AS added_at
     FROM albums a
     JOIN collection_albums ca ON ca.album_id = a.id
     JOIN collections c ON c.id = ca.collection_id
     WHERE c.user_id = $1
     GROUP BY a.id
     ORDER BY max(ca.added_at) DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows.map(toAlbum);
}

export async function getCatalogAlbum(externalId) {
  return getAlbumDetail(externalId);
}
