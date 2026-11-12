import {
  getStory, upsertStory, listUserStories, deleteStory,
  addPhoto, deletePhoto, getPublicStoriesForAlbum,
} from '../services/storiesService.js';

export async function storyGet(req, res) {
  const story = await getStory(req.user.id, req.validated.params.albumId);
  res.json({ story: story ?? null });
}

export async function storyUpsert(req, res) {
  const story = await upsertStory(req.user.id, req.validated.params.albumId, req.validated.body);
  res.json({ story });
}

export async function storyDelete(req, res) {
  await deleteStory(req.user.id, req.validated.params.storyId);
  res.status(204).end();
}

export async function storiesIndex(req, res) {
  const stories = await listUserStories(req.user.id, {
    publicOnly: req.validated?.query?.publicOnly === 'true',
  });
  res.json({ stories });
}

export async function photoAdd(req, res) {
  const photo = await addPhoto(req.user.id, req.validated.params.storyId, req.validated.body);
  res.status(201).json({ photo });
}

export async function photoDelete(req, res) {
  await deletePhoto(req.user.id, req.validated.params.photoId);
  res.status(204).end();
}

export async function publicStoriesForAlbum(req, res) {
  const stories = await getPublicStoriesForAlbum(
    req.user.id,
    req.validated.params.albumId,
    { limit: Number(req.validated?.query?.limit ?? 20) }
  );
  res.json({ stories });
}
