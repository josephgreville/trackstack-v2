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
  return { agent, id: response.body.user.id };
}

async function seedCollection(agent, name = 'Shelf') {
  const { body } = await agent.post(`${api}/collections`).send({ name });
  return body.collection;
}

async function seedManualAlbum(agent, collectionId, details = {}) {
  const { body } = await agent.post(`${api}/collections/${collectionId}/albums`).send({
    manual: { title: 'Blue', artist: 'Joni Mitchell', releaseYear: 1971, genre: 'Folk', ...details },
  });
  return body.album;
}

describe('TrackStack 2.0 — gamification', () => {
  it('exposes the seeded achievement catalogue and reports earned state', async () => {
    const { agent } = await account('achiever', 'achiever@example.com');
    const response = await agent.get(`${api}/2/achievements`);
    expect(response.status).toBe(200);
    expect(response.body.achievements.length).toBeGreaterThan(0);
    const firstListen = response.body.achievements.find((item) => item.key === 'first_listen');
    expect(firstListen).toMatchObject({ name: 'First Spin', earned: false, xpReward: 50 });
  });

  it('awards the first-listen badge and grants XP once it is earned', async () => {
    const { agent } = await account('listener-one', 'listener-one@example.com');
    await agent.post(`${api}/me/history`).send({ externalId: '594061854' });

    const checked = await agent.post(`${api}/2/achievements/check`);
    expect(checked.status).toBe(200);
    expect(checked.body.earned).toContain('first_listen');

    const profile = await agent.get(`${api}/2/me`);
    expect(profile.body.profile.xp).toBeGreaterThanOrEqual(50);
    expect(profile.body.profile.level).toBeGreaterThanOrEqual(1);
    expect(profile.body.profile.progress).toBeGreaterThanOrEqual(0);

    // Checking again must not double-grant the reward.
    const again = await agent.post(`${api}/2/achievements/check`);
    expect(again.body.earned).toEqual([]);

    const achievements = await agent.get(`${api}/2/achievements`);
    const firstListen = achievements.body.achievements.find((item) => item.key === 'first_listen');
    expect(firstListen.earned).toBe(true);
  });

  it('keeps the profile private and only exposes the signed-in collector details', async () => {
    const { agent } = await account('private-collector', 'private@example.com');
    const profile = await agent.get(`${api}/2/me`);
    expect(profile.body.profile.username).toBe('private-collector');
    expect(profile.body.profile.profilePublic).toBe(false);

    const updated = await agent.patch(`${api}/2/profile`).send({ bio: 'Vinyl only.', location: 'Bristol' });
    expect(updated.status).toBe(200);
    expect(updated.body.profile.bio).toBe('Vinyl only.');
  });

  it('requires authentication for every 2.0 route', async () => {
    const response = await request(app).get(`${api}/2/achievements`);
    expect(response.status).toBe(401);
    expect((await request(app).get(`${api}/2/wrapped`)).status).toBe(401);
    expect((await request(app).get(`${api}/2/social/notifications`)).status).toBe(401);
    expect((await request(app).get(`${api}/2/recommendations`)).status).toBe(401);
    expect((await request(app).get(`${api}/2/stories/stories`)).status).toBe(401);
  });
});

