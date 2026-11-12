import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cx } from '../utils/format';
import { GENRES, genreByName } from '../utils/genres';
import { albumsService, catalogService, collectionsService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import * as Skeleton from '../components/Skeleton.jsx';
import {
  motion,
  PageTransition,
  pageVariants,
  listContainer,
  listItem,
  hoverCard,
  fadeInUp,
} from '../components/motion.jsx';

const QUICK_ACTIONS = [
  { to: '/collection-room', label: 'Your room', icon: '🪵', blurb: 'See your shelves' },
  { to: '/discover', label: 'Discover', icon: '🧭', blurb: 'Find something new' },
  { to: '/wrapped', label: 'Wrapped', icon: '📊', blurb: 'Your year so far' },
  { to: '/listen-next', label: 'Up next', icon: '🎧', blurb: 'Shuffle a queue' },
  { to: '/achievements', label: 'Badges', icon: '🏅', blurb: 'Earn your next' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');

  // Fetch featured albums on mount
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [recentAlbums, setRecentAlbums] = useState([]);
  const [myCollections, setMyCollections] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState('');
  const [recentError, setRecentError] = useState('');

  useEffect(() => {
    let cancelled = false;

    // Fetch featured albums
    catalogService
      .featured()
      .then(({ albums }) => {
        if (!cancelled) setFeaturedAlbums(albums ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setFeaturedAlbums([]);
          setFeaturedError(err.message ?? 'Featured albums could not be loaded.');
        }
      })
      .finally(() => {
        if (!cancelled) setFeaturedLoading(false);
      });

    // Fetch recently added albums for the current user
    if (user) {
      setCollectionsLoading(true);
      collectionsService
        .list()
        .then((data) => {
          if (cancelled) return;
          setMyCollections(data.collections ?? []);
        })
        .catch((err) => {
          if (!cancelled) {
            setMyCollections([]);
            setCollectionsError(err.message ?? 'Your collections could not be loaded.');
          }
        })
        .finally(() => {
          if (!cancelled) setCollectionsLoading(false);
        });
      albumsService
        .recent()
        .then(({ albums }) => {
          if (cancelled) return;
          setRecentAlbums(albums ?? []);
        })
        .catch((err) => {
          if (!cancelled) {
            setRecentAlbums([]);
            setRecentError(err.message ?? 'Recently added albums could not be loaded.');
          }
        });
    } else {
      setMyCollections([]);
      setRecentAlbums([]);
      setCollectionsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSearch = (value) => {
    const q = value.trim();
    const search = new URLSearchParams();
    if (q) search.set('q', q);
    if (genre) search.set('genre', genre);
    navigate(`/browse${search.size ? `?${search}` : ''}`);
  };

  const collectionCount = myCollections.length;
  const albumCount = myCollections.reduce((sum, c) => sum + (c.albumCount ?? 0), 0);

  return (
    <PageTransition>
      <section className="py-12" variants={pageVariants} initial="hidden" animate="show">
        <div className="container-narrow">
          <header className="dashboard-hero mb-12" variants={fadeInUp} initial="hidden" animate="show">
            {user && <p className="eyebrow">Welcome back, {user.username}</p>}
            <h1 className="text-3xl font-display font-700 tracking-tighter mb-4">
              Your music. Your collection. Your story.
            </h1>
            <p className="text-lg text-brown max-w-2xl">
              Discover new albums, catalogue your favourites, and build the record collection of your dreams.
            </p>
          </header>

          {/* Quick stats */}
          {user && (
            <div className="home-stat-grid" variants={listContainer} initial="hidden" animate="show">
              <motion.div variants={listItem} className="home-stat-card">
                <h3>Collections</h3>
                <div className="stat-row">
                  <span className="stat-label">Stacks you own</span>
                  <strong>{collectionCount}</strong>
                </div>
                <div className="stat-track">
                  <div style={{ width: Math.min(collectionCount * 33, 100) + '%' }}></div>
                </div>
              </motion.div>
              <motion.div variants={listItem} className="home-stat-card">
                <h3>Albums</h3>
                <div className="stat-row">
                  <span className="stat-label">Across your stacks</span>
                  <strong>{albumCount}</strong>
                </div>
                <div className="stat-track">
                  <div style={{ width: Math.min(albumCount * 5, 100) + '%' }}></div>
                </div>
              </motion.div>
              <motion.div variants={listItem} className="home-stat-card">
                <h3>Listening</h3>
                <div className="stat-row">
                  <span className="stat-label">Up next</span>
                  <strong>→</strong>
                </div>
                <div className="stat-track">
                  <div style={{ width: '60%' }}></div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Quick actions — the app in one glance */}
        <div className="home-quick-actions" variants={listContainer} initial="hidden" animate="show">
          {QUICK_ACTIONS.map((action) => (
            <motion.div key={action.to} variants={listItem}>
              <Link to={action.to} className="home-quick-action">
                <span className="home-quick-icon" aria-hidden="true">{action.icon}</span>
                <span className="home-quick-copy">
                  <strong>{action.label}</strong>
                  <span>{action.blurb}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Search & filters */}
          <div className="bg-paper rounded-lg p-6 mb-12 shadow-sm" variants={fadeInUp} initial="hidden" animate="show">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search albums, artists, or keywords"
              onSubmit={handleSearch}
              genreOptions={GENRES}
              selectedGenre={genreByName(genre)?.name ?? ''}
              onGenreChange={setGenre}
            />
          </div>

          {/* Featured albums section */}
          <div className="mb-12" variants={fadeInUp} initial="hidden" animate="show">
            <h2 className="text-2xl font-display font-600 mb-6">Featured albums</h2>
            {featuredLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton.SkeletonAlbumCard key={i} />
                ))}
              </div>
            ) : featuredError ? (
              <p role="alert">{featuredError}</p>
            ) : featuredAlbums.length === 0 ? (
              <EmptyState
                title="No featured albums right now"
                description="Check back soon — new featured picks land here regularly."
                icon="💿"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredAlbums.map((album, index) => (
                  <AlbumCard key={album.externalId} album={album} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Recently added */}
          <div className="mb-12" variants={fadeInUp} initial="hidden" animate="show">
            <h2 className="text-2xl font-display font-600 mb-6">Recently added</h2>
            {recentError && <p role="alert">{recentError}</p>}
            {recentAlbums.length === 0 ? (
              <EmptyState
                title="Nothing recently added"
                description="Add your first album to a collection and it'll show up here."
                icon="📭"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentAlbums.map((album, index) => (
                  <AlbumCard
                    key={album.id}
                    album={{ ...album, artworkUrl: album.artworkUrl ?? album.coverArtworks?.[0] }}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>

          {/* My Collections */}
          {user && (
            <div className="mb-12" variants={fadeInUp} initial="hidden" animate="show">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-600">My collections</h2>
                <Button
                  to="/collections?create=true"
                  variant="primary"
                  size="sm"
                >
                  Create collection
                </Button>
              </div>
              {collectionsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="collection-card p-4">
                      <Skeleton.SkeletonAlbumCard />
                    </div>
                  ))}
                </div>
              ) : collectionsError ? (
                <p role="alert">{collectionsError}</p>
              ) : myCollections.length === 0 ? (
                <EmptyState
                  title="No collections yet"
                  description="Create one to start organising your albums into themed stacks."
                  icon="🗂️"
                  action={() => navigate('/collections?create=true')}
                  actionLabel="Create your first stack"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCollections.slice(0, 3).map((collection, index) => (
                    <Link key={collection.id} to={`/collections/${collection.id}`} className="block">
                      <motion.div
                        variants={hoverCard}
                        whileHover={{ y: -4 }}
                        className="bg-paper rounded-lg p-4 border border-line shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-display font-600 mb-1">{collection.name}</h3>
                        <p className="text-xs text-brown">{collection.albumCount ?? 0} albums</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Popular genres */}
          <div variants={fadeInUp} initial="hidden" animate="show">
            <h2 className="text-2xl font-display font-600 mb-6">Popular genres</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {GENRES.map((genre) => (
                <motion.button
                  key={genre.name}
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,112,73,.1)' }}
                  whileTap={{ scale: 0.97 }}
                  className={cx(
                    'py-2 px-4 rounded text-sm font-medium transition-colors',
                    'hover:bg-orange-soft hover:text-orange',
                    'border border-line',
                  )}
                  style={{ background: 'var(--paper)' }}
                >
                  {genre.name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
