import {
  addAlbumToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeAlbumFromCollection,
  updateCollection,
  updateCollectionAlbum,
  importCollectionAlbums,
} from '../services/collectionsService.js';
import { getCollectionStats } from '../services/personalFeaturesService.js';

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

export async function updateAlbumDetails(req, res) {
  await updateCollectionAlbum(req.user.id, req.validated.params.id, req.validated.params.albumId, req.validated.body);
  res.json({ updated: true });
}

export async function importAlbums(req, res) {
  const result = await importCollectionAlbums(req.user.id, req.validated.params.id, req.validated.body.albums);
  res.status(201).json(result);
}

export async function stats(req, res) {
  res.json({ stats: await getCollectionStats(req.user.id, req.validated.params.id) });
}

export async function exportCollection(req, res) {
  const collection = await getCollection(req.user.id, req.validated.params.id, { sort: 'added_at' });
  const columns = ['title', 'artist', 'releaseYear', 'genre', 'format', 'condition', 'purchaseDate', 'price', 'editionNotes', 'memoryLocation', 'memoryWith', 'memoryNote'];
  const quote = (value) => {
    const text = String(value ?? '');
    const safe = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = [columns.join(','), ...collection.albums.map((album) => columns.map((key) => quote(album[key])).join(','))].join('\r\n');
  res.type('text/csv').attachment(`${collection.name.replace(/[^a-z0-9-_]+/gi, '-') || 'trackstack-collection'}.csv`).send(csv);
}
