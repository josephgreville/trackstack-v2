import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useRouteMatch } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { cx, formatYear } from '../../utils/format';
import { GENRES, genreByName } from '../../utils/genres';
import { catalogService, collectionsService } from '../../services/index';
import Button from '../../components/Button.jsx';
import SearchBar from '../../components/SearchBar.jsx';

export default function AddAlbum() {
  const { id: collectionId } = useRouteMatch('/collections/:id')?.params ?? {};
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [manualForm, setManualForm] = useState({
    title: '',
    artist: '',
    releaseYear: '',
    genre: '',
    artworkUrl: '',
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [usingManual, setUsingManual] = useState(false);
  const [collectionName, setCollectionName] = useState('');

  // Fetch collection name if we have a collection ID
  useEffect(() => {
    if (collectionId) {
      collectionsService
        .list()
        .then((data) => {
          const coll = data.collections.find((c) => c.id === collectionId);
          if (coll) setCollectionName(coll.name);
        })
        .catch(() => {});
    }
  }, [collectionId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const results = await catalogService.search({ q: query, genre: '' });
      setSearchResults(results.results ?? []);
      if (results.results.length === 0) {
        info('No albums found. Try a different search term or genre.');
      }
    } catch (err) {
      error('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const addFromSearch = async (album) => {
    if (!collectionId) {
      error('You must select a collection first.');
      return;
    }
    setSearchLoading(true);
    try {
      await collectionsService.addAlbum(collectionId, { externalId: album.externalId });
      success('Album added to collection!');
      setSearchResults([]);
      setQuery('');
      navigate(`/collections/${collectionId}`, { replace: true });
    } catch (err) {
      error(err.message ?? 'Failed to add album.');
    } finally {
      setSearchLoading(false);
    }
  };

  const addManual = async (e) => {
    e.preventDefault();
    if (!collectionId) {
      error('You must select a collection first.');
      return;
    }
    setSearchLoading(true);
    try {
      await collectionsService.addAlbum(collectionId, { manual: manualForm });
      success('Album added to collection manually!');
      setManualForm({
        title: '',
        artist: '',
        releaseYear: '',
        genre: '',
        artworkUrl: '',
      });
      navigate(`/collections/${collectionId}`, { replace: true });
    } catch (err) {
      error(err.message ?? 'Failed to add album.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <section className="py-12">
      <div className="container-narrow">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-700 tracking-tighter mb-4">
            Add album
          </h1>
          {collectionId && <p className="text-brown-line">{collectionName || 'Select a collection'}</p>}
        </header>

        {/* Search form */}
        <div className="bg-paper rounded-lg p-6 mb-12 shadow-sm">
          <SearchBar
            placeholder="Search albums, artists, or keywords"
            onSubmit={handleSearch}
            genreOptions={GENRES}
            selectedGenre={null}
          />
          <div className="mt-4">
            <button
              className={cx('py-2 px-4 rounded text-sm font-medium transition-colors', 'hover:bg-orange-soft hover:text-orange', 'border border-line')}
              onClick={() => setUsingManual(false)}
              disabled={searchLoading}
              type="button"
            >
              Search iTunes
            </button>
            <button
              className={cx('py-2 px-4 rounded text-sm font-medium transition-colors', 'hover:bg-orange-soft hover:text-orange', 'border border-line', 'margin-l-2')}
              onClick={() => setUsingManual(true)}
              disabled={searchLoading}
              type="button"
            >
              Manual entry
            </button>
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && !usingManual && (
          <div className="mb-12">
            <h2 className="text-xl font-display font-600 mb-4">Search results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((album) => (
                <article
                  key={album.externalId}
                  className="bg-paper rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={album.artworkUrl || 'https://via.placeholder.com/200x200/dddde4/786b60'}
                    alt={album.title}
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                  <h3 className="font-display font-600 line-clamp-1">{album.title}</h3>
                  <p className="text-xs text-brown-light">{album.artist}</p>
                  <p className="text-xs text-brown-light">
                    {formatYear(album.releaseYear)} · {album.genre || '—'}
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => addFromSearch(album)}
                  >
                    Add to collection
                  </Button>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Manual form */}
        {usingManual && (
          <form onSubmit={addManual} className="bg-paper rounded-lg p-6 mb-12 shadow-sm">
            <h2 className="text-xl font-display font-600 mb-6">Add album manually</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-brown mb-2">Album title</label>
                <input
                  type="text"
                  name="title"
                  value={manualForm.title}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  className="w-full rounded border line p-3"
                />
              </div>
              <div>
                <label className="block text-sm text-brown mb-2">Artist</label>
                <input
                  type="text"
                  name="artist"
                  value={manualForm.artist}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, artist: e.target.value }))
                  }
                  required
                  className="w-full rounded border line p-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm text-brown mb-2">Release year</label>
                <input
                  type="number"
                  name="releaseYear"
                  value={manualForm.releaseYear}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, releaseYear: e.target.value }))
                  }
                  min={1000}
                  max={2100}
                  className="w-full rounded border line p-3"
                />
              </div>
              <div>
                <label className="block text-sm text-brown mb-2">Genre</label>
                <select
                  name="genre"
                  value={manualForm.genre}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, genre: e.target.value }))
                  }
                  className="w-full rounded border line p-3"
                >
                  <option value="">Select genre</option>
                  {GENRES.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-brown mb-2">Artwork URL (optional)</label>
              <input
                type="text"
                name="artworkUrl"
                value={manualForm.artworkUrl}
                onChange={(e) =>
                  setManualForm((prev) => ({ ...prev, artworkUrl: e.target.value }))
                }
                className="w-full rounded border line p-3"
                placeholder="https://example.com/artwork.jpg"
              />
            </div>

            <Button type="submit" className="w-full">
              Add album
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}