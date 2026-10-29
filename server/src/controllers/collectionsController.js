import {
  addAlbumToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeAlbumFromCollection,
  updateCollection,
} from '../services/collectionsService.js';

export async function index(req, res) {
  const collections = await listCollections(req.user.id);
  res.json({ collections });
}

export async function create(req, res) {
  const collection = await createCollection(req.user.id, req.validated.body);
  res.status(201).json({ collection });
}

export async function show(req, res) {
  const collection = await getCollection(req.user.id, req.validated.params.id, req.validated.query);
  res.json({ collection });
}

export async function update(req, res) {
  const collection = await updateCollection(req.user.id, req.validated.params.id, req.validated.body);
  res.json({ collection });
}

export async function destroy(req, res) {
  await deleteCollection(req.user.id, req.validated.params.id);
  res.status(204).end();
}

export async function addAlbum(req, res) {
  const album = await addAlbumToCollection(
    req.user.id,
    req.validated.params.id,
    req.validated.body,
  );
  res.status(201).json({ album });
}

export async function removeAlbum(req, res) {
  await removeAlbumFromCollection(
    req.user.id,
    req.validated.params.id,
    req.validated.params.albumId,
  );
  res.status(204).end();
}
