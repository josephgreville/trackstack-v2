import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recommendationsService } from '../services/index.js';
import RecommendationCard from '../components/RecommendationCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { listContainer } from '../components/motion.jsx';
import { GENRES } from '../utils/genres.js';

const KINDS = [
  { key: '', label: 'For you' },
  { key: 'similar', label: 'Similar to yours' },
  { key: 'new_to_you', label: 'New to you' },
];

export default function DiscoverWeekly() {
  const [recommendations, setRecommendations] = useState([]);
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const navigate = useNavigate();
  const { error, success, info } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    recommendationsService
      .list({ kind: kind || undefined, limit: 12 })
      .then(({ recommendations: rows }) => setRecommendations(rows ?? []))
      .catch((err) => error(err.message ?? 'Could not load your recommendations.'))
      .finally(() => setLoading(false));
  }, [kind, error]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { recommendations: rows } = await recommendationsService.discoverWeekly();
      setRecommendations(rows ?? []);
      success('Fresh picks are ready for you.');
    } catch (err) {
      error(err.message ?? 'Could not refresh your recommendations.');
    } finally {
      setRefreshing(false);
    }
  };

  const dismiss = async (recommendation) => {
    await recommendationsService.dismiss(recommendation.id);
    setRecommendations((rows) => rows.filter((row) => row.id !== recommendation.id));
  };

  const search = (value) => {
    const q = value.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (genre) params.set('genre', genre);
    navigate(`/browse${params.size ? `?${params}` : ''}`);
  };

  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading">
          <p className="eyebrow">Search and recommendations</p>
          <h1>Discover</h1>
          <p>Search the whole catalogue, or take a pick built from what you already own.</p>
        </header>

        <div className="discover-search">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={search}
            placeholder="Search albums, artists, or keywords"
            genreOptions={GENRES}
            selectedGenre={genre}
            onGenreChange={setGenre}
          />
          <div className="discover-genre-chips">
            {GENRES.map((item) => (
              <motion.button
                key={item.name}
                type="button"
                whileHover={{ scale: 1.05, rotate: -1.5 }}
                whileTap={{ scale: 0.95 }}
                className={`genre-chip ${genre === item.name ? 'is-active' : ''}`}
                onClick={() => setGenre(genre === item.name ? '' : item.name)}
              >
                {item.name}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="discover-controls">
          <div className="range-switcher" role="tablist" aria-label="Recommendation type">
            {KINDS.map((option) => (
              <motion.button
                key={option.key || 'all'}
                type="button"
                role="tab"
                aria-selected={kind === option.key}
                whileTap={{ scale: 0.96 }}
                className={`range-tab ${kind === option.key ? 'is-active' : ''}`}
                onClick={() => setKind(option.key)}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
          <Button variant="outline" size="sm" loading={refreshing} onClick={refresh}>
            Refresh picks
          </Button>
        </div>

        {loading ? (
          <p role="status">Finding albums for you…</p>
        ) : recommendations.length === 0 ? (
          <div className="discover-empty">
            <h2>Not enough to go on yet</h2>
            <p>
              Add a few albums to a collection and log a listen or two. The more we know about
              your taste, the sharper these picks get.
            </p>
            <Button onClick={refresh} loading={refreshing}>Generate recommendations</Button>
          </div>
        ) : (
          <motion.div className="recommendation-grid" variants={listContainer} initial="hidden" animate="show">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                index={index}
                onDismiss={dismiss}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
