import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { achievementsService } from '../services/index.js';
import AchievementBadge from '../components/AchievementBadge.jsx';
import XPProgress from '../components/XPProgress.jsx';
import StatCard from '../components/StatCard.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { listContainer } from '../components/motion.jsx';

export default function Achievements() {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const { error, success, info } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([achievementsService.me(), achievementsService.listAchievements()])
      .then(([profileResult, achievementsResult]) => {
        setProfile(profileResult.profile);
        setAchievements(achievementsResult.achievements ?? []);
      })
      .catch((err) => error(err.message ?? 'Could not load your achievements.'))
      .finally(() => setLoading(false));
  }, [error]);

  useEffect(() => { load(); }, [load]);

  const check = async () => {
    setChecking(true);
    try {
      const { earned } = await achievementsService.checkAchievements();
      if (earned.length) {
        success(`You unlocked ${earned.length} new badge${earned.length === 1 ? '' : 's'}!`);
        load();
      } else {
        info('No new badges yet — keep collecting and listening.');
      }
    } catch (err) {
      error(err.message ?? 'Could not check your achievements.');
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return <section className="page-section container-narrow"><p role="status">Loading your badges…</p></section>;
  }

  const earned = achievements.filter((achievement) => achievement.earned);
  const locked = achievements.filter((achievement) => !achievement.earned);

  return (
    <section className="page-section">
      <div className="container-narrow">
        <header className="page-heading">
          <p className="eyebrow">Your collector card</p>
          <h1>Achievements</h1>
          <p>Every listen and every record moves you forward.</p>
        </header>

        {profile && (
          <div className="achievement-profile">
            <div className="achievement-profile-head">
              <span className="achievement-level" aria-hidden="true">{profile.level}</span>
              <div>
                <h2>{profile.username}</h2>
                <XPProgress
                  xp={profile.xp}
                  level={profile.level}
                  xpForNext={profile.xpForNext}
                  progress={profile.progress}
                />
              </div>
            </div>
            <div className="achievement-stats" variants={listContainer} initial="hidden" animate="show">
              <StatCard label="Total XP" value={profile.xp.toLocaleString()} icon="✦" accent="orange" />
              <StatCard label="Badges earned" value={`${earned.length}/${achievements.length}`} icon="★" accent="gold" />
              <StatCard label="Collector level" value={profile.level} icon="◈" accent="coral" />
            </div>
          </div>
        )}

        <div className="achievement-actions">
          <Button variant="outline" loading={checking} onClick={check}>Check for new badges</Button>
        </div>

        <section className="achievement-section">
          <h2 className="text-xl font-display font-600 mb-4">Unlocked</h2>
          {earned.length ? (
            <div className="achievement-grid" variants={listContainer} initial="hidden" animate="show">
              {earned.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          ) : (
            <p className="empty-state">No badges yet. Log a listen to unlock your first one.</p>
          )}
        </section>

        <section className="achievement-section">
          <h2 className="text-xl font-display font-600 mb-4">Still to unlock</h2>
          <div className="achievement-grid" variants={listContainer} initial="hidden" animate="show">
            {locked.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
