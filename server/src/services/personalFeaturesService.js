import { pool } from '../db/pool.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { upsertItunesAlbum } from './albumsService.js';
import { withTransaction } from '../db/transaction.js';

export async function addToWantlist(userId, { externalId, preferredEdition, notes, maxPrice }) {
  const album = await upsertItunesAlbum(externalId);
  try {
    await pool.query(
      `INSERT INTO wantlist_items (user_id, album_id, preferred_edition, notes, max_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, album.id, preferredEdition, notes, maxPrice ?? null],
    );
  } catch (error) {
    if (error.code === '23505') throw new ConflictError('That album is already on your wantlist.');
    throw error;
  }
  return album;
}

export async function listWantlist(userId) {
  const { rows } = await pool.query(
    `SELECT a.*, w.preferred_edition, w.notes, w.max_price, w.created_at AS added_at
     FROM wantlist_items w JOIN albums a ON a.id = w.album_id
     WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id, title: row.title, artist: row.artist, releaseYear: row.release_year,
    genre: row.genre, artworkUrl: row.artwork_url, externalId: row.external_id,
    preferredEdition: row.preferred_edition, notes: row.notes,
    maxPrice: row.max_price == null ? null : Number(row.max_price), addedAt: row.added_at,
  }));
}

export async function removeFromWantlist(userId, albumId) {
  const { rowCount } = await pool.query('DELETE FROM wantlist_items WHERE user_id = $1 AND album_id = $2', [userId, albumId]);
  if (!rowCount) throw new NotFoundError('That album is not on your wantlist.');
}

export async function updateWantlistItem(userId, albumId, payload) {
  const { preferredEdition, notes, maxPrice } = payload;
  const { rows } = await pool.query(
    `UPDATE wantlist_items SET preferred_edition = COALESCE($3, preferred_edition), notes = COALESCE($4, notes),
       max_price = CASE WHEN $5 THEN $6 ELSE max_price END
     WHERE user_id = $1 AND album_id = $2 RETURNING album_id`,
    [userId, albumId, preferredEdition ?? null, notes ?? null, Object.hasOwn(payload, 'maxPrice'), maxPrice ?? null],
  );
  if (!rows[0]) throw new NotFoundError('That album is not on your wantlist.');
}

