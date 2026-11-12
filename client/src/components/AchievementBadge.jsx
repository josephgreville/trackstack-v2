import { motion } from 'framer-motion';
import {
  IconHeadphones, IconStack, IconCompass, IconCalendar,
  IconTarget, IconPeople, IconJournal, IconDisc, IconMedal,
} from './Icons.jsx';

const BADGE_ICONS = {
  play: IconHeadphones,
  collection: IconStack,
  compass: IconCompass,
  calendar: IconCalendar,
  wishlist: IconTarget,
  users: IconPeople,
  book: IconJournal,
  disc: IconDisc,
  trophy: IconMedal,
};

/**
 * An earned badge reads like a rubber stamp pressed onto the page: slightly
 * rotated, ink-coloured and a little rough around the edges.
 */
export default function AchievementBadge({ achievement, onClick }) {
  const { name, description, icon, xpReward, earned, earnedAt } = achievement;
  const Icon = BADGE_ICONS[icon] ?? IconMedal;
  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`achievement-badge ${earned ? 'is-earned' : 'is-locked'}`}
      whileHover={{ y: -5, rotate: earned ? -1.5 : 0, scale: 1.03 }}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      title={description}
      aria-label={`${name}. ${earned ? 'Earned' : 'Locked'}. ${description}`}
    >
      <span className="achievement-medal" aria-hidden="true">
        <Icon size={20} />
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
