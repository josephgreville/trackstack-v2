import { motion } from 'framer-motion';

/** Horizontal XP bar showing progress to the next collector level. */
export default function XPProgress({ xp = 0, level = 1, xpForNext = 100, progress = 0, compact = false }) {
  return (
    <div className={`xp-progress ${compact ? 'xp-progress-compact' : ''}`}>
      <div className="xp-level-row">
        <span className="xp-level-badge" aria-hidden="true">LV {level}</span>
        {!compact && (
          <span className="xp-labels">
            <strong>{xp.toLocaleString()} XP</strong>
            <span>{xpForNext.toLocaleString()} XP to level {level + 1}</span>
          </span>
        )}
      </div>
      <div
        className="xp-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${level}, ${progress}% to level ${level + 1}`}
      >
        <motion.span
          className="xp-fill"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
    </div>
  );
}
