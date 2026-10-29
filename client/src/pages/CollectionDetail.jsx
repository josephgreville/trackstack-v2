import { useParams, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { cx, formatYear, formatAddedDate } from '../utils/format';
import { collectionsService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import { Button } from '../components/Button.jsx';

export default function CollectionDetail() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [collection, setCollection] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('added_at');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
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
  }, [id]);

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
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>

        <div className="mt-8">
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