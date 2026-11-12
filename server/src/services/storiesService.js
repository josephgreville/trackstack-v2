import { pool } from '../db/pool.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export async function getStory(userId, albumId) {
  const { rows } = await pool.query(
    `SELECT s.id, s.title, s.body, s.location, s.occurred_at, s.is_public, s.created_at, s.updated_at,
            a.id AS album_id, a.title AS album_title, a.artist AS album_artist, a.artwork_url AS album_artwork
     FROM album_stories s
     JOIN albums a ON a.id = s.album_id
     WHERE s.user_id = $1 AND s.album_id = $2`,
    [userId, albumId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  const { rows: photos } = await pool.query(
    'SELECT id, url, caption, taken_at, is_cover FROM album_photos WHERE story_id = $1 ORDER BY is_cover DESC, created_at ASC',
    [row.id]
  );
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    location: row.location,
    occurredAt: row.occurred_at,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    album: { id: row.album_id, title: row.album_title, artist: row.album_artist, artworkUrl: row.album_artwork },
    photos: photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption, takenAt: p.taken_at, isCover: p.is_cover })),
  };
}

export async function upsertStory(userId, albumId, { title, body, location, occurredAt, isPublic }) {
  const existing = await getStory(userId, albumId);
  if (existing) {
    await pool.query(
      `UPDATE album_stories
       SET title = COALESCE($3, title),
           body = COALESCE($4, body),
           location = COALESCE($5, location),
           occurred_at = COALESCE($6, occurred_at),
           is_public = COALESCE($7, is_public),
           updated_at = now()
       WHERE user_id = $1 AND album_id = $2`,
      [userId, albumId, title ?? null, body ?? null, location ?? null, occurredAt ?? null, isPublic ?? null]
    );
    return await getStory(userId, albumId);
  }
  const { rows } = await pool.query(
    `INSERT INTO album_stories (user_id, album_id, title, body, location, occurred_at, is_public)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [userId, albumId, title ?? '', body ?? '', location ?? null, occurredAt ?? null, isPublic ?? false]
  );
  return await getStory(userId, albumId);
}

export async function listUserStories(userId, { publicOnly = false } = {}) {
  const query = publicOnly
    ? 'WHERE s.user_id = $1 AND s.is_public = true'
    : 'WHERE s.user_id = $1';
  const { rows } = await pool.query(
    `SELECT s.id, s.title, s.body, s.location, s.occurred_at, s.is_public, s.created_at,
            a.id AS album_id, a.title AS album_title, a.artist AS album_artist, a.artwork_url AS album_artwork
     FROM album_stories s
     JOIN albums a ON a.id = s.album_id
     ${query}
     ORDER BY s.created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    location: row.location,
    occurredAt: row.occurred_at,
    isPublic: row.is_public,
    createdAt: row.created_at,
    album: { id: row.album_id, title: row.album_title, artist: row.album_artist, artworkUrl: row.album_artwork },
  }));
}

export async function deleteStory(userId, storyId) {
  const { rowCount } = await pool.query(
    'DELETE FROM album_stories WHERE id = $1 AND user_id = $2',
    [storyId, userId]
  );
  if (!rowCount) throw new NotFoundError('That story could not be found.');
  return { deleted: true };
}

export async function addPhoto(userId, storyId, { url, caption, takenAt, isCover }) {
  const { rows: story } = await pool.query(
    'SELECT id FROM album_stories WHERE id = $1 AND user_id = $2', [storyId, userId]
  );
  if (!story[0]) throw new NotFoundError('That story could not be found.');
  if (isCover) {
    await pool.query('UPDATE album_photos SET is_cover = false WHERE story_id = $1', [storyId]);
  }
  const { rows } = await pool.query(
    `INSERT INTO album_photos (user_id, story_id, url, caption, taken_at, is_cover)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, storyId, url, caption ?? null, takenAt ?? null, isCover ?? false]
  );
  return rows[0];
}

export async function deletePhoto(userId, photoId) {
  const { rowCount } = await pool.query(
    `DELETE FROM album_photos WHERE id = $1 AND user_id = $2`,
    [photoId, userId]
  );
  if (!rowCount) throw new NotFoundError('That photo could not be found.');
  return { deleted: true };
}

export async function getPublicStoriesForAlbum(userId, albumId, { limit = 20 } = {}) {
  const { rows } = await pool.query(
    `SELECT s.id, s.title, s.body, s.location, s.occurred_at, s.created_at,
            u.username, u.avatar_url
     FROM album_stories s
     JOIN users u ON u.id = s.user_id
     WHERE s.album_id = $1 AND s.user_id <> $2 AND s.is_public = true
     ORDER BY s.created_at DESC LIMIT $3`,
    [albumId, userId, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    location: row.location,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    author: { username: row.username, avatarUrl: row.avatar_url },
  }));
}
