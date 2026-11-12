import { pool } from '../db/pool.js';

export async function getRecommendations(userId, { kind, limit = 12 } = {}) {
  const values = [userId];
  let kindFilter = '';
  if (kind) {
    values.push(kind);
    kindFilter = `AND r.kind = $${values.length}`;
  }
  values.push(limit);

  const query = `
    SELECT r.id, r.reason, r.score, r.kind, r.created_at,
           a.id AS album_id, a.title, a.artist, a.release_year, a.genre,
           a.artwork_url, a.external_id, a.track_count
    FROM recommendations r
    JOIN albums a ON a.id = r.album_id
    WHERE r.user_id = $1 AND r.dismissed = false ${kindFilter}
    ORDER BY r.score DESC, r.created_at DESC
    LIMIT $${values.length}
  `;
  const { rows } = await pool.query(query, values);
  return rows.map((row) => ({
    id: row.id,
    album: {
      id: row.album_id,
      title: row.title,
      artist: row.artist,
      releaseYear: row.release_year,
      genre: row.genre,
      artworkUrl: row.artwork_url,
      externalId: row.external_id,
      trackCount: row.track_count,
    },
    reason: row.reason,
    score: Number(row.score),
    kind: row.kind,
    createdAt: row.created_at,
  }));
}

export async function dismissRecommendation(userId, recommendationId) {
  const { rowCount } = await pool.query(
    'UPDATE recommendations SET dismissed = true WHERE id = $1 AND user_id = $2',
    [recommendationId, userId]
  );
  if (!rowCount) return false;
  return true;
}

export async function generateDiscoverWeekly(userId) {
  const { rows: owned } = await pool.query(
    `SELECT a.id, a.genre, a.artist
     FROM collection_albums ca
     JOIN collections c ON c.id = ca.collection_id
     JOIN albums a ON a.id = ca.album_id
     WHERE c.user_id = $1`, [userId]
  );
  const { rows: history } = await pool.query(
    `SELECT a.id, a.genre, a.artist
     FROM listening_history h
     JOIN albums a ON a.id = h.album_id
     WHERE h.user_id = $1`, [userId]
  );
  const ownedIds = new Set(owned.map((r) => r.id));
  const heardIds = new Set(history.map((r) => r.id));
  const userGenres = new Set([...owned, ...history].map((r) => r.genre).filter(Boolean));
  const userArtists = new Set([...owned, ...history].map((r) => r.artist));

  // Find similar albums: same genre as owned/heard but not owned or heard
  const genreArray = Array.from(userGenres);
  const ownedArray = Array.from(ownedIds);
  const heardArray = Array.from(heardIds);

  const { rows: candidates } = await pool.query(
    `SELECT a.id, a.title, a.artist, a.release_year, a.genre, a.artwork_url,
            a.external_id, a.track_count
     FROM albums a
     WHERE a.id <> ALL($1::uuid[])
       AND a.id <> ALL($2::uuid[])
       AND a.genre = ANY($3::text[])
     ORDER BY lower(a.title)
     LIMIT 12`,
    [ownedArray, heardArray, genreArray]
  );

  const recommendations = candidates.map((row, index) => ({
    album: {
      id: row.id,
      title: row.title,
      artist: row.artist,
      releaseYear: row.release_year,
      genre: row.genre,
      artworkUrl: row.artwork_url,
      externalId: row.external_id,
      trackCount: row.track_count,
    },
    reason: `Matches your ${row.genre} taste`,
    score: Math.round((100 - index * 5) * 100) / 100,
    kind: 'similar',
  }));

  // Add new-to-you discoveries from genres they have not explored much
  if (recommendations.length < 12) {
    const { rows: newGenres } = await pool.query(
      `SELECT genre FROM (
         SELECT DISTINCT a.genre AS genre FROM albums a
         WHERE a.genre IS NOT NULL
           AND NOT (a.genre = ANY($1::text[]))
       ) picked
       ORDER BY random() LIMIT 4`,
      [genreArray]
    );
    for (const { genre } of newGenres) {
      if (recommendations.length >= 12) break;
      const { rows: gems } = await pool.query(
        `SELECT a.id, a.title, a.artist, a.release_year, a.genre, a.artwork_url,
                a.external_id, a.track_count
         FROM albums a
         WHERE a.genre = $1
           AND a.id <> ALL($2::uuid[])
           AND a.id <> ALL($3::uuid[])
         ORDER BY random() LIMIT 2`,
        [genre, ownedArray, heardArray]
      );
      for (const row of gems) {
        if (recommendations.length >= 12) break;
        recommendations.push({
          album: {
            id: row.id, title: row.title, artist: row.artist,
            releaseYear: row.release_year, genre: row.genre,
            artworkUrl: row.artwork_url, externalId: row.external_id,
            trackCount: row.track_count,
          },
          reason: `Discover ${genre}`,
          score: Math.round((90 - recommendations.length * 3) * 100) / 100,
          kind: 'new_to_you',
        });
      }
    }
  }

  // Persist recommendations (upsert)
  for (const rec of recommendations) {
    await pool.query(
      `INSERT INTO recommendations (user_id, album_id, reason, score, kind)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, album_id, kind) DO UPDATE SET
         reason = EXCLUDED.reason,
         score = EXCLUDED.score,
         dismissed = false,
         created_at = now()`,
      [userId, rec.album.id, rec.reason, rec.score, rec.kind]
    );
  }

  return recommendations;
}
