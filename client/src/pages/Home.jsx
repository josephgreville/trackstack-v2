import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { cx, formatAddedDate, formatYear, genreByName, GENRES } from '../utils/format';
import { api } from '../api/client';
import { catalogService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { Button } from '../components/Button.jsx';

export default function Home() {
  const [params, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const debouncedQuery = useDebounce(params.get('q') ?? '', 300);
  const genreFilter = params.get('genre') ?? '';

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery || genreFilter) {
      const query = debouncedQuery || '';
      catalogService
        .search({ q: query, genre: genreFilter })
        .then(({ results }) => {
          if (results.length === 0) {
            info('No albums found. Try a different search term or genre.');
          }
        })
        .catch((err) => {
          error(err.message ?? 'Search failed.');
        });
    }
  }, [debouncedQuery, genreFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = (e.target.querySelector('input[name="q"]') as HTMLInputElement).value.trim();
    const genre = (e.target.querySelector('select[name="genre"]') as HTMLSelectElement).value;
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
            {/* Featured cards will be populated by the Browse page or could fetch here */}
            {/* Placeholder while we build Browse */}
          </div>
        </div>

        {/* Recently added */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-600 mb-6">Recently added</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Will be populated */}
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