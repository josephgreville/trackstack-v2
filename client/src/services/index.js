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

/* ========================================================================
   TrackStack 2.0 services
   ======================================================================== */

/* Gamification + profile (mounted at /2) */
export const achievementsService = {
  me: () => api.get('/2/me'),
  updateProfile: (payload) => api.patch('/2/profile', payload),
  listAchievements: () => api.get('/2/achievements'),
  checkAchievements: () => api.post('/2/achievements/check'),
};

/* Social: follows, activity, notifications, likes, comments (mounted at /2/social) */
export const socialService = {
  follow: (userId) => api.post(`/2/social/follow/${userId}`),
  unfollow: (userId) => api.delete(`/2/social/follow/${userId}`),
  followers: (userId) => api.get(`/2/social/followers/${userId}`),
  following: (userId) => api.get(`/2/social/following/${userId}`),
  followStatus: (userId) => api.get(`/2/social/follow-status/${userId}`),
  activity: ({ limit = 20, offset = 0 } = {}) =>
    api.get(`/2/social/activity${api.query({ limit, offset })}`),
  globalActivity: ({ limit = 30, offset = 0 } = {}) =>
    api.get(`/2/social/activity/global${api.query({ limit, offset })}`),
  notifications: ({ unread = false } = {}) =>
    api.get(`/2/social/notifications${api.query({ unread })}`),
  notificationCount: () => api.get('/2/social/notifications/count'),
  markNotificationRead: (notificationId) =>
    api.patch(`/2/social/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => api.patch('/2/social/notifications/read-all'),
  like: (targetType, targetId) => api.post(`/2/social/like/${targetType}/${targetId}`),
  unlike: (targetType, targetId) => api.delete(`/2/social/like/${targetType}/${targetId}`),
  likeStatus: (targetType, targetId) =>
    api.get(`/2/social/like/${targetType}/${targetId}`),
  addComment: (targetType, targetId, body) =>
    api.post(`/2/social/comments/${targetType}/${targetId}`, { body }),
  comments: (targetType, targetId, { limit = 20 } = {}) =>
    api.get(`/2/social/comments/${targetType}/${targetId}${api.query({ limit })}`),
};

/* Stories: album stories + photos (mounted at /2/stories) */
export const storiesService = {
  getStory: (albumId) => api.get(`/2/stories/albums/${albumId}/story`),
  upsertStory: (albumId, payload) =>
    api.put(`/2/stories/albums/${albumId}/story`, payload),
  deleteStory: (storyId) => api.delete(`/2/stories/stories/${storyId}`),
  listStories: ({ publicOnly = false } = {}) =>
    api.get(`/2/stories/stories${api.query({ publicOnly })}`),
  addPhoto: (storyId, payload) =>
    api.post(`/2/stories/stories/${storyId}/photos`, payload),
  deletePhoto: (photoId) => api.delete(`/2/stories/photos/${photoId}`),
  publicStoriesForAlbum: (albumId, { limit = 20 } = {}) =>
    api.get(`/2/stories/albums/${albumId}/stories/public${api.query({ limit })}`),
};

/* Recommendations: discover weekly (mounted at /2/recommendations) */
export const recommendationsService = {
  list: ({ kind, limit = 12 } = {}) =>
    api.get(`/2/recommendations${api.query({ kind, limit })}`),
  dismiss: (id) => api.delete(`/2/recommendations/${id}/dismiss`),
  discoverWeekly: () => api.post('/2/recommendations/discover-weekly'),
};

/* Wrapped: yearly/monthly recap (mounted at /2/wrapped) */
export const wrappedService = {
  get: ({ range = 'year' } = {}) => api.get(`/2/wrapped${api.query({ range })}`),
  recordSession: (payload) => api.post('/2/wrapped/sessions', payload),
};
