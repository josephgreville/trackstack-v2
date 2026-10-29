import { useParams, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { cx, formatYear, formatDuration, formatTotalDuration, initials } from '../utils/format';
import { api } from '../api/client';
import { catalogService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import { Button } from '../components/Button.jsx';

export default function AlbumDetail() {
  const { externalId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [catalogueAvailable, setCatalogueAvailable] = useState(false);

  useEffect(() => {
    if (!externalId) {
      setLoading(false);
      return;
    }

    catalogService
      .album(externalId)
      .then((detail) => {
        setAlbum(detail.album);
        setTracks(detail.album.tracks ?? []);
        setRelated(detail.related ?? []);
        setCatalogueAvailable(detail.catalogueAvailable ?? false);
      })
      .catch((err) => {
        error(err.message ?? 'Could not load album details.');
        navigate('/', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [externalId]);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-narrow">
          <p>Loading album details…</p>
        </div>
      </section>
    );
  }

  if (!album) {
    return (
      <section className="py-12">
        <div className="container-narrow">
          <p>Album not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container-narrow">
        <div className="mb-8">
          <img
            src={album.artworkUrl || 'https://via.placeholder.com/600x600/dddde4/786b60?text=No+artwork'}
            alt={album.title}
            className="w-full h-64 rounded-lg object-cover mb-6"
          />
          <h1 className="text-3xl font-display font-700 mb-2">{album.title}</h1>
          <p className="text-brown">
            {album.artist} · {formatYear(album.releaseYear)} · {album.genre || 'Unknown genre'}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-display font-600 mb-4">Track listing</h2>
          {tracks.length > 0 ? (
            <ol className="list-decimal inside pl-6 space-y-2 text-sm">
              {tracks.map((track) => (
                <li key={track.externalId}>
                  {track.trackNumber?.toString().padStart(2, '0')}. {track.title}
                  {track.durationMs && (
                    <span className="text-brown-light ms-2">
                      {formatDuration(track.durationMs)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-brown-light">No track listing available.</p>
          )}
        </div>

        {catalogueAvailable && (
          <div className="mt-8">
            <h2 className="text-xl font-display font-600 mb-4">Related albums</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {related.map((rel) => (
                <article
                  key={rel.externalId}
                  className="bg-paper rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={rel.artworkUrl || 'https://via.placeholder.com/150x150/dddde4/786b60'}
                    alt={rel.title}
                    className="w-full h-24 object-cover rounded mb-3"
                  />
                  <h3 className="font-display font-600 line-clamp-1">{rel.title}</h3>
                  <p className="text-xs text-brown-light">{rel.artist}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        <Button
          className="mt-6"
          onClick={() => navigate(`/collections/${album.externalId ? 'album/catalog/' + album.externalId : ''}`)}
        >
          Add to collection
        </Button>
      </div>
    </section>
  );
}
