import {
  getAlbumDetail,
  getFeaturedAlbums,
  searchAlbums,
} from '../services/itunesService.js';

export async function search(req, res) {
  const results = await searchAlbums(req.validated.query);
  res.json(results);
}

export async function featured(_req, res) {
  const albums = await getFeaturedAlbums();
  res.json({ albums });
}

export async function albumDetail(req, res) {
  const detail = await getAlbumDetail(req.validated.params.externalId);
  res.json(detail);
}
