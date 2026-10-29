import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { cx, formatAddedDate } from '../utils/format';
import { api } from '../api/client';
import { collectionsService } from '../services/index';
import CollectionCard from '../components/CollectionCard.jsx';

export default function Collections() {
  const [params, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collectionsService
      .list()
      .then((data) => setCollections(data.collections))
      .catch((err) => {
        error(err.message ?? 'Failed to load collections.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container-narrow">
          <p>Loading your collections…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container-narrow">
        <header className="mb-12">
          <h1 className="text-3xl font-display font-700 tracking-tighter mb-4">
            My collections
          </h1>
          <p className="text-lg text-brown max-w-2xl">
            Organise your albums into collections and keep track of what you love.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onView={() =>
                navigate(`/collections/${collection.id}`, { replace: true })
              }
            />
          ))}
        </div>

        {!collections.length && (
          <p className="text-brown text-sm text-muted mt-6">
            You don't have any collections yet. Create one to get started.
          </p>
        )}
      </div>
    </section>
  );
}