import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');

// Support running from the repository root or from the server workspace.
dotenv.config({ path: path.join(ROOT, '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberFromEnv(name, fallback) {
  const parsed = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number.`);
  return parsed;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const sessionSecret = required(
  'SESSION_SECRET',
  nodeEnv === 'production' ? undefined : 'trackstack-local-development-secret',
);

if (nodeEnv === 'production' && sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters in production.');
}

const clientOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: numberFromEnv('PORT', 4000),
  databaseUrl:
    nodeEnv === 'test'
      ? required(
          'TEST_DATABASE_URL',
          process.env.DATABASE_URL ??
            'postgres://trackstack:trackstack_dev_password@localhost:5432/trackstack_test',
        )
      : required(
          'DATABASE_URL',
          'postgres://trackstack:trackstack_dev_password@localhost:5432/trackstack',
        ),
  sessionSecret,
  sessionMaxAgeMs: numberFromEnv('SESSION_MAX_AGE_DAYS', 14) * 24 * 60 * 60 * 1000,
  cookieSecure: process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production',
  trustProxy: process.env.TRUST_PROXY === 'true',
  clientOrigins,
  itunes: {
    baseUrl: process.env.ITUNES_BASE_URL ?? 'https://itunes.apple.com',
    country: process.env.ITUNES_COUNTRY ?? 'GB',
    timeoutMs: numberFromEnv('ITUNES_TIMEOUT_MS', 8000),
    cacheTtlMs: numberFromEnv('ITUNES_CACHE_TTL_MS', 5 * 60 * 1000),
  },
};

export default env;
