import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicService } from '../services/index.js';

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { publicService.profile(username).then(({ profile: value }) => setProfile(value)).catch((err) => setError(err.message)); }, [username]);
  if (error) return <section className="page-section container-narrow"><p role="alert">{error}</p></section>;
  if (!profile) return <section className="page-section container-narrow"><p role="status">Loading profile…</p></section>;
  return <section className="page-section"><div className="container-narrow">
    <p className="eyebrow">Public collector profile</p><h1>{profile.username}</h1>
    {profile.collections.length ? <div className="catalog-grid">{profile.collections.map((collection) => <Link className="feature-card" key={collection.id} to={`/share/${collection.shareToken}`}><div className="collection-artwork-strip">{collection.coverArtworks.slice(0,4).map((src, index) => <img key={`${src}-${index}`} src={src} alt="" />)}</div><h2>{collection.name}</h2>{collection.description && <p className="public-collection-story">{collection.description}</p>}<p>{collection.albumCount} albums</p></Link>)}</div> : <p className="empty-state">No public collections yet.</p>}
  </div></section>;
}
