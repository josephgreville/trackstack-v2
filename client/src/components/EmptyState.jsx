/* Illustrated empty states with a gentle entrance animation. */
import { motion } from 'framer-motion';
import { fadeInUp } from './motion.jsx';

export default function EmptyState({
  title,
  description,
  icon = '♫',
  action,
  actionLabel,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={[
        'flex flex-col items-center justify-center py-20 px-6',
        'rounded-xl border-2 border-dashed border-line bg-paper-deep',
        className,
      ].filter(Boolean).join(' ')}
      role="status"
      aria-label={title}
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-orange-soft mb-4 text-orange">
        <span className="text-3xl" aria-hidden="true">{icon}</span>
      </div>
      <h3 className="text-lg font-display font-600 mb-2 text-charcoal">{title}</h3>
      <p className="text-brown text-center max-w-sm mb-6">{description}</p>
      {action && actionLabel && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={action}
          className="btn btn-primary"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
