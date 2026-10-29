import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import env from '../config/env.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';

const BCRYPT_ROUNDS = env.isTest ? 4 : 12;

// Comparing against a real hash when the account is missing keeps the
// response time broadly consistent and avoids leaking which emails exist.
const DUMMY_HASH = '$2b$10$8QY7LQ8hWf6m4fWQjM6Yl.6W5r8Yh0m2R9n9J0v8n1y6fQ8x7m5tK';

export function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function registerUser({ username, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const { rows: existing } = await pool.query(
    'SELECT email, username FROM users WHERE lower(email) = lower($1) OR lower(username) = lower($2)',
    [email, username],
  );

  if (existing[0]) {
    const emailTaken = existing[0].email.toLowerCase() === email.toLowerCase();
    throw new ConflictError(
      emailTaken ? 'An account with that email already exists.' : 'That username is already taken.',
      { field: emailTaken ? 'email' : 'username' },
    );
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash],
    );
    return toPublicUser(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('An account with those details already exists.');
    }
    throw error;
  }
}

export async function authenticateUser({ email, password }) {
  const { rows } = await pool.query(
    'SELECT id, username, email, password_hash, created_at FROM users WHERE lower(email) = lower($1)',
    [email],
  );

  const user = rows[0];
  const hash = user?.password_hash ?? DUMMY_HASH;
  const matches = await bcrypt.compare(password, hash);

  if (!user || !matches) {
    throw new UnauthorizedError('Email or password is incorrect.');
  }

  return toPublicUser(user);
}

export async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [id],
  );
  return rows[0] ? toPublicUser(rows[0]) : null;
}
