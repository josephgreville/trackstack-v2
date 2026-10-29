import { api } from '../api/client.js';

export const authService = {
  me: (options) => api.get('/auth/me', options),
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
};

export const catalogService = {
  search: ({ q = '', genre = '', page = 1, limit = 24 } = {}, signal) =>
    api.get(`/catalog/search${api.query({ q, genre, page, limit })}`, { signal }),
  featured: (signal) => api.get('/catalog/featured', { signal }),
  album: (externalId, signal) => api.get(`/catalog/albums/${externalId}`, { signal }),
};

export const collectionsService = {
  list: (signal) => api.get('/collections', { signal }),
  create: (payload) => api.post('/collections', payload),
  get: (id, { sort = 'added_at', order = 'desc' } = {}, signal) =>
    api.get(`/collections/${id}${api.query({ sort, order })}`, { signal }),
  update: (id, payload) => api.patch(`/collections/${id}`, payload),
  remove: (id) => api.delete(`/collections/${id}`),
  addAlbum: (id, payload) => api.post(`/collections/${id}/albums`, payload),
  removeAlbum: (id, albumId) => api.delete(`/collections/${id}/albums/${albumId}`),
};

export const albumsService = {
  recent: (signal) => api.get('/albums/recent', { signal }),
  saved: (id, signal) => api.get(`/albums/${id}`, { signal }),
};
