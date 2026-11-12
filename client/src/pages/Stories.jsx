import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storiesService } from '../services/index.js';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { IconJournal } from '../components/Icons.jsx';

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPublic, setShowPublic] = useState(false);
  const { error } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    storiesService.listStories({ publicOnly: showPublic })
      .then(({ stories: rows }) => setStories(rows ?? []))
      .catch((err) => error(err.message ?? 'Could not load your stories.'))
      .finally(() => setLoading(false));
  }, [showPublic, error]);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading">
          <p className="eyebrow">Notes on your copies</p>
          <h1>Album stories</h1>
          <p>Where you found it, who you were with, and what it still reminds you of.</p>
        </header>

        <div className="range-switcher" role="tablist" aria-label="Story visibility">
          {[{ key: 'private', label: 'Your stories' }, { key: 'public', label: 'Published' }].map((option) => (
            <motion.button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={showPublic === (option.key === 'public')}
              whileTap={{ scale: 0.96 }}
              className={`range-tab ${showPublic === (option.key === 'public') ? 'is-active' : ''}`}
              onClick={() => setShowPublic(option.key === 'public')}
            >
              {option.label}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <p role="status">Loading your stories…</p>
        ) : stories.length === 0 ? (
          <EmptyState
            title={showPublic ? 'Nothing published yet' : 'No stories yet'}
            description="Open an album in one of your collections and add the memory behind it."
            Icon={IconJournal}
            action={() => { window.location.href = '/collections'; }}
            actionLabel="Go to your collections"
          />
        ) : (
          <ol className="story-timeline">
            {stories.map((story, index) => (
              <motion.li
                key={story.id}
                className="story-entry"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.4) }}
              >
                <span className="story-dot" aria-hidden="true" />
                <div className="story-card">
                  <div className="story-head">
                    {story.album.artworkUrl && (
                      <img src={story.album.artworkUrl} alt={`${story.album.title} cover`} className="story-art" />
                    )}
                    <div>
                      <Link to={`/album/${story.album.id}`} className="story-album-title">
                        {story.album.title}
                      </Link>
                      <p className="story-artist">{story.album.artist}</p>
                    </div>
                  </div>
                  {story.title && <h2 className="story-title">{story.title}</h2>}
                  {story.body && <p className="story-body">{story.body}</p>}
                  <div className="story-meta">
                    {story.location && <span>Found at {story.location}</span>}
                    {story.occurredAt && (
                      <span>{new Date(story.occurredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    )}
                    <span className={story.isPublic ? 'story-public' : 'story-private'}>
                      {story.isPublic ? 'Published' : 'Private'}
                    </span>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        )}

        <div className="story-cta">
          <Button to="/collections">Add a story from a collection</Button>
        </div>
      </div>
    </section>
  );
}
