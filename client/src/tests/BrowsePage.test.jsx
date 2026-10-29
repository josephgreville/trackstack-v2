import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../api/client.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API client', () => {
  it('sends same-origin requests with cookies and serializes JSON payloads', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { username: 'listener' } }),
    });
    vi.stubGlobal('fetch', fetch);

    await expect(api.post('/auth/login', { email: 'listener@example.com' }))
      .resolves.toEqual({ user: { username: 'listener' } });

    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'listener@example.com' }),
      signal: undefined,
    });
  });

  it('omits empty query parameters and retains non-empty values', () => {
    expect(api.query({ q: 'jazz', genre: '', page: 2, limit: undefined }))
      .toBe('?q=jazz&page=2');
  });

  it('turns API errors into useful ApiError instances', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { code: 'UNAUTHORIZED', message: 'Please sign in.' },
      }),
    }));

    await expect(api.get('/collections')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Please sign in.',
    });
    expect(new ApiError('offline').code).toBe('REQUEST_FAILED');
  });

  it('reports network failures without disguising them as successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(api.get('/catalog/search')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK_ERROR',
    });
  });
});
