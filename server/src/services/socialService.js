import { pool } from '../db/pool.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export async function followUser(followerId, followingId) {
  if (followerId === followingId) throw new ConflictError('You cannot follow yourself.');
  const { rows: target } = await pool.query(
    'SELECT id FROM users WHERE id = $1', [followingId]
  );
  if (!target[0]) throw new NotFoundError('That user could not be found.');
  try {
    await pool.query(
      'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, followingId]
    );
    await pool.query(
      `INSERT INTO notifications (user_id, type, actor_id, message)
       VALUES ($1, 'follow', $2, $3)`,
      [followingId, followerId, 'started following you.']
    );
    await pool.query(
      `INSERT INTO activity_feed (user_id, type, target_type, target_id, metadata)
       VALUES ($1, 'follow', 'user', $2, $3)`,
      [followerId, followingId, JSON.stringify({ actorId: followerId })]
    );
    return { following: true };
  } catch (error) {
    if (error.code === '23505') throw new ConflictError('You already follow this user.');
    throw error;
  }
}

export async function unfollowUser(followerId, followingId) {
  const { rowCount } = await pool.query(
    'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
  if (!rowCount) throw new NotFoundError('You are not following this user.');
  return { following: false };
}

export async function listFollowers(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.avatar_url, uf.created_at
     FROM user_follows uf JOIN users u ON u.id = uf.follower_id
     WHERE uf.following_id = $1 ORDER BY uf.created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({ id: row.id, username: row.username, avatarUrl: row.avatar_url, followedAt: row.created_at }));
}

export async function listFollowing(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.avatar_url, uf.created_at
     FROM user_follows uf JOIN users u ON u.id = uf.following_id
     WHERE uf.follower_id = $1 ORDER BY uf.created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({ id: row.id, username: row.username, avatarUrl: row.avatar_url, followedAt: row.created_at }));
}

export async function isFollowing(followerId, followingId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1',
    [followerId, followingId]
  );
  return rows.length > 0;
}

export async function getActivityFeed(userId, { limit = 20, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT af.id, af.type, af.target_type, af.target_id, af.metadata, af.created_at,
            u.username AS actor_username, u.avatar_url AS actor_avatar
     FROM activity_feed af
     LEFT JOIN users u ON u.id = af.user_id
     WHERE af.user_id = $1
     ORDER BY af.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    actor: row.actor_username ? { username: row.actor_username, avatarUrl: row.actor_avatar } : null,
  }));
}

export async function getGlobalActivity({ limit = 30, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT af.id, af.type, af.target_type, af.target_id, af.metadata, af.created_at,
            u.username AS actor_username, u.avatar_url AS actor_avatar
     FROM activity_feed af
     JOIN users u ON u.id = af.user_id
     WHERE af.type IN ('listen', 'collect', 'acquire', 'share')
     ORDER BY af.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    actor: { username: row.actor_username, avatarUrl: row.actor_avatar },
  }));
}

export async function listNotifications(userId, { unreadOnly = false } = {}) {
  const query = unreadOnly
    ? 'WHERE user_id = $1 AND read = false'
    : 'WHERE user_id = $1';
  const { rows } = await pool.query(
    `SELECT id, type, actor_id, target_type, target_id, message, read, created_at
     FROM notifications ${query}
     ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    actorId: row.actor_id,
    targetType: row.target_type,
    targetId: row.target_id,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  }));
}

export async function markNotificationRead(userId, notificationId) {
  const { rowCount } = await pool.query(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );
  if (!rowCount) throw new NotFoundError('That notification could not be found.');
  return { read: true };
}

export async function markAllNotificationsRead(userId) {
  await pool.query('UPDATE notifications SET read = true WHERE user_id = $1 AND read = false', [userId]);
  return { read: true };
}

export async function getUnreadNotificationCount(userId) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS count FROM notifications WHERE user_id = $1 AND read = false',
    [userId]
  );
  return rows[0].count;
}

export async function likeContent(userId, targetType, targetId) {
  if (!['collection', 'album'].includes(targetType)) throw new Error('Invalid target type.');
  try {
    await pool.query(
      `INSERT INTO likes (user_id, target_type, target_id) VALUES ($1, $2, $3)`,
      [userId, targetType, targetId]
    );
    return { liked: true };
  } catch (error) {
    if (error.code === '23505') return { liked: false };
    throw error;
  }
}

export async function unlikeContent(userId, targetType, targetId) {
  const { rowCount } = await pool.query(
    'DELETE FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
    [userId, targetType, targetId]
  );
  return { liked: rowCount > 0 };
}

export async function isLiked(userId, targetType, targetId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3 LIMIT 1',
    [userId, targetType, targetId]
  );
  return rows.length > 0;
}

export async function addComment(userId, targetType, targetId, body) {
  if (!['collection', 'album'].includes(targetType)) throw new Error('Invalid target type.');
  const { rows } = await pool.query(
    `INSERT INTO comments (user_id, target_type, target_id, body)
     VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [userId, targetType, targetId, body]
  );
  return { id: rows[0].id, createdAt: rows[0].created_at };
}

export async function listComments(targetType, targetId, { limit = 20 } = {}) {
  const { rows } = await pool.query(
    `SELECT c.id, c.body, c.created_at, u.username, u.avatar_url
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.target_type = $1 AND c.target_id = $2
     ORDER BY c.created_at DESC LIMIT $3`,
    [targetType, targetId, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    author: { username: row.username, avatarUrl: row.avatar_url },
  }));
}

export async function getLikeCount(targetType, targetId) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS count FROM likes WHERE target_type = $1 AND target_id = $2',
    [targetType, targetId]
  );
  return rows[0].count;
}
