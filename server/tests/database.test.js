import { beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/db/pool.js';
import { withTransaction } from '../src/db/transaction.js';
import { resetTestDatabase } from './helpers.js';

beforeEach(resetTestDatabase);

async function createUser(username, email) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [username, email, 'test-hash'],
  );
  return rows[0].id;
}

async function createAlbum(title = 'Test Album') {
  const { rows } = await pool.query(
    `INSERT INTO albums (title, artist, source)
     VALUES ($1, 'Test Artist', 'manual')
     RETURNING id`,
    [title],
  );
  return rows[0].id;
}

describe('Database constraints and relationships', () => {
  it('generates unique primary keys and rejects null required fields', async () => {
    const userId = await createUser('Listener', 'listener@example.com');
    const anotherUserId = await createUser('Another', 'another@example.com');
    expect(userId).not.toBe(anotherUserId);

    await expect(pool.query(
      'INSERT INTO collections (user_id, name) VALUES ($1, NULL)',
      [userId],
    )).rejects.toMatchObject({ code: '23502' });
    await expect(pool.query(
      'INSERT INTO albums (title, artist) VALUES (NULL, $1)',
      ['Test Artist'],
    )).rejects.toMatchObject({ code: '23502' });
  });

  it('enforces unique case-insensitive email and username values', async () => {
    await createUser('Listener', 'listener@example.com');

    await expect(createUser('Another', 'LISTENER@example.com')).rejects.toMatchObject({ code: '23505' });
    await expect(createUser('listener', 'another@example.com')).rejects.toMatchObject({ code: '23505' });
    const { rows } = await pool.query('SELECT count(*)::int AS users FROM users');
    expect(rows[0].users).toBe(1);
  });

  it('keeps albums reusable across collections and prevents duplicate collection links', async () => {
    const userId = await createUser('Listener', 'listener@example.com');
    const albumId = await createAlbum();
    const collectionRows = await pool.query(
      `INSERT INTO collections (user_id, name)
       VALUES ($1, 'First'), ($1, 'Second')
       RETURNING id`,
      [userId],
    );
    const [first, second] = collectionRows.rows;

    await pool.query(
      'INSERT INTO collection_albums (collection_id, album_id) VALUES ($1, $2), ($3, $2)',
      [first.id, albumId, second.id],
    );
    await expect(pool.query(
      'INSERT INTO collection_albums (collection_id, album_id) VALUES ($1, $2)',
      [first.id, albumId],
    )).rejects.toMatchObject({ code: '23505' });

    const { rows } = await pool.query(
      'SELECT count(*)::int AS associations FROM collection_albums WHERE album_id = $1',
      [albumId],
    );
    expect(rows[0].associations).toBe(2);
  });

  it('rejects invalid foreign keys and out-of-range album metadata', async () => {
    const albumId = await createAlbum();
    await expect(pool.query(
      'INSERT INTO collection_albums (collection_id, album_id) VALUES ($1, $2)',
      ['00000000-0000-4000-8000-000000000001', albumId],
    )).rejects.toMatchObject({ code: '23503' });

    await expect(pool.query(
      `INSERT INTO albums (title, artist, release_year, source)
       VALUES ('Invalid year', 'Test Artist', 999, 'manual')`,
    )).rejects.toMatchObject({ code: '23514' });
  });

  it('cascades collection deletion to association rows but preserves reusable albums', async () => {
    const userId = await createUser('Listener', 'listener@example.com');
    const albumId = await createAlbum();
    const { rows } = await pool.query(
      'INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING id',
      [userId, 'Collection'],
    );
    await pool.query(
      'INSERT INTO collection_albums (collection_id, album_id) VALUES ($1, $2)',
      [rows[0].id, albumId],
    );

    await pool.query('DELETE FROM collections WHERE id = $1', [rows[0].id]);
    const associations = await pool.query('SELECT collection_id FROM collection_albums');
    const albums = await pool.query('SELECT id FROM albums WHERE id = $1', [albumId]);
    expect(associations.rowCount).toBe(0);
    expect(albums.rowCount).toBe(1);
  });

  it('cascades album deletion to collection associations', async () => {
    const userId = await createUser('Listener', 'listener@example.com');
    const albumId = await createAlbum();
    const { rows } = await pool.query(
      'INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING id',
      [userId, 'Collection'],
    );
    await pool.query(
      'INSERT INTO collection_albums (collection_id, album_id) VALUES ($1, $2)',
      [rows[0].id, albumId],
    );

    await pool.query('DELETE FROM albums WHERE id = $1', [albumId]);
    const associations = await pool.query('SELECT album_id FROM collection_albums');
    expect(associations.rowCount).toBe(0);
  });

  it('keeps committed data visible through a separate database connection', async () => {
    const userId = await createUser('Listener', 'listener@example.com');
    const { rows } = await pool.query(
      'INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING id',
      [userId, 'Persistent collection'],
    );

    const client = await pool.connect();
    try {
      const persisted = await client.query('SELECT name FROM collections WHERE id = $1', [rows[0].id]);
      expect(persisted.rows[0].name).toBe('Persistent collection');
    } finally {
      client.release();
    }
  });

  it('retrieves a large collection with correct counts', async () => {
    const userId = await createUser('Listener', 'listener@example.com');
    const { rows: collections } = await pool.query(
      'INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING id',
      [userId, 'Large collection'],
    );
    await pool.query(
      `INSERT INTO albums (title, artist, source)
       SELECT 'Large album ' || n, 'Test Artist', 'manual'
       FROM generate_series(1, 250) AS n`,
    );
    await pool.query(
      `INSERT INTO collection_albums (collection_id, album_id)
       SELECT $1, id FROM albums`,
      [collections[0].id],
    );

    const { getCollection } = await import('../src/services/collectionsService.js');
    const collection = await getCollection(userId, collections[0].id);
    expect(collection.albumCount).toBe(250);
    expect(collection.albums).toHaveLength(250);
  });

  it('rolls back all writes when a transaction fails', async () => {
    const userId = await createUser('Listener', 'listener@example.com');

    await expect(withTransaction(async (client) => {
      await client.query('INSERT INTO collections (user_id, name) VALUES ($1, $2)', [userId, 'Temporary']);
      throw new Error('force rollback');
    })).rejects.toThrow('force rollback');

    const { rowCount } = await pool.query('SELECT id FROM collections');
    expect(rowCount).toBe(0);
  });

  it('creates indexes for user collection lookups and album relationship queries', async () => {
    const { rows } = await pool.query(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = current_schema()
         AND tablename IN ('collections', 'albums', 'collection_albums')`,
    );
    const indexes = new Set(rows.map(({ indexname }) => indexname));

    for (const index of [
      'collections_pkey',
      'collections_user_id_idx',
      'collections_updated_at_idx',
      'albums_pkey',
      'albums_external_id_key',
      'albums_title_lower_idx',
      'albums_artist_lower_idx',
      'collection_albums_pkey',
      'collection_albums_album_id_idx',
      'collection_albums_added_at_idx',
    ]) {
      expect(indexes).toContain(index);
    }
  });
});
