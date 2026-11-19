import { randomBytes } from 'node:crypto';
import env from '../config/env.js';
import { pool } from '../db/pool.js';
import { toPublicUser } from './authService.js';
import { AppError, ConflictError, UnauthorizedError } from '../utils/errors.js';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const UPSTREAM_TIMEOUT_MS = 8000;

export function isGoogleConfigured() {
  return Boolean(env.google.clientId && env.google.clientSecret);
}

export function buildGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function fetchJson(url, options) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    throw new AppError(502, 'OAUTH_UPSTREAM_ERROR', 'Google sign-in is unavailable right now.');
  }

  if (!response.ok) {
    throw new AppError(502, 'OAUTH_UPSTREAM_ERROR', 'Google sign-in is unavailable right now.');
  }

  try {
    return await response.json();
  } catch {
    throw new AppError(502, 'OAUTH_UPSTREAM_ERROR', 'Google sign-in is unavailable right now.');
  }
}

export async function exchangeGoogleCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: env.google.clientId,
    client_secret: env.google.clientSecret,
    redirect_uri: env.google.redirectUri,
    grant_type: 'authorization_code',
  });
  const payload = await fetchJson(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (typeof payload.access_token !== 'string' || !payload.access_token) {
    throw new AppError(502, 'OAUTH_UPSTREAM_ERROR', 'Google sign-in is unavailable right now.');
  }
  return payload.access_token;
}

export async function fetchGoogleProfile(accessToken) {
  const payload = await fetchJson(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const verified = payload.email_verified === true || payload.email_verified === 'true';
  if (!payload.sub || typeof payload.email !== 'string' || !verified) {
    throw new UnauthorizedError('Your Google account needs a verified email address to sign in.');
  }

  return {
    providerId: String(payload.sub),
    email: payload.email.trim().toLowerCase(),
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
  };
}

function usernameBase(profile) {
  const source = profile.name || profile.email.split('@')[0] || 'collector';
  const cleaned = source
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 34);
  return cleaned.length >= 2 ? cleaned : 'collector';
}

function uniqueCandidate(base) {
  return `${base.slice(0, 27)}-${randomBytes(4).toString('hex')}`;
}

async function createGoogleUser(client, profile) {
  const base = usernameBase(profile);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const username = attempt === 0 ? base : uniqueCandidate(base);
    try {
      const { rows } = await client.query(
        `INSERT INTO users
           (username, email, password_hash, auth_provider, provider_id, email_verified)
         VALUES ($1, $2, NULL, 'google', $3, true)
         RETURNING id, username, email, created_at, profile_public`,
        [username, profile.email, profile.providerId],
      );
      return toPublicUser(rows[0]);
    } catch (error) {
      if (error.code === '23505' && /username/i.test(error.constraint ?? '')) continue;
      throw error;
    }
  }

  throw new ConflictError('Could not create a unique username. Please try again.');
}

export async function findOrCreateGoogleUser(profile) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: byProvider } = await client.query(
      `SELECT id, username, email, created_at, profile_public, provider_id
       FROM users
       WHERE auth_provider = 'google' AND provider_id = $1`,
      [profile.providerId],
    );
    if (byProvider[0]) {
      await client.query('COMMIT');
      return toPublicUser(byProvider[0]);
    }

    const { rows: byEmail } = await client.query(
      `SELECT id, username, email, created_at, profile_public, auth_provider, provider_id
       FROM users
       WHERE lower(email) = lower($1)`,
      [profile.email],
    );

    if (byEmail[0]) {
      if (byEmail[0].auth_provider === 'google' && byEmail[0].provider_id) {
        await client.query('ROLLBACK');
        throw new ConflictError('That Google account is already linked to a different user.');
      }

      const { rows } = await client.query(
        `UPDATE users
         SET auth_provider = 'google', provider_id = $2, email_verified = true, updated_at = now()
         WHERE id = $1
         RETURNING id, username, email, created_at, profile_public`,
        [byEmail[0].id, profile.providerId],
      );
      await client.query('COMMIT');
      return toPublicUser(rows[0]);
    }

    const created = await createGoogleUser(client, profile);
    await client.query('COMMIT');
    return created;
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { /* transaction already ended */ }
    }
    throw error;
  }
}
