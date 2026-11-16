// ============================================================================
// TrackStack demo seed
//
// Creates a small, believable world so the app never looks empty during a
// demo: one collector with three collections, copies with format and
// condition, a wantlist, a listening journal, album stories, and a second
// collector who follows them and likes their public collection.
//
// The seed is repeatable: running it again removes the previous demo data
// first and rebuilds it.
//
//   npm run db:seed
//
// It writes only to the database in DATABASE_URL, never to the iTunes API,
// so it works offline and is safe to run on a demo environment.
// ============================================================================

import bcrypt from 'bcryptjs';
import { pool, closePool } from './pool.js';
import { getAlbumSummary } from '../services/itunesService.js';

const DEMO_PASSWORD = 'Password123!';

const ALBUMS = [
  {
    externalId: '594061854',
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    releaseYear: 1977,
    genre: 'Pop',
    artworkUrl: null,
    trackCount: 11,
  },
  {
    externalId: '269572838',
    title: 'Thriller',
    artist: 'Michael Jackson',
    releaseYear: 1982,
    genre: 'Pop',
    artworkUrl: null,
    trackCount: 13,
  },
  {
    externalId: '697194953',
    title: 'Discovery',
    artist: 'Daft Punk',
    releaseYear: 2001,
    genre: 'Dance',
    artworkUrl: null,
    trackCount: 14,
  },
  {
    externalId: '1109714933',
    title: 'In Rainbows',
    artist: 'Radiohead',
    releaseYear: 2007,
    genre: 'Alternative',
    artworkUrl: null,
    trackCount: 10,
  },
  {
    externalId: '1276760743',
    title: 'The Miseducation of Lauryn Hill',
    artist: 'Lauryn Hill',
    releaseYear: 1998,
    genre: 'Hip-Hop/Rap',
    artworkUrl: null,
    trackCount: 13,
  },
  {
    externalId: '1440856219',
    title: 'Back to Black',
    artist: 'Amy Winehouse',
    releaseYear: 2006,
    genre: 'Jazz',
    artworkUrl: null,
    trackCount: 11,
  },
  {
    externalId: '268443092',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    releaseYear: 1959,
    genre: 'Jazz',
    artworkUrl: null,
    trackCount: 5,
  },
  {
    externalId: '1492263092',
    title: 'Blue',
    artist: 'Joni Mitchell',
    releaseYear: 1971,
    genre: 'Folk',
    artworkUrl: null,
    trackCount: 10,
  },
];

const COLLECTIONS = [
  {
    name: 'Vinyl Shelf',
    description: 'Records I actually own on 12-inch.',
    shelfTheme: 'classic',
    isPublic: true,
    albums: [
      { externalId: '697194953', format: 'vinyl', condition: 'near_mint', price: 28, editionNotes: 'Original 2001 EU pressing.' },
      { externalId: '1109714933', format: 'vinyl', condition: 'mint', price: 34.5, editionNotes: '45rpm double LP.' },
      { externalId: '594061854', format: 'vinyl', condition: 'very_good', price: 22, editionNotes: 'Playful sleeve, a few marks.' },
    ],
  },
  {
    name: 'Cassette Shelf',
    description: 'Tapes from car journeys and charity shops.',
    shelfTheme: 'retro',
    isPublic: false,
    albums: [
      { externalId: '269572838', format: 'cassette', condition: 'good', price: 4, editionNotes: 'Tape 2 of 2, slightly warped.' },
      { externalId: '1276760743', format: 'cassette', condition: 'very_good', price: 6.5 },
    ],
  },
  {
    name: 'CDs to Sell',
    description: 'Dubbed once, then forgotten.',
    shelfTheme: 'mono',
    isPublic: false,
    albums: [
      { externalId: '1440856219', format: 'cd', condition: 'fair', price: 3 },
    ],
  },
];

const WANTLIST = [
  { externalId: '268443092', preferredEdition: 'Original 1959 mono pressing', notes: 'Waiting on a cheap copy.' },
  { externalId: '1492263092', preferredEdition: 'Any pressing', notes: 'Reissue is fine.' },
];

