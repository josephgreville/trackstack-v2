import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../src/app.js';
import request from 'supertest';
import { closePool } from '../src/db/pool.js';

describe('Auth API', () => {
  beforeEach(async () => {
    // Register a user before each test
    await request(app).post('/auth/register').send({ username: 'testuser', email: 'test@example.com', password: 'password123' });
  });

  afterEach(() => {
    closePool();
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser2', email: 'test2@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      username: 'testuser2',
      email: 'test2@example.com',
    });
    expect(response.body.user.password_hash).toBeUndefined();
  });

  it('should reject duplicate email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser3', email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: 'test@example.com',
    });
  });

  it('should reject login with wrong password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});