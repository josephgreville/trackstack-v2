import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { resetTestDatabase } from './helpers.js';

const app = createApp();
const api = '/api/v1';

beforeEach(resetTestDatabase);

async function authenticatedAgent() {
  const agent = request.agent(app);
  const response = await agent.post(`${api}/auth/register`).send({
    username: 'catalog-user',
    email: 'catalog@example.com',
    password: 'secure-password',
  });
  expect(response.status).toBe(201);
  return agent;
}

describe('Catalogue API', () => {
  it('searches with validated query parameters and returns normalized album metadata', async () => {
    const response = await request(app).get(`${api}/catalog/search`).query({ q: 'Rumours' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      query: 'Rumours',
      page: 1,
      results: [{
        externalId: '594061854',
        title: 'Test Album 594061854',
        artist: 'Test Artist',
        releaseYear: 2001,
        genre: 'Rock',
        artworkUrl: 'https://example.test/594061854/600x600bb.jpg',
      }],
    });
  });

  it('rejects empty or oversized search terms and accepts safe SQL-like input', async () => {
    const empty = await request(app).get(`${api}/catalog/search`);
    expect(empty.status).toBe(400);

    const tooLong = await request(app).get(`${api}/catalog/search`).query({ q: 'x'.repeat(121) });
    expect(tooLong.status).toBe(400);

    const injection = await request(app)
      .get(`${api}/catalog/search`)
      .query({ q: "'; DROP TABLE users; --" });
    expect(injection.status).toBe(200);
    const { rows } = await pool.query('SELECT count(*)::int AS users FROM users');
    expect(rows[0].users).toBe(0);
  });

  it('returns featured albums and album details with tracks', async () => {
    const featured = await request(app).get(`${api}/catalog/featured`);
    expect(featured.status).toBe(200);
    expect(featured.body.albums.length).toBeGreaterThan(0);

    const detail = await request(app).get(`${api}/catalog/albums/594061854`);
    expect(detail.status).toBe(200);
    expect(detail.body.album.title).toBe('Test Album 594061854');
    expect(detail.body.album.tracks[0]).toMatchObject({
      title: 'First Track',
      trackNumber: 1,
      durationMs: 180000,
    });
  });

  it('rejects malformed catalogue identifiers and surfaces upstream outages', async () => {
    expect((await request(app).get(`${api}/catalog/albums/not-an-id`)).status).toBe(400);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const response = await request(app).get(`${api}/catalog/search`).query({ q: 'unavailable' });
    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('UPSTREAM_UNAVAILABLE');
  });
});

describe('Saved albums API', () => {
  it('protects recent and saved albums and returns albums from the user’s collections', async () => {
    expect((await request(app).get(`${api}/albums/recent`)).status).toBe(401);
    const agent = await authenticatedAgent();
    const collection = await agent.post(`${api}/collections`).send({ name: 'Manual records' });
    const created = await agent.post(`${api}/collections/${collection.body.collection.id}/albums`).send({
      manual: { title: 'Blue', artist: 'Joni Mitchell', releaseYear: 1971 },
    });
    expect(created.status).toBe(201);

    const recent = await agent.get(`${api}/albums/recent`);
    expect(recent.status).toBe(200);
    expect(recent.body.albums[0]).toMatchObject({ title: 'Blue', artist: 'Joni Mitchell' });

    const detail = await agent.get(`${api}/albums/${created.body.album.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.album).toMatchObject({ title: 'Blue', tracks: [] });
    expect(detail.body.catalogueAvailable).toBe(false);
  });

  it('validates saved album identifiers and returns not-found for missing records', async () => {
    const agent = await authenticatedAgent();
    expect((await agent.get(`${api}/albums/not-a-uuid`)).status).toBe(400);
    expect((await agent.get(`${api}/albums/00000000-0000-4000-8000-000000000001`)).status).toBe(404);
  });
});
