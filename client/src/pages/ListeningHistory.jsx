import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { listeningService } from '../services/index.js';

function ListeningInsights({ insights }) {
  return <section className="listening-insights" aria-label="Listening insights">
    <article><span>Listens logged</span><strong>{insights.totalListens}</strong></article>
    <article><span>Listening streak</span><strong>{insights.streakDays} <small>{insights.streakDays === 1 ? 'day' : 'days'}</small></strong></article>
    <article><span>Still waiting in your collection</span><strong>{insights.unplayedCount}</strong><Link to="/listen-next">Build a queue</Link></article>
    <div className="listening-top-artists">
      <h2>Artists in rotation</h2>
      {insights.topArtists?.length
        ? <ol>{insights.topArtists.map((item) => <li key={item.artist}><span>{item.artist}</span><strong>{item.listens}</strong></li>)}</ol>
        : <p>Log a listen to start seeing your favourites.</p>}
    </div>
    {insights.unplayedSamples?.length > 0 && <div className="listening-unplayed">
      <h2>Waiting for a first listen</h2>
      <p>{insights.unplayedSamples.map((item) => item.title).join(' · ')}{insights.unplayedCount > insights.unplayedSamples.length ? ` · and ${insights.unplayedCount - insights.unplayedSamples.length} more` : ''}</p>
    </div>}
  </section>;
}

export default function ListeningHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const { error, success } = useToast();

  useEffect(() => {
    Promise.allSettled([listeningService.list(), listeningService.insights()]).then(([historyResult, insightsResult]) => {
      if (historyResult.status === 'fulfilled') setHistory(historyResult.value.history ?? []);
      else error(historyResult.reason.message ?? 'Could not load your listening history.');
      if (insightsResult.status === 'fulfilled') setInsights(insightsResult.value.insights);
    }).finally(() => setLoading(false));
  }, [error]);

  const saveReview = async (entry, form) => {
    const data = new FormData(form);
    const update = { rating: Number(data.get('rating')) || null, review: data.get('review') || null };
    try {
      await listeningService.review(entry.historyId, update);
      setHistory((items) => items.map((item) => item.historyId === entry.historyId ? { ...item, ...update } : item));
      success('Listening note saved.');
    } catch (err) { error(err.message ?? 'Could not save your note.'); }
  };

  return <section className="page-section"><div className="container-narrow">
    <header className="page-heading"><p className="eyebrow">Your listening journal</p><h1>Listening history</h1><p>Keep a record of what you’ve played and what you thought.</p></header>
    {!loading && insights && <ListeningInsights insights={insights} />}
    {loading ? <p role="status">Loading your listening history…</p> : history.length ? (
      <div className="history-list">{history.map((entry) => <article className="history-entry" key={entry.historyId}>
        <img src={entry.artworkUrl || undefined} alt={`${entry.title} cover`} />
        <div className="history-copy"><h2>{entry.title}</h2><p>{entry.artist} · {new Date(entry.listenedAt).toLocaleDateString()}</p>
          <form onSubmit={(event) => { event.preventDefault(); saveReview(entry, event.currentTarget); }}>
            <label>Rating <select name="rating" defaultValue={entry.rating ?? ''}><option value="">No rating</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating}>{rating}</option>)}</select></label>
            <label className="history-review">Review <input name="review" defaultValue={entry.review ?? ''} maxLength={1000} /></label>
            <Button type="submit" size="sm">Save note</Button>
          </form>
        </div>
      </article>)}</div>
    ) : <p className="empty-state">Nothing logged yet. Use “Log listen” on an album page to start your journal.</p>}
  </div></section>;
}
