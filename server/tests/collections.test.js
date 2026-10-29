import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { resetTestDatabase } from './helpers.js';

const app = createApp();
const api = '/api/v1';

beforeEach(resetTestDatabase);

async function registerAndLogin(username, email) {
  const agent = request.agent(app);
  const registration = await agent.post(`${api}/auth/register`).send({
    username,
    email,
    password: 'secure-password',
  });
  expect(registration.status).toBe(201);
  return agent;
}

async function createCollection(agent, name = 'Favourite records') {
  const response = await agent.post(`${api}/collections`).send({ name });
  expect(response.status).toBe(201);
  return response.body.collection;
}

describe('Collections API', () => {
  it('requires authentication and scopes collection listings to the signed-in user', async () => {
    expect((await request(app).get(`${api}/collections`)).status).toBe(401);

    const first = await registerAndLogin('first-listener', 'first@example.com');
    const second = await registerAndLogin('second-listener', 'second@example.com');
    const collection = await createCollection(first, 'Private records');
    await createCollection(second, 'Other records');

    const response = await first.get(`${api}/collections`);
    expect(response.status).toBe(200);
    expect(response.body.collections).toHaveLength(1);
    expect(response.body.collections[0]).toMatchObject({
      id: collection.id,
      name: 'Private records',
      albumCount: 0,
    });
    expect((await second.get(`${api}/collections`)).body.collections[0].name).toBe('Other records');
  });

  it('validates names and enforces per-user name uniqueness', async () => {
    const agent = await registerAndLogin('owner', 'owner@example.com');
    await createCollection(agent, 'Mix');

    const blank = await agent.post(`${api}/collections`).send({ name: '   ' });
    expect(blank.status).toBe(400);
    expect(blank.body.error.code).toBe('VALIDATION_ERROR');
    const tooLong = await agent.post(`${api}/collections`).send({ name: 'n'.repeat(81) });
    expect(tooLong.status).toBe(400);
    const longDescription = await agent.post(`${api}/collections`).send({
      name: 'Description too long',
      description: 'd'.repeat(501),
    });
    expect(longDescription.status).toBe(400);

    const duplicate = await agent.post(`${api}/collections`).send({ name: 'mix' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('CONFLICT');
    expect((await agent.get(`${api}/collections`)).body.collections).toHaveLength(1);
  });

  it('returns details and supports collection updates', async () => {
    const agent = await registerAndLogin('owner', 'owner@example.com');
    const collection = await createCollection(agent, 'First name');

    const updated = await agent.patch(`${api}/collections/${collection.id}`).send({
      name: 'Updated name',
      description: 'Updated description',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.collection).toMatchObject({
      id: collection.id,
      name: 'Updated name',
      description: 'Updated description',
    });

    const detail = await agent.get(`${api}/collections/${collection.id}?sort=title&order=asc`);
    expect(detail.status).toBe(200);
    expect(detail.body.collection).toMatchObject({
      name: 'Updated name',
      description: 'Updated description',
      albumCount: 0,
      albums: [],
    });

    expect((await agent.patch(`${api}/collections/${collection.id}`).send({})).status).toBe(400);
    expect((await agent.get(`${api}/collections/not-a-uuid`)).status).toBe(400);
  });

  it('supports optional descriptions and sorts collection albums by title, artist, and year', async () => {
    const agent = await registerAndLogin('owner', 'owner@example.com');
    const collection = await createCollection(agent, 'Sorted records');
    const records = [
      { title: 'Zulu', artist: 'Bee', releaseYear: 2000 },
      { title: 'Alpha', artist: 'Zed' },
      { title: 'Mike', artist: 'Alex', releaseYear: 1980 },
    ];

    for (const manual of records) {
      expect((await agent.post(`${api}/collections/${collection.id}/albums`).send({ manual })).status).toBe(201);
    }

    const titleSorted = await agent.get(`${api}/collections/${collection.id}`).query({ sort: 'title', order: 'asc' });
    expect(titleSorted.body.collection.albums.map(({ title }) => title)).toEqual(['Alpha', 'Mike', 'Zulu']);

    const artistSorted = await agent.get(`${api}/collections/${collection.id}`).query({ sort: 'artist', order: 'asc' });
    expect(artistSorted.body.collection.albums.map(({ title }) => title)).toEqual(['Mike', 'Zulu', 'Alpha']);

    const yearSorted = await agent.get(`${api}/collections/${collection.id}`).query({ sort: 'release_year', order: 'asc' });
    expect(yearSorted.body.collection.albums.map(({ title }) => title)).toEqual(['Mike', 'Zulu', 'Alpha']);
    expect((await agent.post(`${api}/collections`).send({ name: 'No description' })).body.collection.description).toBe('');
  });

  it('returns not-found when removing an album that is not associated with the collection', async () => {
    const agent = await registerAndLogin('owner', 'owner@example.com');
    const collection = await createCollection(agent);
    const response = await agent.delete(
      `${api}/collections/${collection.id}/albums/00000000-0000-4000-8000-000000000001`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('prevents another user from reading, editing, deleting, or modifying a collection', async () => {
    const owner = await registerAndLogin('owner', 'owner@example.com');
    const other = await registerAndLogin('other', 'other@example.com');
    const collection = await createCollection(owner, 'Owner only');

    expect((await other.get(`${api}/collections/${collection.id}`)).status).toBe(404);
    expect((await other.patch(`${api}/collections/${collection.id}`).send({ name: 'Stolen' })).status).toBe(404);
    expect((await other.delete(`${api}/collections/${collection.id}`)).status).toBe(404);
    expect((await other.post(`${api}/collections/${collection.id}/albums`).send({ externalId: '594061854' })).status).toBe(404);
    expect((await other.delete(`${api}/collections/${collection.id}/albums/00000000-0000-4000-8000-000000000001`)).status).toBe(404);
    expect((await owner.get(`${api}/collections/${collection.id}`)).body.collection.name).toBe('Owner only');
  });

  it('adds albums from the catalogue once and removes their association', async () => {
    const agent = await registerAndLogin('owner', 'owner@example.com');
    const collection = await createCollection(agent);

    const added = await agent.post(`${api}/collections/${collection.id}/albums`).send({
      externalId: '594061854',
    });
    expect(added.status).toBe(201);
    expect(added.body.album).toMatchObject({
      externalId: '594061854',
      title: 'Test Album 594061854',
      source: 'itunes',
    });

    const detail = await agent.get(`${api}/collections/${collection.id}`);
    expect(detail.body.collection.albumCount).toBe(1);
    expect(detail.body.collection.albums[0].title).toBe('Test Album 594061854');

    const duplicate = await agent.post(`${api}/collections/${collection.id}/albums`).send({
      externalId: '594061854',
    });
    expect(duplicate.status).toBe(409);

    expect((await agent.delete(`${api}/collections/${collection.id}/albums/${added.body.album.id}`)).status).toBe(204);
    expect((await agent.get(`${api}/collections/${collection.id}`)).body.collection.albums).toEqual([]);
  });

  it('validates manual albums and rejects duplicate associations without partial changes', async () => {
    const agent = await registerAndLogin('owner', 'owner@example.com');
    const collection = await createCollection(agent);

    const invalid = await agent.post(`${api}/collections/${collection.id}/albums`).send({
      manual: { title: 'Blue', artist: 'Joni Mitchell', releaseYear: 999 },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const manual = { title: 'Blue', artist: 'Joni Mitchell', releaseYear: 1971 };
    const first = await agent.post(`${api}/collections/${collection.id}/albums`).send({ manual });
    expect(first.status).toBe(201);
    expect(first.body.album.source).toBe('manual');
    const duplicate = await agent.post(`${api}/collections/${collection.id}/albums`).send({ manual });
    expect(duplicate.status).toBe(409);

    const { rows } = await pool.query(
      'SELECT count(*)::int AS albums FROM collection_albums WHERE collection_id = $1',
      [collection.id],
    );
    expect(rows[0].albums).toBe(1);
  });

  it('deletes collections and cascades their album associations', async () => {
    const agent = await registerAndLogin('owner', 'owner@example.com');
    const collection = await createCollection(agent);
    await agent.post(`${api}/collections/${collection.id}/albums`).send({
      externalId: '594061854',
    });

    expect((await agent.delete(`${api}/collections/${collection.id}`)).status).toBe(204);
    expect((await agent.get(`${api}/collections/${collection.id}`)).status).toBe(404);
    const { rows } = await pool.query('SELECT count(*)::int AS associations FROM collection_albums');
    expect(rows[0].associations).toBe(0);
  });
});
