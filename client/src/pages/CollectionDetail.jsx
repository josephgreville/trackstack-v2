import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { albumHref, formatYear, formatAddedDate } from '../utils/format';
import { collectionsService } from '../services/index';
import Button from '../components/Button.jsx';

export default function CollectionDetail() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { error, info } = useToast();

  const [collection, setCollection] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const sort = 'added_at';
  const order = 'desc';

  const fetchCollection = useCallback(async () => {
    const data = await collectionsService.get(collectionId, { sort, order });
    setCollection(data.collection);
    setAlbums(data.collection.albums ?? []);
  }, [collectionId]);

  useEffect(() => {
    let active = true;
    fetchCollection()
      .catch((err) => {
        if (active) error(err.message ?? 'Failed to load collection.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [error, fetchCollection]);

  const removeAlbumFromCollection = async (albumId) => {
    setLoading(true);
    try {
      await collectionsService.removeAlbum(collectionId, albumId);
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

        {albums.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
            <article
              key={album.id}
              className="group bg-paper rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link to={albumHref(album)} className="block">
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
                </div>
              </Link>
              <div className="px-4 pb-4">
                <Button
                  size="sm"
                  variant="danger"
                  className="w-full"
                  onClick={() => {
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
        ) : (
          <p className="text-brown-light">No albums in this collection yet. Add one to get started.</p>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-display font-600 mb-4">Add album</h2>
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/collections/${collectionId}/add`, { replace: true })
            }
          >
            Add album to collection
          </Button>
        </div>
      </div>
    </section>
  );
}