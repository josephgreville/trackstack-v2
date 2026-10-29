import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { catalogService, listeningQueueService } from '../services/index.js';
import { albumHref } from '../utils/format.js';

export default function ListeningQueue() {
  const [queue, setQueue] = useState([]);
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [building, setBuilding] = useState(false);
  const { success, error, info } = useToast();
  const player = usePlayer();
  const refresh = useCallback(() => listeningQueueService.list().then(({ queue: rows }) => setQueue(rows ?? [])), []);

  useEffect(() => { refresh().catch((err) => error(err.message ?? 'Could not load your queue.')).finally(() => setLoading(false)); }, [refresh, error]);

  const build = async (event) => {
    event.preventDefault();
    setBuilding(true);
    try {
      const { queue: rows } = await listeningQueueService.build(genre.trim(), mood);
      setQueue(rows ?? []);
      if (rows?.length) success(`${rows.length} albums shuffled into your queue.`);
      else info('No unlistened albums matched. Add albums to your collection or try another genre.');
    } catch (err) { error(err.message ?? 'Could not build your queue.'); }
    finally { setBuilding(false); }
  };

  const markListened = async (item) => {
    setBusyId(item.queueId);
    try {
      await listeningQueueService.listened(item.queueId);
      setQueue((rows) => rows.filter((row) => row.queueId !== item.queueId));
      success(`${item.title} logged to your listening history.`);
    } catch (err) { error(err.message ?? 'Could not update your queue.'); }
    finally { setBusyId(null); }
  };

  const remove = async (item) => {
    setBusyId(item.queueId);
    try { await listeningQueueService.remove(item.queueId); setQueue((rows) => rows.filter((row) => row.queueId !== item.queueId)); }
    catch (err) { error(err.message ?? 'Could not remove this album.'); }
    finally { setBusyId(null); }
  };

  const playPreview = async (item) => {
    if (!item.externalId) { info('Preview playback is only available for catalogue albums.'); return; }
    setBusyId(item.queueId);
    try {
      const { album } = await catalogService.album(item.externalId);
      const playable = (album.tracks ?? []).filter((track) => track.previewUrl);
      if (!playable.length) { info('No preview is available for this album.'); return; }
      player.playQueue(playable);
    } catch (err) { error(err.message ?? 'Could not load album previews.'); }
    finally { setBusyId(null); }
  };

  return <section className="page-section"><div className="container-narrow">
    <header className="page-heading"><p className="eyebrow">A little nudge toward your next listen</p><h1>Next to listen</h1><p>Build a shuffled queue from albums you own but haven’t logged yet. Preview catalogue tracks in the player, then mark the album listened when you’re done.</p></header>
    <form className="queue-builder" onSubmit={build}>
      <label>Genre, optional<input value={genre} onChange={(event) => setGenre(event.target.value)} maxLength={60} placeholder="e.g. indie rock" /></label>
      <label>Mood, optional<select value={mood} onChange={(event) => setMood(event.target.value)}><option value="">Any mood</option><option value="mellow">Mellow</option><option value="upbeat">Upbeat</option><option value="energetic">High energy</option><option value="reflective">Reflective</option><option value="focus">Focus</option></select></label>
      <Button type="submit" loading={building}>Shuffle unlistened albums</Button>
      <span>Up to 20 albums from your collection</span>
    </form>
    {loading ? <p role="status">Loading your queue…</p> : queue.length ? <div className="queue-list" aria-label="Listening queue">
      {queue.map((item, index) => <article className="queue-item" key={item.queueId}>
        <span className="queue-number">{String(index + 1).padStart(2, '0')}</span>
        <img src={item.artworkUrl || undefined} alt="" />
        <div className="queue-item-copy"><Link to={albumHref(item)}><strong>{item.title}</strong></Link><span>{item.artist}{item.genre ? ` · ${item.genre}` : ''}</span></div>
        <div className="queue-item-actions"><Button size="sm" variant="outline" loading={busyId === item.queueId} onClick={() => playPreview(item)}>Preview</Button><Button size="sm" onClick={() => markListened(item)} loading={busyId === item.queueId}>Listened</Button><Button size="sm" variant="outline" onClick={() => remove(item)} disabled={busyId === item.queueId}>Remove</Button></div>
      </article>)}
    </div> : <div className="queue-empty"><span aria-hidden="true">♫</span><h2>Your next listen is waiting</h2><p>Shuffle albums you haven’t heard yet from your collection. Marking one listened adds it to your journal.</p><Link className="community-link" to="/collections">Browse your collections</Link></div>}
  </div></section>;
}
