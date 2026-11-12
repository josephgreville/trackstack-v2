import { motion } from 'framer-motion';

const ICONS = {
  play: '▶',
  collection: '▤',
  compass: '✦',
  calendar: '▣',
  wishlist: '♡',
  users: '☻',
  book: '✎',
  disc: '◉',
  trophy: '★',
};

export default function AchievementBadge({ achievement, onClick }) {
  const { name, description, icon, xpReward, earned, earnedAt } = achievement;
  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`achievement-badge ${earned ? 'is-earned' : 'is-locked'}`}
      whileHover={{ y: -5, scale: 1.03 }}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      title={description}
      aria-label={`${name}. ${earned ? 'Earned' : 'Locked'}. ${description}`}
    >
      <span className="achievement-medal" aria-hidden="true">
        <span className="achievement-icon">{ICONS[icon] ?? ICONS.trophy}</span>
      </span>
      <span className="achievement-copy">
        <strong>{name}</strong>
        <span className="achievement-desc">{description}</span>
        <span className="achievement-meta">
          {earned
            ? <>Earned {earnedAt ? new Date(earnedAt).toLocaleDateString('en-GB') : ''}</>
            : <>Locked · {xpReward} XP</>}
        </span>
      </span>
    </Tag>
  );
}
