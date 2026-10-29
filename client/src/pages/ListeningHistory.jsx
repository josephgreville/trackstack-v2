import { useEffect, useState } from 'react';
import { listeningService } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';

export default function ListeningHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, success } = useToast();
  useEffect(() => {
    listeningService.list().then(({ history: result }) => setHistory(result ?? []))
      .catch((err) => error(err.message ?? 'Could not load your listening history.'))
      .finally(() => setLoading(false));
  }, [error]);
  const saveReview = async (entry, form) => {
    const data = new FormData(form);
    try {
      await listeningService.review(entry.historyId, { rating: Number(data.get('rating')) || null, review: data.get('review') || null });
      setHistory((items) => items.map((item) => item.historyId === entry.historyId ? { ...item, rating: Number(data.get('rating')) || null, review: data.get('review') || null } : item));
      success('Listening note saved.');
    } catch (err) { error(err.message ?? 'Could not save your note.'); }
  };
  return (
    <section className="page-section"><div className="container-narrow">
      <header className="page-heading"><p className="eyebrow">Your listening journal</p><h1>Listening history</h1><p>Keep a record of what you’ve played and what you thought.</p></header>
      {loading ? <p role="status">Loading your listening history…</p> : history.length ? (
        <div className="history-list">{history.map((entry) => (
          <article className="history-entry" key={entry.historyId}>
            <img src={entry.artworkUrl || undefined} alt={`${entry.title} cover`} />
            <div className="history-copy"><h2>{entry.title}</h2><p>{entry.artist} · {new Date(entry.listenedAt).toLocaleDateString()}</p>
              <form onSubmit={(event) => { event.preventDefault(); saveReview(entry, event.currentTarget); }}>
                <label>Rating <select name="rating" defaultValue={entry.rating ?? ''}><option value="">No rating</option>{[1,2,3,4,5].map((rating) => <option key={rating}>{rating}</option>)}</select></label>
                <label className="history-review">Review <input name="review" defaultValue={entry.review ?? ''} maxLength={1000} /></label>
                <Button type="submit" size="sm">Save note</Button>
              </form>
            </div>
          </article>
        ))}</div>
      ) : <p className="empty-state">Nothing logged yet. Use “Log listen” on an album page to start your journal.</p>}
    </div></section>
  );
}
