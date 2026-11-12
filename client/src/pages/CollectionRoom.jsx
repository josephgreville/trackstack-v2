import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collectionsService } from '../services/index.js';
import ShelfRoom, { SHELF_THEMES, SHELF_SORTS } from '../components/ShelfRoom.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CollectionRoom() {
  const [collections, setCollections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [sort, setSort] = useState('added_at');
  const [order, setOrder] = useState('desc');
  const [theme, setTheme] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [shelfLoading, setShelfLoading] = useState(false);
  const { error, success } = useToast();

  useEffect(() => {
    collectionsService
      .list()
      .then(({ collections: rows }) => {
        setCollections(rows ?? []);
        if (rows?.length) {
          setActiveId(rows[0].id);
          setTheme(rows[0].shelfTheme ?? 'classic');
        }
      })
      .catch((err) => error(err.message ?? 'Could not load your collections.'))
      .finally(() => setLoading(false));
  }, [error]);

  const loadShelf = useCallback(() => {
    if (!activeId) return;
    setShelfLoading(true);
    collectionsService
      .get(activeId, { sort, order })
      .then(({ collection }) => {
        setAlbums(collection.albums ?? []);
        setTheme(collection.shelfTheme ?? 'classic');
      })
      .catch((err) => error(err.message ?? 'Could not load that shelf.'))
      .finally(() => setShelfLoading(false));
  }, [activeId, sort, order, error]);

  useEffect(() => { loadShelf(); }, [loadShelf]);

  const changeTheme = async (nextTheme) => {
    setTheme(nextTheme);
    if (!activeId) return;
    try {
      await collectionsService.update(activeId, { shelfTheme: nextTheme });
      success('Shelf theme saved.');
    } catch (err) {
      error(err.message ?? 'Could not save the shelf theme.');
    }
  };

  const active = collections.find((collection) => collection.id === activeId) ?? null;

  if (loading) {
    return <section className="page-section container-narrow"><p role="status">Opening your collection room…</p></section>;
  }

  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading">
          <p className="eyebrow">Your records, on the wall</p>
          <h1>Collection room</h1>
          <p>Walk through your stacks as if they were shelves in a record shop.</p>
        </header>

        {!collections.length ? (
          <EmptyState
            title="Your room is empty"
            description="Create a collection and it will appear here as a shelf you can browse."
            icon="🪵"
            action={() => { window.location.href = '/collections?create=true'; }}
            actionLabel="Create your first stack"
          />
        ) : (
          <>
            <nav className="room-tabs" aria-label="Your collections">
              {collections.map((collection) => (
                <motion.button
                  key={collection.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  className={`room-tab ${collection.id === activeId ? 'is-active' : ''}`}
                  onClick={() => setActiveId(collection.id)}
                >
                  {collection.name}
                  <span>{collection.albumCount}</span>
                </motion.button>
              ))}
            </nav>

            <div className="room-controls">
              <label>
                Sort by
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  {SHELF_SORTS.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Order
                <select value={order} onChange={(event) => setOrder(event.target.value)}>
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </label>
              <div className="room-theme-picker" role="group" aria-label="Shelf theme">
                {Object.entries(SHELF_THEMES).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    className={`room-theme-swatch theme-${key} ${theme === key ? 'is-active' : ''}`}
                    style={{ background: value.wood }}
                    onClick={() => changeTheme(key)}
                    aria-label={value.label}
                    aria-pressed={theme === key}
                    title={value.label}
                  />
                ))}
              </div>
              {active && (
                <Link className="room-open-link" to={`/collections/${active.id}`}>
                  Open collection →
                </Link>
              )}
            </div>

            {shelfLoading ? (
              <p role="status">Opening the shelf…</p>
            ) : (
              <ShelfRoom
                collection={active}
                albums={albums}
                sort={sort}
                theme={theme}
                onSortChange={setSort}
                onThemeChange={changeTheme}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