const HISTORY = [
  { externalId: '697194953', rating: 5, review: 'Still the best record ever made.' },
  { externalId: '1109714933', rating: 4, review: 'The last three tracks are worth the whole album.' },
  { externalId: '1276760743', rating: 5, review: 'Perfect from start to finish.' },
];

const STORIES = [
  {
    externalId: '697194953',
    title: 'First record I ever bought',
    body: 'Bought it with pocket money the week I turned thirteen. The sleeve is still creased exactly where my thumb goes.',
    location: 'Reading',
    occurredAt: '2012-06-14',
    isPublic: true,
  },
];

async function findOrCreateUser({ username, email, bio, xp, level, profilePublic }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, bio, xp, level, profile_public)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (lower(email)) DO UPDATE
       SET bio = EXCLUDED.bio, xp = EXCLUDED.xp, level = EXCLUDED.level,
           profile_public = EXCLUDED.profile_public
     RETURNING id`,
    [username, email, passwordHash, bio, xp, level, profilePublic],
  );
  return rows[0].id;
}

async function upsertAlbum(album) {
  // Artwork comes from the iTunes catalogue when the network is available.
  // If it is not, the album still seeds and the UI falls back to a placeholder.
  let artworkUrl = album.artworkUrl;
  if (!artworkUrl) {
    try {
      const summary = await getAlbumSummary(album.externalId);
      artworkUrl = summary.artworkUrl ?? null;
    } catch {
      artworkUrl = null;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO albums (title, artist, release_year, genre, artwork_url, external_id, track_count, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'itunes')
     ON CONFLICT (external_id) DO UPDATE
       SET title = EXCLUDED.title, artist = EXCLUDED.artist,
           release_year = EXCLUDED.release_year, genre = EXCLUDED.genre,
           artwork_url = EXCLUDED.artwork_url, track_count = EXCLUDED.track_count
     RETURNING id`,
    [album.title, album.artist, album.releaseYear, album.genre, artworkUrl, album.externalId, album.trackCount],
  );
  return rows[0].id;
}

