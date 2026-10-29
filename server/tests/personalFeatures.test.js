import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetTestDatabase } from './helpers.js';

const app = createApp();
const api = '/api/v1';

beforeEach(resetTestDatabase);

async function account(name, email) {
  const agent = request.agent(app);
  const response = await agent.post(`${api}/auth/register`).send({ username: name, email, password: 'secure-password' });
  expect(response.status).toBe(201);
  return agent;
}

describe('collection and personal features', () => {
  it('saves copy details, filters a collection, imports and exports CSV, and returns stats', async () => {
    const agent = await account('collector', 'collector@example.com');
    const { body: { collection } } = await agent.post(`${api}/collections`).send({ name: 'Shelf' });
    const album = await agent.post(`${api}/collections/${collection.id}/albums`).send({
      manual: { title: 'Blue', artist: 'Joni Mitchell', releaseYear: 1971, genre: 'Folk' },
    });
    expect(album.status).toBe(201);
    const details = await agent.patch(`${api}/collections/${collection.id}/albums/${album.body.album.id}`).send({
      format: 'vinyl', condition: 'very_good', purchaseDate: '2024-03-10', price: 25.5, editionNotes: 'Original pressing',
    });
    expect(details.status).toBe(200);

    const imported = await agent.post(`${api}/collections/${collection.id}/import`).send({ albums: [
      { title: 'Blue', artist: 'Joni Mitchell', releaseYear: 1971 },
      { title: 'Hejira', artist: 'Joni Mitchell', releaseYear: 1976, genre: 'Jazz', format: 'cd' },
    ] });
    expect(imported.status).toBe(201);
    expect(imported.body).toEqual({ imported: 1, skipped: 1 });
    const filtered = await agent.get(`${api}/collections/${collection.id}`).query({ q: 'Hejira', sort: 'title', order: 'asc' });
    expect(filtered.body.collection.albums).toHaveLength(1);
    const stats = await agent.get(`${api}/collections/${collection.id}/stats`);
    expect(stats.body.stats).toMatchObject({ total: 2, byFormat: { vinyl: 1, cd: 1 }, byGenre: { Folk: 1, Jazz: 1 } });
    const exported = await agent.get(`${api}/collections/${collection.id}/export`);
    expect(exported.status).toBe(200);
    expect(exported.text).toContain('editionNotes');
    expect(exported.text).toContain('Original pressing');
  });

  it('isolates wantlists and listening history by user and saves edition notes and reviews', async () => {
    const first = await account('first-user', 'first@example.com');
    const second = await account('second-user', 'second@example.com');
    const added = await first.post(`${api}/me/wantlist`).send({ externalId: '594061854', preferredEdition: 'Blue vinyl', notes: 'Check local shops' });
    expect(added.status).toBe(201);
    const list = await first.get(`${api}/me/wantlist`);
    expect(list.body.items[0]).toMatchObject({ preferredEdition: 'Blue vinyl', notes: 'Check local shops' });
    expect((await second.get(`${api}/me/wantlist`)).body.items).toEqual([]);
    expect((await first.patch(`${api}/me/wantlist/${added.body.album.id}`).send({ notes: 'Found a copy' })).status).toBe(200);
    expect((await first.get(`${api}/me/wantlist`)).body.items[0].notes).toBe('Found a copy');
    expect((await first.post(`${api}/me/wantlist`).send({ externalId: '594061854' })).status).toBe(409);

    const logged = await first.post(`${api}/me/history`).send({ externalId: '594061854' });
    expect(logged.status).toBe(201);
    expect((await first.get(`${api}/me/history`)).body.history).toHaveLength(1);
    expect((await second.get(`${api}/me/history`)).body.history).toEqual([]);
    const historyId = (await first.get(`${api}/me/history`)).body.history[0].historyId;
    expect((await first.patch(`${api}/me/history/${historyId}`).send({ rating: 5, review: 'A favorite.' })).status).toBe(200);
    expect((await first.get(`${api}/me/history`)).body.history[0]).toMatchObject({ rating: 5, review: 'A favorite.' });
  });

  it('saves album memories, moves found wantlist albums into a collection, and builds a listening queue', async () => {
    const agent = await account('music-journaler', 'journaler@example.com');
    const { body: { collection } } = await agent.post(`${api}/collections`).send({ name: 'Albums with a story', description: 'Records from memorable trips.' });
    const saved = await agent.post(`${api}/collections/${collection.id}/albums`).send({
      manual: { title: 'After the Gold Rush', artist: 'Neil Young', releaseYear: 1970, genre: 'Folk' },
    });
    expect(saved.status).toBe(201);
    const memory = await agent.patch(`${api}/collections/${collection.id}/albums/${saved.body.album.id}`).send({
      memoryLocation: 'A little shop in York', memoryWith: 'My brother', memoryNote: 'First record we bought together.',
    });
    expect(memory.status).toBe(200);
    const shelf = await agent.get(`${api}/collections/${collection.id}`);
    expect(shelf.body.collection.albums[0]).toMatchObject({
      memoryLocation: 'A little shop in York', memoryWith: 'My brother', memoryNote: 'First record we bought together.',
    });

    const wanted = await agent.post(`${api}/me/wantlist`).send({ externalId: '594061854', maxPrice: 30 });
    expect(wanted.status).toBe(201);
    expect((await agent.get(`${api}/me/wantlist`)).body.items[0].maxPrice).toBe(30);
    const acquired = await agent.post(`${api}/me/wantlist/${wanted.body.album.id}/acquire`).send({
      collectionId: collection.id, format: 'vinyl', purchaseDate: '2026-10-01', price: 24.5,
    });
    expect(acquired.status).toBe(201);
    expect((await agent.get(`${api}/me/wantlist`)).body.items).toEqual([]);
    expect((await agent.get(`${api}/collections/${collection.id}`)).body.collection.albums)
      .toEqual(expect.arrayContaining([expect.objectContaining({ id: wanted.body.album.id, format: 'vinyl', price: 24.5 })]));

    const built = await agent.post(`${api}/me/queue/build`).send({ genre: 'Folk' });
    expect(built.status).toBe(200);
    expect(built.body.queue.map((item) => item.id)).toContain(saved.body.album.id);
    const queueItem = built.body.queue.find((item) => item.id === saved.body.album.id);
    const listened = await agent.post(`${api}/me/queue/${queueItem.queueId}/listen`);
    expect(listened.status).toBe(200);
    const insights = await agent.get(`${api}/me/history/insights`);
    expect(insights.body.insights).toMatchObject({ totalListens: 1, unplayedCount: 1 });
    expect(insights.body.insights.topArtists[0].artist).toBe('Neil Young');
  });

  it('applies artist and year refinements to catalogue search', async () => {
    const agent = await account('searcher', 'searcher@example.com');
    const match = await agent.get(`${api}/catalog/search`).query({ q: 'Test Album', artist: 'Test Artist', yearFrom: 2000, yearTo: 2002, sort: 'title' });
    expect(match.status).toBe(200);
    expect(match.body.results).toHaveLength(1);
    const noArtist = await agent.get(`${api}/catalog/search`).query({ q: 'Test Album', artist: 'Different Artist' });
    expect(noArtist.body.results).toEqual([]);
    const noYear = await agent.get(`${api}/catalog/search`).query({ q: 'Test Album', yearFrom: 2002 });
    expect(noYear.body.results).toEqual([]);
  });

  it('supports unlisted collection links and opt-in public profiles without exposing private collections', async () => {
    const owner = await account('profile-owner', 'owner@example.com');
    const viewer = await account('profile-viewer', 'viewer@example.com');
    const privateCollection = (await owner.post(`${api}/collections`).send({ name: 'Private' })).body.collection;
    const shared = (await owner.post(`${api}/collections`).send({ name: 'Public shelf' })).body.collection;
    await owner.patch(`${api}/collections/${shared.id}`).send({ isPublic: true });
    expect((await request(app).get(`${api}/public/share/${privateCollection.shareToken}`)).status).toBe(401);
    const share = await viewer.get(`${api}/public/share/${privateCollection.shareToken}`);
    expect(share.status).toBe(200);
    expect(share.body.collection.name).toBe('Private');
    expect((await viewer.get(`${api}/public/users/profile-owner`)).status).toBe(404);
    expect((await owner.patch(`${api}/auth/profile`).send({ profilePublic: true })).status).toBe(200);
    const profile = await viewer.get(`${api}/public/users/profile-owner`);
    expect(profile.status).toBe(200);
    expect(profile.body.profile.collections.map(({ name }) => name)).toEqual(['Public shelf']);
    expect(profile.body.profile.collections[0]).not.toHaveProperty('email');
  });
});
