import { pool } from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import {
  findExternalAlbumInCollection,
  findManualDuplicate,
  insertManualAlbum,
  toAlbum,
  upsertItunesAlbum,
} from './albumsService.js';

const SORT_COLUMNS = {
  added_at: 'ca.added_at',
  title: 'lower(a.title)',
  artist: 'lower(a.artist)',
  release_year: 'a.release_year',
  genre: 'lower(a.genre)',
};

function toCollection(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    albumCount: Number(row.album_count ?? 0),
    coverArtworks: row.cover_artworks ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPublic: row.is_public ?? false,
    shareToken: row.share_token ?? null,
  };
}

export async function listCollections(userId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.description, c.created_at, c.updated_at, c.is_public, c.share_token,
            count(ca.album_id)::int AS album_count,
            COALESCE(
              json_agg(a.artwork_url ORDER BY ca.added_at DESC)
                FILTER (WHERE a.id IS NOT NULL AND a.artwork_url IS NOT NULL),
              '[]'::json
            ) AS cover_artworks
     FROM collections c
     LEFT JOIN collection_albums ca ON ca.collection_id = c.id
     LEFT JOIN albums a ON a.id = ca.album_id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.updated_at DESC`,
    [userId],
  );

  return rows.map(toCollection);
}

async function findOwnedCollection(userId, collectionId, queryable = pool) {
  const { rows } = await queryable.query(
    'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
    [collectionId, userId],
  );
  if (!rows[0]) throw new NotFoundError('That collection could not be found.');
  return rows[0];
}

export async function getCollection(userId, collectionId, { sort = 'added_at', order = 'desc', q = '' } = {}) {
  const collection = await findOwnedCollection(userId, collectionId);
  const sortColumn = SORT_COLUMNS[sort] ?? SORT_COLUMNS.added_at;
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const nulls = sort === 'release_year' ? ' NULLS LAST' : '';

  const { rows: albumRows } = await pool.query(
    `SELECT a.*, ca.added_at,
            ca.format AS collection_format, ca.condition AS collection_condition,
            ca.purchase_date AS collection_purchase_date, ca.price AS collection_price,
            ca.edition_notes AS collection_edition_notes,
            ca.memory_location, ca.memory_with, ca.memory_note
     FROM albums a
     JOIN collection_albums ca ON ca.album_id = a.id
     WHERE ca.collection_id = $1
       AND ($2 = '' OR a.title ILIKE '%' || $2 || '%' OR a.artist ILIKE '%' || $2 || '%' OR COALESCE(a.genre, '') ILIKE '%' || $2 || '%')
     ORDER BY ${sortColumn} ${direction}${nulls}, lower(a.title) ASC`,
    [collectionId, q],
  );

  return {
    ...toCollection({
      ...collection,
      album_count: albumRows.length,
      cover_artworks: albumRows.map((album) => album.artwork_url).filter(Boolean),
    }),
    albums: albumRows.map((row) => ({
      ...toAlbum(row),
      format: row.collection_format,
      condition: row.collection_condition,
      purchaseDate: row.collection_purchase_date,
      price: row.collection_price === null ? null : Number(row.collection_price),
      editionNotes: row.collection_edition_notes ?? '',
      memoryLocation: row.memory_location ?? '',
      memoryWith: row.memory_with ?? '',
      memoryNote: row.memory_note ?? '',
    })),
  };
}

export async function createCollection(userId, { name, description }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO collections (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name, description],
    );
    return toCollection(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('You already have a collection with that name.');
    }
    throw error;
  }
}

export async function updateCollection(userId, collectionId, { name, description, isPublic }) {
  try {
    const { rows } = await pool.query(
      `UPDATE collections
       SET name = COALESCE($3, name),
           description = COALESCE($4, description),
           is_public = COALESCE($5, is_public)
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [collectionId, userId, name ?? null, description ?? null, isPublic ?? null],
    );
    if (!rows[0]) throw new NotFoundError('That collection could not be found.');
    return toCollection(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('You already have a collection with that name.');
    }
    throw error;
  }
}