async function seed() {
  console.log('Seeding TrackStack demo data…');

  const ownerId = await findOrCreateUser({
    username: 'demo_joey',
    email: 'joey@example.com',
    bio: 'Records, mostly vinyl. Occasionally correct.',
    xp: 1840,
    level: 7,
    profilePublic: true,
  });
  const friendId = await findOrCreateUser({
    username: 'sam_beats',
    email: 'sam@example.com',
    bio: 'Cassettes and second presses.',
    xp: 620,
    level: 3,
    profilePublic: true,
  });

  // Clear previous demo content so the seed is repeatable.
  await pool.query('DELETE FROM collection_albums WHERE collection_id IN (SELECT id FROM collections WHERE user_id = ANY($1::uuid[]))', [[ownerId, friendId]]);
  await pool.query('DELETE FROM collections WHERE user_id = ANY($1::uuid[])', [[ownerId, friendId]]);
  await pool.query('DELETE FROM wantlist_items WHERE user_id = ANY($1::uuid[])', [[ownerId, friendId]]);
  await pool.query('DELETE FROM listening_history WHERE user_id = ANY($1::uuid[])', [[ownerId, friendId]]);
  await pool.query('DELETE FROM album_stories WHERE user_id = ANY($1::uuid[])', [[ownerId, friendId]]);
  await pool.query('DELETE FROM likes WHERE user_id = ANY($1::uuid[])', [[ownerId, friendId]]);
  await pool.query('DELETE FROM comments WHERE user_id = ANY($1::uuid[])', [[ownerId, friendId]]);
  await pool.query('DELETE FROM activity_feed WHERE user_id = ANY($1::uuid[])', [[ownerId, friendId]]);
  await pool.query('DELETE FROM user_follows WHERE follower_id = ANY($1::uuid[]) OR following_id = ANY($1::uuid[])', [[ownerId, friendId]]);

  const albumIds = new Map();
  for (const album of ALBUMS) {
    albumIds.set(album.externalId, await upsertAlbum(album));
  }

  let publicCollectionId = null;
  for (const collection of COLLECTIONS) {
    const { rows } = await pool.query(
      `INSERT INTO collections (user_id, name, description, is_public, shelf_theme)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [ownerId, collection.name, collection.description, collection.isPublic, collection.shelfTheme],
    );
    const collectionId = rows[0].id;
    if (collection.isPublic) publicCollectionId = collectionId;

    for (const entry of collection.albums) {
      await pool.query(
        `INSERT INTO collection_albums
           (collection_id, album_id, format, condition, price, edition_notes, purchase_date)
         VALUES ($1, $2, $3, $4, $5, $6, now() - ((random() * 400)::int * interval '1 day'))`,
        [
          collectionId,
          albumIds.get(entry.externalId),
          entry.format,
          entry.condition,
          entry.price,
          entry.editionNotes ?? '',
        ],
      );
    }
  }

  for (const item of WANTLIST) {
    await pool.query(
      `INSERT INTO wantlist_items (user_id, album_id, preferred_edition, notes, priority)
       VALUES ($1, $2, $3, $4, 2)`,
      [ownerId, albumIds.get(item.externalId), item.preferredEdition, item.notes],
    );
  }

  for (const entry of HISTORY) {
    await pool.query(
      `INSERT INTO listening_history (user_id, album_id, listened_at, rating, review)
       VALUES ($1, $2, now() - ((random() * 60)::int * interval '1 day'), $3, $4)`,
      [ownerId, albumIds.get(entry.externalId), entry.rating, entry.review],
    );
  }

  for (const story of STORIES) {
    await pool.query(
      `INSERT INTO album_stories (user_id, album_id, title, body, location, occurred_at, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        ownerId,
        albumIds.get(story.externalId),
        story.title,
        story.body,
        story.location,
        story.occurredAt,
        story.isPublic,
      ],
    );
  }

  // Social layer: sam follows joey and likes the public collection.
  await pool.query(
    'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [friendId, ownerId],
  );

  // An activity feed needs history to look like history.
  const activityRows = [
    { user: ownerId, type: 'collect', targetType: 'album', targetId: albumIds.get('697194953'), hoursAgo: 2 },
    { user: ownerId, type: 'listen', targetType: 'album', targetId: albumIds.get('1109714933'), hoursAgo: 20 },
    { user: ownerId, type: 'want', targetType: 'album', targetId: albumIds.get('268443092'), hoursAgo: 48 },
    { user: friendId, type: 'follow', targetType: 'user', targetId: ownerId, hoursAgo: 5 },
  ];
  for (const row of activityRows) {
    await pool.query(
      `INSERT INTO activity_feed (user_id, type, target_type, target_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, '{}'::jsonb, now() - ($5::int * interval '1 hour'))`,
      [row.user, row.type, row.targetType, row.targetId, row.hoursAgo],
    );
  }

  if (publicCollectionId) {
    await pool.query(
      `INSERT INTO likes (user_id, target_type, target_id) VALUES ($1, 'collection', $2)
       ON CONFLICT DO NOTHING`,
      [friendId, publicCollectionId],
    );
    await pool.query(
      `INSERT INTO comments (user_id, target_type, target_id, body)
       VALUES ($1, 'collection', $2, $3)`,
      [friendId, publicCollectionId, 'This shelf is immaculate. Jealous of the near-mint copy.'],
    );
  }

  console.log('Seed complete.');
  console.log('  demo_joey  ·  joey@example.com  ·  %s', DEMO_PASSWORD);
  console.log('    3 collections, wantlist, journal, story, activity feed');
  console.log('  sam_beats  ·  sam@example.com   ·  %s', DEMO_PASSWORD);
  console.log('    follows demo_joey, likes and comments on the public shelf');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(closePool);
