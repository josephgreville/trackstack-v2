import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import env from '../src/config/env.js';
import { resetTestDatabase } from './helpers.js';

const app = createApp();
const api = '/api/v1';

beforeEach(resetTestDatabase);

describe('Security boundaries', () => {
  it('rejects forged session cookies on protected endpoints', async () => {
    const response = await request(app)
      .get(`${api}/collections`)
      .set('Cookie', 'ts.sid=forged.invalid.signature');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects cross-origin collection writes before database changes', async () => {
    const agent = request.agent(app);
    await agent.post(`${api}/auth/register`).send({
      username: 'security-user',
      email: 'security@example.com',
      password: 'secure-password',
    });

    const response = await agent
      .post(`${api}/collections`)
      .set('Origin', 'https://attacker.example')
      .send({ name: 'Blocked collection' });

    expect(response.status).toBe(403);
    const { rowCount } = await pool.query('SELECT id FROM collections');
    expect(rowCount).toBe(0);
  });

  it('stores SQL-like text as data and does not expose user secrets', async () => {
    const agent = request.agent(app);
    const registration = await agent.post(`${api}/auth/register`).send({
      username: 'security-user',
      email: 'security@example.com',
      password: 'secure-password',
    });
    expect(registration.body.user).not.toHaveProperty('password_hash');

    const name = "Records'; DROP TABLE users; --";
    const collection = await agent.post(`${api}/collections`).send({ name });
    expect(collection.status).toBe(201);
    expect(collection.body.collection.name).toBe(name);

    const { rowCount } = await pool.query('SELECT id FROM users');
    expect(rowCount).toBe(1);
    const current = await agent.get(`${api}/auth/me`);
    expect(current.body.user).not.toHaveProperty('password_hash');
  });

  it('returns safe not-found responses for unknown routes and unsupported methods', async () => {
    const unknown = await request(app).get(`${api}/unknown-endpoint`);
    const unsupported = await request(app).put(`${api}/auth/me`).send({});

    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('NOT_FOUND');
    expect(unsupported.status).toBe(404);
    expect(unsupported.body.error.code).toBe('NOT_FOUND');
    expect(JSON.stringify(unknown.body)).not.toContain('stack');
  });

  it('returns a generic error when a database query fails', async () => {
    const agent = request.agent(app);
    await agent.post(`${api}/auth/register`).send({
      username: 'database-user',
      email: 'database@example.com',
      password: 'secure-password',
    });

    const originalQuery = pool.query.bind(pool);
    const querySpy = vi.spyOn(pool, 'query').mockImplementation((query, ...values) => {
      if (typeof query === 'string' && query.includes('FROM collections c')) {
        return Promise.reject(new Error('database connection detail'));
      }
      return originalQuery(query, ...values);
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await agent.get(`${api}/collections`);
      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(response.body.error.message).toBe('Something went wrong on our side. Please try again.');
      expect(JSON.stringify(response.body)).not.toContain('database connection detail');
    } finally {
      querySpy.mockRestore();
      logSpy.mockRestore();
    }
  });

  it('rate-limits repeated authentication requests outside test mode', async () => {
    env.isTest = false;
    try {
      const responses = await Promise.all(
        Array.from({ length: 41 }, () => request(app).post(`${api}/auth/login`).send({})),
      );
      const limited = responses.filter(({ status }) => status === 429);
      expect(limited).toHaveLength(1);
      expect(limited[0].body.error.code).toBe('RATE_LIMITED');
    } finally {
      env.isTest = true;
    }
  });
});
