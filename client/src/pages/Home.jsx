import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { cx, formatAddedDate, formatYear, genreByName, GENRES } from '../utils/format';
import { catalogService, collectionsService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { Button } from '../components/Button.jsx';

export default function Home() {
  const [params, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const { user } = useAuth();

  const debouncedQuery = useDebounce(params.get('q') ?? '', 300);
  const genreFilter = params.get('genre') ?? '';

  // Fetch featured albums on mount
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [recentAlbums, setRecentAlbums] = useState([]);

  useEffect(() => {
    let cancelled = false;

    // Fetch featured albums
    catalogService
      .featured()
      .then(({ results }) => {
        if (!cancelled) setFeaturedAlbums(results ?? []);
      })
      .catch(() => {
        if (!cancelled) setFeaturedAlbums([]);
      });

    // Fetch recently added albums for the current user
    if (user) {
      collectionsService
        .list()
        .then((data) => {
          if (cancelled) return;
          // Get all albums from all collections, sorted by added_at
          const allAlbums = data.collections.flatMap((collection) =>
            collection.albums?.map((album) => ({ ...album, collectionName: collection.name }))
          );
          // Sort by added_at descending and take the most recent 8
          allAlbums.sort(
            (a, b) => new Date(b.addedAt ?? '').getTime() - new Date(a.addedAt ?? '').getTime()
          );
          setRecentAlbums(allAlbums.slice(0, 8));
        })
        .catch(() => {
          if (!cancelled) setRecentAlbums([]);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.querySelector('input[name="q"]').value.trim();
    const genre = e.target.querySelector('select[name="genre"]').value;
    setSearchParams(new URLSearchParams({ q, genre }));
    navigate(`/browse?q=${encodeURIComponent(q)}&genre=${genre}`);
  };

  return (
    <section className="py-12">
      <div className="container-narrow">
        <header className="mb-12">
          <h1 className="text-3xl font-display font-700 tracking-tighter mb-4">
            Your music collection, waiting to happen.
          </h1>
          <p className="text-lg text-brown max-w-2xl">
            Discover new albums, catalogue your favourites, and build the record collection of your dreams.
          </p>
        </header>

        {/* Search & filters */}
        <div className="bg-paper rounded-lg p-6 mb-12 shadow-sm">
          <SearchBar
            placeholder="Search albums, artists, or keywords"
            onSubmit={handleSearch}
            genreOptions={GENRES}
            selectedGenre={genreByName(genreFilter)}
          />
        </div>

        {/* Featured albums section */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-600 mb-6">Featured albums</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAlbums.map((album) => (
              <AlbumCard key={album.externalId} album={album} />
            ))}
          </div>
        </div>

        {/* Recently added */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-600 mb-6">Recently added</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={{ ...album, artworkUrl: album.artworkUrl ?? album.coverArtworks?.[0] }}
              />
            ))}
          </div>
        </div>

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