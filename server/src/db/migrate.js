import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pool, closePool } from './pool.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(HERE, '..', '..', 'migrations');
const MIGRATION_ALIASES = new Map([['001_initial.sql', '001_initial_schema.sql']]);

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'schema_migrations'`,
  );
  const columns = new Set(rows.map((row) => row.column_name));
  if (columns.has('version')) return 'version';
  if (columns.has('filename')) return 'filename';
  throw new Error('schema_migrations must contain a version or filename column.');
}

export async function runMigrations({ silent = false } = {}) {
  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const client = await pool.connect();

  try {
    const migrationColumn = await ensureMigrationTable(client);
    const { rows } = await client.query(
      `SELECT "${migrationColumn}" AS version FROM schema_migrations`,
    );
    const applied = new Set(rows.map((row) => row.version));

    for (const file of files) {
      if (applied.has(file) || applied.has(MIGRATION_ALIASES.get(file))) continue;

      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      if (!silent) console.log(`Applying ${file}…`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations ("${migrationColumn}") VALUES ($1)`,
          [file],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    if (!silent) console.log('Database is up to date.');
  } finally {
    client.release();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(closePool);
}
