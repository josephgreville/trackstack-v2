import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { wrappedService } from '../services/index.js';
import WrappedCard from '../components/WrappedCard.jsx';
import StatCard from '../components/StatCard.jsx';
import { listContainer } from '../components/motion.jsx';
import { useToast } from '../context/ToastContext.jsx';

const RANGES = [
  { key: 'year', label: 'This year' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

export default function Wrapped() {
  const [range, setRange] = useState('year');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error, success } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    wrappedService.get({ range })
      .then((payload) => setData(payload))
      .catch((err) => error(err.message ?? 'Could not load your recap.'))
      .finally(() => setLoading(false));
  }, [range, error]);

  useEffect(() => { load(); }, [load]);

  const share = async () => {
    const text = data
      ? `My TrackStack Wrapped ${data.label}: ${data.totalListens} listens, top artist ${data.topArtist.name}, ${data.uniqueAlbums} albums.`
      : 'My TrackStack Wrapped';
    try {
      if (navigator.share) await navigator.share({ title: 'TrackStack Wrapped', text });
      else {
        await navigator.clipboard.writeText(text);
        success('Recap copied to your clipboard.');
      }
    } catch {
      // The user dismissed the share sheet — nothing to report.
    }
  };

  if (loading) {
    return (
      <section className="page-section container-narrow">
        <p role="status">Building your recap…</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="page-section container-narrow">
        <p role="alert">Your recap is unavailable right now.</p>
      </section>
    );
  }

  const maxMonth = Math.max(1, ...data.monthly.map((m) => m.listens));

  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading">
          <p className="eyebrow">Your year in music</p>
          <h1>TrackStack Wrapped</h1>
          <p>A look back at everything you have been listening to.</p>
        </header>

        <div className="range-switcher" role="tablist" aria-label="Recap period">
          {RANGES.map((option) => (
            <motion.button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={range === option.key}
              whileTap={{ scale: 0.96 }}
              className={`range-tab ${range === option.key ? 'is-active' : ''}`}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </motion.button>
          ))}
        </div>

        <div className="wrapped-grid">
          <WrappedCard
            title={`${data.label}`}
            subtitle={`${data.totalListens} ${data.totalListens === 1 ? 'listen' : 'listens'} across ${data.uniqueAlbums} ${data.uniqueAlbums === 1 ? 'album' : 'albums'}`}
            variant="hero"
            shareLabel="Share your recap"
            onShare={share}
          >
            <div className="wrapped-hero-stats">
              <div><strong>{data.totalListens}</strong><span>Listens</span></div>
              <div><strong>{data.uniqueAlbums}</strong><span>Albums</span></div>
              <div><strong>{data.totalMinutes}</strong><span>Minutes</span></div>
            </div>
          </WrappedCard>

          <WrappedCard title="Your top artist" variant="accent">
            <div className="wrapped-feature">
              <strong className="wrapped-feature-name">{data.topArtist.name}</strong>
              <span className="wrapped-feature-count">{data.topArtist.listens} listens</span>
            </div>
          </WrappedCard>

          <WrappedCard title="Your top album" variant="album">
            {data.topAlbum.artworkUrl && (
              <img src={data.topAlbum.artworkUrl} alt={`${data.topAlbum.title} cover`} className="wrapped-album-art" />
            )}
            <div className="wrapped-feature">
              <strong className="wrapped-feature-name">{data.topAlbum.title}</strong>
              <span className="wrapped-feature-count">{data.topAlbum.artist} · {data.topAlbum.listens} plays</span>
            </div>
          </WrappedCard>

          <WrappedCard title="Your top genre" variant="genre">
            <div className="wrapped-feature">
              <strong className="wrapped-feature-name">{data.topGenre.name}</strong>
              <span className="wrapped-feature-count">{data.topGenre.listens} listens</span>
            </div>
          </WrappedCard>

          <WrappedCard title="Top artists" variant="list">
            <ol className="wrapped-list">
              {data.topArtists.map((artist, index) => (
                <li key={artist.name}>
                  <span className="wrapped-rank">{index + 1}</span>
                  <span className="wrapped-list-name">{artist.name}</span>
                  <strong>{artist.listens}</strong>
                </li>
              ))}
              {!data.topArtists.length && <li className="wrapped-empty">Log a listen to see your top artists.</li>}
            </ol>
          </WrappedCard>

          <WrappedCard title="Top albums" variant="list">
            <ol className="wrapped-list">
              {data.topAlbums.map((album, index) => (
                <li key={album.id}>
                  <span className="wrapped-rank">{index + 1}</span>
                  {album.artworkUrl && <img src={album.artworkUrl} alt="" className="wrapped-list-art" />}
                  <span className="wrapped-list-name">{album.title}</span>
                  <strong>{album.listens}</strong>
                </li>
              ))}
              {!data.topAlbums.length && <li className="wrapped-empty">No album listens in this period yet.</li>}
            </ol>
          </WrappedCard>

          {data.monthly.length > 0 && (
            <WrappedCard title="Listening by month" variant="chart">
              <div className="wrapped-chart">
                {data.monthly.map((month) => (
                  <div className="wrapped-chart-col" key={month.month}>
                    <motion.span
                      className="wrapped-chart-bar"
                      initial={{ height: 0 }}
                      animate={{ height: `${(month.listens / maxMonth) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                      title={`${month.month}: ${month.listens} listens`}
                    />
                    <span className="wrapped-chart-label">{month.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </WrappedCard>
          )}

          {(data.genres?.length || data.decades?.length || data.formats?.length) && (
            <WrappedCard title="Your sound" variant="stats">
              <div className="wrapped-stats" variants={listContainer} initial="hidden" animate="show">
                {data.topGenres.slice(0, 5).map((genre) => (
                  <StatCard key={genre.name} label={genre.name} value={genre.listens} accent="coral" />
                ))}
                {data.decades.slice(0, 3).map((decade) => (
                  <StatCard key={decade.decade} label={decade.decade} value={decade.listens} accent="sage" />
                ))}
                {data.formats.slice(0, 3).map((format) => (
                  <StatCard key={format.name} label={format.name} value={format.listens} accent="gold" />
                ))}
              </div>
            </WrappedCard>
          )}
        </div>
      </div>
    </section>
  );
}
