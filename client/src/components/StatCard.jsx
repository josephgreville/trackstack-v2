import { motion } from 'framer-motion';
import { listItem } from './motion.jsx';

/**
 * A compact figure card. `Icon` is an icon component (not an emoji) so the
 * whole app shares one consistent set of drawn marks.
 */
export default function StatCard({
  label,
  value,
  hint,
  Icon,
  accent = 'orange',
  progress,
  index = 0,
  onClick,
}) {
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      variants={listItem}
      initial="hidden"
      animate="show"
      whileHover={onClick ? { y: -4, scale: 1.015 } : { y: -2 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`stat-card stat-card-${accent} ${onClick ? 'stat-card-button' : ''}`}
    >
      {Icon && (
        <span className="stat-card-icon" aria-hidden="true">
          <Icon size={17} />
        </span>
      )}
      <span className="stat-card-label">{label}</span>
      <strong className="stat-card-value">{value}</strong>
      {hint && <span className="stat-card-hint">{hint}</span>}
      {typeof progress === 'number' && (
        <span className="stat-card-track" aria-hidden="true">
          <span className="stat-card-fill" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </span>
      )}
    </Tag>
  );
}
