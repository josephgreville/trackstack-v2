import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../src/app.js';
import request from 'supertest';
import { closePool } from '../src/db/pool.js';

let authCookie;

beforeEach(async () => {
  await request(app).post('/auth/register').send({ username: 'albumuser', email: 'album@test.com', password: 'password123' });

  const loginRes = await request(app).post('/auth/login').send({ email: 'album@test.com', password: 'password123' });
  authCookie = loginRes.headers['set-cookie']?.[0];
});

afterEach(() => {
  closePool();
});

describe('Albums API', () => {
  it('should search albums via iTunes API', async () => {
    const response = await request(app)
      .get('/catalog/search?q=Radiohead')
      .set('Cookie', [authCookie ?? '']);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.results)).toBe(true);
    if (response.body.results.length > 0) {
      expect(response.body.results[0]).toHaveProperty('title');
      expect(response.body.results[0]).toHaveProperty('artist');
    }
  });

  it('should handle empty search', async () => {
    const response = await request(app)
      .get('/catalog/search')
      .set('Cookie', [authCookie ?? '']);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('should get album detail by external ID', async () => {
    const response = await request(app)
      .get('/catalog/albums/594061854') // Rumours
      .set('Cookie', [authCookie ?? '']);

    expect(response.status).toBe(200);
    expect(response.body.album).toHaveProperty('title');
    expect(response.body.album.title).toBe('Rumours');
  });

  it('should get featured albums', async () => {
    const response = await request(app)
      .get('/catalog/featured')
      .set('Cookie', [authCookie ?? '']);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.albums)).toBe(true);
  });
});