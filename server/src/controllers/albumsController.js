import { getSavedAlbum } from '../services/albumsService.js';

export async function show(req, res) {
  const detail = await getSavedAlbum(req.validated.params.id);
  res.json(detail);
}
