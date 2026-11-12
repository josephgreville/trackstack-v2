import { pool } from '../db/pool.js';
import { NotFoundError } from '../utils/errors.js';

const LEVEL_XP = (level) => Math.floor(100 * Math.pow(1.5, level - 1));

export async function getUserProfile(userId) {
  const { rows } = await pool.query(
    `SELECT id, username, email, xp, level, bio, avatar_url, location, website,
            profile_public, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) throw new NotFoundError('User not found.');
  const row = rows[0];
  const xpForNext = LEVEL_XP(row.level + 1);
  const progress = Math.min(100, Math.floor((row.xp / xpForNext) * 100));
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    xp: row.xp,
    level: row.level,
    xpForNext,
    progress,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    location: row.location,
    website: row.website,
    profilePublic: row.profile_public ?? false,
    memberSince: row.created_at,
  };
}

export async function updateUserProfile(userId, { bio, location, website }) {
  const { rows } = await pool.query(
    `UPDATE users
     SET bio = COALESCE($2, bio),
         location = COALESCE($3, location),
         website = COALESCE($4, website)
     WHERE id = $1
     RETURNING id, username, xp, level, bio, location, website`,
    [userId, bio ?? null, location ?? null, website ?? null]
  );
  if (!rows[0]) throw new NotFoundError('User not found.');
  return rows[0];
}

export async function addXp(userId, amount) {
  if (!amount || amount <= 0) return null;
  const { rows } = await pool.query(
    `UPDATE users SET xp = xp + $2 WHERE id = $1 RETURNING xp, level`,
    [userId, amount]
  );
  const row = rows[0];
  const newLevel = Math.floor(Math.log(row.xp / 100) / Math.log(1.5)) + 1;
  let leveledUp = false;
  if (newLevel > row.level) {
    await pool.query('UPDATE users SET level = $2 WHERE id = $1', [userId, newLevel]);
    leveledUp = true;
  }
  return { xp: row.xp, level: leveledUp ? newLevel : row.level, leveledUp };
}

export async function listAchievements(userId) {
  const { rows: defs } = await pool.query(
    'SELECT id, key, name, description, icon, xp_reward, criteria FROM achievements ORDER BY name'
  );
  const { rows: earned } = await pool.query(
    `SELECT a.id AS achievement_id, ua.earned_at
     FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = $1`,
    [userId]
  );
  const earnedSet = new Set(earned.map((e) => e.achievement_id));
  const earnedMap = new Map(earned.map((e) => [e.achievement_id, e.earned_at]));
  return defs.map((def) => ({
    id: def.id,
    key: def.key,
    name: def.name,
    description: def.description,
    icon: def.icon,
    xpReward: def.xp_reward,
    earned: earnedSet.has(def.id),
    earnedAt: earnedMap.get(def.id) ?? null,
  }));
}

export async function awardAchievement(userId, achievementKey) {
  const { rows: defs } = await pool.query(
    'SELECT id FROM achievements WHERE key = $1', [achievementKey]
  );
  if (!defs[0]) return null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO user_achievements (user_id, achievement_id)
       VALUES ($1, $2) RETURNING id`,
      [userId, defs[0].id]
    );
    const { rows: def } = await pool.query('SELECT xp_reward FROM achievements WHERE id = $1', [defs[0].id]);
    if (def[0].xp_reward > 0) await addXp(userId, def[0].xp_reward);
    return rows[0];
  } catch (error) {
    if (error.code === '23505') return null; // already earned
    throw error;
  }
}

export async function checkAchievements(userId) {
  const checks = [
    { key: 'first_listen', fn: checkFirstListen },
    { key: 'century_collector', fn: checkCenturyCollector },
    { key: 'genre_explorer', fn: checkGenreExplorer },
    { key: 'week_streak', fn: checkWeekStreak },
    { key: 'wantlist_hunter', fn: checkWantlistHunter },
    { key: 'social_collector', fn: checkSocialCollector },
    { key: 'storyteller', fn: checkStoryteller },
    { key: 'vinyl_loyalist', fn: checkVinylLoyalist },
  ];
  const newlyEarned = [];
  for (const { key, fn } of checks) {
    const qualifies = await fn(userId);
    if (qualifies) {
      const awarded = await awardAchievement(userId, key);
      if (awarded) newlyEarned.push(key);
    }
  }
  return newlyEarned;
}

async function checkFirstListen(userId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM listening_history WHERE user_id = $1 LIMIT 1', [userId]
  );
  return rows.length > 0;
}

async function checkCenturyCollector(userId) {
  const { rows } = await pool.query(
    `SELECT count(DISTINCT ca.album_id)::int AS total
     FROM collection_albums ca JOIN collections c ON c.id = ca.collection_id
     WHERE c.user_id = $1`, [userId]
  );
  return rows[0].total >= 100;
}

async function checkGenreExplorer(userId) {
  const { rows } = await pool.query(
    `SELECT count(DISTINCT lower(a.genre))::int AS total
     FROM listening_history h JOIN albums a ON a.id = h.album_id
     WHERE h.user_id = $1 AND a.genre IS NOT NULL`, [userId]
  );
  return rows[0].total >= 10;
}

async function checkWeekStreak(userId) {
  const { rows } = await pool.query(
    `SELECT DISTINCT listened_at::date::text AS day
     FROM listening_history WHERE user_id = $1 ORDER BY day DESC`, [userId]
  );
  const daySet = new Set(rows.map((row) => row.day));
  let streak = 0;
  let cursor = new Date().toISOString().slice(0, 10);
  if (!daySet.has(cursor)) {
    const yesterday = new Date(`${cursor}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    cursor = yesterday.toISOString().slice(0, 10);
  }
  while (daySet.has(cursor)) {
    streak += 1;
    const previous = new Date(`${cursor}T00:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    cursor = previous.toISOString().slice(0, 10);
  }
  return streak >= 7;
}

async function checkWantlistHunter(userId) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS total FROM wantlist_items WHERE user_id = $1', [userId]
  );
  return rows[0].total >= 10;
}

async function checkSocialCollector(userId) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS total FROM user_follows WHERE follower_id = $1', [userId]
  );
  return rows[0].total >= 5;
}

async function checkStoryteller(userId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM album_stories WHERE user_id = $1 LIMIT 1', [userId]
  );
  return rows.length > 0;
}

async function checkVinylLoyalist(userId) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS total
     FROM collection_albums ca JOIN collections c ON c.id = ca.collection_id
     WHERE c.user_id = $1 AND ca.format = 'vinyl'`, [userId]
  );
  return rows[0].total >= 25;
}