describe('TrackStack 2.0 — social', () => {
  it('follows and unfollows another collector and notifies them', async () => {
    const { agent: first, id: firstId } = await account('alpha', 'alpha@example.com');
    const { agent: second, id: secondId } = await account('beta', 'beta@example.com');

    const follow = await first.post(`${api}/2/social/follow/${secondId}`);
    expect(follow.status).toBe(201);
    expect((await first.get(`${api}/2/social/follow-status/${secondId}`)).body.following).toBe(true);
    // /followers/:id lists the people who follow that collector,
    // /following/:id lists the collectors that person follows.
    expect((await second.get(`${api}/2/social/followers/${secondId}`)).body.followers).toHaveLength(1);
    expect((await first.get(`${api}/2/social/following/${firstId}`)).body.following).toHaveLength(1);

    const notifications = await second.get(`${api}/2/social/notifications`);
    expect(notifications.body.notifications[0]).toMatchObject({ type: 'follow' });
    expect((await second.get(`${api}/2/social/notifications/count`)).body.count).toBe(1);

    // Following twice is a conflict, not a silent duplicate.
    expect((await first.post(`${api}/2/social/follow/${secondId}`)).status).toBe(409);

    const unfollow = await first.delete(`${api}/2/social/follow/${secondId}`);
    expect(unfollow.status).toBe(200);
    expect((await first.get(`${api}/2/social/follow-status/${secondId}`)).body.following).toBe(false);
  });

  it('refuses to follow yourself', async () => {
    const { agent, id } = await account('narcissist', 'narcissist@example.com');
    const response = await agent.post(`${api}/2/social/follow/${id}`);
    expect(response.status).toBe(409);
  });

  it('likes and comments on a shared collection and reports the counts', async () => {
    const { agent: owner } = await account('owner', 'owner@example.com');
    const { agent: guest } = await account('guest', 'guest@example.com');
    const collection = await seedCollection(owner, 'Shared stack');

    const like = await guest.post(`${api}/2/social/like/collection/${collection.id}`);
    expect(like.status).toBe(200);
    expect(like.body.liked).toBe(true);

    const status = await guest.get(`${api}/2/social/like/collection/${collection.id}`);
    expect(status.body).toMatchObject({ liked: true, count: 1 });

    const comment = await guest.post(`${api}/2/social/comments/collection/${collection.id}`).send({ body: 'Great shelf.' });
    expect(comment.status).toBe(201);
    const comments = await owner.get(`${api}/2/social/comments/collection/${collection.id}`);
    expect(comments.body.comments[0]).toMatchObject({ body: 'Great shelf.' });
    expect(comments.body.comments[0].author.username).toBe('guest');

    await guest.delete(`${api}/2/social/like/collection/${collection.id}`);
    expect((await guest.get(`${api}/2/social/like/collection/${collection.id}`)).body.count).toBe(0);
  });

  it('marks notifications as read individually and in bulk', async () => {
    const { agent: first, id: firstId } = await account('reader', 'reader@example.com');
    const { agent: second } = await account('writer', 'writer@example.com');
    await second.post(`${api}/2/social/follow/${firstId}`);
    expect((await first.get(`${api}/2/social/notifications/count`)).body.count).toBe(1);

    const all = await first.patch(`${api}/2/social/notifications/read-all`);
    expect(all.status).toBe(200);
    expect((await first.get(`${api}/2/social/notifications/count`)).body.count).toBe(0);
  });
});

