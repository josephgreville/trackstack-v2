import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { achievementsService, collectionsService, listeningService, socialService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import XPProgress from '../components/XPProgress.jsx';
import StatCard from '../components/StatCard.jsx';
import AchievementBadge from '../components/AchievementBadge.jsx';
import Button from '../components/Button.jsx';
import { listContainer, listItem } from '../components/motion.jsx';

const PROFILE_LINKS = [
  { to: '/wrapped', label: 'Wrapped', icon: '📊', blurb: 'Your year in music' },
  { to: '/achievements', label: 'Badges', icon: '🏅', blurb: 'XP, levels and milestones' },
  { to: '/stories', label: 'Stories', icon: '📖', blurb: 'Memories behind the records' },
  { to: '/wantlist', label: 'Wantlist', icon: '🎯', blurb: 'Records still to hunt down' },
  { to: '/listening-history', label: 'Journal', icon: '📖', blurb: 'Every listen, rated and reviewed' },
  { to: '/listen-next', label: 'Up next', icon: '🎧', blurb: 'Shuffle something unlistened' },
  { to: '/collection-room', label: 'Room', icon: '🪵', blurb: 'Your shelves, as a record shop' },
  { to: '/notifications', label: 'Alerts', icon: '🔔', blurb: 'Follows, likes and comments' },
];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { error, success } = useToast();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ collections: 0, albums: 0, listens: 0, followers: 0 });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', location: '' });

  const load = useCallback(() => {
    if (!user) return;
    Promise.all([
      achievementsService.me().catch(() => null),
      achievementsService.listAchievements().catch(() => null),
      collectionsService.list().catch(() => null),
      listeningService.insights().catch(() => null),
      socialService.followers(user.id).catch(() => null),
    ]).then(([profileResult, achievementsResult, collectionsResult, insightsResult, followersResult]) => {
      if (profileResult?.profile) {
        setProfile(profileResult.profile);
        setForm({ bio: profileResult.profile.bio ?? '', location: profileResult.profile.location ?? '' });
      }
      setAchievements(achievementsResult?.achievements ?? []);
      setStats({
        collections: collectionsResult?.collections?.length ?? 0,
        albums: (collectionsResult?.collections ?? []).reduce((sum, c) => sum + (c.albumCount ?? 0), 0),
        listens: insightsResult?.insights?.totalListens ?? 0,
        followers: followersResult?.followers?.length ?? 0,
      });
    }).catch((err) => error(err.message ?? 'Could not load your profile.'));
  }, [user, error]);

  useEffect(() => { load(); }, [load]);

  const save = async (event) => {
    event.preventDefault();
    try {
      await achievementsService.updateProfile({ bio: form.bio, location: form.location });
      setEditing(false);
      success('Profile saved.');
      load();
    } catch (err) {
      error(err.message ?? 'Could not save your profile.');
    }
  };

  const togglePublic = async () => {
    try {
      await updateProfile({ profilePublic: !user.profilePublic });
      success(user.profilePublic ? 'Your profile is private.' : 'Your profile is public.');
    } catch (err) {
      error(err.message ?? 'Could not update profile visibility.');
    }
  };

  const earned = achievements.filter((a) => a.earned);

  return (
    <section className="page-section profile-page">
      <div className="container-narrow">
        <motion.header
          className="profile-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        >
          <div className="profile-avatar" aria-hidden="true">
            {(user?.username ?? '?')[0].toUpperCase()}
            <span className="profile-level-badge">LV {profile?.level ?? 1}</span>
          </div>

          <div className="profile-hero-copy">
            <h1>{user?.username}</h1>
            {profile && (
              <XPProgress
                xp={profile.xp}
                level={profile.level}
                xpForNext={profile.xpForNext}
                progress={profile.progress}
              />
            )}
            {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
            {profile?.location && <p className="profile-location">📍 {profile.location}</p>}

            <div className="profile-hero-actions">
              <Button size="sm" variant="outline" onClick={() => setEditing((value) => !value)}>
                {editing ? 'Cancel' : 'Edit profile'}
              </Button>
              <Button size="sm" variant="outline" onClick={togglePublic}>
                {user?.profilePublic ? 'Make private' : 'Make public'}
              </Button>
              {user?.profilePublic && (
                <Link className="btn btn-outline btn-sm" to={`/users/${encodeURIComponent(user.username)}`}>
                  View public profile
                </Link>
              )}
            </div>
          </div>
        </motion.header>

        {editing && (
          <motion.form
            className="profile-edit"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={save}
          >
            <label>
              About you
              <textarea
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                maxLength={500}
                rows={3}
                placeholder="What are you collecting, and why?"
              />
            </label>
            <label>
              Where are you?
              <input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                maxLength={100}
                placeholder="Bristol, UK"
              />
            </label>
            <div className="profile-edit-actions">
              <button type="submit" className="btn btn-primary btn-sm">Save profile</button>
            </div>
          </motion.form>
        )}

        <div className="profile-stats" variants={listContainer} initial="hidden" animate="show">
          <StatCard label="Albums" value={stats.albums} icon="💿" accent="orange" />
          <StatCard label="Stacks" value={stats.collections} icon="📚" accent="coral" />
          <StatCard label="Listens" value={stats.listens} icon="🎧" accent="sage" />
          <StatCard label="Followers" value={stats.followers} icon="👥" accent="gold" />
        </div>

        <section className="profile-links-section">
          <h2 className="text-xl font-display font-600 mb-4">Your TrackStack</h2>
          <div className="profile-link-grid">
            {PROFILE_LINKS.map((link, index) => (
              <motion.div key={link.to} variants={listItem} initial="hidden" animate="show">
                <Link to={link.to} className="profile-link-card">
                  <span className="profile-link-icon" aria-hidden="true">{link.icon}</span>
                  <span className="profile-link-copy">
                    <strong>{link.label}</strong>
                    <span>{link.blurb}</span>
                  </span>
                  <span className="profile-link-arrow" aria-hidden="true">→</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {earned.length > 0 && (
          <section className="profile-badges-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-600">Badges</h2>
              <Link className="profile-link-arrow" to="/achievements">See all →</Link>
            </div>
            <div className="achievement-grid" variants={listContainer} initial="hidden" animate="show">
              {earned.slice(0, 4).map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
