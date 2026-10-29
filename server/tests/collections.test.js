import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../src/app.js';
import request from 'supertest';
import { closePool } from '../src/db/pool.js';

let authCookie;

beforeEach(async () => {
  // Register a user first
  await request(app).post('/auth/register').send({ username: 'coluser', email: 'col@example.com', password: 'password123' });

  const loginRes = await request(app).post('/auth/login').send({ email: 'col@example.com', password: 'password123' });
  authCookie = loginRes.headers['set-cookie']?.[0];
});

afterEach(() => {
  closePool();
});

describe('Collections API', () => {
  it('should list collections for authenticated user', async () => {
    const response = await request(app).get('/collections').set('Cookie', [authCookie ?? '']);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.collections)).toBe(true);
  });

  it('should create a collection', async () => {
    const response = await request(app)
      .post('/collections')
      .set('Cookie', [authCookie ?? ''])
      .send({ name: 'Vinyl Classics', description: 'My favourite albums' });

    expect(response.status).toBe(201);
    expect(response.body.collection.name).toBe('Vinyl Classics');
    expect(response.body.collection.albumCount).toBe(0);
  });

  it('should reject collection with blank name', async () => {
    const response = await request(app)
      .post('/collections')
      .set('Cookie', [authCookie ?? ''])
      .send({ name: '', description: 'Test' });

    expect(response.status).toBe(409);
  });

  it('should get a collection with its albums', async () => {
    // Create a collection
    const collRes = await request(app)
      .post('/collections')
      .set('Cookie', [authCookie ?? ''])
      .send({ name: 'Test Collection' });

    const collId = collRes.body.collection.id;

    const response = await request(app)
      .get(`/collections/${collId}`)
      .set('Cookie', [authCookie ?? '']);

    expect(response.status).toBe(200);
    expect(response.body.collection.name).toBe('Test Collection');
    expect(Array.isArray(response.body.albums)).toBe(true);
  });

  it('should prevent accessing another user\'s collection', async () => {
    // Register a second user
    await request(app).post('/auth/register').send({ username: 'otheruser', email: 'other@example.com', password: 'password123' });

    const otherLogin = await request(app).post('/auth/login').send({ email: 'other@example.com', password: 'password123' });
    const otherCookie = otherLogin.headers['set-cookie']?.[0];

    // Try to access the first user's collection
    const createRes = await request(app)
      .post('/collections')
      .set('Cookie', [authCookie ?? ''])
      .send({ name: 'My Collection' });
    const myCollectionId = createRes.body.collection.id;

    // Try to access it as the other user
    const response = await request(app)
      .get(`/collections/${myCollectionId}`)
      .set('Cookie', [otherCookie ?? '']);

    expect(response.status).toBe(404);
  });

  it('should update a collection', async () => {
    const response = await request(app)
      .patch('/collections/my-collection')
      .set('Cookie', [authCookie ?? ''])
      .send({ name: 'Updated Name' });

    expect(response.status).toBe(200);
    expect(response.body.collection.name).toBe('Updated Name');
  });

  it('should delete a collection', async () => {
    const response = await request(app).delete('/collections/to-delete').set('Cookie', [authCookie ?? '']);

    expect(response.status).toBe(204);
  });
});