import { pool } from '../db/pool.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { upsertItunesAlbum } from './albumsService.js';

export async function addToWantlist(userId, { externalId, preferredEdition, notes }) {
  const album = await upsertItunesAlbum(externalId);
  try {
    await pool.query(
      `INSERT INTO wantlist_items (user_id, album_id, preferred_edition, notes)
       VALUES ($1, $2, $3, $4)`,
      [userId, album.id, preferredEdition, notes],
    );
  } catch (error) {
    if (error.code === '23505') throw new ConflictError('That album is already on your wantlist.');
    throw error;
  }
  return album;
}

export async function listWantlist(userId) {
  const { rows } = await pool.query(
    `SELECT a.*, w.preferred_edition, w.notes, w.created_at AS added_at
     FROM wantlist_items w JOIN albums a ON a.id = w.album_id
     WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id, title: row.title, artist: row.artist, releaseYear: row.release_year,
    genre: row.genre, artworkUrl: row.artwork_url, externalId: row.external_id,
    preferredEdition: row.preferred_edition, notes: row.notes, addedAt: row.added_at,
  }));
}

export async function removeFromWantlist(userId, albumId) {
  const { rowCount } = await pool.query('DELETE FROM wantlist_items WHERE user_id = $1 AND album_id = $2', [userId, albumId]);
  if (!rowCount) throw new NotFoundError('That album is not on your wantlist.');
}

export async function updateWantlistItem(userId, albumId, { preferredEdition, notes }) {
  const { rows } = await pool.query(
    `UPDATE wantlist_items SET preferred_edition = COALESCE($3, preferred_edition), notes = COALESCE($4, notes)
     WHERE user_id = $1 AND album_id = $2 RETURNING album_id`,
    [userId, albumId, preferredEdition ?? null, notes ?? null],
  );
  if (!rows[0]) throw new NotFoundError('That album is not on your wantlist.');
}

export async function logListen(userId, { albumId, externalId }) {
  let album;
  if (externalId) album = await upsertItunesAlbum(externalId);
  else {
    const { rows } = await pool.query('SELECT * FROM albums WHERE id = $1', [albumId]);
    if (!rows[0]) throw new NotFoundError('That album could not be found.');
    album = rows[0];
  }
  const { rows } = await pool.query(
    'INSERT INTO listening_history (user_id, album_id) VALUES ($1, $2) RETURNING *',
    [userId, album.id],
  );
  return { id: rows[0].id, albumId: album.id, listenedAt: rows[0].listened_at };
}

export async function listListeningHistory(userId) {
  const { rows } = await pool.query(
    `SELECT h.id AS history_id, h.listened_at, h.rating, h.review, a.*
     FROM listening_history h JOIN albums a ON a.id = h.album_id
     WHERE h.user_id = $1 ORDER BY h.listened_at DESC LIMIT 100`,
    [userId],
  );
  return rows.map((row) => ({
    historyId: row.history_id, listenedAt: row.listened_at, rating: row.rating,
    review: row.review, id: row.id, title: row.title, artist: row.artist,
    releaseYear: row.release_year, genre: row.genre, artworkUrl: row.artwork_url,
    externalId: row.external_id,
  }));
}

export async function updateListenReview(userId, historyId, payload) {
  const { rating, review } = payload;
  const sets = [];
  const values = [historyId, userId];
  if (Object.hasOwn(payload, 'rating')) { values.push(rating); sets.push(`rating = $${values.length}`); }
  if (Object.hasOwn(payload, 'review')) { values.push(review); sets.push(`review = $${values.length}`); }
  const { rows } = await pool.query(
    `UPDATE listening_history SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING id`,
    values,
  );
  if (!rows[0]) throw new NotFoundError('That listening history entry could not be found.');
}

export async function setProfileVisibility(userId, profilePublic) {
  await pool.query('UPDATE users SET profile_public = $2 WHERE id = $1', [userId, profilePublic]);
}

export async function getCollectionStats(userId, collectionId) {
  const { rows } = await pool.query(
    `SELECT a.genre, a.release_year, ca.format, a.artist
     FROM collections c JOIN collection_albums ca ON ca.collection_id = c.id
     JOIN albums a ON a.id = ca.album_id WHERE c.id = $1 AND c.user_id = $2`,
    [collectionId, userId],
  );
  if (!rows.length) {
    const { rowCount } = await pool.query('SELECT 1 FROM collections WHERE id = $1 AND user_id = $2', [collectionId, userId]);
    if (!rowCount) throw new NotFoundError('That collection could not be found.');
  }
  const counts = (key, fallback = 'Unknown') => Object.fromEntries(
    [...rows.reduce((map, row) => {
      const value = row[key] == null || row[key] === '' ? fallback : String(row[key]);
      map.set(value, (map.get(value) ?? 0) + 1);
      return map;
    }, new Map()).entries()].sort((a, b) => b[1] - a[1]),
  );
  const decades = {};
  for (const row of rows) {
    const decade = row.release_year ? `${Math.floor(row.release_year / 10) * 10}s` : 'Unknown';
    decades[decade] = (decades[decade] ?? 0) + 1;
  }
  return { total: rows.length, byGenre: counts('genre'), byDecade: decades, byArtist: counts('artist'), byFormat: counts('format') };
}
