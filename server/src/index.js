import env from './config/env.js';
import { createApp } from './app.js';
import { closePool, pool } from './db/pool.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`TrackStack API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down…`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Fail fast if the database is unreachable instead of accepting requests
// that will all return 500s.
pool.query('SELECT 1').catch((error) => {
  console.error('Could not connect to PostgreSQL.', error);
  process.exit(1);
});
