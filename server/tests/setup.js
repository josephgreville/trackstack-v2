import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { beforeAll, vi } from 'vitest';
import { mockItunesFetch } from './helpers.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(HERE, '..', '..', '.env') });

process.env.NODE_ENV = 'test';
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error('TEST_DATABASE_URL is required to run the server tests.');
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
if (!/^[a-zA-Z0-9_]+_test$/.test(databaseName)) {
  throw new Error('Server tests require a dedicated database whose name ends with _test.');
}

const { runMigrations } = await import('../src/db/migrate.js');
vi.stubGlobal('fetch', mockItunesFetch);

beforeAll(async () => {
  await runMigrations({ silent: true });
});
