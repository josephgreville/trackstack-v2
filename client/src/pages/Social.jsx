import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socialService } from '../services/index.js';
import ActivityItem from '../components/ActivityItem.jsx';
import FollowButton from '../components/FollowButton.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Social() {
  const { user } = useAuth();
  const [tab, setTab] = useState('global');
  const [activity, setActivity] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      tab === 'global' ? socialService.globalActivity({ limit: 30 }) : socialService.activity({ limit: 30 }),
      socialService.following(user.id),
      socialService.followers(user.id),
    ])
      .then(([activityResult, followingResult, followersResult]) => {
        setActivity(activityResult.activity ?? []);
        setFollowing(followingResult.following ?? []);
        setFollowers(followersResult.followers ?? []);
      })
      .catch((err) => error(err.message ?? 'Could not load the community feed.'))
      .finally(() => setLoading(false));
  }, [tab, user, error]);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading">
          <p className="eyebrow">Collectors you follow</p>
          <h1>Community</h1>
          <p>See what people are listening to and collecting right now.</p>
        </header>

        <div className="social-layout">
          <div className="social-main">
            <div className="range-switcher" role="tablist" aria-label="Feed">
              <motion.button
                type="button"
                role="tab"
                aria-selected={tab === 'global'}
                whileTap={{ scale: 0.96 }}
                className={`range-tab ${tab === 'global' ? 'is-active' : ''}`}
                onClick={() => setTab('global')}
              >
                Everyone
              </motion.button>
              <motion.button
                type="button"
                role="tab"
                aria-selected={tab === 'mine'}
                whileTap={{ scale: 0.96 }}
                className={`range-tab ${tab === 'mine' ? 'is-active' : ''}`}
                onClick={() => setTab('mine')}
              >
                Your activity
              </motion.button>
            </div>

            {loading ? (
              <p role="status">Loading the feed…</p>
            ) : activity.length ? (
              <ul className="activity-list">
                {activity.map((item) => <ActivityItem key={item.id} item={item} />)}
              </ul>
            ) : (
              <div className="activity-empty">
                <h2>Nothing here yet</h2>
                <p>
                  When you or the collectors you follow add albums or log listens, their activity
                  shows up here.
                </p>
                <Button to="/browse">Find some albums</Button>
              </div>
            )}
          </div>

          <aside className="social-side">
            <section className="social-side-card">
              <h2>Following ({following.length})</h2>
              {following.length ? (
                <ul className="social-people">
                  {following.map((person) => (
                    <li key={person.id}>
                      <Link to={`/users/${encodeURIComponent(person.username)}`}>{person.username}</Link>
                      <FollowButton userId={person.id} initialFollowing onChange={load} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-brown">You are not following anyone yet.</p>
              )}
            </section>

            <section className="social-side-card">
              <h2>Followers ({followers.length})</h2>
              {followers.length ? (
                <ul className="social-people">
                  {followers.map((person) => (
                    <li key={person.id}>
                      <Link to={`/users/${encodeURIComponent(person.username)}`}>{person.username}</Link>
                      <FollowButton userId={person.id} onChange={load} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-brown">No followers yet.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
