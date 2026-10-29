import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicService } from '../services/index.js';

export default function SharedCollection() {
  const { token } = useParams();
  const [collection, setCollection] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { publicService.share(token).then(({ collection: value }) => setCollection(value)).catch((err) => setError(err.message)); }, [token]);
  if (error) return <section className="page-section container-narrow"><p role="alert">{error}</p></section>;
  if (!collection) return <section className="page-section container-narrow"><p role="status">Loading shared collection…</p></section>;
  return <section className="page-section"><div className="container-narrow">
    <p className="eyebrow">Shared by <Link to={`/users/${encodeURIComponent(collection.owner)}`}>{collection.owner}</Link></p>
    <h1>{collection.name}</h1><p className="text-brown">{collection.description}</p>
    {collection.albums.length ? <div className="catalog-grid">{collection.albums.map((album) => <article className="feature-card" key={album.id}>{album.externalId ? <Link to={`/album/catalog/${album.externalId}`}><img src={album.artworkUrl || ''} alt={`${album.title} cover`} /><h2>{album.title}</h2><p>{album.artist}</p></Link> : <><img src={album.artworkUrl || ''} alt={`${album.title} cover`} /><h2>{album.title}</h2><p>{album.artist}</p></>}</article>)}</div> : <p className="empty-state">This collection is empty.</p>}
  </div></section>;
}
