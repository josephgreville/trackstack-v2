import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const HERE = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(HERE, '..', '..', '.env') });

process.env.NODE_ENV = 'test';

const { Client } = pg;
const { default: env } = await import('../src/config/env.js');
const { runMigrations } = await import('../src/db/migrate.js');
const { pool, closePool } = await import('../src/db/pool.js');

async function ensureDatabase() {
  const url = new URL(env.databaseUrl);
  const databaseName = url.pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test') || !/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error('TEST_DATABASE_URL must point at a safe database name ending in _test.');
  }

  url.pathname = '/postgres';
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseName,
    ]);
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE ${databaseName}`);
      console.log(`Created test database ${databaseName}.`);
    }
  } finally {
    await client.end();
  }
}

try {
  await ensureDatabase();
  await runMigrations({ silent: true });
  await pool.query(
    'TRUNCATE users, collections, albums, collection_albums, sessions RESTART IDENTITY CASCADE',
  );
  console.log('Test database ready.');
} finally {
  await closePool();
}