export async function acquireWantlistItem(userId, albumId, { collectionId, format, purchaseDate, price }) {
  try {
    return await withTransaction(async (client) => {
      const { rows: collections } = await client.query(
        'SELECT id FROM collections WHERE id = $1 AND user_id = $2 FOR UPDATE', [collectionId, userId],
      );
      if (!collections[0]) throw new NotFoundError('That collection could not be found.');
      const { rows: wanted } = await client.query(
        'SELECT album_id FROM wantlist_items WHERE user_id = $1 AND album_id = $2 FOR UPDATE', [userId, albumId],
      );
      if (!wanted[0]) throw new NotFoundError('That album is not on your wantlist.');
      await client.query(
        `INSERT INTO collection_albums (collection_id, album_id, format, purchase_date, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [collectionId, albumId, format ?? null, purchaseDate ?? null, price ?? null],
      );
      await client.query('DELETE FROM wantlist_items WHERE user_id = $1 AND album_id = $2', [userId, albumId]);
      await client.query('UPDATE collections SET updated_at = now() WHERE id = $1', [collectionId]);
      return { collectionId, albumId };
    });
  } catch (error) {
    if (error.code === '23505') throw new ConflictError('That album is already in the selected collection.');
    throw error;
  }
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

export async function listListeningQueue(userId, queryable = pool) {
  const { rows } = await queryable.query(
    `SELECT q.id AS queue_id, q.added_at, a.id, a.title, a.artist, a.release_year,
            a.genre, a.artwork_url, a.external_id
     FROM listening_queue_items q JOIN albums a ON a.id = q.album_id
     WHERE q.user_id = $1 ORDER BY q.position, q.added_at`, [userId],
  );
  return rows.map((row) => ({
    queueId: row.queue_id, id: row.id, title: row.title, artist: row.artist,
    releaseYear: row.release_year, genre: row.genre, artworkUrl: row.artwork_url,
    externalId: row.external_id, addedAt: row.added_at,
  }));
}

export async function addToListeningQueue(userId, albumId) {
  const { rows: owned } = await pool.query(
    `SELECT 1 FROM collection_albums ca JOIN collections c ON c.id = ca.collection_id
     WHERE c.user_id = $1 AND ca.album_id = $2 LIMIT 1`, [userId, albumId],
  );
  if (!owned[0]) throw new NotFoundError('Add this album to one of your collections before queuing it.');
  const { rows: current } = await pool.query(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM listening_queue_items WHERE user_id = $1', [userId],
  );
  try {
    await pool.query(
      'INSERT INTO listening_queue_items (user_id, album_id, position) VALUES ($1, $2, $3)',
      [userId, albumId, current[0].next_position],
    );
  } catch (error) {
    if (error.code === '23505') throw new ConflictError('That album is already in your listening queue.');
    throw error;
  }
}

const MOOD_GENRES = {
  mellow: ['folk', 'jazz', 'ambient', 'singer/songwriter', 'blues', 'acoustic'],
  upbeat: ['pop', 'dance', 'disco', 'funk', 'soul', 'reggae'],
  energetic: ['rock', 'punk', 'metal', 'hardcore', 'dance'],
  reflective: ['folk', 'singer/songwriter', 'indie', 'ambient', 'classical'],
  focus: ['ambient', 'classical', 'instrumental', 'jazz', 'electronic'],
};

export async function buildListeningQueue(userId, { genre = '', mood = '' } = {}) {
  return withTransaction(async (client) => {
    const moodPatterns = (MOOD_GENRES[mood] ?? []).map((value) => `%${value}%`);
    const { rows: albums } = await client.query(
      `SELECT a.id FROM collection_albums ca
       JOIN collections c ON c.id = ca.collection_id JOIN albums a ON a.id = ca.album_id
       WHERE c.user_id = $1 AND ($2 = '' OR lower(a.genre) LIKE '%' || lower($2) || '%')
         AND (cardinality($3::text[]) = 0 OR lower(a.genre) LIKE ANY($3::text[]))
         AND NOT EXISTS (SELECT 1 FROM listening_history h WHERE h.user_id = $1 AND h.album_id = a.id)
       GROUP BY a.id ORDER BY random() LIMIT 20`, [userId, genre, moodPatterns],
    );
    await client.query('DELETE FROM listening_queue_items WHERE user_id = $1', [userId]);
    for (const [index, album] of albums.entries()) {
      await client.query(
        'INSERT INTO listening_queue_items (user_id, album_id, position) VALUES ($1, $2, $3)',
        [userId, album.id, index + 1],
      );
    }
    return listListeningQueue(userId, client);
  });
}

export async function removeFromListeningQueue(userId, queueId) {
  const { rowCount } = await pool.query(
    'DELETE FROM listening_queue_items WHERE user_id = $1 AND id = $2', [userId, queueId],
  );
  if (!rowCount) throw new NotFoundError('That album is not in your listening queue.');
}

export async function markQueueItemListened(userId, queueId) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT q.album_id FROM listening_queue_items q WHERE q.user_id = $1 AND q.id = $2 FOR UPDATE`,
      [userId, queueId],
    );
    if (!rows[0]) throw new NotFoundError('That album is not in your listening queue.');
    await client.query('INSERT INTO listening_history (user_id, album_id) VALUES ($1, $2)', [userId, rows[0].album_id]);
    await client.query('DELETE FROM listening_queue_items WHERE user_id = $1 AND id = $2', [userId, queueId]);
  });
}

export async function getListeningInsights(userId) {
  const [{ rows: totals }, { rows: artists }, { rows: dates }, { rows: unplayed }] = await Promise.all([
    pool.query('SELECT count(*)::int AS total, max(listened_at) AS last_listened FROM listening_history WHERE user_id = $1', [userId]),
    pool.query(
      `SELECT a.artist, count(*)::int AS listens FROM listening_history h
       JOIN albums a ON a.id = h.album_id WHERE h.user_id = $1
       GROUP BY a.artist ORDER BY listens DESC, lower(a.artist) LIMIT 5`, [userId],
    ),
    pool.query('SELECT DISTINCT listened_at::date::text AS day FROM listening_history WHERE user_id = $1 ORDER BY day DESC', [userId]),
    pool.query(
      `WITH unheard AS (
         SELECT DISTINCT a.id, a.title, a.artist FROM collections c
         JOIN collection_albums ca ON ca.collection_id = c.id JOIN albums a ON a.id = ca.album_id
         WHERE c.user_id = $1 AND NOT EXISTS (
           SELECT 1 FROM listening_history h WHERE h.user_id = $1 AND h.album_id = a.id
         )
       ), numbered AS (
         SELECT *, row_number() OVER (ORDER BY lower(title)) AS row_number FROM unheard
       )
       SELECT count(*)::int AS total,
         COALESCE(json_agg(json_build_object('id', id, 'title', title, 'artist', artist) ORDER BY lower(title))
           FILTER (WHERE row_number <= 5), '[]'::json) AS samples FROM numbered`, [userId],
    ),
  ]);
  const daySet = new Set(dates.map((row) => row.day));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;
  if (!daySet.has(cursor)) {
    const yesterday = new Date(`${today}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    cursor = yesterday.toISOString().slice(0, 10);
  }
  while (daySet.has(cursor)) {
    streak += 1;
    const previous = new Date(`${cursor}T00:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    cursor = previous.toISOString().slice(0, 10);
  }
  return {
    totalListens: totals[0].total,
    lastListenedAt: totals[0].last_listened,
    streakDays: streak,
    topArtists: artists.map((row) => ({ artist: row.artist, listens: row.listens })),
    unplayedCount: unplayed[0].total,
    unplayedSamples: unplayed[0].samples.slice(0, 5),
  };
}
