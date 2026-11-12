import { motion } from 'framer-motion';
import { listItem } from './motion.jsx';

export default function StatCard({
  label,
  value,
  hint,
  icon,
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
      {icon && <span className="stat-card-icon" aria-hidden="true">{icon}</span>}
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