export async function updateCollectionAlbum(userId, collectionId, albumId, metadata) {
  await findOwnedCollection(userId, collectionId);
  const columns = {
    format: 'format', condition: 'condition', purchaseDate: 'purchase_date',
    price: 'price', editionNotes: 'edition_notes',
    memoryLocation: 'memory_location', memoryWith: 'memory_with', memoryNote: 'memory_note',
  };
  const sets = [];
  const values = [collectionId, albumId];
  for (const [key, column] of Object.entries(columns)) {
    if (Object.hasOwn(metadata, key)) {
      values.push(metadata[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  const { rowCount } = await pool.query(
    `UPDATE collection_albums SET ${sets.join(', ')} WHERE collection_id = $1 AND album_id = $2`,
    values,
  );
  if (!rowCount) throw new NotFoundError('That album is not in this collection.');
}

export async function importCollectionAlbums(userId, collectionId, albums) {
  const collection = await findOwnedCollection(userId, collectionId);
  return withTransaction(async (client) => {
    let imported = 0;
    let skipped = 0;
    for (const item of albums) {
      const duplicate = await client.query(
        `SELECT 1 FROM collection_albums ca JOIN albums a ON a.id = ca.album_id
         WHERE ca.collection_id = $1 AND lower(a.title) = lower($2) AND lower(a.artist) = lower($3)
           AND a.release_year IS NOT DISTINCT FROM $4 LIMIT 1`,
        [collection.id, item.title, item.artist, item.releaseYear ?? null],
      );
      if (duplicate.rowCount) { skipped += 1; continue; }
      const { rows } = await client.query(
        `INSERT INTO albums (title, artist, release_year, genre, source)
         VALUES ($1, $2, $3, $4, 'manual') RETURNING id`,
        [item.title, item.artist, item.releaseYear ?? null, item.genre || null],
      );
      await client.query(
        `INSERT INTO collection_albums
          (collection_id, album_id, format, condition, purchase_date, price, edition_notes,
           memory_location, memory_with, memory_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [collection.id, rows[0].id, item.format ?? null, item.condition ?? null,
          item.purchaseDate ?? null, item.price ?? null, item.editionNotes ?? '',
          item.memoryLocation ?? '', item.memoryWith ?? '', item.memoryNote ?? ''],
      );
      imported += 1;
    }
    if (imported) await client.query('UPDATE collections SET updated_at = now() WHERE id = $1', [collection.id]);
    return { imported, skipped };
  });
}

export async function getSharedCollection(shareToken) {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.description, c.created_at, c.updated_at, c.is_public, u.username
     FROM collections c JOIN users u ON u.id = c.user_id WHERE c.share_token = $1`,
    [shareToken],
  );
  if (!rows[0]) throw new NotFoundError('That shared collection could not be found.');
  const row = rows[0];
  const { rows: albums } = await pool.query(
    `SELECT a.id, a.title, a.artist, a.release_year, a.genre, a.artwork_url, a.track_count, a.external_id
     FROM albums a JOIN collection_albums ca ON ca.album_id = a.id
     WHERE ca.collection_id = $1 ORDER BY ca.added_at DESC`,
    [row.id],
  );
  return {
    id: row.id, name: row.name, description: row.description,
    owner: row.username, isPublic: row.is_public,
    albums: albums.map(toAlbum),
  };
}

export async function getPublicProfile(username) {
  const { rows } = await pool.query(
    'SELECT id, username FROM users WHERE lower(username) = lower($1) AND profile_public = true',
    [username],
  );
  if (!rows[0]) throw new NotFoundError('That public profile could not be found.');
  const { rows: collections } = await pool.query(
    `SELECT c.id, c.name, c.description, c.created_at, c.updated_at, c.is_public, c.share_token,
       count(ca.album_id)::int AS album_count,
       COALESCE(json_agg(a.artwork_url) FILTER (WHERE a.artwork_url IS NOT NULL), '[]'::json) AS cover_artworks
     FROM collections c LEFT JOIN collection_albums ca ON ca.collection_id = c.id
     LEFT JOIN albums a ON a.id = ca.album_id
     WHERE c.user_id = $1 AND c.is_public = true GROUP BY c.id ORDER BY c.updated_at DESC`,
    [rows[0].id],
  );
  return { username: rows[0].username, collections: collections.map(toCollection) };
}

export async function deleteCollection(userId, collectionId) {
  const { rowCount } = await pool.query(
    'DELETE FROM collections WHERE id = $1 AND user_id = $2',
    [collectionId, userId],
  );
  if (rowCount === 0) throw new NotFoundError('That collection could not be found.');
}

export async function addAlbumToCollection(userId, collectionId, payload) {
  const collection = await findOwnedCollection(userId, collectionId);

  let album;

  if (payload.externalId) {
    const existing = await findExternalAlbumInCollection(collection.id, payload.externalId);
    if (existing) {
      throw new ConflictError('That album is already in this collection.');
    }

    // Fetch and persist the real iTunes metadata rather than trusting the
    // client's copy of a search result.
    album = await upsertItunesAlbum(payload.externalId);
  } else {
    const duplicate = await findManualDuplicate(collection.id, payload.manual);
    if (duplicate) {
      throw new ConflictError('That album is already in this collection.');
    }
    album = await insertManualAlbum(payload.manual);
  }

  try {
    await withTransaction(async (client) => {
      await client.query(
        'INSERT INTO collection_albums (collection_id, album_id) VALUES ($1, $2)',
        [collection.id, album.id],
      );
      await client.query('UPDATE collections SET updated_at = now() WHERE id = $1', [collection.id]);
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('That album is already in this collection.');
    }
    throw error;
  }

  return album;
}

export async function removeAlbumFromCollection(userId, collectionId, albumId) {
  const collection = await findOwnedCollection(userId, collectionId);

  const { rowCount } = await pool.query(
    'DELETE FROM collection_albums WHERE collection_id = $1 AND album_id = $2',
    [collection.id, albumId],
  );

  if (rowCount === 0) throw new NotFoundError('That album is not in this collection.');
  await pool.query('UPDATE collections SET updated_at = now() WHERE id = $1', [collection.id]);
}
