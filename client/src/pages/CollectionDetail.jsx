import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { formatYear, formatAddedDate, albumHref } from '../utils/format.js';
import { collectionsService, listeningQueueService } from '../services/index.js';
import { parseCsv } from '../utils/csv.js';
import Button from '../components/Button.jsx';

const FORMATS = ['vinyl', 'cassette', 'cd', 'digital', 'other'];
const CONDITIONS = ['mint', 'near_mint', 'very_good', 'good', 'fair', 'poor'];

function StatGroup({ title, values }) {
  const entries = Object.entries(values ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...entries.map(([, count]) => count));
  return <div className="stat-group"><h3>{title}</h3>{entries.length ? entries.map(([label, count]) => (
    <div className="stat-row" key={label}><div className="stat-label"><span>{label}</span><span>{count}</span></div><div className="stat-track"><div style={{ width: `${count / max * 100}%` }} /></div></div>
  )) : <p className="text-brown">No data yet</p>}</div>;
}

export default function CollectionDetail() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const [collection, setCollection] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('added_at');
  const [order, setOrder] = useState('desc');
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [importing, setImporting] = useState(false);
  const [queueingAlbum, setQueueingAlbum] = useState(null);

  const fetchCollection = useCallback(async () => {
    const data = await collectionsService.get(collectionId, { sort, order, q: query });
    setCollection(data.collection);
    setAlbums(data.collection.albums ?? []);
  }, [collectionId, sort, order, query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const statsRequest = collectionsService.stats?.(collectionId)
      .then(({ stats: value }) => setStats(value))
      .catch(() => setStats({ unavailable: true }));
    Promise.all([fetchCollection(), statsRequest])
      .catch((err) => { if (active) error(err.message ?? 'Failed to load collection.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error, fetchCollection, collectionId]);

  const removeAlbum = async (albumId) => {
    try { await collectionsService.removeAlbum(collectionId, albumId); info('Album removed from collection.'); await fetchCollection(); }
    catch (err) { error(err.message ?? 'Failed to remove album from collection.'); }
  };

  const addToQueue = async (album) => {
    setQueueingAlbum(album.id);
    try {
      await listeningQueueService.add(album.id);
      success(`${album.title} added to your listening queue.`);
    } catch (err) { error(err.message ?? 'Could not add this album to your queue.'); }
    finally { setQueueingAlbum(null); }
  };

  const saveMetadata = async (event, album) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const payload = {
      format: fields.get('format') || null,
      condition: fields.get('condition') || null,
      purchaseDate: fields.get('purchaseDate') || null,
      price: fields.get('price') ? Number(fields.get('price')) : null,
      editionNotes: fields.get('editionNotes') || '',
      memoryLocation: fields.get('memoryLocation') || '',
      memoryWith: fields.get('memoryWith') || '',
      memoryNote: fields.get('memoryNote') || '',
    };
    try { await collectionsService.updateAlbum(collectionId, album.id, payload); setEditingAlbum(null); success('Copy details saved.'); await fetchCollection(); }
    catch (err) { error(err.message ?? 'Could not save copy details.'); }
  };

  const setVisibility = async (value) => {
    try {
      const { collection: updated } = await collectionsService.update(collectionId, { isPublic: value });
      setCollection((current) => ({ ...current, ...updated }));
      success(value ? 'Collection is now public.' : 'Collection is now private.');
    } catch (err) { error(err.message ?? 'Could not update sharing settings.'); }
  };

  const copyShareLink = async () => {
    const link = `${window.location.origin}/share/${collection.shareToken}`;
    try { await navigator.clipboard.writeText(link); success('Share link copied.'); }
    catch { window.prompt('Copy this share link', link); }
  };

  const exportCsv = async () => {
    try {
      const blob = await collectionsService.export(collectionId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.name.replace(/[^a-z0-9-_]+/gi, '-') || 'trackstack-collection'}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { error(err.message ?? 'Could not export this collection.'); }
  };

  const importCsv = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const rows = parseCsv(await file.text());
      const items = rows.filter((row) => row.title && row.artist).map((row) => ({
        title: row.title, artist: row.artist,
        ...(row.releaseyear ? { releaseYear: Number(row.releaseyear) } : {}),
        genre: row.genre ?? '', format: row.format || undefined, condition: row.condition || undefined,
        purchaseDate: row.purchasedate || undefined,
        price: row.price ? Number(row.price) : undefined,
        editionNotes: row.editionnotes ?? '',
        memoryLocation: row.memorylocation ?? '', memoryWith: row.memorywith ?? '', memoryNote: row.memorynote ?? '',
      }));
      if (!items.length) throw new Error('That CSV has no album rows with both a title and artist.');
      const result = await collectionsService.importAlbums(collectionId, items);
      success(`Imported ${result.imported} albums; skipped ${result.skipped} duplicates.`);
      await fetchCollection();
      const nextStats = await collectionsService.stats(collectionId);
      setStats(nextStats.stats);
    } catch (err) { error(err.message ?? 'Could not import that CSV file.'); }
    finally { setImporting(false); }
  };

  if (loading) return <section className="page-section container-narrow"><p role="status">Loading collection…</p></section>;
  if (!collection) return <section className="page-section container-narrow"><p>Collection not found.</p></section>;

  return (
    <section className="page-section"><div className="container-narrow">
      <header className="collection-header">
        <p className="eyebrow">Your collection · {collection.albumCount} albums</p>
        <h1>{collection.name}</h1>
        {collection.description && <p className="text-brown">{collection.description}</p>}
        <p className="text-brown collection-date">Created {formatAddedDate(collection.createdAt)}</p>
        <div className="collection-actions">
          <Button onClick={() => navigate(`/collections/${collectionId}/add`)}>Add album to collection</Button>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
          <label className="button-like">{importing ? 'Importing…' : 'Import CSV'}<input type="file" accept=".csv,text/csv" disabled={importing} onChange={(event) => { importCsv(event.target.files?.[0]); event.target.value = ''; }} /></label>
          <label className="collection-public-toggle"><input type="checkbox" checked={collection.isPublic} onChange={(event) => setVisibility(event.target.checked)} /> Public collection</label>
          <Button variant="outline" onClick={copyShareLink}>Copy share link</Button>
        </div>
      </header>

      <section className="stats-panel"><h2>Collection stats</h2>{stats?.unavailable ? <p>Collection stats are unavailable right now.</p> : stats ? <div className="stats-grid">
        <StatGroup title="Formats" values={stats.byFormat} /><StatGroup title="Genres" values={stats.byGenre} />
        <StatGroup title="Decades" values={stats.byDecade} /><StatGroup title="Artists" values={stats.byArtist} />
      </div> : <p>Loading collection stats…</p>}</section>

      <div className="collection-toolbar">
        <label>Search this collection<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Album, artist, genre" /></label>
        <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="added_at">Recently added</option><option value="title">Title</option><option value="artist">Artist</option><option value="release_year">Year</option><option value="genre">Genre</option></select></label>
        <label>Order<select value={order} onChange={(event) => setOrder(event.target.value)}><option value="asc">A to Z / oldest</option><option value="desc">Z to A / newest</option></select></label>
      </div>

      {albums.length ? <div className="collection-album-grid">{albums.map((album) => (
        <article key={album.id} className="collection-album-card">
          <Link to={albumHref(album)} className="collection-album-link"><img src={album.artworkUrl || ''} alt={`${album.title} cover`} /><div className="collection-album-copy"><h2>{album.title}</h2><p>{album.artist} · {formatYear(album.releaseYear) || 'Year unknown'}</p><p>{album.genre || 'Genre unknown'}{album.trackCount ? ` · ${album.trackCount} tracks` : ''}</p></div></Link>
          {(album.format || album.condition || album.purchaseDate || album.price != null) && <p className="copy-summary">{[album.format, album.condition?.replaceAll('_', ' '), album.purchaseDate, album.price != null ? `£${album.price}` : ''].filter(Boolean).join(' · ')}</p>}
          {album.editionNotes && <p className="copy-summary">{album.editionNotes}</p>}
          {editingAlbum === album.id ? <form className="copy-form" onSubmit={(event) => saveMetadata(event, album)}>
            <label>Format<select name="format" defaultValue={album.format ?? ''}><option value="">Not set</option>{FORMATS.map((format) => <option key={format} value={format}>{format}</option>)}</select></label>
            <label>Condition<select name="condition" defaultValue={album.condition ?? ''}><option value="">Not set</option>{CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition.replaceAll('_', ' ')}</option>)}</select></label>
            <label>Purchase date<input type="date" name="purchaseDate" defaultValue={album.purchaseDate?.slice(0,10) ?? ''} /></label>
            <label>Price<input type="number" name="price" step="0.01" min="0" defaultValue={album.price ?? ''} /></label>
            <label>Edition notes<input name="editionNotes" maxLength="500" defaultValue={album.editionNotes ?? ''} /></label>
            <p className="copy-form-subheading">The memory behind this album</p>
            <label>Where did you find it?<input name="memoryLocation" maxLength="200" defaultValue={album.memoryLocation ?? ''} placeholder="A shop, a gig, a trip…" /></label>
            <label>Who were you with?<input name="memoryWith" maxLength="200" defaultValue={album.memoryWith ?? ''} /></label>
            <label>Why does it matter?<textarea name="memoryNote" maxLength="1000" defaultValue={album.memoryNote ?? ''} /></label>
            <div className="copy-form-actions"><Button size="sm" type="submit">Save details</Button><Button size="sm" variant="outline" onClick={() => setEditingAlbum(null)}>Cancel</Button></div>
          </form> : <>
            {(album.memoryLocation || album.memoryWith || album.memoryNote) && <div className="album-memory"><p className="eyebrow">Album memory</p>{album.memoryLocation && <p>Found at {album.memoryLocation}</p>}{album.memoryWith && <p>With {album.memoryWith}</p>}{album.memoryNote && <p>{album.memoryNote}</p>}</div>}
            <div className="collection-card-actions"><Button size="sm" variant="outline" onClick={() => setEditingAlbum(album.id)}>Copy details &amp; memory</Button><Button size="sm" variant="outline" onClick={() => addToQueue(album)} loading={queueingAlbum === album.id}>Add to queue</Button><Button size="sm" variant="danger" onClick={() => { if (window.confirm(`Remove “${album.title}” from this collection?`)) removeAlbum(album.id); }}>Remove</Button></div>
          </>}
        </article>
      ))}</div> : <p className="empty-state">{query ? 'No albums match your search.' : 'No albums in this collection yet. Add an album to get started.'}</p>}
    </div></section>
  );
}
