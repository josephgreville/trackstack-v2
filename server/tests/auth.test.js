import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { resetTestDatabase } from './helpers.js';

const app = createApp();
const api = '/api/v1/auth';

beforeEach(resetTestDatabase);

describe('Authentication API', () => {
  it('registers users with a hashed password and an HttpOnly session cookie', async () => {
    const response = await request(app).post(`${api}/register`).send({
      username: 'test-listener',
      email: 'listener@example.com',
      password: 'secure-password',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      username: 'test-listener',
      email: 'listener@example.com',
    });
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('password_hash');

    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [
      'listener@example.com',
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].password_hash).not.toBe('secure-password');
    expect(await bcrypt.compare('secure-password', rows[0].password_hash)).toBe(true);
  });

  it('rejects duplicate email addresses case-insensitively without creating another account', async () => {
    await request(app).post(`${api}/register`).send({
      username: 'first-listener',
      email: 'listener@example.com',
      password: 'secure-password',
    });
    const response = await request(app).post(`${api}/register`).send({
      username: 'second-listener',
      email: 'LISTENER@example.com',
      password: 'secure-password',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
    const { rowCount } = await pool.query('SELECT id FROM users');
    expect(rowCount).toBe(1);
  });

  it.each([
    [{ username: 'x', email: 'bad-email', password: 'short' }, 'VALIDATION_ERROR'],
    [{ username: 'listener', email: 'listener@example.com', password: 'secure-password', role: 'admin' }, 'VALIDATION_ERROR'],
    [{ username: 'listener', password: 'secure-password' }, 'VALIDATION_ERROR'],
    [{ username: 'listener', email: 'listener@example.com' }, 'VALIDATION_ERROR'],
  ])('rejects invalid registration payloads %#', async (payload, code) => {
    const response = await request(app).post(`${api}/register`).send(payload);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe(code);
    const { rowCount } = await pool.query('SELECT id FROM users');
    expect(rowCount).toBe(0);
  });

  it('rejects malformed JSON without returning an internal error', async () => {
    const response = await request(app)
      .post(`${api}/register`)
      .set('Content-Type', 'application/json')
      .send('{"username":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('authenticates, reports the current user, and clears the session on logout', async () => {
    await request(app).post(`${api}/register`).send({
      username: 'test-listener',
      email: 'listener@example.com',
      password: 'secure-password',
    });

    const agent = request.agent(app);
    const login = await agent.post(`${api}/login`).send({
      email: 'LISTENER@example.com',
      password: 'secure-password',
    });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe('listener@example.com');

    const current = await agent.get(`${api}/me`);
    expect(current.status).toBe(200);
    expect(current.body.user).toMatchObject({
      username: 'test-listener',
      email: 'listener@example.com',
    });
    expect(current.body.user).not.toHaveProperty('password_hash');

    expect((await agent.post(`${api}/logout`)).status).toBe(204);
    expect((await agent.get(`${api}/me`)).body.user).toBeNull();
  });

  it('rejects incorrect credentials and missing authentication', async () => {
    await request(app).post(`${api}/register`).send({
      username: 'test-listener',
      email: 'listener@example.com',
      password: 'secure-password',
    });

    const invalidLogin = await request(app).post(`${api}/login`).send({
      email: 'listener@example.com',
      password: 'incorrect-password',
    });
    expect(invalidLogin.status).toBe(401);
    expect(invalidLogin.body.error.message).not.toContain('incorrect-password');

    const noSession = await request(app).get(`${api}/me`);
    expect(noSession.status).toBe(200);
    expect(noSession.body).toEqual({ user: null });
  });

  it('normalizes email whitespace and case and does not reveal whether an account exists', async () => {
    const registration = await request(app).post(`${api}/register`).send({
      username: 'normalized',
      email: '  Listener@Example.COM  ',
      password: 'secure-password',
    });
    expect(registration.status).toBe(201);
    expect(registration.body.user.email).toBe('listener@example.com');

    const wrongPassword = await request(app).post(`${api}/login`).send({
      email: 'listener@example.com',
      password: 'incorrect-password',
    });
    const unknownEmail = await request(app).post(`${api}/login`).send({
      email: 'unknown@example.com',
      password: 'incorrect-password',
    });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('prevents concurrent registrations from creating duplicate email accounts', async () => {
    const registrations = await Promise.all([
      request(app).post(`${api}/register`).send({
        username: 'first-listener',
        email: 'race@example.com',
        password: 'secure-password',
      }),
      request(app).post(`${api}/register`).send({
        username: 'second-listener',
        email: 'RACE@example.com',
        password: 'secure-password',
      }),
    ]);

    expect(registrations.map(({ status }) => status).sort()).toEqual([201, 409]);
    const { rowCount } = await pool.query('SELECT id FROM users WHERE lower(email) = $1', ['race@example.com']);
    expect(rowCount).toBe(1);
  });
});
