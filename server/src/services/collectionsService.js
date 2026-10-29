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
  };
}

export async function listCollections(userId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.description, c.created_at, c.updated_at,
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

export async function getCollection(userId, collectionId, { sort = 'added_at', order = 'desc' } = {}) {
  const collection = await findOwnedCollection(userId, collectionId);
  const sortColumn = SORT_COLUMNS[sort] ?? SORT_COLUMNS.added_at;
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const nulls = sort === 'release_year' ? ' NULLS LAST' : '';

  const { rows: albumRows } = await pool.query(
    `SELECT a.*, ca.added_at
     FROM albums a
     JOIN collection_albums ca ON ca.album_id = a.id
     WHERE ca.collection_id = $1
     ORDER BY ${sortColumn} ${direction}${nulls}, lower(a.title) ASC`,
    [collectionId],
  );

  return {
    ...toCollection({
      ...collection,
      album_count: albumRows.length,
      cover_artworks: albumRows.map((album) => album.artwork_url).filter(Boolean),
    }),
    albums: albumRows.map(toAlbum),
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

export async function updateCollection(userId, collectionId, { name, description }) {
  try {
    const { rows } = await pool.query(
      `UPDATE collections
       SET name = COALESCE($3, name),
           description = COALESCE($4, description)
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [collectionId, userId, name ?? null, description ?? null],
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
