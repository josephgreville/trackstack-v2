const DEFAULT_API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';
const API_BASE_KEY = 'trackstack.apiBase';

/**
 * The browser build talks to `/api/v1` on its own origin. The native Android
 * app runs from `https://localhost`, so it needs the absolute address of the
 * TrackStack API. That address can be set at build time with
 * `VITE_API_URL`, or at runtime from the in-app server setting, which is
 * stored locally so a rebuild is not needed to point the app somewhere else.
 */
export function getApiBase() {
  try {
    const stored = window.localStorage.getItem(API_BASE_KEY);
    if (stored) return stored.replace(/\/+$/, '');
  } catch {
    // Private mode or a locked-down WebView: fall back to the build-time value.
  }
  return DEFAULT_API_BASE;
}

export function setApiBase(url) {
  try {
    const trimmed = String(url ?? '').trim().replace(/\/+$/, '');
    if (trimmed) window.localStorage.setItem(API_BASE_KEY, trimmed);
    else window.localStorage.removeItem(API_BASE_KEY);
  } catch {
    // Nothing to do: the build-time value stays in use.
  }
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;

  try {
    response = await fetch(`${getApiBase()}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('We could not reach TrackStack. Check your connection and try again.', {
      code: 'NETWORK_ERROR',
    });
  }

  if (response.status === 204) return null;

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // A non-JSON error page is still an error; the fallback below is enough.
  }

  if (!response.ok) {
    throw new ApiError(payload?.error?.message ?? 'Something went wrong. Please try again.', {
      status: response.status,
      code: payload?.error?.code ?? 'REQUEST_FAILED',
      details: payload?.error?.details,
    });
  }

  return payload;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  download: async (path) => {
    let response;
    try {
      response = await fetch(`${getApiBase()}${path}`, { credentials: 'include' });
    } catch {
      throw new ApiError('We could not reach TrackStack. Check your connection and try again.', { code: 'NETWORK_ERROR' });
    }
    if (!response.ok) {
      let payload;
      try { payload = await response.json(); } catch { /* keep fallback message */ }
      throw new ApiError(payload?.error?.message ?? 'Could not download this file.', { status: response.status });
    }
    return response.blob();
  },
  query: buildQuery,
};
