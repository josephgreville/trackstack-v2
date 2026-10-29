import { useParams, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast, useAuth } from '../context/AuthContext';
import { cx, formatYear, formatAddedDate } from '../utils/format';
import { collectionsService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import { Button } from '../components/Button.jsx';

export default function CollectionDetail() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const { user } = useAuth();

  const [collection, setCollection] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('added_at');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const fetchCollection = async () => {
      const { user, isLoading } = useAuth();
      if (isLoading) return;
      collectionsService
        .getCollection(user.id, id, { sort, order })
        .then((data) => {
          setCollection(data.collection);
          setAlbums(data.albums);
        })
        .catch((err) => {
          error(err.message ?? 'Failed to load collection.');
        })
        .finally(() => setLoading(false));
    };
    fetchCollection();
  }, [id]);

  const removeAlbumFromCollection = async (albumId) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await collectionsService.removeAlbum(user.id, id, albumId);
      info('Album removed from collection.');
      await fetchCollection();
    } catch (err) {
      error(err.message ?? 'Failed to remove album from collection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-narrow">
          <p>Loading collection…</p>
        </div>
      </section>
    );
  }

  if (!collection) {
    return (
      <section className="py-12">
        <div className="container-narrow">
          <p>Collection not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container-narrow">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-700 tracking-tighter mb-2">
            {collection.name}
          </h1>
          <p className="text-brown-line">{collection.description}</p>
          <p className="text-xs text-brown-light">
            {collection.albumCount} albums · {formatAddedDate(collection.createdAt)}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <article
              key={album.id}
              className="group bg-paper rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/album/catalog/${album.externalId}`}
            >
              <img
                src={album.artworkUrl ?? 'https://via.placeholder.com/300x300/dddde4/786b60'}
                alt={album.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-display font-600 line-clamp-2 mb-2">{album.title}</h3>
                <p className="text-sm text-brown-line">{album.artist}{' '}{formatYear(album.releaseYear) || '—'}</p>
                {album.trackCount && (
                  <p className="text-xs text-brown-light mt-1">
                    {album.trackCount} tracks
                  </p>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  className="mt-2 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Remove this album from the collection?')) {
                      removeAlbumFromCollection(album.id);
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-display font-600 mb-4">Add album</h2>
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/collections/${id}/add`, { replace: true })
            }
          >
            Add album to collection
          </Button>
        </div>
      </div>
    </section>
  );
}