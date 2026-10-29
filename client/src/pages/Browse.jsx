import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import { cx, formatYear, formatAddedDate } from '../utils/format';
import { GENRES, genreByName } from '../utils/genres';
import { api } from '../api/client';
import { collectionsService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Button from '../components/Button.jsx';

export default function Browse() {
  const [params, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { success, error, info } = useToast();
  const [genreOptions, setGenreOptions] = useState(GENRES);

  const [q, setQ] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  // Initialise from URL
  useEffect(() => {
    const searchQ = location.search?.includes('q=') ? new URLSearchParams(location.search).get('q') : '';
    const searchGenre = new URLSearchParams(location.search).get('genre') ?? '';
    setQ(searchQ ?? '');
    setSelectedGenre(searchGenre ?? '');
  }, [location.search]);

  const debouncedQuery = useDebounce(q, 300);

  // Trigger search on debounced query change
  useEffect(() => {
    if (debouncedQuery || selectedGenre) {
      catalogService
        .search({ q: debouncedQuery, genre: selectedGenre, limit: 24 })
        .then(({ results, total }) => {
          if (results.length === 0) {
            info('No albums found. Try a different search term or genre.');
          }
        })
        .catch((err) => {
          error(err.message ?? 'Search failed.');
        });
    }
  }, [debouncedQuery, selectedGenre]);

  const handleSearch = (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[name="q"]');
    const genreSelect = e.target.querySelector('select[name="genre"]');
    if (!input || !genreSelect) return;
    const q = input.value.trim();
    const genre = genreSelect.value;
    setQ(q);
    setSelectedGenre(genre);
    setSearchParams(new URLSearchParams({ q, genre }));
    navigate(`/browse?q=${encodeURIComponent(q)}&genre=${genre}`, { replace: true });
  };

  // Navigate back from detail page
  useEffect(() => {
    const handlePop = () => {
      setQ('');
      setSelectedGenre('');
      setSearchParams(new URLSearchParams());
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  return (
    <section className="py-12">
      <div className="container-narrow">
        <header className="mb-12">
          <h1 className="text-3xl font-display font-700 tracking-tighter mb-4">
            Browse & discover
          </h1>
          <p className="text-lg text-brown max-w-2xl">
            Search albums, filter by genre, and add them to your collections.
          </p>
        </header>

        {/* Search & filters */}
        <div className="bg-paper rounded-lg p-6 mb-12 shadow-sm">
          <SearchBar
            placeholder="Search albums, artists, or keywords"
            onSubmit={handleSearch}
            genreOptions={genreOptions}
            selectedGenre={genreByName(selectedGenre)}
          />
        </div>

        {/* Results grid */}
        <div>
          <h2 className="text-2xl font-display font-600 mb-6">
            {q ? `Results for "${q}"${selectedGenre ? ` · ${selectedGenre}` : ''}` : 'Popular albums'}
          </h2>

          {/* No results state */}
          {q && !selectedGenre && q.trim() && '' && (
            <p className="text-brown text-sm text-muted mb-6">Try adjusting your search or selecting a genre.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Results will be fetched and rendered by the parent or via API */}
            {/* Placeholder cards */}
            {Array.from({ length: 12 }, (_, i) => (
              <ArticleCard key={i} />
            ))}
          </div>

          {/* No results message */}
          {q && selectedGenre && (
            <p className="text-brown text-sm text-muted mt-6">No albums match that genre filter. Try a different genre or search term.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ArticleCard() {
  return (
    <article className="bg-paper rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="aspect-square rounded-t-lg">
        <img
          src="https://via.placeholder.com/400x400/dddde4/786b60?text=Album+art"
          alt="Album artwork"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-display font-600 line-clamp-2 mb-2">Abbey Road</h3>
        <p className="text-sm text-brown mb-3">The Beatles</p>
        <p className="text-xs text-brown-light">
          1970 · Rock
        </p>
      </div>
    </article>
  );
}