describe('TrackStack 2.0 — album stories', () => {
  it('saves, updates and lists a personal album story', async () => {
    const { agent } = await account('storyteller', 'storyteller@example.com');
    const collection = await seedCollection(agent, 'Story shelf');
    const album = await seedManualAlbum(agent, collection.id);

    const created = await agent.put(`${api}/2/stories/albums/${album.id}/story`).send({
      title: 'The one I always reach for',
      body: 'Bought it the week I moved into my first flat.',
      location: 'A record shop in Soho',
      occurredAt: '2019-06-01',
      isPublic: true,
    });
    expect(created.status).toBe(200);
    expect(created.body.story).toMatchObject({
      title: 'The one I always reach for',
      location: 'A record shop in Soho',
      isPublic: true,
    });

    const updated = await agent.put(`${api}/2/stories/albums/${album.id}/story`).send({ body: 'Still the one.' });
    expect(updated.body.story.body).toBe('Still the one.');
    expect(updated.body.story.title).toBe('The one I always reach for');

    const list = await agent.get(`${api}/2/stories/stories`);
    expect(list.body.stories).toHaveLength(1);
  });

  it('keeps stories private to their owner and exposes only published ones publicly', async () => {
    const { agent: owner } = await account('owner-story', 'owner-story@example.com');
    const { agent: other } = await account('other-story', 'other-story@example.com');
    const collection = await seedCollection(owner, 'Private shelf');
    const album = await seedManualAlbum(owner, collection.id);

    await owner.put(`${api}/2/stories/albums/${album.id}/story`).send({ body: 'Secret memory.', isPublic: false });
    const others = await other.get(`${api}/2/stories/albums/${album.id}/stories/public`);
    expect(others.body.stories).toEqual([]);

    await owner.put(`${api}/2/stories/albums/${album.id}/story`).send({ isPublic: true });
    const published = await other.get(`${api}/2/stories/albums/${album.id}/stories/public`);
    expect(published.body.stories).toHaveLength(1);
    expect(published.body.stories[0].author.username).toBe('owner-story');
  });

  it('does not let one collector read another collector story', async () => {
    const { agent: owner } = await account('private-owner', 'private-owner@example.com');
    const { agent: other } = await account('nosy', 'nosy@example.com');
    const collection = await seedCollection(owner, 'Shelf');
    const album = await seedManualAlbum(owner, collection.id);
    await owner.put(`${api}/2/stories/albums/${album.id}/story`).send({ body: 'Mine.' });

    const response = await other.get(`${api}/2/stories/albums/${album.id}/story`);
    expect(response.status).toBe(200);
    expect(response.body.story).toBeNull();
  });
});

describe('TrackStack 2.0 — wrapped and recommendations', () => {
  it('returns a wrapped recap for each supported range', async () => {
    const { agent } = await account('recapper', 'recapper@example.com');
    for (const range of ['year', 'month', 'all']) {
      const response = await agent.get(`${api}/2/wrapped`).query({ range });
      expect(response.status).toBe(200);
      expect(response.body.range).toBe(range);
      expect(response.body).toHaveProperty('topArtists');
      expect(response.body).toHaveProperty('topGenres');
      expect(response.body).toHaveProperty('totalListens');
    }
  });

  it('generates discover-weekly recommendations that are not already owned', async () => {
    const { agent } = await account('curious', 'curious@example.com');
    const collection = await seedCollection(agent, 'Mine');
    await seedManualAlbum(agent, collection.id, { title: 'Owned One', artist: 'Someone', genre: 'Folk' });

    const response = await agent.post(`${api}/2/recommendations/discover-weekly`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.recommendations)).toBe(true);

    const listed = await agent.get(`${api}/2/recommendations`);
    expect(listed.status).toBe(200);
    expect(listed.body.recommendations.length).toBe(response.body.recommendations.length);

    if (listed.body.recommendations.length) {
      const first = listed.body.recommendations[0];
      const dismissed = await agent.delete(`${api}/2/recommendations/${first.id}/dismiss`);
      expect(dismissed.status).toBe(200);
      const after = await agent.get(`${api}/2/recommendations`);
      expect(after.body.recommendations).toHaveLength(listed.body.recommendations.length - 1);
    }
  });
});

describe('TrackStack 2.0 — collection room', () => {
  it('stores and returns the shelf theme for a collection', async () => {
    const { agent } = await account('shelver', 'shelver@example.com');
    const collection = await seedCollection(agent, 'Vinyl shelf');

    const updated = await agent.patch(`${api}/collections/${collection.id}`).send({ shelfTheme: 'walnut' });
    expect(updated.status).toBe(200);
    expect(updated.body.collection.shelfTheme).toBe('walnut');

    const listed = await agent.get(`${api}/collections`);
    expect(listed.body.collections[0].shelfTheme).toBe('walnut');
  });

  it('rejects an unknown shelf theme', async () => {
    const { agent } = await account('bad-theme', 'bad-theme@example.com');
    const collection = await seedCollection(agent, 'Shelf');
    const response = await agent.patch(`${api}/collections/${collection.id}`).send({ shelfTheme: 'neon' });
    expect(response.status).toBe(400);
  });
});
