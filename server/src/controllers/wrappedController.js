import { pool } from '../db/pool.js';
import { NotFoundError } from '../utils/errors.js';

async function getRangeBounds(range) {
  const now = new Date();
  if (range === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31`, label: now.getFullYear().toString() };
  }
  if (range === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    // The last day of the month, so February is not given a 31st.
    const lastDay = new Date(year, month, 0).getDate();
    const monthText = String(month).padStart(2, '0');
    return {
      from: `${year}-${monthText}-01`,
      to: `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`,
      label: `${now.toLocaleString('default', { month: 'long' })} ${year}`,
    };
  }
  return { from: '1000-01-01', to: '2100-12-31', label: 'All time' };
}

/**
 * Builds the recap. Listens come from the listening journal, while total
 * listening time comes from recorded playback sessions.
 */
export async function index(req, res) {
  const range = req.validated?.query?.range ?? 'year';
  const { from, to, label } = await getRangeBounds(range);
  const userId = req.user.id;

  const [
    { rows: totals },
    { rows: artists },
    { rows: albums },
    { rows: genres },
    { rows: decades },
    { rows: formats },
    { rows: monthly },
    { rows: sessions },
  ] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS total_listens,
              count(DISTINCT album_id)::int AS unique_albums,
              max(listened_at) AS last_listened
       FROM listening_history
       WHERE user_id = $1 AND listened_at::date >= $2 AND listened_at::date <= $3`,
      [userId, from, to]
    ),
    pool.query(
      `SELECT a.artist, count(*)::int AS listens
       FROM listening_history h JOIN albums a ON a.id = h.album_id
       WHERE h.user_id = $1 AND h.listened_at::date >= $2 AND h.listened_at::date <= $3
       GROUP BY a.artist ORDER BY listens DESC, lower(a.artist) LIMIT 10`,
      [userId, from, to]
    ),
    pool.query(
      `SELECT a.id, a.title, a.artist, a.artwork_url, a.external_id,
              count(*)::int AS listens
       FROM listening_history h JOIN albums a ON a.id = h.album_id
       WHERE h.user_id = $1 AND h.listened_at::date >= $2 AND h.listened_at::date <= $3
       GROUP BY a.id ORDER BY listens DESC, lower(a.title) LIMIT 10`,
      [userId, from, to]
    ),
    pool.query(
      `SELECT a.genre, count(*)::int AS listens
       FROM listening_history h JOIN albums a ON a.id = h.album_id
       WHERE h.user_id = $1 AND h.listened_at::date >= $2 AND h.listened_at::date <= $3 AND a.genre IS NOT NULL
       GROUP BY a.genre ORDER BY listens DESC LIMIT 10`,
      [userId, from, to]
    ),
    pool.query(
      `SELECT floor(a.release_year / 10) * 10 AS decade, count(*)::int AS listens
       FROM listening_history h JOIN albums a ON a.id = h.album_id
       WHERE h.user_id = $1 AND h.listened_at::date >= $2 AND h.listened_at::date <= $3 AND a.release_year IS NOT NULL
       GROUP BY decade ORDER BY listens DESC`,
      [userId, from, to]
    ),
    pool.query(
      `SELECT ca.format, count(*)::int AS listens
       FROM listening_history h
       JOIN collection_albums ca ON ca.album_id = h.album_id
       JOIN collections c ON c.id = ca.collection_id
       WHERE h.user_id = $1 AND h.listened_at::date >= $2 AND h.listened_at::date <= $3
         AND c.user_id = $1 AND ca.format IS NOT NULL
       GROUP BY ca.format ORDER BY listens DESC`,
      [userId, from, to]
    ),
    pool.query(
      `SELECT to_char(listened_at::date, 'YYYY-MM') AS month, count(*)::int AS listens
       FROM listening_history
       WHERE user_id = $1 AND listened_at::date >= $2 AND listened_at::date <= $3
       GROUP BY month ORDER BY month ASC`,
      [userId, from, to]
    ),
    pool.query(
      `SELECT coalesce(sum(duration_ms), 0)::int AS total_ms,
              count(*)::int AS sessions
       FROM listening_sessions
       WHERE user_id = $1 AND started_at::date >= $2 AND started_at::date <= $3`,
      [userId, from, to]
    ),
  ]);

  const totalListens = totals[0].total_listens;
  const totalMinutes = Math.round(sessions[0].total_ms / 60000);
  const topArtist = artists[0] ?? { artist: '—', listens: 0 };
  const topAlbum = albums[0] ?? {
    id: null, title: '—', artist: '—', listens: 0, artwork_url: null, external_id: null,
  };
  const topGenre = genres[0] ?? { genre: '—', listens: 0 };

  res.json({
    range,
    label,
    totalListens,
    uniqueAlbums: totals[0].unique_albums,
    totalMinutes,
    totalSessions: sessions[0].sessions,
    lastListenedAt: totals[0].last_listened,
    topArtist: { name: topArtist.artist, listens: topArtist.listens },
    topAlbum: {
      id: topAlbum.id,
      title: topAlbum.title,
      artist: topAlbum.artist,
      artworkUrl: topAlbum.artwork_url,
      externalId: topAlbum.external_id,
      listens: topAlbum.listens,
      totalMinutes,
    },
    topGenre: { name: topGenre.genre, listens: topGenre.listens },
    topArtists: artists.map((row) => ({ name: row.artist, listens: row.listens })),
    topAlbums: albums.map((row) => ({
      id: row.id,
      title: row.title,
      artist: row.artist,
      artworkUrl: row.artwork_url,
      externalId: row.external_id,
      listens: row.listens,
      totalMinutes,
    })),
    topGenres: genres.map((row) => ({ name: row.genre, listens: row.listens })),
    decades: decades.map((row) => ({ decade: `${row.decade}s`, listens: row.listens })),
    formats: formats.map((row) => ({ name: row.format, listens: row.listens })),
    monthly: monthly.map((row) => ({ month: row.month, listens: row.listens })),
  });
}

/**
 * Records a playback session so the recap can report real listening time.
 */
export async function recordSession(req, res) {
  const { albumId, durationMs, completed } = req.validated.body;
  const { rows } = await pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
  if (!rows[0]) throw new NotFoundError('That album could not be found.');

  const { rows: inserted } = await pool.query(
    `INSERT INTO listening_sessions (user_id, album_id, duration_ms, completed)
     VALUES ($1, $2, $3, $4) RETURNING id, started_at`,
    [req.user.id, albumId, durationMs, completed ?? false]
  );

  res.status(201).json({
    session: { id: inserted[0].id, startedAt: inserted[0].started_at },
  });
}
