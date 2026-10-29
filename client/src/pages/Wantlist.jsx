import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { albumHref } from '../utils/format.js';
import { wantlistService } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';

export default function Wantlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, success } = useToast();
  useEffect(() => {
    wantlistService.list().then(({ items: result }) => setItems(result ?? []))
      .catch((err) => error(err.message ?? 'Could not load your wantlist.'))
      .finally(() => setLoading(false));
  }, [error]);
  const remove = async (id) => {
    try { await wantlistService.remove(id); setItems((list) => list.filter((item) => item.id !== id)); success('Removed from your wantlist.'); }
    catch (err) { error(err.message ?? 'Could not remove this album.'); }
  };
  const saveNotes = async (id, form) => {
    const values = new FormData(form);
    try {
      const update = { preferredEdition: values.get('edition'), notes: values.get('notes') };
      await wantlistService.update(id, update);
      setItems((list) => list.map((item) => item.id === id ? { ...item, preferredEdition: update.preferredEdition, notes: update.notes } : item));
      success('Wantlist notes saved.');
    } catch (err) { error(err.message ?? 'Could not save wantlist notes.'); }
  };
  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading"><p className="eyebrow">For the next record hunt</p><h1>Wantlist</h1><p>Keep a note of the records you’re looking for.</p></header>
        {loading ? <p role="status">Loading your wantlist…</p> : items.length ? (
          <div className="catalog-grid">{items.map((item) => (
            <article key={item.id} className="feature-card">
              <Link to={albumHref(item)}><img src={item.artworkUrl || undefined} alt={`${item.title} cover`} /><h2>{item.title}</h2><p>{item.artist}</p></Link>
              <form className="wantlist-notes" onSubmit={(event) => { event.preventDefault(); saveNotes(item.id, event.currentTarget); }}>
                <label>Preferred edition<input name="edition" defaultValue={item.preferredEdition} maxLength={300} /></label>
                <label>Notes<textarea name="notes" defaultValue={item.notes} maxLength={500} /></label>
                <Button size="sm" type="submit">Save notes</Button>
              </form>
              <Button variant="outline" size="sm" onClick={() => remove(item.id)}>Remove</Button>
            </article>
          ))}</div>
        ) : <p className="empty-state">Your wantlist is empty. Add an album from Browse or its detail page.</p>}
      </div>
    </section>
  );
}
