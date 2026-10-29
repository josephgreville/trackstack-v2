import { getSavedAlbum, listRecentAlbums } from '../services/albumsService.js';

export async function recent(req, res) {
  const albums = await listRecentAlbums(req.user.id, 8);
  res.json({ albums });
}

export async function show(req, res) {
  const detail = await getSavedAlbum(req.validated.params.id);
  res.json(detail);
}
