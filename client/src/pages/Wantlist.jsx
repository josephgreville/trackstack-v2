import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { albumHref } from '../utils/format.js';
import { collectionsService, wantlistService } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';

export default function Wantlist() {
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acquiringId, setAcquiringId] = useState(null);
  const { error, success } = useToast();
  useEffect(() => {
    Promise.all([wantlistService.list(), collectionsService.list()])
      .then(([{ items: result }, { collections: owned }]) => { setItems(result ?? []); setCollections(owned ?? []); })
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
      const update = {
        preferredEdition: values.get('edition'), notes: values.get('notes'),
        maxPrice: values.get('maxPrice') === '' ? null : Number(values.get('maxPrice')),
      };
      await wantlistService.update(id, update);
      setItems((list) => list.map((item) => item.id === id ? { ...item, ...update } : item));
      success('Wantlist notes saved.');
    } catch (err) { error(err.message ?? 'Could not save wantlist notes.'); }
  };
  const acquire = async (event, item) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setAcquiringId(item.id);
    try {
      const payload = {
        collectionId: values.get('collectionId'), format: values.get('format') || undefined,
        purchaseDate: values.get('purchaseDate') || undefined,
        price: values.get('price') === '' ? undefined : Number(values.get('price')),
      };
      await wantlistService.acquire(item.id, payload);
      setItems((list) => list.filter((entry) => entry.id !== item.id));
      success(`${item.title} moved into your collection.`);
    } catch (err) { error(err.message ?? 'Could not move this album into your collection.'); }
    finally { setAcquiringId(null); }
  };
  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading"><p className="eyebrow">For the next record hunt</p><h1>Wantlist</h1><p>Keep a note of the records you’re looking for.</p></header>
        {loading ? <p role="status">Loading your wantlist…</p> : items.length ? (
          <div className="catalog-grid">{items.map((item) => (
            <article key={item.id} className="feature-card">
              <Link to={albumHref(item)}><img src={item.artworkUrl || undefined} alt={`${item.title} cover`} /><h2>{item.title}</h2><p>{item.artist}</p></Link>
              <div className="wantlist-price-target">{item.maxPrice != null ? <>Target price <strong>£{item.maxPrice.toFixed(2)}</strong></> : 'No price target set'}</div>
              <form className="wantlist-notes" onSubmit={(event) => { event.preventDefault(); saveNotes(item.id, event.currentTarget); }}>
                <label>Preferred edition<input name="edition" defaultValue={item.preferredEdition} maxLength={300} /></label>
                <label>My price limit (£)<input name="maxPrice" type="number" min="0" step="0.01" defaultValue={item.maxPrice ?? ''} placeholder="No limit" /></label>
                <label>Notes<textarea name="notes" defaultValue={item.notes} maxLength={500} /></label>
                <Button size="sm" type="submit">Save notes</Button>
              </form>
              <details className="wantlist-acquire"><summary>Found this album</summary>
                {collections.length ? <form onSubmit={(event) => acquire(event, item)}>
                  <label>Add to collection<select name="collectionId" required defaultValue=""><option value="" disabled>Choose a collection</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label>
                  <label>Format<select name="format" defaultValue=""><option value="">Not set</option><option value="vinyl">Vinyl</option><option value="cassette">Cassette</option><option value="cd">CD</option><option value="digital">Digital</option><option value="other">Other</option></select></label>
                  <label>Purchase date<input type="date" name="purchaseDate" /></label>
                  <label>Price paid (£)<input type="number" name="price" min="0" step="0.01" defaultValue={item.maxPrice ?? ''} /></label>
                  <Button size="sm" type="submit" loading={acquiringId === item.id}>Move into collection</Button>
                </form> : <p>Create a collection before moving this album.</p>}
              </details>
              <Button variant="outline" size="sm" onClick={() => remove(item.id)}>Remove</Button>
            </article>
          ))}</div>
        ) : <p className="empty-state">Your wantlist is empty. Add an album from Browse or its detail page.</p>}
      </div>
    </section>
  );
}
