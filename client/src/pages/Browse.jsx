import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import { GENRES, genreByName } from '../utils/genres';
import { catalogService } from '../services/index';
import AlbumCard from '../components/AlbumCard.jsx';
import SearchBar from '../components/SearchBar.jsx';

export default function Browse() {
  const [params, setSearchParams] = useSearchParams();
  const { error } = useToast();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [selectedGenre, setSelectedGenre] = useState(params.get('genre') ?? '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(q, 300);

  useEffect(() => {
    setQ(params.get('q') ?? '');
    setSelectedGenre(params.get('genre') ?? '');
  }, [params]);

  useEffect(() => {
    let active = true;
    if (!debouncedQuery.trim() && !selectedGenre) {
      setResults([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    catalogService
      .search({ q: debouncedQuery, genre: selectedGenre, limit: 24 })
      .then(({ results: albums }) => {
        if (active) setResults(albums ?? []);
      })
      .catch((err) => {
        if (active) {
          setResults([]);
          error(err.message ?? 'Search failed.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, selectedGenre, error]);

  const handleSearch = (value) => {
    const nextQuery = value.trim();
    setQ(nextQuery);
    const next = new URLSearchParams();
    if (nextQuery) next.set('q', nextQuery);
    if (selectedGenre) next.set('genre', selectedGenre);
    setSearchParams(next, { replace: true });
  };

  const handleGenreChange = (genre) => {
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    if (genre) next.set('genre', genre);
    setSearchParams(next, { replace: true });
  };

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
            value={q}
            onChange={setQ}
            placeholder="Search albums, artists, or keywords"
            onSubmit={handleSearch}
            genreOptions={GENRES}
            selectedGenre={genreByName(selectedGenre)?.name ?? ''}
            onGenreChange={handleGenreChange}
          />
        </div>

        {/* Results grid */}
        <div>
          <h2 className="text-2xl font-display font-600 mb-6">
            {q ? `Results for "${q}"${selectedGenre ? ` · ${selectedGenre}` : ''}` : selectedGenre || 'Popular albums'}
          </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((album) => <AlbumCard key={album.externalId} album={album} />)}
            </div>
            {loading && <p role="status" className="mt-6">Searching albums…</p>}
            {!loading && (q.trim() || selectedGenre) && results.length === 0 && (
              <p className="text-brown text-sm text-muted mt-6">No albums match your search. Try a different term or genre.</p>
            )}
          </div>
      </div>
    </section>
  );
}