import {
  addToWantlist, listWantlist, removeFromWantlist, updateWantlistItem, acquireWantlistItem,
  logListen, listListeningHistory, updateListenReview, listListeningQueue,
  addToListeningQueue, buildListeningQueue, removeFromListeningQueue,
  markQueueItemListened, getListeningInsights,
} from '../services/personalFeaturesService.js';

export async function wantlistIndex(req, res) {
  res.json({ items: await listWantlist(req.user.id) });
}
export async function wantlistCreate(req, res) {
  const album = await addToWantlist(req.user.id, req.validated.body);
  res.status(201).json({ album });
}
export async function wantlistDelete(req, res) {
  await removeFromWantlist(req.user.id, req.validated.params.id);
  res.status(204).end();
}
export async function wantlistUpdate(req, res) {
  await updateWantlistItem(req.user.id, req.validated.params.id, req.validated.body);
  res.json({ updated: true });
}
export async function wantlistAcquire(req, res) {
  const result = await acquireWantlistItem(req.user.id, req.validated.params.id, req.validated.body);
  res.status(201).json(result);
}
export async function historyIndex(req, res) {
  res.json({ history: await listListeningHistory(req.user.id) });
}
export async function historyInsights(req, res) {
  res.json({ insights: await getListeningInsights(req.user.id) });
}
export async function historyCreate(req, res) {
  res.status(201).json({ entry: await logListen(req.user.id, req.validated.body) });
}
export async function historyUpdate(req, res) {
  await updateListenReview(req.user.id, req.validated.params.historyId, req.validated.body);
  res.json({ updated: true });
}
export async function queueIndex(req, res) {
  res.json({ queue: await listListeningQueue(req.user.id) });
}
export async function queueBuild(req, res) {
  res.json({ queue: await buildListeningQueue(req.user.id, req.validated.body) });
}
export async function queueCreate(req, res) {
  await addToListeningQueue(req.user.id, req.validated.body.albumId);
  res.status(201).json({ queue: await listListeningQueue(req.user.id) });
}
export async function queueDelete(req, res) {
  await removeFromListeningQueue(req.user.id, req.validated.params.id);
  res.status(204).end();
}
export async function queueListen(req, res) {
  await markQueueItemListened(req.user.id, req.validated.params.id);
  res.json({ listened: true });
}
