import { api } from '../api/client.js';

export const authService = {
  me: (options) => api.get('/auth/me', options),
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  updateProfile: (payload) => api.patch('/auth/profile', payload),
};

export const catalogService = {
  search: ({ q = '', genre = '', artist = '', yearFrom, yearTo, sort = 'relevance', page = 1, limit = 24 } = {}, signal) =>
    api.get(`/catalog/search${api.query({ q, genre, artist, yearFrom, yearTo, sort, page, limit })}`, { signal }),
  featured: (signal) => api.get('/catalog/featured', { signal }),
  album: (externalId, signal) => api.get(`/catalog/albums/${externalId}`, { signal }),
};

export const collectionsService = {
  list: (signal) => api.get('/collections', { signal }),
  create: (payload) => api.post('/collections', payload),
  get: (id, { sort = 'added_at', order = 'desc', q = '' } = {}, signal) =>
    api.get(`/collections/${id}${api.query({ sort, order, q })}`, { signal }),
  update: (id, payload) => api.patch(`/collections/${id}`, payload),
  remove: (id) => api.delete(`/collections/${id}`),
  addAlbum: (id, payload) => api.post(`/collections/${id}/albums`, payload),
  removeAlbum: (id, albumId) => api.delete(`/collections/${id}/albums/${albumId}`),
  updateAlbum: (id, albumId, payload) => api.patch(`/collections/${id}/albums/${albumId}`, payload),
  stats: (id) => api.get(`/collections/${id}/stats`),
  importAlbums: (id, albums) => api.post(`/collections/${id}/import`, { albums }),
  export: (id) => api.download(`/collections/${id}/export`),
};

export const wantlistService = {
  list: () => api.get('/me/wantlist'),
  add: (payload) => api.post('/me/wantlist', payload),
  remove: (id) => api.delete(`/me/wantlist/${id}`),
  update: (id, payload) => api.patch(`/me/wantlist/${id}`, payload),
  acquire: (id, payload) => api.post(`/me/wantlist/${id}/acquire`, payload),
};

export const listeningQueueService = {
  list: () => api.get('/me/queue'),
  add: (albumId) => api.post('/me/queue', { albumId }),
  build: (genre = '', mood = '') => api.post('/me/queue/build', { genre, mood }),
  remove: (id) => api.delete(`/me/queue/${id}`),
  listened: (id) => api.post(`/me/queue/${id}/listen`),
};

export const listeningService = {
  list: () => api.get('/me/history'),
  log: (payload) => api.post('/me/history', payload),
  review: (id, payload) => api.patch(`/me/history/${id}`, payload),
  insights: () => api.get('/me/history/insights'),
};

export const publicService = {
  share: (token) => api.get(`/public/share/${token}`),
  profile: (username) => api.get(`/public/users/${encodeURIComponent(username)}`),
};

export const albumsService = {
  recent: (signal) => api.get('/albums/recent', { signal }),
  saved: (id, signal) => api.get(`/albums/${id}`, { signal }),
};
