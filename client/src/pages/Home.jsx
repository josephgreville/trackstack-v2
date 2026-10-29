import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cx } from '../utils/format';
import { GENRES, genreByName } from '../utils/genres';
import { albumsService, catalogService, collectionsService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Button from '../components/Button.jsx';

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
          if (!cancelled) setRecentAlbums(albums ?? []);
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

  return (
    <section className="py-12">
      <div className="container-narrow">
        <header className="mb-12">
          <h1 className="text-3xl font-display font-700 tracking-tighter mb-4">
            Your music. Your collection. Your story.
          </h1>
          <p className="text-lg text-brown max-w-2xl">
            Discover new albums, catalogue your favourites, and build the record collection of your dreams.
          </p>
        </header>

        {/* Search & filters */}
        <div className="bg-paper rounded-lg p-6 mb-12 shadow-sm">
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
        <div className="mb-12">
          <h2 className="text-2xl font-display font-600 mb-6">Featured albums</h2>
          {featuredLoading && <p role="status">Loading featured albums…</p>}
          {featuredError && <p role="alert">{featuredError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAlbums.map((album) => (
              <AlbumCard key={album.externalId} album={album} />
            ))}
          </div>
        </div>

        {/* Recently added */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-600 mb-6">Recently added</h2>
          {recentError && <p role="alert">{recentError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={{ ...album, artworkUrl: album.artworkUrl ?? album.coverArtworks?.[0] }}
              />
            ))}
          </div>
        </div>

        {/* My Collections */}
        {user && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-600">My collections</h2>
              <Button
                to="/collections"
                variant="primary"
                size="sm"
              >
                Create collection
              </Button>
            </div>
            {collectionsLoading && <p role="status">Loading your collections…</p>}
            {collectionsError && <p role="alert">{collectionsError}</p>}
            {myCollections.length === 0 ? (
              !collectionsLoading && !collectionsError && (
                <p className="text-sm text-brown">No collections yet. Create one to get started.</p>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCollections.slice(0, 3).map((collection) => (
                  <div
                    key={collection.id}
                    className="bg-paper rounded-lg p-4 border border-line shadow-sm"
                  >
                    <h3 className="font-display font-600 mb-1">{collection.name}</h3>
                    <p className="text-xs text-brown">{collection.albumCount ?? 0} albums</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular genres */}
        <div>
          <h2 className="text-2xl font-display font-600 mb-6">Popular genres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GENRES.map((genre) => (
              <button
                key={genre.name}
                className={cx(
                  'py-2 px-4 rounded text-sm font-medium transition-colors',
                  'hover:bg-orange-soft hover:text-orange',
                  'border border-line',
                )}
                style={{ background: genre.tone === 'rust' ? '#ffe4e1' : undefined }}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}